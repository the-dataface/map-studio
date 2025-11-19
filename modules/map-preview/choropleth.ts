import * as d3 from 'd3'
import type {
  ColumnFormat,
  ColumnType,
  DataRow,
  DimensionSettings,
  GeocodedRow,
  GeographyKey,
  StylingSettings,
} from '@/app/(studio)/types'

type DataRecord = DataRow | GeocodedRow

type SvgSelection = d3.Selection<SVGSVGElement, unknown, null, undefined>

type NormalizeFn = (value: string, geography: GeographyKey) => string

type ExtractCandidateFn = (id: string) => string | null

type GetNumericValueFn = (row: DataRecord, column: string) => number | null

type GetUniqueValuesFn = (column: string, data: DataRecord[]) => any[]

type ChoroplethLinearScale = d3.ScaleLinear<number, string, never>

type ChoroplethCategoricalScale = (value: any) => string

export type ChoroplethColorScale = ChoroplethLinearScale | ChoroplethCategoricalScale

interface ApplyChoroplethParams {
  svg: SvgSelection
  choroplethData: DataRecord[]
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
  columnTypes: ColumnType
  columnFormats: ColumnFormat
  selectedGeography: GeographyKey
  customMapData: string
  normalizeGeoIdentifier: NormalizeFn
  extractCandidateFromSVGId: ExtractCandidateFn
  getNumericValue: GetNumericValueFn
  getUniqueValues: GetUniqueValuesFn
}

export const applyChoroplethColors = ({
  svg,
  choroplethData,
  dimensionSettings,
  stylingSettings,
  selectedGeography,
  customMapData,
  normalizeGeoIdentifier,
  extractCandidateFromSVGId,
  getNumericValue,
  getUniqueValues,
}: ApplyChoroplethParams): ChoroplethColorScale | null => {
  const choroplethSettings = dimensionSettings.choropleth
  if (!choroplethSettings?.stateColumn || !choroplethSettings?.colorBy) {
    return null
  }

  const geoDataMap = new Map<string, number | string>()
  choroplethData.forEach((record) => {
    const rawValue = String(record[choroplethSettings.stateColumn] || '')
    if (!rawValue.trim()) {
      return
    }

    const normalizedKey = normalizeGeoIdentifier(rawValue, selectedGeography)
    const value =
      choroplethSettings.colorScale === 'linear'
        ? getNumericValue(record, choroplethSettings.colorBy)
        : String(record[choroplethSettings.colorBy])

    if (
      value !== null &&
      (choroplethSettings.colorScale === 'linear' ? !Number.isNaN(value as number) : value !== '')
    ) {
      geoDataMap.set(normalizedKey, value)
    }
  })

  if (geoDataMap.size === 0) {
    return null
  }

  let colorScale: ChoroplethColorScale

  if (choroplethSettings.colorScale === 'linear') {
    const domain = [choroplethSettings.colorMinValue, choroplethSettings.colorMaxValue]
    const rangeColors = [
      choroplethSettings.colorMinColor || stylingSettings.base.defaultStateFillColor,
      choroplethSettings.colorMaxColor || stylingSettings.base.defaultStateFillColor,
    ]

    if (choroplethSettings.colorMidColor) {
      domain.splice(1, 0, choroplethSettings.colorMidValue)
      rangeColors.splice(1, 0, choroplethSettings.colorMidColor)
    }

    const linearScale = d3.scaleLinear<number, string>()
    linearScale.domain(domain)
    // @ts-expect-error - D3 scale types don't properly handle string ranges with number domains
    linearScale.range(rangeColors)
    colorScale = linearScale as ChoroplethLinearScale
  } else {
    const categories = getUniqueValues(choroplethSettings.colorBy, choroplethData)
    const colorMap = new Map<string, string>()

    choroplethSettings.categoricalColors?.forEach((item: any, index: number) => {
      const category = categories[index]
      if (category !== undefined) {
        colorMap.set(String(category), item.color)
      }
    })

    colorScale = (value: any) =>
      colorMap.get(String(value)) || stylingSettings.base.defaultStateFillColor
  }

  const mapGroup = svg.select('#Map')
  if (mapGroup.empty()) {
    return colorScale
  }

  mapGroup.selectAll<SVGElement, any>('path, g').each(function () {
    const element = d3.select(this)
    let effectiveId = element.attr('id')

    if (this.tagName === 'path' && !effectiveId && this.parentElement?.tagName === 'g') {
      effectiveId = d3.select(this.parentElement).attr('id')
    }

    let featureKey: string | null = null

    if (effectiveId) {
      if (customMapData) {
        const candidate = extractCandidateFromSVGId(effectiveId)
        featureKey = normalizeGeoIdentifier(candidate || effectiveId, selectedGeography)
      } else {
        const datum = element.datum() as any

        if (selectedGeography.startsWith('usa-states') || selectedGeography.startsWith('usa-counties')) {
          featureKey = datum?.id ? normalizeGeoIdentifier(String(datum.id), selectedGeography) : null
        } else if (selectedGeography.startsWith('canada-provinces')) {
          const abbrKey = datum?.id ? normalizeGeoIdentifier(String(datum.id), selectedGeography) : null
          const nameKey = datum?.properties?.name
            ? normalizeGeoIdentifier(String(datum.properties.name), selectedGeography)
            : null

          if (abbrKey && geoDataMap.has(abbrKey)) {
            featureKey = abbrKey
          } else if (nameKey && geoDataMap.has(nameKey)) {
            featureKey = nameKey
          } else {
            featureKey = abbrKey || nameKey
          }
        } else if (
          selectedGeography === 'world' ||
          selectedGeography === 'usa-nation' ||
          selectedGeography === 'canada-nation'
        ) {
          featureKey = datum?.properties?.name
            ? normalizeGeoIdentifier(String(datum.properties.name), selectedGeography)
            : datum?.id
            ? normalizeGeoIdentifier(String(datum.id), selectedGeography)
            : effectiveId
        }
      }
    }

    if (!featureKey) {
      element.attr('fill', stylingSettings.base.defaultStateFillColor)
      return
    }

    const value = geoDataMap.get(featureKey)
    if (value === undefined) {
      element.attr('fill', stylingSettings.base.defaultStateFillColor)
      return
    }

    const nextColor = choroplethSettings.colorScale === 'linear' ? (colorScale as ChoroplethLinearScale)(value as number) : (colorScale as ChoroplethCategoricalScale)(value)
    element.attr('fill', nextColor)
  })

  return colorScale
}
