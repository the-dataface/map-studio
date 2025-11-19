/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, react-hooks/rules-of-hooks */
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DataInput } from '@/components/data-input';
import { GeocodingSection } from '@/components/geocoding-section';
import { DataPreview } from '@/components/data-preview';
import { DimensionMapping } from '@/components/dimension-mapping';
import { MapPreview } from '@/components/map-preview';
import { MapStyling } from '@/components/map-styling';
import { MapProjectionSelection } from '@/components/map-projection-selection';
import { FloatingActionButtons } from '@/components/floating-action-buttons';
import React from 'react';
import type {
	ColumnFormat,
	ColumnType,
	DataRow,
	DataState,
	DimensionSettings,
	GeocodedRow,
	GeographyKey,
	MapType,
	ProjectionType,
	StylingSettings,
} from './types';
import { emptyDataState, useStudioStore } from '@/state/studio-store';
import { inferGeographyAndProjection } from '@/modules/data-ingest/inference';
import { resolveActiveMapType } from '@/modules/data-ingest/map-type';
import {
	inferColumnTypesFromData,
	mergeInferredTypes,
	resetDimensionForMapType,
} from '@/modules/data-ingest/dimension-schema';

export default function MapStudio() {
	const {
		symbolData,
		setSymbolData,
		choroplethData,
		setChoroplethData,
		customData,
		setCustomData,
		isGeocoding,
		setIsGeocoding,
		activeMapType,
		setActiveMapType,
		selectedGeography,
		setSelectedGeography,
		selectedProjection,
		setSelectedProjection,
		clipToCountry,
		setClipToCountry,
		columnTypes,
		setColumnTypes,
		columnFormats,
		setColumnFormats,
		dimensionSettings,
		setDimensionSettings,
		stylingSettings,
		setStylingSettings,
		} = useStudioStore();

	const [dataInputExpanded, setDataInputExpanded] = useState(true);
	const [showGeocoding, setShowGeocoding] = useState(false);
	const [geocodingExpanded, setGeocodingExpanded] = useState(true);
	const [projectionExpanded, setProjectionExpanded] = useState(true);
	const [dataPreviewExpanded, setDataPreviewExpanded] = useState(true);
	const [dimensionMappingExpanded, setDimensionMappingExpanded] = useState(true);
	const [mapStylingExpanded, setMapStylingExpanded] = useState(true);
	const [mapPreviewExpanded, setMapPreviewExpanded] = useState(true);
	const [mapInView, setMapInView] = useState(false);

	// Map Projection and Geography states
	// Helpers to keep component API aligned with legacy props
	const updateDimensionSettings = (newSettings: Pick<DimensionSettings, 'symbol' | 'choropleth'>) => {
		setDimensionSettings((prev) => ({
			...prev,
			symbol: newSettings.symbol,
			choropleth: newSettings.choropleth,
		}));
	};

	const updateStylingSettings = (newSettings: StylingSettings) => {
		setStylingSettings(newSettings);
	};

	const updateColumnTypes = (newTypes: ColumnType) => {
		setColumnTypes(newTypes);
	};

	const updateColumnFormats = (newFormats: ColumnFormat) => {
		setColumnFormats(newFormats);
	};

	// NEW: Function to update selectedGeography in both places
	const updateSelectedGeography = (newGeography: GeographyKey) => {
		setSelectedGeography(newGeography);
		setDimensionSettings((prev) => ({
			...prev,
			selectedGeography: newGeography,
		}));
	};

	const getCurrentData = () => {
		switch (activeMapType) {
			case 'symbol':
				return symbolData;
			case 'choropleth':
				return choroplethData;
			case 'custom':
				return customData;
			default:
				return symbolData;
		}
	};

	// Check if any data exists for a specific map type
	const hasDataForType = (type: 'symbol' | 'choropleth' | 'custom') => {
		switch (type) {
			case 'symbol':
				return symbolData.parsedData.length > 0 || symbolData.geocodedData.length > 0;
			case 'choropleth':
				return choroplethData.parsedData.length > 0 || choroplethData.geocodedData.length > 0;
			case 'custom':
				return customData.customMapData.length > 0;
			default:
				return false;
		}
	};

	// Check if any data exists at all
	const hasAnyData = () => {
		return hasDataForType('symbol') || hasDataForType('choropleth') || hasDataForType('custom');
	};

	const onlyCustomDataLoaded = hasDataForType('custom') && !hasDataForType('symbol') && !hasDataForType('choropleth');

	const handleDataLoad = (
		mapType: 'symbol' | 'choropleth' | 'custom',
		parsedData: DataRow[],
		columns: string[],
		rawData: string,
		customMapDataParam?: string
	) => {
		const newDataState: DataState = {
			rawData,
			parsedData,
			geocodedData: [],
			columns,
			customMapData: customMapDataParam || '',
		};

		const nextMapType = resolveActiveMapType({
		loadedType: mapType as MapType,
		parsedDataLength: parsedData.length,
		customMapData: customMapDataParam,
		existingChoroplethData: choroplethData,
		existingCustomData: customData,
	});

		switch (mapType) {
			case 'symbol':
				setSymbolData(newDataState);
			setShowGeocoding(parsedData.length > 0);
				break;
			case 'choropleth':
				setChoroplethData(newDataState);
				break;
			case 'custom':
				setCustomData(newDataState);
				break;
		}

		if (parsedData.length > 0) {
		const inferredTypes = inferColumnTypesFromData(parsedData);
		setColumnTypes((prev) => mergeInferredTypes(prev, inferredTypes));
	}

	setActiveMapType(nextMapType);
	setDataInputExpanded(false);
	setDimensionSettings((prev) => resetDimensionForMapType(prev, nextMapType));

	const { geography, projection } = inferGeographyAndProjection({
		columns,
		sampleRows: parsedData,
	});

	if (geography !== selectedGeography) {
		updateSelectedGeography(geography);
		}

	if (projection !== selectedProjection) {
		setSelectedProjection(projection);
	}
	};

	const handleClearData = (mapType: MapType) => {
		switch (mapType) {
			case 'symbol':
				setSymbolData(emptyDataState());
				setShowGeocoding(false);
				break;
			case 'choropleth':
				setChoroplethData(emptyDataState());
				break;
			case 'custom':
				setCustomData(emptyDataState());
				break;
		}

		setDimensionSettings((prev) => resetDimensionForMapType(prev, mapType));

		const hasSymbol = mapType !== 'symbol' ? hasDataForType('symbol') : false;
		const hasChoropleth = mapType !== 'choropleth' ? hasDataForType('choropleth') : false;
		const hasCustom = mapType !== 'custom' ? hasDataForType('custom') : false;

		if (hasChoropleth && hasCustom) {
			setActiveMapType('custom');
		} else if (hasChoropleth) {
			setActiveMapType('choropleth');
		} else if (hasCustom) {
			setActiveMapType('custom');
		} else if (hasSymbol) {
			setActiveMapType('symbol');
		} else {
			setDataInputExpanded(true);
			setActiveMapType('symbol');
		}
	};

	const updateGeocodedData = (geocodedData: GeocodedRow[]) => {
		// Update symbol data with geocoded coordinates
		if (symbolData.parsedData.length > 0) {
			const newColumns = [...symbolData.columns];

			// Possible names for latitude/longitude columns (case-insensitive)
			const latNames = ['latitude', 'lat', 'Latitude', 'Lat'];
			const lngNames = ['longitude', 'long', 'lng', 'lon', 'Longitude', 'Long', 'Lng', 'Lon'];

			// Find first matching column for latitude/longitude
			const latCol =
				newColumns.find((col) => latNames.includes(col.trim().toLowerCase())) ||
				newColumns.find((col) => latNames.some((name) => col.trim().toLowerCase() === name.toLowerCase()));
			const lngCol =
				newColumns.find((col) => lngNames.includes(col.trim().toLowerCase())) ||
				newColumns.find((col) => lngNames.some((name) => col.trim().toLowerCase() === name.toLowerCase()));

			let chosenLatCol = latCol;
			let chosenLngCol = lngCol;

			// If no suitable column exists and geocoded data is present, add 'latitude'/'longitude'
			if (!chosenLatCol && geocodedData.some((row) => row.latitude !== undefined)) {
				newColumns.push('latitude');
				chosenLatCol = 'latitude';
			}
			if (!chosenLngCol && geocodedData.some((row) => row.longitude !== undefined)) {
				newColumns.push('longitude');
				chosenLngCol = 'longitude';
			}

			// Update column types to include the chosen columns as coordinate type
			const newColumnTypes = { ...columnTypes };
			if (chosenLatCol) {
				newColumnTypes[chosenLatCol] = 'coordinate';
			}
			if (chosenLngCol) {
				newColumnTypes[chosenLngCol] = 'coordinate';
			}

			// Update both column types and symbol data
			setColumnTypes(newColumnTypes);
			setSymbolData((prev) => ({
				...prev,
				geocodedData,
				columns: newColumns,
			}));

			// Directly update dimension settings for symbol map with chosen columns
			setDimensionSettings((prevSettings) => ({
				...prevSettings,
				symbol: {
					...prevSettings.symbol,
					latitude: chosenLatCol || prevSettings.symbol.latitude,
					longitude: chosenLngCol || prevSettings.symbol.longitude,
				},
			}));
		}
	};

	// Get both symbol and choropleth data for the map preview
	const getSymbolDisplayData = () => {
		return symbolData.geocodedData.length > 0 ? symbolData.geocodedData : symbolData.parsedData;
	};

	const getChoroplethDisplayData = () => {
		return choroplethData.geocodedData.length > 0 ? choroplethData.geocodedData : choroplethData.parsedData;
	};

	// NEW: Enhanced function to determine which data to display in preview
	const getCurrentDisplayData = () => {
		// If custom map is active and choropleth data exists, show choropleth data
		if (activeMapType === 'custom' && hasDataForType('choropleth')) {
			return getChoroplethDisplayData();
		}
		// Otherwise use the current data based on active map type
		const currentData = getCurrentData();
		return currentData.geocodedData.length > 0 ? currentData.geocodedData : currentData.parsedData;
	};

	// NEW: Enhanced function to get current columns for preview
	const getCurrentColumns = useCallback(() => {
		// If custom map is active and choropleth data exists, show choropleth columns
		if (activeMapType === 'custom' && hasDataForType('choropleth')) {
			return choroplethData.columns;
		}
		// Otherwise use the current columns based on active map type
		return getCurrentData().columns;
	}, [activeMapType, choroplethData.columns, symbolData.columns, customData.columns]); // Added dependencies

	// Provide a lightweight "sample" matrix so the projection panel can
	// guess geography. It uses only primitive values, so we keep it tiny.
	const getCurrentSampleRows = useCallback(() => {
		const rows =
			activeMapType === 'symbol'
				? symbolData.parsedData
				: activeMapType === 'choropleth'
				? choroplethData.parsedData
				: choroplethData.parsedData.length > 0
				? choroplethData.parsedData
				: symbolData.parsedData;

		return rows
			.slice(0, 10)
			.map((r) => Object.values(r).map((v) => (typeof v === 'string' || typeof v === 'number' ? v : '')));
	}, [activeMapType, symbolData.parsedData, choroplethData.parsedData]);

	useEffect(() => {
		// Only show geocoding panel when symbol data exists
		setShowGeocoding(symbolData.parsedData.length > 0);
	}, [symbolData.parsedData]);

	// Effect to handle projection changes based on geography
	useEffect(() => {
		const isUSGeography =
			selectedGeography === 'usa-states' || selectedGeography === 'usa-counties' || selectedGeography === 'usa-nation';

		if (!isUSGeography && (selectedProjection === 'albersUsa' || selectedProjection === 'albers')) {
			setSelectedProjection('mercator');
		}

		// If geography is not a single country, disable clipping
		const isSingleCountryGeography =
			selectedGeography === 'usa-nation' || selectedGeography === 'canada-nation' || selectedGeography === 'world';
		if (!isSingleCountryGeography) {
			setClipToCountry(false);
		}
	}, [selectedGeography, selectedProjection]);

	// Ref for map preview
	const mapPreviewRef = useRef<HTMLDivElement>(null);

	// Track if map preview is fully in view using scroll/resize events
	useEffect(() => {
		function checkMapInView() {
			const ref = mapPreviewRef.current;
			if (!ref) return;
			const rect = ref.getBoundingClientRect();
			const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
			const percentVisible = visibleHeight / rect.height;
			setMapInView(rect.top >= 0 && percentVisible > 0.6);
		}
		checkMapInView();
		window.addEventListener('scroll', checkMapInView, { passive: true });
		window.addEventListener('resize', checkMapInView);
		return () => {
			window.removeEventListener('scroll', checkMapInView);
			window.removeEventListener('resize', checkMapInView);
		};
	}, [mapPreviewRef]);

	// Handler to scroll to map preview and expand it
	const handleScrollToMap = () => {
		setMapPreviewExpanded(true);
		setTimeout(() => {
			if (mapPreviewRef.current) {
				mapPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
			} else {
				const el = document.getElementById('map-preview-section');
				if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
			}
		}, 50);
	};

	// Handler to collapse all panels except map preview
	const handleCollapseAll = () => {
		setDataInputExpanded(false);
		setGeocodingExpanded(false);
		setProjectionExpanded(false);
		setDataPreviewExpanded(false);
		setDimensionMappingExpanded(false);
		setMapStylingExpanded(false);
	};

	// Compute if any panel except map preview is expanded
	const anyPanelExpanded =
		dataInputExpanded ||
		geocodingExpanded ||
		projectionExpanded ||
		dataPreviewExpanded ||
		dimensionMappingExpanded ||
		mapStylingExpanded;

	return (
		<>
			<section className="max-w-6xl mx-auto px-4 py-8 space-y-8">
				<DataInput
					onDataLoad={handleDataLoad}
					isExpanded={dataInputExpanded}
					setIsExpanded={setDataInputExpanded}
					onClearData={handleClearData}
				/>

				{hasAnyData() && !hasDataForType('custom') && (
					<MapProjectionSelection
						geography={selectedGeography}
						projection={selectedProjection}
						onGeographyChange={updateSelectedGeography}
						onProjectionChange={setSelectedProjection}
						columns={getCurrentColumns()}
						sampleRows={getCurrentSampleRows()}
						clipToCountry={clipToCountry}
						onClipToCountryChange={setClipToCountry}
						isExpanded={projectionExpanded}
						setIsExpanded={setProjectionExpanded}
					/>
				)}

				{showGeocoding && (
					<GeocodingSection
						columns={symbolData.columns}
						parsedData={symbolData.parsedData}
						setGeocodedData={updateGeocodedData}
						isGeocoding={isGeocoding}
						setIsGeocoding={setIsGeocoding}
						isExpanded={geocodingExpanded}
						setIsExpanded={setGeocodingExpanded}
					/>
				)}

				{hasAnyData() && (
					<>
						{!onlyCustomDataLoaded && (
							<>
								<DataPreview
									data={getCurrentDisplayData()}
									columns={getCurrentColumns()}
									mapType={activeMapType}
									onClearData={handleClearData}
									symbolDataExists={hasDataForType('symbol')}
									choroplethDataExists={hasDataForType('choropleth')}
									customDataExists={hasDataForType('custom')}
									columnTypes={columnTypes}
									onUpdateColumnTypes={updateColumnTypes}
									onUpdateColumnFormats={updateColumnFormats}
									columnFormats={columnFormats}
									symbolDataLength={symbolData.parsedData.length}
									choroplethDataLength={choroplethData.parsedData.length}
									customDataLoaded={customData.customMapData.length > 0}
									onMapTypeChange={setActiveMapType}
									selectedGeography={dimensionSettings.selectedGeography}
									isExpanded={dataPreviewExpanded}
									setIsExpanded={setDataPreviewExpanded}
								/>

								<DimensionMapping
									mapType={activeMapType}
									symbolDataExists={hasDataForType('symbol')}
									choroplethDataExists={hasDataForType('choropleth')}
									customDataExists={hasDataForType('custom')}
									columnTypes={columnTypes}
									dimensionSettings={dimensionSettings}
									onUpdateSettings={updateDimensionSettings}
									columnFormats={columnFormats}
									symbolParsedData={symbolData.parsedData}
									symbolGeocodedData={symbolData.geocodedData}
									symbolColumns={symbolData.columns}
									choroplethParsedData={choroplethData.parsedData}
									choroplethGeocodedData={choroplethData.geocodedData}
									choroplethColumns={choroplethData.columns}
									selectedGeography={dimensionSettings.selectedGeography}
									stylingSettings={stylingSettings}
									isExpanded={dimensionMappingExpanded}
									setIsExpanded={setDimensionMappingExpanded}
								/>
							</>
						)}
						<MapStyling
							stylingSettings={stylingSettings}
							onUpdateStylingSettings={updateStylingSettings}
							dimensionSettings={dimensionSettings}
							symbolDataExists={hasDataForType('symbol')}
							choroplethDataExists={hasDataForType('choropleth')}
							customDataExists={hasDataForType('custom')}
							isExpanded={mapStylingExpanded}
							setIsExpanded={setMapStylingExpanded}
						/>

						<div ref={mapPreviewRef} id="map-preview-section">
							<MapPreview
								symbolData={getSymbolDisplayData()}
								choroplethData={getChoroplethDisplayData()}
								mapType={activeMapType}
								dimensionSettings={dimensionSettings}
								stylingSettings={stylingSettings}
								symbolDataExists={hasDataForType('symbol')}
								choroplethDataExists={hasDataForType('choropleth')}
								columnTypes={columnTypes}
								columnFormats={columnFormats}
								customMapData={customData.customMapData}
								selectedGeography={selectedGeography}
								selectedProjection={selectedProjection}
								clipToCountry={clipToCountry}
								isExpanded={mapPreviewExpanded}
								setIsExpanded={setMapPreviewExpanded}
							/>
						</div>
					</>
				)}
			</section>
			{/* Floating action buttons */}
			<FloatingActionButtons
				onScrollToMap={() => {
					setMapPreviewExpanded(true);
					setTimeout(() => {
						if (mapPreviewRef.current) {
							mapPreviewRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
						} else {
							const el = document.getElementById('map-preview-section');
							if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
						}
					}, 50);
				}}
				onCollapseAll={handleCollapseAll}
				visible={hasAnyData()}
				showCollapse={anyPanelExpanded}
				showJump={!mapInView || !mapPreviewExpanded}
			/>
		</>
	);
}
