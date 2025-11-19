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
  let height = 0
  if (showSymbolSizeLegend) height += 80
  if (showSymbolColorLegend) height += 80
  if (showChoroplethColorLegend) height += 80
  return height
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
  let currentLegendY = mapHeight + 20

  if (showSymbolSizeLegend) {
    currentLegendY = renderSymbolSizeLegend({
      legendGroup,
      width,
      currentLegendY,
      dimensionSettings,
      stylingSettings,
      columnTypes,
      columnFormats,
      selectedGeography,
      formatLegendValue,
      getSymbolPathData,
    })
  }

  if (showSymbolColorLegend) {
    currentLegendY = renderSymbolColorLegend({
      legendGroup,
      width,
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
  }

  if (showChoroplethColorLegend) {
    renderChoroplethColorLegend({
      legendGroup,
      width,
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
  currentLegendY,
  dimensionSettings,
  stylingSettings,
  columnTypes,
  columnFormats,
  selectedGeography,
  formatLegendValue,
  getSymbolPathData,
}: SymbolSizeLegendParams): number => {
  const sizeLegendGroup = legendGroup.append('g').attr('id', 'SizeLegend')

  const legendWidth = 400
  const legendX = (width - legendWidth) / 2

  sizeLegendGroup
    .append('rect')
    .attr('x', legendX)
    .attr('y', currentLegendY - 10)
    .attr('width', legendWidth)
    .attr('height', 60)
    .attr('fill', 'rgba(255, 255, 255, 0.95)')
    .attr('stroke', '#ddd')
    .attr('stroke-width', 1)
    .attr('rx', 6)

  sizeLegendGroup
    .append('text')
    .attr('x', legendX + 15)
    .attr('y', currentLegendY + 8)
    .attr('font-family', 'Arial, sans-serif')
    .attr('font-size', '14px')
    .attr('font-weight', '600')
    .attr('fill', '#333')
    .text(`Size: ${dimensionSettings.symbol.sizeBy}`)

  const minLegendSize = 8
  const maxLegendSize = 20

  const symbolColor = dimensionSettings.symbol.colorBy
    ? stylingSettings.base.nationFillColor
    : stylingSettings.symbol.symbolFillColor
  const symbolStroke = dimensionSettings.symbol.colorBy
    ? stylingSettings.base.nationStrokeColor
    : stylingSettings.symbol.symbolStrokeColor

  const legendCenterX = width / 2
  const symbolY = currentLegendY + 35

  sizeLegendGroup
    .append('text')
    .attr('x', legendCenterX - 45)
    .attr('y', symbolY + 5)
    .attr('font-family', 'Arial, sans-serif')
    .attr('font-size', '11px')
    .attr('fill', '#666')
    .attr('text-anchor', 'middle')
    .text(
      formatLegendValue(
        dimensionSettings.symbol.sizeMinValue,
        dimensionSettings.symbol.sizeBy,
        columnTypes,
        columnFormats,
        selectedGeography,
      ),
    )

  const { pathData: minPathData } = getSymbolPathData(
    stylingSettings.symbol.symbolType,
    stylingSettings.symbol.symbolShape,
    minLegendSize,
    stylingSettings.symbol.customSvgPath,
  )

  sizeLegendGroup
    .append('path')
    .attr('d', minPathData)
    .attr('transform', `translate(${legendCenterX - 20}, ${symbolY})`)
    .attr('fill', symbolColor)
    .attr('stroke', symbolStroke)
    .attr('stroke-width', 1)

  sizeLegendGroup
    .append('path')
    .attr('d', 'M-6,0 L6,0 M3,-2 L6,0 L3,2')
    .attr('transform', `translate(${legendCenterX - 5}, ${symbolY})`)
    .attr('fill', 'none')
    .attr('stroke', '#666')
    .attr('stroke-width', 1.5)

  const { pathData: maxPathData } = getSymbolPathData(
    stylingSettings.symbol.symbolType,
    stylingSettings.symbol.symbolShape,
    maxLegendSize,
    stylingSettings.symbol.customSvgPath,
  )

  sizeLegendGroup
    .append('path')
    .attr('d', maxPathData)
    .attr('transform', `translate(${legendCenterX + 25}, ${symbolY})`)
    .attr('fill', symbolColor)
    .attr('stroke', symbolStroke)
    .attr('stroke-width', 1)

  sizeLegendGroup
    .append('text')
    .attr('x', legendCenterX + 60)
    .attr('y', symbolY + 5)
    .attr('font-family', 'Arial, sans-serif')
    .attr('font-size', '11px')
    .attr('fill', '#666')
    .attr('text-anchor', 'middle')
    .text(
      formatLegendValue(
        dimensionSettings.symbol.sizeMaxValue,
        dimensionSettings.symbol.sizeBy,
        columnTypes,
        columnFormats,
        selectedGeography,
      ),
    )

  return currentLegendY + 80
}

interface SymbolColorLegendParams {
  legendGroup: LegendGroupSelection
  width: number
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
  width,
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
}: SymbolColorLegendParams): number => {
  const colorLegendGroup = legendGroup.append('g').attr('id', 'SymbolColorLegend')

  if (dimensionSettings.symbol.colorScale === 'linear') {
    const gradientId = 'symbolColorGradient'

    colorLegendGroup
      .append('rect')
      .attr('x', 20)
      .attr('y', currentLegendY - 10)
      .attr('width', width - 40)
      .attr('height', 60)
      .attr('fill', 'rgba(255, 255, 255, 0.95)')
      .attr('stroke', '#ddd')
      .attr('stroke-width', 1)
      .attr('rx', 6)

    colorLegendGroup
      .append('text')
      .attr('x', 35)
      .attr('y', currentLegendY + 8)
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('fill', '#333')
      .text(`Color: ${dimensionSettings.symbol.colorBy}`)

    const gradient = legendGroup
      .append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('x2', '100%')
      .attr('y1', '0%')
      .attr('y2', '0%')

    const domain = [dimensionSettings.symbol.colorMinValue, dimensionSettings.symbol.colorMaxValue]
    const rangeColors = [
      dimensionSettings.symbol.colorMinColor || stylingSettings.symbol.symbolFillColor,
      dimensionSettings.symbol.colorMaxColor || stylingSettings.symbol.symbolFillColor,
    ]

    if (dimensionSettings.symbol.colorMidColor) {
      domain.splice(1, 0, dimensionSettings.symbol.colorMidValue)
      rangeColors.splice(1, 0, dimensionSettings.symbol.colorMidColor)
    }

    rangeColors.forEach((color, index) => {
      gradient
        .append('stop')
        .attr('offset', `${(index / (rangeColors.length - 1)) * 100}%`)
        .attr('stop-color', color)
    })

    const gradientWidth = width - 200
    const gradientX = (width - gradientWidth) / 2

    colorLegendGroup
      .append('rect')
      .attr('x', gradientX)
      .attr('y', currentLegendY + 25)
      .attr('width', gradientWidth)
      .attr('height', 12)
      .attr('fill', `url(#${gradientId})`)
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1)
      .attr('rx', 2)

    colorLegendGroup
      .append('text')
      .attr('x', gradientX - 10)
      .attr('y', currentLegendY + 33)
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-size', '11px')
      .attr('fill', '#666')
      .attr('text-anchor', 'end')
      .text(
        formatLegendValue(
          domain[0],
          dimensionSettings.symbol.colorBy,
          columnTypes,
          columnFormats,
          selectedGeography,
        ),
      )

    colorLegendGroup
      .append('text')
      .attr('x', gradientX + gradientWidth + 10)
      .attr('y', currentLegendY + 33)
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-size', '11px')
      .attr('fill', '#666')
      .attr('text-anchor', 'start')
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
    const uniqueValues = getUniqueValues(dimensionSettings.symbol.colorBy, symbolData)
    const maxItems = Math.min(uniqueValues.length, 10)
    const estimatedLegendWidth = Math.min(700, maxItems * 90 + 100)
    const legendX = (width - estimatedLegendWidth) / 2

    colorLegendGroup
      .append('rect')
      .attr('x', legendX)
      .attr('y', currentLegendY - 10)
      .attr('width', estimatedLegendWidth)
      .attr('height', 60)
      .attr('fill', 'rgba(255, 255, 255, 0.95)')
      .attr('stroke', '#ddd')
      .attr('stroke-width', 1)
      .attr('rx', 6)

    colorLegendGroup
      .append('text')
      .attr('x', legendX + 15)
      .attr('y', currentLegendY + 8)
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('fill', '#333')
      .text(`Color: ${dimensionSettings.symbol.colorBy}`)

    let currentX = legendX + 25
    const swatchY = currentLegendY + 30

    uniqueValues.slice(0, maxItems).forEach((value) => {
      const color = symbolColorScale ? symbolColorScale(value) : stylingSettings.symbol.symbolFillColor
      const labelText = formatLegendValue(
        value,
        dimensionSettings.symbol.colorBy,
        columnTypes,
        columnFormats,
        selectedGeography,
      )

      const fixedLegendSize = 12
      const { pathData } = getSymbolPathData(
        stylingSettings.symbol.symbolType,
        stylingSettings.symbol.symbolShape,
        fixedLegendSize,
        stylingSettings.symbol.customSvgPath,
      )

      colorLegendGroup
        .append('path')
        .attr('d', pathData)
        .attr('transform', `translate(${currentX}, ${swatchY})`)
        .attr('fill', color)
        .attr('stroke', '#666')
        .attr('stroke-width', 1)

      colorLegendGroup
        .append('text')
        .attr('x', currentX + 15)
        .attr('y', swatchY + 3)
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .attr('text-anchor', 'start')
        .text(labelText)

      const labelWidth = Math.max(60, labelText.length * 6 + 35)
      currentX += labelWidth
    })
  }

  return currentLegendY + 80
}

interface ChoroplethColorLegendParams {
  legendGroup: LegendGroupSelection
  width: number
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
  width,
  currentLegendY,
  dimensionSettings,
  stylingSettings,
  columnTypes,
  columnFormats,
  selectedGeography,
  choroplethData,
  choroplethColorScale,
  formatLegendValue,
}: ChoroplethColorLegendParams) => {
  const legendGroupRoot = legendGroup.append('g').attr('id', 'ChoroplethColorLegend')

  if (dimensionSettings.choropleth.colorScale === 'linear') {
    const gradientId = 'choroplethColorGradient'

    legendGroupRoot
      .append('rect')
      .attr('x', 20)
      .attr('y', currentLegendY - 10)
      .attr('width', width - 40)
      .attr('height', 60)
      .attr('fill', 'rgba(255, 255, 255, 0.95)')
      .attr('stroke', '#ddd')
      .attr('stroke-width', 1)
      .attr('rx', 6)

    legendGroupRoot
      .append('text')
      .attr('x', 35)
      .attr('y', currentLegendY + 8)
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('fill', '#333')
      .text(`Color: ${dimensionSettings.choropleth.colorBy}`)

    const gradient = legendGroup
      .append('defs')
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('x2', '100%')
      .attr('y1', '0%')
      .attr('y2', '0%')

    const domain = [dimensionSettings.choropleth.colorMinValue, dimensionSettings.choropleth.colorMaxValue]
    const rangeColors = [
      dimensionSettings.choropleth.colorMinColor || stylingSettings.base.defaultStateFillColor,
      dimensionSettings.choropleth.colorMaxColor || stylingSettings.base.defaultStateFillColor,
    ]

    if (dimensionSettings.choropleth.colorMidColor) {
      domain.splice(1, 0, dimensionSettings.choropleth.colorMidValue)
      rangeColors.splice(1, 0, dimensionSettings.choropleth.colorMidColor)
    }

    rangeColors.forEach((color, index) => {
      gradient
        .append('stop')
        .attr('offset', `${(index / (rangeColors.length - 1)) * 100}%`)
        .attr('stop-color', color)
    })

    const gradientWidth = width - 200
    const gradientX = (width - gradientWidth) / 2

    legendGroupRoot
      .append('rect')
      .attr('x', gradientX)
      .attr('y', currentLegendY + 25)
      .attr('width', gradientWidth)
      .attr('height', 12)
      .attr('fill', `url(#${gradientId})`)
      .attr('stroke', '#ccc')
      .attr('stroke-width', 1)
      .attr('rx', 2)

    legendGroupRoot
      .append('text')
      .attr('x', gradientX - 10)
      .attr('y', currentLegendY + 33)
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-size', '11px')
      .attr('fill', '#666')
      .attr('text-anchor', 'end')
      .text(
        formatLegendValue(
          domain[0],
          dimensionSettings.choropleth.colorBy,
          columnTypes,
          columnFormats,
          selectedGeography,
        ),
      )

    legendGroupRoot
      .append('text')
      .attr('x', gradientX + gradientWidth + 10)
      .attr('y', currentLegendY + 33)
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-size', '11px')
      .attr('fill', '#666')
      .attr('text-anchor', 'start')
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
    const uniqueValues = new Set(choroplethData.map((d) => d[dimensionSettings.choropleth.colorBy]))
    const values = Array.from(uniqueValues).slice(0, 10)
    const estimatedLegendWidth = Math.min(700, values.length * 90 + 100)
    const legendX = (width - estimatedLegendWidth) / 2

    legendGroupRoot
      .append('rect')
      .attr('x', legendX)
      .attr('y', currentLegendY - 10)
      .attr('width', estimatedLegendWidth)
      .attr('height', 60)
      .attr('fill', 'rgba(255, 255, 255, 0.95)')
      .attr('stroke', '#ddd')
      .attr('stroke-width', 1)
      .attr('rx', 6)

    legendGroupRoot
      .append('text')
      .attr('x', legendX + 15)
      .attr('y', currentLegendY + 8)
      .attr('font-family', 'Arial, sans-serif')
      .attr('font-size', '14px')
      .attr('font-weight', '600')
      .attr('fill', '#333')
      .text(`Color: ${dimensionSettings.choropleth.colorBy}`)

    let currentX = legendX + 25
    const swatchY = currentLegendY + 25

    values.forEach((value) => {
      const color = choroplethColorScale ? choroplethColorScale(value) : stylingSettings.base.defaultStateFillColor
      const labelText = formatLegendValue(
        value,
        dimensionSettings.choropleth.colorBy,
        columnTypes,
        columnFormats,
        selectedGeography,
      )

      legendGroupRoot
        .append('rect')
        .attr('x', currentX - 6)
        .attr('y', swatchY - 6)
        .attr('width', 12)
        .attr('height', 12)
        .attr('fill', color)
        .attr('stroke', '#666')
        .attr('stroke-width', 1)
        .attr('rx', 2)

      legendGroupRoot
        .append('text')
        .attr('x', currentX + 15)
        .attr('y', swatchY + 3)
        .attr('font-family', 'Arial, sans-serif')
        .attr('font-size', '10px')
        .attr('fill', '#666')
        .attr('text-anchor', 'start')
        .text(labelText)

      const labelWidth = Math.max(60, labelText.length * 6 + 35)
      currentX += labelWidth
    })
  }
}
