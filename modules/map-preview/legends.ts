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
type LegendGroupSelection = d3.Selection<SVGGElement, unknown, null, undefined>

type LegendFormatter = (
  value: unknown,
  column: string,
  columnTypes: ColumnType,
  columnFormats: ColumnFormat,
  selectedGeography: GeographyKey,
) => string

type SymbolPathGetter = (
  type: StylingSettings['symbol']['symbolType'],
  shape: StylingSettings['symbol']['symbolShape'],
  size: number,
  customSvgPath?: string,
) => { pathData: string; transform: string; fillRule?: string }

const LEGEND_ROW_HEIGHT = 52
const LEGEND_GAP = 12

export interface LegendFlags {
  showSymbolSizeLegend: boolean
  showSymbolColorLegend: boolean
  showChoroplethColorLegend: boolean
}

export const estimateLegendHeight = ({
  showSymbolSizeLegend,
  showSymbolColorLegend,
  showChoroplethColorLegend,
}: LegendFlags): number => {
  let count = 0
  if (showSymbolSizeLegend) count++
  if (showSymbolColorLegend) count++
  if (showChoroplethColorLegend) count++
  if (count === 0) return 0
  return count * LEGEND_ROW_HEIGHT + (count - 1) * LEGEND_GAP + 16
}

interface LegendStyle {
  fontFamily: string
  labelColor: string
  mutedColor: string
  mapBackground: string
}

const resolveLegendStyle = (
  stylingSettings: StylingSettings,
  prefer: 'symbol' | 'choropleth',
): LegendStyle => ({
  fontFamily: mapFontFamily(
    prefer === 'symbol'
      ? stylingSettings.symbol.labelFontFamily
      : stylingSettings.choropleth.labelFontFamily,
  ),
  labelColor: '#2c2825',
  mutedColor: '#6b6560',
  mapBackground: stylingSettings.base.mapBackgroundColor || '#faf8f5',
})

const mapFontFamily = (font: string | undefined): string => {
  switch (font) {
    case 'Geist Sans':
    case 'Geist Mono':
      return font
    case 'Inter':
      return 'Inter, system-ui, sans-serif'
    case 'Roboto':
      return 'Roboto, system-ui, sans-serif'
    case 'Open Sans':
      return '"Open Sans", system-ui, sans-serif'
    case 'Lato':
      return 'Lato, system-ui, sans-serif'
    case 'Montserrat':
      return 'Montserrat, system-ui, sans-serif'
    default:
      return font || 'Geist Sans, system-ui, sans-serif'
  }
}

const appendLegendTitle = (
  group: LegendGroupSelection,
  x: number,
  y: number,
  label: string,
  column: string,
  style: LegendStyle,
) => {
  group
    .append('text')
    .attr('x', x)
    .attr('y', y)
    .attr('font-family', style.fontFamily)
    .attr('font-size', '9px')
    .attr('font-weight', '500')
    .attr('letter-spacing', '0.08em')
    .attr('fill', style.mutedColor)
    .text(`${label.toUpperCase()} · ${column}`)
}

const appendLinearGradientBar = (
  root: LegendGroupSelection,
  gradientId: string,
  x: number,
  y: number,
  barWidth: number,
  barHeight: number,
  domain: number[],
  rangeColors: string[],
) => {
  const defs = root.select<SVGDefsElement>('defs').empty()
    ? root.append('defs')
    : root.select<SVGDefsElement>('defs')

  defs.select(`#${gradientId}`).remove()

  const gradient = defs
    .append('linearGradient')
    .attr('id', gradientId)
    .attr('x1', '0%')
    .attr('x2', '100%')
    .attr('y1', '0%')
    .attr('y2', '0%')

  rangeColors.forEach((color, index) => {
    gradient
      .append('stop')
      .attr('offset', `${(index / (rangeColors.length - 1)) * 100}%`)
      .attr('stop-color', color)
  })

  return root
    .append('rect')
    .attr('x', x)
    .attr('y', y)
    .attr('width', barWidth)
    .attr('height', barHeight)
    .attr('fill', `url(#${gradientId})`)
}

export interface RenderLegendsParams extends LegendFlags {
  svg: SvgSelection
  width: number
  mapHeight: number
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
  columnTypes: ColumnType
  columnFormats: ColumnFormat
  selectedGeography: GeographyKey
  symbolData: DataRecord[]
  choroplethData: DataRecord[]
  symbolColorScale: ((value: unknown) => string) | null
  choroplethColorScale: ((value: unknown) => string) | null
  getUniqueValues: (column: string, data: DataRecord[]) => unknown[]
  formatLegendValue: LegendFormatter
  getSymbolPathData: SymbolPathGetter
}

