import { describe, expect, it } from 'vitest'

import { joinChoroplethData } from '../join-data'
import type { BoundaryFeatureCollection } from '../types'
import type { StylingSettings } from '../../../app/(studio)/types'

const sampleFeatures: BoundaryFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { __joinKey: 'CA', __label: 'California', name: 'California' },
      geometry: { type: 'Point', coordinates: [-119, 37] },
    },
    {
      type: 'Feature',
      properties: { __joinKey: 'TX', __label: 'Texas', name: 'Texas' },
      geometry: { type: 'Point', coordinates: [-99, 31] },
    },
    {
      type: 'Feature',
      properties: { __joinKey: 'NY', __label: 'New York', name: 'New York' },
      geometry: { type: 'Point', coordinates: [-75, 43] },
    },
  ],
}

describe('joinChoroplethData', () => {
  it('joins choropleth values and reports matches', () => {
    const stylingSettings = {
      base: { defaultStateFillColor: '#cccccc' },
    } as StylingSettings
    const choroplethSettings = {
      stateColumn: 'state',
      colorBy: 'value',
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
    }

    const result = joinChoroplethData({
      features: sampleFeatures,
      choroplethData: [
        { state: 'CA', value: 10 },
        { state: 'Texas', value: 20 },
        { state: 'ZZ', value: 99 },
      ],
      stateColumn: 'state',
      colorBy: 'value',
      colorScale: 'linear',
      geographyKey: 'usa-states',
      choroplethSettings,
      stylingSettings,
      defaultFillColor: '#cccccc',
    })

    expect(result.matchReport.matched).toBe(2)
    expect(result.matchReport.totalDataRows).toBe(3)
    expect(result.matchReport.unmatchedDataValues).toContain('ZZ')
    expect(result.features.features.find((f) => f.properties.__joinKey === 'CA')?.properties.__color).not.toBe('#cccccc')
    expect(result.features.features.find((f) => f.properties.__joinKey === 'NY')?.properties.__color).toBe('#cccccc')
  })
})
