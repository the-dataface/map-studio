import type { DimensionSettings, StylingSettings } from '@/app/(studio)/types'
import { getContrastRatio } from './color-contrast'

export type ContrastUseCase =
  | 'map-label'
  | 'symbol-label'
  | 'choropleth-fill'
  | 'symbol-fill'
  | 'scale-endpoint'
  | 'legend-text'

/**
 * Resolve the background colors a foreground should be checked against.
 * Returns multiple candidates — we evaluate against the worst (lowest) contrast.
 */
export function resolveContrastBackgrounds(
  useCase: ContrastUseCase,
  stylingSettings: StylingSettings,
  dimensionSettings?: DimensionSettings,
): string[] {
  const base = stylingSettings.base
  const mapBg = base.mapBackgroundColor || '#faf8f5'
  const stateFill = base.defaultStateFillColor || '#e8e4df'
  const nationFill = base.nationFillColor || stateFill

  switch (useCase) {
    case 'map-label':
    case 'symbol-label':
      return uniqueColors([
        mapBg,
        stateFill,
        nationFill,
        midpointFillColor(dimensionSettings, stylingSettings),
      ])

    case 'choropleth-fill':
      return uniqueColors([
        mapBg,
        stateFill,
        dimensionSettings?.choropleth?.colorMinColor,
        dimensionSettings?.choropleth?.colorMaxColor,
        dimensionSettings?.choropleth?.colorMidColor,
      ])

    case 'symbol-fill':
      return uniqueColors([
        mapBg,
        stateFill,
        stylingSettings.symbol.symbolFillColor,
        dimensionSettings?.symbol?.colorMinColor,
        dimensionSettings?.symbol?.colorMaxColor,
      ])

    case 'scale-endpoint':
      return uniqueColors([mapBg, stateFill, nationFill])

    case 'legend-text':
      return uniqueColors([mapBg, '#ffffff'])

    default:
      return [mapBg]
  }
}

/** Pick the background that produces the lowest contrast ratio (worst case). */
export function worstContrastBackground(
  foreground: string,
  backgrounds: string[],
): { background: string; ratio: number } | null {
  let worst: { background: string; ratio: number } | null = null

  for (const bg of backgrounds) {
    if (!bg) continue
    const ratio = getContrastRatio(foreground, bg)
    if (!worst || ratio < worst.ratio) {
      worst = { background: bg, ratio }
    }
  }

  return worst
}

function midpointFillColor(
  dimensionSettings: DimensionSettings | undefined,
  stylingSettings: StylingSettings,
): string | undefined {
  const choropleth = dimensionSettings?.choropleth
  if (choropleth?.colorScale === 'linear' && choropleth.colorMidColor) {
    return choropleth.colorMidColor
  }
  return stylingSettings.base.defaultStateFillColor
}

function uniqueColors(colors: (string | undefined)[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const c of colors) {
    if (!c || !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(c)) continue
    const normalized = c.toLowerCase()
    if (!seen.has(normalized)) {
      seen.add(normalized)
      result.push(c)
    }
  }
  return result.length > 0 ? result : ['#faf8f5']
}
