import * as d3 from 'd3'

import type {
  ChoroplethDimensionSettings,
  ColorScaleType,
  StylingSettings,
} from '@/app/(studio)/types'

export type ChoroplethColorScale =
  | d3.ScaleLinear<number, string, never>
  | ((value: unknown) => string)

export function buildChoroplethColorScale(
  settings: ChoroplethDimensionSettings,
  stylingSettings: StylingSettings,
  categories: unknown[],
): ChoroplethColorScale | null {
  if (!settings.colorBy) {
    return null
  }

  if (settings.colorScale === 'linear') {
    const domain = [settings.colorMinValue, settings.colorMaxValue]
    const rangeColors = [
      settings.colorMinColor || stylingSettings.base.defaultStateFillColor,
      settings.colorMaxColor || stylingSettings.base.defaultStateFillColor,
    ]

    if (settings.colorMidColor) {
      domain.splice(1, 0, settings.colorMidValue)
      rangeColors.splice(1, 0, settings.colorMidColor)
    }

    const linearScale = d3.scaleLinear<number, string>()
    linearScale.domain(domain)
    // @ts-expect-error - D3 scale types don't properly handle string ranges with number domains
    linearScale.range(rangeColors)
    return linearScale
  }

  const colorMap = new Map<string, string>()
  settings.categoricalColors?.forEach((item, index) => {
    const category = categories[index]
    if (category !== undefined) {
      colorMap.set(String(category), item.color)
    }
  })

  return (value: unknown) =>
    colorMap.get(String(value)) || stylingSettings.base.defaultStateFillColor
}

export function colorForValue(
  scale: ChoroplethColorScale,
  value: number | string,
  colorScaleType: ColorScaleType,
): string {
  if (colorScaleType === 'linear') {
    return (scale as d3.ScaleLinear<number, string, never>)(value as number)
  }
  return (scale as (value: unknown) => string)(value)
}
