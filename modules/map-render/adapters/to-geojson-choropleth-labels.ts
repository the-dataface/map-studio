import { geoPath } from 'd3'
import type { Feature, FeatureCollection, Point } from 'geojson'

import type {
  ColumnFormat,
  ColumnType,
  DataRow,
  DimensionSettings,
  GeocodedRow,
  GeographyKey,
  StylingSettings,
} from '@/app/(studio)/types'
import { resolveLabelDisplayText } from '@/lib/label-content'
import { normalizeGeoIdentifier } from '@/modules/map-preview/geography'

type DataRecord = DataRow | GeocodedRow

export type ChoroplethLabelProperties = {
  __labelText: string
  __joinKey: string
  [key: string]: unknown
}

export type ChoroplethLabelCollection = FeatureCollection<Point, ChoroplethLabelProperties>

export function toGeoJsonChoroplethLabels({
  choroplethGeoJson,
  choroplethData,
  dimensionSettings,
  stylingSettings,
  columnTypes = {},
  columnFormats = {},
  geographyKey,
}: {
  choroplethGeoJson: FeatureCollection
  choroplethData: DataRecord[]
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
  columnTypes?: ColumnType
  columnFormats?: ColumnFormat
  geographyKey: GeographyKey
}): ChoroplethLabelCollection {
  const template = dimensionSettings.choropleth.labelTemplate
  if (!template || choroplethData.length === 0) {
    return { type: 'FeatureCollection', features: [] }
  }

  const stateColumn = dimensionSettings.choropleth.stateColumn
  if (!stateColumn) {
    return { type: 'FeatureCollection', features: [] }
  }

  const geoDataKeys = new Set<string>()
  choroplethData.forEach((record) => {
    const rawGeoValue = String(record[stateColumn] || '')
    if (!rawGeoValue.trim()) {
      return
    }
    geoDataKeys.add(normalizeGeoIdentifier(rawGeoValue, geographyKey))
  })

  const path = geoPath()
  const features: Feature<Point, ChoroplethLabelProperties>[] = []

  choroplethGeoJson.features.forEach((feature) => {
    const joinKey = String(feature.properties?.__joinKey ?? '')
    if (!joinKey || !geoDataKeys.has(joinKey)) {
      return
    }

    const labelId = `choropleth-${joinKey}`
    const labelText = resolveLabelDisplayText({
      labelId,
      mapType: 'choropleth',
      dimensionSettings,
      stylingSettings,
      symbolData: [],
      choroplethData,
      columnTypes,
      columnFormats,
      selectedGeography: geographyKey,
      asPlainText: true,
    })

    if (!labelText) {
      return
    }

    const centroid = path.centroid(feature as Parameters<typeof path.centroid>[0])
    if (
      !centroid ||
      Number.isNaN(centroid[0]) ||
      Number.isNaN(centroid[1]) ||
      !Number.isFinite(centroid[0]) ||
      !Number.isFinite(centroid[1])
    ) {
      return
    }

    features.push({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: centroid as [number, number],
      },
      properties: {
        __labelText: labelText,
        __joinKey: joinKey,
      },
    })
  })

  return { type: 'FeatureCollection', features }
}
