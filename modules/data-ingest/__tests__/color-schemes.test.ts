import { describe, expect, it } from 'vitest'

import { applyColorSchemePreset, D3_COLOR_SCHEMES } from '../color-schemes'

import type { DimensionSettings } from '@/app/(studio)/types'

const createSettings = (): DimensionSettings => ({
  symbol: {
    latitude: '',
    longitude: '',
    sizeBy: '',
    sizeMin: 5,
    sizeMax: 20,
    sizeMinValue: 0,
    sizeMaxValue: 100,
    colorBy: '',
    colorScale: 'linear',
    colorPalette: '',
    colorMinValue: 0,
    colorMidValue: 50,
    colorMaxValue: 100,
    colorMinColor: '',
    colorMidColor: '',
    colorMaxColor: '',
    categoricalColors: [],
    labelTemplate: '',
  },
  choropleth: {
    stateColumn: '',
    colorBy: '',
    colorScale: 'linear',
    colorPalette: '',
    colorMinValue: 0,
    colorMidValue: 50,
    colorMaxValue: 100,
    colorMinColor: '',
    colorMidColor: '',
    colorMaxColor: '',
    categoricalColors: [],
    labelTemplate: '',
  },
  custom: {
    stateColumn: '',
    colorBy: '',
    colorScale: 'linear',
    colorPalette: '',
    colorMinValue: 0,
    colorMidValue: 50,
    colorMaxValue: 100,
    colorMinColor: '',
    colorMidColor: '',
    colorMaxColor: '',
    categoricalColors: [],
    labelTemplate: '',
  },
  selectedGeography: 'usa-states',
})

describe('applyColorSchemePreset', () => {
  it('applies linear palette endpoints and midpoint', () => {
    const settings = createSettings()
    const result = applyColorSchemePreset({
      schemeName: 'Blues',
      section: 'symbol',
      colorScale: 'linear',
      colorByColumn: 'population',
      currentSettings: settings,
      getUniqueValues: () => [],
      customSchemes: [],
      showMidpoint: true,
    })

    expect(result.symbol.colorMinColor).toBe(D3_COLOR_SCHEMES.Blues[0])
    expect(result.symbol.colorMaxColor).toBe(D3_COLOR_SCHEMES.Blues[D3_COLOR_SCHEMES.Blues.length - 1])
    expect(result.symbol.colorPalette).toBe('Blues')
  })

  it('maps categorical palette to unique values', () => {
    const settings = createSettings()
    const result = applyColorSchemePreset({
      schemeName: 'Category10',
      section: 'choropleth',
      colorScale: 'categorical',
      colorByColumn: 'region',
      currentSettings: settings,
      getUniqueValues: () => ['North', 'South', 'East'],
      customSchemes: [],
      showMidpoint: false,
    })

    expect(result.choropleth.categoricalColors).toHaveLength(3)
    expect(result.choropleth.categoricalColors[0].color).toBe(D3_COLOR_SCHEMES.Category10[0])
    expect(result.choropleth.colorPalette).toBe('Category10')
  })
})
