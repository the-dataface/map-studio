import type {
  ChoroplethDimensionSettings,
  ColumnFormat,
  ColumnType,
  DataState,
  LayerType,
  MapLayer,
  PointsLayerStyle,
  AreasLayerStyle,
  SymbolDimensionSettings,
} from '@/app/(studio)/types'
import { defaultChoroplethSettings, defaultStylingSettings } from '@/state/studio-store'

export const createEmptyLayerData = (): DataState => ({
  rawData: '',
  parsedData: [],
  geocodedData: [],
  columns: [],
  customMapData: '',
})

export const createDefaultSymbolDimensions = (): SymbolDimensionSettings => ({
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
})

export const createDefaultPointsStyle = (): PointsLayerStyle => {
  const defaults = defaultStylingSettings()
  return { ...defaults.symbol }
}

export const createDefaultAreasStyle = (): AreasLayerStyle => {
  const defaults = defaultStylingSettings()
  return { ...defaults.choropleth }
}

export function createLayerId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `layer-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function defaultLayerName(type: LayerType, index: number): string {
  return type === 'points' ? `Points ${index}` : `Areas ${index}`
}

export function createEmptyLayer(type: LayerType, order: number, name?: string): MapLayer {
  const layerIndex = order + 1
  return {
    id: createLayerId(),
    name: name ?? defaultLayerName(type, layerIndex),
    type,
    visible: true,
    order,
    data: createEmptyLayerData(),
    columnTypes: {} as ColumnType,
    columnFormats: {} as ColumnFormat,
    dimensions:
      type === 'points'
        ? createDefaultSymbolDimensions()
        : ({ ...defaultChoroplethSettings() } as ChoroplethDimensionSettings),
    styling: type === 'points' ? createDefaultPointsStyle() : createDefaultAreasStyle(),
  }
}
