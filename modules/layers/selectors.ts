import type { MapLayer, MapType } from '@/app/(studio)/types'

export function sortLayers(layers: MapLayer[]): MapLayer[] {
  return [...layers].sort((a, b) => a.order - b.order)
}

export function getVisibleLayers(layers: MapLayer[]): MapLayer[] {
  return sortLayers(layers).filter((layer) => layer.visible)
}

export function getVisiblePointLayers(layers: MapLayer[]): MapLayer[] {
  return getVisibleLayers(layers).filter((layer) => layer.type === 'points')
}

export function getVisibleAreaLayers(layers: MapLayer[]): MapLayer[] {
  return getVisibleLayers(layers).filter((layer) => layer.type === 'areas')
}

export function getSelectedLayer(layers: MapLayer[], selectedLayerId: string | null): MapLayer | null {
  if (!selectedLayerId) return null
  return layers.find((layer) => layer.id === selectedLayerId) ?? null
}

export function getPrimaryAreaLayer(layers: MapLayer[]): MapLayer | null {
  const visible = getVisibleAreaLayers(layers)
  if (visible.length === 0) return null
  return visible[visible.length - 1]
}

export function getPrimaryPointLayer(layers: MapLayer[]): MapLayer | null {
  const visible = getVisiblePointLayers(layers)
  if (visible.length === 0) return null
  return visible[0]
}

export function layerHasData(layer: MapLayer): boolean {
  return layer.data.parsedData.length > 0 || layer.data.geocodedData.length > 0
}

export function projectHasLayerData(layers: MapLayer[]): boolean {
  return layers.some(layerHasData)
}

export function inferActiveMapType(layers: MapLayer[], canvasCustomBoundary?: string): MapType {
  if (canvasCustomBoundary?.trim()) {
    const hasAreas = getVisibleAreaLayers(layers).some(layerHasData)
    return hasAreas ? 'custom' : 'symbol'
  }

  const points = getVisiblePointLayers(layers).filter(layerHasData)
  const areas = getVisibleAreaLayers(layers).filter(layerHasData)

  if (areas.length > 0 && points.length === 0) return 'choropleth'
  if (points.length > 0 && areas.length === 0) return 'symbol'
  if (areas.length > 0 && points.length > 0) return 'symbol'
  return 'symbol'
}

export function nextLayerOrder(layers: MapLayer[]): number {
  if (layers.length === 0) return 0
  return Math.max(...layers.map((layer) => layer.order)) + 1
}
