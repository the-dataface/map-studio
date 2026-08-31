import type { BoundaryConfig, BoundaryLevel, GeographyKey } from '@/app/(studio)/types'

export interface BoundaryPreset {
  id: string
  label: string
  config: BoundaryConfig
  geographyKey: GeographyKey
  svgSupported: boolean
}

export const BOUNDARY_PRESETS: BoundaryPreset[] = [
  {
    id: 'world-countries',
    label: 'World (countries)',
    geographyKey: 'world',
    svgSupported: true,
    config: {
      level: 'world',
      scope: {},
      joinColumn: '',
      joinKey: 'name',
      source: 'topojson',
    },
  },
  {
    id: 'us-nation',
    label: 'United States (nation)',
    geographyKey: 'usa-nation',
    svgSupported: true,
    config: {
      level: 'country',
      scope: { countries: ['US'] },
      joinColumn: '',
      joinKey: 'name',
      source: 'topojson',
    },
  },
  {
    id: 'us-states',
    label: 'United States (states)',
    geographyKey: 'usa-states',
    svgSupported: true,
    config: {
      level: 'admin1',
      scope: { countries: ['US'] },
      joinColumn: '',
      joinKey: 'name',
      source: 'topojson',
    },
  },
  {
    id: 'us-counties',
    label: 'United States (counties)',
    geographyKey: 'usa-counties',
    svgSupported: true,
    config: {
      level: 'admin2',
      scope: { countries: ['US'] },
      joinColumn: '',
      joinKey: 'fips',
      source: 'topojson',
    },
  },
  {
    id: 'ca-nation',
    label: 'Canada (nation)',
    geographyKey: 'canada-nation',
    svgSupported: true,
    config: {
      level: 'country',
      scope: { countries: ['CA'] },
      joinColumn: '',
      joinKey: 'name',
      source: 'topojson',
    },
  },
  {
    id: 'ca-provinces',
    label: 'Canada (provinces)',
    geographyKey: 'canada-provinces',
    svgSupported: true,
    config: {
      level: 'admin1',
      scope: { countries: ['CA'] },
      joinColumn: '',
      joinKey: 'name',
      source: 'topojson',
    },
  },
]

const STATE_FIPS: Record<string, string> = {
  AL: '01', AK: '02', AZ: '04', AR: '05', CA: '06', CO: '08', CT: '09', DE: '10', DC: '11',
  FL: '12', GA: '13', HI: '15', ID: '16', IL: '17', IN: '18', IA: '19', KS: '20', KY: '21',
  LA: '22', ME: '23', MD: '24', MA: '25', MI: '26', MN: '27', MS: '28', MO: '29', MT: '30',
  NE: '31', NV: '32', NH: '33', NJ: '34', NM: '35', NY: '36', NC: '37', ND: '38', OH: '39',
  OK: '40', OR: '41', PA: '42', RI: '44', SC: '45', SD: '46', TN: '47', TX: '48', UT: '49',
  VT: '50', VA: '51', WA: '53', WV: '54', WI: '55', WY: '56', PR: '72',
}

export function getStateFipsPrefix(region?: string): string | null {
  if (!region) return null
  const stateCode = region.includes('-') ? region.split('-')[1] : region
  return STATE_FIPS[stateCode.toUpperCase()] ?? null
}

export function findPresetByGeographyKey(geographyKey: GeographyKey): BoundaryPreset {
  return BOUNDARY_PRESETS.find((preset) => preset.geographyKey === geographyKey) ?? BOUNDARY_PRESETS[2]
}

export function findPresetById(id: string): BoundaryPreset | undefined {
  return BOUNDARY_PRESETS.find((preset) => preset.id === id)
}

export function boundaryConfigMatchesPreset(config: BoundaryConfig, preset: BoundaryPreset): boolean {
  return (
    config.level === preset.config.level &&
    JSON.stringify(config.scope) === JSON.stringify(preset.config.scope)
  )
}

export function findPresetForConfig(config: BoundaryConfig): BoundaryPreset | undefined {
  return BOUNDARY_PRESETS.find((preset) => boundaryConfigMatchesPreset(config, preset))
}

export const LEVEL_LABELS: Record<BoundaryLevel, string> = {
  world: 'World',
  country: 'Country',
  admin1: 'States / provinces',
  admin2: 'Counties / districts',
  custom: 'Custom',
}
