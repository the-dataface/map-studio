import { describe, expect, it } from 'vitest'

import { toGeoJsonSymbols } from '../to-geojson-symbols'

const baseDimensionSettings = {
  symbol: {
    latitude: 'lat',
    longitude: 'lng',
    sizeBy: '',
    sizeMin: 5,
    sizeMax: 20,
    sizeMinValue: 0,
    sizeMaxValue: 100,
    colorBy: 'category',
    colorScale: 'categorical' as const,
    colorPalette: 'Blues',
    colorMinValue: 0,
    colorMidValue: 50,
    colorMaxValue: 100,
    colorMinColor: '#eff3ff',
    colorMidColor: '#6baed6',
    colorMaxColor: '#08519c',
    categoricalColors: [{ value: 'A', color: '#ff0000' }, { value: 'B', color: '#0000ff' }],
    labelTemplate: '',
    symbolTextBy: '',
  },
  choropleth: {
    stateColumn: '',
    colorBy: '',
    colorScale: 'linear' as const,
    colorPalette: 'Blues',
    colorMinValue: 0,
    colorMidValue: 50,
    colorMaxValue: 100,
    colorMinColor: '#eff3ff',
    colorMidColor: '#6baed6',
    colorMaxColor: '#08519c',
    categoricalColors: [],
    labelTemplate: '',
  },
  custom: {
    stateColumn: '',
    colorBy: '',
    colorScale: 'linear' as const,
    colorPalette: 'Blues',
    colorMinValue: 0,
    colorMidValue: 50,
    colorMaxValue: 100,
    colorMinColor: '#eff3ff',
    colorMidColor: '#6baed6',
    colorMaxColor: '#08519c',
    categoricalColors: [],
    labelTemplate: '',
  },
  selectedGeography: 'usa-states' as const,
}

const baseStylingSettings = {
  symbol: {
    symbolFillColor: '#1f77b4',
    symbolStrokeColor: '#ffffff',
    symbolSize: 8,
    symbolStrokeWidth: 1,
    symbolFillTransparency: 80,
    symbolStrokeTransparency: 100,
  },
} as const

describe('toGeoJsonSymbols', () => {
  it('creates point features with mapped colors', () => {
    const result = toGeoJsonSymbols({
      symbolData: [
        { lat: 37.7749, lng: -122.4194, category: 'A' },
        { lat: 40.7128, lng: -74.006, category: 'B' },
        { lat: 'invalid', lng: -74.006, category: 'A' },
      ],
      dimensionSettings: baseDimensionSettings,
      stylingSettings: baseStylingSettings as never,
    })

    expect(result.plottedCount).toBe(2)
    expect(result.skippedCount).toBe(1)
    expect(result.features.features).toHaveLength(2)
    expect(result.features.features[0].geometry.coordinates).toEqual([-122.4194, 37.7749])
    expect(result.features.features[0].properties.__color).toBe('#ff0000')
    expect(result.features.features[1].properties.__color).toBe('#0000ff')
  })

  it('embeds label and symbol text when dimension mapping is configured', () => {
    const result = toGeoJsonSymbols({
      symbolData: [
        { lat: 37.7749, lng: -122.4194, name: 'SF', category: 'A' },
        { lat: 40.7128, lng: -74.006, name: 'NYC', category: 'B' },
      ],
      dimensionSettings: {
        ...baseDimensionSettings,
        symbol: {
          ...baseDimensionSettings.symbol,
          labelTemplate: '{name}',
          symbolTextBy: 'category',
        },
      },
      stylingSettings: {
        ...baseStylingSettings,
        symbol: {
          ...baseStylingSettings.symbol,
          labelFontSize: 10,
          labelBold: false,
          labelItalic: false,
          labelAlignment: 'auto',
          labelOffsetX: 0,
          labelOffsetY: 0,
          labelColor: '#111827',
          labelOutlineColor: '#ffffff',
          labelOutlineThickness: 1,
        },
      } as never,
      columnTypes: {},
      columnFormats: {},
      selectedGeography: 'usa-states',
    })

    expect(result.features.features[0].properties.__labelText).toBe('SF')
    expect(result.features.features[1].properties.__labelText).toBe('NYC')
    expect(result.features.features[0].properties.__symbolText).toBe('A')
    expect(result.features.features[1].properties.__symbolText).toBe('B')
  })
})
