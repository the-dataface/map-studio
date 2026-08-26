import type { ColumnType, DimensionSettings, MapType } from '@/app/(studio)/types'

/**
 * Infer column types from column names first, then fall back to cell values.
 * Column names are more reliable than inspecting cell content.
 */
export const inferColumnTypesFromData = (
  rows: Record<string, unknown>[],
  columns?: string[],
): ColumnType => {
  const inferred: ColumnType = {}
  const columnNames =
    columns ?? (rows.length > 0 ? Object.keys(rows[0]) : [])

  // Pass 1: column name heuristics
  for (const key of columnNames) {
    const colName = key.trim().toLowerCase()
    if (colName === 'country' || colName === 'nation') {
      inferred[key] = 'country'
    } else if (colName === 'province' || colName === 'territory') {
      inferred[key] = 'province'
    } else if (colName === 'county' || colName === 'fips') {
      inferred[key] = 'county'
    } else if (colName === 'state') {
      inferred[key] = 'state'
    } else if (colName === 'latitude' || colName === 'lat') {
      inferred[key] = 'coordinate'
    } else if (colName === 'longitude' || colName === 'lon' || colName === 'lng') {
      inferred[key] = 'coordinate'
    }
  }

  // Pass 2: cell value heuristics for unset columns
  rows.forEach((row) => {
    Object.entries(row).forEach(([key, value]) => {
      if (inferred[key]) return

      if (typeof value === 'number') {
        inferred[key] = 'number'
        return
      }

      if (value instanceof Date) {
        inferred[key] = 'date'
        return
      }

      if (typeof value === 'string') {
        if (!Number.isNaN(Number(value)) && value.trim() !== '') {
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
