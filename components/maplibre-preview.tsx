'use client'

import { useEffect, useMemo, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

import type {
  BoundaryConfig,
  ColumnFormat,
  ColumnType,
  DataRow,
  DimensionSettings,
  GeocodedRow,
  GeographyKey,
  MapLibreConfig,
  MapType,
  MatchReport,
  StylingSettings,
} from '@/app/(studio)/types'
import { toast } from '@/components/ui/use-toast'
import { geographyKeyFromBoundaryConfig } from '@/modules/boundaries/compatibility'
import { computeStateColumnMatchReport, joinChoroplethData } from '@/modules/boundaries/join-data'
import { useBoundaries } from '@/modules/boundaries/use-boundaries'
import { toGeoJsonChoroplethLabels } from '@/modules/map-render/adapters/to-geojson-choropleth-labels'
import { toGeoJsonSymbols } from '@/modules/map-render/adapters/to-geojson-symbols'
import { MapLibreChoropleth } from '@/modules/map-render/maplibre/MapLibreChoropleth'
import { MapLibreCombined } from '@/modules/map-render/maplibre/MapLibreCombined'
import { MapLibreSymbols } from '@/modules/map-render/maplibre/MapLibreSymbols'
import {
  createChoroplethTooltipResolver,
  createSymbolTooltipResolver,
} from '@/modules/map-render/maplibre/maplibre-tooltip'

type DataRecord = DataRow | GeocodedRow

interface MapLibrePreviewProps {
  mapType: MapType
  symbolData: DataRecord[]
  choroplethData: DataRecord[]
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
  boundaryConfig: BoundaryConfig
  maplibreConfig: MapLibreConfig
  selectedGeography: GeographyKey
  previewContext?: 'setup' | 'design'
  columnTypes?: ColumnType
  columnFormats?: ColumnFormat
  activeTool?: 'move' | 'inspect' | 'select' | 'draw'
}

export function MapLibrePreview({
  mapType,
  symbolData,
  choroplethData,
  dimensionSettings,
  stylingSettings,
  boundaryConfig,
  maplibreConfig,
  selectedGeography,
  previewContext = 'design',
  columnTypes = {},
  columnFormats = {},
  activeTool = 'move',
}: MapLibrePreviewProps) {
  const isSetupPreview = previewContext === 'setup'
  const inspectMode = isSetupPreview && activeTool === 'inspect'
  const isSymbolMap = isSetupPreview ? symbolData.length > 0 : mapType === 'symbol'
  const isChoroplethMap = isSetupPreview ? choroplethData.length > 0 : mapType === 'choropleth'

  const geographyKey =
    geographyKeyFromBoundaryConfig(boundaryConfig) ?? selectedGeography

  const symbolResult = useMemo(() => {
    if (!isSymbolMap) {
      return null
    }
    return toGeoJsonSymbols({
      symbolData,
      dimensionSettings,
      stylingSettings,
      columnTypes,
      columnFormats,
      selectedGeography: geographyKey,
    })
  }, [columnFormats, columnTypes, dimensionSettings, geographyKey, isSymbolMap, stylingSettings, symbolData])

  const { data, isLoading, error } = useBoundaries({
    geographyKey,
    region: boundaryConfig.scope.region,
    enabled: isChoroplethMap,
  })

  const choroplethSettings = dimensionSettings.choropleth
  const stateColumn = isSetupPreview
    ? choroplethSettings.stateColumn
    : boundaryConfig.joinColumn || choroplethSettings.stateColumn

  const { joinedGeoJson, matchReport } = useMemo(() => {
    const emptyReport: MatchReport = {
      matched: 0,
      totalDataRows: 0,
      totalFeatures: 0,
      unmatchedDataValues: [],
      unmatchedFeatureCount: 0,
    }

    if (!isChoroplethMap || !data?.data || !stateColumn) {
      return { joinedGeoJson: data?.data ?? null, matchReport: emptyReport }
    }

    if (!choroplethSettings.colorBy) {
      const report = computeStateColumnMatchReport(
        data.data,
        choroplethData,
        stateColumn,
        geographyKey,
      )
      return { joinedGeoJson: data.data, matchReport: report }
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
    isChoroplethMap,
    stateColumn,
    stylingSettings,
  ])

  const symbolReady =
    symbolResult &&
    symbolResult.plottedCount > 0 &&
    dimensionSettings.symbol.latitude &&
    dimensionSettings.symbol.longitude

  const choroplethReady = Boolean(joinedGeoJson)

  const choroplethLabelGeoJson = useMemo(() => {
    if (!joinedGeoJson || !isChoroplethMap) {
      return null
    }
    return toGeoJsonChoroplethLabels({
      choroplethGeoJson: joinedGeoJson,
      choroplethData,
      dimensionSettings,
      stylingSettings,
      columnTypes,
      columnFormats,
      geographyKey,
    })
  }, [
    choroplethData,
    columnFormats,
    columnTypes,
    dimensionSettings,
    geographyKey,
    isChoroplethMap,
    joinedGeoJson,
    stylingSettings,
  ])

  const symbolTooltip = useMemo(
    () =>
      symbolResult
        ? createSymbolTooltipResolver({
            records: symbolResult.records,
            dimensionSettings,
            columnTypes,
            columnFormats,
          })
        : undefined,
    [columnFormats, columnTypes, dimensionSettings, symbolResult],
  )

  const choroplethTooltip = useMemo(
    () =>
      stateColumn
        ? createChoroplethTooltipResolver({
            choroplethData,
            stateColumn,
            geographyKey,
            dimensionSettings,
            columnTypes,
            columnFormats,
          })
        : undefined,
    [
      choroplethData,
      columnFormats,
      columnTypes,
      dimensionSettings,
      geographyKey,
      stateColumn,
    ],
  )

  const mapInteractionProps = {
    allowZoom: maplibreConfig.interactivity.allowZoom,
    allowPan: maplibreConfig.interactivity.allowPan,
    inspectMode,
  }

  if (isSymbolMap && isChoroplethMap) {
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

    if (!symbolReady && !choroplethReady) {
      return (
        <div className="flex h-full min-h-[420px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
          Configure coordinates and region mapping to preview your layers.
        </div>
      )
    }

    if (symbolReady && choroplethReady && joinedGeoJson && symbolResult) {
      return (
        <div className="flex h-full min-h-[420px] flex-col gap-3">
          <MapLibreCombined
            choroplethGeoJson={joinedGeoJson}
            choroplethLabelGeoJson={choroplethLabelGeoJson ?? undefined}
            symbolGeoJson={symbolResult.features}
            stylingSettings={stylingSettings}
            basemapStyleId={maplibreConfig.basemapStyleId}
            {...mapInteractionProps}
            getSymbolTooltipContent={symbolTooltip}
            getChoroplethTooltipContent={choroplethTooltip}
            className="flex-1"
          />
          <SymbolSummaryBanner
            plottedCount={symbolResult.plottedCount}
            skippedCount={symbolResult.skippedCount}
          />
          {stateColumn ? (
            <MatchReportBanner report={matchReport} showWarnings />
          ) : null}
        </div>
      )
    }

    if (symbolReady && symbolResult) {
      return (
        <div className="flex h-full min-h-[420px] flex-col gap-3">
          <MapLibreSymbols
            geoJson={symbolResult.features}
            stylingSettings={stylingSettings}
            basemapStyleId={maplibreConfig.basemapStyleId}
            {...mapInteractionProps}
            getTooltipContent={symbolTooltip}
            className="flex-1"
          />
          <SymbolSummaryBanner
            plottedCount={symbolResult.plottedCount}
            skippedCount={symbolResult.skippedCount}
          />
        </div>
      )
    }
  }

  if (isSymbolMap && !isChoroplethMap) {
    const { latitude, longitude } = dimensionSettings.symbol

    if (!latitude || !longitude) {
      return (
        <div className="flex h-full min-h-[420px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
          Set latitude and longitude columns in dimension mapping to plot symbols on the map.
        </div>
      )
    }

    if (!symbolResult || symbolResult.plottedCount === 0) {
      return (
        <div className="flex h-full min-h-[420px] items-center justify-center px-6 text-center text-sm text-muted-foreground">
          No valid coordinates found. Check your latitude and longitude columns or run geocoding.
        </div>
      )
    }

    return (
      <div className="flex h-full min-h-[420px] flex-col gap-3">
        <MapLibreSymbols
          geoJson={symbolResult.features}
          stylingSettings={stylingSettings}
          basemapStyleId={maplibreConfig.basemapStyleId}
          {...mapInteractionProps}
          getTooltipContent={symbolTooltip}
          className="flex-1"
        />
        <SymbolSummaryBanner
          plottedCount={symbolResult.plottedCount}
          skippedCount={symbolResult.skippedCount}
        />
      </div>
    )
  }

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
        labelGeoJson={choroplethLabelGeoJson ?? undefined}
        basemapStyleId={maplibreConfig.basemapStyleId}
        stylingSettings={stylingSettings}
        {...mapInteractionProps}
        getTooltipContent={choroplethTooltip}
        className="flex-1"
      />
      {stateColumn ? <MatchReportBanner report={matchReport} showWarnings /> : null}
    </div>
  )
}

function SymbolSummaryBanner({
  plottedCount,
  skippedCount,
}: {
  plottedCount: number
  skippedCount: number
}) {
  return (
    <div
      className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground"
      role="status"
    >
      <span className="font-medium text-foreground">{plottedCount} symbols plotted</span>
      {skippedCount > 0 ? (
        <>
          {' · '}
          {skippedCount} row{skippedCount === 1 ? '' : 's'} skipped (missing or invalid coordinates)
        </>
      ) : null}
    </div>
  )
}

function MatchReportBanner({
  report,
  showWarnings = false,
}: {
  report: MatchReport
  showWarnings?: boolean
}) {
  const lastToastKey = useRef<string | null>(null)

  const hasUnmatched =
    report.unmatchedDataValues.length > 0 || report.unmatchedFeatureCount > 0

  useEffect(() => {
    if (!showWarnings || !hasUnmatched || report.totalDataRows === 0) {
      return
    }

    const toastKey = `${report.unmatchedDataValues.join(',')}:${report.unmatchedFeatureCount}`
    if (lastToastKey.current === toastKey) {
      return
    }
    lastToastKey.current = toastKey

    const unmatchedSummary =
      report.unmatchedDataValues.length > 0
        ? `${report.unmatchedDataValues.length} data value(s) could not be matched to map regions`
        : `${report.unmatchedFeatureCount} map region(s) have no matching data`

    toast({
      title: 'Boundary join warning',
      description: unmatchedSummary,
      variant: 'destructive',
      icon: <AlertTriangle className="h-5 w-5" />,
    })
  }, [hasUnmatched, report, showWarnings])

  if (report.totalDataRows === 0) {
    return (
      <p className="px-1 text-xs text-muted-foreground">
        Set a region column in dimension mapping to join your data to the map.
      </p>
    )
  }

  return (
    <div
      className={
        hasUnmatched
          ? 'rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-100'
          : 'rounded-md border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground'
      }
      role={hasUnmatched ? 'alert' : 'status'}
    >
      {hasUnmatched ? (
        <div className="mb-1 flex items-center gap-1.5 font-medium">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          Join issues detected
        </div>
      ) : null}
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
          {report.unmatchedDataValues.length > 0 && report.unmatchedFeatureCount > 0 ? ', ' : null}
          {report.unmatchedFeatureCount > 0
            ? `${report.unmatchedFeatureCount} regions without data`
            : null}
          {report.unmatchedDataValues.length > 0 ? (
            <span className="mt-1 block text-[11px] opacity-90">
              Examples: {report.unmatchedDataValues.slice(0, 3).join(', ')}
              {report.unmatchedDataValues.length > 3 ? '…' : ''}
            </span>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
