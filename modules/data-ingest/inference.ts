import type { DataRow, GeographyKey, ProjectionType } from '@/app/(studio)/types'

interface InferenceInput {
  columns: string[]
  sampleRows: DataRow[]
}

const hasColumnContaining = (columns: string[], substrings: string[]) =>
  columns.some((col) => substrings.some((sub) => col.includes(sub)))

const sampleRowsToString = (rows: DataRow[], limit = 10) =>
  JSON.stringify(rows.slice(0, limit)).toLowerCase()

export const inferGeographyAndProjection = ({ columns, sampleRows }: InferenceInput): {
  geography: GeographyKey
  projection: ProjectionType
} => {
  const loweredColumns = columns.map((col) => col.toLowerCase())
  const sampleString = sampleRowsToString(sampleRows)

  const hasCountryColumn = hasColumnContaining(loweredColumns, ['country', 'nation'])
  const hasStateColumn = hasColumnContaining(loweredColumns, ['state', 'province'])
  const hasCountyColumn = hasColumnContaining(loweredColumns, ['county', 'fips'])
  const hasLatLon = hasColumnContaining(loweredColumns, ['lat']) && hasColumnContaining(loweredColumns, ['lon'])
  const hasCanadaProvinceColumn = hasColumnContaining(loweredColumns, ['province', 'territory'])

  const containsWorldCountries = ['canada', 'china', 'india', 'brazil'].some((token) => sampleString.includes(token))
  const containsUsStates = ['california', 'texas', 'new york', 'florida'].some((token) => sampleString.includes(token))
  const containsCanadaProvinces = ['ontario', 'quebec', 'alberta'].some((token) => sampleString.includes(token))
  const containsUsCounties = /\b\d{5}\b/.test(sampleString)

  let geography: GeographyKey = 'usa-states'
  let projection: ProjectionType = 'albersUsa'

  if (hasCountryColumn || containsWorldCountries) {
    geography = 'world'
    projection = 'equalEarth'
  } else if (hasCanadaProvinceColumn || containsCanadaProvinces) {
    geography = 'canada-provinces'
    projection = 'mercator'
  } else if (hasCountyColumn || containsUsCounties) {
    geography = 'usa-counties'
    projection = 'albersUsa'
  } else if (hasStateColumn || containsUsStates) {
    geography = 'usa-states'
    projection = 'albersUsa'
  } else if (hasLatLon) {
    geography = 'world'
    projection = 'mercator'
  }

  return { geography, projection }
}
