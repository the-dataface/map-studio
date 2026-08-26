import type { DataRow, GeographyKey, ProjectionType } from '@/app/(studio)/types'

interface InferenceInput {
  columns: string[]
  sampleRows: DataRow[]
}

interface InferenceResult {
  geography: GeographyKey
  projection: ProjectionType
  confidence: 'high' | 'medium' | 'low'
  reason: string
}

const US_STATE_ABBRS = new Set([
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'DC', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN',
  'IA', 'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH',
  'NJ', 'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT',
  'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
])

const US_STATE_NAMES = new Set([
  'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut',
  'delaware', 'district of columbia', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois',
  'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts',
  'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada',
  'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota',
  'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina',
  'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington',
  'west virginia', 'wisconsin', 'wyoming',
])

const CANADA_PROVINCE_NAMES = new Set([
  'alberta', 'british columbia', 'manitoba', 'new brunswick',
  'newfoundland and labrador', 'northwest territories', 'nova scotia', 'nunavut',
  'ontario', 'prince edward island', 'quebec', 'saskatchewan', 'yukon',
])

const WORLD_COUNTRY_NAMES = new Set([
  'canada', 'mexico', 'brazil', 'china', 'india', 'france', 'germany', 'japan',
  'united kingdom', 'australia', 'russia', 'south africa', 'nigeria', 'egypt',
])

const US_COUNTRY_VALUES = new Set([
  'usa', 'us', 'u.s.', 'u.s.a.', 'united states', 'united states of america', 'america',
])

const normalizeCell = (value: unknown): string =>
  String(value ?? '').trim().toLowerCase()

const findColumn = (columns: string[], names: string[]): string | undefined =>
  columns.find((col) => names.includes(col.trim().toLowerCase()))

const findColumnContaining = (columns: string[], substrings: string[]): string | undefined =>
  columns.find((col) => {
    const lower = col.toLowerCase()
    return substrings.some((sub) => lower.includes(sub))
  })

const scoreColumnValues = (
  rows: DataRow[],
  column: string,
  matcher: (value: string) => boolean,
  limit = 50,
): { matches: number; total: number } => {
  let matches = 0
  let total = 0
  for (const row of rows.slice(0, limit)) {
    const value = normalizeCell(row[column])
    if (!value) continue
    total++
    if (matcher(value)) matches++
  }
  return { matches, total }
}

const isUsStateValue = (value: string): boolean =>
  US_STATE_ABBRS.has(value.toUpperCase()) || US_STATE_NAMES.has(value)

const isCanadaProvinceValue = (value: string): boolean =>
  CANADA_PROVINCE_NAMES.has(value) ||
  ['ab', 'bc', 'mb', 'nb', 'nl', 'ns', 'nt', 'nu', 'on', 'pe', 'qc', 'sk', 'yt'].includes(value)

const isWorldCountryValue = (value: string): boolean =>
  WORLD_COUNTRY_NAMES.has(value) && !US_COUNTRY_VALUES.has(value)

const isUsCountryValue = (value: string): boolean => US_COUNTRY_VALUES.has(value)

const isFipsCode = (value: string): boolean => /^\d{5}$/.test(value)

const hasLatLonColumns = (columns: string[]): boolean => {
  const lowered = columns.map((c) => c.toLowerCase())
  const hasLat = lowered.some((c) => c === 'lat' || c === 'latitude' || c.includes('latitude'))
  const hasLon = lowered.some(
    (c) => c === 'lon' || c === 'lng' || c === 'longitude' || c.includes('longitude') || c.includes('lng'),
  )
  return hasLat && hasLon
}

const inferFromCoordinates = (
  rows: DataRow[],
  latCol: string,
  lonCol: string,
): { geography: GeographyKey; projection: ProjectionType; confidence: 'high' | 'medium'; reason: string } | null => {
  const lats: number[] = []
  const lons: number[] = []
  for (const row of rows.slice(0, 100)) {
    const lat = Number(row[latCol])
    const lon = Number(row[lonCol])
    if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
      lats.push(lat)
      lons.push(lon)
    }
  }
  if (lats.length === 0) return null

  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)

  // Continental US bounding box (with margin)
  if (minLat >= 18 && maxLat <= 72 && minLon >= -170 && maxLon <= -50) {
    if (minLat >= 24 && maxLat <= 50 && minLon >= -125 && maxLon <= -66) {
      return {
        geography: 'usa-states',
        projection: 'albersUsa',
        confidence: 'high',
        reason: 'Coordinates fall within continental US',
      }
    }
    if (minLat >= 41 && maxLat <= 84 && minLon >= -141 && maxLon <= -52) {
      return {
        geography: 'canada-provinces',
        projection: 'mercator',
        confidence: 'medium',
        reason: 'Coordinates fall within Canada',
      }
    }
  }

  return {
    geography: 'world',
    projection: 'mercator',
    confidence: 'medium',
    reason: 'Coordinates span multiple regions',
  }
}

