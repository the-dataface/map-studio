import type {
  ColumnFormat,
  ColumnType,
  DataState,
  DimensionSettings,
  GeographyKey,
  MapLayer,
  MapType,
} from '@/app/(studio)/types'
import { createEmptyLayerData } from './defaults'
import {
  getPrimaryAreaLayer,
  getPrimaryPointLayer,
  getSelectedLayer,
  layerHasData,
} from './selectors'

/** Sync layer model back to legacy store fields for renderers not yet fully migrated. */
export function syncLegacyFromLayers(
  layers: MapLayer[],
  selectedLayerId: string | null,
  customBoundary: string,
  selectedGeography: GeographyKey,
): {
  symbolData: DataState
  choroplethData: DataState
  customData: DataState
  activeMapType: MapType
  columnTypes: ColumnType
  columnFormats: ColumnFormat
  dimensionSettings: DimensionSettings
} {
  const selected = getSelectedLayer(layers, selectedLayerId)
  const primaryPoints = getPrimaryPointLayer(layers)
  const primaryAreas = getPrimaryAreaLayer(layers)

  const symbolSourceLayer =
    selected?.type === 'points' ? selected : primaryPoints
  const areaSourceLayer =
    selected?.type === 'areas' ? selected : primaryAreas

  const symbolData = primaryPoints?.data ?? createEmptyLayerData()
  const choroplethData = primaryAreas?.data ?? createEmptyLayerData()
  const customData: DataState = {
    ...createEmptyLayerData(),
    customMapData: customBoundary,
    parsedData: choroplethData.parsedData,
    geocodedData: choroplethData.geocodedData,
    columns: choroplethData.columns,
    rawData: choroplethData.rawData,
  }

  const columnTypes = selected?.columnTypes ?? primaryPoints?.columnTypes ?? primaryAreas?.columnTypes ?? {}
  const columnFormats = selected?.columnFormats ?? primaryPoints?.columnFormats ?? primaryAreas?.columnFormats ?? {}

  const symbolDimensions =
    symbolSourceLayer?.dimensions ??
    ({
      latitude: '',
      longitude: '',
      sizeBy: '',
      sizeMin: 5,
      sizeMax: 20,
      sizeMinValue: 0,
      sizeMaxValue: 100,
      colorBy: '',
      colorScale: 'linear',
      colorPalette: 'Blues',
      colorMinValue: 0,
      colorMidValue: 50,
      colorMaxValue: 100,
      colorMinColor: '#f7fbff',
      colorMidColor: '#6baed6',
      colorMaxColor: '#08519c',
      categoricalColors: [],
      labelTemplate: '',
      symbolTextBy: '',
    } as DimensionSettings['symbol'])

  const choroplethDimensions =
    areaSourceLayer?.dimensions ??
    ({
      stateColumn: '',
      colorBy: '',
      colorScale: 'linear',
      colorPalette: 'Blues',
      colorMinValue: 0,
      colorMidValue: 50,
      colorMaxValue: 100,
      colorMinColor: '#f7fbff',
      colorMidColor: '#6baed6',
      colorMaxColor: '#08519c',
      categoricalColors: [],
      labelTemplate: '',
    } as DimensionSettings['choropleth'])

  let activeMapType: MapType = 'symbol'
  if (customBoundary.trim() && layerHasData(primaryAreas ?? ({} as MapLayer))) {
    activeMapType = 'custom'
  } else if (primaryAreas && layerHasData(primaryAreas) && !primaryPoints) {
    activeMapType = 'choropleth'
  } else if (primaryPoints && layerHasData(primaryPoints)) {
    activeMapType = 'symbol'
  } else if (primaryAreas && layerHasData(primaryAreas)) {
    activeMapType = 'choropleth'
  }

  return {
    symbolData,
    choroplethData,
    customData,
    activeMapType,
    columnTypes,
    columnFormats,
    dimensionSettings: {
      symbol: symbolDimensions as DimensionSettings['symbol'],
      choropleth: choroplethDimensions as DimensionSettings['choropleth'],
      custom: { ...(choroplethDimensions as DimensionSettings['choropleth']) },
      selectedGeography,
    },
  }
}

export function mergeStylingFromLayers(
  baseStyling: import('@/app/(studio)/types').StylingSettings,
  layers: MapLayer[],
): import('@/app/(studio)/types').StylingSettings {
  const primaryPoints = getPrimaryPointLayer(layers)
  const primaryAreas = getPrimaryAreaLayer(layers)

  return {
    ...baseStyling,
    symbol: primaryPoints ? { ...baseStyling.symbol, ...primaryPoints.styling } : baseStyling.symbol,
    choropleth: primaryAreas ? { ...baseStyling.choropleth, ...primaryAreas.styling } : baseStyling.choropleth,
  }
}
