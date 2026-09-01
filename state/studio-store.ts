'use client'

import { create } from 'zustand'

import type {
  BoundaryConfig,
  CanvasType,
  CategoricalColor,
  ColumnFormat,
  ColumnType,
  DataState,
  DimensionSettings,
  GeographyKey,
  MapLayer,
  MapLibreConfig,
  MapType,
  PrintConfig,
  ProjectionType,
  ReferenceLayerConfig,
  RenderTarget,
  SavedStyle,
  StylingSettings,
  ColorScaleType,
} from '@/app/(studio)/types'
import { canvasTypeToRenderTarget } from '@/app/(studio)/types'
import {
  boundaryConfigFromGeographyKey,
  syncGeographyFromBoundary,
} from '@/modules/boundaries/compatibility'
import { createEmptyLayer, createLayerId } from '@/modules/layers/defaults'
import { canvasTypeFromLegacy, createLayerFromData, ensureLayersFromLegacy } from '@/modules/layers/migration'
import { mergeStylingFromLayers, syncLegacyFromLayers } from '@/modules/layers/legacy-sync'
import { getPrimaryAreaLayer, getPrimaryPointLayer, getSelectedLayer, nextLayerOrder } from '@/modules/layers/selectors'
import { DEFAULT_REFERENCE_LAYERS } from '@/modules/reference-layers/catalog'
import { DEFAULT_MAPLIBRE_CONFIG } from '@/modules/map-render/maplibre/basemap-styles'

type Updater<T> = T | ((previous: T) => T)

const resolveValue = <T>(value: Updater<T>, previous: T): T =>
  typeof value === 'function' ? (value as (current: T) => T)(previous) : value

// History management for undo/redo
type StateSnapshot = {
  symbolData: DataState
  choroplethData: DataState
  customData: DataState
  isGeocoding: boolean
  activeMapType: MapType
  selectedGeography: GeographyKey
  selectedProjection: ProjectionType
  clipToCountry: boolean
  renderTarget: RenderTarget
  boundaryConfig: BoundaryConfig
  maplibreConfig: MapLibreConfig
  columnTypes: ColumnType
  columnFormats: ColumnFormat
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
  layers: MapLayer[]
  selectedLayerId: string | null
  canvasType: CanvasType
  customBoundary: string
  printConfig: PrintConfig
  referenceLayers: ReferenceLayerConfig[]
}

const MAX_HISTORY_SIZE = 50

const createStateSnapshot = (state: {
  symbolData: DataState
  choroplethData: DataState
  customData: DataState
  isGeocoding: boolean
  activeMapType: MapType
  selectedGeography: GeographyKey
  selectedProjection: ProjectionType
  clipToCountry: boolean
  renderTarget: RenderTarget
  boundaryConfig: BoundaryConfig
  maplibreConfig: MapLibreConfig
  columnTypes: ColumnType
  columnFormats: ColumnFormat
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
  layers: MapLayer[]
  selectedLayerId: string | null
  canvasType: CanvasType
  customBoundary: string
  printConfig: PrintConfig
  referenceLayers: ReferenceLayerConfig[]
}): StateSnapshot => ({
  symbolData: JSON.parse(JSON.stringify(state.symbolData)),
  choroplethData: JSON.parse(JSON.stringify(state.choroplethData)),
  customData: JSON.parse(JSON.stringify(state.customData)),
  isGeocoding: state.isGeocoding,
  activeMapType: state.activeMapType,
  selectedGeography: state.selectedGeography,
  selectedProjection: state.selectedProjection,
  clipToCountry: state.clipToCountry,
  renderTarget: state.renderTarget,
  boundaryConfig: JSON.parse(JSON.stringify(state.boundaryConfig)),
  maplibreConfig: JSON.parse(JSON.stringify(state.maplibreConfig)),
  columnTypes: JSON.parse(JSON.stringify(state.columnTypes)),
  columnFormats: JSON.parse(JSON.stringify(state.columnFormats)),
  dimensionSettings: JSON.parse(JSON.stringify(state.dimensionSettings)),
  stylingSettings: JSON.parse(JSON.stringify(state.stylingSettings)),
  layers: JSON.parse(JSON.stringify(state.layers)),
  selectedLayerId: state.selectedLayerId,
  canvasType: state.canvasType,
  customBoundary: state.customBoundary,
  printConfig: JSON.parse(JSON.stringify(state.printConfig)),
  referenceLayers: JSON.parse(JSON.stringify(state.referenceLayers)),
})