export const inferGeographyAndProjection = ({ columns, sampleRows }: InferenceInput): InferenceResult => {
  const stateCol =
    findColumn(columns, ['state']) ??
    findColumnContaining(columns, ['state'])
  const provinceCol =
    findColumn(columns, ['province']) ??
    findColumnContaining(columns, ['province', 'territory'])
  const countyCol =
    findColumn(columns, ['county', 'fips']) ??
    findColumnContaining(columns, ['county', 'fips'])
  const countryCol =
    findColumn(columns, ['country', 'nation']) ??
    findColumnContaining(columns, ['country', 'nation'])

  // Value-based scoring takes priority over column name alone
  if (stateCol && sampleRows.length > 0) {
    const { matches, total } = scoreColumnValues(sampleRows, stateCol, isUsStateValue)
    if (total > 0 && matches / total >= 0.6) {
      return {
        geography: 'usa-states',
        projection: 'albersUsa',
        confidence: matches / total >= 0.85 ? 'high' : 'medium',
        reason: `${Math.round((matches / total) * 100)}% of values match US states`,
      }
    }
  }

  if (countyCol && sampleRows.length > 0) {
    const fipsScore = scoreColumnValues(sampleRows, countyCol, isFipsCode)
    if (fipsScore.total > 0 && fipsScore.matches / fipsScore.total >= 0.5) {
      return {
        geography: 'usa-counties',
        projection: 'albersUsa',
        confidence: 'high',
        reason: 'Column contains FIPS county codes',
      }
    }
  }

  if (provinceCol && sampleRows.length > 0) {
    const { matches, total } = scoreColumnValues(sampleRows, provinceCol, isCanadaProvinceValue)
    if (total > 0 && matches / total >= 0.6) {
      return {
        geography: 'canada-provinces',
        projection: 'mercator',
        confidence: matches / total >= 0.85 ? 'high' : 'medium',
        reason: `${Math.round((matches / total) * 100)}% of values match Canadian provinces`,
      }
    }
  }

  if (countryCol && sampleRows.length > 0) {
    const usScore = scoreColumnValues(sampleRows, countryCol, isUsCountryValue)
    const worldScore = scoreColumnValues(sampleRows, countryCol, isWorldCountryValue)
    if (usScore.total > 0 && usScore.matches / usScore.total >= 0.8) {
      // Country column but all USA — check if we also have states
      if (stateCol) {
        return {
          geography: 'usa-states',
          projection: 'albersUsa',
          confidence: 'high',
          reason: 'Country column is all USA with state data present',
        }
      }
    }
    if (worldScore.total > 0 && worldScore.matches / worldScore.total >= 0.3) {
      return {
        geography: 'world',
        projection: 'equalEarth',
        confidence: 'medium',
        reason: 'Country column contains multiple nations',
      }
    }
  }

  // Column name hints (lower confidence)
  if (countyCol) {
    return { geography: 'usa-counties', projection: 'albersUsa', confidence: 'low', reason: 'County column name detected' }
  }
  if (provinceCol && !stateCol) {
    return { geography: 'canada-provinces', projection: 'mercator', confidence: 'low', reason: 'Province column name detected' }
  }
  if (stateCol) {
    return { geography: 'usa-states', projection: 'albersUsa', confidence: 'low', reason: 'State column name detected' }
  }

  // Coordinate-based inference
  if (hasLatLonColumns(columns)) {
    const latCol = columns.find((c) => /lat/i.test(c))!
    const lonCol = columns.find((c) => /lon|lng/i.test(c))!
    const coordResult = inferFromCoordinates(sampleRows, latCol, lonCol)
    if (coordResult) return coordResult
  }

  return {
    geography: 'usa-states',
    projection: 'albersUsa',
    confidence: 'low',
    reason: 'Defaulting to US states',
  }
}
