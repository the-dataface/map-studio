import type {
  ColumnFormat,
  ColumnType,
  DataRow,
  DimensionSettings,
  GeocodedRow,
  GeographyKey,
} from '@/app/(studio)/types'

type DataRecord = DataRow | GeocodedRow

/**
 * Extract column names from a label template string
 * Templates use {column_name} syntax
 */
function extractColumnsFromTemplate(template: string): string[] {
  if (!template) return []
  const matches = template.match(/\{([^}]+)\}/g)
  if (!matches) return []
  return matches.map((match) => match.slice(1, -1)) // Remove { and }
}

/**
 * Get columns that are mapped to dimensions for a given map type
 */
export function getMappedDimensionColumns(
  dimensionSettings: DimensionSettings,
  mapType: 'symbol' | 'choropleth'
): string[] {
  const columns: string[] = []

  if (mapType === 'symbol') {
    const symbol = dimensionSettings.symbol
    if (symbol.latitude) columns.push(symbol.latitude)
    if (symbol.longitude) columns.push(symbol.longitude)
    if (symbol.sizeBy) columns.push(symbol.sizeBy)
    if (symbol.colorBy) columns.push(symbol.colorBy)
    // Extract columns from label template
    if (symbol.labelTemplate) {
      const templateColumns = extractColumnsFromTemplate(symbol.labelTemplate)
      columns.push(...templateColumns)
    }
  } else if (mapType === 'choropleth') {
    const choropleth = dimensionSettings.choropleth
    if (choropleth.stateColumn) columns.push(choropleth.stateColumn)
    if (choropleth.colorBy) columns.push(choropleth.colorBy)
    // Extract columns from label template
    if (choropleth.labelTemplate) {
      const templateColumns = extractColumnsFromTemplate(choropleth.labelTemplate)
      columns.push(...templateColumns)
    }
  }

  return columns.filter((col, index, self) => self.indexOf(col) === index) // Remove duplicates
}

/**
 * Format a value based on column type and format
 */
function formatValue(
  value: unknown,
  columnName: string,
  columnTypes: ColumnType,
  columnFormats: ColumnFormat
): string {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  const columnType = columnTypes[columnName]
  const format = columnFormats[columnName]

  // Handle formatted numbers
  if (format && typeof value === 'number') {
    // Use the format if available (e.g., number formatting)
    try {
      // Basic number formatting - could be enhanced
      if (format.includes('decimal')) {
        const decimals = parseInt(format.match(/decimal-(\d+)/)?.[1] || '2')
        return value.toFixed(decimals)
      }
      if (format.includes('comma')) {
        return value.toLocaleString('en-US')
      }
      if (format.includes('percent')) {
        return `${(value * 100).toFixed(1)}%`
      }
    } catch (e) {
      // Fall through to default formatting
    }
  }

  // Handle by type
  if (columnType === 'date' && typeof value === 'string') {
    try {
      const date = new Date(value)
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString()
      }
    } catch (e) {
      // Fall through
    }
  }

  if (columnType === 'number' && typeof value === 'number') {
    return value.toLocaleString('en-US')
  }

  return String(value)
}

/**
 * Format tooltip data for display
 * Returns an array of { column, value } pairs for mapped dimensions
 */
export function formatTooltipData(
  record: DataRecord,
  mappedColumns: string[],
  columnTypes: ColumnType,
  columnFormats: ColumnFormat
): Array<{ column: string; value: string }> {
  return mappedColumns.map((column) => ({
    column,
    value: formatValue(record[column], column, columnTypes, columnFormats),
  }))
}

/**
 * Create tooltip content HTML string (for use in SVG foreignObject or HTML tooltip)
 */
export function createTooltipContentHTML(
  data: Array<{ column: string; value: string }>
): string {
  if (data.length === 0) {
    return '<div class="text-sm">No mapped dimensions</div>'
  }

  return data
    .map(
      (item) =>
        `<div class="flex gap-2 text-xs">
          <span class="font-medium text-muted-foreground">${escapeHtml(item.column)}:</span>
          <span class="text-foreground">${escapeHtml(item.value)}</span>
        </div>`
    )
    .join('')
}

function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