const applyStateSnapshot = (snapshot: StateSnapshot): Partial<StudioState> => ({
  symbolData: snapshot.symbolData,
  choroplethData: snapshot.choroplethData,
  customData: snapshot.customData,
  isGeocoding: snapshot.isGeocoding,
  activeMapType: snapshot.activeMapType,
  selectedGeography: snapshot.selectedGeography,
  selectedProjection: snapshot.selectedProjection,
  clipToCountry: snapshot.clipToCountry,
  renderTarget: snapshot.renderTarget,
  boundaryConfig: snapshot.boundaryConfig,
  maplibreConfig: snapshot.maplibreConfig,
  columnTypes: snapshot.columnTypes,
  columnFormats: snapshot.columnFormats,
  dimensionSettings: snapshot.dimensionSettings,
  stylingSettings: snapshot.stylingSettings,
  layers: snapshot.layers,
  selectedLayerId: snapshot.selectedLayerId,
  canvasType: snapshot.canvasType,
  customBoundary: snapshot.customBoundary,
  printConfig: snapshot.printConfig,
  referenceLayers: snapshot.referenceLayers,
})

const createEmptyDataState = (): DataState => ({
  rawData: '',
  parsedData: [],
  geocodedData: [],
  columns: [],
  customMapData: '',
})

const defaultPresetStyles: SavedStyle[] = [
  {
    id: 'preset-light',
    name: 'Light map',
    type: 'preset',
    settings: {
      mapBackgroundColor: '#ffffff',
      nationFillColor: '#f0f0f0',
      nationStrokeColor: '#000000',
      nationStrokeWidth: 1,
      defaultStateFillColor: '#e0e0e0',
      defaultStateStrokeColor: '#999999',
      defaultStateStrokeWidth: 0.5,
    },
  },
  {
    id: 'preset-dark',
    name: 'Dark map',
    type: 'preset',
    settings: {
      mapBackgroundColor: '#333333',
      nationFillColor: '#444444',
      nationStrokeColor: '#ffffff',
      nationStrokeWidth: 1,
      defaultStateFillColor: '#555555',
      defaultStateStrokeColor: '#888888',
      defaultStateStrokeWidth: 0.5,
    },
  },
]

const createDefaultChoroplethSettings = () => ({
  stateColumn: '',
  colorBy: '',
  colorScale: 'linear' as ColorScaleType,
  colorPalette: 'Blues',
  colorMinValue: 0,
  colorMidValue: 50,
  colorMaxValue: 100,
  colorMinColor: '#f7fbff',
  colorMidColor: '#6baed6',
  colorMaxColor: '#08519c',
  categoricalColors: [] as CategoricalColor[],
  labelTemplate: '',
})

const createDefaultDimensionSettings = (): DimensionSettings => {
  const defaultChoropleth = createDefaultChoroplethSettings()

  return {
    symbol: {
      latitude: '',
      longitude: '',
      sizeBy: '',
      sizeMin: 5,
      sizeMax: 20,
      sizeMinValue: 0,
      sizeMaxValue: 100,
      colorBy: '',
      colorScale: 'linear' as ColorScaleType,
      colorPalette: 'Blues',
      colorMinValue: 0,
      colorMidValue: 50,
      colorMaxValue: 100,
      colorMinColor: '#f7fbff',
      colorMidColor: '#6baed6',
      colorMaxColor: '#08519c',
      categoricalColors: [] as CategoricalColor[],
      labelTemplate: '',
      symbolTextBy: '',
    },
    choropleth: defaultChoropleth,
    custom: { ...defaultChoropleth },
    selectedGeography: 'usa-states',
  }
}

