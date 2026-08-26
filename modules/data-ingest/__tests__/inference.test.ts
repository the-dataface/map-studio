import { describe, expect, it } from 'vitest'

import { inferGeographyAndProjection } from '../inference'

describe('inferGeographyAndProjection', () => {
  it('infers US states when state column has abbreviations', () => {
    const result = inferGeographyAndProjection({
      columns: ['State', 'Value'],
      sampleRows: [
        { State: 'CA', Value: 100 },
        { State: 'TX', Value: 200 },
        { State: 'NY', Value: 150 },
      ],
    })
    expect(result.geography).toBe('usa-states')
    expect(result.projection).toBe('albersUsa')
    expect(result.confidence).toBe('high')
  })

  it('does not infer world when Country column is all USA', () => {
    const result = inferGeographyAndProjection({
      columns: ['State', 'Country', 'Value'],
      sampleRows: [
        { State: 'CA', Country: 'United States', Value: 100 },
        { State: 'TX', Country: 'USA', Value: 200 },
        { State: 'NY', Country: 'US', Value: 150 },
      ],
    })
    expect(result.geography).toBe('usa-states')
  })

  it('infers world when country column has multiple nations', () => {
    const result = inferGeographyAndProjection({
      columns: ['Country', 'Value'],
      sampleRows: [
        { Country: 'Canada', Value: 100 },
        { Country: 'Brazil', Value: 200 },
        { Country: 'India', Value: 150 },
      ],
    })
    expect(result.geography).toBe('world')
    expect(result.projection).toBe('equalEarth')
  })

  it('infers canada-provinces from province values', () => {
    const result = inferGeographyAndProjection({
      columns: ['Province', 'Value'],
      sampleRows: [
        { Province: 'Ontario', Value: 100 },
        { Province: 'Quebec', Value: 200 },
        { Province: 'Alberta', Value: 150 },
      ],
    })
    expect(result.geography).toBe('canada-provinces')
  })

  it('infers usa-counties from FIPS codes', () => {
    const result = inferGeographyAndProjection({
      columns: ['FIPS', 'Value'],
      sampleRows: [
        { FIPS: '06037', Value: 100 },
        { FIPS: '17031', Value: 200 },
        { FIPS: '36061', Value: 150 },
      ],
    })
    expect(result.geography).toBe('usa-counties')
  })
})
