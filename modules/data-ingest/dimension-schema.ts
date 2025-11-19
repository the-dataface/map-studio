import type { ColumnType, DimensionSettings, MapType } from '@/app/(studio)/types'

const isCoordinate = (value: string | number | boolean | undefined) =>
  typeof value === 'string' && value.trim().length > 0

export const inferColumnTypesFromData = (rows: Record<string, unknown>[]): ColumnType => {
  const inferred: ColumnType = {}

  rows.forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      if (inferred[key]) {
        return
      }

      if (typeof value === 'number') {
        inferred[key] = 'number'
        return
      }

      if (value instanceof Date) {
        inferred[key] = 'date'
        return
      }

      if (typeof value === 'string') {
        const lower = value.toLowerCase()
        if (lower.includes('province') || lower.includes('state')) {
          inferred[key] = 'state'
        } else if (lower.includes('country') || lower.includes('nation')) {
          inferred[key] = 'country'
        } else if (!Number.isNaN(Number(value))) {
          inferred[key] = 'number'
        } else {
          inferred[key] = 'text'
        }
        return
      }

      inferred[key] = 'text'
    })
  })

  return inferred
}

export const mergeInferredTypes = (existing: ColumnType, inferred: ColumnType): ColumnType => ({
  ...inferred,
  ...existing,
})

export const resetDimensionForMapType = (settings: DimensionSettings, mapType: MapType): DimensionSettings => {
  switch (mapType) {
    case 'symbol':
      return {
        ...settings,
        symbol: { ...settings.symbol, colorBy: '', sizeBy: '' },
      }
    case 'choropleth':
      return {
        ...settings,
        choropleth: { ...settings.choropleth, colorBy: '' },
      }
    case 'custom':
    default:
      return {
        ...settings,
        custom: { ...settings.custom, colorBy: '' },
      }
  }
}
