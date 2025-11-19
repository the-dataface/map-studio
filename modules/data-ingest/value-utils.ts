import type { DataRow } from '@/app/(studio)/types'

const COMPACT_MULTIPLIERS: Record<string, number> = {
  K: 1_000,
  M: 1_000_000,
  B: 1_000_000_000,
}

export const parseCompactNumber = (value: string): number | null => {
  const match = value.match(/^(\d+(\.\d+)?)([KMB])$/i)
  if (!match) return null

  const numberPortion = Number.parseFloat(match[1])
  const factor = COMPACT_MULTIPLIERS[match[3].toUpperCase()]
  return Number.isFinite(numberPortion) ? numberPortion * factor : null
}

const normalizeNumericValue = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null
  }

  if (value === null || value === undefined) {
    return null
  }

  const strValue = String(value).trim()
  if (!strValue) {
    return null
  }

  const compact = parseCompactNumber(strValue)
  if (compact !== null) {
    return compact
  }

  const cleaned = strValue.replace(/[,$%]/g, '')
  const parsed = Number.parseFloat(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

export const getNumericBounds = (rows: DataRow[], column: string) => {
  if (!column || rows.length === 0) {
    return { min: 0, max: 100 }
  }

  const values = rows
    .map((row) => normalizeNumericValue(row[column]))
    .filter((value): value is number => value !== null)

  if (values.length === 0) {
    return { min: 0, max: 100 }
  }

  return {
    min: Math.min(...values),
    max: Math.max(...values),
  }
}

export const getUniqueStringValues = (rows: DataRow[], column: string) => {
  if (!column || rows.length === 0) {
    return [] as string[]
  }

  return [...new Set(rows.map((row) => String(row[column] ?? '').trim()).filter(Boolean))].sort()
}

export const formatNumber = (value: unknown, format: string): string => {
  const normalized = normalizeNumericValue(value)
  if (normalized === null) {
    return String(value ?? '')
  }

  const num = normalized

  switch (format) {
    case 'raw':
      return num.toString()
    case 'comma':
      return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 20 })
    case 'compact':
      if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + 'B'
      if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + 'M'
      if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + 'K'
      return num.toString()
    case 'currency':
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num)
    case 'percent':
      return (num * 100).toFixed(0) + '%'
    case '0-decimals':
      return Math.round(num).toLocaleString('en-US')
    case '1-decimal':
      return num.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    case '2-decimals':
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    default:
      return num.toString()
  }
}

const parseDateInput = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return null
    }

    const isoDateMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (isoDateMatch) {
      const [, year, month, day] = isoDateMatch
      return new Date(Number(year), Number(month) - 1, Number(day))
    }

    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return null
}

export const formatDate = (value: unknown, format: string): string => {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  const date = parseDateInput(value)
  if (!date) {
    return String(value)
  }

  switch (format) {
    case 'yyyy-mm-dd':
      return date.toISOString().split('T')[0]
    case 'mm/dd/yyyy':
      return date.toLocaleDateString('en-US')
    case 'dd/mm/yyyy':
      return date.toLocaleDateString('en-GB')
    case 'mmm-dd-yyyy':
      return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
    case 'mmmm-dd-yyyy':
      return date.toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' })
    case 'dd-mmm-yyyy':
      return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    case 'yyyy':
      return date.getFullYear().toString()
    case 'mmm-yyyy':
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    case 'mm/dd/yy':
      return date.toLocaleDateString('en-US', { year: '2-digit' })
    case 'dd/mm/yy':
      return date.toLocaleDateString('en-GB', { year: '2-digit' })
    default:
      return date.toISOString().split('T')[0]
  }
}