const createDefaultStylingSettings = (): StylingSettings => ({
  activeTab: 'base',
  base: {
    mapBackgroundColor: '#ffffff',
    nationFillColor: '#f0f0f0',
    nationStrokeColor: '#000000',
    nationStrokeWidth: 1,
    defaultStateFillColor: '#e0e0e0',
    defaultStateStrokeColor: '#999999',
    defaultStateStrokeWidth: 0.5,
    savedStyles: defaultPresetStyles,
  },
  symbol: {
    symbolType: 'symbol',
    symbolShape: 'circle',
    symbolFillColor: '#1f77b4',
    symbolStrokeColor: '#ffffff',
    symbolSize: 5,
    symbolStrokeWidth: 1,
    labelFontFamily: 'Inter',
    labelBold: false,
    labelItalic: false,
    labelUnderline: false,
    labelStrikethrough: false,
    labelColor: '#333333',
    labelOutlineColor: '#ffffff',
    labelFontSize: 10,
    labelOutlineThickness: 0,
    labelOffsetX: 0,
    labelOffsetY: 0,
    labelAlignment: 'auto',
    customSvgPath: '',
    symbolText: {
      fontFamily: 'Inter',
      fontBold: true,
      fontItalic: false,
      fontSize: 10,
      color: '#ffffff',
      outlineColor: '#000000',
      outlineThickness: 0,
      offsetX: 0,
      offsetY: 0,
      scaleWithSymbol: true,
    },
  },
  choropleth: {
    labelFontFamily: 'Inter',
    labelBold: false,
    labelItalic: false,
    labelUnderline: false,
    labelStrikethrough: false,
    labelColor: '#333333',
    labelOutlineColor: '#ffffff',
    labelFontSize: 10,
    labelOutlineThickness: 0,
    labelOffsetX: 0,
    labelOffsetY: 0,
  },
  individualLabelOverrides: {},
  drawnPaths: [],
  defaultPathStyles: {
    stroke: '#000000',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
    opacity: 1,
  },
})

const loadStylingSettings = (): StylingSettings => {
  if (typeof window === 'undefined') {
    return createDefaultStylingSettings()
  }

  try {
    const savedStylesRaw = window.localStorage.getItem('mapstudio_saved_styles')
    const savedStyles = savedStylesRaw ? (JSON.parse(savedStylesRaw) as SavedStyle[]) : defaultPresetStyles
    const savedSettingsRaw = window.localStorage.getItem('mapstudio_styling_settings')

    if (savedSettingsRaw) {
      const parsed = JSON.parse(savedSettingsRaw) as StylingSettings
      const defaults = createDefaultStylingSettings()
      return {
        ...defaults,
        ...parsed,
        base: {
          ...defaults.base,
          ...parsed.base,
          savedStyles,
        },
        symbol: {
          ...defaults.symbol,
          ...parsed.symbol,
          symbolText: parsed.symbol?.symbolText
            ? { ...defaults.symbol.symbolText!, ...parsed.symbol.symbolText }
            : defaults.symbol.symbolText,
        },
      }
    }

    const defaults = createDefaultStylingSettings()
    return {
      ...defaults,
      base: {
        ...defaults.base,
        savedStyles,
      },
    }
  } catch (error) {
    console.error('Failed to parse styling settings from localStorage', error)
    return createDefaultStylingSettings()
  }
}

const persistStylingSettings = (settings: StylingSettings) => {
  if (typeof window === 'undefined') return

  window.localStorage.setItem('mapstudio_styling_settings', JSON.stringify(settings))
  window.localStorage.setItem('mapstudio_saved_styles', JSON.stringify(settings.base.savedStyles))
}

