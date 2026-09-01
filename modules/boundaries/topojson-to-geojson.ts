import * as topojson from 'topojson-client'

import type { Feature, FeatureCollection } from 'geojson'

import type { GeographyKey } from '@/app/(studio)/types'
import type { TopoJSONData } from '@/modules/map-preview/types'
import { normalizeGeoIdentifier } from '@/modules/map-preview/geography'
import { STATE_CODE_MAP } from '@/modules/data-ingest/formatting'

import { getStateFipsPrefix } from './catalog'
import type { BoundaryFeatureCollection } from './types'

const FIPS_TO_STATE_ABBR: Record<string, string> = {
  '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA', '08': 'CO', '09': 'CT', '10': 'DE',
  '11': 'DC', '12': 'FL', '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN', '19': 'IA',
  '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME', '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN',
  '28': 'MS', '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH', '34': 'NJ', '35': 'NM',
  '36': 'NY', '37': 'NC', '38': 'ND', '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
  '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT', '50': 'VT', '51': 'VA', '53': 'WA',
  '54': 'WV', '55': 'WI', '56': 'WY', '72': 'PR',
}

function pickTopoObject(data: TopoJSONData, geographyKey: GeographyKey): unknown {
  const objects = data.objects ?? {}

  switch (geographyKey) {
    case 'usa-states':
      return objects.states
    case 'usa-counties':
      return objects.counties
    case 'usa-nation':
      return objects.nation
    case 'canada-provinces': {
      const key = Object.keys(objects).find((name) => /prov|adm1|canada/i.test(name))
      return key ? objects[key] : objects.provinces
    }
    case 'canada-nation':
    case 'world':
      return objects.countries
    default:
      return null
  }
}

function featureJoinKey(
  feature: Feature,
  geographyKey: GeographyKey,
): { joinKey: string; label: string } {
  const props = feature.properties ?? {}
  const id = feature.id != null ? String(feature.id) : ''

  if (geographyKey === 'usa-states') {
    const fips = id.padStart(2, '0').slice(-2)
    const abbr = FIPS_TO_STATE_ABBR[fips]
    const joinKey = abbr
      ? normalizeGeoIdentifier(abbr, geographyKey)
      : normalizeGeoIdentifier(String(props.name ?? id), geographyKey)
    return { joinKey, label: String(props.name ?? joinKey) }
  }

  if (geographyKey === 'usa-counties') {
    const joinKey = normalizeGeoIdentifier(id, geographyKey)
    return { joinKey, label: String(props.name ?? joinKey) }
  }

  if (geographyKey === 'canada-provinces') {
    const abbrKey = id ? normalizeGeoIdentifier(id, geographyKey) : ''
    const nameKey = props.name
      ? normalizeGeoIdentifier(String(props.name), geographyKey)
      : ''
    const joinKey = abbrKey || nameKey
    return { joinKey, label: String(props.name ?? joinKey) }
  }

  if (geographyKey === 'world' || geographyKey === 'usa-nation' || geographyKey === 'canada-nation') {
    const raw = String(props.name ?? props.name_en ?? id)
    const joinKey = normalizeGeoIdentifier(raw, geographyKey)
    return { joinKey, label: raw }
  }

  return {
    joinKey: normalizeGeoIdentifier(String(props.name ?? id), geographyKey),
    label: String(props.name ?? id),
  }
}

function filterFeatures(
  features: Feature[],
  geographyKey: GeographyKey,
  region?: string,
): Feature[] {
  if (geographyKey !== 'usa-counties' || !region) {
    return features
  }

  const fipsPrefix = getStateFipsPrefix(region)
  if (!fipsPrefix) {
    return features
  }

  return features.filter((feature) => String(feature.id ?? '').startsWith(fipsPrefix))
}

function filterNationFeature(
  features: Feature[],
  geographyKey: GeographyKey,
): Feature[] {
  if (geographyKey === 'usa-nation') {
    return features.filter((feature) => {
      const props = feature.properties ?? {}
      const candidates = [props.name, props.name_en, props.admin, props.iso_a3, feature.id]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
      return candidates.some((value) =>
        ['united states of america', 'united states', 'usa', 'us', '840'].includes(value),
      )
    })
  }

  if (geographyKey === 'canada-nation') {
    return features.filter((feature) => {
      const props = feature.properties ?? {}
      const candidates = [props.name, props.name_en, props.admin, props.iso_a3, feature.id]
        .filter(Boolean)
        .map((value) => String(value).toLowerCase())
      return candidates.some((value) => ['canada', 'can', '124'].includes(value))
    })
  }

  return features
}

export function topoJsonToBoundaryGeoJson(
  data: TopoJSONData,
  geographyKey: GeographyKey,
  region?: string,
): BoundaryFeatureCollection {
  const object = pickTopoObject(data, geographyKey)
  if (!object) {
    return { type: 'FeatureCollection', features: [] }
  }

  const result = topojson.feature(data as never, object as never) as Feature | FeatureCollection
  let features: Feature[] = 'features' in result ? [...result.features] : [result]

  features = filterNationFeature(features, geographyKey)
  features = filterFeatures(features, geographyKey, region)

  return {
    type: 'FeatureCollection',
    features: features.map((feature) => {
      const { joinKey, label } = featureJoinKey(feature, geographyKey)
      return {
        ...feature,
        properties: {
          ...(feature.properties ?? {}),
          __joinKey: joinKey,
          __label: label,
          name: label,
        },
      }
    }),
  }
}

export function getGeographyLabel(geographyKey: GeographyKey): string {
  if (geographyKey === 'usa-states') return 'states'
  if (geographyKey === 'usa-counties') return 'counties'
  if (geographyKey === 'canada-provinces') return 'provinces'
  if (geographyKey === 'world') return 'countries'
  return 'regions'
}

export { STATE_CODE_MAP }
