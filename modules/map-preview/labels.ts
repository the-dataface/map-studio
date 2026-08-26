import * as d3 from 'd3';
import * as topojson from 'topojson-client';

import type {
	ColumnFormat,
	ColumnType,
	DataRow,
	DimensionSettings,
	GeocodedRow,
	GeographyKey,
	IndividualLabelOverride,
	MapType,
	StylingSettings,
	SymbolLabelAlignment,
} from '@/app/(studio)/types';
import { resolveLabelRenderText } from '@/lib/label-content';
import {
	getSymbolTextLabelId,
	getSymbolTextStyling,
	resolveSymbolTextRenderText,
} from '@/lib/symbol-text-content';
import type { MapTool } from '@/components/map-control-bar';
import type { TopoJSONData } from './types';

type DataRecord = DataRow | GeocodedRow;

type SvgSelection = d3.Selection<SVGSVGElement, unknown, null, undefined>;

type SymbolPathGetter = (
	type: StylingSettings['symbol']['symbolType'],
	shape: StylingSettings['symbol']['symbolShape'],
	size: number,
	customSvgPath?: string
) => { pathData: string; transform: string; fillRule?: string };

type LabelFormatter = (
	template: string,
	record: DataRecord,
	columnTypes: ColumnType,
	columnFormats: ColumnFormat,
	selectedGeography: GeographyKey
) => string;

type NormaliseFn = (value: string, geography: GeographyKey) => string;

type ExtractIdFn = (id: string) => string | null;

type SubnationalLabelFn = (geography: GeographyKey | string, plural?: boolean) => string;

type CountryFinder = (features: any[], candidates: (string | number)[]) => any;

type GeoPath = d3.GeoPath<any, d3.GeoPermissibleObjects>;

type Projection = d3.GeoProjection;

type ScaleLinear = d3.ScaleLinear<number, number, never>;

interface SymbolLabelParams {
	svg: SvgSelection;
	projection: Projection;
	width: number;
	height: number;
	symbolData: DataRecord[];
	dimensionSettings: DimensionSettings;
	stylingSettings: StylingSettings;
	columnTypes: ColumnType;
	columnFormats: ColumnFormat;
	selectedGeography: GeographyKey;
	sizeScale: ScaleLinear | null;
	renderLabelPreview: LabelFormatter;
	getSymbolPathData: SymbolPathGetter;
	activeTool?: MapTool;
	onShowTooltip?: (x: number, y: number, record: DataRecord) => void;
	onHideTooltip?: () => void;
	onLabelPositionUpdate?: (labelId: string, x: number, y: number) => void;
	onLabelClick?: (labelId: string) => void;
}

export const renderSymbolLabels = ({
	svg,
	projection,
	width,
	height,
	symbolData,
	dimensionSettings,
	stylingSettings,
	columnTypes,
	columnFormats,
	selectedGeography,
	sizeScale,
	renderLabelPreview,
	getSymbolPathData,
	activeTool = 'inspect',
	onShowTooltip,
	onHideTooltip,
	onLabelPositionUpdate,
	onLabelClick,
}: SymbolLabelParams) => {
	if (!dimensionSettings.symbol.labelTemplate) {
		return;
	}

	const symbolLabelGroup = svg.append('g').attr('id', 'SymbolLabels');

	const labels = symbolLabelGroup
		.selectAll('text')
		.data(symbolData)
		.join('text')
		.each(function (record, index) {
			const textElement = d3.select(this);
			const labelId = `symbol-${index}`;
			const lat = Number(record[dimensionSettings.symbol.latitude]);
			const lng = Number(record[dimensionSettings.symbol.longitude]);
			const projected = projection([lng, lat]);

			if (!projected) {
				return;
			}

			const labelText = resolveLabelRenderText({
				labelId,
				mapType: 'symbol',
				dimensionSettings,
				stylingSettings,
				symbolData,
				choroplethData: [],
				columnTypes,
				columnFormats,
				selectedGeography,
			});

			if (!labelText) {
				return;
			}

			const size = sizeScale
				? sizeScale(evalNumeric(record, dimensionSettings.symbol.sizeBy) || 0)
				: stylingSettings.symbol.symbolSize;

			// Check for overrides
			const override = stylingSettings.individualLabelOverrides?.[labelId];

			// Apply style overrides if they exist, otherwise use defaults
			const fontFamily = override?.fontFamily
				? mapFontFamilyForSVG(override.fontFamily)
				: mapFontFamilyForSVG(stylingSettings.symbol.labelFontFamily);
			const fontSize = override?.fontSize ?? stylingSettings.symbol.labelFontSize;
			const fill = override?.fill ?? stylingSettings.symbol.labelColor;
			const stroke = override?.stroke ?? stylingSettings.symbol.labelOutlineColor;
			const strokeWidth = override?.strokeWidth ?? stylingSettings.symbol.labelOutlineThickness;

			// Update baseStyles with override values
			// IMPORTANT: If override exists and has fontWeight/fontStyle, use them even if 'normal'
			// This ensures that explicitly set 'normal' values override defaults
			const getTextDecorationFromOverride = () => {
				if (override?.textDecoration !== undefined) {
					return override.textDecoration;
				}
				return getTextDecoration(stylingSettings.symbol.labelUnderline, stylingSettings.symbol.labelStrikethrough);
			};
			const overrideBaseStyles = {
				fontWeight:
					override && override.fontWeight !== undefined
						? override.fontWeight
						: stylingSettings.symbol.labelBold
						? 'bold'
						: 'normal',
				fontStyle:
					override && override.fontStyle !== undefined
						? override.fontStyle
						: stylingSettings.symbol.labelItalic
						? 'italic'
						: 'normal',
				textDecoration: getTextDecorationFromOverride(),
			};

			textElement
				.attr('font-family', fontFamily)
				.attr('font-size', `${fontSize}px`)
				.attr('font-weight', overrideBaseStyles.fontWeight)
				.attr('font-style', overrideBaseStyles.fontStyle)
				.attr('fill', fill)
				.attr('stroke', stroke)
				.attr('stroke-width', strokeWidth)
				.style('paint-order', 'stroke fill')
				.style(
					'pointer-events',
					activeTool === 'inspect' || activeTool === 'select' || activeTool === 'move' ? 'all' : 'none'
				)
				.attr('data-label-id', labelId);

			// Clear all event handlers first
			textElement.on('mouseenter', null).on('mouseleave', null).on('click', null).on('.drag', null);

			// Prevent text selection for interactive tools
			if (activeTool === 'select' || activeTool === 'move') {
				textElement.style('user-select', 'none').style('-webkit-user-select', 'none');
			} else {
				textElement.style('user-select', null).style('-webkit-user-select', null);
			}

			// Add hover events for inspect tool
			if (activeTool === 'inspect' && onShowTooltip && onHideTooltip) {
				textElement
					.style('cursor', 'crosshair')
					.on('mouseenter', function (event) {
						const [x, y] = d3.pointer(event, svg.node());
						onShowTooltip(x, y, record);
					})
					.on('mouseleave', () => {
						onHideTooltip();
					});
			} else if (activeTool === 'select') {
				textElement.style('cursor', 'pointer');
			} else if (activeTool === 'move') {
				textElement.style('cursor', 'move');
			}

			createFormattedText(textElement, labelText, overrideBaseStyles);

			const hasIndividualStyleOverride =
				override?.fontWeight !== undefined || override?.fontStyle !== undefined;
			applyPostFormatStyles(textElement, labelText, overrideBaseStyles, hasIndividualStyleOverride);

			// Set up click handler after creating formatted text
			if (activeTool === 'select') {
				textElement.on('click', function (event) {
					event.stopPropagation();
					event.preventDefault();
					if (onLabelClick) {
						onLabelClick(labelId);
					}
				});
			}

			// Prevent text selection on tspan elements
			if (activeTool === 'select' || activeTool === 'move') {
				textElement.selectAll('tspan').style('user-select', 'none').style('-webkit-user-select', 'none');
			}

			const globalOffsetX = stylingSettings.symbol.labelOffsetX ?? 0;
			const globalOffsetY = stylingSettings.symbol.labelOffsetY ?? 0;
			const individualOffsetX = override?.offsetX ?? 0;
			const individualOffsetY = override?.offsetY ?? 0;

			const placement = computeSymbolLabelPlacement({
				override,
				globalAlignment: stylingSettings.symbol.labelAlignment,
				projected,
				symbolSize: size,
				labelText,
				fontSize,
				width,
				height,
				globalOffsetX,
				globalOffsetY,
				individualOffsetX,
				individualOffsetY,
			});

			const finalX = placement.x;
			const finalY = placement.y;
			const finalTextAnchor = placement.textAnchor;
			const finalDominantBaseline = placement.dominantBaseline;

			textElement
				.attr('x', finalX)
				.attr('y', finalY)
				.attr('text-anchor', finalTextAnchor)
				.attr('dominant-baseline', finalDominantBaseline);

			updateTspanPositions(textElement, finalX);

			if (activeTool === 'move') {
				attachLabelDrag(textElement, svg, labelId, onLabelPositionUpdate);
			} else {
				textElement.on('.drag', null);
			}
		});

	return labels;
};

