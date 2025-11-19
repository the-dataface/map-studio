/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, react-hooks/rules-of-hooks */
'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DataInput } from '@/components/data-input';
import { GeocodingSection } from '@/components/geocoding-section';
import { DataPreview } from '@/components/data-preview';
import { DimensionMapping } from '@/components/dimension-mapping';
import { MapPreview } from '@/components/map-preview';
import { MapStyling } from '@/components/map-styling';
import { MapProjectionSelection } from '@/components/map-projection-selection';
import { FloatingActionButtons } from '@/components/floating-action-buttons';
import { Button } from '@/components/ui/button';
import { Save, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
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
} from '../types';
import { emptyDataState, useStudioStore } from '@/state/studio-store';
import { inferGeographyAndProjection } from '@/modules/data-ingest/inference';
import { resolveActiveMapType } from '@/modules/data-ingest/map-type';
import {
	inferColumnTypesFromData,
	mergeInferredTypes,
	resetDimensionForMapType,
} from '@/modules/data-ingest/dimension-schema';
import { saveProject, getProject, exportProject, generatePreviewThumbnail, type SavedProject } from '@/lib/projects';

// Mark page as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

function MapStudioContent() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const { toast } = useToast();
	const projectId = searchParams.get('project');

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
		resetDataStates,
		resetAll,
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
	const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectId);
	const [projectName, setProjectName] = useState<string>('Untitled Project');
	const [isSaving, setIsSaving] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const svgRef = useRef<SVGSVGElement>(null);

	// Reset to fresh state when no project ID is provided (new map)
	useEffect(() => {
		if (!projectId) {
			resetAll();
			setCurrentProjectId(null);
			setProjectName('Untitled Project');
			setDataInputExpanded(true);
			setShowGeocoding(false);
		}
	}, [projectId, resetAll]);

	// Load project on mount if projectId is provided
	useEffect(() => {
		if (projectId) {
			try {
				const project = getProject(projectId);
				if (project) {
					loadProject(project);
					setCurrentProjectId(project.id);
					setProjectName(project.name);
				} else {
					toast({
						title: 'Project not found',
						description: 'The requested project could not be found. It may have been deleted.',
						variant: 'destructive',
					});
					// Redirect to studio without project ID
					router.replace('/studio');
				}
			} catch (error) {
				console.error('Failed to load project:', error);
				toast({
					title: 'Failed to load project',
					description: error instanceof Error ? error.message : 'An error occurred while loading the project.',
					variant: 'destructive',
				});
				router.replace('/studio');
			}
		}
	}, [projectId, toast, router]);

	// Generate thumbnail for projects that don't have one after map renders
	useEffect(() => {
		if (!currentProjectId || !hasAnyData()) {
			console.log('⏭️ Skipping thumbnail generation:', { currentProjectId, hasData: hasAnyData() });
			return;
		}

		const project = getProject(currentProjectId);
		if (!project) {
			console.log('⏭️ Project not found:', currentProjectId);
			return;
		}

		if (project.preview) {
			console.log('✅ Project already has thumbnail:', project.name);
			return; // Skip if project has thumbnail
		}

		console.log('🔄 Starting thumbnail generation for project:', project.name);

		// Ensure map preview is expanded so SVG renders
		if (!mapPreviewExpanded) {
			console.log('📂 Expanding map preview for thumbnail generation');
			setMapPreviewExpanded(true);
		}

		// Function to check if SVG is ready and generate thumbnail
		const tryGenerateThumbnail = () => {
			if (!svgRef.current) {
				return false;
			}

			const svg = svgRef.current;

			// Check if SVG has a viewBox (indicates it's been configured)
			if (!svg.getAttribute('viewBox')) {
				return false;
			}

			// Check if SVG has content (children elements)
			if (svg.children.length === 0) {
				return false;
			}

			// Check if map has actually rendered - look for specific map elements
			// For custom maps, look for #Map group
			// For regular maps, look for #Nations, #States, or path elements with fill
			const hasMapContent =
				svg.querySelector('#Map') ||
				svg.querySelector('#Nations') ||
				svg.querySelector('#States') ||
				svg.querySelector('#Countries') ||
				svg.querySelector('path[fill]') ||
				svg.querySelector('circle[fill]') ||
				svg.querySelector('g[fill]') ||
				svg.querySelector('g path');

			if (!hasMapContent) {
				return false;
			}

			// Additional validation: check if there are actually visible elements
			// (some might be hidden or empty)
			const visiblePaths = svg.querySelectorAll('path[fill]:not([fill="none"]), circle[fill]:not([fill="none"])');
			if (visiblePaths.length === 0 && !svg.querySelector('#Map')) {
				return false;
			}

			// Generate thumbnail (async)
			const thumbnailResult = generatePreviewThumbnail(svgRef.current);
			if (!thumbnailResult) {
				return false;
			}

			// Handle Promise if returned
			if (thumbnailResult instanceof Promise) {
				thumbnailResult
					.then((preview) => {
						if (preview) {
							try {
								const updatedProject = { ...project, preview };
								saveProject(updatedProject);
								console.log('✅ Thumbnail generated and saved for project:', project.name);
							} catch (error) {
								console.warn('Failed to save thumbnail:', error);
							}
						}
					})
					.catch((error) => {
						console.warn('Failed to generate thumbnail:', error);
					});
				// Return true to indicate we started the async process
				return true;
			} else {
				// Synchronous result
				if (thumbnailResult) {
					try {
						const updatedProject = { ...project, preview: thumbnailResult };
						saveProject(updatedProject);
						console.log('✅ Thumbnail generated and saved for project:', project.name);
						return true;
					} catch (error) {
						console.warn('Failed to save thumbnail:', error);
					}
				}
				return false;
			}
		};

		// Try with increasing delays to account for async data loading
		let intervalId: NodeJS.Timeout | null = null;
		let timeoutId: NodeJS.Timeout | null = null;

		// Start trying after map preview expansion and geo data loading delay
		// For custom maps, we don't need geo data, so we can try sooner
		const isCustomMap = customData.customMapData.length > 0;
		const initialDelay = isCustomMap ? 1500 : 2000; // Custom maps render faster

		timeoutId = setTimeout(() => {
			if (tryGenerateThumbnail()) {
				return;
			}

			// If not ready, try with intervals
			let attempts = 0;
			const maxAttempts = 20; // Try for up to 10 seconds
			const attemptInterval = 500; // 500ms between attempts

			intervalId = setInterval(() => {
				attempts++;
				const success = tryGenerateThumbnail();
				if (success || attempts >= maxAttempts) {
					if (intervalId) {
						clearInterval(intervalId);
						intervalId = null;
					}
					if (attempts >= maxAttempts && !success) {
						console.warn('⚠️ Failed to generate thumbnail after max attempts for project:', project.name, {
							svgExists: !!svgRef.current,
							svgChildren: svgRef.current?.children.length || 0,
							hasViewBox: !!svgRef.current?.getAttribute('viewBox'),
						});
					}
				}
			}, attemptInterval);
		}, initialDelay);

		return () => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			if (intervalId) {
				clearInterval(intervalId);
			}
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		currentProjectId,
		symbolData.parsedData.length,
		choroplethData.parsedData.length,
		customData.customMapData.length,
		selectedGeography,
		mapPreviewExpanded,
	]);

	// Load project data into store
	const loadProject = useCallback(
		(project: SavedProject) => {
			setSymbolData(project.symbolData);
			setChoroplethData(project.choroplethData);
			setCustomData(project.customData);
			setActiveMapType(project.activeMapType);
			setSelectedGeography(project.selectedGeography);
			setSelectedProjection(project.selectedProjection);
			setClipToCountry(project.clipToCountry);
			setColumnTypes(project.columnTypes as ColumnType);
			setColumnFormats(project.columnFormats);
			setDimensionSettings(project.dimensionSettings);
			setStylingSettings(project.stylingSettings);
			setShowGeocoding(project.symbolData.parsedData.length > 0);
			setDataInputExpanded(false);
		},
		[
			setSymbolData,
			setChoroplethData,
			setCustomData,
			setActiveMapType,
			setSelectedGeography,
			setSelectedProjection,
			setClipToCountry,
			setColumnTypes,
			setColumnFormats,
			setDimensionSettings,
			setStylingSettings,
		]
	);

	// Check if any data exists at all
	const hasAnyData = () => {
		return hasDataForType('symbol') || hasDataForType('choropleth') || hasDataForType('custom');
	};

	// Save project
	const handleSaveProject = useCallback(async () => {
		if (!hasAnyData()) {
			toast({
				title: 'No data to save',
				description: 'Please add some data before saving.',
				variant: 'destructive',
			});
			return;
		}

		if (!projectName.trim()) {
			toast({
				title: 'Invalid project name',
				description: 'Please enter a project name.',
				variant: 'destructive',
			});
			return;
		}

		setIsSaving(true);

		try {
			// Add small delay to show loading state
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Ensure map preview is expanded for thumbnail generation
			if (!mapPreviewExpanded) {
				setMapPreviewExpanded(true);
				// Wait a bit for map to render
				await new Promise((resolve) => setTimeout(resolve, 500));
			}

			// Generate preview thumbnail
			let preview: string | undefined = undefined;
			const thumbnailResult = generatePreviewThumbnail(svgRef.current);
			if (thumbnailResult instanceof Promise) {
				preview = await thumbnailResult;
			} else {
				preview = thumbnailResult;
			}

			const project: Omit<SavedProject, 'id' | 'createdAt' | 'updatedAt'> = {
				name: projectName.trim(),
				symbolData,
				choroplethData,
				customData,
				activeMapType,
				selectedGeography,
				selectedProjection,
				clipToCountry,
				columnTypes,
				columnFormats,
				dimensionSettings,
				stylingSettings,
				preview,
			};

			const saved = saveProject(project);
			setCurrentProjectId(saved.id);
			setProjectName(saved.name);

			// Check if thumbnail was saved
			const hadThumbnail = !!preview;
			const hasThumbnail = !!saved.preview;

			if (hadThumbnail && !hasThumbnail) {
				toast({
					icon: <Save className="h-4 w-4" />,
					description: `Project "${saved.name}" saved successfully. Note: Preview thumbnail was not saved due to storage limits.`,
					duration: 5000,
				});
			} else {
				toast({
					icon: <Save className="h-4 w-4" />,
					description: `Project "${saved.name}" saved successfully.`,
				});
			}
		} catch (error) {
			console.error('Failed to save project:', error);
			let errorMessage = 'Failed to save project. Please try again.';

			if (error instanceof Error) {
				if (error.message.includes('QuotaExceededError') || error.message.includes('quota')) {
					errorMessage =
						'Storage quota exceeded. Please delete some projects or clear your browser storage. You can also export projects to save them as files.';
				} else {
					errorMessage = error.message;
				}
			}

			toast({
				title: 'Save failed',
				description: errorMessage,
				variant: 'destructive',
				duration: 6000,
			});
		} finally {
			setIsSaving(false);
		}
	}, [
		hasAnyData,
		projectName,
		symbolData,
		choroplethData,
		customData,
		activeMapType,
		selectedGeography,
		selectedProjection,
		clipToCountry,
		columnTypes,
		columnFormats,
		dimensionSettings,
		stylingSettings,
		toast,
	]);

	// Export project
	const handleExportProject = useCallback(async () => {
		if (!hasAnyData()) {
			toast({
				title: 'No data to export',
				description: 'Please add some data before exporting.',
				variant: 'destructive',
			});
			return;
		}

		setIsExporting(true);

		try {
			// Add small delay to show loading state
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Generate preview thumbnail if not already saved
			let preview: string | undefined = undefined;
			const thumbnailResult = generatePreviewThumbnail(svgRef.current);
			if (thumbnailResult instanceof Promise) {
				preview = await thumbnailResult;
			} else {
				preview = thumbnailResult;
			}

			const project: SavedProject = {
				id: currentProjectId || `temp_${Date.now()}`,
				name: projectName.trim() || 'Untitled Project',
				createdAt: Date.now(),
				updatedAt: Date.now(),
				symbolData,
				choroplethData,
				customData,
				activeMapType,
				selectedGeography,
				selectedProjection,
				clipToCountry,
				columnTypes,
				columnFormats,
				dimensionSettings,
				stylingSettings,
				preview,
			};

			exportProject(project);

			toast({
				icon: <Download className="h-4 w-4" />,
				description: `Project "${project.name}" exported successfully.`,
			});
		} catch (error) {
			console.error('Failed to export project:', error);
			const errorMessage = error instanceof Error ? error.message : 'Failed to export project. Please try again.';
			toast({
				title: 'Export failed',
				description: errorMessage,
				variant: 'destructive',
			});
		} finally {
			setIsExporting(false);
		}
	}, [
		hasAnyData,
		currentProjectId,
		projectName,
		symbolData,
		choroplethData,
		customData,
		activeMapType,
		selectedGeography,
		selectedProjection,
		clipToCountry,
		columnTypes,
		columnFormats,
		dimensionSettings,
		stylingSettings,
		toast,
	]);

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
				{hasAnyData() && (
					<div className="flex items-center justify-between mb-4">
						<div className="flex items-center gap-2">
							<input
								type="text"
								value={projectName}
								onChange={(e) => setProjectName(e.target.value)}
								className="text-lg font-semibold bg-transparent border-none outline-none focus:ring-2 focus:ring-primary rounded px-2 py-1"
								placeholder="Project name"
							/>
						</div>
						<div className="flex items-center gap-2">
							<Button onClick={handleExportProject} variant="outline" size="sm" disabled={isExporting || isSaving}>
								<Download className="h-4 w-4 mr-2" />
								{isExporting ? 'Exporting...' : 'Export'}
							</Button>
							<Button onClick={handleSaveProject} variant="default" size="sm" disabled={isSaving || isExporting}>
								<Save className="h-4 w-4 mr-2" />
								{isSaving ? 'Saving...' : 'Save Project'}
							</Button>
						</div>
					</div>
				)}

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
								svgRef={svgRef}
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

export default function MapStudio() {
	return (
		<Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
			<MapStudioContent />
		</Suspense>
	);
}
