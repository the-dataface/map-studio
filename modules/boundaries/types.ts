import type { Feature, FeatureCollection, Geometry } from 'geojson'

import type { BoundaryConfig, MatchReport } from '@/app/(studio)/types'

export type BoundaryFeatureProperties = {
  __joinKey: string
  __label: string
  __value?: number | string | null
  __color?: string
  name?: string
  [key: string]: unknown
}

export type BoundaryFeatureCollection = FeatureCollection<Geometry, BoundaryFeatureProperties>

export interface BoundariesResponse {
  data: BoundaryFeatureCollection
  geographyKey: string
  source: string
  cached?: boolean
}

export interface JoinChoroplethResult {
  features: BoundaryFeatureCollection
  matchReport: MatchReport
}

export type { BoundaryConfig, MatchReport }
