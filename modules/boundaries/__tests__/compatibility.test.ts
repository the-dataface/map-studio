import { describe, expect, it } from 'vitest'

import {
  boundaryConfigFromGeographyKey,
  geographyKeyFromBoundaryConfig,
  isSvgCompatibleBoundary,
} from '../compatibility'

describe('boundary compatibility', () => {
  it('maps US states geography to boundary config and back', () => {
    const config = boundaryConfigFromGeographyKey('usa-states')
    expect(geographyKeyFromBoundaryConfig(config)).toBe('usa-states')
    expect(isSvgCompatibleBoundary(config)).toBe(true)
  })

  it('maps world geography to boundary config and back', () => {
    const config = boundaryConfigFromGeographyKey('world')
    expect(geographyKeyFromBoundaryConfig(config)).toBe('world')
    expect(isSvgCompatibleBoundary(config)).toBe(true)
  })

  it('maps US counties geography to boundary config', () => {
    const config = boundaryConfigFromGeographyKey('usa-counties')
    expect(geographyKeyFromBoundaryConfig(config)).toBe('usa-counties')
    expect(config.joinKey).toBe('fips')
  })
})