interface SymbolTextParams {
	svg: SvgSelection;
	projection: Projection;
	symbolData: DataRecord[];
	dimensionSettings: DimensionSettings;
	stylingSettings: StylingSettings;
	columnTypes: ColumnType;
	columnFormats: ColumnFormat;
	selectedGeography: GeographyKey;
	sizeScale: ScaleLinear | null;
	activeTool?: MapTool;
	onShowTooltip?: (x: number, y: number, record: DataRecord) => void;
	onHideTooltip?: () => void;
	onLabelPositionUpdate?: (labelId: string, x: number, y: number) => void;
	onLabelClick?: (labelId: string) => void;
}

export const renderSymbolText = ({
	svg,
	projection,
	symbolData,
	dimensionSettings,
	stylingSettings,
	columnTypes,
	columnFormats,
	selectedGeography,
	sizeScale,
	activeTool = 'inspect',
	onShowTooltip,
	onHideTooltip,
	onLabelPositionUpdate,
	onLabelClick,
}: SymbolTextParams) => {
	if (!dimensionSettings.symbol.symbolTextBy) {
		return;
	}

	const symbolTextSettings = getSymbolTextStyling(stylingSettings);
	const symbolTextGroup = svg.append('g').attr('id', 'SymbolText');
	const baseSymbolSize = stylingSettings.symbol.symbolSize;

	symbolTextGroup
		.selectAll('text')
		.data(symbolData)
		.join('text')
		.each(function (record, index) {
			const textElement = d3.select(this);
			const labelId = getSymbolTextLabelId(index);
			const lat = Number(record[dimensionSettings.symbol.latitude]);
			const lng = Number(record[dimensionSettings.symbol.longitude]);
			const projected = projection([lng, lat]);

			if (!projected) {
				return;
			}

			const labelText = resolveSymbolTextRenderText({
				labelId,
				stylingSettings,
				symbolData,
				dimensionSettings,
				columnTypes,
				columnFormats,
				selectedGeography,
			});

			if (!labelText) {
				textElement.remove();
				return;
			}

			const symbolSize = sizeScale
				? sizeScale(evalNumeric(record, dimensionSettings.symbol.sizeBy) || 0)
				: baseSymbolSize;

			const override = stylingSettings.individualLabelOverrides?.[labelId];
			const fontFamily = override?.fontFamily
				? mapFontFamilyForSVG(override.fontFamily)
				: mapFontFamilyForSVG(symbolTextSettings.fontFamily);
			let fontSize = override?.fontSize ?? symbolTextSettings.fontSize;
			if (symbolTextSettings.scaleWithSymbol && override?.fontSize === undefined && baseSymbolSize > 0) {
				fontSize = fontSize * (symbolSize / baseSymbolSize);
			}
			const fill = override?.fill ?? symbolTextSettings.color;
			const stroke = override?.stroke ?? symbolTextSettings.outlineColor;
			const strokeWidth = override?.strokeWidth ?? symbolTextSettings.outlineThickness;
			const overrideBaseStyles = {
				fontWeight:
					override && override.fontWeight !== undefined
						? override.fontWeight
						: symbolTextSettings.fontBold
							? 'bold'
							: 'normal',
				fontStyle:
					override && override.fontStyle !== undefined
						? override.fontStyle
						: symbolTextSettings.fontItalic
							? 'italic'
							: 'normal',
				textDecoration: override?.textDecoration ?? '',
			};

			textElement
				.attr('font-family', fontFamily)
				.attr('font-size', `${fontSize}px`)
				.attr('font-weight', overrideBaseStyles.fontWeight)
				.attr('font-style', overrideBaseStyles.fontStyle)
				.attr('fill', fill)
				.attr('stroke', stroke)
				.attr('stroke-width', strokeWidth)
				.style('paint-order', 'stroke fill')
				.style(
					'pointer-events',
					activeTool === 'inspect' || activeTool === 'select' || activeTool === 'move' ? 'all' : 'none'
				)
				.attr('data-label-id', labelId);

			textElement.on('mouseenter', null).on('mouseleave', null).on('click', null).on('.drag', null);

			if (activeTool === 'select' || activeTool === 'move') {
				textElement.style('user-select', 'none').style('-webkit-user-select', 'none');
			} else {
				textElement.style('user-select', null).style('-webkit-user-select', null);
			}

			if (activeTool === 'inspect' && onShowTooltip && onHideTooltip) {
				textElement
					.style('cursor', 'crosshair')
					.on('mouseenter', function (event) {
						const [x, y] = d3.pointer(event, svg.node());
						onShowTooltip(x, y, record);
					})
					.on('mouseleave', () => {
						onHideTooltip();
					});
			} else if (activeTool === 'select') {
				textElement.style('cursor', 'pointer');
			} else if (activeTool === 'move') {
				textElement.style('cursor', 'move');
			}

			createFormattedText(textElement, labelText, overrideBaseStyles);

			const hasIndividualStyleOverride =
				override?.fontWeight !== undefined || override?.fontStyle !== undefined;
			applyPostFormatStyles(textElement, labelText, overrideBaseStyles, hasIndividualStyleOverride);

			if (activeTool === 'select') {
				textElement.on('click', function (event) {
					event.stopPropagation();
					event.preventDefault();
					onLabelClick?.(labelId);
				});
			}

			if (activeTool === 'select' || activeTool === 'move') {
				textElement.selectAll('tspan').style('user-select', 'none').style('-webkit-user-select', 'none');
			}

			const globalOffsetX = symbolTextSettings.offsetX ?? 0;
			const globalOffsetY = symbolTextSettings.offsetY ?? 0;
			const individualOffsetX = override?.offsetX ?? 0;
			const individualOffsetY = override?.offsetY ?? 0;
			const hasAbsolutePosition = override?.x !== undefined && override?.y !== undefined;
			const finalX = hasAbsolutePosition
				? override!.x!
				: projected[0] + globalOffsetX + individualOffsetX;
			const finalY = hasAbsolutePosition
				? override!.y!
				: projected[1] + globalOffsetY + individualOffsetY;

			textElement
				.attr('x', finalX)
				.attr('y', finalY)
				.attr('text-anchor', 'middle')
				.attr('dominant-baseline', 'middle');

			updateTspanPositions(textElement, finalX);

			if (activeTool === 'move') {
				attachLabelDrag(textElement, svg, labelId, onLabelPositionUpdate);
			} else {
				textElement.on('.drag', null);
			}
		});
};

