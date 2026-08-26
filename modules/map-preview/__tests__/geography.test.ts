import { describe, expect, it } from 'vitest'

import { normalizeGeoIdentifier } from '../geography'

describe('normalizeGeoIdentifier — DC', () => {
  const cases = [
    ['DC', 'DC'],
    ['dc', 'DC'],
    ['District of Columbia', 'DC'],
    ['district of columbia', 'DC'],
    ['Washington DC', 'DC'],
    ['Washington, D.C.', 'DC'],
    ['Washington, DC', 'DC'],
    ['D.C.', 'DC'],
  ] as const

  it.each(cases)('maps %s → %s', (input, expected) => {
    expect(normalizeGeoIdentifier(input, 'usa-states')).toBe(expected)
  })
})
