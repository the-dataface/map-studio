'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';

import type {
	ColumnFormat,
	ColumnType,
	DataRow,
	DimensionSettings,
	GeocodedRow,
	GeographyKey,
	MapType,
	ProjectionType,
	StylingSettings,
} from '@/app/(studio)/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Download, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { formatLegendValue, renderLabelPreview } from '@/modules/data-ingest/formatting';
import { useGeoAtlasData } from '@/modules/map-preview/use-geo-atlas';
import { renderBaseMap } from '@/modules/map-preview/base-map';
import { renderSymbols } from '@/modules/map-preview/symbols';
import { applyChoroplethColors } from '@/modules/map-preview/choropleth';
import { renderSymbolLabels, renderChoroplethLabels } from '@/modules/map-preview/labels';
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
import { renderDrawnPaths, constrainAngle, pathPointsToSVGPath } from '@/modules/map-preview/paths';
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
	svgRef?: React.RefObject<SVGSVGElement>;
	onCopySVG?: () => Promise<void>;
	onUpdateStylingSettings?: (settings: StylingSettings) => void;
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
	svgRef: externalSvgRef,
	onUpdateStylingSettings,
}: MapPreviewProps) {
	const internalSvgRef = useRef<SVGSVGElement>(null);
	const svgRef = externalSvgRef || internalSvgRef;
	const mapContainerRef = useRef<HTMLDivElement>(null);
	const { toast } = useToast();
	const [activeTool, setActiveTool] = useState<MapTool>('inspect');
	const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
	const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
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

	// Hide tooltips when switching tools
	useEffect(() => {
		if (activeTool !== 'inspect') {
			setTooltipState((prev) => ({ ...prev, visible: false }));
		}
	}, [activeTool]);
	const { geoAtlasData, isLoading } = useGeoAtlasData({
		selectedGeography,
		notify: (options) => {
			toast(options as Parameters<typeof toast>[0]);
		},
	});

	// Handler for label position updates
	const handleLabelPositionUpdate = useCallback(
		(labelId: string, x: number, y: number) => {
			if (!onUpdateStylingSettings) return;

			const currentOverrides = stylingSettings.individualLabelOverrides || {};
			const updatedOverrides = {
				...currentOverrides,
				[labelId]: {
					...currentOverrides[labelId],
					id: labelId,
					x,
					y,
				},
			};

			onUpdateStylingSettings({
				...stylingSettings,
				individualLabelOverrides: updatedOverrides,
			});
		},
		[stylingSettings, onUpdateStylingSettings]
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
				setSelectedLabelId(labelId);

				// Label editor will be shown via selectedLabelId state
			}
		},
		[activeTool]
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
		if (!svgRef.current || activeTool !== 'draw' || !onUpdateStylingSettings || !isExpanded) return;

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
		isExpanded,
	]);

	useEffect(() => {
		if (!svgRef.current || !mapContainerRef.current || !geoAtlasData) {
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
			dimensionSettings?.choropleth?.colorBy &&
			choroplethData.length > 0;

		// Calculate legend flags
		const shouldShowSymbolSizeLegend =
			shouldRenderSymbols &&
			dimensionSettings.symbol.sizeBy &&
			dimensionSettings.symbol.sizeMinValue !== dimensionSettings.symbol.sizeMaxValue;

		const shouldShowSymbolColorLegend = shouldRenderSymbols && dimensionSettings.symbol.colorBy;
		const shouldShowChoroplethColorLegend = shouldRenderChoropleth && dimensionSettings.choropleth.colorBy;

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
		if (shouldRenderChoropleth) {
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
					setSelectedPathId(pathId);
				}
			},
			onPathPositionUpdate: handlePathPositionUpdate,
			onPathPointUpdate: handlePathPointUpdate,
		});

		// Render current path being drawn (preview)
		if (isDrawing && currentPath.length > 0) {
			const previewGroup = svg.select<SVGGElement>('#PathPreview').empty()
				? svg.append('g').attr('id', 'PathPreview')
				: svg.select<SVGGElement>('#PathPreview');

			const defaultStyles = stylingSettings.defaultPathStyles || {
				stroke: '#000000',
				strokeWidth: 2,
				strokeLinecap: 'round' as const,
				strokeLinejoin: 'round' as const,
				fill: 'none',
				opacity: 1,
			};

			// Render anchor points (circles at each clicked point)
			const anchorPoints = currentPath.filter((p) => p.type === 'line' || !p.type);
			previewGroup
				.selectAll<SVGCircleElement, PathPoint>('circle.anchor-point')
				.data(anchorPoints, (d, i) => `anchor-${i}`)
				.join(
					(enter) =>
						enter
							.append('circle')
							.attr('class', 'anchor-point')
							.attr('cx', (d) => d.x)
							.attr('cy', (d) => d.y)
							.attr('r', 4)
							.attr('fill', defaultStyles.stroke)
							.attr('stroke', '#ffffff')
							.attr('stroke-width', 1.5)
							.style('pointer-events', 'none'),
					(update) => update.attr('cx', (d) => d.x).attr('cy', (d) => d.y),
					(exit) => exit.remove()
				);

			// Render the path so far
			const pathData = pathPointsToSVGPath(currentPath);
			previewGroup
				.selectAll<SVGPathElement, PathPoint[]>('path.current-path')
				.data([currentPath])
				.join('path')
				.attr('class', 'current-path')
				.attr('d', pathData)
				.attr('stroke', defaultStyles.stroke)
				.attr('stroke-width', defaultStyles.strokeWidth)
				.attr('stroke-linecap', defaultStyles.strokeLinecap || 'round')
				.attr('stroke-linejoin', defaultStyles.strokeLinejoin || 'round')
				.attr('fill', defaultStyles.fill || 'none')
				.attr('opacity', (defaultStyles.opacity || 1) * 0.7)
				.style('pointer-events', 'none');

			// Render preview line from last point to mouse position
			if (mousePosition && currentPath.length > 0) {
				const lastPoint = currentPath[currentPath.length - 1];
				let previewLineData: string;

				// If dragging, show curve preview; otherwise show straight line
				if (isDragging && dragStartPoint && currentPath.length > 0) {
					// Calculate curve control points similar to handleMouseMove
					const prevPoint = currentPath.length > 1 ? currentPath[currentPath.length - 2] : lastPoint;
					const dx1 = dragStartPoint.x - prevPoint.x;
					const dy1 = dragStartPoint.y - prevPoint.y;
					const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
					const dx2 = mousePosition.x - dragStartPoint.x;
					const dy2 = mousePosition.y - dragStartPoint.y;
					const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
					const tension = 0.4;

					if (dist1 > 0.001 && dist2 > 0.001) {
						const cp1Distance = dist1 * tension;
						const cp2Distance = dist2 * tension;
						const cp1x = dragStartPoint.x - (dx1 / dist1) * cp1Distance;
						const cp1y = dragStartPoint.y - (dy1 / dist1) * cp1Distance;
						const cp2x = dragStartPoint.x + (dx2 / dist2) * cp2Distance;
						const cp2y = dragStartPoint.y + (dy2 / dist2) * cp2Distance;
						previewLineData = `M ${lastPoint.x} ${lastPoint.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${mousePosition.x} ${mousePosition.y}`;
					} else {
						previewLineData = `M ${lastPoint.x} ${lastPoint.y} L ${mousePosition.x} ${mousePosition.y}`;
					}
				} else {
					previewLineData = `M ${lastPoint.x} ${lastPoint.y} L ${mousePosition.x} ${mousePosition.y}`;
				}

				previewGroup
					.selectAll<SVGPathElement, { x: number; y: number }>('path.preview-line')
					.data([mousePosition])
					.join('path')
					.attr('class', 'preview-line')
					.attr('d', previewLineData)
					.attr('stroke', defaultStyles.stroke)
					.attr('stroke-width', defaultStyles.strokeWidth)
					.attr('stroke-linecap', defaultStyles.strokeLinecap || 'round')
					.attr('stroke-dasharray', '4 4')
					.attr('fill', 'none')
					.attr('opacity', (defaultStyles.opacity || 1) * 0.5)
					.style('pointer-events', 'none');
			} else {
				previewGroup.selectAll('path.preview-line').remove();
			}
		} else {
			svg.select('#PathPreview').remove();
		}
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
		isDrawing,
		currentPath,
		mousePosition,
		isDragging,
		dragStartPoint,
		selectedPathId,
	]);

	useEffect(() => {
		const handler = () => setIsExpanded(false);
		window.addEventListener('collapse-all-panels', handler);
		return () => window.removeEventListener('collapse-all-panels', handler);
	}, [setIsExpanded]);

	// Keyboard shortcuts for tool switching
	useEffect(() => {
		if (!isExpanded) return;

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
	}, [isExpanded]);

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

	if (isLoading) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Map Preview</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-64" role="status" aria-live="polite">
						<div className="text-muted-foreground">Loading map data...</div>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className="shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden">
			<CardHeader
				className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out py-4 px-6 rounded-t-xl relative"
				onClick={() => setIsExpanded(!isExpanded)}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault();
						setIsExpanded(!isExpanded);
					}
				}}
				role="button"
				tabIndex={0}
				aria-expanded={isExpanded}
				aria-controls={mapId}>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<CardTitle className="text-gray-900 dark:text-white transition-colors duration-200">Map preview</CardTitle>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							className={cn(
								'flex items-center gap-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700',
								'group'
							)}
							onClick={(e) => {
								e.stopPropagation();
								handleCopySVG();
							}}
							aria-label="Copy SVG to clipboard for use in Figma">
							<Copy
								className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1"
								aria-hidden="true"
							/>
							<span className="sr-only">Copy to Figma</span>
							<span aria-hidden="true">Copy to Figma</span>
						</Button>
						<Button
							variant="outline"
							size="sm"
							className={cn(
								'flex items-center gap-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700',
								'group'
							)}
							onClick={(e) => {
								e.stopPropagation();
								handleDownloadSVG();
							}}
							aria-label="Download map as SVG file">
							<Download
								className="h-3 w-3 transition-transform duration-300 group-hover:translate-y-1"
								aria-hidden="true"
							/>
							<span className="sr-only">Download SVG</span>
							<span aria-hidden="true">Download SVG</span>
						</Button>
						{isExpanded ? (
							<ChevronUp className="h-4 w-4" aria-hidden="true" />
						) : (
							<ChevronDown className="h-4 w-4" aria-hidden="true" />
						)}
					</div>
				</div>
			</CardHeader>
			<CardContent
				className={cn('transition-all duration-200', isExpanded ? 'pb-6 pt-2' : 'pb-0 h-0 overflow-hidden')}
				id={mapId}
				aria-hidden={!isExpanded}>
				<div
					ref={mapContainerRef}
					className="w-full border rounded-lg overflow-visible relative"
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
					}}>
					<svg
						ref={svgRef}
						className="w-full h-full"
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
					{isExpanded && <MapControlBar activeTool={activeTool} onToolChange={setActiveTool} />}
					<MapTooltip
						x={tooltipState.x}
						y={tooltipState.y}
						content={tooltipState.content}
						visible={tooltipState.visible}
						svgElement={svgRef.current}
					/>
					{isExpanded && selectedLabelId && (
						<LabelEditorToolbar
							labelId={selectedLabelId}
							onClose={() => {
								setSelectedLabelId(null);
							}}
							stylingSettings={stylingSettings}
							onUpdateStylingSettings={onUpdateStylingSettings || (() => {})}
							mapType={selectedLabelId.startsWith('symbol-') ? 'symbol' : 'choropleth'}
						/>
					)}
					{isExpanded && selectedPathId && (
						<PathEditorToolbar
							pathId={selectedPathId}
							onClose={() => {
								setSelectedPathId(null);
							}}
							stylingSettings={stylingSettings}
							onUpdateStylingSettings={onUpdateStylingSettings || (() => {})}
						/>
					)}
				</div>
			</CardContent>
		</Card>
	);
}
