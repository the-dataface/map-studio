'use client'

import { Layer } from 'react-map-gl/maplibre'
import type { FilterSpecification } from 'maplibre-gl'

import type { StylingSettings, SymbolLabelAlignment } from '@/app/(studio)/types'
import { getSymbolTextStyling } from '@/lib/symbol-text-content'

import type { ChoroplethLabelCollection } from '../adapters/to-geojson-choropleth-labels'
import { getCenteredTextOffset, getSymbolLabelTextLayout, mapLibreFontStack } from './maplibre-text-styles'

const LABEL_TEXT_FILTER: FilterSpecification = [
  'all',
  ['has', '__labelText'],
  ['!=', ['get', '__labelText'], ''],
]

const SYMBOL_TEXT_FILTER: FilterSpecification = [
  'all',
  ['has', '__symbolText'],
  ['!=', ['get', '__symbolText'], ''],
]

function labelAnchorForAlignment(alignment: SymbolLabelAlignment): 'left' | 'center' | 'right' {
  return getSymbolLabelTextLayout(alignment, 8, 10, 0, 0).textAnchor
}

interface SymbolPointLabelsLayerProps {
  stylingSettings: StylingSettings
}

/** Symbol map labels beside points (dedicated label GeoJSON source). */
export function SymbolPointLabelsLayer({ stylingSettings }: SymbolPointLabelsLayerProps) {
  const symbol = stylingSettings.symbol
  const fontSize = Math.max(symbol.labelFontSize ?? 10, 11)
  const haloWidth = Math.max(
    (symbol.labelOutlineThickness ?? 0) / Math.max(fontSize / 4, 1),
    1,
  )
  const textAnchor = labelAnchorForAlignment(symbol.labelAlignment ?? 'auto')

  return (
    <Layer
      id="symbol-labels"
      type="symbol"
      filter={LABEL_TEXT_FILTER}
      layout={{
        'text-field': ['to-string', ['get', '__labelText']],
        'text-font': mapLibreFontStack(symbol.labelBold, symbol.labelItalic),
        'text-size': fontSize,
        'text-anchor': textAnchor,
        'text-offset': [
          'array',
          ['coalesce', ['get', '__labelTextOffsetX'], 0],
          ['coalesce', ['get', '__labelTextOffsetY'], 0],
        ],
        'text-allow-overlap': true,
        'text-ignore-placement': true,
        'text-optional': false,
      }}
      paint={{
        'text-color': symbol.labelColor ?? '#333333',
        'text-halo-color': symbol.labelOutlineColor ?? '#ffffff',
        'text-halo-width': haloWidth,
      }}
    />
  )
}

interface SymbolPointTextLayerProps {
  stylingSettings: StylingSettings
}

/** Text rendered inside/on top of symbol circles (dedicated text GeoJSON source). */
export function SymbolPointTextLayer({ stylingSettings }: SymbolPointTextLayerProps) {
  const symbolTextSettings = getSymbolTextStyling(stylingSettings)
  const baseFontSize = Math.max(symbolTextSettings.fontSize, 11)
  const textOffset = getCenteredTextOffset(
    baseFontSize,
    symbolTextSettings.offsetX ?? 0,
    symbolTextSettings.offsetY ?? 0,
  )
  const haloWidth = Math.max(
    (symbolTextSettings.outlineThickness ?? 0) / Math.max(baseFontSize / 4, 1),
    1,
  )

  return (
    <Layer
      id="symbol-text"
      type="symbol"
      filter={SYMBOL_TEXT_FILTER}
      layout={{
        'text-field': ['to-string', ['get', '__symbolText']],
        'text-font': mapLibreFontStack(symbolTextSettings.fontBold, symbolTextSettings.fontItalic),
        'text-size': ['max', 11, ['coalesce', ['get', '__symbolTextFontSize'], baseFontSize]],
        'text-anchor': 'center',
        'text-offset': textOffset,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
        'text-optional': false,
      }}
      paint={{
        'text-color': symbolTextSettings.color ?? '#ffffff',
        'text-halo-color': symbolTextSettings.outlineColor ?? '#000000',
        'text-halo-width': haloWidth,
      }}
    />
  )
}

interface ChoroplethLabelsLayerProps {
  stylingSettings: StylingSettings
}

/** Choropleth region labels at polygon centroids (separate point source). */
export function ChoroplethLabelsLayer({ stylingSettings }: ChoroplethLabelsLayerProps) {
  const choropleth = stylingSettings.choropleth
  const fontSize = Math.max(choropleth.labelFontSize ?? 10, 11)
  const textOffset = getCenteredTextOffset(
    fontSize,
    choropleth.labelOffsetX ?? 0,
    choropleth.labelOffsetY ?? 0,
  )
  const haloWidth = Math.max(
    (choropleth.labelOutlineThickness ?? 0) / Math.max(fontSize / 4, 1),
    1,
  )

  return (
    <Layer
      id="choropleth-labels"
      type="symbol"
      filter={LABEL_TEXT_FILTER}
      layout={{
        'text-field': ['to-string', ['get', '__labelText']],
        'text-font': mapLibreFontStack(choropleth.labelBold, choropleth.labelItalic),
        'text-size': fontSize,
        'text-anchor': 'center',
        'text-offset': textOffset,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
        'text-optional': false,
      }}
      paint={{
        'text-color': choropleth.labelColor ?? '#333333',
        'text-halo-color': choropleth.labelOutlineColor ?? '#ffffff',
        'text-halo-width': haloWidth,
      }}
    />
  )
}

export function hasChoroplethLabels(geoJson: ChoroplethLabelCollection): boolean {
  return geoJson.features.length > 0
}
