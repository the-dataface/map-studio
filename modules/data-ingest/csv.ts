import type { DataRow } from '@/app/(studio)/types'

export interface ParsedDataset {
  data: DataRow[]
  columns: string[]
}

const splitCsvLine = (line: string): string[] => {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i += 1
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += char
    }
  }

  result.push(current)
  return result
}

const sanitizeValues = (values: string[]): string[] => values.map((value) => value.trim().replace(/"/g, ''))

export const parseDelimitedText = (rawText: string): ParsedDataset => {
  const trimmed = rawText.trim()
  if (!trimmed) {
    return { data: [], columns: [] }
  }

  const lines = trimmed.split('\n')
  const delimiter = lines[0].includes('\t') ? '\t' : ','

  const headers =
    delimiter === '\t'
      ? sanitizeValues(lines[0].split('\t'))
      : sanitizeValues(splitCsvLine(lines[0]))

  const data = lines.slice(1).map((line) => {
    const values =
      delimiter === '\t' ? sanitizeValues(line.split('\t')) : sanitizeValues(splitCsvLine(line))

    return headers.reduce<DataRow>((row, header, index) => {
      row[header] = values[index] ?? ''
      return row
    }, {})
  })

  return { data, columns: headers }
}


