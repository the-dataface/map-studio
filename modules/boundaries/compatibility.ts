import type { BoundaryConfig, GeographyKey } from '@/app/(studio)/types'

import { findPresetByGeographyKey, findPresetForConfig } from './catalog'

export function geographyKeyFromBoundaryConfig(config: BoundaryConfig): GeographyKey | null {
  const preset = findPresetForConfig(config)
  return preset?.geographyKey ?? null
}

export function boundaryConfigFromGeographyKey(geographyKey: GeographyKey): BoundaryConfig {
  const preset = findPresetByGeographyKey(geographyKey)
  return {
    ...preset.config,
    joinColumn: preset.config.joinColumn,
  }
}

export function isSvgCompatibleBoundary(config: BoundaryConfig): boolean {
  const preset = findPresetForConfig(config)
  return preset?.svgSupported ?? false
}

export function syncGeographyFromBoundary(
  config: BoundaryConfig,
  currentGeography: GeographyKey,
): GeographyKey {
  const mapped = geographyKeyFromBoundaryConfig(config)
  return mapped ?? currentGeography
}