interface ChoroplethLabelParams {
	svg: SvgSelection;
	projection: Projection;
	path: GeoPath;
	mapType: MapType;
	selectedGeography: GeographyKey;
	dimensionSettings: DimensionSettings;
	stylingSettings: StylingSettings;
	columnTypes: ColumnType;
	columnFormats: ColumnFormat;
	choroplethData: DataRecord[];
	geoAtlasData: TopoJSONData | null;
	customMapData: string;
	normalizeGeoIdentifier: NormaliseFn;
	extractCandidateFromSVGId: ExtractIdFn;
	getSubnationalLabel: SubnationalLabelFn;
	renderLabelPreview: LabelFormatter;
	findCountryFeature: CountryFinder;
	activeTool?: MapTool;
	onShowTooltip?: (x: number, y: number, record: DataRecord) => void;
	onHideTooltip?: () => void;
	onLabelPositionUpdate?: (labelId: string, x: number, y: number) => void;
	onLabelClick?: (labelId: string) => void;
}

export const renderChoroplethLabels = ({
	svg,
	projection,
	path,
	mapType,
	selectedGeography,
	dimensionSettings,
	stylingSettings,
	columnTypes,
	columnFormats,
	choroplethData,
	geoAtlasData,
	customMapData,
	normalizeGeoIdentifier,
	extractCandidateFromSVGId,
	getSubnationalLabel,
	renderLabelPreview,
	findCountryFeature,
	activeTool = 'inspect',
	onShowTooltip,
	onHideTooltip,
	onLabelPositionUpdate,
	onLabelClick,
}: ChoroplethLabelParams) => {
	if (!dimensionSettings.choropleth.labelTemplate || choroplethData.length === 0) {
		return;
	}

	const choroplethLabelGroup = svg.append('g').attr('id', 'ChoroplethLabels');

	const geoDataMap = new Map<string, DataRecord>();
	choroplethData.forEach((record) => {
		const rawGeoValue = String(record[dimensionSettings.choropleth.stateColumn] || '');
		if (!rawGeoValue.trim()) {
			return;
		}
		const normalized = normalizeGeoIdentifier(rawGeoValue, selectedGeography);
		geoDataMap.set(normalized, record);
	});

	let featuresForLabels: any[] = [];
	if (geoAtlasData && mapType !== 'custom') {
		featuresForLabels = collectTopoFeatures({ geoAtlasData, selectedGeography, mapType, findCountryFeature });
	} else if (customMapData) {
		featuresForLabels = collectCustomSvgFeatures({
			svg,
			customMapData,
			selectedGeography,
			normalizeGeoIdentifier,
			extractCandidateFromSVGId,
		});
	}

	const labels = choroplethLabelGroup
		.selectAll('text')
		.data(featuresForLabels)
		.join('text')
		.each(function (feature) {
			const textElement = d3.select(this);
			const featureIdentifier = resolveFeatureIdentifier({
				feature,
				mapType,
				selectedGeography,
				normalizeGeoIdentifier,
				geoDataMap,
			});

			const dataRow = featureIdentifier ? geoDataMap.get(featureIdentifier) : undefined;
			const labelId = `choropleth-${featureIdentifier || 'unknown'}`;
			const labelText = dataRow
				? resolveLabelRenderText({
						labelId,
						mapType: 'choropleth',
						dimensionSettings,
						stylingSettings,
						symbolData: [],
						choroplethData,
						columnTypes,
						columnFormats,
						selectedGeography,
					})
				: '';

			if (!labelText) {
				textElement.remove();
				return;
			}

			const centroid = computeFeatureCentroid({ feature, path });
			if (!centroid) {
				textElement.remove();
				return;
			}

			// Check for overrides
			const override = stylingSettings.individualLabelOverrides?.[labelId];
			const hasPositionOverride = override && override.x !== undefined && override.y !== undefined;

			// Apply style overrides if they exist, otherwise use defaults
			const fontFamily = override?.fontFamily
				? mapFontFamilyForSVG(override.fontFamily)
				: mapFontFamilyForSVG(stylingSettings.choropleth.labelFontFamily);
			const fontSize = override?.fontSize ?? stylingSettings.choropleth.labelFontSize;
			const fill = override?.fill ?? stylingSettings.choropleth.labelColor;
			const stroke = override?.stroke ?? stylingSettings.choropleth.labelOutlineColor;
			const strokeWidth = override?.strokeWidth ?? stylingSettings.choropleth.labelOutlineThickness;
			const textAnchor = override?.textAnchor ?? 'middle';
			const dominantBaseline = override?.dominantBaseline ?? 'middle';

			// Update baseStyles with override values
			// IMPORTANT: If override exists and has fontWeight/fontStyle, use them even if 'normal'
			// This ensures that explicitly set 'normal' values override defaults
			const getTextDecorationFromOverride = () => {
				if (override?.textDecoration !== undefined) {
					return override.textDecoration;
				}
				return getTextDecoration(
					stylingSettings.choropleth.labelUnderline,
					stylingSettings.choropleth.labelStrikethrough
				);
			};
			const overrideBaseStyles = {
				fontWeight:
					override && override.fontWeight !== undefined
						? override.fontWeight
						: stylingSettings.choropleth.labelBold
						? 'bold'
						: 'normal',
				fontStyle:
					override && override.fontStyle !== undefined
						? override.fontStyle
						: stylingSettings.choropleth.labelItalic
						? 'italic'
						: 'normal',
				textDecoration: getTextDecorationFromOverride(),
			};

			// Apply position override if exists, otherwise use centroid
			const globalOffsetX = stylingSettings.choropleth.labelOffsetX ?? 0;
			const globalOffsetY = stylingSettings.choropleth.labelOffsetY ?? 0;
			const individualOffsetX = override?.offsetX ?? 0;
			const individualOffsetY = override?.offsetY ?? 0;
			const finalX = hasPositionOverride
				? override!.x!
				: centroid[0] + globalOffsetX + individualOffsetX;
			const finalY = hasPositionOverride
				? override!.y!
				: centroid[1] + globalOffsetY + individualOffsetY;

			textElement
				.attr('x', finalX)
				.attr('y', finalY)
				.attr('text-anchor', textAnchor)
				.attr('dominant-baseline', dominantBaseline)
				.attr('font-family', fontFamily)
				.attr('font-size', `${fontSize}px`)
				.attr('font-weight', overrideBaseStyles.fontWeight)
				.attr('font-style', overrideBaseStyles.fontStyle)
				.attr('fill', fill)
				.attr('stroke', stroke)
				.attr('stroke-width', strokeWidth)
				.style('paint-order', 'stroke fill')
				.style(
					'pointer-events',
					activeTool === 'inspect' || activeTool === 'select' || activeTool === 'move' ? 'all' : 'none'
				)
				.attr('data-label-id', labelId);

			// Clear all event handlers first - but don't clear drag behavior here, we'll handle it separately
			textElement.on('mouseenter', null).on('mouseleave', null).on('click', null);

			// Prevent text selection for interactive tools
			if (activeTool === 'select' || activeTool === 'move') {
				textElement.style('user-select', 'none').style('-webkit-user-select', 'none');
			} else {
				textElement.style('user-select', null).style('-webkit-user-select', null);
			}

			// Add hover events for inspect tool
			if (activeTool === 'inspect' && onShowTooltip && onHideTooltip && dataRow) {
				textElement
					.style('cursor', 'crosshair')
					.on('mouseenter', function (event) {
						const [x, y] = d3.pointer(event, svg.node());
						onShowTooltip(x, y, dataRow);
					})
					.on('mouseleave', () => {
						onHideTooltip();
					});
			} else if (activeTool === 'select') {
				textElement.style('cursor', 'pointer');
			} else if (activeTool === 'move') {
				textElement.style('cursor', 'move');
			} else if (activeTool === 'draw') {
				textElement.style('cursor', 'crosshair');
			}

			createFormattedText(textElement, labelText, overrideBaseStyles);

			const hasIndividualStyleOverride =
				override?.fontWeight !== undefined || override?.fontStyle !== undefined;
			applyPostFormatStyles(textElement, labelText, overrideBaseStyles, hasIndividualStyleOverride);

			// Set up click handler after creating formatted text
			if (activeTool === 'select') {
				textElement.on('click', function (event) {
					event.stopPropagation();
					event.preventDefault();
					if (onLabelClick) {
						onLabelClick(labelId);
					}
				});
			}

			// Prevent text selection on tspan elements
			if (activeTool === 'select' || activeTool === 'move') {
				textElement.selectAll('tspan').style('user-select', 'none').style('-webkit-user-select', 'none');
			}

			updateTspanPositions(textElement, finalX);

			if (activeTool === 'move') {
				attachLabelDrag(textElement, svg, labelId, onLabelPositionUpdate);
			} else {
				textElement.on('.drag', null);
			}
		});

	return labels;
};

