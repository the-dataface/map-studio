import { describe, expect, it } from 'vitest'

import { mergeInferredTypes, resetDimensionForMapType } from '../dimension-schema'
import type { DimensionSettings } from '@/app/(studio)/types'

describe('resetDimensionForMapType', () => {
  const baseSettings: DimensionSettings = {
    symbol: {
      latitude: 'lat',
      longitude: 'lng',
      sizeBy: 'population',
      sizeMin: 5,
      sizeMax: 20,
      sizeMinValue: 0,
      sizeMaxValue: 100,
      colorBy: 'density',
      colorScale: 'linear',
      colorPalette: 'Blues',
      colorMinValue: 0,
      colorMidValue: 50,
      colorMaxValue: 100,
      colorMinColor: '#fff',
      colorMidColor: '#ccc',
      colorMaxColor: '#000',
      categoricalColors: [],
      labelTemplate: ''
    },
    choropleth: {
      stateColumn: 'state',
      colorBy: 'value',
      colorScale: 'linear',
      colorPalette: 'Reds',
      colorMinValue: 0,
      colorMidValue: 50,
      colorMaxValue: 100,
      colorMinColor: '#fff5f0',
      colorMidColor: '#fb6a4a',
      colorMaxColor: '#cb181d',
      categoricalColors: [],
      labelTemplate: ''
    },
    custom: {
      stateColumn: 'region',
      colorBy: 'score',
      colorScale: 'categorical',
      colorPalette: 'Category10',
      colorMinValue: 0,
      colorMidValue: 0,
      colorMaxValue: 0,
      colorMinColor: '#000',
      colorMidColor: '#000',
      colorMaxColor: '#000',
      categoricalColors: [],
      labelTemplate: ''
    },
    selectedGeography: 'usa-states'
  }

  it('clears colorBy and sizeBy for symbol maps', () => {
    const next = resetDimensionForMapType(baseSettings, 'symbol')
    expect(next.symbol.colorBy).toBe('')
    expect(next.symbol.sizeBy).toBe('')
  })

  it('clears colorBy for choropleth maps', () => {
    const next = resetDimensionForMapType(baseSettings, 'choropleth')
    expect(next.choropleth.colorBy).toBe('')
  })

  it('clears colorBy for custom maps', () => {
    const next = resetDimensionForMapType(baseSettings, 'custom')
    expect(next.custom.colorBy).toBe('')
  })
})

describe('mergeInferredTypes', () => {
  it('prefers existing entries', () => {
    expect(
      mergeInferredTypes(
        { population: 'number', state: 'state' },
        { population: 'text', region: 'text' }
      )
    ).toEqual({ population: 'number', state: 'state', region: 'text' })
  })
})