export const renderLegends = ({
  svg,
  width,
  mapHeight,
  showSymbolSizeLegend,
  showSymbolColorLegend,
  showChoroplethColorLegend,
  dimensionSettings,
  stylingSettings,
  columnTypes,
  columnFormats,
  selectedGeography,
  symbolData,
  choroplethData,
  symbolColorScale,
  choroplethColorScale,
  getUniqueValues,
  formatLegendValue,
  getSymbolPathData,
}: RenderLegendsParams) => {
  if (!showSymbolSizeLegend && !showSymbolColorLegend && !showChoroplethColorLegend) {
    return
  }

  const legendGroup = svg.append('g').attr('id', 'Legends')
  let currentLegendY = mapHeight + 16
  const contentWidth = width - 48
  const contentX = 24

  if (showSymbolSizeLegend) {
    currentLegendY = renderSymbolSizeLegend({
      legendGroup,
      width,
      contentX,
      contentWidth,
      currentLegendY,
      dimensionSettings,
      stylingSettings,
      columnTypes,
      columnFormats,
      selectedGeography,
      formatLegendValue,
      getSymbolPathData,
    })
    currentLegendY += LEGEND_GAP
  }

  if (showSymbolColorLegend) {
    currentLegendY = renderSymbolColorLegend({
      legendGroup,
      width,
      contentX,
      contentWidth,
      currentLegendY,
      dimensionSettings,
      stylingSettings,
      columnTypes,
      columnFormats,
      selectedGeography,
      symbolData,
      symbolColorScale,
      getUniqueValues,
      formatLegendValue,
      getSymbolPathData,
    })
    currentLegendY += LEGEND_GAP
  }

  if (showChoroplethColorLegend) {
    renderChoroplethColorLegend({
      legendGroup,
      width,
      contentX,
      contentWidth,
      currentLegendY,
      dimensionSettings,
      stylingSettings,
      columnTypes,
      columnFormats,
      selectedGeography,
      choroplethData,
      choroplethColorScale,
      formatLegendValue,
    })
  }
}

interface SymbolSizeLegendParams {
  legendGroup: LegendGroupSelection
  width: number
  contentX: number
  contentWidth: number
  currentLegendY: number
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
  columnTypes: ColumnType
  columnFormats: ColumnFormat
  selectedGeography: GeographyKey
  formatLegendValue: LegendFormatter
  getSymbolPathData: SymbolPathGetter
}

const renderSymbolSizeLegend = ({
  legendGroup,
  width,
  contentX,
  contentWidth,
  currentLegendY,
  dimensionSettings,
  stylingSettings,
  columnTypes,
  columnFormats,
  selectedGeography,
  formatLegendValue,
  getSymbolPathData,
}: SymbolSizeLegendParams): number => {
  const group = legendGroup.append('g').attr('id', 'SizeLegend')
  const style = resolveLegendStyle(stylingSettings, 'symbol')

  appendLegendTitle(group, contentX, currentLegendY + 10, 'Size', dimensionSettings.symbol.sizeBy, style)

  const symbolColor = dimensionSettings.symbol.colorBy
    ? stylingSettings.base.nationFillColor
    : stylingSettings.symbol.symbolFillColor
  const symbolStroke = dimensionSettings.symbol.colorBy
    ? stylingSettings.base.nationStrokeColor
    : stylingSettings.symbol.symbolStrokeColor

  const centerY = currentLegendY + 32
  const minSize = 8
  const maxSize = 20
  const midX = contentX + contentWidth / 2

  const minLabel = formatLegendValue(
    dimensionSettings.symbol.sizeMinValue,
    dimensionSettings.symbol.sizeBy,
    columnTypes,
    columnFormats,
    selectedGeography,
  )
  const maxLabel = formatLegendValue(
    dimensionSettings.symbol.sizeMaxValue,
    dimensionSettings.symbol.sizeBy,
    columnTypes,
    columnFormats,
    selectedGeography,
  )

  const { pathData: minPath } = getSymbolPathData(
    stylingSettings.symbol.symbolType,
    stylingSettings.symbol.symbolShape,
    minSize,
    stylingSettings.symbol.customSvgPath,
  )
  const { pathData: maxPath } = getSymbolPathData(
    stylingSettings.symbol.symbolType,
    stylingSettings.symbol.symbolShape,
    maxSize,
    stylingSettings.symbol.customSvgPath,
  )

  group
    .append('path')
    .attr('d', minPath)
    .attr('transform', `translate(${midX - 48}, ${centerY})`)
    .attr('fill', symbolColor)
    .attr('stroke', symbolStroke)
    .attr('stroke-width', 0.75)

  group
    .append('path')
    .attr('d', maxPath)
    .attr('transform', `translate(${midX + 48}, ${centerY})`)
    .attr('fill', symbolColor)
    .attr('stroke', symbolStroke)
    .attr('stroke-width', 0.75)

  group
    .append('line')
    .attr('x1', midX - 32)
    .attr('y1', centerY)
    .attr('x2', midX + 32)
    .attr('y2', centerY)
    .attr('stroke', style.mutedColor)
    .attr('stroke-width', 0.75)

  group
    .append('text')
    .attr('x', midX - 64)
    .attr('y', centerY + 14)
    .attr('text-anchor', 'middle')
    .attr('font-family', style.fontFamily)
    .attr('font-size', '10px')
    .attr('fill', style.labelColor)
    .text(minLabel)

  group
    .append('text')
    .attr('x', midX + 64)
    .attr('y', centerY + 14)
    .attr('text-anchor', 'middle')
    .attr('font-family', style.fontFamily)
    .attr('font-size', '10px')
    .attr('fill', style.labelColor)
    .text(maxLabel)

  return currentLegendY + LEGEND_ROW_HEIGHT
}

