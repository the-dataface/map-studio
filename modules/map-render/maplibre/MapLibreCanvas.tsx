'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import Map from 'react-map-gl/maplibre'
import type { MapLayerMouseEvent, MapRef } from 'react-map-gl/maplibre'
import type { MapGeoJSONFeature } from 'maplibre-gl'

import { cn } from '@/lib/utils'

import { getBasemapStyle } from './basemap-styles'

import 'maplibre-gl/dist/maplibre-gl.css'

interface MapLibreCanvasProps {
  basemapStyleId: string
  allowZoom?: boolean
  allowPan?: boolean
  inspectMode?: boolean
  interactiveLayerIds?: string[]
  getTooltipContent?: (feature: MapGeoJSONFeature) => ReactNode | null
  bounds?: [[number, number], [number, number]] | null
  className?: string
  children: React.ReactNode
}

export function MapLibreCanvas({
  basemapStyleId,
  allowZoom = true,
  allowPan = true,
  inspectMode = false,
  interactiveLayerIds = [],
  getTooltipContent,
  bounds = null,
  className,
  children,
}: MapLibreCanvasProps) {
  const mapRef = useRef<MapRef>(null)
  const basemap = getBasemapStyle(basemapStyleId)
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    content: ReactNode
  } | null>(null)

  useEffect(() => {
    if (!mapRef.current || !bounds) {
      return
    }

    mapRef.current.fitBounds(bounds, { padding: 64, duration: 0, maxZoom: 12 })
  }, [bounds])

  const updateCursor = useCallback(
    (cursor: string) => {
      const canvas = mapRef.current?.getMap()?.getCanvas()
      if (canvas) {
        canvas.style.cursor = cursor
      }
    },
    [],
  )

  useEffect(() => {
    if (!inspectMode) {
      setTooltip(null)
    }
  }, [inspectMode])

  useEffect(() => {
    if (inspectMode) {
      updateCursor('default')
      return
    }

    updateCursor(allowPan ? 'grab' : 'default')
  }, [allowPan, inspectMode, updateCursor])

  const handleMouseMove = useCallback(
    (event: MapLayerMouseEvent) => {
      if (!inspectMode || !getTooltipContent) {
        return
      }

      const map = mapRef.current?.getMap()
      if (!map) {
        return
      }

      const features = map.queryRenderedFeatures(event.point, {
        layers: interactiveLayerIds,
      })

      if (!features.length) {
        setTooltip(null)
        updateCursor('default')
        return
      }

      const content = getTooltipContent(features[0] as MapGeoJSONFeature)
      if (!content) {
        setTooltip(null)
        updateCursor('default')
        return
      }

      setTooltip({ x: event.point.x, y: event.point.y, content })
      updateCursor('pointer')
    },
    [getTooltipContent, inspectMode, interactiveLayerIds, updateCursor],
  )

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
    if (inspectMode) {
      updateCursor('default')
    }
  }, [inspectMode, updateCursor])

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
        onMouseMove={inspectMode ? handleMouseMove : undefined}
        onMouseLeave={inspectMode ? handleMouseLeave : undefined}
      >
        {children}
      </Map>
      {tooltip ? (
        <div
          className="pointer-events-none absolute z-10 max-w-xs rounded-md border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md"
          style={{
            left: tooltip.x + 10,
            top: tooltip.y - 10,
            transform: 'translateY(-100%)',
          }}
        >
          {tooltip.content}
        </div>
      ) : null}
    </div>
  )
}

export type { MapRef }
