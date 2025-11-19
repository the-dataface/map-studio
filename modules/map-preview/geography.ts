import type { GeographyKey } from '@/app/(studio)/types'

import { PROVINCE_CODE_MAP, STATE_CODE_MAP } from '@/modules/data-ingest/formatting'

const REVERSE_STATE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_CODE_MAP).map(([abbr, full]) => [full.toLowerCase(), abbr])
)

const REVERSE_PROVINCE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(PROVINCE_CODE_MAP).map(([abbr, full]) => [full.toLowerCase(), abbr])
)

const FIPS_TO_STATE_ABBR: Record<string, string> = {
  '01': 'AL',
  '02': 'AK',
  '04': 'AZ',
  '05': 'AR',
  '06': 'CA',
  '08': 'CO',
  '09': 'CT',
  '10': 'DE',
  '11': 'DC',
  '12': 'FL',
  '13': 'GA',
  '15': 'HI',
  '16': 'ID',
  '17': 'IL',
  '18': 'IN',
  '19': 'IA',
  '20': 'KS',
  '21': 'KY',
  '22': 'LA',
  '23': 'ME',
  '24': 'MD',
  '25': 'MA',
  '26': 'MI',
  '27': 'MN',
  '28': 'MS',
  '29': 'MO',
  '30': 'MT',
  '31': 'NE',
  '32': 'NV',
  '33': 'NH',
  '34': 'NJ',
  '35': 'NM',
  '36': 'NY',
  '37': 'NC',
  '38': 'ND',
  '39': 'OH',
  '40': 'OK',
  '41': 'OR',
  '42': 'PA',
  '44': 'RI',
  '45': 'SC',
  '46': 'SD',
  '47': 'TN',
  '48': 'TX',
  '49': 'UT',
  '50': 'VT',
  '51': 'VA',
  '53': 'WA',
  '54': 'WV',
  '55': 'WI',
  '56': 'WY',
  '60': 'AS',
  '66': 'GU',
  '69': 'MP',
  '72': 'PR',
  '78': 'VI',
}

const COUNTRY_NAME_TO_ISO3: Record<string, string> = {
  'United States': 'USA',
  Canada: 'CAN',
  Mexico: 'MEX',
  Brazil: 'BRA',
  China: 'CHN',
  India: 'IND',
  'United Kingdom': 'GBR',
  France: 'FRA',
  Germany: 'DEU',
  Japan: 'JPN',
}

const ISO3_TO_COUNTRY_NAME: Record<string, string> = Object.fromEntries(
  Object.entries(COUNTRY_NAME_TO_ISO3).map(([name, iso]) => [iso, name])
)

export const stripDiacritics = (str: string): string => str.normalize('NFD').replace(/\p{Diacritic}/gu, '')

export const normalizeGeoIdentifier = (value: string, geoType: GeographyKey): string => {
  if (!value) {
    return ''
  }

  const trimmed = stripDiacritics(String(value).trim())

  if (geoType.startsWith('usa-states')) {
    if (trimmed.length === 2 && /^\d{2}$/.test(trimmed)) {
      const abbr = FIPS_TO_STATE_ABBR[trimmed]
      if (abbr) {
        return abbr
      }
    }

    if (trimmed.length === 2 && STATE_CODE_MAP[trimmed.toUpperCase()]) {
      return trimmed.toUpperCase()
    }

    const lowerValue = trimmed.toLowerCase()
    const abbreviation = REVERSE_STATE_MAP[lowerValue]
    if (abbreviation) {
      return abbreviation
    }

    for (const [abbr, fullName] of Object.entries(STATE_CODE_MAP)) {
      if (fullName.toLowerCase() === lowerValue) {
        return abbr
      }
    }

    return trimmed.toUpperCase()
  }

  if (geoType.startsWith('usa-counties')) {
    return trimmed
  }

  if (geoType.startsWith('canada-provinces')) {
    if (trimmed.length === 2 && PROVINCE_CODE_MAP[trimmed.toUpperCase()]) {
      return trimmed.toUpperCase()
    }

    const lowerValue = trimmed.toLowerCase()
    const abbreviation = REVERSE_PROVINCE_MAP[lowerValue]
    if (abbreviation) {
      return abbreviation
    }

    for (const [abbr, fullName] of Object.entries(PROVINCE_CODE_MAP)) {
      if (stripDiacritics(fullName).toLowerCase() === lowerValue) {
        return abbr
      }
    }

    return trimmed.toUpperCase()
  }

  return trimmed
}

export const extractCandidateFromSVGId = (id: string): string | null => {
  if (!id) {
    return null
  }

  const directPatterns = [
    /^([A-Z]{2})$/,
    /^([a-zA-Z\s]+)$/,
    /^(\d{5})$/,
    /^(\d{2})$/,
  ]

  const prefixPatterns = [
    /^(?:state|province|country|county)[_\- ]?([a-zA-Z0-9.\s]+)$/i,
  ]

  for (const pattern of [...directPatterns, ...prefixPatterns]) {
    const match = id.match(pattern)
    if (match?.[1]) {
      return match[1].trim()
    }
  }

  return null
}

export const getSubnationalLabel = (geo: GeographyKey | string, plural = false): string => {
  if (geo === 'usa-states') return plural ? 'States' : 'State'
  if (geo === 'usa-counties') return plural ? 'Counties' : 'County'
  if (geo === 'canada-provinces') return plural ? 'Provinces' : 'Province'
  return plural ? 'Regions' : 'Region'
}

export const formatCountry = (value: unknown, format: string): string => {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  const str = String(value).trim()

  if (format === 'iso3') {
    if (str.length === 3 && ISO3_TO_COUNTRY_NAME[str.toUpperCase()]) {
      return str.toUpperCase()
    }
    return COUNTRY_NAME_TO_ISO3[str] || str
  }

  if (format === 'full') {
    if (str.length === 3 && ISO3_TO_COUNTRY_NAME[str.toUpperCase()]) {
      return ISO3_TO_COUNTRY_NAME[str.toUpperCase()]
    }
    return str
  }

  return str
}

export type CountryFinder = (features: any[], candidates: (string | number)[]) => any

/**
 * Find a country feature from an array of features by matching against multiple possible identifiers
 */
export const findCountryFeature: CountryFinder = (features, candidates) => {
  return features.find((f) => {
    const props = f.properties ?? {}
    return candidates.some((c) =>
      [props.name, props.name_long, props.admin, props.iso_a3, String(f.id)]
        .filter(Boolean)
        .map((v) => v.toString().toLowerCase())
        .includes(String(c).toLowerCase())
    )
  })
}