interface ResolveFeatureIdentifierParams {
	feature: any;
	mapType: MapType;
	selectedGeography: GeographyKey;
	normalizeGeoIdentifier: NormaliseFn;
	geoDataMap: Map<string, DataRecord>;
}

const resolveFeatureIdentifier = ({
	feature,
	mapType,
	selectedGeography,
	normalizeGeoIdentifier,
	geoDataMap,
}: ResolveFeatureIdentifierParams): string | null => {
	if (!feature) {
		return null;
	}

	if (mapType === 'custom') {
		return feature.id ?? null;
	}

	if (selectedGeography.startsWith('usa-states') || selectedGeography.startsWith('usa-counties')) {
		return feature?.id ? normalizeGeoIdentifier(String(feature.id), selectedGeography) : null;
	}

	if (selectedGeography.startsWith('canada-provinces')) {
		const abbrKey = feature?.id ? normalizeGeoIdentifier(String(feature.id), selectedGeography) : null;
		const nameKey = feature?.properties?.name
			? normalizeGeoIdentifier(String(feature.properties.name), selectedGeography)
			: null;

		if (abbrKey && geoDataMap.has(abbrKey)) {
			return abbrKey;
		}
		if (nameKey && geoDataMap.has(nameKey)) {
			return nameKey;
		}

		return abbrKey || nameKey;
	}

	if (selectedGeography === 'world' || selectedGeography === 'usa-nation' || selectedGeography === 'canada-nation') {
		const candidates = [
			feature?.id,
			feature?.properties?.name,
			feature?.properties?.name_long,
			feature?.properties?.admin,
			feature?.properties?.iso_a3,
		]
			.filter(Boolean)
			.map((value) => normalizeGeoIdentifier(String(value), selectedGeography));

		const exact = candidates.find((candidate) => geoDataMap.has(candidate));
		if (exact) {
			return exact;
		}

		const geoKeys = Array.from(geoDataMap.keys());
		const fuzzy = geoKeys.find((key) =>
			candidates.some(
				(candidate) =>
					key.toLowerCase().includes(candidate.toLowerCase()) || candidate.toLowerCase().includes(key.toLowerCase())
			)
		);

		return fuzzy || null;
	}

	return null;
};

