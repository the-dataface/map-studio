'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

import type {
	BoundaryConfig,
	ColumnFormat,
	ColumnType,
	DataRow,
	DimensionSettings,
	GeocodedRow,
	GeographyKey,
	MapLibreConfig,
	MapType,
	ProjectionType,
	ReferenceLayerConfig,
	RenderTarget,
	StylingSettings,
} from '@/app/(studio)/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Copy, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { REFERENCE_LAYER_CATALOG } from '@/modules/reference-layers/catalog';
import { MapLibrePreview } from '@/components/maplibre-preview';
import { RenderTargetToggle } from '@/components/render-target-toggle';
import { resolveLabelMapType } from '@/lib/symbol-text-content';
import { applyLabelOverrideUpdate } from '@/lib/label-overrides';
import type { StylingSettingsUpdater } from '@/lib/label-overrides';
import { studioHeaderIconButtonClass, StudioExpandableHeader } from '@/components/studio-panel';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import { formatLegendValue, renderLabelPreview } from '@/modules/data-ingest/formatting';
import { useGeoAtlasData } from '@/modules/map-preview/use-geo-atlas';
import { renderBaseMap } from '@/modules/map-preview/base-map';
import { renderSymbols } from '@/modules/map-preview/symbols';
import { applyChoroplethColors } from '@/modules/map-preview/choropleth';
import { renderSymbolLabels, renderChoroplethLabels, renderSymbolText } from '@/modules/map-preview/labels';
import { estimateLegendHeight, renderLegends } from '@/modules/map-preview/legends';
import { getNumericValue, getUniqueValues, getSymbolPathData } from '@/modules/map-preview/helpers';
import {
	normalizeGeoIdentifier,
	extractCandidateFromSVGId,
	findCountryFeature,
	getSubnationalLabel,
} from '@/modules/map-preview/geography';
import { generateMapDescription, generateMapSummary } from '@/lib/accessibility/map-description';
import { MapControlBar, type MapTool } from '@/components/map-control-bar';
import { MapTooltip } from '@/components/map-tooltip';
import { LabelEditorToolbar } from '@/components/label-editor-toolbar';
import { PathEditorToolbar } from '@/components/path-editor-toolbar';
import { getMappedDimensionColumns, formatTooltipData } from '@/modules/map-preview/tooltip';
import { renderDrawnPaths, constrainAngle } from '@/modules/map-preview/paths';
import { renderPathPreview } from '@/modules/map-preview/path-preview';
import type { DrawnPath, PathPoint } from '@/app/(studio)/types';

type DataRecord = DataRow | GeocodedRow;

export interface MapPreviewProps {
	symbolData: DataRecord[];
	choroplethData: DataRecord[];
	mapType: MapType;
	dimensionSettings: DimensionSettings;
	stylingSettings: StylingSettings;
	symbolDataExists: boolean;
	choroplethDataExists: boolean;
	columnTypes: ColumnType;
	columnFormats: ColumnFormat;
	customMapData: string;
	selectedGeography: GeographyKey;
	selectedProjection: ProjectionType;
	clipToCountry: boolean;
	isExpanded: boolean;
	setIsExpanded: (expanded: boolean) => void;
	isFocusMode?: boolean;
	onToggleFocusMode?: () => void;
	svgRef?: React.RefObject<SVGSVGElement>;
	onCopySVG?: () => Promise<void>;
	onUpdateStylingSettings?: (settings: StylingSettingsUpdater) => void;
	selectedLabelId?: string | null;
	onSelectedLabelIdChange?: (id: string | null) => void;
	selectedPathId?: string | null;
	onSelectedPathIdChange?: (id: string | null) => void;
	embedEditorsInSidebar?: boolean;
	renderTarget?: RenderTarget;
	onRenderTargetChange?: (target: RenderTarget) => void;
	boundaryConfig?: BoundaryConfig;
	maplibreConfig?: MapLibreConfig;
	/** Setup tab: simplified preview — inspect-only for print/custom, pan+inspect for interactive */
	previewContext?: 'setup' | 'design';
	canvasType?: 'print' | 'interactive' | 'custom';
	referenceLayers?: ReferenceLayerConfig[];
}

const MAP_WIDTH = 975;
const MAP_HEIGHT = 610;

