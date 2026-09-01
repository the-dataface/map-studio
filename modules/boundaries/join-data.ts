import type { DataRow, GeocodedRow, GeographyKey, MatchReport } from '@/app/(studio)/types'
import { normalizeGeoIdentifier } from '@/modules/map-preview/geography'
import { getNumericValue, getUniqueValues } from '@/modules/map-preview/helpers'

import { buildChoroplethColorScale, colorForValue } from './color-scale'
import type { BoundaryFeatureCollection, JoinChoroplethResult } from './types'

type DataRecord = DataRow | GeocodedRow

interface JoinChoroplethParams {
  features: BoundaryFeatureCollection
  choroplethData: DataRecord[]
  stateColumn: string
  colorBy: string
  colorScale: 'linear' | 'categorical'
  geographyKey: GeographyKey
  choroplethSettings: Parameters<typeof buildChoroplethColorScale>[0]
  stylingSettings: Parameters<typeof buildChoroplethColorScale>[1]
  defaultFillColor: string
}

export function joinChoroplethData({
  features,
  choroplethData,
  stateColumn,
  colorBy,
  colorScale,
  geographyKey,
  choroplethSettings,
  stylingSettings,
  defaultFillColor,
}: JoinChoroplethParams): JoinChoroplethResult {
  const geoDataMap = new Map<string, number | string>()

  choroplethData.forEach((record) => {
    const rawValue = String(record[stateColumn] ?? '').trim()
    if (!rawValue) {
      return
    }

    const normalizedKey = normalizeGeoIdentifier(rawValue, geographyKey)
    const value =
      colorScale === 'linear'
        ? getNumericValue(record, colorBy)
        : String(record[colorBy] ?? '')

    if (value === null || (colorScale === 'linear' ? Number.isNaN(value as number) : value === '')) {
      return
    }

    geoDataMap.set(normalizedKey, value)
  })

  const categories =
    colorScale === 'categorical' ? getUniqueValues(colorBy, choroplethData) : []
  const colorScaleFn = buildChoroplethColorScale(choroplethSettings, stylingSettings, categories)

  const featureJoinKeys = new Set<string>()
  features.features.forEach((feature) => {
    featureJoinKeys.add(feature.properties.__joinKey)
  })

  let unmatchedFeatureCount = 0
  let matched = 0
  const unmatchedDataValues: string[] = []

  geoDataMap.forEach((_value, key) => {
    if (featureJoinKeys.has(key)) {
      matched += 1
    } else {
      unmatchedDataValues.push(key)
    }
  })

  const joinedFeatures = features.features.map((feature) => {
    const joinKey = feature.properties.__joinKey
    const value = geoDataMap.get(joinKey)

    if (value === undefined) {
      unmatchedFeatureCount += 1
      return {
        ...feature,
        properties: {
          ...feature.properties,
          __value: null,
          __color: defaultFillColor,
        },
      }
    }

    const nextColor = colorScaleFn
      ? colorForValue(colorScaleFn, value, colorScale)
      : defaultFillColor

    return {
      ...feature,
      properties: {
        ...feature.properties,
        __value: value,
        __color: nextColor,
      },
    }
  })

  return {
    features: {
      type: 'FeatureCollection',
      features: joinedFeatures,
    },
    matchReport: {
      matched,
      totalDataRows: geoDataMap.size,
      totalFeatures: features.features.length,
      unmatchedDataValues,
      unmatchedFeatureCount,
    },
  }
}

/** Match report for region column only — used before color mapping is configured */
export function computeStateColumnMatchReport(
  features: BoundaryFeatureCollection,
  choroplethData: DataRecord[],
  stateColumn: string,
  geographyKey: GeographyKey,
): MatchReport {
  const featureJoinKeys = new Set<string>()
  features.features.forEach((feature) => {
    featureJoinKeys.add(feature.properties.__joinKey)
  })

  const dataKeys = new Set<string>()
  choroplethData.forEach((record) => {
    const rawValue = String(record[stateColumn] ?? '').trim()
    if (!rawValue) {
      return
    }
    dataKeys.add(normalizeGeoIdentifier(rawValue, geographyKey))
  })

  let matched = 0
  const unmatchedDataValues: string[] = []
  dataKeys.forEach((key) => {
    if (featureJoinKeys.has(key)) {
      matched += 1
    } else {
      unmatchedDataValues.push(key)
    }
  })

  let unmatchedFeatureCount = 0
  featureJoinKeys.forEach((key) => {
    if (!dataKeys.has(key)) {
      unmatchedFeatureCount += 1
    }
  })

  return {
    matched,
    totalDataRows: dataKeys.size,
    totalFeatures: features.features.length,
    unmatchedDataValues,
    unmatchedFeatureCount,
  }
}
