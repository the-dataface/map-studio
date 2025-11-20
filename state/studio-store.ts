'use client'

import { create } from 'zustand'

import type {
  CategoricalColor,
  ColumnFormat,
  ColumnType,
  DataState,
  DimensionSettings,
  GeographyKey,
  MapType,
  ProjectionType,
  SavedStyle,
  StylingSettings,
  ColorScaleType,
} from '@/app/(studio)/types'

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
  columnTypes: ColumnType
  columnFormats: ColumnFormat
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
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
  columnTypes: ColumnType
  columnFormats: ColumnFormat
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
}): StateSnapshot => ({
  symbolData: JSON.parse(JSON.stringify(state.symbolData)),
  choroplethData: JSON.parse(JSON.stringify(state.choroplethData)),
  customData: JSON.parse(JSON.stringify(state.customData)),
  isGeocoding: state.isGeocoding,
  activeMapType: state.activeMapType,
  selectedGeography: state.selectedGeography,
  selectedProjection: state.selectedProjection,
  clipToCountry: state.clipToCountry,
  columnTypes: JSON.parse(JSON.stringify(state.columnTypes)),
  columnFormats: JSON.parse(JSON.stringify(state.columnFormats)),
  dimensionSettings: JSON.parse(JSON.stringify(state.dimensionSettings)),
  stylingSettings: JSON.parse(JSON.stringify(state.stylingSettings)),
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
  columnTypes: snapshot.columnTypes,
  columnFormats: snapshot.columnFormats,
  dimensionSettings: snapshot.dimensionSettings,
  stylingSettings: snapshot.stylingSettings,
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
    labelAlignment: 'auto',
    customSvgPath: '',
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
      return {
        ...parsed,
        base: {
          ...parsed.base,
          savedStyles,
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
  columnTypes: ColumnType
  setColumnTypes: (value: Updater<ColumnType>) => void
  columnFormats: ColumnFormat
  setColumnFormats: (value: Updater<ColumnFormat>) => void
  dimensionSettings: DimensionSettings
  setDimensionSettings: (value: Updater<DimensionSettings>) => void
  stylingSettings: StylingSettings
  setStylingSettings: (value: Updater<StylingSettings>) => void
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

export const useStudioStore = create<StudioState>((set) => ({
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
  setSelectedGeography: (value) => set({ selectedGeography: value }),

  selectedProjection: 'albersUsa',
  setSelectedProjection: (value) => set({ selectedProjection: value }),

  clipToCountry: false,
  setClipToCountry: (value) => set({ clipToCountry: value }),

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
    set((state) => ({
      dimensionSettings: resolveValue(value, state.dimensionSettings),
    })),

  stylingSettings: loadStylingSettings(),
  setStylingSettings: (value) =>
    set((state) => {
      const next = resolveValue(value, state.stylingSettings)
      persistStylingSettings(next)
      return { stylingSettings: next }
    }),

  resetDataStates: () =>
    set({
      symbolData: createEmptyDataState(),
      choroplethData: createEmptyDataState(),
      customData: createEmptyDataState(),
    }),

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
    const state = useStudioStore.getState()
    return state.historyIndex > 0
  },
  
  canRedo: () => {
    const state = useStudioStore.getState()
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

