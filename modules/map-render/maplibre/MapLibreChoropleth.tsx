'use client'

import { useEffect, useMemo, useRef } from 'react'
import Map, { Layer, Source } from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'
import { geoBounds } from 'd3'
import type { FeatureCollection } from 'geojson'

import type { StylingSettings } from '@/app/(studio)/types'
import { cn } from '@/lib/utils'

import { getBasemapStyle } from './basemap-styles'

import 'maplibre-gl/dist/maplibre-gl.css'

interface MapLibreChoroplethProps {
  geoJson: FeatureCollection
  basemapStyleId: string
  stylingSettings: StylingSettings
  className?: string
  allowZoom?: boolean
  allowPan?: boolean
}

export function MapLibreChoropleth({
  geoJson,
  basemapStyleId,
  stylingSettings,
  className,
  allowZoom = true,
  allowPan = true,
}: MapLibreChoroplethProps) {
  const mapRef = useRef<MapRef>(null)
  const basemap = getBasemapStyle(basemapStyleId)

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

  useEffect(() => {
    if (!mapRef.current || !bounds) {
      return
    }

    mapRef.current.fitBounds(bounds, { padding: 48, duration: 0 })
  }, [bounds, geoJson])

  const strokeColor = stylingSettings.base.defaultStateStrokeColor
  const strokeWidth = stylingSettings.base.defaultStateStrokeWidth

  return (
    <div className={cn('relative h-full min-h-[420px] w-full overflow-hidden rounded-md', className)}>
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: -98.5795,
          latitude: 39.8283,
          zoom: 3,
        }}
        mapStyle={basemap.url}
        scrollZoom={allowZoom}
        dragPan={allowPan}
        dragRotate={false}
        pitchWithRotate={false}
        style={{ width: '100%', height: '100%' }}
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
      </Map>
    </div>
  )
}