interface CollectTopoFeaturesParams {
	geoAtlasData: TopoJSONData;
	selectedGeography: GeographyKey;
	mapType: MapType;
	findCountryFeature: CountryFinder;
}

const collectTopoFeatures = ({
	geoAtlasData,
	selectedGeography,
	mapType,
	findCountryFeature,
}: CollectTopoFeaturesParams) => {
	const { objects } = geoAtlasData;
	if (!objects) {
		return [];
	}

	if (selectedGeography === 'usa-states' && objects.states) {
		return topojsonFeature(geoAtlasData, objects.states);
	}

	if (selectedGeography === 'usa-counties' && objects.counties) {
		return topojsonFeature(geoAtlasData, objects.counties);
	}

	if (selectedGeography === 'canada-provinces' && objects.provinces) {
		return topojsonFeature(geoAtlasData, objects.provinces);
	}

	if (selectedGeography === 'world' && objects.countries) {
		return topojsonFeature(geoAtlasData, objects.countries);
	}

	if ((selectedGeography === 'usa-nation' || selectedGeography === 'canada-nation') && objects.countries) {
		const allCountries = topojsonFeature(geoAtlasData, objects.countries);
		const targetCountryName = selectedGeography === 'usa-nation' ? 'United States' : 'Canada';
		const specificCountry = findCountryFeature(allCountries, [
			targetCountryName,
			targetCountryName === 'United States' ? 'USA' : 'CAN',
			targetCountryName === 'United States' ? 840 : 124,
		]);
		return specificCountry ? [specificCountry] : allCountries;
	}

	return [];
};

interface CollectCustomSvgFeaturesParams {
	svg: SvgSelection;
	customMapData: string;
	selectedGeography: GeographyKey;
	normalizeGeoIdentifier: NormaliseFn;
	extractCandidateFromSVGId: ExtractIdFn;
}

const collectCustomSvgFeatures = ({
	svg,
	customMapData,
	selectedGeography,
	normalizeGeoIdentifier,
	extractCandidateFromSVGId,
}: CollectCustomSvgFeaturesParams) => {
	const mapGroup = svg.select('#Map');
	const elements: SVGElement[] = [];

	if (!mapGroup.empty()) {
		mapGroup.selectAll('path, g').each(function () {
			const element = d3.select(this);
			const id = element.attr('id');
			if (
				id !== 'Nations' &&
				id !== 'States' &&
				id !== 'Counties' &&
				id !== 'Provinces' &&
				id !== 'Regions' &&
				id !== 'Countries'
			) {
				elements.push(this as SVGElement);
			}
		});
	}

	const uniqueElements = Array.from(new Set(elements));

	return uniqueElements.map((element) => {
		const selection = d3.select(element);
		let effectiveId = selection.attr('id');

		if (element.tagName === 'path' && !effectiveId && element.parentElement?.tagName === 'g') {
			effectiveId = d3.select(element.parentElement).attr('id');
		}

		const candidate = effectiveId ? extractCandidateFromSVGId(effectiveId) : null;
		const normalized = candidate
			? normalizeGeoIdentifier(candidate, selectedGeography)
			: normalizeGeoIdentifier(effectiveId ?? '', selectedGeography);

		return {
			id: normalized,
			pathNode: element,
		};
	});
};

interface ComputeCentroidParams {
	feature: any;
	path: GeoPath;
}

const computeFeatureCentroid = ({ feature, path }: ComputeCentroidParams): [number, number] | null => {
	if (feature?.pathNode) {
		const bbox = (feature.pathNode as SVGGraphicsElement).getBBox();
		return [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2];
	}

	if (feature) {
		const centroid = path.centroid(feature);
		if (centroid && !Number.isNaN(centroid[0]) && !Number.isNaN(centroid[1])) {
			return centroid as [number, number];
		}
	}

	return null;
};

interface ResolveSymbolLabelPositionParams {
	alignment: SymbolLabelAlignment;
	projected: [number, number];
	symbolSize: number;
	labelText: string;
	fontSize: number;
	width: number;
	height: number;
}

interface ComputeSymbolLabelPlacementParams {
	override?: IndividualLabelOverride;
	globalAlignment: SymbolLabelAlignment;
	projected: [number, number];
	symbolSize: number;
	labelText: string;
	fontSize: number;
	width: number;
	height: number;
	globalOffsetX: number;
	globalOffsetY: number;
	individualOffsetX: number;
	individualOffsetY: number;
}

export interface SymbolLabelPlacement {
	x: number;
	y: number;
	textAnchor: 'start' | 'middle' | 'end';
	dominantBaseline: 'baseline' | 'middle' | 'hanging';
	alignment: SymbolLabelAlignment;
}

