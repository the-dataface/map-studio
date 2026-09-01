import * as d3 from 'd3'
import type { Feature, FeatureCollection, Point } from 'geojson'

import type {
  ColumnFormat,
  ColumnType,
  DataRow,
  DimensionSettings,
  GeocodedRow,
  GeographyKey,
  StylingSettings,
  SymbolDimensionSettings,
} from '@/app/(studio)/types'
import { resolveLabelDisplayText } from '@/lib/label-content'
import { getSymbolTextLabelId, getSymbolTextStyling, resolveSymbolTextRenderText } from '@/lib/symbol-text-content'
import { getNumericValue, getUniqueValues } from '@/modules/map-preview/helpers'

import { getSymbolLabelTextLayout } from '../maplibre/maplibre-text-styles'

type DataRecord = DataRow | GeocodedRow

export type SymbolPointProperties = {
  __rowIndex: number
  __dataIndex: number
  __color: string
  __radius: number
  __strokeColor: string
  __strokeWidth: number
  __fillOpacity: number
  __strokeOpacity: number
  __labelText: string
  __symbolText: string
  __labelTextOffsetX: number
  __labelTextOffsetY: number
  __symbolTextFontSize: number
  [key: string]: unknown
}

export type SymbolPointCollection = FeatureCollection<Point, SymbolPointProperties>

export interface ToGeoJsonSymbolsResult {
  features: SymbolPointCollection
  plottedCount: number
  skippedCount: number
  /** Records parallel to features[] — used for inspect tooltips */
  records: DataRecord[]
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  )
}

function buildSizeScale(
  symbolSettings: SymbolDimensionSettings,
  validSymbolData: DataRecord[],
): d3.ScaleLinear<number, number, never> | null {
  if (!symbolSettings.sizeBy || validSymbolData.length === 0) {
    return null
  }

  const numericValues = validSymbolData
    .map((record) => getNumericValue(record, symbolSettings.sizeBy) ?? 0)
    .filter((value) => !Number.isNaN(value))

  if (numericValues.length === 0) {
    return null
  }

  const minValue = Math.min(...numericValues)
  const maxValue = Math.max(...numericValues)

  if (minValue === maxValue) {
    return null
  }

  return d3
    .scaleLinear()
    .domain([symbolSettings.sizeMinValue, symbolSettings.sizeMaxValue])
    .range([symbolSettings.sizeMin, symbolSettings.sizeMax])
}

function buildColorScale(
  symbolSettings: SymbolDimensionSettings,
  stylingSettings: StylingSettings,
  validSymbolData: DataRecord[],
): d3.ScaleLinear<number, string, never> | ((value: unknown) => string) | null {
  if (!symbolSettings.colorBy || validSymbolData.length === 0) {
    return null
  }

  if (symbolSettings.colorScale === 'linear') {
    const domain = [symbolSettings.colorMinValue, symbolSettings.colorMaxValue]
    const range = [
      symbolSettings.colorMinColor || stylingSettings.symbol.symbolFillColor,
      symbolSettings.colorMaxColor || stylingSettings.symbol.symbolFillColor,
    ]

    if (symbolSettings.colorMidColor) {
      domain.splice(1, 0, symbolSettings.colorMidValue)
      range.splice(1, 0, symbolSettings.colorMidColor)
    }

    const linearScale = d3.scaleLinear<number, string>()
    linearScale.domain(domain)
    // @ts-expect-error - D3 scale types don't properly handle string ranges with number domains
    linearScale.range(range)
    return linearScale
  }

  const categories = getUniqueValues(symbolSettings.colorBy, validSymbolData)
  const colorMap = new Map<string, string>()
  symbolSettings.categoricalColors?.forEach((item, index) => {
    const category = categories[index]
    if (category !== undefined) {
      colorMap.set(String(category), item.color)
    }
  })

  return (value: unknown) =>
    colorMap.get(String(value)) || stylingSettings.symbol.symbolFillColor
}

function colorForRecord(
  record: DataRecord,
  symbolSettings: SymbolDimensionSettings,
  stylingSettings: StylingSettings,
  colorScale: ReturnType<typeof buildColorScale>,
): string {
  if (!colorScale || !symbolSettings.colorBy) {
    return stylingSettings.symbol.symbolFillColor
  }

  if (symbolSettings.colorScale === 'linear') {
    const numeric = getNumericValue(record, symbolSettings.colorBy)
    return numeric === null
      ? stylingSettings.symbol.symbolFillColor
      : (colorScale as d3.ScaleLinear<number, string, never>)(numeric)
  }

  return (colorScale as (value: unknown) => string)(String(record[symbolSettings.colorBy]))
}

