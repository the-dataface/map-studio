'use client'

import { useMemo } from 'react'
import { geoBounds } from 'd3'
import { Layer, Source } from 'react-map-gl/maplibre'
import type { MapGeoJSONFeature } from 'maplibre-gl'
import type { ReactNode } from 'react'

import type { SymbolPointCollection } from '../adapters/to-geojson-symbols'
import {
  toGeoJsonSymbolLabels,
  toGeoJsonSymbolText,
} from '../adapters/to-geojson-symbol-text-layers'
import type { StylingSettings } from '@/app/(studio)/types'

import { MapLibreCanvas } from './MapLibreCanvas'
import {
  ChoroplethLabelMarkers,
  SymbolLabelMarkers,
  SymbolTextMarkers,
} from './MapLibreHtmlLabels'

interface MapLibreSymbolsProps {
  geoJson: SymbolPointCollection
  stylingSettings: StylingSettings
  basemapStyleId: string
  className?: string
  allowZoom?: boolean
  allowPan?: boolean
  inspectMode?: boolean
  getTooltipContent?: (feature: MapGeoJSONFeature) => ReactNode | null
}

export function MapLibreSymbols({
  geoJson,
  stylingSettings,
  basemapStyleId,
  className,
  allowZoom = true,
  allowPan = true,
  inspectMode = false,
  getTooltipContent,
}: MapLibreSymbolsProps) {
  const bounds = useMemo(() => {
    if (!geoJson.features.length) {
      return null
    }
    const [[west, south], [east, north]] = geoBounds(geoJson)
    return [
      [west, south],
      [east, north],
    ] as [[number, number], [number, number]]
  }, [geoJson])

  const labelGeoJson = useMemo(() => toGeoJsonSymbolLabels(geoJson), [geoJson])
  const symbolTextGeoJson = useMemo(() => toGeoJsonSymbolText(geoJson), [geoJson])

  return (
    <MapLibreCanvas
      basemapStyleId={basemapStyleId}
      allowZoom={allowZoom}
      allowPan={allowPan}
      inspectMode={inspectMode}
      interactiveLayerIds={['symbol-circles']}
      getTooltipContent={getTooltipContent}
      bounds={bounds}
      className={className}
    >
      <Source id="symbol-points" type="geojson" data={geoJson}>
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
