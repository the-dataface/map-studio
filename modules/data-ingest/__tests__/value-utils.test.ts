import { describe, expect, it } from 'vitest'

import {
  getNumericBounds,
  getUniqueStringValues,
  formatNumber,
  formatDate,
} from '../value-utils'

const rows = [
  { population: '1,200', name: 'Alpha', updated: '2024-01-01' },
  { population: '850', name: 'Beta', updated: '2024-02-15' },
  { population: '1.5K', name: 'Alpha', updated: '2024-02-15' },
]

describe('getNumericBounds', () => {
  it('computes min/max from numeric-like strings', () => {
    const { min, max } = getNumericBounds(rows, 'population')
    expect(min).toBe(850)
    expect(max).toBe(1500)
  })
})

describe('getUniqueStringValues', () => {
  it('returns sorted unique values', () => {
    expect(getUniqueStringValues(rows, 'name')).toEqual(['Alpha', 'Beta'])
  })
})

describe('formatNumber', () => {
  it('formats currency output', () => {
    expect(formatNumber('1234.5', 'currency')).toBe('$1,234.50')
  })
})

describe('formatDate', () => {
  it('formats ISO strings respecting format preset', () => {
    expect(formatDate('2024-06-01', 'mm/dd/yyyy')).toBe('6/1/2024')
  })
})
