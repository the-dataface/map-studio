import type { SymbolLabelAlignment } from '@/app/(studio)/types'

/** Font stacks available in OpenFreeMap basemap styles */
export const MAPLIBRE_FONT_STACKS = {
  regular: ['Noto Sans Regular'],
  bold: ['Noto Sans Bold'],
  italic: ['Noto Sans Italic'],
  boldItalic: ['Noto Sans Bold Italic'],
} as const

export function mapLibreFontStack(bold: boolean, italic: boolean): string[] {
  if (bold && italic) {
    return [...MAPLIBRE_FONT_STACKS.boldItalic]
  }
  if (bold) {
    return [...MAPLIBRE_FONT_STACKS.bold]
  }
  if (italic) {
    return [...MAPLIBRE_FONT_STACKS.italic]
  }
  return [...MAPLIBRE_FONT_STACKS.regular]
}

export function svgAnchorToMapLibre(
  anchor: 'start' | 'middle' | 'end',
): 'left' | 'center' | 'right' {
  switch (anchor) {
    case 'start':
      return 'left'
    case 'end':
      return 'right'
    default:
      return 'center'
  }
}

/** Map positional alignment to MapLibre text-anchor and offset (in ems). */
export function getSymbolLabelTextLayout(
  alignment: SymbolLabelAlignment,
  radius: number,
  fontSize: number,
  globalOffsetX: number,
  globalOffsetY: number,
): { textAnchor: 'left' | 'center' | 'right'; textOffset: [number, number] } {
  const margin = Math.max(8, radius * 0.3)
  const offset = radius + margin
  const toEm = (px: number) => px / fontSize

  const baseX = toEm(globalOffsetX)
  const baseY = toEm(globalOffsetY)

  switch (alignment) {
    case 'top-left':
      return { textAnchor: 'right', textOffset: [baseX - toEm(offset), baseY - toEm(offset)] }
    case 'top-center':
      return { textAnchor: 'center', textOffset: [baseX, baseY - toEm(offset)] }
    case 'top-right':
      return { textAnchor: 'left', textOffset: [baseX + toEm(offset), baseY - toEm(offset)] }
    case 'middle-left':
      return { textAnchor: 'right', textOffset: [baseX - toEm(offset), baseY] }
    case 'center':
      return { textAnchor: 'center', textOffset: [baseX, baseY] }
    case 'middle-right':
      return { textAnchor: 'left', textOffset: [baseX + toEm(offset), baseY] }
    case 'bottom-left':
      return { textAnchor: 'right', textOffset: [baseX - toEm(offset), baseY + toEm(offset)] }
    case 'bottom-center':
      return { textAnchor: 'center', textOffset: [baseX, baseY + toEm(offset)] }
    case 'bottom-right':
      return { textAnchor: 'left', textOffset: [baseX + toEm(offset), baseY + toEm(offset)] }
    case 'auto':
    default:
      return { textAnchor: 'left', textOffset: [baseX + toEm(offset), baseY] }
  }
}

export function getCenteredTextOffset(
  fontSize: number,
  offsetX: number,
  offsetY: number,
): [number, number] {
  const toEm = (px: number) => px / fontSize
  return [toEm(offsetX), toEm(offsetY)]
}
