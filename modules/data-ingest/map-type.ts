import type { DataState, MapType } from '@/app/(studio)/types'

interface MapTypeResolutionContext {
  loadedType: MapType
  parsedDataLength: number
  customMapData?: string
  existingChoroplethData: DataState
  existingCustomData: DataState
}

const hasCustomMap = (loadedType: MapType, customMapData: string | undefined, existingCustomData: DataState) => {
  if (loadedType === 'custom') {
    return Boolean(customMapData && customMapData.length > 0)
  }
  return existingCustomData.customMapData.length > 0
}

const hasChoroplethRecords = (loadedType: MapType, parsedDataLength: number, existingChoroplethData: DataState) => {
  if (loadedType === 'choropleth') {
    return parsedDataLength > 0
  }
  return existingChoroplethData.parsedData.length > 0
}

export const resolveActiveMapType = ({
  loadedType,
  parsedDataLength,
  customMapData,
  existingChoroplethData,
  existingCustomData,
}: MapTypeResolutionContext): MapType => {
  const customAvailable = hasCustomMap(loadedType, customMapData, existingCustomData)
  const choroplethAvailable = hasChoroplethRecords(loadedType, parsedDataLength, existingChoroplethData)

  if (choroplethAvailable && customAvailable) {
    return 'custom'
  }

  if (loadedType === 'choropleth' && parsedDataLength > 0) {
    return 'choropleth'
  }

  if (customAvailable) {
    return 'custom'
  }

  return loadedType
}
