import { describe, expect, it } from 'vitest'

import {
  formatLegendValue,
  formatState,
  getDefaultFormat,
  renderLabelPreview,
} from '../formatting'

import type { ColumnFormat, ColumnType, DataRow } from '@/app/(studio)/types'

describe('formatState', () => {
  it('converts US full names to abbreviations when requested', () => {
    expect(formatState('California', 'abbreviated', 'usa-states')).toBe('CA')
  })

  it('converts Canadian SGC codes to province names', () => {
    expect(formatState('24', 'full', 'canada-provinces')).toBe('Quebec')
  })
})

describe('formatLegendValue', () => {
  const columnTypes: ColumnType = {
    population: 'number',
    updated: 'date',
    state: 'state',
  }

  const columnFormats: ColumnFormat = {
    population: 'comma',
    updated: 'mm/dd/yyyy',
    state: 'full',
  }

  it('formats numbers using column formats', () => {
    expect(formatLegendValue('1200', 'population', columnTypes, columnFormats, 'usa-states')).toBe('1,200')
  })

  it('formats dates using column formats', () => {
    expect(formatLegendValue('2024-02-01', 'updated', columnTypes, columnFormats, 'usa-states')).toBe('2/1/2024')
  })

  it('formats states using geography context', () => {
    expect(formatLegendValue('CA', 'state', columnTypes, columnFormats, 'usa-states')).toBe('California')
  })
})

describe('renderLabelPreview', () => {
  const row: DataRow = {
    population: '2500',
    state: 'Texas',
  }

  const columnTypes: ColumnType = {
    population: 'number',
    state: 'state',
  }

  const columnFormats: ColumnFormat = {
    population: 'compact',
    state: 'abbreviated',
  }

  it('renders HTML snippet with formatted placeholders', () => {
    const result = renderLabelPreview('Pop: {population}\nState: {state}', row, columnTypes, columnFormats, 'usa-states')
    expect(result).toBe('Pop: 2.5K<br/>State: TX')
  })

  it('falls back when template or row missing', () => {
    expect(renderLabelPreview('', undefined, columnTypes, columnFormats, 'usa-states')).toBe(
      'No data or template to preview.',
    )
  })
})

it('provides sensible defaults for unknown types', () => {
  expect(getDefaultFormat('text')).toBe('raw')
})
