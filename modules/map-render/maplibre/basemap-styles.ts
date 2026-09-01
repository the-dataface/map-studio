import type { BasemapStyle } from '@/app/(studio)/types'

export const BASEMAP_STYLES: BasemapStyle[] = [
  {
    id: 'liberty',
    name: 'Light',
    url: 'https://tiles.openfreemap.org/styles/liberty',
    attribution: '© OpenFreeMap © OpenStreetMap',
  },
  {
    id: 'dark',
    name: 'Dark',
    url: 'https://tiles.openfreemap.org/styles/dark',
    attribution: '© OpenFreeMap © OpenStreetMap',
  },
  {
    id: 'positron',
    name: 'Minimal',
    url: 'https://tiles.openfreemap.org/styles/positron',
    attribution: '© OpenFreeMap © OpenStreetMap',
  },
]

export function getBasemapStyle(id: string): BasemapStyle {
  return BASEMAP_STYLES.find((style) => style.id === id) ?? BASEMAP_STYLES[0]
}

export const DEFAULT_MAPLIBRE_CONFIG = {
  viewport: {
    center: [-98.5795, 39.8283] as [number, number],
    zoom: 3,
  },
  basemapStyleId: 'positron',
  interactivity: {
    allowZoom: true,
    allowPan: true,
    showTooltips: true,
  },
}