/** Resolve which positional alignment preset drives label placement for a symbol label. */
export const resolveEffectiveSymbolLabelAlignment = (
	override: ComputeSymbolLabelPlacementParams['override'],
	globalAlignment: SymbolLabelAlignment
): SymbolLabelAlignment => {
	let alignmentForPosition = override?.labelAlignment ?? globalAlignment;

	if (
		override?.labelAlignment === undefined &&
		override?.textAnchor !== undefined &&
		override?.dominantBaseline !== undefined
	) {
		const inferred = anchorBaselineToLabelAlignment(override.textAnchor, override.dominantBaseline);
		if (inferred) {
			alignmentForPosition = inferred;
		}
	}

	return alignmentForPosition;
};

/** Compute final SVG coordinates and anchor attributes for a symbol map label. */
export const computeSymbolLabelPlacement = ({
	override,
	globalAlignment,
	projected,
	symbolSize,
	labelText,
	fontSize,
	width,
	height,
	globalOffsetX,
	globalOffsetY,
	individualOffsetX,
	individualOffsetY,
}: ComputeSymbolLabelPlacementParams): SymbolLabelPlacement => {
	const alignmentForPosition = resolveEffectiveSymbolLabelAlignment(override, globalAlignment);
	const position = resolveSymbolLabelPosition({
		alignment: alignmentForPosition,
		projected,
		symbolSize,
		labelText,
		fontSize,
		width,
		height,
	});

	const hasAbsolutePosition =
		override != null && override.x !== undefined && override.y !== undefined;
	const usesManualAlignment = alignmentForPosition !== 'auto';

	const x = hasAbsolutePosition
		? override!.x!
		: projected[0] + position.dx + globalOffsetX + individualOffsetX;
	const y = hasAbsolutePosition
		? override!.y!
		: projected[1] + position.dy + globalOffsetY + individualOffsetY;

	// Manual alignment always uses anchors derived from placement side so the label
	// sits beside the symbol, not overlapping it with a mismatched text-anchor.
	const textAnchor = usesManualAlignment
		? position.anchor
		: (override?.textAnchor ?? position.anchor);
	const dominantBaseline = usesManualAlignment
		? position.baseline
		: (override?.dominantBaseline ?? position.baseline);

	return {
		x,
		y,
		textAnchor,
		dominantBaseline,
		alignment: alignmentForPosition,
	};
};

/** Map a positional alignment preset to SVG text anchor attributes. */
export const labelAlignmentToAnchorBaseline = (
	alignment: SymbolLabelAlignment
): {
	textAnchor: 'start' | 'middle' | 'end';
	dominantBaseline: 'baseline' | 'middle' | 'hanging';
} => {
	switch (alignment) {
		case 'top-left':
			return { textAnchor: 'end', dominantBaseline: 'baseline' };
		case 'top-center':
			return { textAnchor: 'middle', dominantBaseline: 'baseline' };
		case 'top-right':
			return { textAnchor: 'start', dominantBaseline: 'baseline' };
		case 'middle-left':
			return { textAnchor: 'end', dominantBaseline: 'middle' };
		case 'center':
			return { textAnchor: 'middle', dominantBaseline: 'middle' };
		case 'middle-right':
			return { textAnchor: 'start', dominantBaseline: 'middle' };
		case 'bottom-left':
			return { textAnchor: 'end', dominantBaseline: 'hanging' };
		case 'bottom-center':
			return { textAnchor: 'middle', dominantBaseline: 'hanging' };
		case 'bottom-right':
			return { textAnchor: 'start', dominantBaseline: 'hanging' };
		case 'auto':
		default:
			return { textAnchor: 'start', dominantBaseline: 'middle' };
	}
};

const ANCHOR_BASELINE_TO_ALIGNMENT: Partial<
	Record<
		`${'baseline' | 'middle' | 'hanging'}-${'start' | 'middle' | 'end'}`,
		Exclude<SymbolLabelAlignment, 'auto'>
	>
> = {
	'baseline-end': 'top-left',
	'baseline-middle': 'top-center',
	'baseline-start': 'top-right',
	'middle-end': 'middle-left',
	'middle-middle': 'center',
	'middle-start': 'middle-right',
	'hanging-end': 'bottom-left',
	'hanging-middle': 'bottom-center',
	'hanging-start': 'bottom-right',
};

/** Infer positional alignment from anchor attributes (legacy per-label overrides). */
export const anchorBaselineToLabelAlignment = (
	textAnchor: 'start' | 'middle' | 'end',
	dominantBaseline: 'baseline' | 'middle' | 'hanging'
): SymbolLabelAlignment | undefined => {
	return ANCHOR_BASELINE_TO_ALIGNMENT[`${dominantBaseline}-${textAnchor}`];
};

interface SymbolLabelPosition {
	dx: number;
	dy: number;
	anchor: 'start' | 'middle' | 'end';
	baseline: 'baseline' | 'middle' | 'hanging';
}

const resolveSymbolLabelPosition = ({
	alignment,
	projected,
	symbolSize,
	labelText,
	fontSize,
	width,
	height,
}: ResolveSymbolLabelPositionParams): SymbolLabelPosition => {
	if (alignment === 'auto') {
		const estimatedWidth = labelText.length * (fontSize * 0.6);
		const estimatedHeight = fontSize * 1.2;
		return getAutoPosition(projected[0], projected[1], symbolSize, estimatedWidth, estimatedHeight, width, height);
	}

	const offset = symbolSize / 2 + Math.max(8, symbolSize * 0.3);

	switch (alignment) {
		case 'top-left':
			return { dx: -offset, dy: -offset, anchor: 'end', baseline: 'baseline' as const };
		case 'top-center':
			return { dx: 0, dy: -offset, anchor: 'middle', baseline: 'baseline' as const };
		case 'top-right':
			return { dx: offset, dy: -offset, anchor: 'start', baseline: 'baseline' as const };
		case 'middle-left':
			return { dx: -offset, dy: 0, anchor: 'end', baseline: 'middle' as const };
		case 'center':
			return { dx: 0, dy: 0, anchor: 'middle', baseline: 'middle' as const };
		case 'middle-right':
			return { dx: offset, dy: 0, anchor: 'start', baseline: 'middle' as const };
		case 'bottom-left':
			return { dx: -offset, dy: offset, anchor: 'end', baseline: 'hanging' as const };
		case 'bottom-center':
			return { dx: 0, dy: offset, anchor: 'middle', baseline: 'hanging' as const };
		case 'bottom-right':
			return { dx: offset, dy: offset, anchor: 'start', baseline: 'hanging' as const };
		default:
			return { dx: offset, dy: 0, anchor: 'start', baseline: 'middle' as const };
	}
};

