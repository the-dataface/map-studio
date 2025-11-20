'use client'

/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps, react-hooks/rules-of-hooks */

import { Suspense, useCallback, useEffect, useState, lazy } from 'react'
import React from 'react'
import { DataInput } from '@/components/data-input'
import { GeocodingSection } from '@/components/geocoding-section'
import { MapProjectionSelection } from '@/components/map-projection-selection'
import { FloatingActionButtons } from '@/components/floating-action-buttons'

// Lazy load heavy components for better initial load performance
const DataPreview = lazy(() => import('@/components/data-preview').then((mod) => ({ default: mod.DataPreview })))
const DimensionMapping = lazy(() => import('@/components/dimension-mapping').then((mod) => ({ default: mod.DimensionMapping })))
const MapStyling = lazy(() => import('@/components/map-styling').then((mod) => ({ default: mod.MapStyling })))
const MapPreview = lazy(() => import('@/components/map-preview').then((mod) => ({ default: mod.MapPreview })))
import type {
  ColumnFormat,
  ColumnType,
  DataRow,
  DataState,
  DimensionSettings,
  GeocodedRow,
  GeographyKey,
  MapType,
  ProjectionType,
  StylingSettings,
} from './types'
import { emptyDataState, useStudioStore } from '@/state/studio-store'
import { inferGeographyAndProjection } from '@/modules/data-ingest/inference'
import { resolveActiveMapType } from '@/modules/data-ingest/map-type'
import {
  inferColumnTypesFromData,
  mergeInferredTypes,
  resetDimensionForMapType,
} from '@/modules/data-ingest/dimension-schema'

function MapPreviewFallback() {
  return (
    <div className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-sm text-muted-foreground">
      Loading map data…
    </div>
  )
}

function PanelFallback() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 p-8 text-center text-sm text-muted-foreground">
      Loading…
    </div>
  )
}

const toSampleRows = (rows: DataRow[]) =>
  rows.slice(0, 10).map((row) =>
    Object.values(row).map((value) =>
      typeof value === 'number' || typeof value === 'string' ? value : String(value ?? ''),
    ),
  )