interface StudioState {
  symbolData: DataState
  setSymbolData: (value: Updater<DataState>) => void
  choroplethData: DataState
  setChoroplethData: (value: Updater<DataState>) => void
  customData: DataState
  setCustomData: (value: Updater<DataState>) => void
  isGeocoding: boolean
  setIsGeocoding: (value: boolean) => void
  activeMapType: MapType
  setActiveMapType: (value: MapType) => void
  selectedGeography: GeographyKey
  setSelectedGeography: (value: GeographyKey) => void
  selectedProjection: ProjectionType
  setSelectedProjection: (value: ProjectionType) => void
  clipToCountry: boolean
  setClipToCountry: (value: boolean) => void
  renderTarget: RenderTarget
  setRenderTarget: (value: RenderTarget) => void
  boundaryConfig: BoundaryConfig
  setBoundaryConfig: (value: Updater<BoundaryConfig>) => void
  maplibreConfig: MapLibreConfig
  setMaplibreConfig: (value: Updater<MapLibreConfig>) => void
  columnTypes: ColumnType
  setColumnTypes: (value: Updater<ColumnType>) => void
  columnFormats: ColumnFormat
  setColumnFormats: (value: Updater<ColumnFormat>) => void
  dimensionSettings: DimensionSettings
  setDimensionSettings: (value: Updater<DimensionSettings>) => void
  stylingSettings: StylingSettings
  setStylingSettings: (value: Updater<StylingSettings>) => void
  layers: MapLayer[]
  selectedLayerId: string | null
  canvasType: CanvasType
  customBoundary: string
  printConfig: PrintConfig
  referenceLayers: ReferenceLayerConfig[]
  setSelectedLayerId: (id: string | null) => void
  setCanvasType: (value: CanvasType) => void
  setCustomBoundary: (value: string) => void
  setPrintConfig: (value: Updater<PrintConfig>) => void
  setReferenceLayers: (value: Updater<ReferenceLayerConfig[]>) => void
  toggleReferenceLayer: (id: string, enabled?: boolean) => void
  addLayer: (type: MapLayer['type'], data?: DataState, name?: string) => string
  removeLayer: (id: string) => void
  updateLayer: (id: string, patch: Partial<MapLayer>) => void
  setLayerData: (id: string, value: Updater<DataState>) => void
  setLayerDimensions: (id: string, value: Updater<MapLayer['dimensions']>) => void
  setLayerStyling: (id: string, value: Updater<MapLayer['styling']>) => void
  setLayerColumnTypes: (id: string, value: Updater<ColumnType>) => void
  setLayerColumnFormats: (id: string, value: Updater<ColumnFormat>) => void
  toggleLayerVisibility: (id: string) => void
  reorderLayer: (id: string, newOrder: number) => void
  hydrateFromProject: (project: Partial<LegacyProjectSlice & LayerProjectSlice>) => void
  resetDataStates: () => void
  resetAll: () => void
  // Undo/Redo
  history: StateSnapshot[]
  historyIndex: number
  pushHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  clearHistory: () => void
}

interface LegacyProjectSlice {
  symbolData: DataState
  choroplethData: DataState
  customData: DataState
  activeMapType: MapType
  columnTypes: ColumnType | Record<string, string>
  columnFormats: ColumnFormat | Record<string, string>
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
  renderTarget?: RenderTarget
}

interface LayerProjectSlice {
  layers?: MapLayer[]
  selectedLayerId?: string | null
  canvasType?: CanvasType
  customBoundary?: string
  printConfig?: PrintConfig
  referenceLayers?: ReferenceLayerConfig[]
}

const defaultPrintConfig = (): PrintConfig => ({
  projection: 'albersUsa',
  clipToCountry: false,
})