const getAutoPosition = (
	x: number,
	y: number,
	symbolSize: number,
	labelWidth: number,
	labelHeight: number,
	svgWidth: number,
	svgHeight: number
): SymbolLabelPosition => {
	const margin = Math.max(8, symbolSize * 0.3);
	const edgeBuffer = 20;

	const positions: SymbolLabelPosition[] = [
		{ dx: symbolSize / 2 + margin, dy: 0, anchor: 'start', baseline: 'middle' },
		{ dx: -(symbolSize / 2 + margin), dy: 0, anchor: 'end', baseline: 'middle' },
		{ dx: -labelWidth / 2, dy: symbolSize / 2 + margin + labelHeight, anchor: 'start', baseline: 'hanging' },
		{ dx: -labelWidth / 2, dy: -(symbolSize / 2 + margin), anchor: 'start', baseline: 'baseline' },
	];

	for (const pos of positions) {
		const labelLeft = pos.anchor === 'end' ? x + pos.dx - labelWidth : x + pos.dx;
		const labelRight = pos.anchor === 'end' ? x + pos.dx : x + pos.dx + labelWidth;
		const labelTop = y + pos.dy - labelHeight / 2;
		const labelBottom = y + pos.dy + labelHeight / 2;

		if (
			labelLeft >= edgeBuffer &&
			labelRight <= svgWidth - edgeBuffer &&
			labelTop >= edgeBuffer &&
			labelBottom <= svgHeight - edgeBuffer
		) {
			return pos;
		}
	}

	return positions[0];
};

const hasInlineFormatting = (text: string): boolean =>
	/<(b|strong|i|em|u|s|strike)\b/i.test(text);

type LabelBaseStyles = { fontWeight?: string; fontStyle?: string; textDecoration?: string };

const applyPostFormatStyles = (
	textElement: d3.Selection<d3.BaseType | SVGTextElement, unknown, null, undefined>,
	labelText: string,
	baseStyles: LabelBaseStyles,
	hasIndividualStyleOverride: boolean
) => {
	const fontWeightValue = baseStyles.fontWeight || 'normal';
	const fontStyleValue = baseStyles.fontStyle || 'normal';

	textElement.attr('font-weight', fontWeightValue).attr('font-style', fontStyleValue);

	// Preserve per-tspan styles from <b>, <i>, etc. unless an individual override forces global style
	if (hasIndividualStyleOverride || !hasInlineFormatting(labelText)) {
		textElement.selectAll('tspan').each(function () {
			const tspan = d3.select(this);
			tspan.attr('font-weight', fontWeightValue).attr('font-style', fontStyleValue);
		});
	}
};

const updateTspanPositions = (
	textElement: d3.Selection<d3.BaseType | SVGTextElement, unknown, null, undefined>,
	finalX: number
) => {
	textElement.selectAll('tspan').each(function (_, tspanIndex) {
		const tspan = d3.select(this);
		if (tspanIndex > 0 || tspan.attr('x') === '0') {
			tspan.attr('x', finalX);
		}
	});
};

const attachLabelDrag = (
	textElement: d3.Selection<d3.BaseType | SVGTextElement, unknown, null, undefined>,
	svg: SvgSelection,
	labelId: string,
	onLabelPositionUpdate?: (labelId: string, x: number, y: number) => void
) => {
	if (!onLabelPositionUpdate) return;

	textElement.on('.drag', null);

	const drag = d3
		.drag<SVGTextElement, unknown>()
		.container(() => svg.node()!)
		.subject(function () {
			const t = d3.select(this);
			return { x: Number(t.attr('x')) || 0, y: Number(t.attr('y')) || 0 };
		})
		.on('start', function (event) {
			event.sourceEvent?.preventDefault();
			event.sourceEvent?.stopPropagation();
			d3.select(this).style('opacity', '0.7');
		})
		.on('drag', function (event) {
			event.sourceEvent?.preventDefault();
			event.sourceEvent?.stopPropagation();
			d3.select(this).attr('x', event.x).attr('y', event.y);
			d3.select(this).selectAll('tspan').attr('x', event.x);
		})
		.on('end', function (event) {
			event.sourceEvent?.preventDefault();
			event.sourceEvent?.stopPropagation();
			d3.select(this).style('opacity', '1');
			onLabelPositionUpdate(labelId, event.x, event.y);
		});

	textElement.call(drag as never);
};

const createFormattedText = (
	textElement: d3.Selection<d3.BaseType | SVGTextElement, any, any, any>,
	labelText: string,
	baseStyles: { fontWeight?: string; fontStyle?: string; textDecoration?: string }
) => {
	textElement.selectAll('*').remove();
	textElement.text('');

	// Normalize line breaks: convert \n to <br/> first, then split only on <br/> tags
	// This prevents double-processing of line breaks (renderLabelPreview already converts \n to <br/>)
	const normalizedText = labelText.replace(/\n/g, '<br/>');
	// Split on <br/> tags and remove empty lines
	const lines = normalizedText
		.split(/<br\s*\/?>/i)
		.map((line) => line.trim())
		.filter((line) => line !== '');
	const totalLines = lines.length;

	if (totalLines === 0) {
		return;
	}

	const lineHeight = 1.2;
	const verticalOffset = totalLines > 1 ? -((totalLines - 1) * lineHeight * 0.5) : 0;

	lines.forEach((line, lineIndex) => {
		parseAndCreateSpans(line, textElement, baseStyles, lineHeight, verticalOffset, lineIndex === 0, lineIndex);
	});
};

