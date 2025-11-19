/**
 * Utilities for generating accessible descriptions of maps
 * These descriptions help screen reader users understand map content
 */

import type { MapType, GeographyKey } from '@/app/(studio)/types'

export interface MapDescriptionOptions {
  mapType: MapType
  geography: GeographyKey
  symbolDataCount: number
  choroplethDataCount: number
  hasSymbolSizeMapping: boolean
  hasSymbolColorMapping: boolean
  hasChoroplethColorMapping: boolean
  symbolSizeColumn?: string
  symbolColorColumn?: string
  choroplethColorColumn?: string
}

/**
 * Generate a comprehensive accessible description of the map
 */
export function generateMapDescription(options: MapDescriptionOptions): string {
  const {
    mapType,
    geography,
    symbolDataCount,
    choroplethDataCount,
    hasSymbolSizeMapping,
    hasSymbolColorMapping,
    hasChoroplethColorMapping,
    symbolSizeColumn,
    symbolColorColumn,
    choroplethColorColumn,
  } = options

  const parts: string[] = []

  // Geography description
  const geographyNames: Record<GeographyKey, string> = {
    world: 'world map',
    'usa-states': 'United States map showing states',
    'usa-counties': 'United States map showing counties',
    'usa-nation': 'United States national map',
    'canada-provinces': 'Canada map showing provinces',
    'canada-nation': 'Canada national map',
  }
  parts.push(`A ${geographyNames[geography] || geography} displaying`)

  // Map type and data description
  if (mapType === 'symbol') {
    parts.push(`${symbolDataCount} location${symbolDataCount !== 1 ? 's' : ''}`)
    if (hasSymbolSizeMapping && symbolSizeColumn) {
      parts.push(`with symbol sizes representing ${symbolSizeColumn}`)
    }
    if (hasSymbolColorMapping && symbolColorColumn) {
      parts.push(`and colors representing ${symbolColorColumn}`)
    }
  } else if (mapType === 'choropleth') {
    parts.push(`data for ${choroplethDataCount} region${choroplethDataCount !== 1 ? 's' : ''}`)
    if (hasChoroplethColorMapping && choroplethColorColumn) {
      parts.push(`with colors representing ${choroplethColorColumn}`)
    }
  } else if (mapType === 'custom') {
    parts.push('custom geographic regions')
    if (choroplethDataCount > 0 && hasChoroplethColorMapping && choroplethColorColumn) {
      parts.push(`with colors representing ${choroplethColorColumn}`)
    }
  }

  return parts.join(' ') + '.'
}

/**
 * Generate a short summary for screen readers
 */
export function generateMapSummary(options: MapDescriptionOptions): string {
  const { mapType, geography, symbolDataCount, choroplethDataCount } = options

  if (mapType === 'symbol') {
    return `${symbolDataCount} locations on ${geography} map`
  } else if (mapType === 'choropleth') {
    return `${choroplethDataCount} regions on ${geography} map`
  }
  return `Custom map of ${geography}`
}

