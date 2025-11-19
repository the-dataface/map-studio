import * as d3 from 'd3'

import type { DataRow, GeocodedRow, StylingSettings } from '@/app/(studio)/types'

import { parseCompactNumber } from '@/modules/data-ingest/value-utils'

type DataRecord = DataRow | GeocodedRow

/**
 * Extract numeric value from a data row column, handling compact notation (e.g., "45M")
 */
export const getNumericValue = (row: DataRecord, column: string): number | null => {
  const rawValue = String(row[column] || '').trim()
  let parsedNum: number | null = parseCompactNumber(rawValue)

  if (parsedNum === null) {
    const cleanedValue = rawValue.replace(/[,$%]/g, '')
    parsedNum = Number.parseFloat(cleanedValue)
  }
  return Number.isNaN(parsedNum) ? null : parsedNum
}

/**
 * Get unique values from a column across all data rows
 */
export const getUniqueValues = (column: string, data: DataRecord[]): unknown[] => {
  const uniqueValues = new Set()
  data.forEach((row) => {
    const value = row[column]
    if (value !== undefined && value !== null) {
      uniqueValues.add(value)
    }
  })
  return Array.from(uniqueValues)
}

/**
 * Generate SVG path data for symbols based on type, shape, and size
 */
export const getSymbolPathData = (
  type: StylingSettings['symbol']['symbolType'],
  shape: StylingSettings['symbol']['symbolShape'],
  size: number,
  customSvgPath?: string,
): { pathData: string; transform: string; fillRule?: string } => {
  const area = Math.PI * size * size
  let transform = ''

  // Handle custom SVG path first
  if (shape === 'custom-svg') {
      if (customSvgPath && customSvgPath.trim() !== '') {
        if (customSvgPath.trim().startsWith('M') || customSvgPath.trim().startsWith('m')) {
          const scale = Math.sqrt(area) / 100
          return {
            pathData: customSvgPath,
            transform: `scale(${scale}) translate(-12, -12)`,
          }
        } else {
          console.warn('Invalid custom SVG path provided. Falling back to default circle symbol.')
          const fallbackPath = d3.symbol().type(d3.symbolCircle).size(area)()
          return { pathData: fallbackPath || '', transform: '' }
        }
      } else {
        console.warn('Custom SVG shape selected but no path provided. Falling back to default circle symbol.')
        const fallbackPath = d3.symbol().type(d3.symbolCircle).size(area)()
        return { pathData: fallbackPath || '', transform: '' }
      }
  }

  // For all other shapes, use d3.symbol
  let pathGenerator: d3.Symbol<any, any> | null = null

  if (type === 'symbol') {
    switch (shape) {
      case 'circle':
        pathGenerator = d3.symbol().type(d3.symbolCircle).size(area)
        break
      case 'square':
        pathGenerator = d3.symbol().type(d3.symbolSquare).size(area)
        break
      case 'diamond':
        pathGenerator = d3.symbol().type(d3.symbolDiamond).size(area)
        break
      case 'triangle':
        pathGenerator = d3.symbol().type(d3.symbolTriangle).size(area)
        break
      case 'triangle-down':
        pathGenerator = d3.symbol().type(d3.symbolTriangle).size(area)
        transform = 'rotate(180)'
        break
      case 'hexagon':
        pathGenerator = d3.symbol().type(d3.symbolStar).size(area)
        break
      case 'map-marker': {
        const baseSize = 24
        const targetSize = Math.max(size, 16)
        const scale = targetSize / baseSize
        const outerPath = `M${12 * scale} ${2 * scale}C${8.13 * scale} ${2 * scale} ${5 * scale} ${5.13 * scale} ${
          5 * scale
        } ${9 * scale}C${5 * scale} ${14.25 * scale} ${12 * scale} ${22 * scale} ${12 * scale} ${22 * scale}C${
          12 * scale
        } ${22 * scale} ${19 * scale} ${14.25 * scale} ${19 * scale} ${9 * scale}C${19 * scale} ${5.13 * scale} ${
          15.87 * scale
        } ${2 * scale} ${12 * scale} ${2 * scale}Z`
        const holePath = `M${12 * scale} ${9 * scale}m${-3 * scale},0a${3 * scale},${3 * scale} 0 1,0 ${6 * scale},0a${
          3 * scale
        },${3 * scale} 0 1,0 -${6 * scale},0Z`
        return {
          pathData: `${outerPath}${holePath}`,
          transform: `translate(${-12 * scale}, ${-22 * scale})`,
          fillRule: 'evenodd',
        }
      }
      default:
        pathGenerator = d3.symbol().type(d3.symbolCircle).size(area)
    }
  }

  if (!pathGenerator) {
    const fallbackPath = d3.symbol().type(d3.symbolCircle).size(area)()
    return { pathData: fallbackPath || '', transform: '' }
  }

  const generatedPath = pathGenerator()
  return { pathData: generatedPath || '', transform }
}

