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
import { ChoroplethLabelMarkers } from './MapLibreHtmlLabels'

interface MapLibreChoroplethProps {
  geoJson: FeatureCollection
  labelGeoJson?: ChoroplethLabelCollection
  basemapStyleId: string
  stylingSettings: StylingSettings
  className?: string
  allowZoom?: boolean
  allowPan?: boolean
  inspectMode?: boolean
  getTooltipContent?: (feature: MapGeoJSONFeature) => ReactNode | null
}

export function MapLibreChoropleth({
  geoJson,
  labelGeoJson,
  basemapStyleId,
  stylingSettings,
  className,
  allowZoom = true,
  allowPan = true,
  inspectMode = false,
  getTooltipContent,
}: MapLibreChoroplethProps) {
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

  const strokeColor = stylingSettings.base.defaultStateStrokeColor
  const strokeWidth = stylingSettings.base.defaultStateStrokeWidth

  return (
    <MapLibreCanvas
      basemapStyleId={basemapStyleId}
      allowZoom={allowZoom}
      allowPan={allowPan}
      inspectMode={inspectMode}
      interactiveLayerIds={['choropleth-fill']}
      getTooltipContent={getTooltipContent}
      bounds={bounds}
      className={className}
    >
      <Source id="choropleth-boundaries" type="geojson" data={geoJson}>
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
      {labelGeoJson ? (
        <ChoroplethLabelMarkers geoJson={labelGeoJson} stylingSettings={stylingSettings} />
      ) : null}
    </MapLibreCanvas>
  )
}
