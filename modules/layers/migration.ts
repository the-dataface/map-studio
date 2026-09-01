import type {
  CanvasType,
  ColumnFormat,
  ColumnType,
  DataState,
  DimensionSettings,
  MapLayer,
  MapType,
  RenderTarget,
  StylingSettings,
} from '@/app/(studio)/types'
import { createEmptyLayer, createLayerId, defaultLayerName } from './defaults'

interface LegacyProjectSlice {
  symbolData: DataState
  choroplethData: DataState
  customData: DataState
  activeMapType: MapType
  columnTypes: ColumnType
  columnFormats: ColumnFormat
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
  renderTarget?: RenderTarget
}

export function hasLayerData(data: DataState): boolean {
  return data.parsedData.length > 0 || data.geocodedData.length > 0
}

export function canvasTypeFromLegacy(
  customData: DataState,
  renderTarget?: RenderTarget,
): CanvasType {
  if (customData.customMapData.trim().length > 0) {
    return 'custom'
  }
  if (renderTarget === 'maplibre') {
    return 'interactive'
  }
  return 'print'
}

export function migrateLegacyToLayers(legacy: LegacyProjectSlice): MapLayer[] {
  const layers: MapLayer[] = []
  let order = 0

  if (hasLayerData(legacy.symbolData)) {
    layers.push({
      id: createLayerId(),
      name: defaultLayerName('points', layers.length + 1),
      type: 'points',
      visible: true,
      order: order++,
      data: JSON.parse(JSON.stringify(legacy.symbolData)),
      columnTypes: { ...legacy.columnTypes },
      columnFormats: { ...legacy.columnFormats },
      dimensions: JSON.parse(JSON.stringify(legacy.dimensionSettings.symbol)),
      styling: JSON.parse(JSON.stringify(legacy.stylingSettings.symbol)),
    })
  }

  if (hasLayerData(legacy.choroplethData)) {
    layers.push({
      id: createLayerId(),
      name: defaultLayerName('areas', layers.length + 1),
      type: 'areas',
      visible: true,
      order: order++,
      data: JSON.parse(JSON.stringify(legacy.choroplethData)),
      columnTypes: { ...legacy.columnTypes },
      columnFormats: { ...legacy.columnFormats },
      dimensions: JSON.parse(JSON.stringify(legacy.dimensionSettings.choropleth)),
      styling: JSON.parse(JSON.stringify(legacy.stylingSettings.choropleth)),
    })
  }

  return layers
}

export function ensureLayersFromLegacy(state: LegacyProjectSlice): MapLayer[] {
  const migrated = migrateLegacyToLayers(state)
  return migrated.length > 0 ? migrated : []
}

export function createLayerFromData(
  type: MapLayer['type'],
  data: DataState,
  order: number,
  name?: string,
): MapLayer {
  const layer = createEmptyLayer(type, order, name)
  return {
    ...layer,
    data: JSON.parse(JSON.stringify(data)),
  }
}