const parseAndCreateSpans = (
	text: string,
	parentElement: d3.Selection<d3.BaseType | SVGTextElement, any, any, any>,
	baseStyles: { fontWeight?: string; fontStyle?: string; textDecoration?: string },
	lineHeight: number,
	verticalOffset: number,
	isFirstLine: boolean,
	lineIndex: number
) => {
	const htmlTagRegex = /<(\/?)([^>]+)>/g;
	let lastIndex = 0;
	let match: RegExpExecArray | null;
	const currentStyles = { ...baseStyles };
	let hasAddedContent = false;
	let isFirstTspan = true;

	while ((match = htmlTagRegex.exec(text)) !== null) {
		if (match.index > lastIndex) {
			const textContent = text.substring(lastIndex, match.index);
			if (textContent) {
				const tspan = parentElement.append('tspan').text(textContent);
				if (lineIndex > 0 && isFirstTspan) {
					tspan.attr('dy', `${lineHeight}em`).attr('x', null);
				}
				applyStylesToTspan(tspan, currentStyles);
				hasAddedContent = true;
				isFirstTspan = false;
			}
		}

		const isClosing = match[1] === '/';
		const tagName = match[2].toLowerCase();

		if (!isClosing) {
			applyOpeningTagStyles(tagName, currentStyles);
		} else {
			removeClosingTagStyles(tagName, currentStyles, baseStyles);
			if (!currentStyles.textDecoration) {
				delete currentStyles.textDecoration;
			}
		}

		lastIndex = htmlTagRegex.lastIndex;
	}

	if (lastIndex < text.length) {
		const textContent = text.substring(lastIndex);
		if (textContent) {
			const tspan = parentElement.append('tspan').text(textContent);
			if (lineIndex > 0 && isFirstTspan) {
				tspan.attr('dy', `${lineHeight}em`).attr('x', null);
			} else if (isFirstLine && lineIndex === 0 && lastIndex === 0) {
				// First line, no HTML tags processed - apply vertical offset
				tspan.attr('dy', `${verticalOffset}em`);
			}
			applyStylesToTspan(tspan, currentStyles);
			isFirstTspan = false;
			hasAddedContent = true;
		}
	}

	// Only create a tspan if no content was added and text has no HTML tags
	if (lastIndex === 0 && text.trim() && !hasAddedContent) {
		const tspan = parentElement.append('tspan').text(text);
		if (isFirstLine && lineIndex === 0) {
			tspan.attr('dy', `${verticalOffset}em`);
		} else if (lineIndex > 0) {
			tspan.attr('x', 0).attr('dy', `${lineHeight}em`);
		}
		applyStylesToTspan(tspan, currentStyles);
	}
};

const applyStylesToTspan = (
	tspan: d3.Selection<SVGTextElement, any, any, any>,
	styles: { fontWeight?: string; fontStyle?: string; textDecoration?: string }
) => {
	// Always apply fontWeight and fontStyle, even if 'normal', to ensure they override HTML tag styles
	if (styles.fontWeight !== undefined) {
		tspan.attr('font-weight', styles.fontWeight).style('font-weight', styles.fontWeight);
	}
	if (styles.fontStyle !== undefined) {
		tspan.attr('font-style', styles.fontStyle).style('font-style', styles.fontStyle);
	}
	if (styles.textDecoration) {
		tspan.attr('text-decoration', styles.textDecoration).style('text-decoration', styles.textDecoration);
	}
};

const applyOpeningTagStyles = (
	tagName: string,
	styles: { fontWeight?: string; fontStyle?: string; textDecoration?: string }
) => {
	switch (tagName) {
		case 'b':
		case 'strong':
			styles.fontWeight = 'bold';
			break;
		case 'i':
		case 'em':
			styles.fontStyle = 'italic';
			break;
		case 'u':
			styles.textDecoration = [styles.textDecoration, 'underline'].filter(Boolean).join(' ').trim();
			break;
		case 's':
		case 'strike':
			styles.textDecoration = [styles.textDecoration, 'line-through'].filter(Boolean).join(' ').trim();
			break;
	}
};

const removeClosingTagStyles = (
	tagName: string,
	styles: { fontWeight?: string; fontStyle?: string; textDecoration?: string },
	baseStyles: { fontWeight?: string; fontStyle?: string; textDecoration?: string }
) => {
	switch (tagName) {
		case 'b':
		case 'strong':
			styles.fontWeight = baseStyles.fontWeight;
			break;
		case 'i':
		case 'em':
			styles.fontStyle = baseStyles.fontStyle;
			break;
		case 'u':
			styles.textDecoration = (styles.textDecoration || '').replace('underline', '').trim();
			break;
		case 's':
		case 'strike':
			styles.textDecoration = (styles.textDecoration || '').replace('line-through', '').trim();
			break;
	}
};

const evalNumeric = (record: DataRecord, column: string): number | null => {
	const value = record[column];
	if (value === null || value === undefined || value === '') {
		return null;
	}
	const numeric = Number(value);
	return Number.isNaN(numeric) ? null : numeric;
};

const getTextDecoration = (underline?: boolean, strike?: boolean) => {
	const values: string[] = [];
	if (underline) values.push('underline');
	if (strike) values.push('line-through');
	return values.join(' ');
};

/**
 * Map font family display names to actual font-family CSS values for SVG rendering
 * Handles special cases like "Geist Sans" which is only available via CSS variables
 */
const mapFontFamilyForSVG = (fontFamily: string): string => {
	// Map display names to actual font-family values
	const fontMap: Record<string, string> = {
		'Geist Sans': 'Inter, system-ui, sans-serif', // Geist Sans not available as web font, use Inter as fallback
		Inter: 'Inter, system-ui, sans-serif',
		Roboto: 'Roboto, sans-serif',
		'Open Sans': '"Open Sans", sans-serif',
		Lato: 'Lato, sans-serif',
		Montserrat: 'Montserrat, sans-serif',
		Oswald: 'Oswald, sans-serif',
		'Playfair Display': '"Playfair Display", serif',
		Merriweather: 'Merriweather, serif',
		Raleway: 'Raleway, sans-serif',
		Poppins: 'Poppins, sans-serif',
		'Source Sans Pro': '"Source Sans Pro", sans-serif',
	};

	return fontMap[fontFamily] || fontFamily || 'Inter, system-ui, sans-serif';
};

const topojsonFeature = (data: TopoJSONData, object: any): any[] => {
	const result = topojson.feature(data as any, object);
	if (result && 'features' in result) {
		return (result as any).features;
	}
	return Array.isArray(result) ? result : [result];
};