const withLayerSync = (
  state: StudioState,
  patch: Partial<StudioState> & { layers?: MapLayer[] },
): Partial<StudioState> => {
  const layers = patch.layers ?? state.layers
  const selectedLayerId = patch.selectedLayerId ?? state.selectedLayerId
  const customBoundary = patch.customBoundary ?? state.customBoundary
  const selectedGeography = patch.selectedGeography ?? state.selectedGeography

  const legacy = syncLegacyFromLayers(layers, selectedLayerId, customBoundary, selectedGeography)
  const stylingSettings = mergeStylingFromLayers(state.stylingSettings, layers)

  return {
    ...patch,
    layers,
    selectedLayerId,
    customBoundary,
    ...legacy,
    dimensionSettings: patch.dimensionSettings ?? legacy.dimensionSettings,
    stylingSettings,
  }
}

export const useStudioStore = create<StudioState>()((set) => ({
  symbolData: createEmptyDataState(),
  setSymbolData: (value) =>
    set((state) => ({
      symbolData: resolveValue(value, state.symbolData),
    })),

  choroplethData: createEmptyDataState(),
  setChoroplethData: (value) =>
    set((state) => ({
      choroplethData: resolveValue(value, state.choroplethData),
    })),

  customData: createEmptyDataState(),
  setCustomData: (value) =>
    set((state) => ({
      customData: resolveValue(value, state.customData),
    })),

  isGeocoding: false,
  setIsGeocoding: (value) => set({ isGeocoding: value }),

  activeMapType: 'symbol',
  setActiveMapType: (value) => set({ activeMapType: value }),

  selectedGeography: 'usa-states',
  setSelectedGeography: (value) =>
    set((state) => ({
      selectedGeography: value,
      boundaryConfig: {
        ...boundaryConfigFromGeographyKey(value),
        joinColumn: state.boundaryConfig.joinColumn || state.dimensionSettings.choropleth.stateColumn,
      },
    })),

  selectedProjection: 'albersUsa',
  setSelectedProjection: (value) => set({ selectedProjection: value }),

  clipToCountry: false,
  setClipToCountry: (value) => set({ clipToCountry: value }),

  renderTarget: 'svg',
  setRenderTarget: (value) => set({ renderTarget: value }),

  boundaryConfig: boundaryConfigFromGeographyKey('usa-states'),
  setBoundaryConfig: (value) =>
    set((state) => {
      const next = resolveValue(value, state.boundaryConfig)
      return {
        boundaryConfig: next,
        selectedGeography: syncGeographyFromBoundary(next, state.selectedGeography),
      }
    }),

  maplibreConfig: DEFAULT_MAPLIBRE_CONFIG,
  setMaplibreConfig: (value) =>
    set((state) => ({
      maplibreConfig: resolveValue(value, state.maplibreConfig),
    })),

  columnTypes: {},
  setColumnTypes: (value) =>
    set((state) => ({
      columnTypes: resolveValue(value, state.columnTypes),
    })),

  columnFormats: {},
  setColumnFormats: (value) =>
    set((state) => ({
      columnFormats: resolveValue(value, state.columnFormats),
    })),

  dimensionSettings: createDefaultDimensionSettings(),
  setDimensionSettings: (value) =>
    set((state) => {
      const next = resolveValue(value, state.dimensionSettings)
      const selected = getSelectedLayer(state.layers, state.selectedLayerId)
      const primaryPoints = getPrimaryPointLayer(state.layers)
      const primaryAreas = getPrimaryAreaLayer(state.layers)
      const symbolTargetId =
        selected?.type === 'points' ? selected.id : primaryPoints?.id
      const areaTargetId =
        selected?.type === 'areas' ? selected.id : primaryAreas?.id

      const layers = state.layers.map((layer) => {
        if (symbolTargetId && layer.id === symbolTargetId) {
          return { ...layer, dimensions: { ...next.symbol } }
        }
        if (areaTargetId && layer.id === areaTargetId) {
          return { ...layer, dimensions: { ...next.choropleth } }
        }
        return layer
      })

      const mergedSettings: DimensionSettings = {
        ...next,
        custom: { ...next.choropleth },
      }

      return withLayerSync(state, {
        layers,
        dimensionSettings: mergedSettings,
        boundaryConfig: {
          ...state.boundaryConfig,
          joinColumn: next.choropleth.stateColumn,
        },
      })
    }),

  stylingSettings: loadStylingSettings(),
  setStylingSettings: (value) =>
    set((state) => {
      const next = resolveValue(value, state.stylingSettings)
      persistStylingSettings(next)

      const layers = state.layers.map((layer) => {
        if (layer.type === 'points') {
          return { ...layer, styling: { ...next.symbol } }
        }
        if (layer.type === 'areas') {
          return { ...layer, styling: { ...next.choropleth } }
        }
        return layer
      })

      return withLayerSync(state, { stylingSettings: next, layers })
    }),

  layers: [],
  selectedLayerId: null,
  canvasType: 'print' as CanvasType,
  customBoundary: '',
  printConfig: defaultPrintConfig(),
  referenceLayers: DEFAULT_REFERENCE_LAYERS,

  setSelectedLayerId: (id) =>
    set((state) => {
      const selected = id ? state.layers.find((layer) => layer.id === id) ?? null : null
      let dimensionSettings = state.dimensionSettings

      if (selected?.type === 'points') {
        dimensionSettings = {
          ...state.dimensionSettings,
          symbol: { ...(selected.dimensions as DimensionSettings['symbol']) },
        }
      } else if (selected?.type === 'areas') {
        dimensionSettings = {
          ...state.dimensionSettings,
          choropleth: { ...(selected.dimensions as DimensionSettings['choropleth']) },
        }
      }

      return withLayerSync(state, { selectedLayerId: id, dimensionSettings })
    }),

  setCanvasType: (value) =>
    set((state) => {
      const renderTarget = canvasTypeToRenderTarget(value)
      return withLayerSync(state, {
        canvasType: value,
        renderTarget,
        customBoundary: value === 'custom' ? state.customBoundary : '',
      })
    }),

  setCustomBoundary: (value) =>
    set((state) =>
      withLayerSync(state, {
        customBoundary: value,
        canvasType: value.trim() ? 'custom' : state.canvasType === 'custom' ? 'print' : state.canvasType,
      }),
    ),

  setPrintConfig: (value) =>
    set((state) => {
      const next = resolveValue(value, state.printConfig)
      return {
        printConfig: next,
        selectedProjection: next.projection,
        clipToCountry: next.clipToCountry,
      }
    }),

  setReferenceLayers: (value) =>
    set((state) => ({
      referenceLayers: resolveValue(value, state.referenceLayers),
    })),

  toggleReferenceLayer: (id, enabled) =>
    set((state) => ({
      referenceLayers: state.referenceLayers.map((layer) =>
        layer.id === id ? { ...layer, enabled: enabled ?? !layer.enabled } : layer,
      ),
    })),

  addLayer: (type, data, name) => {
    const id = createLayerId()
    set((state) => {
      const order = nextLayerOrder(state.layers)
      const layer = data
        ? createLayerFromData(type, data, order, name)
        : createEmptyLayer(type, order, name)
      const layers = [...state.layers, { ...layer, id }]
      const selectedLayerId = id
      return withLayerSync(state, { layers, selectedLayerId })
    })
    return id
  },

  removeLayer: (id) =>
    set((state) => {
      const layers = state.layers.filter((layer) => layer.id !== id)
      const selectedLayerId =
        state.selectedLayerId === id ? (layers[0]?.id ?? null) : state.selectedLayerId
      return withLayerSync(state, { layers, selectedLayerId })
    }),

  updateLayer: (id, patch) =>
    set((state) => {
      const layers = state.layers.map((layer) => (layer.id === id ? { ...layer, ...patch } : layer))
      return withLayerSync(state, { layers })
    }),

  setLayerData: (id, value) =>
    set((state) => {
      const layers = state.layers.map((layer) =>
        layer.id === id ? { ...layer, data: resolveValue(value, layer.data) } : layer,
      )
      return withLayerSync(state, { layers })
    }),

  setLayerDimensions: (id, value) =>
    set((state) => {
      const layers = state.layers.map((layer) =>
        layer.id === id
          ? { ...layer, dimensions: resolveValue(value, layer.dimensions) }
          : layer,
      )
      return withLayerSync(state, { layers })
    }),

  setLayerStyling: (id, value) =>
    set((state) => {
      const layers = state.layers.map((layer) =>
        layer.id === id ? { ...layer, styling: resolveValue(value, layer.styling) } : layer,
      )
      const stylingSettings = mergeStylingFromLayers(state.stylingSettings, layers)
      persistStylingSettings(stylingSettings)
      return withLayerSync(state, { layers, stylingSettings })
    }),

  setLayerColumnTypes: (id, value) =>
    set((state) => {
      const layers = state.layers.map((layer) =>
        layer.id === id
          ? { ...layer, columnTypes: resolveValue(value, layer.columnTypes) }
          : layer,
      )
      return withLayerSync(state, { layers })
    }),

  setLayerColumnFormats: (id, value) =>
    set((state) => {
      const layers = state.layers.map((layer) =>
        layer.id === id
          ? { ...layer, columnFormats: resolveValue(value, layer.columnFormats) }
          : layer,
      )
      return withLayerSync(state, { layers })
    }),

  toggleLayerVisibility: (id) =>
    set((state) => {
      const layers = state.layers.map((layer) =>
        layer.id === id ? { ...layer, visible: !layer.visible } : layer,
      )
      return withLayerSync(state, { layers })
    }),

  reorderLayer: (id, newOrder) =>
    set((state) => {
      const target = state.layers.find((layer) => layer.id === id)
      if (!target) return state
      const others = state.layers.filter((layer) => layer.id !== id)
      const layers = [...others, { ...target, order: newOrder }].sort((a, b) => a.order - b.order)
      return withLayerSync(state, { layers })
    }),

  hydrateFromProject: (project) =>
    set((state) => {
      const legacySlice: LegacyProjectSlice = {
        symbolData: project.symbolData ?? createEmptyDataState(),
        choroplethData: project.choroplethData ?? createEmptyDataState(),
        customData: project.customData ?? createEmptyDataState(),
        activeMapType: project.activeMapType ?? 'symbol',
        columnTypes: (project.columnTypes ?? {}) as ColumnType,
        columnFormats: (project.columnFormats ?? {}) as ColumnFormat,
        dimensionSettings: project.dimensionSettings ?? createDefaultDimensionSettings(),
        stylingSettings: project.stylingSettings ?? createDefaultStylingSettings(),
        renderTarget: project.renderTarget,
      }

      const layers =
        project.layers && project.layers.length > 0
          ? JSON.parse(JSON.stringify(project.layers))
          : ensureLayersFromLegacy({
              ...legacySlice,
              columnTypes: legacySlice.columnTypes as ColumnType,
              columnFormats: legacySlice.columnFormats as ColumnFormat,
            })

      const customBoundary =
        project.customBoundary ??
        (legacySlice.customData.customMapData.trim() ? legacySlice.customData.customMapData : '')

      const canvasType =
        project.canvasType ??
        canvasTypeFromLegacy(legacySlice.customData, legacySlice.renderTarget)

      const printConfig = project.printConfig ?? {
        projection: (project as { selectedProjection?: ProjectionType }).selectedProjection ?? 'albersUsa',
        clipToCountry: (project as { clipToCountry?: boolean }).clipToCountry ?? false,
      }

      const selectedLayerId = project.selectedLayerId ?? layers[0]?.id ?? null
      const referenceLayers = project.referenceLayers ?? DEFAULT_REFERENCE_LAYERS
      const renderTarget = project.renderTarget ?? canvasTypeToRenderTarget(canvasType)
      const stylingSettings = project.stylingSettings
        ? { ...createDefaultStylingSettings(), ...project.stylingSettings }
        : mergeStylingFromLayers(createDefaultStylingSettings(), layers)

      return withLayerSync(state, {
        layers,
        selectedLayerId,
        canvasType,
        customBoundary,
        printConfig,
        referenceLayers,
        renderTarget,
        stylingSettings,
        selectedProjection: printConfig.projection,
        clipToCountry: printConfig.clipToCountry,
        boundaryConfig: (project as { boundaryConfig?: BoundaryConfig }).boundaryConfig ??
          boundaryConfigFromGeographyKey(
            legacySlice.dimensionSettings.selectedGeography ?? 'usa-states',
          ),
        maplibreConfig: (project as { maplibreConfig?: MapLibreConfig }).maplibreConfig ??
          DEFAULT_MAPLIBRE_CONFIG,
      })
    }),

  resetDataStates: () =>
    set((state) =>
      withLayerSync(state, {
        layers: [],
        selectedLayerId: null,
      }),
    ),

  resetAll: () => {
    // Keep saved styles from localStorage but reset active styling
    const currentStyling = loadStylingSettings()
    const defaultStyling = createDefaultStylingSettings()
    
    set({
      symbolData: createEmptyDataState(),
      choroplethData: createEmptyDataState(),
      customData: createEmptyDataState(),
      isGeocoding: false,
      activeMapType: 'symbol',
      selectedGeography: 'usa-states',
      selectedProjection: 'albersUsa',
      clipToCountry: false,
      renderTarget: 'svg',
      boundaryConfig: boundaryConfigFromGeographyKey('usa-states'),
      maplibreConfig: DEFAULT_MAPLIBRE_CONFIG,
      columnTypes: {},
      columnFormats: {},
      dimensionSettings: createDefaultDimensionSettings(),
      stylingSettings: {
        ...defaultStyling,
        base: {
          ...defaultStyling.base,
          savedStyles: currentStyling.base.savedStyles, // Keep user's saved style presets
        },
      },
      layers: [],
      selectedLayerId: null,
      canvasType: 'print',
      customBoundary: '',
      printConfig: defaultPrintConfig(),
      referenceLayers: DEFAULT_REFERENCE_LAYERS,
      history: [],
      historyIndex: -1,
    })
  },
  // Undo/Redo implementation
  history: [] as StateSnapshot[],
  historyIndex: -1,
  
  pushHistory: () =>
    set((state) => {
      const snapshot = createStateSnapshot(state)
      const newHistory = [...state.history]
      const newIndex = state.historyIndex + 1
      
      // Remove any history after current index (when undoing then making new changes)
      if (newIndex < newHistory.length) {
        newHistory.splice(newIndex)
      }
      
      // Add new snapshot
      newHistory.push(snapshot)
      
      // Limit history size
      if (newHistory.length > MAX_HISTORY_SIZE) {
        newHistory.shift()
        return {
          history: newHistory,
          historyIndex: newHistory.length - 1,
        }
      }
      
      return {
        history: newHistory,
        historyIndex: newIndex,
      }
    }),
  
  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return state
      
      const newIndex = state.historyIndex - 1
      const snapshot = state.history[newIndex]
      
      return {
        ...applyStateSnapshot(snapshot),
        historyIndex: newIndex,
      }
    }),
  
  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return state
      
      const newIndex = state.historyIndex + 1
      const snapshot = state.history[newIndex]
      
      return {
        ...applyStateSnapshot(snapshot),
        historyIndex: newIndex,
      }
    }),
  
  canUndo: () => {
    const state = useStudioStore.getState() as StudioState
    return state.historyIndex > 0
  },
  
  canRedo: () => {
    const state = useStudioStore.getState() as StudioState
    return state.historyIndex < state.history.length - 1
  },
  
  clearHistory: () =>
    set({
      history: [],
      historyIndex: -1,
    }),
}))

export const emptyDataState = createEmptyDataState
export const defaultChoroplethSettings = createDefaultChoroplethSettings
export const defaultDimensionSettings = createDefaultDimensionSettings
export const defaultStylingSettings = createDefaultStylingSettings
export const presetStylePresets = defaultPresetStyles