export default function StudioApp() {
  const {
    symbolData,
    setSymbolData,
    choroplethData,
    setChoroplethData,
    customData,
    setCustomData,
    isGeocoding,
    setIsGeocoding,
    activeMapType,
    setActiveMapType,
    selectedGeography,
    setSelectedGeography,
    selectedProjection,
    setSelectedProjection,
    clipToCountry,
    setClipToCountry,
    columnTypes,
    setColumnTypes,
    columnFormats,
    setColumnFormats,
    dimensionSettings,
    setDimensionSettings,
    stylingSettings,
    setStylingSettings,
  } = useStudioStore()

  const [dataInputExpanded, setDataInputExpanded] = useState(true)
  const [showGeocoding, setShowGeocoding] = useState(false)
  const [geocodingExpanded, setGeocodingExpanded] = useState(true)
  const [projectionExpanded, setProjectionExpanded] = useState(true)
  const [dataPreviewExpanded, setDataPreviewExpanded] = useState(true)
  const [dimensionMappingExpanded, setDimensionMappingExpanded] = useState(true)
  const [mapStylingExpanded, setMapStylingExpanded] = useState(true)
  const [mapPreviewExpanded, setMapPreviewExpanded] = useState(true)
  const [mapInView, setMapInView] = useState(false)

  const getCurrentData = () => {
    switch (activeMapType) {
      case 'symbol':
        return symbolData
      case 'choropleth':
        return choroplethData
      case 'custom':
        return customData
      default:
        return symbolData
    }
  }

  const hasDataForType = (type: 'symbol' | 'choropleth' | 'custom') => {
    switch (type) {
      case 'symbol':
        return symbolData.parsedData.length > 0 || symbolData.geocodedData.length > 0
      case 'choropleth':
        return choroplethData.parsedData.length > 0 || choroplethData.geocodedData.length > 0
      case 'custom':
        return customData.customMapData.length > 0
      default:
        return false
    }
  }

  const handleDataLoad = (
    mapType: 'symbol' | 'choropleth' | 'custom',
    parsedData: DataRow[],
    columns: string[],
    rawData: string,
    customMapDataParam?: string,
  ) => {
    const newDataState: DataState = {
      rawData,
      parsedData,
      geocodedData: [],
      columns,
      customMapData: customMapDataParam || '',
    }

    const nextMapType = resolveActiveMapType({
      loadedType: mapType as MapType,
      parsedDataLength: parsedData.length,
      customMapData: customMapDataParam,
      existingChoroplethData: choroplethData,
      existingCustomData: customData,
    })

    switch (mapType) {
      case 'symbol':
        setSymbolData(newDataState)
        setShowGeocoding(parsedData.length > 0)
        break
      case 'choropleth':
        setChoroplethData(newDataState)
        break
      case 'custom':
        setCustomData(newDataState)
        break
    }

    if (parsedData.length > 0) {
      const inferredTypes = inferColumnTypesFromData(parsedData)
      setColumnTypes((prev: ColumnType) => mergeInferredTypes(prev, inferredTypes))
    }

    setActiveMapType(nextMapType)
    setDataInputExpanded(false)
    setDimensionSettings((prev: DimensionSettings) => resetDimensionForMapType(prev, nextMapType))

    const { geography, projection } = inferGeographyAndProjection({
      columns,
      sampleRows: parsedData,
    })

    if (geography !== selectedGeography) {
      setSelectedGeography(geography)
      setDimensionSettings((prev: DimensionSettings) => ({ ...prev, selectedGeography: geography }))
    }

    if (projection !== selectedProjection) {
      setSelectedProjection(projection)
    }
  }

  const handleClearData = (mapType: MapType) => {
    switch (mapType) {
      case 'symbol':
        setSymbolData(emptyDataState())
        setShowGeocoding(false)
        break
      case 'choropleth':
        setChoroplethData(emptyDataState())
        break
      case 'custom':
        setCustomData(emptyDataState())
        break
    }

    setDimensionSettings((prev: DimensionSettings) => resetDimensionForMapType(prev, mapType))

    const hasSymbol = mapType !== 'symbol' ? hasDataForType('symbol') : false
    const hasChoropleth = mapType !== 'choropleth' ? hasDataForType('choropleth') : false
    const hasCustom = mapType !== 'custom' ? hasDataForType('custom') : false

    if (hasChoropleth && hasCustom) {
      setActiveMapType('custom')
    } else if (hasChoropleth) {
      setActiveMapType('choropleth')
    } else if (hasCustom) {
      setActiveMapType('custom')
    } else if (hasSymbol) {
      setActiveMapType('symbol')
    } else {
      setDataInputExpanded(true)
      setActiveMapType('symbol')
    }
  }

  const updateGeocodedData = (geocodedData: GeocodedRow[]) => {
    if (symbolData.parsedData.length > 0) {
      const newColumns = [...symbolData.columns]

      const latNames = ['latitude', 'lat', 'Latitude', 'Lat']
      const lngNames = ['longitude', 'long', 'lng', 'lon', 'Longitude', 'Long', 'Lng', 'Lon']

      const ensureColumn = (columnName: string) => {
        if (!newColumns.includes(columnName)) {
          newColumns.push(columnName)
        }
      }

      if (!newColumns.find((col) => latNames.includes(col))) ensureColumn('Latitude')
      if (!newColumns.find((col) => lngNames.includes(col))) ensureColumn('Longitude')

      const updatedRows: GeocodedRow[] = symbolData.parsedData.map((row: DataRow, index: number) => {
        const geocode = geocodedData[index]
        if (!geocode) return row

        return {
          ...row,
          latitude: geocode.latitude,
          longitude: geocode.longitude,
          geocoded: geocode.geocoded,
          source: geocode.source,
        }
      })

      setSymbolData({
        ...symbolData,
        geocodedData: updatedRows,
        columns: newColumns,
      })

      const inferred = inferColumnTypesFromData(updatedRows)
      setColumnTypes((prev: ColumnType) => mergeInferredTypes(prev, inferred))
    }
  }

  useEffect(() => {
    const handleScroll = () => {
      setMapInView(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleCollapseAll = useCallback(() => {
    setDataInputExpanded(false)
    setGeocodingExpanded(false)
    setProjectionExpanded(false)
    setDataPreviewExpanded(false)
    setDimensionMappingExpanded(false)
    setMapStylingExpanded(false)
    setMapPreviewExpanded(false)
  }, [])

  const handleScrollToMap = useCallback(() => {
    const mapElement = document.querySelector('[data-map-preview]')
    if (mapElement instanceof HTMLElement) {
      mapElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const currentData = getCurrentData()
  const hasSymbolData = hasDataForType('symbol')
  const hasChoroplethData = hasDataForType('choropleth')
  const hasCustomData = hasDataForType('custom')
  const hasData = hasSymbolData || hasChoroplethData || hasCustomData

  return (
    <div className="relative flex min-h-screen w-full flex-col gap-6 pb-24 bg-pattern">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4">
        <DataInput
          onDataLoad={handleDataLoad}
          onClearData={handleClearData}
          isExpanded={dataInputExpanded}
          setIsExpanded={setDataInputExpanded}
        />

        {showGeocoding && (
          <GeocodingSection
            columns={symbolData.columns}
            parsedData={symbolData.parsedData}
            setGeocodedData={updateGeocodedData}
            isGeocoding={isGeocoding}
            setIsGeocoding={setIsGeocoding}
            isExpanded={geocodingExpanded}
            setIsExpanded={setGeocodingExpanded}
          />
        )}

        <MapProjectionSelection
          geography={selectedGeography}
          projection={selectedProjection}
          onGeographyChange={setSelectedGeography}
          onProjectionChange={setSelectedProjection as (projection: ProjectionType) => void}
          columns={currentData.columns}
          sampleRows={toSampleRows(currentData.parsedData)}
          clipToCountry={clipToCountry}
          onClipToCountryChange={setClipToCountry}
          isExpanded={projectionExpanded}
          setIsExpanded={setProjectionExpanded}
        />

        {hasData && (
          <>
            <Suspense fallback={<PanelFallback />}>
              <DataPreview
                data={currentData.parsedData.length > 0 ? currentData.parsedData : currentData.geocodedData}
                columns={currentData.columns}
                mapType={activeMapType}
                onClearData={handleClearData}
                symbolDataExists={hasSymbolData}
                choroplethDataExists={hasChoroplethData}
                customDataExists={hasCustomData}
                columnTypes={columnTypes}
                onUpdateColumnTypes={setColumnTypes}
                onUpdateColumnFormats={setColumnFormats}
                symbolDataLength={symbolData.parsedData.length}
                choroplethDataLength={choroplethData.parsedData.length}
                customDataLoaded={hasCustomData}
                onMapTypeChange={setActiveMapType as (mapType: 'symbol' | 'choropleth' | 'custom') => void}
                columnFormats={columnFormats}
                selectedGeography={selectedGeography}
                isExpanded={dataPreviewExpanded}
                setIsExpanded={setDataPreviewExpanded}
              />
            </Suspense>

            <Suspense fallback={<PanelFallback />}>
              <DimensionMapping
                mapType={activeMapType}
                symbolDataExists={hasSymbolData}
                choroplethDataExists={hasChoroplethData}
                customDataExists={hasCustomData}
                columnTypes={columnTypes}
                dimensionSettings={dimensionSettings}
                onUpdateSettings={setDimensionSettings}
                columnFormats={columnFormats}
                symbolParsedData={symbolData.parsedData}
                symbolGeocodedData={symbolData.geocodedData}
                choroplethParsedData={choroplethData.parsedData}
                choroplethGeocodedData={choroplethData.geocodedData}
                symbolColumns={symbolData.columns}
                choroplethColumns={choroplethData.columns}
                selectedGeography={selectedGeography}
                stylingSettings={stylingSettings}
                isExpanded={dimensionMappingExpanded}
                setIsExpanded={setDimensionMappingExpanded}
              />
            </Suspense>

            <Suspense fallback={<PanelFallback />}>
              <MapStyling
                stylingSettings={stylingSettings}
                onUpdateStylingSettings={setStylingSettings}
                dimensionSettings={dimensionSettings}
                symbolDataExists={hasSymbolData}
                choroplethDataExists={hasChoroplethData}
                customDataExists={hasCustomData}
                isExpanded={mapStylingExpanded}
                setIsExpanded={setMapStylingExpanded}
              />
            </Suspense>
          </>
        )}

        <Suspense fallback={<MapPreviewFallback />}>
          <MapPreview
            symbolData={symbolData.parsedData.length > 0 ? symbolData.geocodedData : symbolData.parsedData}
            choroplethData={choroplethData.parsedData}
            mapType={activeMapType === 'custom' && !hasSymbolData ? 'symbol' : activeMapType}
            dimensionSettings={dimensionSettings}
            stylingSettings={stylingSettings}
            symbolDataExists={hasSymbolData}
            choroplethDataExists={hasChoroplethData}
            columnTypes={columnTypes}
            columnFormats={columnFormats}
            customMapData={customData.customMapData}
            selectedGeography={selectedGeography}
            selectedProjection={selectedProjection}
            clipToCountry={clipToCountry}
            isExpanded={mapPreviewExpanded}
            setIsExpanded={setMapPreviewExpanded}
          />
        </Suspense>
      </div>

      <FloatingActionButtons
        onScrollToMap={handleScrollToMap}
        onCollapseAll={handleCollapseAll}
        visible={hasData}
        showCollapse={hasData}
        showJump={hasData && !mapInView}
      />
    </div>
  )
}
