'use client'

import { useMemo } from 'react'

import type {
  BoundaryConfig,
  ColumnFormat,
  ColumnType,
  DataRow,
  DimensionSettings,
  GeocodedRow,
  GeographyKey,
  MapLibreConfig,
  MatchReport,
  StylingSettings,
} from '@/app/(studio)/types'
import { geographyKeyFromBoundaryConfig } from '@/modules/boundaries/compatibility'
import { joinChoroplethData } from '@/modules/boundaries/join-data'
import { useBoundaries } from '@/modules/boundaries/use-boundaries'
import { MapLibreChoropleth } from '@/modules/map-render/maplibre/MapLibreChoropleth'

type DataRecord = DataRow | GeocodedRow

interface MapLibrePreviewProps {
  choroplethData: DataRecord[]
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
  boundaryConfig: BoundaryConfig
  maplibreConfig: MapLibreConfig
  selectedGeography: GeographyKey
}

export function MapLibrePreview({
  choroplethData,
  dimensionSettings,
  stylingSettings,
  boundaryConfig,
  maplibreConfig,
  selectedGeography,
}: MapLibrePreviewProps) {
  const geographyKey =
    geographyKeyFromBoundaryConfig(boundaryConfig) ?? selectedGeography

  const { data, isLoading, error } = useBoundaries({
    geographyKey,
    region: boundaryConfig.scope.region,
  })

  const choroplethSettings = dimensionSettings.choropleth
  const stateColumn = boundaryConfig.joinColumn || choroplethSettings.stateColumn

  const { joinedGeoJson, matchReport } = useMemo(() => {
    const emptyReport: MatchReport = {
      matched: 0,
      totalDataRows: 0,
      totalFeatures: 0,
      unmatchedDataValues: [],
      unmatchedFeatureCount: 0,
    }

    if (!data?.data || !stateColumn || !choroplethSettings.colorBy) {
      return { joinedGeoJson: data?.data ?? null, matchReport: emptyReport }
    }

    const result = joinChoroplethData({
      features: data.data,
      choroplethData,
      stateColumn,
      colorBy: choroplethSettings.colorBy,
      colorScale: choroplethSettings.colorScale,
      geographyKey,
      choroplethSettings,
      stylingSettings,
      defaultFillColor: stylingSettings.base.defaultStateFillColor,
    })

    return {
      joinedGeoJson: result.features,
      matchReport: result.matchReport,
    }
  }, [
    choroplethData,
    choroplethSettings,
    data?.data,
    geographyKey,
    stateColumn,
    stylingSettings,
  ])

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center text-sm text-muted-foreground">
        Loading map boundaries…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center px-6 text-center text-sm text-destructive">
        {error instanceof Error ? error.message : 'Failed to load map boundaries.'}
      </div>
    )
  }

  if (!joinedGeoJson) {
    return (
      <div className="flex h-full min-h-[420px] items-center justify-center text-sm text-muted-foreground">
        No boundary data available.
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-[420px] flex-col gap-3">
      <MapLibreChoropleth
        geoJson={joinedGeoJson}
        basemapStyleId={maplibreConfig.basemapStyleId}
        stylingSettings={stylingSettings}
        allowZoom={maplibreConfig.interactivity.allowZoom}
        allowPan={maplibreConfig.interactivity.allowPan}
        className="flex-1"
      />
      {stateColumn && choroplethSettings.colorBy ? (
        <MatchReportBanner report={matchReport} />
      ) : null}
    </div>
  )
}

function MatchReportBanner({ report }: { report: MatchReport }) {
  if (report.totalDataRows === 0) {
    return (
      <p className="px-1 text-xs text-muted-foreground">
        Set a region column and color field in dimension mapping to fill the map.
      </p>
    )
  }

  const hasUnmatched =
    report.unmatchedDataValues.length > 0 || report.unmatchedFeatureCount > 0

  return (
    <div
      className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
      role="status"
    >
      <span className="font-medium text-foreground">
        {report.matched}/{report.totalDataRows} data rows matched
      </span>
      {' · '}
      {report.totalFeatures} boundary features
      {hasUnmatched ? (
        <>
          {' · '}
          {report.unmatchedDataValues.length > 0
            ? `${report.unmatchedDataValues.length} unmatched data value(s)`
            : null}
          {report.unmatchedDataValues.length > 0 && report.unmatchedFeatureCount > 0
            ? ', '
            : null}
          {report.unmatchedFeatureCount > 0
            ? `${report.unmatchedFeatureCount} regions without data`
            : null}
        </>
      ) : null}
    </div>
  )
}
