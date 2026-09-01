'use client'

import { Marker } from 'react-map-gl/maplibre'
import type { CSSProperties } from 'react'

import type { StylingSettings, SymbolLabelAlignment } from '@/app/(studio)/types'
import { getSymbolTextStyling } from '@/lib/symbol-text-content'

import type { ChoroplethLabelCollection } from '../adapters/to-geojson-choropleth-labels'
import type { SymbolLabelCollection, SymbolTextCollection } from '../adapters/to-geojson-symbol-text-layers'

function symbolLabelStyle(stylingSettings: StylingSettings): CSSProperties {
  const symbol = stylingSettings.symbol
  const outline = symbol.labelOutlineThickness ?? 0
  const outlineColor = symbol.labelOutlineColor ?? '#ffffff'

  return {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: symbol.labelFontSize ?? 10,
    fontWeight: symbol.labelBold ? 'bold' : 'normal',
    fontStyle: symbol.labelItalic ? 'italic' : 'normal',
    color: symbol.labelColor ?? '#333333',
    textShadow:
      outline > 0
        ? `-1px -1px 0 ${outlineColor}, 1px -1px 0 ${outlineColor}, -1px 1px 0 ${outlineColor}, 1px 1px 0 ${outlineColor}`
        : undefined,
    whiteSpace: 'pre-wrap',
    pointerEvents: 'none',
    lineHeight: 1.2,
  }
}

function choroplethLabelStyle(stylingSettings: StylingSettings): CSSProperties {
  const choropleth = stylingSettings.choropleth
  const outline = choropleth.labelOutlineThickness ?? 0
  const outlineColor = choropleth.labelOutlineColor ?? '#ffffff'

  return {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: choropleth.labelFontSize ?? 10,
    fontWeight: choropleth.labelBold ? 'bold' : 'normal',
    fontStyle: choropleth.labelItalic ? 'italic' : 'normal',
    color: choropleth.labelColor ?? '#333333',
    textShadow:
      outline > 0
        ? `-1px -1px 0 ${outlineColor}, 1px -1px 0 ${outlineColor}, -1px 1px 0 ${outlineColor}, 1px 1px 0 ${outlineColor}`
        : undefined,
    whiteSpace: 'pre-wrap',
    pointerEvents: 'none',
    textAlign: 'center',
    lineHeight: 1.2,
  }
}

function symbolTextStyle(stylingSettings: StylingSettings, fontSize: number): CSSProperties {
  const symbolText = getSymbolTextStyling(stylingSettings)
  const outline = symbolText.outlineThickness ?? 0
  const outlineColor = symbolText.outlineColor ?? '#000000'

  return {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize,
    fontWeight: symbolText.fontBold ? 'bold' : 'normal',
    fontStyle: symbolText.fontItalic ? 'italic' : 'normal',
    color: symbolText.color ?? '#ffffff',
    textShadow:
      outline > 0
        ? `-1px -1px 0 ${outlineColor}, 1px -1px 0 ${outlineColor}, -1px 1px 0 ${outlineColor}, 1px 1px 0 ${outlineColor}`
        : `0 0 2px ${outlineColor}`,
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    textAlign: 'center',
  }
}

function markerAnchorFromAlignment(
  alignment: SymbolLabelAlignment,
): 'center' | 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' {
  switch (alignment) {
    case 'top-left':
      return 'top-right'
    case 'top-center':
      return 'top'
    case 'top-right':
      return 'top-left'
    case 'middle-left':
      return 'right'
    case 'center':
      return 'center'
    case 'middle-right':
      return 'left'
    case 'bottom-left':
      return 'bottom-right'
    case 'bottom-center':
      return 'bottom'
    case 'bottom-right':
      return 'bottom-left'
    case 'auto':
    default:
      return 'left'
  }
}

interface SymbolLabelMarkersProps {
  geoJson: SymbolLabelCollection
  stylingSettings: StylingSettings
}

export function SymbolLabelMarkers({ geoJson, stylingSettings }: SymbolLabelMarkersProps) {
  const style = symbolLabelStyle(stylingSettings)
  const alignment = stylingSettings.symbol.labelAlignment ?? 'auto'
  const fontSize = stylingSettings.symbol.labelFontSize ?? 10
  const globalOffsetX = stylingSettings.symbol.labelOffsetX ?? 0
  const globalOffsetY = stylingSettings.symbol.labelOffsetY ?? 0

  return (
    <>
      {geoJson.features.map((feature, index) => {
        const [lng, lat] = feature.geometry.coordinates
        const emOffsetX = feature.properties.__labelTextOffsetX ?? 0
        const emOffsetY = feature.properties.__labelTextOffsetY ?? 0
        const offset: [number, number] = [
          emOffsetX * fontSize + globalOffsetX,
          emOffsetY * fontSize + globalOffsetY,
        ]

        return (
          <Marker
            key={`symbol-label-${index}-${feature.properties.__labelText}`}
            longitude={lng}
            latitude={lat}
            anchor={markerAnchorFromAlignment(alignment)}
            offset={offset}
          >
            <span style={style}>{feature.properties.__labelText}</span>
          </Marker>
        )
      })}
    </>
  )
}

interface SymbolTextMarkersProps {
  geoJson: SymbolTextCollection
  stylingSettings: StylingSettings
}

export function SymbolTextMarkers({ geoJson, stylingSettings }: SymbolTextMarkersProps) {
  const symbolTextSettings = getSymbolTextStyling(stylingSettings)
  const globalOffsetX = symbolTextSettings.offsetX ?? 0
  const globalOffsetY = symbolTextSettings.offsetY ?? 0

  return (
    <>
      {geoJson.features.map((feature, index) => {
        const [lng, lat] = feature.geometry.coordinates
        const fontSize = feature.properties.__symbolTextFontSize ?? symbolTextSettings.fontSize

        return (
          <Marker
            key={`symbol-text-${index}-${feature.properties.__symbolText}`}
            longitude={lng}
            latitude={lat}
            anchor="center"
            offset={[globalOffsetX, globalOffsetY]}
          >
            <span style={symbolTextStyle(stylingSettings, fontSize)}>
              {feature.properties.__symbolText}
            </span>
          </Marker>
        )
      })}
    </>
  )
}

interface ChoroplethLabelMarkersProps {
  geoJson: ChoroplethLabelCollection
  stylingSettings: StylingSettings
}

export function ChoroplethLabelMarkers({ geoJson, stylingSettings }: ChoroplethLabelMarkersProps) {
  const style = choroplethLabelStyle(stylingSettings)
  const offsetX = stylingSettings.choropleth.labelOffsetX ?? 0
  const offsetY = stylingSettings.choropleth.labelOffsetY ?? 0

  return (
    <>
      {geoJson.features.map((feature, index) => {
        const [lng, lat] = feature.geometry.coordinates

        return (
          <Marker
            key={`choropleth-label-${feature.properties.__joinKey}-${index}`}
            longitude={lng}
            latitude={lat}
            anchor="center"
            offset={[offsetX, offsetY]}
          >
            <span style={style}>{feature.properties.__labelText}</span>
          </Marker>
        )
      })}
    </>
  )
}
