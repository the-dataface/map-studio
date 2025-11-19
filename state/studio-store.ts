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
    labelFontFamily: 'Geist Sans',
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
    labelFontFamily: 'Geist Sans',
    labelBold: false,
    labelItalic: false,
    labelUnderline: false,
    labelStrikethrough: false,
    labelColor: '#333333',
    labelOutlineColor: '#ffffff',
    labelFontSize: 10,
    labelOutlineThickness: 0,
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
    })
  },
}))

export const emptyDataState = createEmptyDataState
export const defaultChoroplethSettings = createDefaultChoroplethSettings
export const defaultDimensionSettings = createDefaultDimensionSettings
export const defaultStylingSettings = createDefaultStylingSettings
export const presetStylePresets = defaultPresetStyles

