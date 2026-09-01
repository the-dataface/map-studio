import type { Feature, FeatureCollection, Point } from 'geojson'

import type { SymbolPointCollection } from './to-geojson-symbols'

export type SymbolLabelProperties = {
  __labelText: string
  __labelTextOffsetX: number
  __labelTextOffsetY: number
  [key: string]: unknown
}

export type SymbolTextProperties = {
  __symbolText: string
  __symbolTextFontSize: number
  [key: string]: unknown
}

export type SymbolLabelCollection = FeatureCollection<Point, SymbolLabelProperties>
export type SymbolTextCollection = FeatureCollection<Point, SymbolTextProperties>

function toPointFeature<T extends Record<string, unknown>>(
  feature: SymbolPointCollection['features'][number],
  properties: T,
): Feature<Point, T> {
  return {
    type: 'Feature',
    geometry: feature.geometry,
    properties,
  }
}

export function toGeoJsonSymbolLabels(geoJson: SymbolPointCollection): SymbolLabelCollection {
  const features = geoJson.features
    .filter((feature) => {
      const text = feature.properties.__labelText
      return typeof text === 'string' && text.trim().length > 0
    })
    .map((feature) =>
      toPointFeature(feature, {
        __labelText: String(feature.properties.__labelText),
        __labelTextOffsetX: Number(feature.properties.__labelTextOffsetX ?? 0),
        __labelTextOffsetY: Number(feature.properties.__labelTextOffsetY ?? 0),
      }),
    )

  return { type: 'FeatureCollection', features }
}

export function toGeoJsonSymbolText(geoJson: SymbolPointCollection): SymbolTextCollection {
  const features = geoJson.features
    .filter((feature) => {
      const text = feature.properties.__symbolText
      return typeof text === 'string' && text.trim().length > 0
    })
    .map((feature) =>
      toPointFeature(feature, {
        __symbolText: String(feature.properties.__symbolText),
        __symbolTextFontSize: Number(feature.properties.__symbolTextFontSize ?? 10),
      }),
    )

  return { type: 'FeatureCollection', features }
}

export function hasSymbolLabels(geoJson: SymbolLabelCollection): boolean {
  return geoJson.features.length > 0
}

export function hasSymbolText(geoJson: SymbolTextCollection): boolean {
  return geoJson.features.length > 0
}
