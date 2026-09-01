'use client'

import type { ReactNode } from 'react'
import type { MapGeoJSONFeature } from 'maplibre-gl'

import type {
  ColumnFormat,
  ColumnType,
  DataRow,
  DimensionSettings,
  GeocodedRow,
  GeographyKey,
} from '@/app/(studio)/types'
import { normalizeGeoIdentifier } from '@/modules/map-preview/geography'
import { formatTooltipData, getMappedDimensionColumns } from '@/modules/map-preview/tooltip'

type DataRecord = DataRow | GeocodedRow

function renderTooltipRows(
  record: DataRecord,
  mapType: 'symbol' | 'choropleth',
  dimensionSettings: DimensionSettings,
  columnTypes: ColumnType,
  columnFormats: ColumnFormat,
): ReactNode {
  const mappedColumns = getMappedDimensionColumns(dimensionSettings, mapType)
  const tooltipData = formatTooltipData(record, mappedColumns, columnTypes, columnFormats)

  if (tooltipData.length === 0) {
    return null
  }

  return (
    <div className="space-y-1">
      {tooltipData.map((item) => (
        <div key={item.column} className="flex gap-2 text-xs">
          <span className="font-medium text-muted-foreground">{item.column}:</span>
          <span className="text-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  )
}

export function createSymbolTooltipResolver({
  records,
  dimensionSettings,
  columnTypes,
  columnFormats,
}: {
  records: DataRecord[]
  dimensionSettings: DimensionSettings
  columnTypes: ColumnType
  columnFormats: ColumnFormat
}) {
  return (feature: MapGeoJSONFeature): ReactNode | null => {
    const rowIndex = feature.properties?.__rowIndex
    if (typeof rowIndex !== 'number' || !records[rowIndex]) {
      return null
    }

    return renderTooltipRows(records[rowIndex], 'symbol', dimensionSettings, columnTypes, columnFormats)
  }
}

export function createChoroplethTooltipResolver({
  choroplethData,
  stateColumn,
  geographyKey,
  dimensionSettings,
  columnTypes,
  columnFormats,
}: {
  choroplethData: DataRecord[]
  stateColumn: string
  geographyKey: GeographyKey
  dimensionSettings: DimensionSettings
  columnTypes: ColumnType
  columnFormats: ColumnFormat
}) {
  return (feature: MapGeoJSONFeature): ReactNode | null => {
    const joinKey = feature.properties?.__joinKey
    if (!joinKey || !stateColumn) {
      const label = feature.properties?.__label ?? feature.properties?.name
      return label ? (
        <div className="text-xs text-foreground">{String(label)}</div>
      ) : null
    }

    const record = choroplethData.find(
      (row) => normalizeGeoIdentifier(String(row[stateColumn] ?? ''), geographyKey) === joinKey,
    )

    if (record) {
      return renderTooltipRows(record, 'choropleth', dimensionSettings, columnTypes, columnFormats)
    }

    const label = feature.properties?.__label ?? feature.properties?.name ?? joinKey
    const value = feature.properties?.__value
    return (
      <div className="space-y-1 text-xs">
        <div className="font-medium text-foreground">{String(label)}</div>
        {value !== null && value !== undefined && value !== '' ? (
          <div className="text-muted-foreground">{String(value)}</div>
        ) : (
          <div className="text-muted-foreground">No data mapped</div>
        )}
      </div>
    )
  }
}
