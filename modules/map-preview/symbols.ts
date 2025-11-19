import * as d3 from 'd3'

import type {
  DataRow,
  DimensionSettings,
  GeocodedRow,
  StylingSettings,
} from '@/app/(studio)/types'

type DataRecord = DataRow | GeocodedRow

type SvgSelection = d3.Selection<SVGSVGElement, unknown, null, undefined>

type Projection = d3.GeoProjection

type SizeScale = d3.ScaleLinear<number, number, never>

type LinearColorScale = d3.ScaleLinear<number, string, never>

type ColorScale = LinearColorScale | ((value: any) => string)

type NumericGetter = (row: DataRecord, column: string) => number | null

type UniqueValuesGetter = (column: string, data: DataRecord[]) => any[]

type SymbolPathGetter = (
  type: StylingSettings['symbol']['symbolType'],
  shape: StylingSettings['symbol']['symbolShape'],
  size: number,
  customSvgPath?: string,
) => { pathData: string; transform: string; fillRule?: string }

interface RenderSymbolsParams {
  svg: SvgSelection
  projection: Projection
  symbolData: DataRecord[]
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
  getNumericValue: NumericGetter
  getUniqueValues: UniqueValuesGetter
  getSymbolPathData: SymbolPathGetter
}

interface RenderSymbolsResult {
  sizeScale: SizeScale | null
  colorScale: ColorScale | null
  validSymbolData: DataRecord[]
}

export const renderSymbols = ({
  svg,
  projection,
  symbolData,
  dimensionSettings,
  stylingSettings,
  getNumericValue,
  getUniqueValues,
  getSymbolPathData,
}: RenderSymbolsParams): RenderSymbolsResult => {
  const { symbol } = dimensionSettings
  const symbolGroup = svg.append('g').attr('id', 'Symbols')

  const validSymbolData = symbolData.filter((record) => {
    const lat = Number(record[symbol.latitude])
    const lng = Number(record[symbol.longitude])
    const isValid = !Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
    return isValid
  })

  let sizeScale: SizeScale | null = null
  if (symbol.sizeBy && validSymbolData.length > 0) {
    const numericValues = validSymbolData
      .map((record) => getNumericValue(record, symbol.sizeBy) ?? 0)
      .filter((value) => !Number.isNaN(value))

    const minValue = Math.min(...numericValues)
    const maxValue = Math.max(...numericValues)

    if (minValue !== maxValue) {
      sizeScale = d3
        .scaleLinear()
        .domain([symbol.sizeMinValue, symbol.sizeMaxValue])
        .range([symbol.sizeMin, symbol.sizeMax])
    }
  }

  let colorScale: ColorScale | null = null
  if (symbol.colorBy && validSymbolData.length > 0) {
    if (symbol.colorScale === 'linear') {
      const domain = [symbol.colorMinValue, symbol.colorMaxValue]
      const range = [
        symbol.colorMinColor || stylingSettings.symbol.symbolFillColor,
        symbol.colorMaxColor || stylingSettings.symbol.symbolFillColor,
      ]

      if (symbol.colorMidColor) {
        domain.splice(1, 0, symbol.colorMidValue)
        range.splice(1, 0, symbol.colorMidColor)
      }

      const linearScale = d3.scaleLinear<number, string>()
      linearScale.domain(domain)
      // @ts-expect-error - D3 scale types don't properly handle string ranges with number domains
      linearScale.range(range)
      colorScale = linearScale as LinearColorScale
    } else {
      const categories = getUniqueValues(symbol.colorBy, validSymbolData)
      const colorMap = new Map<string, string>()

      symbol.categoricalColors?.forEach((item: any, index: number) => {
        const category = categories[index]
        if (category !== undefined) {
          colorMap.set(String(category), item.color)
        }
      })

      colorScale = (value: any) => colorMap.get(String(value)) || stylingSettings.symbol.symbolFillColor
    }
  }

  const groups = symbolGroup
    .selectAll<SVGGElement, DataRecord>('g')
    .data(validSymbolData)
    .join('g')
    .attr('transform', (record) => {
      const lat = Number(record[symbol.latitude])
      const lng = Number(record[symbol.longitude])
      const projected = projection([lng, lat])
      if (!projected) {
        return 'translate(0, 0)'
      }

      const size = sizeScale
        ? sizeScale(getNumericValue(record, symbol.sizeBy) || 0)
        : stylingSettings.symbol.symbolSize

      const { transform } = getSymbolPathData(
        stylingSettings.symbol.symbolType,
        stylingSettings.symbol.symbolShape,
        size,
        stylingSettings.symbol.customSvgPath,
      )

      const baseTransform = `translate(${projected[0]}, ${projected[1]})`
      return transform ? `${baseTransform} ${transform}` : baseTransform
    })

  groups.each(function (record) {
    const group = d3.select(this as SVGGElement)
    const size = sizeScale
      ? sizeScale(getNumericValue(record, symbol.sizeBy) || 0)
      : stylingSettings.symbol.symbolSize

    const { pathData, fillRule } = getSymbolPathData(
      stylingSettings.symbol.symbolType,
      stylingSettings.symbol.symbolShape,
      size,
      stylingSettings.symbol.customSvgPath,
    )

    const path = group
      .append('path')
      .attr('d', pathData)
      .attr('stroke', stylingSettings.symbol.symbolStrokeColor)
      .attr('stroke-width', stylingSettings.symbol.symbolStrokeWidth)
      .attr('fill-opacity', (stylingSettings.symbol.symbolFillTransparency || 80) / 100)
      .attr('stroke-opacity', (stylingSettings.symbol.symbolStrokeTransparency || 100) / 100)

    const fillColor = (() => {
      if (!colorScale || !symbol.colorBy) {
        return stylingSettings.symbol.symbolFillColor
      }

      if (symbol.colorScale === 'linear') {
        const numeric = getNumericValue(record, symbol.colorBy)
        return numeric === null ? stylingSettings.symbol.symbolFillColor : (colorScale as LinearColorScale)(numeric)
      }

      return (colorScale as (value: any) => string)(String(record[symbol.colorBy]))
    })()

    path.attr('fill', fillColor)

    if (fillRule) {
      path.attr('fill-rule', fillRule)
    }
  })

  return {
    sizeScale,
    colorScale,
    validSymbolData,
  }
}
