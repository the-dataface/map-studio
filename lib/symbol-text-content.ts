import type {
	ColumnFormat,
	ColumnType,
	DataRow,
	DimensionSettings,
	GeocodedRow,
	GeographyKey,
	StylingSettings,
} from '@/app/(studio)/types';
import { formatLegendValue } from '@/modules/data-ingest/formatting';

type DataRecord = DataRow | GeocodedRow;

/** Sentinel value for display-order row number (1-based). */
export const SYMBOL_TEXT_ROW_INDEX = '$n';

export type LabelMapType = 'symbol' | 'symbol-text' | 'choropleth';

export const resolveLabelMapType = (labelId: string): LabelMapType => {
	if (labelId.startsWith('symbol-text-')) {
		return 'symbol-text';
	}
	if (labelId.startsWith('symbol-')) {
		return 'symbol';
	}
	return 'choropleth';
};

export const parseSymbolLabelIndex = (labelId: string): number | undefined => {
	const match = labelId.match(/^symbol(?:-text)?-(\d+)$/);
	if (!match) {
		return undefined;
	}
	const index = Number.parseInt(match[1], 10);
	return Number.isNaN(index) ? undefined : index;
};

export const getSymbolTextLabelId = (displayIndex: number): string => `symbol-text-${displayIndex}`;

interface ResolveSymbolTextMappedValueParams {
	record: DataRecord;
	displayIndex: number;
	dimensionSettings: DimensionSettings;
	columnTypes: ColumnType;
	columnFormats: ColumnFormat;
	selectedGeography: GeographyKey;
}

/** Resolve mapped symbol text from dimension settings (no per-label override). */
export const resolveSymbolTextMappedValue = ({
	record,
	displayIndex,
	dimensionSettings,
	columnTypes,
	columnFormats,
	selectedGeography,
}: ResolveSymbolTextMappedValueParams): string => {
	const symbolTextBy = dimensionSettings.symbol.symbolTextBy;
	if (!symbolTextBy) {
		return '';
	}

	if (symbolTextBy === SYMBOL_TEXT_ROW_INDEX) {
		return String(displayIndex + 1);
	}

	const value = record[symbolTextBy];
	if (value === undefined || value === null || String(value).trim() === '') {
		return '';
	}

	return formatLegendValue(value, symbolTextBy, columnTypes, columnFormats, selectedGeography);
};

export interface ResolveSymbolTextContentParams {
	labelId: string;
	stylingSettings: StylingSettings;
	symbolData: DataRecord[];
	dimensionSettings: DimensionSettings;
	columnTypes: ColumnType;
	columnFormats: ColumnFormat;
	selectedGeography: GeographyKey;
}

export const resolveSymbolTextTemplateValue = ({
	labelId,
	symbolData,
	dimensionSettings,
	columnTypes,
	columnFormats,
	selectedGeography,
}: Omit<ResolveSymbolTextContentParams, 'stylingSettings'>): string => {
	const index = parseSymbolLabelIndex(labelId);
	if (index === undefined || index < 0 || index >= symbolData.length) {
		return '';
	}
	return resolveSymbolTextMappedValue({
		record: symbolData[index],
		displayIndex: index,
		dimensionSettings,
		columnTypes,
		columnFormats,
		selectedGeography,
	});
};

/** Plain text for editor display (override or mapped value). */
export const resolveSymbolTextDisplayText = ({
	labelId,
	stylingSettings,
	...params
}: ResolveSymbolTextContentParams): string => {
	const overrideText = stylingSettings.individualLabelOverrides?.[labelId]?.text;
	if (overrideText !== undefined) {
		return overrideText;
	}
	return resolveSymbolTextTemplateValue({ labelId, ...params });
};

/** Text for map rendering (override or mapped value). */
export const resolveSymbolTextRenderText = resolveSymbolTextDisplayText;

export const getDefaultSymbolTextStyling = (): NonNullable<StylingSettings['symbol']['symbolText']> => ({
	fontFamily: 'Inter',
	fontBold: true,
	fontItalic: false,
	fontSize: 10,
	color: '#ffffff',
	outlineColor: '#000000',
	outlineThickness: 0,
	offsetX: 0,
	offsetY: 0,
	scaleWithSymbol: true,
});

export const getSymbolTextStyling = (stylingSettings: StylingSettings) =>
	stylingSettings.symbol.symbolText ?? getDefaultSymbolTextStyling();