export function toGeoJsonSymbols({
  symbolData,
  dimensionSettings,
  stylingSettings,
  columnTypes = {},
  columnFormats = {},
  selectedGeography,
}: {
  symbolData: DataRecord[]
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
  columnTypes?: ColumnType
  columnFormats?: ColumnFormat
  selectedGeography?: GeographyKey
}): ToGeoJsonSymbolsResult {
  const symbolSettings = dimensionSettings.symbol
  const latColumn = symbolSettings.latitude
  const lngColumn = symbolSettings.longitude

  if (!latColumn || !lngColumn) {
    return {
      features: { type: 'FeatureCollection', features: [] },
      plottedCount: 0,
      skippedCount: symbolData.length,
      records: [],
    }
  }

  const geography = selectedGeography ?? dimensionSettings.selectedGeography
  const symbolTextSettings = getSymbolTextStyling(stylingSettings)
  const baseSymbolSize = stylingSettings.symbol.symbolSize
  const labelFontSize = stylingSettings.symbol.labelFontSize ?? 10
  const labelLayout = getSymbolLabelTextLayout(
    stylingSettings.symbol.labelAlignment ?? 'auto',
    baseSymbolSize,
    labelFontSize,
    stylingSettings.symbol.labelOffsetX ?? 0,
    stylingSettings.symbol.labelOffsetY ?? 0,
  )

  const validRecords: Array<{ record: DataRecord; dataIndex: number }> = []
  symbolData.forEach((record, dataIndex) => {
    const lat = Number(record[latColumn])
    const lng = Number(record[lngColumn])
    if (isValidCoordinate(lat, lng)) {
      validRecords.push({ record, dataIndex })
    }
  })

  const validSymbolData = validRecords.map((entry) => entry.record)
  const sizeScale = buildSizeScale(symbolSettings, validSymbolData)
  const colorScale = buildColorScale(symbolSettings, stylingSettings, validSymbolData)

  const fillOpacity = (stylingSettings.symbol.symbolFillTransparency ?? 80) / 100
  const strokeOpacity = (stylingSettings.symbol.symbolStrokeTransparency ?? 100) / 100

  const features: Feature<Point, SymbolPointProperties>[] = validRecords.map(({ record, dataIndex }, rowIndex) => {
    const lat = Number(record[latColumn])
    const lng = Number(record[lngColumn])
    const radius = sizeScale
      ? sizeScale(getNumericValue(record, symbolSettings.sizeBy) || 0)
      : stylingSettings.symbol.symbolSize

    const labelId = `symbol-${dataIndex}`
    const symbolTextLabelId = getSymbolTextLabelId(dataIndex)

    const labelText = symbolSettings.labelTemplate
      ? resolveLabelDisplayText({
          labelId,
          mapType: 'symbol',
          dimensionSettings,
          stylingSettings,
          symbolData,
          choroplethData: [],
          columnTypes,
          columnFormats,
          selectedGeography: geography,
          asPlainText: true,
        })
      : ''

    const symbolText = symbolSettings.symbolTextBy
      ? resolveSymbolTextRenderText({
          labelId: symbolTextLabelId,
          stylingSettings,
          symbolData,
          dimensionSettings,
          columnTypes,
          columnFormats,
          selectedGeography: geography,
        })
      : ''

    let symbolTextFontSize = symbolTextSettings.fontSize
    if (
      symbolTextSettings.scaleWithSymbol &&
      baseSymbolSize > 0 &&
      symbolSettings.symbolTextBy
    ) {
      symbolTextFontSize = symbolTextFontSize * (radius / baseSymbolSize)
    }

    const perPointLabelLayout =
      symbolSettings.labelTemplate && radius !== baseSymbolSize
        ? getSymbolLabelTextLayout(
            stylingSettings.symbol.labelAlignment ?? 'auto',
            radius,
            labelFontSize,
            stylingSettings.symbol.labelOffsetX ?? 0,
            stylingSettings.symbol.labelOffsetY ?? 0,
          )
        : labelLayout

    return {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [lng, lat],
      },
      properties: {
        __rowIndex: rowIndex,
        __dataIndex: dataIndex,
        __color: colorForRecord(record, symbolSettings, stylingSettings, colorScale),
        __radius: radius,
        __strokeColor: stylingSettings.symbol.symbolStrokeColor,
        __strokeWidth: stylingSettings.symbol.symbolStrokeWidth,
        __fillOpacity: fillOpacity,
        __strokeOpacity: strokeOpacity,
        __labelText: labelText,
        __symbolText: symbolText,
        __labelTextOffsetX: perPointLabelLayout.textOffset[0],
        __labelTextOffsetY: perPointLabelLayout.textOffset[1],
        __symbolTextFontSize: symbolTextFontSize,
      },
    }
  })

  return {
    features: {
      type: 'FeatureCollection',
      features,
    },
    plottedCount: features.length,
    skippedCount: symbolData.length - features.length,
    records: validSymbolData,
  }
}
