import type { ReferenceLayerConfig } from '@/app/(studio)/types'

export interface ReferenceLayerDefinition {
  id: string
  label: string
  description: string
  geographyKeys?: string[]
}

export const REFERENCE_LAYER_CATALOG: ReferenceLayerDefinition[] = [
  {
    id: 'us-state-borders',
    label: 'US state borders',
    description: 'State boundary lines for context on US maps',
    geographyKeys: ['usa-states', 'usa-counties', 'usa-nation'],
  },
  {
    id: 'major-cities',
    label: 'Major cities',
    description: 'Large city labels for geographic context',
  },
  {
    id: 'graticule',
    label: 'Graticule',
    description: 'Latitude and longitude grid lines',
  },
]

export const DEFAULT_REFERENCE_LAYERS: ReferenceLayerConfig[] = REFERENCE_LAYER_CATALOG.map(
  (layer) => ({
    id: layer.id,
    enabled: false,
    opacity: 0.6,
  }),
)

export function getReferenceLayerDefinition(id: string): ReferenceLayerDefinition | undefined {
  return REFERENCE_LAYER_CATALOG.find((layer) => layer.id === id)
}
