import type { ColumnFormat, ColumnType, DataRow, GeocodedRow, GeographyKey } from '@/app/(studio)/types'

import { formatDate, formatNumber } from './value-utils'

export const STATE_CODE_MAP: Record<string, string> = {
  AL: 'Alabama',
  AK: 'Alaska',
  AZ: 'Arizona',
  AR: 'Arkansas',
  CA: 'California',
  CO: 'Colorado',
  CT: 'Connecticut',
  DE: 'Delaware',
  FL: 'Florida',
  GA: 'Georgia',
  HI: 'Hawaii',
  ID: 'Idaho',
  IL: 'Illinois',
  IN: 'Indiana',
  IA: 'Iowa',
  KS: 'Kansas',
  KY: 'Kentucky',
  LA: 'Louisiana',
  ME: 'Maine',
  MD: 'Maryland',
  MA: 'Massachusetts',
  MI: 'Michigan',
  MN: 'Minnesota',
  MS: 'Mississippi',
  MO: 'Missouri',
  MT: 'Montana',
  NE: 'Nebraska',
  NV: 'Nevada',
  NH: 'New Hampshire',
  NJ: 'New Jersey',
  NM: 'New Mexico',
  NY: 'New York',
  NC: 'North Carolina',
  ND: 'North Dakota',
  OH: 'Ohio',
  OK: 'Oklahoma',
  OR: 'Oregon',
  PA: 'Pennsylvania',
  RI: 'Rhode Island',
  SC: 'South Carolina',
  SD: 'South Dakota',
  TN: 'Tennessee',
  TX: 'Texas',
  UT: 'Utah',
  VT: 'Vermont',
  VA: 'Virginia',
  WA: 'Washington',
  WV: 'West Virginia',
  WI: 'Wisconsin',
  WY: 'Wyoming',
}

export const PROVINCE_CODE_MAP: Record<string, string> = {
  AB: 'Alberta',
  BC: 'British Columbia',
  MB: 'Manitoba',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  NS: 'Nova Scotia',
  ON: 'Ontario',
  PE: 'Prince Edward Island',
  QC: 'Quebec',
  SK: 'Saskatchewan',
  NT: 'Northwest Territories',
  NU: 'Nunavut',
  YT: 'Yukon',
}

const REVERSE_STATE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_CODE_MAP).map(([abbr, full]) => [full.toLowerCase(), abbr])
)

const REVERSE_PROVINCE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(PROVINCE_CODE_MAP).map(([abbr, full]) => [full.toLowerCase(), abbr])
)

const SGC_TO_PROVINCE_MAP: Record<string, string> = {
  '10': 'NL',
  '11': 'PE',
  '12': 'NS',
  '13': 'NB',
  '24': 'QC',
  '35': 'ON',
  '46': 'MB',
  '47': 'SK',
  '48': 'AB',
  '59': 'BC',
  '60': 'YT',
  '61': 'NT',
  '62': 'NU',
}

export const getDefaultFormat = (type: 'number' | 'date' | 'state' | 'coordinate' | 'text' | 'country'): string => {
  switch (type) {
    case 'number':
      return 'raw'
    case 'date':
      return 'yyyy-mm-dd'
    case 'state':
      return 'abbreviated'
    case 'coordinate':
      return 'raw'
    case 'country':
      return 'raw'
    default:
      return 'raw'
  }
}

export const formatState = (value: unknown, format: string, selectedGeography: GeographyKey): string => {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  const str = String(value).trim()

  if (selectedGeography === 'canada-provinces') {
    let provinceAbbr = str
    if (SGC_TO_PROVINCE_MAP[str]) {
      provinceAbbr = SGC_TO_PROVINCE_MAP[str]
    }

    switch (format) {
      case 'abbreviated':
        if (provinceAbbr.length === 2 && PROVINCE_CODE_MAP[provinceAbbr.toUpperCase()]) {
          return provinceAbbr.toUpperCase()
        }
        return REVERSE_PROVINCE_MAP[str.toLowerCase()] || str
      case 'full':
        if (provinceAbbr.length === 2) {
          return PROVINCE_CODE_MAP[provinceAbbr.toUpperCase()] || str
        }
        return (
          Object.values(PROVINCE_CODE_MAP).find((province) => province.toLowerCase() === str.toLowerCase()) || str
        )
      default:
        return str
    }
  }

  switch (format) {
    case 'abbreviated':
      if (str.length === 2 && STATE_CODE_MAP[str.toUpperCase()]) {
        return str.toUpperCase()
      }
      return REVERSE_STATE_MAP[str.toLowerCase()] || str
    case 'full':
      if (str.length === 2) {
        return STATE_CODE_MAP[str.toUpperCase()] || str
      }
      return Object.values(STATE_CODE_MAP).find((state) => state.toLowerCase() === str.toLowerCase()) || str
    default:
      return str
  }
}

export const formatLegendValue = (
  value: unknown,
  column: string,
  columnTypes: ColumnType,
  columnFormats: ColumnFormat,
  selectedGeography: GeographyKey
): string => {
  const type = columnTypes[column] || 'text'
  const format = columnFormats[column] || getDefaultFormat(type)

  if (type === 'number') {
    return formatNumber(value, format)
  }

  if (type === 'date') {
    return formatDate(value, format)
  }

  if (type === 'state') {
    return formatState(value, format, selectedGeography)
  }

  return String(value ?? '')
}

export const renderLabelPreview = (
  template: string,
  firstRow: DataRow | GeocodedRow | undefined,
  columnTypes: ColumnType,
  columnFormats: ColumnFormat,
  selectedGeography: GeographyKey
): string => {
  if (!template || !firstRow) {
    return 'No data or template to preview.'
  }

  let previewHtml = template.replace(/\{([^}]+)\}/g, (match, columnName) => {
    const value = firstRow[columnName]
    if (value === undefined || value === null) {
      return ''
    }

    return formatLegendValue(value, columnName, columnTypes, columnFormats, selectedGeography)
  })

  previewHtml = previewHtml.replace(/\n/g, '<br/>')

  return previewHtml
}
