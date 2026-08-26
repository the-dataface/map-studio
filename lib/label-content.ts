import type {
	ColumnFormat,
	ColumnType,
	DataRow,
	DimensionSettings,
	GeocodedRow,
	GeographyKey,
	StylingSettings,
} from '@/app/(studio)/types';
import { renderLabelPreview } from '@/modules/data-ingest/formatting';
import { normalizeGeoIdentifier } from '@/modules/map-preview/geography';

type DataRecord = DataRow | GeocodedRow;

/** Convert rendered label HTML to plain text for editing. */
export const labelHtmlToPlainText = (html: string): string => {
	return html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/p>\s*<p>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.trim();
};

const findSymbolRecord = (labelId: string, symbolData: DataRecord[]): DataRecord | undefined => {
	const index = Number.parseInt(labelId.replace(/^symbol-/, ''), 10);
	if (Number.isNaN(index) || index < 0 || index >= symbolData.length) {
		return undefined;
	}
	return symbolData[index];
};

const findChoroplethRecord = (
	labelId: string,
	choroplethData: DataRecord[],
	dimensionSettings: DimensionSettings,
	selectedGeography: GeographyKey
): DataRecord | undefined => {
	const featureId = labelId.replace(/^choropleth-/, '');
	if (!featureId || featureId === 'unknown') {
		return undefined;
	}

	const stateColumn = dimensionSettings.choropleth.stateColumn;
	if (!stateColumn) {
		return undefined;
	}

	return choroplethData.find((record) => {
		const raw = String(record[stateColumn] || '');
		if (!raw.trim()) {
			return false;
		}
		return normalizeGeoIdentifier(raw, selectedGeography) === featureId;
	});
};

interface ResolveLabelTemplateTextParams {
	labelId: string;
	mapType: 'symbol' | 'choropleth';
	dimensionSettings: DimensionSettings;
	symbolData: DataRecord[];
	choroplethData: DataRecord[];
	columnTypes: ColumnType;
	columnFormats: ColumnFormat;
	selectedGeography: GeographyKey;
}

/** Resolve label text from the dimension template and data row (no per-label override). */
export const resolveLabelTemplateText = ({
	labelId,
	mapType,
	dimensionSettings,
	symbolData,
	choroplethData,
	columnTypes,
	columnFormats,
	selectedGeography,
}: ResolveLabelTemplateTextParams): string => {
	if (mapType === 'symbol') {
		const template = dimensionSettings.symbol.labelTemplate;
		if (!template) {
			return '';
		}
		const record = findSymbolRecord(labelId, symbolData);
		return renderLabelPreview(template, record, columnTypes, columnFormats, selectedGeography);
	}

	const template = dimensionSettings.choropleth.labelTemplate;
	if (!template) {
		return '';
	}
	const record = findChoroplethRecord(labelId, choroplethData, dimensionSettings, selectedGeography);
	return renderLabelPreview(template, record, columnTypes, columnFormats, selectedGeography);
};

interface ResolveLabelDisplayTextParams extends ResolveLabelTemplateTextParams {
	stylingSettings: StylingSettings;
	asPlainText?: boolean;
}

/** Resolve the text shown for a label, including any per-label content override. */
export const resolveLabelDisplayText = ({
	stylingSettings,
	asPlainText = true,
	...params
}: ResolveLabelDisplayTextParams): string => {
	const override = stylingSettings.individualLabelOverrides?.[params.labelId];
	if (override?.text !== undefined) {
		return override.text;
	}

	const templateText = resolveLabelTemplateText(params);
	return asPlainText ? labelHtmlToPlainText(templateText) : templateText;
};

/** Resolve label text for map rendering (HTML from template or plain override text). */
export const resolveLabelRenderText = ({
	stylingSettings,
	...params
}: ResolveLabelDisplayTextParams): string => {
	const override = stylingSettings.individualLabelOverrides?.[params.labelId];
	if (override?.text !== undefined) {
		return override.text;
	}
	return resolveLabelTemplateText(params);
};
