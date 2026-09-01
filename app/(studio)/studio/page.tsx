/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, react-hooks/rules-of-hooks */
'use client';

import { useState, useEffect, useCallback, useRef, Suspense, lazy, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { DataInput } from '@/components/data-input';
import { GeocodingSection } from '@/components/geocoding-section';
import { MapSetupPanel } from '@/components/map-setup-panel';
import { FloatingToolbar } from '@/components/floating-toolbar';

// Lazy load heavy components for better initial load performance
const DataPreview = lazy(() => import('@/components/data-preview').then((mod) => ({ default: mod.DataPreview })));
const LayerStylingInspector = lazy(() =>
	import('@/components/layer-styling-inspector').then((mod) => ({ default: mod.LayerStylingInspector }))
);
const MapPreview = lazy(() => import('@/components/map-preview').then((mod) => ({ default: mod.MapPreview })));
const LabelEditorToolbar = lazy(() =>
	import('@/components/label-editor-toolbar').then((mod) => ({ default: mod.LabelEditorToolbar }))
);
const PathEditorToolbar = lazy(() =>
	import('@/components/path-editor-toolbar').then((mod) => ({ default: mod.PathEditorToolbar }))
);
import { Save, Download, Copy, FileImage } from 'lucide-react';
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
} from '@/modules/data-ingest/dimension-schema';
import { saveProject, getProject, exportProject, generatePreviewThumbnail, type SavedProject } from '@/lib/projects';
import { useRegisterStudioChrome, type StudioMode } from '@/lib/studio-chrome-context';
import { DesignTabHint } from '@/components/design-tab-hint';
import { DataCanvasEmpty } from '@/components/data-canvas-empty';
import { cn } from '@/lib/utils';
import type { StylingSettingsUpdater } from '@/lib/label-overrides';
import { resolveLabelMapType } from '@/lib/symbol-text-content';
import { getSelectedLayer, projectHasLayerData } from '@/modules/layers/selectors';

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
		renderTarget,
		setRenderTarget,
		boundaryConfig,
		setBoundaryConfig,
		maplibreConfig,
		setMaplibreConfig,
		columnTypes,
		setColumnTypes,
		columnFormats,
		setColumnFormats,
		dimensionSettings,
		setDimensionSettings,
		stylingSettings,
		setStylingSettings,
		layers,
		selectedLayerId,
		canvasType,
		customBoundary,
		printConfig,
		referenceLayers,
		setSelectedLayerId,
		setCanvasType,
		setCustomBoundary,
		setPrintConfig,
		toggleReferenceLayer,
		addLayer,
		removeLayer,
		setLayerData,
		setLayerDimensions,
		setLayerColumnTypes,
		setLayerColumnFormats,
		toggleLayerVisibility,
		hydrateFromProject,
		resetDataStates,
		resetAll,
		pushHistory,
		undo,
		redo,
		canUndo,
		canRedo,
		clearHistory,
	} = useStudioStore();

	const [dataInputExpanded, setDataInputExpanded] = useState(true);
	const [customMapInputExpanded, setCustomMapInputExpanded] = useState(false);
	const [geocodingExpanded, setGeocodingExpanded] = useState(true);
	const [canvasExpanded, setCanvasExpanded] = useState(true);
	const [regionExpanded, setRegionExpanded] = useState(true);
	const [layersExpanded, setLayersExpanded] = useState(true);
	const [setupPreviewExpanded, setSetupPreviewExpanded] = useState(true);
	const [dataPreviewExpanded, setDataPreviewExpanded] = useState(true);
	const [dimensionMappingExpanded, setDimensionMappingExpanded] = useState(false);
	const [mapStylingExpanded, setMapStylingExpanded] = useState(false);
	const [mapPreviewExpanded, setMapPreviewExpanded] = useState(true);
	const [studioMode, setStudioMode] = useState<StudioMode>('data');
	const [mapFocusMode, setMapFocusMode] = useState(false);
	const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
	const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
	const [currentProjectId, setCurrentProjectId] = useState<string | null>(projectId);
	const [projectName, setProjectName] = useState<string>('Untitled Project');
	const [isSaving, setIsSaving] = useState(false);
	const [isExporting, setIsExporting] = useState(false);
	const svgRef = useRef<SVGSVGElement>(null);
	const draftSessionRef = useRef(
		typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `draft-${Date.now()}`
	);

	// Debounced history push for styling changes (500ms delay)
	const stylingHistoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
	const pushStylingHistory = useCallback(() => {
		if (stylingHistoryTimeoutRef.current) {
			clearTimeout(stylingHistoryTimeoutRef.current);
		}
		stylingHistoryTimeoutRef.current = setTimeout(() => {
			pushHistory();
			stylingHistoryTimeoutRef.current = null;
		}, 500);
	}, [pushHistory]);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (stylingHistoryTimeoutRef.current) {
				clearTimeout(stylingHistoryTimeoutRef.current);
			}
		};
	}, []);

	// Reset to fresh state when no project ID is provided (new map)
	useEffect(() => {
		if (!projectId) {
			resetAll();
			setCurrentProjectId(null);
			setProjectName('Untitled Project');
			setDataInputExpanded(true);
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
					// Clear history and push initial state after loading
					clearHistory();
					setTimeout(() => pushHistory(), 200);
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
	}, [projectId, toast, router, clearHistory, pushHistory]);

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
			hydrateFromProject(project);
			setDataInputExpanded(false);
		},
		[hydrateFromProject]
	);

	// Check if any data exists at all
	const hasAnyData = () => {
		return projectHasLayerData(layers) || customBoundary.trim().length > 0 || customData.customMapData.length > 0;
	};

	const selectedLayer = getSelectedLayer(layers, selectedLayerId);

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

			if (studioMode !== 'design') {
				setStudioMode('design');
				setMapPreviewExpanded(true);
				await new Promise((resolve) => setTimeout(resolve, 400));
			} else if (!mapPreviewExpanded) {
				setMapPreviewExpanded(true);
				await new Promise((resolve) => setTimeout(resolve, 200));
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
				layers,
				selectedLayerId,
				canvasType,
				customBoundary,
				printConfig,
				referenceLayers,
				renderTarget,
				boundaryConfig,
				maplibreConfig,
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
		studioMode,
		mapPreviewExpanded,
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
				layers,
				selectedLayerId,
				canvasType,
				customBoundary,
				printConfig,
				referenceLayers,
				renderTarget,
				boundaryConfig,
				maplibreConfig,
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
	const updateDimensionSettings = useCallback(
		(newSettings: Pick<DimensionSettings, 'symbol' | 'choropleth'>) => {
			setDimensionSettings((prev: DimensionSettings) => ({
				...prev,
				symbol: newSettings.symbol,
				choropleth: newSettings.choropleth,
			}))
			pushHistory()
		},
		[setDimensionSettings, pushHistory],
	)

	const updateColumnTypes = (newTypes: ColumnType) => {
		setColumnTypes(newTypes);
		if (selectedLayer) {
			setLayerColumnTypes(selectedLayer.id, newTypes);
		}
	};

	const updateColumnFormats = (newFormats: ColumnFormat) => {
		setColumnFormats(newFormats);
		if (selectedLayer) {
			setLayerColumnFormats(selectedLayer.id, newFormats);
		}
	};

	const updateStylingSettings = (newSettings: StylingSettingsUpdater) => {
		setStylingSettings(newSettings);
		pushStylingHistory();
	};

	const updateSelectedGeography = (newGeography: GeographyKey) => {
		setSelectedGeography(newGeography);
		setDimensionSettings((prev: DimensionSettings) => ({
			...prev,
			selectedGeography: newGeography,
		}));
		// Push history for geography changes
		pushHistory();
	};

	const getCurrentData = () => {
		if (selectedLayer) return selectedLayer.data;
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

	const goToDesignFromHint = useCallback(() => {
		setStudioMode('design');
	}, []);

	const pointsLayers = layers.filter(
		(l) => l.type === 'points' && (l.data.parsedData.length > 0 || l.data.geocodedData.length > 0),
	);

	const geocodeLayer =
		selectedLayer?.type === 'points'
			? selectedLayer
			: pointsLayers[0] ?? null;

	const showGeocodingPanel = pointsLayers.length > 0;

	const hasDataLoaded = projectHasLayerData(layers) || customBoundary.trim().length > 0;

	const goToMapSetupFromHint = useCallback(() => {
		setStudioMode('map-setup');
	}, []);

	const studioChrome = useMemo(
		() => ({
			projectName,
			setProjectName,
			onSave: handleSaveProject,
			onExport: handleExportProject,
			isSaving,
			isExporting,
			showProjectControls: hasDataLoaded,
			showModeTabs: true,
			studioMode,
			setStudioMode,
			designModeEnabled: hasDataLoaded,
			mapSetupModeEnabled: hasDataLoaded,
		}),
		[
			hasDataLoaded,
			projectName,
			handleSaveProject,
			handleExportProject,
			isSaving,
			isExporting,
			studioMode,
		]
	);

	useRegisterStudioChrome(studioChrome);

	const handleDataLoad = (
		mapType: 'symbol' | 'choropleth',
		parsedData: DataRow[],
		columns: string[],
		rawData: string,
		layerName?: string,
	) => {
		const layerType = mapType === 'symbol' ? 'points' : 'areas';
		const newDataState: DataState = {
			rawData,
			parsedData,
			geocodedData: [],
			columns,
			customMapData: '',
		};

		const targetLayerId = addLayer(layerType, newDataState, layerName);

		if (parsedData.length > 0) {
			const inferredTypes = inferColumnTypesFromData(parsedData, columns);
			if (targetLayerId) {
				setLayerColumnTypes(targetLayerId, (prev) => mergeInferredTypes(prev, inferredTypes));
			}
			setColumnTypes((prev: ColumnType) => mergeInferredTypes(prev, inferredTypes));
		}

		setDataInputExpanded(false);

		if (parsedData.length > 0) {
			const { geography, projection } = inferGeographyAndProjection({
				columns,
				sampleRows: parsedData,
			});

			if (geography !== selectedGeography) {
				updateSelectedGeography(geography);
			}

			setPrintConfig((prev) => ({ ...prev, projection }));
			setSelectedProjection(projection);
		}

		setTimeout(() => pushHistory(), 100);
	};

	const handleCustomBoundaryLoad = (customMapData: string) => {
		setCustomBoundary(customMapData);
		setCanvasType('custom');
		setTimeout(() => pushHistory(), 100);
	};

	const handleClearAllData = () => {
		resetDataStates();
		setCustomBoundary('');
		setStudioMode('data');
		setTimeout(() => pushHistory(), 100);
	};

	const handleLayerGeocodedData = useCallback(
		(layerId: string, geocodedData: GeocodedRow[]) => {
			const layer = layers.find((l) => l.id === layerId);
			if (!layer) return;

			const latNames = ['latitude', 'lat'];
			const lngNames = ['longitude', 'long', 'lng', 'lon'];
			const newColumns = [...layer.data.columns];

			let latCol = newColumns.find((col) => latNames.includes(col.trim().toLowerCase()));
			let lngCol = newColumns.find((col) => lngNames.includes(col.trim().toLowerCase()));

			const sampleRow = geocodedData.find((row) => row.geocoded) ?? geocodedData[0];
			if (sampleRow) {
				for (const key of Object.keys(sampleRow)) {
					if (
						!latCol &&
						latNames.includes(key.trim().toLowerCase()) &&
						sampleRow[key] !== undefined &&
						sampleRow[key] !== ''
					) {
						latCol = key;
					}
					if (
						!lngCol &&
						lngNames.includes(key.trim().toLowerCase()) &&
						sampleRow[key] !== undefined &&
						sampleRow[key] !== ''
					) {
						lngCol = key;
					}
				}
			}

			if (!latCol && geocodedData.some((row) => row.latitude !== undefined)) {
				latCol = 'latitude';
			}
			if (!lngCol && geocodedData.some((row) => row.longitude !== undefined)) {
				lngCol = 'longitude';
			}

			if (latCol && !newColumns.includes(latCol)) {
				newColumns.push(latCol);
			}
			if (lngCol && !newColumns.includes(lngCol)) {
				newColumns.push(lngCol);
			}

			setLayerData(layerId, (prev) => ({
				...prev,
				geocodedData,
				columns: newColumns,
			}));

			if (latCol || lngCol) {
				setLayerColumnTypes(layerId, (prev) => ({
					...prev,
					...(latCol ? { [latCol]: 'coordinate' as const } : {}),
					...(lngCol ? { [lngCol]: 'coordinate' as const } : {}),
				}));
			}

			if (layer.type === 'points' && (latCol || lngCol)) {
				setLayerDimensions(layerId, (prev) => ({
					...prev,
					...(latCol ? { latitude: latCol } : {}),
					...(lngCol ? { longitude: lngCol } : {}),
				}));
			}

			const isComplete = geocodedData.length > 0 && geocodedData.every((row) => !row.processing);
			if (isComplete) {
				setTimeout(() => pushHistory(), 100);
			}
		},
		[layers, setLayerData, setLayerColumnTypes, setLayerDimensions, pushHistory],
	);

	// Get both symbol and choropleth data for the map preview
	const getSymbolDisplayData = () => {
		const visiblePoints = layers.filter((l) => l.type === 'points' && l.visible);
		if (visiblePoints.length > 0) {
			return visiblePoints.flatMap((l) =>
				l.data.geocodedData.length > 0 ? l.data.geocodedData : l.data.parsedData,
			);
		}
		return symbolData.geocodedData.length > 0 ? symbolData.geocodedData : symbolData.parsedData;
	};

	const getChoroplethDisplayData = () => {
		const visibleAreas = layers.filter((l) => l.type === 'areas' && l.visible);
		if (visibleAreas.length > 0) {
			const topArea = visibleAreas[visibleAreas.length - 1];
			return topArea.data.geocodedData.length > 0 ? topArea.data.geocodedData : topArea.data.parsedData;
		}
		return choroplethData.geocodedData.length > 0 ? choroplethData.geocodedData : choroplethData.parsedData;
	};

	// NEW: Enhanced function to determine which data to display in preview
	const getCurrentDisplayData = () => {
		if (selectedLayer) {
			const data = selectedLayer.data;
			return data.geocodedData.length > 0 ? data.geocodedData : data.parsedData;
		}
		if (activeMapType === 'custom' && hasDataForType('choropleth')) {
			return getChoroplethDisplayData();
		}
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
			.map((r: DataRow) => Object.values(r).map((v) => (typeof v === 'string' || typeof v === 'number' ? v : '')));
	}, [activeMapType, symbolData.parsedData, choroplethData.parsedData]);

	// Effect to handle projection changes based on geography
	useEffect(() => {
		const isUSGeography =
			selectedGeography === 'usa-states' || selectedGeography === 'usa-counties' || selectedGeography === 'usa-nation';

		if (!isUSGeography && (selectedProjection === 'albersUsa' || selectedProjection === 'albers')) {
			setSelectedProjection('mercator');
			return;
		}

		const isSingleCountryGeography =
			selectedGeography === 'usa-nation' || selectedGeography === 'canada-nation' || selectedGeography === 'world';
		if (!isSingleCountryGeography && clipToCountry) {
			setClipToCountry(false);
		}
	}, [selectedGeography, selectedProjection, clipToCountry, setSelectedProjection, setClipToCountry]);

	// Ref for map preview
	const mapPreviewRef = useRef<HTMLDivElement>(null);

	const ensureDesignMode = useCallback(async () => {
		if (studioMode !== 'design') {
			setStudioMode('design');
			setMapPreviewExpanded(true);
			await new Promise((resolve) => setTimeout(resolve, 400));
		} else if (!mapPreviewExpanded) {
			setMapPreviewExpanded(true);
			await new Promise((resolve) => setTimeout(resolve, 200));
		}
	}, [studioMode, mapPreviewExpanded]);

	// Jump to design mode (map)
	const handleJumpToMap = useCallback(() => {
		setStudioMode('design');
		setMapPreviewExpanded(true);
	}, []);

	useEffect(() => {
		if (!hasDataLoaded && studioMode === 'design') {
			setStudioMode('data');
		}
	}, [hasDataLoaded, studioMode]);

	// Handler to download SVG
	const handleDownloadSVG = useCallback(async () => {
		await ensureDesignMode();

		if (!svgRef.current) {
			toast({
				title: 'No map to download',
				description: 'Please ensure the map is rendered before downloading.',
				variant: 'destructive',
			});
			return;
		}

		try {
			const svgElement = svgRef.current;
			const serializer = new XMLSerializer();
			const svgString = serializer.serializeToString(svgElement);
			const blob = new Blob([svgString], { type: 'image/svg+xml' });
			const url = URL.createObjectURL(blob);
			const link = document.createElement('a');
			link.href = url;
			link.download = `${projectName || 'map'}.svg`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			URL.revokeObjectURL(url);

			toast({
				icon: <FileImage className="h-4 w-4" />,
				description: 'Map downloaded as SVG.',
				duration: 3000,
			});
		} catch (error) {
			console.error('Error downloading SVG:', error);
			toast({
				title: 'Download failed',
				description: 'Failed to download SVG file',
				variant: 'destructive',
				duration: 3000,
			});
		}
	}, [toast, projectName, ensureDesignMode]);

	// Handler to collapse all panels except map preview
	const handleCollapseAll = () => {
		setDataInputExpanded(false);
		setGeocodingExpanded(false);
		setCanvasExpanded(false);
		setRegionExpanded(false);
		setLayersExpanded(false);
		setDataPreviewExpanded(false);
		window.dispatchEvent(new CustomEvent('collapse-all-panels'));
	};

	const anyPanelExpanded =
		dataInputExpanded ||
		geocodingExpanded ||
		canvasExpanded ||
		regionExpanded ||
		layersExpanded ||
		dataPreviewExpanded;

	// Copy SVG to clipboard
	const handleCopySVG = useCallback(async () => {
		await ensureDesignMode();

		if (!svgRef.current) {
			toast({
				title: 'No map to copy',
				description: 'Please ensure the map is rendered before copying.',
				variant: 'destructive',
			});
			return;
		}

		try {
			const svgElement = svgRef.current;
			const serializer = new XMLSerializer();
			const svgString = serializer.serializeToString(svgElement);

			await navigator.clipboard.writeText(svgString);

			toast({
				icon: <Copy className="h-4 w-4" />,
				description: 'SVG copied to clipboard.',
				duration: 3000,
			});
		} catch (error) {
			console.error('Error copying SVG:', error);
			toast({
				title: 'Copy failed',
				description: 'Failed to copy SVG to clipboard',
				variant: 'destructive',
				duration: 3000,
			});
		}
	}, [toast, ensureDesignMode]);

	// Reset everything
	const handleReset = useCallback(() => {
		resetAll();
		clearHistory();
		setCurrentProjectId(null);
		setProjectName('Untitled Project');
		setDataInputExpanded(true);
		setMapPreviewExpanded(false);
		setStudioMode('data');
		draftSessionRef.current =
			typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `draft-${Date.now()}`;

		toast({
			description: 'Map reset to defaults.',
			duration: 3000,
		});
	}, [resetAll, clearHistory, toast]);

	// Undo handler
	const handleUndo = useCallback(() => {
		undo();
		toast({
			description: 'Undone.',
			duration: 2000,
		});
	}, [undo, toast]);

	// Redo handler
	const handleRedo = useCallback(() => {
		redo();
		toast({
			description: 'Redone.',
			duration: 2000,
		});
	}, [redo, toast]);

	// Keyboard shortcuts
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't trigger shortcuts if user is typing in an input, textarea, or contenteditable element
			const target = e.target as HTMLElement;
			const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

			if (!isInputElement && !e.metaKey && !e.ctrlKey && !e.altKey) {
				if (e.key === '1') {
					e.preventDefault();
					setStudioMode('data');
					return;
				}
				if (e.key === '2' && hasDataLoaded) {
					e.preventDefault();
					setStudioMode('map-setup');
					return;
				}
				if (e.key === '3' && hasDataLoaded) {
					e.preventDefault();
					setStudioMode('design');
					return;
				}
			}

			// Check for Cmd (Mac) or Ctrl (Windows/Linux)
			const isModifierPressed = e.metaKey || e.ctrlKey;

			if (!isModifierPressed) return;

			// Cmd/Ctrl + Z: Undo (allow in inputs for text undo, but also trigger our undo)
			if (e.key === 'z' && !e.shiftKey) {
				if (!isInputElement && canUndo()) {
					e.preventDefault();
					handleUndo();
				}
				return;
			}

			// Cmd/Ctrl + Y or Cmd/Ctrl + Shift + Z: Redo
			if (e.key === 'y' || (e.key === 'z' && e.shiftKey)) {
				if (!isInputElement && canRedo()) {
					e.preventDefault();
					handleRedo();
				}
				return;
			}

			// Cmd/Ctrl + S: Save project (prevent browser save dialog)
			if (e.key === 's') {
				e.preventDefault();
				if (hasAnyData()) {
					handleSaveProject();
				}
				return;
			}

			// Cmd/Ctrl + E: Export map as SVG
			if (e.key === 'e') {
				e.preventDefault();
				if (hasAnyData()) {
					handleDownloadSVG();
				}
				return;
			}
		};

		window.addEventListener('keydown', handleKeyDown);

		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [canUndo, canRedo, hasAnyData, hasDataLoaded, handleUndo, handleRedo, handleSaveProject, handleDownloadSVG]);

	return (
		<>
			<section
				id="studio-panel-data"
				role="tabpanel"
				aria-labelledby="studio-tab-data"
				tabIndex={studioMode === 'data' ? 0 : -1}
				className={cn('studio-data-view', studioMode !== 'data' && 'hidden')}>
				<div className="studio-data-shell">
					<aside className="studio-data-sidebar" aria-label="Data configuration">
						<div className="studio-sidebar-scroll">
							<DataInput
								onDataLoad={handleDataLoad}
								isExpanded={dataInputExpanded}
								setIsExpanded={setDataInputExpanded}
								pointsLayerCount={layers.filter((l) => l.type === 'points').length}
								areasLayerCount={layers.filter((l) => l.type === 'areas').length}
							/>

							{showGeocodingPanel && geocodeLayer && (
								<GeocodingSection
									columns={geocodeLayer.data.columns}
									parsedData={geocodeLayer.data.parsedData}
									setGeocodedData={(geocoded) => {
										handleLayerGeocodedData(geocodeLayer.id, geocoded);
									}}
									isGeocoding={isGeocoding}
									setIsGeocoding={setIsGeocoding}
									isExpanded={geocodingExpanded}
									setIsExpanded={setGeocodingExpanded}
									pointsLayers={pointsLayers.map((l) => ({ id: l.id, name: l.name }))}
									selectedLayerId={geocodeLayer.id}
									onSelectLayer={setSelectedLayerId}
								/>
							)}
						</div>

						{hasAnyData() && !onlyCustomDataLoaded && (
							<DesignTabHint
								variant="sidebar"
								onGoToDesign={goToMapSetupFromHint}
							/>
						)}
					</aside>

					<div className="studio-data-canvas" aria-label="Data preview canvas">
						{hasAnyData() && !onlyCustomDataLoaded ? (
							<>
								<div className="studio-data-canvas-preview">
									<Suspense
										fallback={
											<div className="flex flex-1 items-center justify-center bg-muted/20 p-8 text-center text-xs text-muted-foreground">
												Loading data preview...
											</div>
										}>
										<DataPreview
											variant="canvas"
											data={getCurrentDisplayData()}
											columns={selectedLayer?.data.columns ?? getCurrentColumns()}
											mapType={selectedLayer?.type === 'points' ? 'symbol' : 'choropleth'}
											onClearData={() => {}}
											symbolDataExists={layers.some((l) => l.type === 'points' && l.data.parsedData.length > 0)}
											choroplethDataExists={layers.some((l) => l.type === 'areas' && l.data.parsedData.length > 0)}
											customDataExists={canvasType === 'custom'}
											columnTypes={selectedLayer?.columnTypes ?? columnTypes}
											onUpdateColumnTypes={updateColumnTypes}
											onUpdateColumnFormats={updateColumnFormats}
											columnFormats={selectedLayer?.columnFormats ?? columnFormats}
											symbolDataLength={symbolData.parsedData.length}
											choroplethDataLength={choroplethData.parsedData.length}
											customDataLoaded={customBoundary.length > 0}
											onMapTypeChange={() => {}}
											selectedGeography={dimensionSettings.selectedGeography}
											isExpanded={dataPreviewExpanded}
											setIsExpanded={setDataPreviewExpanded}
											layers={layers
												.filter((l) => l.data.parsedData.length > 0 || l.data.geocodedData.length > 0)
												.map((l) => ({ id: l.id, name: l.name, type: l.type }))}
											selectedLayerId={selectedLayerId}
											onSelectLayer={setSelectedLayerId}
											onDeleteLayer={(id) => {
												removeLayer(id);
												pushHistory();
											}}
										/>
									</Suspense>
								</div>
							</>
						) : (
							<DataCanvasEmpty
								variant={onlyCustomDataLoaded ? 'custom-only' : 'no-data'}
								onGoToDesign={onlyCustomDataLoaded ? goToDesignFromHint : undefined}
							/>
						)}
					</div>
				</div>
			</section>

			{hasAnyData() && (
				<section
					id="studio-panel-map-setup"
					role="tabpanel"
					aria-labelledby="studio-tab-map-setup"
					tabIndex={studioMode === 'map-setup' ? 0 : -1}
					className={cn('studio-data-view', studioMode !== 'map-setup' && 'hidden')}>
					<div className="studio-data-shell">
						<aside className="studio-data-sidebar max-w-md" aria-label="Setup">
							<div className="studio-sidebar-scroll">
								<MapSetupPanel
									canvasType={canvasType}
									onCanvasTypeChange={(type) => {
										setCanvasType(type);
										pushHistory();
									}}
									layers={layers}
									selectedLayerId={selectedLayerId}
									onSelectLayer={setSelectedLayerId}
									onToggleLayerVisibility={toggleLayerVisibility}
									boundaryConfig={boundaryConfig}
									onBoundaryChange={setBoundaryConfig}
									selectedGeography={selectedGeography}
									onGeographyChange={updateSelectedGeography}
									printConfig={printConfig}
									onPrintConfigChange={(config) => {
										setPrintConfig(config);
										setSelectedProjection(config.projection);
										setClipToCountry(config.clipToCountry);
									}}
									referenceLayers={referenceLayers}
									onToggleReferenceLayer={toggleReferenceLayer}
									dimensionSettings={dimensionSettings}
									onUpdateDimensionSettings={updateDimensionSettings}
									columnTypes={columnTypes}
									columnFormats={columnFormats}
									stylingSettings={stylingSettings}
									onCustomBoundaryLoad={handleCustomBoundaryLoad}
									onClearCustomBoundary={() => {
										setCustomBoundary('');
										setCanvasType('print');
									}}
									canvasExpanded={canvasExpanded}
									setCanvasExpanded={setCanvasExpanded}
									regionExpanded={regionExpanded}
									setRegionExpanded={setRegionExpanded}
									layersExpanded={layersExpanded}
									setLayersExpanded={setLayersExpanded}
								/>
							</div>

							<DesignTabHint
								variant="sidebar"
								title="Ready to map?"
								buttonLabel="Design"
								onGoToDesign={goToDesignFromHint}
							/>
						</aside>
						<div className="studio-data-canvas studio-design-map min-h-0">
							<Suspense
								fallback={
									<div className="flex h-full items-center justify-center bg-muted/20 p-12 text-xs text-muted-foreground">
										Loading map preview…
									</div>
								}>
								<MapPreview
									symbolData={getSymbolDisplayData()}
									choroplethData={getChoroplethDisplayData()}
									mapType={activeMapType}
									dimensionSettings={dimensionSettings}
									stylingSettings={stylingSettings}
									symbolDataExists={layers.some((l) => l.type === 'points' && l.visible && l.data.parsedData.length > 0)}
									choroplethDataExists={layers.some((l) => l.type === 'areas' && l.visible && l.data.parsedData.length > 0)}
									columnTypes={columnTypes}
									columnFormats={columnFormats}
									customMapData={customBoundary || customData.customMapData}
									selectedGeography={selectedGeography}
									selectedProjection={printConfig.projection}
									clipToCountry={printConfig.clipToCountry}
									isExpanded={setupPreviewExpanded}
									setIsExpanded={setSetupPreviewExpanded}
									isFocusMode={false}
									onToggleFocusMode={() => {}}
									renderTarget={renderTarget}
									boundaryConfig={boundaryConfig}
									maplibreConfig={maplibreConfig}
									previewContext="setup"
									canvasType={canvasType}
									referenceLayers={referenceLayers}
								/>
							</Suspense>
						</div>
					</div>
				</section>
			)}

			{hasAnyData() && (
				<section
					id="studio-panel-design"
					role="tabpanel"
					aria-labelledby="studio-tab-design"
					tabIndex={studioMode === 'design' ? 0 : -1}
					className={cn('studio-design-view', studioMode !== 'design' && 'hidden')}>
					<div className={cn('studio-design-shell', mapFocusMode && 'studio-design-shell-focus')}>
						<div ref={mapPreviewRef} id="map-preview-section" className="studio-design-map">
							<Suspense
								fallback={
									<div className="bg-muted/20 p-12 text-center text-xs text-muted-foreground">
										Loading map preview...
									</div>
								}>
								<MapPreview
									symbolData={getSymbolDisplayData()}
									choroplethData={getChoroplethDisplayData()}
									mapType={activeMapType}
									dimensionSettings={dimensionSettings}
									stylingSettings={stylingSettings}
									symbolDataExists={layers.some((l) => l.type === 'points' && l.visible && l.data.parsedData.length > 0)}
									choroplethDataExists={layers.some((l) => l.type === 'areas' && l.visible && l.data.parsedData.length > 0)}
									columnTypes={columnTypes}
									columnFormats={columnFormats}
									customMapData={customBoundary || customData.customMapData}
									selectedGeography={selectedGeography}
									selectedProjection={printConfig.projection}
									clipToCountry={printConfig.clipToCountry}
									isExpanded={mapPreviewExpanded}
									setIsExpanded={setMapPreviewExpanded}
									isFocusMode={mapFocusMode}
									onToggleFocusMode={() => setMapFocusMode((prev) => !prev)}
									svgRef={svgRef}
									onUpdateStylingSettings={updateStylingSettings}
									selectedLabelId={selectedLabelId}
									onSelectedLabelIdChange={setSelectedLabelId}
									selectedPathId={selectedPathId}
									onSelectedPathIdChange={setSelectedPathId}
									embedEditorsInSidebar
									renderTarget={renderTarget}
									boundaryConfig={boundaryConfig}
									maplibreConfig={maplibreConfig}
									canvasType={canvasType}
									referenceLayers={referenceLayers}
								/>
							</Suspense>
							{studioMode === 'design' && hasAnyData() && (
								<FloatingToolbar
									visible
									placement="map-canvas"
									studioMode={studioMode}
									onReset={handleReset}
									onSave={handleSaveProject}
									onExport={handleExportProject}
									onExportSVG={handleDownloadSVG}
									onCopy={handleCopySVG}
									onUndo={handleUndo}
									onRedo={handleRedo}
									onCollapseAll={handleCollapseAll}
									onJumpToMap={handleJumpToMap}
									showJumpToMap={false}
									canUndo={canUndo()}
									canRedo={canRedo()}
									canCollapse={anyPanelExpanded}
									isSaving={isSaving}
									isExporting={isExporting}
								/>
							)}
						</div>

						{!mapFocusMode && (
							<aside className="studio-design-inspector" aria-label="Map design inspector">
								{selectedLabelId ? (
									<Suspense
										fallback={
											<div className="bg-muted/20 p-8 text-center text-xs text-muted-foreground">
												Loading label editor...
											</div>
										}>
										<LabelEditorToolbar
											labelId={selectedLabelId}
											onClose={() => setSelectedLabelId(null)}
											stylingSettings={stylingSettings}
											onUpdateStylingSettings={updateStylingSettings}
											mapType={resolveLabelMapType(selectedLabelId)}
											dimensionSettings={dimensionSettings}
											symbolData={getSymbolDisplayData()}
											choroplethData={getChoroplethDisplayData()}
											columnTypes={columnTypes}
											columnFormats={columnFormats}
											selectedGeography={selectedGeography}
											variant="inspector"
										/>
									</Suspense>
								) : selectedPathId ? (
									<Suspense
										fallback={
											<div className="bg-muted/20 p-8 text-center text-xs text-muted-foreground">
												Loading path editor...
											</div>
										}>
										<PathEditorToolbar
											pathId={selectedPathId}
											onClose={() => setSelectedPathId(null)}
											stylingSettings={stylingSettings}
											onUpdateStylingSettings={updateStylingSettings}
											variant="inspector"
										/>
									</Suspense>
								) : (
									<Suspense
										fallback={
											<div className="bg-muted/20 p-8 text-center text-xs text-muted-foreground">
												Loading styling...
											</div>
										}>
										<LayerStylingInspector
											layers={layers}
											stylingSettings={stylingSettings}
											onUpdateStylingSettings={updateStylingSettings}
											dimensionSettings={dimensionSettings}
											onUpdateDimensionSettings={updateDimensionSettings}
											columnTypes={columnTypes}
											columnFormats={columnFormats}
											symbolParsedData={symbolData.parsedData}
											symbolGeocodedData={symbolData.geocodedData}
											symbolColumns={symbolData.columns}
											choroplethParsedData={choroplethData.parsedData}
											choroplethGeocodedData={choroplethData.geocodedData}
											choroplethColumns={choroplethData.columns}
											selectedGeography={selectedGeography}
											customDataExists={canvasType === 'custom'}
											canvasType={canvasType}
											maplibreConfig={maplibreConfig}
											onMaplibreConfigChange={setMaplibreConfig}
										/>
									</Suspense>
								)}
							</aside>
						)}
					</div>
				</section>
			)}
			{/* Floating toolbar — design tab uses map-canvas placement inside .studio-design-map */}
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