export function MapPreview({
	symbolData,
	choroplethData,
	mapType,
	dimensionSettings,
	stylingSettings,
	symbolDataExists,
	choroplethDataExists,
	columnTypes,
	columnFormats,
	customMapData,
	selectedGeography,
	selectedProjection,
	clipToCountry,
	isExpanded,
	setIsExpanded,
	isFocusMode = false,
	onToggleFocusMode,
	svgRef: externalSvgRef,
	onUpdateStylingSettings,
	selectedLabelId: selectedLabelIdProp,
	onSelectedLabelIdChange,
	selectedPathId: selectedPathIdProp,
	onSelectedPathIdChange,
	embedEditorsInSidebar = false,
	renderTarget = 'svg',
	onRenderTargetChange,
	boundaryConfig,
	maplibreConfig,
	previewContext = 'design',
	canvasType = 'print',
	referenceLayers = [],
}: MapPreviewProps) {
	const internalSvgRef = useRef<SVGSVGElement>(null);
	const svgRef = externalSvgRef || internalSvgRef;
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const { toast } = useToast();
	const isSetupPreview = previewContext === 'setup';
	const isInteractiveSetup = isSetupPreview && canvasType === 'interactive';
	const isInteractiveCanvas = canvasType === 'interactive';
	const enabledReferenceLayers = referenceLayers.filter((layer) => layer.enabled);
	const enabledReferenceLayerLabels = enabledReferenceLayers
		.map((layer) => REFERENCE_LAYER_CATALOG.find((def) => def.id === layer.id)?.label)
		.filter(Boolean);
	const [activeTool, setActiveTool] = useState<MapTool>(canvasType === 'interactive' ? 'move' : 'inspect');
	const [internalSelectedLabelId, setInternalSelectedLabelId] = useState<string | null>(null);
	const [internalSelectedPathId, setInternalSelectedPathId] = useState<string | null>(null);
	const selectedLabelId = selectedLabelIdProp ?? internalSelectedLabelId;
	const selectedPathId = selectedPathIdProp ?? internalSelectedPathId;
	const setSelectedLabelId = useCallback(
		(id: string | null) => {
			if (onSelectedLabelIdChange) onSelectedLabelIdChange(id);
			else setInternalSelectedLabelId(id);
		},
		[onSelectedLabelIdChange]
	);
	const setSelectedPathId = useCallback(
		(id: string | null) => {
			if (onSelectedPathIdChange) onSelectedPathIdChange(id);
			else setInternalSelectedPathId(id);
		},
		[onSelectedPathIdChange]
	);
	const [isDrawing, setIsDrawing] = useState(false);
	const [currentPath, setCurrentPath] = useState<PathPoint[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [dragStartPoint, setDragStartPoint] = useState<{ x: number; y: number } | null>(null);
	const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null);
	const [tooltipState, setTooltipState] = useState<{
		visible: boolean;
		x: number;
		y: number;
		content: React.ReactNode;
	}>({
		visible: false,
		x: 0,
		y: 0,
		content: null,
	});
	const drawingToastRef = useRef<{ dismiss: () => void } | null>(null);

	const [isDesktop, setIsDesktop] = useState(
		() => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
	);
	useEffect(() => {
		const mq = window.matchMedia('(min-width: 1024px)');
		const update = () => setIsDesktop(mq.matches);
		mq.addEventListener('change', update);
		return () => mq.removeEventListener('change', update);
	}, []);

	const mapVisible = isDesktop || isExpanded;
	const mapPanelCollapsible = !isDesktop;
	const isHeroLayout = Boolean(onToggleFocusMode) && isDesktop;

  // Hide tooltips when switching tools; clear label/path selection when leaving select mode
	useEffect(() => {
		if (activeTool !== 'inspect') {
			setTooltipState((prev) => ({ ...prev, visible: false }));
		}
		if (activeTool !== 'select') {
			setSelectedLabelId(null);
			setSelectedPathId(null);
		}
	}, [activeTool, setSelectedLabelId, setSelectedPathId]);
	const { geoAtlasData, isLoading } = useGeoAtlasData({
		selectedGeography,
		enabled: renderTarget === 'svg',
		notify: (options) => {
			toast(options as Parameters<typeof toast>[0]);
		},
	});
	const showMapLibre =
		renderTarget === 'maplibre' &&
		maplibreConfig &&
		(boundaryConfig ||
			(dimensionSettings.symbol.latitude && dimensionSettings.symbol.longitude));

	// Handler for label position updates
	const handleLabelPositionUpdate = useCallback(
		(labelId: string, x: number, y: number) => {
			if (!onUpdateStylingSettings) return;

			onUpdateStylingSettings((prev) => applyLabelOverrideUpdate(prev, labelId, { x, y }));
		},
		[onUpdateStylingSettings]
	);

	// Handler for path position updates
	const handlePathPositionUpdate = useCallback(
		(pathId: string, deltaX: number, deltaY: number) => {
			if (!onUpdateStylingSettings) return;

			const currentPaths = stylingSettings.drawnPaths || [];
			const pathIndex = currentPaths.findIndex((p) => p.id === pathId);
			if (pathIndex === -1) return;

			const updatedPaths = [...currentPaths];
			const path = updatedPaths[pathIndex];

			// Update all points in the path by the delta
			updatedPaths[pathIndex] = {
				...path,
				points: path.points.map((point) => ({
					...point,
					x: point.x + deltaX,
					y: point.y + deltaY,
					// Also update control points if they exist
					controlPoint1: point.controlPoint1
						? {
								x: point.controlPoint1.x + deltaX,
								y: point.controlPoint1.y + deltaY,
						  }
						: undefined,
					controlPoint2: point.controlPoint2
						? {
								x: point.controlPoint2.x + deltaX,
								y: point.controlPoint2.y + deltaY,
						  }
						: undefined,
				})),
			};

			onUpdateStylingSettings({
				...stylingSettings,
				drawnPaths: updatedPaths,
			});
		},
		[stylingSettings, onUpdateStylingSettings]
	);

	// Handler for individual path point updates (anchor point dragging)
	const handlePathPointUpdate = useCallback(
		(pathId: string, pointIndex: number, newX: number, newY: number) => {
			if (!onUpdateStylingSettings) return;

			const currentPaths = stylingSettings.drawnPaths || [];
			const pathIndex = currentPaths.findIndex((p) => p.id === pathId);
			if (pathIndex === -1) return;

			const updatedPaths = [...currentPaths];
			const path = updatedPaths[pathIndex];

			// Update the specific point
			const updatedPoints = [...path.points];
			if (pointIndex >= 0 && pointIndex < updatedPoints.length) {
				const oldPoint = updatedPoints[pointIndex];
				const deltaX = newX - oldPoint.x;
				const deltaY = newY - oldPoint.y;

				updatedPoints[pointIndex] = {
					...oldPoint,
					x: newX,
					y: newY,
					// Also update control points relative to the point movement
					controlPoint1: oldPoint.controlPoint1
						? {
								x: oldPoint.controlPoint1.x + deltaX,
								y: oldPoint.controlPoint1.y + deltaY,
						  }
						: undefined,
					controlPoint2: oldPoint.controlPoint2
						? {
								x: oldPoint.controlPoint2.x + deltaX,
								y: oldPoint.controlPoint2.y + deltaY,
						  }
						: undefined,
				};
			}

			updatedPaths[pathIndex] = {
				...path,
				points: updatedPoints,
			};

			onUpdateStylingSettings({
				...stylingSettings,
				drawnPaths: updatedPaths,
			});
		},
		[stylingSettings, onUpdateStylingSettings]
	);

	// Handler for label click (select tool)
	const handleLabelClick = useCallback(
		(labelId: string) => {
			if (activeTool === 'select') {
				setSelectedPathId(null);
				setSelectedLabelId(labelId);
			}
		},
		[activeTool, setSelectedLabelId, setSelectedPathId]
	);

	// Convert screen coordinates to SVG coordinates
	const getSVGCoordinates = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
		if (!svgRef.current) return { x: 0, y: 0 };

		const svg = svgRef.current;
		const rect = svg.getBoundingClientRect();
		const viewBox = svg.viewBox.baseVal;
		const scaleX = viewBox.width / rect.width;
		const scaleY = viewBox.height / rect.height;

		return {
			x: (clientX - rect.left) * scaleX,
			y: (clientY - rect.top) * scaleY,
		};
	}, []);

	// Finish path drawing
	const finishPath = useCallback(() => {
		// Dismiss the drawing toast
		if (drawingToastRef.current) {
			drawingToastRef.current.dismiss();
			drawingToastRef.current = null;
		}

		if (!isDrawing || currentPath.length < 2 || !onUpdateStylingSettings) {
			// Reset state even if path is too short
			setIsDrawing(false);
			setCurrentPath([]);
			setIsDragging(false);
			setDragStartPoint(null);
			setMousePosition(null);
			return;
		}

		const pathId = `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
		const defaultStyles = stylingSettings.defaultPathStyles || {
			stroke: '#000000',
			strokeWidth: 2,
			strokeLinecap: 'round' as const,
			strokeLinejoin: 'round' as const,
			fill: 'none',
			opacity: 1,
		};

		const newPath: DrawnPath = {
			id: pathId,
			points: [...currentPath],
			stroke: defaultStyles.stroke,
			strokeWidth: defaultStyles.strokeWidth,
			strokeLinecap: defaultStyles.strokeLinecap,
			strokeLinejoin: defaultStyles.strokeLinejoin,
			fill: defaultStyles.fill,
			opacity: defaultStyles.opacity,
		};

		const updatedPaths = [...(stylingSettings.drawnPaths || []), newPath];

		onUpdateStylingSettings({
			...stylingSettings,
			drawnPaths: updatedPaths,
		});

		// Reset all drawing state
		setIsDrawing(false);
		setCurrentPath([]);
		setIsDragging(false);
		setDragStartPoint(null);
		setMousePosition(null);
	}, [isDrawing, currentPath, stylingSettings, onUpdateStylingSettings]);

	// Handle mouse events for drawing
	useEffect(() => {
		if (!svgRef.current || activeTool !== 'draw' || !onUpdateStylingSettings || !mapVisible) return;

		const svg = svgRef.current;
		let localIsDrawing = isDrawing;
		let localIsDragging = isDragging;
		let localDragStartPoint = dragStartPoint;

		const handleMouseDown = (e: MouseEvent) => {
			if (e.button !== 0) return; // Only left mouse button
			e.preventDefault();
			e.stopPropagation();

			const coords = getSVGCoordinates(e.clientX, e.clientY);
			const shiftHeld = e.shiftKey;

			if (!localIsDrawing) {
				// Start new path
				localIsDrawing = true;
				setIsDrawing(true);
				const newPath: PathPoint[] = [{ x: coords.x, y: coords.y, type: 'line' as const }];
				setCurrentPath(newPath);
				setMousePosition(coords);

				// Start dragging to enable curve drawing
				localIsDragging = true;
				setIsDragging(true);
				localDragStartPoint = coords;
				setDragStartPoint(coords);

				// Show toast notification
				const toastResult = toast({
					description: (
						<span className="flex items-center gap-1">
							Press{' '}
							<kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-600 opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
								ENTER
							</kbd>{' '}
							to finish your path
						</span>
					),
					duration: Infinity, // Stay until dismissed
				});
				drawingToastRef.current = toastResult;
			} else {
				// Add point to current path
				setCurrentPath((prevPath) => {
					if (prevPath.length === 0) {
						const newPath: PathPoint[] = [{ x: coords.x, y: coords.y, type: 'line' as const }];
						return newPath;
					}

					const lastPoint = prevPath[prevPath.length - 1];
					let newPoint: PathPoint;

					if (shiftHeld) {
						// Constrain angle
						const constrained = constrainAngle(lastPoint.x, lastPoint.y, coords.x, coords.y, true);
						newPoint = { x: constrained.x, y: constrained.y, type: 'line' as const };
					} else {
						newPoint = { x: coords.x, y: coords.y, type: 'line' as const };
					}

					const updatedPath = [...prevPath, newPoint];
					return updatedPath;
				});
				setMousePosition(coords);

				// Start dragging for curve on next point
				localIsDragging = true;
				setIsDragging(true);
				localDragStartPoint = coords;
				setDragStartPoint(coords);
			}
		};

		const handleMouseMove = (e: MouseEvent) => {
			const coords = getSVGCoordinates(e.clientX, e.clientY);

			// Always update mouse position for preview line
			if (localIsDrawing) {
				setMousePosition(coords);
			}

			// Only update path if dragging
			if (!localIsDragging || !localIsDrawing) return;

			setCurrentPath((prevPath) => {
				if (prevPath.length === 0) {
					return prevPath;
				}

				const updated = [...prevPath];
				const lastIndex = updated.length - 1;
				const lastPoint = updated[lastIndex];

				// Calculate smoother curve control points using Catmull-Rom style interpolation
				if (prevPath.length > 1 && localDragStartPoint) {
					const prevPoint = prevPath[prevPath.length - 2];

					// Calculate direction from previous point to current drag start
					const dx1 = localDragStartPoint.x - prevPoint.x;
					const dy1 = localDragStartPoint.y - prevPoint.y;
					const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);

					// Calculate direction from drag start to current position
					const dx2 = coords.x - localDragStartPoint.x;
					const dy2 = coords.y - localDragStartPoint.y;
					const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

					// Use a tension value for smoothness (0.4 = smooth, 0 = sharp)
					const tension = 0.4;

					// Control points positioned along the direction vectors
					// Handle division by zero
					if (dist1 > 0.001 && dist2 > 0.001) {
						const cp1Distance = dist1 * tension;
						const cp2Distance = dist2 * tension;

						const cp1x = localDragStartPoint.x - (dx1 / dist1) * cp1Distance;
						const cp1y = localDragStartPoint.y - (dy1 / dist1) * cp1Distance;
						const cp2x = localDragStartPoint.x + (dx2 / dist2) * cp2Distance;
						const cp2y = localDragStartPoint.y + (dy2 / dist2) * cp2Distance;

						updated[lastIndex] = {
							x: coords.x,
							y: coords.y,
							type: 'curve' as const,
							controlPoint1: {
								x: cp1x,
								y: cp1y,
							},
							controlPoint2: {
								x: cp2x,
								y: cp2y,
							},
						};
					} else {
						// Fallback to straight line if distances are too small
						updated[lastIndex] = {
							...lastPoint,
							x: coords.x,
							y: coords.y,
							type: (lastPoint.type || 'line') as 'line' | 'curve',
						};
					}
				} else {
					updated[lastIndex] = {
						...lastPoint,
						x: coords.x,
						y: coords.y,
						type: (lastPoint.type || 'line') as 'line' | 'curve',
					};
				}

				return updated;
			});
		};

		const handleMouseUp = () => {
			localIsDragging = false;
			localDragStartPoint = null;
			setIsDragging(false);
			setDragStartPoint(null);
		};

		const handleDoubleClick = (e: MouseEvent) => {
			e.preventDefault();
			e.stopPropagation();
			// Finish path on double click - use currentPath from state to ensure we have latest
			if (localIsDrawing) {
				// Use setTimeout to ensure we read the latest state after React updates
				setTimeout(() => {
					setCurrentPath((latestPath) => {
						if (latestPath.length >= 2) {
							finishPath();
						}
						return latestPath;
					});
				}, 0);
			}
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't trigger if typing in an input
			const target = e.target as HTMLElement;
			if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

			if (e.key === 'Enter' && localIsDrawing) {
				e.preventDefault();
				setCurrentPath((latestPath) => {
					if (latestPath.length >= 2) {
						finishPath();
					}
					return latestPath;
				});
			} else if (e.key === 'Escape' && localIsDrawing) {
				e.preventDefault();
				// ESC completes the path if it has at least 2 points, otherwise cancels
				setCurrentPath((latestPath) => {
					if (latestPath.length >= 2) {
						finishPath();
					} else {
						// Dismiss toast when canceling
						if (drawingToastRef.current) {
							drawingToastRef.current.dismiss();
							drawingToastRef.current = null;
						}
						localIsDrawing = false;
						setIsDrawing(false);
						setCurrentPath([]);
						setIsDragging(false);
						setDragStartPoint(null);
						setMousePosition(null);
					}
					return latestPath;
				});
			}
		};

		svg.addEventListener('mousedown', handleMouseDown);
		svg.addEventListener('mousemove', handleMouseMove);
		svg.addEventListener('mouseup', handleMouseUp);
		svg.addEventListener('dblclick', handleDoubleClick);
		window.addEventListener('keydown', handleKeyDown);

		return () => {
			svg.removeEventListener('mousedown', handleMouseDown);
			svg.removeEventListener('mousemove', handleMouseMove);
			svg.removeEventListener('mouseup', handleMouseUp);
			svg.removeEventListener('dblclick', handleDoubleClick);
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [
		activeTool,
		isDrawing,
		isDragging,
		dragStartPoint,
		currentPath,
		getSVGCoordinates,
		finishPath,
		onUpdateStylingSettings,
		mapVisible,
	]);

	useEffect(() => {
		if (renderTarget !== 'svg') {
			return;
		}
		const hasCustomMap = customMapData && customMapData.trim().length > 0;
		if (!svgRef.current || !mapContainerRef.current) {
			return;
		}
		if (!hasCustomMap && !geoAtlasData) {
			return;
		}

		const svg = d3.select(svgRef.current);
		svg.selectAll('*').remove();

		// Determine what should be rendered
		const shouldRenderSymbols =
			symbolDataExists &&
			dimensionSettings?.symbol?.latitude &&
			dimensionSettings?.symbol?.longitude &&
			symbolData.length > 0 &&
			!customMapData;

		const shouldRenderChoropleth =
			choroplethDataExists &&
			dimensionSettings?.choropleth?.stateColumn &&
			choroplethData.length > 0 &&
			(isSetupPreview || dimensionSettings?.choropleth?.colorBy);

		const shouldApplyChoroplethColors =
			shouldRenderChoropleth && Boolean(dimensionSettings?.choropleth?.colorBy);

		// Calculate legend flags
		const shouldShowSymbolSizeLegend =
			shouldRenderSymbols &&
			dimensionSettings.symbol.sizeBy &&
			dimensionSettings.symbol.sizeMinValue !== dimensionSettings.symbol.sizeMaxValue;

		const shouldShowSymbolColorLegend = shouldRenderSymbols && dimensionSettings.symbol.colorBy;
		const shouldShowChoroplethColorLegend = shouldApplyChoroplethColors && dimensionSettings.choropleth.colorBy;

		const legendHeight = estimateLegendHeight({
			showSymbolSizeLegend: !!shouldShowSymbolSizeLegend,
			showSymbolColorLegend: !!shouldShowSymbolColorLegend,
			showChoroplethColorLegend: !!shouldShowChoroplethColorLegend,
		});

		const totalHeight = MAP_HEIGHT + legendHeight;

		// Set container background
		if (mapContainerRef.current) {
			mapContainerRef.current.style.backgroundColor = stylingSettings.base.mapBackgroundColor;
		}

		// Configure SVG
		svg
			.attr('viewBox', `0 0 ${MAP_WIDTH} ${totalHeight}`)
			.attr('width', '100%')
			.attr('height', '100%')
			.attr('style', 'max-width: 100%; height: auto;');

		// Render base map (custom SVG or TopoJSON)
		const { projection, path } = renderBaseMap({
			svg,
			width: MAP_WIDTH,
			mapHeight: MAP_HEIGHT,
			selectedProjection,
			selectedGeography,
			clipToCountry,
			customMapData,
			geoAtlasData,
			stylingSettings,
			toast,
			findCountryFeature,
			activeTool,
			onShowTooltip: (x: number, y: number, record: DataRecord) => {
				if (activeTool === 'inspect') {
					const mappedColumns = getMappedDimensionColumns(dimensionSettings, 'choropleth');
					const tooltipData = formatTooltipData(record, mappedColumns, columnTypes, columnFormats);
					setTooltipState({
						visible: true,
						x,
						y,
						content: (
							<div className="space-y-1">
								{tooltipData.map((item, index) => (
									<div key={index} className="flex gap-2 text-xs">
										<span className="font-medium text-muted-foreground">{item.column}:</span>
										<span className="text-foreground">{item.value}</span>
									</div>
								))}
							</div>
						),
					});
				}
			},
			onHideTooltip: () => {
				setTooltipState((prev) => ({ ...prev, visible: false }));
			},
			choroplethData: shouldRenderChoropleth ? choroplethData : undefined,
			dimensionSettings,
			normalizeGeoIdentifier,
			extractCandidateFromSVGId,
		});

		let symbolSizeScale: d3.ScaleLinear<number, number, never> | null = null;
		let symbolColorScale: ((value: unknown) => string) | null = null;
		let choroplethColorScale: ((value: unknown) => string) | null = null;

		// Render symbols if applicable
		if (shouldRenderSymbols) {
			const symbolResult = renderSymbols({
				svg,
				projection,
				symbolData,
				dimensionSettings,
				stylingSettings,
				getNumericValue,
				getUniqueValues,
				getSymbolPathData,
				activeTool,
				onShowTooltip: (x: number, y: number, record: DataRecord) => {
					if (activeTool === 'inspect') {
						const mappedColumns = getMappedDimensionColumns(dimensionSettings, 'symbol');
						const tooltipData = formatTooltipData(record, mappedColumns, columnTypes, columnFormats);
						setTooltipState({
							visible: true,
							x,
							y,
							content: (
								<div className="space-y-1">
									{tooltipData.map((item, index) => (
										<div key={index} className="flex gap-2 text-xs">
											<span className="font-medium text-muted-foreground">{item.column}:</span>
											<span className="text-foreground">{item.value}</span>
										</div>
									))}
								</div>
							),
						});
					}
				},
				onHideTooltip: () => {
					setTooltipState((prev) => ({ ...prev, visible: false }));
				},
			});
			symbolSizeScale = symbolResult.sizeScale;
			symbolColorScale = symbolResult.colorScale as ((value: unknown) => string) | null;

			renderSymbolText({
				svg,
				projection,
				symbolData: symbolResult.validSymbolData,
				dimensionSettings,
				stylingSettings,
				columnTypes,
				columnFormats,
				selectedGeography,
				sizeScale: symbolSizeScale,
				activeTool,
				onShowTooltip: (x: number, y: number, record: DataRecord) => {
					if (activeTool === 'inspect') {
						const mappedColumns = getMappedDimensionColumns(dimensionSettings, 'symbol');
						const tooltipData = formatTooltipData(record, mappedColumns, columnTypes, columnFormats);
						setTooltipState({
							visible: true,
							x,
							y,
							content: (
								<div className="space-y-1">
									{tooltipData.map((item, index) => (
										<div key={index} className="flex gap-2 text-xs">
											<span className="font-medium text-muted-foreground">{item.column}:</span>
											<span className="text-foreground">{item.value}</span>
										</div>
									))}
								</div>
							),
						});
					}
				},
				onHideTooltip: () => {
					setTooltipState((prev) => ({ ...prev, visible: false }));
				},
				onLabelPositionUpdate: handleLabelPositionUpdate,
				onLabelClick: handleLabelClick,
			});

			// Render symbol labels
			renderSymbolLabels({
				svg,
				projection,
				width: MAP_WIDTH,
				height: MAP_HEIGHT,
				symbolData: symbolResult.validSymbolData,
				dimensionSettings,
				stylingSettings,
				columnTypes,
				columnFormats,
				selectedGeography,
				sizeScale: symbolSizeScale,
				renderLabelPreview,
				getSymbolPathData,
				activeTool,
				onShowTooltip: (x: number, y: number, record: DataRecord) => {
					if (activeTool === 'inspect') {
						const mappedColumns = getMappedDimensionColumns(dimensionSettings, 'symbol');
						const tooltipData = formatTooltipData(record, mappedColumns, columnTypes, columnFormats);
						setTooltipState({
							visible: true,
							x,
							y,
							content: (
								<div className="space-y-1">
									{tooltipData.map((item, index) => (
										<div key={index} className="flex gap-2 text-xs">
											<span className="font-medium text-muted-foreground">{item.column}:</span>
											<span className="text-foreground">{item.value}</span>
										</div>
									))}
								</div>
							),
						});
					}
				},
				onHideTooltip: () => {
					setTooltipState((prev) => ({ ...prev, visible: false }));
				},
				onLabelPositionUpdate: handleLabelPositionUpdate,
				onLabelClick: handleLabelClick,
			});
		}

		// Apply choropleth colors if applicable
		if (shouldApplyChoroplethColors) {
			const choroplethScaleResult = applyChoroplethColors({
				svg,
				choroplethData,
				dimensionSettings,
				stylingSettings,
				columnTypes,
				columnFormats,
				selectedGeography,
				customMapData,
				normalizeGeoIdentifier,
				extractCandidateFromSVGId,
				getNumericValue,
				getUniqueValues,
			});
			if (choroplethScaleResult) {
				// Check if it's a categorical scale (function) or linear scale (d3 scale)
				const isCategorical = 'domain' in choroplethScaleResult === false;
				if (isCategorical && typeof choroplethScaleResult === 'function') {
					// Categorical scale
					choroplethColorScale = choroplethScaleResult as (value: unknown) => string;
				} else {
					// Linear scale - wrap it
					const linearScale = choroplethScaleResult as d3.ScaleLinear<number, string, never>;
					choroplethColorScale = ((value: unknown) => {
						const numValue = typeof value === 'number' ? value : Number(value);
						if (!Number.isNaN(numValue)) {
							return linearScale(numValue);
						}
						return String(value);
					}) as (value: unknown) => string;
				}
			} else {
				choroplethColorScale = null;
			}

			// Render choropleth labels
			renderChoroplethLabels({
				svg,
				path,
				projection,
				choroplethData,
				dimensionSettings,
				stylingSettings,
				columnTypes,
				columnFormats,
				selectedGeography,
				mapType,
				geoAtlasData,
				customMapData,
				normalizeGeoIdentifier,
				extractCandidateFromSVGId,
				getSubnationalLabel,
				renderLabelPreview,
				findCountryFeature,
				activeTool,
				onShowTooltip: (x: number, y: number, record: DataRecord) => {
					if (activeTool === 'inspect') {
						const mappedColumns = getMappedDimensionColumns(dimensionSettings, 'choropleth');
						const tooltipData = formatTooltipData(record, mappedColumns, columnTypes, columnFormats);
						setTooltipState({
							visible: true,
							x,
							y,
							content: (
								<div className="space-y-1">
									{tooltipData.map((item, index) => (
										<div key={index} className="flex gap-2 text-xs">
											<span className="font-medium text-muted-foreground">{item.column}:</span>
											<span className="text-foreground">{item.value}</span>
										</div>
									))}
								</div>
							),
						});
					}
				},
				onHideTooltip: () => {
					setTooltipState((prev) => ({ ...prev, visible: false }));
				},
				onLabelPositionUpdate: handleLabelPositionUpdate,
				onLabelClick: handleLabelClick,
			});
		}

		// Render legends
		renderLegends({
			svg,
			width: MAP_WIDTH,
			mapHeight: MAP_HEIGHT,
			showSymbolSizeLegend: !!shouldShowSymbolSizeLegend,
			showSymbolColorLegend: !!shouldShowSymbolColorLegend,
			showChoroplethColorLegend: !!shouldShowChoroplethColorLegend,
			dimensionSettings,
			stylingSettings,
			columnTypes,
			columnFormats,
			selectedGeography,
			symbolData: shouldRenderSymbols ? symbolData : [],
			choroplethData: shouldRenderChoropleth ? choroplethData : [],
			symbolColorScale,
			choroplethColorScale,
			getUniqueValues,
			formatLegendValue,
			getSymbolPathData,
		});

		// Render drawn paths
		renderDrawnPaths({
			svg,
			drawnPaths: stylingSettings.drawnPaths || [],
			defaultStyles: stylingSettings.defaultPathStyles,
			activeTool,
			selectedPathId,
			onPathClick: (pathId: string) => {
				if (activeTool === 'select') {
					setSelectedLabelId(null);
					setSelectedPathId(pathId);
				}
			},
			onPathPositionUpdate: handlePathPositionUpdate,
			onPathPointUpdate: handlePathPointUpdate,
		});
	}, [
		geoAtlasData,
		symbolData,
		choroplethData,
		mapType,
		dimensionSettings,
		stylingSettings,
		symbolDataExists,
		choroplethDataExists,
		columnTypes,
		columnFormats,
		customMapData,
		selectedGeography,
		selectedProjection,
		clipToCountry,
		toast,
		activeTool,
		handleLabelPositionUpdate,
		handleLabelClick,
		handlePathPointUpdate,
		selectedPathId,
		renderTarget,
	]);

	// Path drawing preview — isolated so mouse moves don't rebuild the full map
	useEffect(() => {
		if (!svgRef.current) return;
		const svg = d3.select(svgRef.current);
		renderPathPreview({
			svg,
			isDrawing,
			currentPath,
			mousePosition,
			isDragging,
			dragStartPoint,
			defaultPathStyles: stylingSettings.defaultPathStyles,
		});
	}, [isDrawing, currentPath, mousePosition, isDragging, dragStartPoint, stylingSettings.defaultPathStyles]);

	useEffect(() => {
		const handler = () => setIsExpanded(false);
		window.addEventListener('collapse-all-panels', handler);
		return () => window.removeEventListener('collapse-all-panels', handler);
	}, [setIsExpanded]);

	// Keyboard shortcuts for tool switching
	useEffect(() => {
		if (!mapVisible) return;

		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't trigger shortcuts if user is typing in an input, textarea, or contenteditable element
			const target = e.target as HTMLElement;
			const isInputElement = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

			if (isInputElement) return;

			// Check for modifier keys - shortcuts should work without modifiers
			if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;

			switch (e.key.toLowerCase()) {
				case 'i':
					e.preventDefault();
					setActiveTool('inspect');
					break;
				case 'v':
					e.preventDefault();
					setActiveTool('select');
					break;
				case 'm':
					e.preventDefault();
					setActiveTool('move');
					break;
				case 'p':
					e.preventDefault();
					setActiveTool('draw');
					break;
			}
		};

		window.addEventListener('keydown', handleKeyDown);
		return () => {
			window.removeEventListener('keydown', handleKeyDown);
		};
	}, [mapVisible]);

	const handleDownloadSVG = () => {
		if (!svgRef.current) return;

		try {
			const svgElement = svgRef.current;
			const serializer = new XMLSerializer();
			const svgString = serializer.serializeToString(svgElement);

			const blob = new Blob([svgString], { type: 'image/svg+xml' });
			const url = URL.createObjectURL(blob);

			const link = document.createElement('a');
			link.href = url;
			link.download = 'map.svg';
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			URL.revokeObjectURL(url);

			toast({
				icon: <Download className="h-4 w-4" />,
				description: 'SVG downloaded successfully.',
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
	};

	const handleCopySVG = async () => {
		if (!svgRef.current) return;

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
	};

	// Generate accessible map description
	const mapDescription = generateMapDescription({
		mapType,
		geography: selectedGeography,
		symbolDataCount: symbolData.length,
		choroplethDataCount: choroplethData.length,
		hasSymbolSizeMapping: !!dimensionSettings.symbol.sizeBy,
		hasSymbolColorMapping: !!dimensionSettings.symbol.colorBy,
		hasChoroplethColorMapping: !!dimensionSettings.choropleth.colorBy,
		symbolSizeColumn: dimensionSettings.symbol.sizeBy,
		symbolColorColumn: dimensionSettings.symbol.colorBy,
		choroplethColorColumn: dimensionSettings.choropleth.colorBy,
	});

	const mapSummary = generateMapSummary({
		mapType,
		geography: selectedGeography,
		symbolDataCount: symbolData.length,
		choroplethDataCount: choroplethData.length,
		hasSymbolSizeMapping: !!dimensionSettings.symbol.sizeBy,
		hasSymbolColorMapping: !!dimensionSettings.symbol.colorBy,
		hasChoroplethColorMapping: !!dimensionSettings.choropleth.colorBy,
	});

	const mapId = `map-preview-${selectedGeography}`;

	if (renderTarget === 'svg' && isLoading) {
		return (
			<Card className="studio-panel-flat w-full h-full flex flex-col">
				{!isHeroLayout ? (
					<StudioExpandableHeader title="Map preview" isExpanded={true} onToggle={() => {}} collapsible={false} />
				) : null}
				<CardContent className="px-0 py-0 flex-1">
					<div className="flex items-center justify-center h-64" role="status" aria-live="polite">
						<div className="text-sm text-muted-foreground">Loading map data…</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	const mapHeaderActions = (
		<TooltipProvider delayDuration={300}>
			{onRenderTargetChange ? (
				<RenderTargetToggle value={renderTarget} onChange={onRenderTargetChange} />
			) : null}
			{onToggleFocusMode ? (
				<Tooltip>
					<TooltipTrigger asChild>
						<Button
							variant="outline"
							size="sm"
							className={studioHeaderIconButtonClass}
							onClick={onToggleFocusMode}
							aria-label={isFocusMode ? 'Exit focus mode' : 'Expand map preview'}>
							{isFocusMode ? (
								<Minimize2 className="h-4 w-4" aria-hidden />
							) : (
								<Maximize2 className="h-4 w-4" aria-hidden />
							)}
						</Button>
					</TooltipTrigger>
					<TooltipContent side="bottom">{isFocusMode ? 'Show inspector' : 'Focus map'}</TooltipContent>
				</Tooltip>
			) : null}
			{!isHeroLayout && renderTarget === 'svg' ? (
				<>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className={studioHeaderIconButtonClass}
								onClick={handleCopySVG}
								aria-label="Copy SVG to clipboard for use in Figma">
								<Copy className="h-4 w-4" aria-hidden />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">Copy to Figma</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className={studioHeaderIconButtonClass}
								onClick={handleDownloadSVG}
								aria-label="Download map as SVG file">
								<Download className="h-4 w-4" aria-hidden />
							</Button>
						</TooltipTrigger>
						<TooltipContent side="bottom">Download SVG</TooltipContent>
					</Tooltip>
				</>
			) : null}
		</TooltipProvider>
	);

	return (
		<Card className={cn('studio-panel-flat w-full h-full flex flex-col', mapVisible ? 'overflow-visible' : 'overflow-hidden')}>
			{isHeroLayout ? null : (
				<StudioExpandableHeader
					title="Map preview"
					isExpanded={mapVisible}
					onToggle={() => setIsExpanded(!isExpanded)}
					actions={mapHeaderActions}
					collapsible={mapPanelCollapsible}
				/>
			)}
			<CardContent
				className={cn('transition-all duration-200 p-0', mapVisible ? 'flex-1 min-h-0' : 'h-0 overflow-hidden')}
				id={mapId}
				aria-hidden={!mapVisible}>
				<div
					ref={mapContainerRef}
					className="w-full h-full overflow-visible relative pr-14"
					style={{
						backgroundColor: stylingSettings.base.mapBackgroundColor,
						userSelect: activeTool === 'move' || activeTool === 'draw' ? 'none' : 'auto',
						WebkitUserSelect: activeTool === 'move' || activeTool === 'draw' ? 'none' : 'auto',
						cursor: activeTool === 'draw' ? 'crosshair' : activeTool === 'move' ? 'move' : 'default',
					}}
					onMouseDown={(e) => {
						if (activeTool === 'move') {
							e.preventDefault();
						}
					}}
					onClick={(e) => {
						if (activeTool !== 'select') return;
						const target = e.target as Element;
						if (target.closest('[data-label-id]') || target.closest('[data-path-id]')) return;
						if (target.closest('svg')) {
							setSelectedLabelId(null);
							setSelectedPathId(null);
						}
					}}>
					{isHeroLayout ? (
						<div className="absolute top-3 right-3 z-50 flex items-center gap-1.5">{mapHeaderActions}</div>
					) : null}
					{showMapLibre ? (
						<div className="relative h-full min-h-[420px] w-full">
							<MapLibrePreview
								mapType={mapType}
								symbolData={symbolData}
								choroplethData={choroplethData}
								dimensionSettings={dimensionSettings}
								stylingSettings={stylingSettings}
								boundaryConfig={boundaryConfig!}
								columnTypes={columnTypes}
								columnFormats={columnFormats}
								activeTool={activeTool}
								maplibreConfig={{
									...maplibreConfig!,
									interactivity: {
										...maplibreConfig!.interactivity,
										allowPan: isInteractiveCanvas
											? activeTool === 'move'
											: maplibreConfig!.interactivity.allowPan,
										allowZoom: true,
									},
								}}
								selectedGeography={selectedGeography}
								previewContext={previewContext}
							/>
							{mapVisible && isInteractiveCanvas && isSetupPreview && (
								<MapControlBar
									activeTool={activeTool}
									onToolChange={setActiveTool}
									tools={['move', 'inspect']}
								/>
							)}
							{mapVisible && isInteractiveCanvas && !isSetupPreview && (
								<MapControlBar activeTool={activeTool} onToolChange={setActiveTool} />
							)}
							{enabledReferenceLayerLabels.length > 0 ? (
								<div className="pointer-events-none absolute bottom-3 left-3 z-40 max-w-sm rounded-md border border-border bg-background/95 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
									Context layers enabled ({enabledReferenceLayerLabels.join(', ')}) — map overlay rendering coming soon.
								</div>
							) : null}
						</div>
					) : renderTarget === 'maplibre' ? (
						<div className="flex h-full min-h-[420px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
							MapLibre canvas supports symbol and choropleth maps. Configure dimension mapping or switch to the SVG canvas.
						</div>
					) : (
						<>
					<svg
						ref={svgRef}
						className="relative z-0 w-full h-full"
						role="img"
						aria-label={mapSummary}
						aria-describedby={`${mapId}-description`}
						style={{
							userSelect: activeTool === 'move' || activeTool === 'draw' ? 'none' : 'auto',
							WebkitUserSelect: activeTool === 'move' || activeTool === 'draw' ? 'none' : 'auto',
							cursor: activeTool === 'draw' ? 'crosshair' : activeTool === 'move' ? 'move' : 'default',
						}}
					/>
					<div id={`${mapId}-description`} className="sr-only">
						{mapDescription}
					</div>
					{mapVisible && !isSetupPreview && (
						<MapControlBar activeTool={activeTool} onToolChange={setActiveTool} />
					)}
					{mapVisible && isInteractiveSetup && (
						<MapControlBar
							activeTool={activeTool}
							onToolChange={setActiveTool}
							tools={['move', 'inspect']}
						/>
					)}
					{isSetupPreview && enabledReferenceLayerLabels.length > 0 ? (
						<div className="pointer-events-none absolute bottom-3 left-3 z-40 max-w-sm rounded-md border border-border bg-background/95 px-3 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur-sm">
							Context layers enabled ({enabledReferenceLayerLabels.join(', ')}) — map overlay rendering coming soon.
						</div>
					) : null}
					<MapTooltip
						x={tooltipState.x}
						y={tooltipState.y}
						content={tooltipState.content}
						visible={tooltipState.visible}
						svgElement={svgRef.current}
					/>
					{mapVisible && !embedEditorsInSidebar && selectedLabelId && (
						<LabelEditorToolbar
							labelId={selectedLabelId}
							onClose={() => {
								setSelectedLabelId(null);
							}}
							stylingSettings={stylingSettings}
							onUpdateStylingSettings={onUpdateStylingSettings || (() => {})}
							mapType={resolveLabelMapType(selectedLabelId)}
							dimensionSettings={dimensionSettings}
							symbolData={symbolData}
							choroplethData={choroplethData}
							columnTypes={columnTypes}
							columnFormats={columnFormats}
							selectedGeography={selectedGeography}
							variant="floating"
						/>
					)}
					{mapVisible && !embedEditorsInSidebar && selectedPathId && (
						<PathEditorToolbar
							pathId={selectedPathId}
							onClose={() => {
								setSelectedPathId(null);
							}}
							stylingSettings={stylingSettings}
							onUpdateStylingSettings={onUpdateStylingSettings || (() => {})}
							variant="floating"
						/>
					)}
						</>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
