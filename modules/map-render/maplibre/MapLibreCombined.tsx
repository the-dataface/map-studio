'use client'

import { useMemo } from 'react'
import { geoBounds } from 'd3'
import { Layer, Source } from 'react-map-gl/maplibre'
import type { MapGeoJSONFeature } from 'maplibre-gl'
import type { FeatureCollection } from 'geojson'
import type { ReactNode } from 'react'

import type { StylingSettings } from '@/app/(studio)/types'

import type { ChoroplethLabelCollection } from '../adapters/to-geojson-choropleth-labels'
import { MapLibreCanvas } from './MapLibreCanvas'
import type { SymbolPointCollection } from '../adapters/to-geojson-symbols'
import {
  toGeoJsonSymbolLabels,
  toGeoJsonSymbolText,
} from '../adapters/to-geojson-symbol-text-layers'
import {
  ChoroplethLabelMarkers,
  SymbolLabelMarkers,
  SymbolTextMarkers,
} from './MapLibreHtmlLabels'

function combinedBounds(
  choroplethGeoJson: FeatureCollection,
  symbolGeoJson: SymbolPointCollection,
): [[number, number], [number, number]] | null {
  const allFeatures = [...choroplethGeoJson.features, ...symbolGeoJson.features]
  if (!allFeatures.length) {
    return null
  }
  const collection = { type: 'FeatureCollection' as const, features: allFeatures }
  const [[west, south], [east, north]] = geoBounds(collection)
  return [
    [west, south],
    [east, north],
  ]
}

interface MapLibreCombinedProps {
  choroplethGeoJson: FeatureCollection
  choroplethLabelGeoJson?: ChoroplethLabelCollection
  symbolGeoJson: SymbolPointCollection
  stylingSettings: StylingSettings
  basemapStyleId: string
  className?: string
  allowZoom?: boolean
  allowPan?: boolean
  inspectMode?: boolean
  getSymbolTooltipContent?: (feature: MapGeoJSONFeature) => ReactNode | null
  getChoroplethTooltipContent?: (feature: MapGeoJSONFeature) => ReactNode | null
}

export function MapLibreCombined({
  choroplethGeoJson,
  choroplethLabelGeoJson,
  symbolGeoJson,
  stylingSettings,
  basemapStyleId,
  className,
  allowZoom = true,
  allowPan = true,
  inspectMode = false,
  getSymbolTooltipContent,
  getChoroplethTooltipContent,
}: MapLibreCombinedProps) {
  const bounds = useMemo(
    () => combinedBounds(choroplethGeoJson, symbolGeoJson),
    [choroplethGeoJson, symbolGeoJson],
  )

  const labelGeoJson = useMemo(() => toGeoJsonSymbolLabels(symbolGeoJson), [symbolGeoJson])
  const symbolTextGeoJson = useMemo(() => toGeoJsonSymbolText(symbolGeoJson), [symbolGeoJson])

  const getTooltipContent = useMemo(() => {
    if (!inspectMode) {
      return undefined
    }

    return (feature: MapGeoJSONFeature) => {
      const layerId = feature.layer?.id
      if (layerId === 'symbol-circles') {
        return getSymbolTooltipContent?.(feature) ?? null
      }
      if (layerId === 'choropleth-fill') {
        return getChoroplethTooltipContent?.(feature) ?? null
      }
      return null
    }
  }, [getChoroplethTooltipContent, getSymbolTooltipContent, inspectMode])

  const strokeColor = stylingSettings.base.defaultStateStrokeColor
  const strokeWidth = stylingSettings.base.defaultStateStrokeWidth

  return (
    <MapLibreCanvas
      basemapStyleId={basemapStyleId}
      allowZoom={allowZoom}
      allowPan={allowPan}
      inspectMode={inspectMode}
      interactiveLayerIds={['symbol-circles', 'choropleth-fill']}
      getTooltipContent={getTooltipContent}
      bounds={bounds}
      className={className}
    >
      <Source id="choropleth-boundaries" type="geojson" data={choroplethGeoJson}>
        <Layer
          id="choropleth-fill"
          type="fill"
          paint={{
            'fill-color': ['coalesce', ['get', '__color'], stylingSettings.base.defaultStateFillColor],
            'fill-opacity': 0.88,
            'fill-outline-color': strokeColor,
          }}
        />
        <Layer
          id="choropleth-stroke"
          type="line"
          paint={{
            'line-color': strokeColor,
            'line-width': strokeWidth,
          }}
        />
      </Source>
      {choroplethLabelGeoJson ? (
        <ChoroplethLabelMarkers geoJson={choroplethLabelGeoJson} stylingSettings={stylingSettings} />
      ) : null}
      <Source id="symbol-points" type="geojson" data={symbolGeoJson}>
        <Layer
          id="symbol-circles"
          type="circle"
          paint={{
            'circle-radius': ['get', '__radius'],
            'circle-color': ['get', '__color'],
            'circle-opacity': ['get', '__fillOpacity'],
            'circle-stroke-color': ['get', '__strokeColor'],
            'circle-stroke-width': ['get', '__strokeWidth'],
            'circle-stroke-opacity': ['get', '__strokeOpacity'],
          }}
        />
      </Source>
      <SymbolLabelMarkers geoJson={labelGeoJson} stylingSettings={stylingSettings} />
      <SymbolTextMarkers geoJson={symbolTextGeoJson} stylingSettings={stylingSettings} />
    </MapLibreCanvas>
  )
}