interface SymbolColorLegendParams {
  legendGroup: LegendGroupSelection
  width: number
  contentX: number
  contentWidth: number
  currentLegendY: number
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
  columnTypes: ColumnType
  columnFormats: ColumnFormat
  selectedGeography: GeographyKey
  symbolData: DataRecord[]
  symbolColorScale: ((value: unknown) => string) | null
  getUniqueValues: (column: string, data: DataRecord[]) => unknown[]
  formatLegendValue: LegendFormatter
  getSymbolPathData: SymbolPathGetter
}

const renderSymbolColorLegend = ({
  legendGroup,
  contentX,
  contentWidth,
  currentLegendY,
  dimensionSettings,
  stylingSettings,
  columnTypes,
  columnFormats,
  selectedGeography,
  symbolData,
  symbolColorScale,
  getUniqueValues,
  formatLegendValue,
}: SymbolColorLegendParams): number => {
  const group = legendGroup.append('g').attr('id', 'SymbolColorLegend')
  const style = resolveLegendStyle(stylingSettings, 'symbol')

  appendLegendTitle(group, contentX, currentLegendY + 10, 'Color', dimensionSettings.symbol.colorBy, style)

  if (dimensionSettings.symbol.colorScale === 'linear') {
    const domain = [dimensionSettings.symbol.colorMinValue, dimensionSettings.symbol.colorMaxValue]
    const rangeColors = [
      dimensionSettings.symbol.colorMinColor || stylingSettings.symbol.symbolFillColor,
      dimensionSettings.symbol.colorMaxColor || stylingSettings.symbol.symbolFillColor,
    ]
    if (dimensionSettings.symbol.colorMidColor) {
      domain.splice(1, 0, dimensionSettings.symbol.colorMidValue)
      rangeColors.splice(1, 0, dimensionSettings.symbol.colorMidColor)
    }

    const barY = currentLegendY + 22
    appendLinearGradientBar(group, 'symbolColorGradient', contentX, barY, contentWidth, 6, domain, rangeColors)

    group
      .append('text')
      .attr('x', contentX)
      .attr('y', barY + 18)
      .attr('font-family', style.fontFamily)
      .attr('font-size', '10px')
      .attr('fill', style.labelColor)
      .text(
        formatLegendValue(domain[0], dimensionSettings.symbol.colorBy, columnTypes, columnFormats, selectedGeography),
      )

    group
      .append('text')
      .attr('x', contentX + contentWidth)
      .attr('y', barY + 18)
      .attr('text-anchor', 'end')
      .attr('font-family', style.fontFamily)
      .attr('font-size', '10px')
      .attr('fill', style.labelColor)
      .text(
        formatLegendValue(
          domain[domain.length - 1],
          dimensionSettings.symbol.colorBy,
          columnTypes,
          columnFormats,
          selectedGeography,
        ),
      )
  } else {
    const uniqueValues = getUniqueValues(dimensionSettings.symbol.colorBy, symbolData).slice(0, 8)
    let x = contentX
    const swatchY = currentLegendY + 24

    uniqueValues.forEach((value) => {
      const color = symbolColorScale ? symbolColorScale(value) : stylingSettings.symbol.symbolFillColor
      const label = formatLegendValue(
        value,
        dimensionSettings.symbol.colorBy,
        columnTypes,
        columnFormats,
        selectedGeography,
      )

      group.append('rect').attr('x', x).attr('y', swatchY).attr('width', 8).attr('height', 8).attr('fill', color)

      group
        .append('text')
        .attr('x', x + 12)
        .attr('y', swatchY + 7)
        .attr('font-family', style.fontFamily)
        .attr('font-size', '10px')
        .attr('fill', style.labelColor)
        .text(label)

      x += Math.max(56, label.length * 6 + 20)
    })
  }

  return currentLegendY + LEGEND_ROW_HEIGHT
}

interface ChoroplethColorLegendParams {
  legendGroup: LegendGroupSelection
  width: number
  contentX: number
  contentWidth: number
  currentLegendY: number
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
  columnTypes: ColumnType
  columnFormats: ColumnFormat
  selectedGeography: GeographyKey
  choroplethData: DataRecord[]
  choroplethColorScale: ((value: unknown) => string) | null
  formatLegendValue: LegendFormatter
}

const renderChoroplethColorLegend = ({
  legendGroup,
  contentX,
  contentWidth,
  currentLegendY,
  dimensionSettings,
  stylingSettings,
  columnTypes,
  columnFormats,
  selectedGeography,
  choroplethData,
  choroplethColorScale,
  formatLegendValue,
}: ChoroplethColorLegendParams): number => {
  const group = legendGroup.append('g').attr('id', 'ChoroplethColorLegend')
  const style = resolveLegendStyle(stylingSettings, 'choropleth')

  appendLegendTitle(group, contentX, currentLegendY + 10, 'Fill', dimensionSettings.choropleth.colorBy, style)

  if (dimensionSettings.choropleth.colorScale === 'linear') {
    const domain = [dimensionSettings.choropleth.colorMinValue, dimensionSettings.choropleth.colorMaxValue]
    const rangeColors = [
      dimensionSettings.choropleth.colorMinColor || stylingSettings.base.defaultStateFillColor,
      dimensionSettings.choropleth.colorMaxColor || stylingSettings.base.defaultStateFillColor,
    ]
    if (dimensionSettings.choropleth.colorMidColor) {
      domain.splice(1, 0, dimensionSettings.choropleth.colorMidValue)
      rangeColors.splice(1, 0, dimensionSettings.choropleth.colorMidColor)
    }

    const barY = currentLegendY + 22
    appendLinearGradientBar(group, 'choroplethColorGradient', contentX, barY, contentWidth, 6, domain, rangeColors)

    group
      .append('text')
      .attr('x', contentX)
      .attr('y', barY + 18)
      .attr('font-family', style.fontFamily)
      .attr('font-size', '10px')
      .attr('fill', style.labelColor)
      .text(
        formatLegendValue(
          domain[0],
          dimensionSettings.choropleth.colorBy,
          columnTypes,
          columnFormats,
          selectedGeography,
        ),
      )

    group
      .append('text')
      .attr('x', contentX + contentWidth)
      .attr('y', barY + 18)
      .attr('text-anchor', 'end')
      .attr('font-family', style.fontFamily)
      .attr('font-size', '10px')
      .attr('fill', style.labelColor)
      .text(
        formatLegendValue(
          domain[domain.length - 1],
          dimensionSettings.choropleth.colorBy,
          columnTypes,
          columnFormats,
          selectedGeography,
        ),
      )
  } else {
    const uniqueValues = Array.from(
      new Set(choroplethData.map((d) => d[dimensionSettings.choropleth.colorBy])),
    ).slice(0, 8)
    let x = contentX
    const swatchY = currentLegendY + 24

    uniqueValues.forEach((value) => {
      const color = choroplethColorScale
        ? choroplethColorScale(value)
        : stylingSettings.base.defaultStateFillColor
      const label = formatLegendValue(
        value,
        dimensionSettings.choropleth.colorBy,
        columnTypes,
        columnFormats,
        selectedGeography,
      )

      group.append('rect').attr('x', x).attr('y', swatchY).attr('width', 8).attr('height', 8).attr('fill', color)

      group
        .append('text')
        .attr('x', x + 12)
        .attr('y', swatchY + 7)
        .attr('font-family', style.fontFamily)
        .attr('font-size', '10px')
        .attr('fill', style.labelColor)
        .text(label)

      x += Math.max(56, label.length * 6 + 20)
    })
  }

  return currentLegendY + LEGEND_ROW_HEIGHT
}
