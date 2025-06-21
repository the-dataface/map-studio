"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "@/components/ui/use-toast"
import * as d3 from "d3"
import * as topojson from "topojson-client"
\
import type type
\
{
  DataRow, GeocodedRow
  \
}
from
;("@/app/page")

interface MapPreviewProps \{
  symbolData: (DataRow | GeocodedRow)[]
  choroplethData: (DataRow | GeocodedRow)[]
  symbolColumns: string[]
  choroplethColumns: string[]
  mapType: "symbol" | "choropleth" | "custom"
  dimensionSettings: any
  stylingSettings: StylingSettings
  symbolDataExists: boolean
  choroplethDataExists: boolean
  columnTypes: ColumnType
  columnFormats: ColumnFormat
  customMapData: string
  selectedCountry: string // NEW
  selectedProjection: string // NEW
\}

interface TopoJSONData \{
  type: string
  objects: \{
    nation?: any // For US
    states?: any // For US
    countries?: any // For World
\}
  arcs: any[]
\}

interface ColumnType \{
  [key: string]: "text" | "number" | "date" | "coordinate" | "state"
\}

interface ColumnFormat \{
  [key: string]: string
\}

interface StylingSettings \{
  activeTab: "base" | "symbol" | "choropleth"
  base: \{
    mapBackgroundColor: string
    nationFillColor: string
    nationStrokeColor: string
    nationStrokeWidth: number
    defaultStateFillColor: string
    defaultStateStrokeColor: string
    defaultStateStrokeWidth: number
    savedStyles: Array<\{\
      id: string\
      name: string\
      type: "preset" | "user"\
      settings: \{\
        mapBackgroundColor: string\
        nationFillColor: string\
        nationStrokeColor: string\
        nationStrokeWidth: number\
        defaultStateFillColor: string\
        defaultStateStrokeColor: string
\}
    \}>
  \}
  symbol: \
{
  symbolType: "symbol" | "spike" | "arrow"
  symbolShape:
  \
      | "circle"
      | "square"
      | "diamond"
      | "triangle"
      | "triangle-down"
      | "hexagon"
      | "map-marker"
      | "custom-svg"
    symbolFillColor: string
    symbolStrokeColor: string
    symbolSize: number
    symbolStrokeWidth: number
    symbolFillTransparency?: number
    symbolStrokeTransparency?: number
    labelFontFamily: string
    labelBold: boolean
    labelItalic: boolean
    labelUnderline: boolean
    labelStrikethrough: boolean
    labelColor: string
    labelOutlineColor: string
    labelFontSize: number
    labelOutlineThickness: number
    labelAlignment:
      | "auto"
      | "top-left"
      | "top-center"
      | "top-right"
      | "middle-left"
      | "center"
      | "middle-right"
      | "bottom-left"
      | "bottom-center"
      | "bottom-right"
    customSvgPath?: string
  \
}
choropleth:
\
{
  labelFontFamily: string
  labelBold: boolean
  labelItalic: boolean
  labelUnderline: boolean
  labelStrikethrough: boolean
  labelColor: string
  labelOutlineColor: string
  labelFontSize: number
  labelOutlineThickness: number
  \
}
\}
\
const stateMap: Record<string, string> = \
{
  AL: "Alabama",\
  AK: "Alaska",\
  AZ: "Arizona",\
  AR: "Arkansas",\
  CA: "California",\
  CO: "Colorado",\
  CT: "Connecticut",\
  DE: "Delaware",\
  FL: "Florida",\
  GA: "Georgia",\
  HI: "Hawaii",\
  ID: "Idaho",\
  IL: "Illinois",\
  IN: "Indiana",\
  IA: "Iowa",\
  KS: "Kansas",\
  KY: "Kentucky",\
  LA: "Louisiana", ME
  : "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
\
}

const reverseStateMap: Record<string, string> = Object.fromEntries(
  Object.entries(stateMap).map(([abbr, full]) => [full.toLowerCase(), abbr]),
)

// FIPS to State Abbreviation Map
const fipsToStateAbbrMap: Record<string, string> = \
{
  ;("01")
  : "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT",
  "10": "DE",
  "11": "DC",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
  "60": "AS",
  "66": "GU",
  "69": "MP",
  "72": "PR",
  "78": "VI",
\
}

// Enhanced state matching function
const normalizeStateValue = (value: string): string => \
{
  if (!value) return ""

  const trimmed = value.trim()

  // If it's already a 2-letter abbreviation, return uppercase
  if (trimmed.length === 2 && stateMap[trimmed.toUpperCase()])
  \
  return trimmed.toUpperCase()
  \

  // If it's a full state name, convert to abbreviation
  const lowerValue = trimmed.toLowerCase()
  const abbreviation = reverseStateMap[lowerValue]
  if (abbreviation)
  \
  return abbreviation
  \

  // Try partial matching for state names
  for (const [abbr, fullName] of Object.entries(stateMap))
  \
  if (fullName.toLowerCase() === lowerValue)
  \
  return abbr
  \
  \

  // Return original value if no match found
  return trimmed.toUpperCase()
  \
}

// Enhanced function to extract state from SVG ID
const extractStateFromSVGId = (id: string): string | null => \
{
  if (!id) return null

  console.log(`Extracting state from SVG ID: "$\{id\}"`)

  // Try different patterns for state extraction
  const patterns = [
    /^State-(\d\{2\})$/i, // State-01 (FIPS code)
    /^State-([A-Z]\{2\})$/i, // State-CA
    /^State-([a-zA-Z\s]+)$/i, // State-California
    /^(\d\{2\})$/i, // 01 (FIPS code directly)
    /^([A-Z]\{2\})$/i, // CA
    /^([a-zA-Z\s]+)$/i, // California
    /State.*?([A-Z]\{2\})$/i, // Any State prefix with 2-letter code at end
    /State.*?([a-zA-Z\s]\{4,\})$/i, // Any State prefix with longer name
  ]

  for (const pattern of patterns)
  \
  {
    const match = id.match(pattern)
    if (match && match[1])
    \
    {
      const extracted = match[1].trim()
      let normalized: string

      // Check if the extracted value is a FIPS code
      if (pattern.source.includes("\\d\{2\}"))
      \
      {
        const fipsAbbr = fipsToStateAbbrMap[extracted]
        if (fipsAbbr)
        \
        normalized = fipsAbbr
        console.log(
          `Pattern matched FIPS: $\{pattern\} -> extracted: "$\{extracted\}" -> converted to abbr: "$\{normalized\}"`,
        )
        \
        else \
        console.log(`Pattern matched FIPS: $\{pattern\} -> extracted: "$\{extracted\}" but no FIPS mapping found.`)
        continue
        \
        \
      }
      else \
      normalized = normalizeStateValue(extracted)
      console.log(`Pattern matched: $\{pattern\} -> extracted: "$\{extracted\}" -> normalized: "$\{normalized\}"`)
      \

      // Verify the normalized value is a valid state abbreviation
      if (stateMap[normalized])
      \
      return normalized
      \
      \
    }
    \
  }

  console.log(`No valid state extracted from ID: "$\{id\}"`)
  return null
  \
}

const parseCompactNumber = (value: string): number | null => \
{
  const match = value.match(/^(\d+(\.\d+)?)([KMB])$/i)
  if (!match) return null

  let num = Number.parseFloat(match[1])
  const suffix = match[3].toUpperCase()

  switch (suffix) \{
    case "K":
      num *= 1_000
      break
    case "M":
      num *= 1_000_000
      break
    case "B":
      num *= 1_000_000_000
      break
  \}
  return num
\}

const getNumericValue = (row: DataRow | GeocodedRow, column: string): number | null => \{
  const rawValue = String(row[column] || "").trim()
  let parsedNum: number | null = parseCompactNumber(rawValue)

  if (parsedNum === null) \{
    const cleanedValue = rawValue.replace(/[,$%]/g, "")
    parsedNum = Number.parseFloat(cleanedValue)
  \}
  return isNaN(parsedNum) ? null : parsedNum
\}

const getUniqueValues = (column: string, data: (DataRow | GeocodedRow)[]): any[] => \{
  const uniqueValues = new Set()
  data.forEach((row) => \{
    const value = row[column]
    uniqueValues.add(value)
  \})
  return Array.from(uniqueValues)
\}

const getSymbolPathData = (
  type: StylingSettings["symbol"]["symbolType"],
  shape: StylingSettings["symbol"]["symbolShape"],
  size: number,
  customSvgPath?: string,
) => \{
  const area = Math.PI * size * size
  let transform = ""

  // Handle custom SVG path first
  if (shape === "custom-svg") \
    if (customSvgPath && customSvgPath.trim() !== "") \
      if (customSvgPath.trim().startsWith("M") || customSvgPath.trim().startsWith("m")) \{
        const scale = Math.sqrt(area) / 100 // Adjust scale as needed
        return \
          pathData: customSvgPath,
          transform: `scale($\scale\) translate(-12, -12)`, // Scale and center from origin
        \
      \} else \
        console.warn("Invalid custom SVG path provided. Falling back to default circle symbol.")
        return \pathData: d3.symbol().type(d3.symbolCircle).size(area)(), transform: "" \
      \
    \else \
      console.warn("Custom SVG shape selected but no path provided. Falling back to default circle symbol.")
      return \pathData: d3.symbol().type(d3.symbolCircle).size(area)(), transform: "" \
    \
  \

  // For all other shapes, use d3.symbol
  let pathGenerator: any = null

  if (type === "symbol") \
    switch (shape) \{
      case "circle":
        pathGenerator = d3.symbol().type(d3.symbolCircle).size(area)
        break
      case "square":
        pathGenerator = d3.symbol().type(d3.symbolSquare).size(area)
        break
      case "diamond":
        pathGenerator = d3.symbol().type(d3.symbolDiamond).size(area)
        break
      case "triangle":
        pathGenerator = d3.symbol().type(d3.symbolTriangle).size(area)
        break
      case "triangle-down":
        // Create upside-down triangle by using d3.symbolTriangle and rotating 180 degrees
        pathGenerator = d3.symbol().type(d3.symbolTriangle).size(area)
        transform = "rotate(180)"
        break
      case "hexagon":
        // Use d3's built-in hexagon symbol (d3.symbolStar with 6 points)
        pathGenerator = d3.symbol().type(d3.symbolStar).size(area)
        break
      case "map-marker":
        // Use the Lucide MapPin icon path, scaled appropriately with larger base scale
        // Base viewport is 24px, so we use that as our reference
        const baseSize = 24
        const targetSize = Math.max(size, 16) // Ensure minimum visible size of 16px
        const scale = targetSize / baseSize // Scale based on 24px viewport

        return \{
          pathData: `M$\{12 * scale\} $\{2 * scale\}C$\{8.13 * scale\} $\{2 * scale\} $\{5 * scale\} $\{5.13 * scale\} $\{5 * scale\} $\{9 * scale\}C$\{5 * scale\} $\{14.25 * scale\} $\{12 * scale\} $\{22 * scale\} $\{12 * scale\} $\{22 * scale\}C$\{12 * scale\} $\{22 * scale\} $\{19 * scale\} $\{14.25 * scale\} $\{19 * scale\} $\{9 * scale\}C$\{19 * scale\} $\{5.13 * scale\} $\{15.87 * scale\} $\{2 * scale\} $\{12 * scale\} $\{2 * scale\}ZM$\{7 * scale\} $\{9 * scale\}C$\{7 * scale\} $\{6.24 * scale\} $\{9.24 * scale\} $\{4 * scale\} $\{12 * scale\} $\{4 * scale\}C$\{14.76 * scale\} $\{4 * scale\} $\{17 * scale\} $\{6.24 * scale\} $\{17 * scale\} $\{9 * scale\}C$\{17 * scale\} $\{11.88 * scale\} $\{14.12 * scale\} $\{16.19 * scale\} $\{12 * scale\} $\{18.88 * scale\}C$\{9.92 * scale\} $\{16.21 * scale\} $\{7 * scale\} $\{11.85 * scale\} $\{7 * scale\} $\{9 * scale\}Z M$\{12 * scale\} $\{11.5 * scale\}C$\{13.3807 * scale\} $\{11.5 * scale\} $\{14.5 * scale\} $\{10.3807 * scale\} $\{14.5 * scale\} $\{9 * scale\}C$\{14.5 * scale\} $\{7.61929 * scale\} $\{13.3807 * scale\} $\{6.5 * scale\} $\{12 * scale\} $\{6.5 * scale\}C$\{10.6193 * scale\} $\{6.5 * scale\} $\{9.5 * scale\} $\{7.61929 * scale\} $\{9.5 * scale\} $\{9 * scale\}C$\{9.5 * scale\} $\{10.3807 * scale\} $\{10.6193 * scale\} $\{11.5 * scale\} $\{12 * scale\} $\{11.5 * scale\}Z`,
          transform: `translate($\-12 * scale\, $\-22 * scale\)`, // Position tip at coordinate (bottom center of marker)
        \}
      default:
        pathGenerator = d3.symbol().type(d3.symbolCircle).size(area)
    \}
  \}

  if (!pathGenerator) \{
    return \pathData: d3.symbol().type(d3.symbolCircle).size(area)(), transform: "" \
  \}

  return \{ pathData: pathGenerator(), transform \}
\}

// Helper to get default format for a type
const getDefaultFormat = (type: "number" | "date" | "state" | "coordinate"): string => \{
  switch (type) \{
    case "number":
      return "raw"
    case "date":
      return "yyyy-mm-dd"
    case "state":
      return "abbreviated"
    case "coordinate":
      return "raw"
    default:
      return "raw"
  \}
\}

// Format a number value based on the selected format
const formatNumber = (value: any, format: string): string => \{
  if (value === null || value === undefined || value === "") return ""

  let num: number
  const strValue = String(value).trim()

  const compactNum = parseCompactNumber(strValue)
  if (compactNum !== null) \
    num = compactNum
  \else \{
    const cleanedValue = strValue.replace(/[,$%]/g, "")
    num = Number.parseFloat(cleanedValue)
  \}

  if (isNaN(num)) \
    return strValue
  \

  switch (format) \{
    case "raw":
      return num.toString()
    case "comma":
      return num.toLocaleString("en-US", \{ minimumFractionDigits: 0, maximumFractionDigits: 20 \})
    case "compact":
      if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + "B"
      if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + "M"
      if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + "K"
      return num.toString()
    case "currency":
      return new Intl.NumberFormat("en-US", \{ style: "currency", currency: "USD" \}).format(num)
    case "percent":
      return (num * 100).toFixed(0) + "%"
    case "0-decimals":
      return Math.round(num).toLocaleString("en-US")
    case "1-decimal":
      return num.toLocaleString("en-US", \{ minimumFractionDigits: 1, maximumFractionDigits: 1 \})
    case "2-decimals":
      return num.toLocaleString("en-US", \{ minimumFractionDigits: 2, maximumFractionDigits: 2 \})
    default:
      return num.toString()
  \}
\}

// Format a date value based on the selected format
const formatDate = (value: any, format: string): string => \{
  if (value === null || value === undefined || value === "") return ""

  let date: Date
  if (value instanceof Date) \
    date = value
  \else \
    date = new Date(String(value))
    if (isNaN(date.getTime())) return String(value)
  \

  switch (format) \{
    case "yyyy-mm-dd":
      return date.toISOString().split("T")[0]
    case "mm/dd/yyyy":
      return date.toLocaleDateString("en-US")
    case "dd/mm/yyyy":
      return date.toLocaleDateString("en-GB")
    case "mmm-dd-yyyy":
      return date.toLocaleDateString("en-US", \{ month: "short", day: "2-digit", year: "numeric" \})
    case "mmmm-dd-yyyy":
      return date.toLocaleDateString("en-US", \{ month: "long", day: "2-digit", year: "numeric" \})
    case "dd-mmm-yyyy":
      return date.toLocaleDateString("en-GB", \{ day: "2-digit", month: "short", year: "numeric" \})
    case "yyyy":
      return date.getFullYear().toString()
    case "mmm-yyyy":
      return date.toLocaleDateString("en-US", \{ month: "short", year: "numeric" \})
    case "mm/dd/yy":
      return date.toLocaleDateString("en-US", \{ year: "2-digit" \})
    case "dd/mm/yy":
      return date.toLocaleDateString("en-GB", \{ year: "2-digit" \})
    default:
      return String(value)
  \}
\}

// Format a state value based on the selected format
const formatState = (value: any, format: string): string => \{
  if (value === null || value === undefined || value === "") return ""

  const str = String(value).trim()

  switch (format) \{
    case "abbreviated":
      if (str.length === 2 && stateMap[str.toUpperCase()]) \{
        return str.toUpperCase()
      \}
      const abbr = reverseStateMap[str.toLowerCase()]
      return abbr || str
    case "full":
      if (str.length === 2) \{
        return stateMap[str.toUpperCase()] || str
      \}
      const fullName = Object.values(stateMap).find((state) => state.toLowerCase() === str.toLowerCase())
      return fullName || str
    default:
      return str
  \}
\}

// Helper function to format legend values based on column type and format
const formatLegendValue = (value: any, column: string, columnTypes: any, columnFormats: any): string => \{
  const type = columnTypes[column] || "text"
  const format = columnFormats[column]

  if (type === "number" && format) \
    return formatNumber(value, format)
  \
  if (type === "date" && format) \
    return formatDate(value, format)
  \
  if (type === "state" && format) \
    return formatState(value, format)
  \
  return String(value)
\}

// Helper function to render the label preview with HTML tag support
const renderLabelPreview = (
  template: string,
  dataRow: DataRow | GeocodedRow,
  columnTypes: \{ [key: string]: "text" | "number" | "date" | "coordinate" | "state" \},
  columnFormats: \{ [key: string]: string \},
): string => \{
  if (!template || !dataRow) \
    return ""
  \

  const previewText = template.replace(/\{([^}]+)\}/g, (match, columnName) => \{
    const value = dataRow[columnName]
    if (value === undefined || value === null) \{
      return ""
    \}
    const type = columnTypes[columnName] || "text"
    const format = columnFormats[columnName] || getDefaultFormat(type as "number" | "date" | "state" | "coordinate")
    return formatLegendValue(value, columnName, columnTypes, columnFormats)
  \})

  return previewText
\}

// Helper function for intelligent auto-positioning
const getAutoPosition = (
  x: number,
  y: number,
  symbolSize: number,
  labelWidth: number,
  labelHeight: number,
  svgWidth: number,
  svgHeight: number,
) => \{
  const margin = Math.max(8, symbolSize * 0.3) // Increased scaling factor for better spacing
  const edgeBuffer = 20

  // Preferred positions in order: right, left, bottom, top
  const positions = [
    \{
      dx: symbolSize / 2 + margin,
      dy: 0,
      anchor: "start",
      baseline: "middle",
      name: "right",
    \},
    \{
      dx: -(symbolSize / 2 + margin), // Removed labelWidth from calculation for tighter left spacing
      dy: 0,
      anchor: "end", // Changed to "end" for proper right-aligned text
      baseline: "middle",
      name: "left",
    \},
    \{
      dx: -labelWidth / 2,
      dy: symbolSize / 2 + margin + labelHeight,
      anchor: "start",
      baseline: "hanging",
      name: "bottom",
    \},
    \{
      dx: -labelWidth / 2,
      dy: -(symbolSize / 2 + margin),
      anchor: "start",
      baseline: "baseline",
      name: "top",
    \},
  ]

  // Check each position for validity
  for (const pos of positions) \{
    const labelLeft = pos.anchor === "end" ? x + pos.dx - labelWidth : x + pos.dx
    const labelRight = pos.anchor === "end" ? x + pos.dx : x + pos.dx + labelWidth
    const labelTop = y + pos.dy - labelHeight / 2
    const labelBottom = y + pos.dy + labelHeight / 2

    // Check if label fits within SVG bounds
    if (
      labelLeft >= edgeBuffer &&
      labelRight <= svgWidth - edgeBuffer &&
      labelTop >= edgeBuffer &&
      labelBottom <= svgHeight - edgeBuffer
    ) \
      return pos
    \
  \}

  // If no position fits perfectly, return the default (right)
  return positions[0]
\}

// Helper function to create formatted text with HTML tag support
const createFormattedText = (
  textElement: d3.Selection<SVGTextElement, any, any, any>,
  labelText: string,
  baseStyles: any,
) => \{
  // Clear existing content
  textElement.selectAll("*").remove()
  textElement.text("")

  // Split by line breaks first and filter out empty lines
  const lines = labelText.split(/\n|<br\s*\/?>/i).filter((line) => line.trim() !== "")

  // Calculate vertical offset for centering multi-line text
  const totalLines = lines.length
  const lineHeight = 1.2
  const verticalOffset = totalLines > 1 ? -((totalLines - 1) * lineHeight * 0.5) : 0

  lines.forEach((line, lineIndex) => \{
    // Parse HTML tags for each line
    const parseAndCreateSpans = (text: string, parentElement: any, isFirstLine = false) => \{
      const htmlTagRegex = /<(\/?)([^>]+)>/g
      let lastIndex = 0
      let match
      const currentStyles = \{ ...baseStyles \}
      let hasAddedContent = false

      while ((match = htmlTagRegex.exec(text)) !== null) \{
        // Add text before the tag
        if (match.index > lastIndex) \{
          const textContent = text.substring(lastIndex, match.index)
          if (textContent) \{
            const tspan = parentElement.append("tspan").text(textContent)
            if (isFirstLine && lineIndex === 0 && !hasAddedContent) \
              tspan.attr("dy", `$\{verticalOffset\}em`)
            \else if (lineIndex > 0 && !hasAddedContent) \
              tspan.attr("x", 0).attr("dy", `$\{lineHeight\}em`)
            \
            applyStylesToTspan(tspan, currentStyles)
            hasAddedContent = true
          \}
        \}

        const isClosing = match[1] === "/"
        const tagName = match[2].toLowerCase()

        if (!isClosing) \
          // Opening tag - update current styles
          switch (tagName) \{
            case "b":
            case "strong":
              currentStyles.fontWeight = "bold"
              break
            case "i":
            case "em":
              currentStyles.fontStyle = "italic"
              break
            case "u":
              currentStyles.textDecoration = (currentStyles.textDecoration || "") + " underline"
              break
            case "s":
            case "strike":
              currentStyles.textDecoration = (currentStyles.textDecoration || "") + " line-through"
              break
          \}
        \} else \{
          // Closing tag - revert styles
          switch (tagName) \{
            case "b":
            case "strong":
              currentStyles.fontWeight = baseStyles.fontWeight
              break
            case "i":
            case "em":
              currentStyles.fontStyle = baseStyles.fontStyle
              break
            case "u":
              currentStyles.textDecoration = (currentStyles.textDecoration || "").replace("underline", "").trim()
              break
            case "s":
              currentStyles.textDecoration = (currentStyles.textDecoration || "").replace("line-through", "").trim()
              break
          \}
          if (currentStyles.textDecoration === "") delete currentStyles.textDecoration
        \}

        lastIndex = htmlTagRegex.lastIndex
      \}

      // Add remaining text after last tag
      if (lastIndex < text.length) \{
        const textContent = text.substring(lastIndex)
        if (textContent) \{
          const tspan = parentElement.append("tspan").text(textContent)
          if (isFirstLine && lineIndex === 0 && !hasAddedContent) \
            tspan.attr("dy", `$\{verticalOffset\}em`)
          \else if (lineIndex > 0 && !hasAddedContent) \
            tspan.attr("x", 0).attr("dy", `$\{lineHeight\}em`)
          \
          applyStylesToTspan(tspan, currentStyles)
          hasAddedContent = true
        \}
      \}

      // If no HTML tags found and we have content, add the entire text as single tspan
      if (lastIndex === 0 && text.trim() && !hasAddedContent) \{
        const tspan = parentElement.append("tspan").text(text)
        if (isFirstLine && lineIndex === 0) \
          tspan.attr("dy", `$\{verticalOffset\}em`)
        \else if (lineIndex > 0) \
          tspan.attr("x", 0).attr("dy", `$\{lineHeight\}em`)
        \
        applyStylesToTspan(tspan, currentStyles)
        hasAddedContent = true
      \}
    \}

    const applyStylesToTspan = (tspan: any, styles: any) => \{
      if (styles.fontWeight) tspan.attr("font-weight", styles.fontWeight)
      if (styles.fontStyle) tspan.attr("font-style", styles.fontStyle)
      if (styles.textDecoration) tspan.attr("text-decoration", styles.textDecoration)
    \}

    parseAndCreateSpans(line, textElement, lineIndex === 0)
  \})
\}

// Define the country map with TopoJSON URLs
const countryTopoJSONMap: \{ [key: string]: string \} = \{
  "world": "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
  "united-states": "https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json",
\}

export function MapPreview(\{
  symbolData,
  choroplethData,
  symbolColumns,
  choroplethColumns,
  mapType,
  dimensionSettings,
  stylingSettings,
  symbolDataExists,
  choroplethDataExists,
  columnTypes,
  columnFormats,
  customMapData,
  selectedCountry, // NEW
  selectedProjection, // NEW
\}: MapPreviewProps) \{
  console.log("=== MAP PREVIEW RENDER DEBUG ===")
  console.log("Map type:", mapType)
  console.log("Custom map data length:", customMapData?.length || 0)
  console.log("Symbol data length:", symbolData?.length || 0)
  console.log("Choropleth data length:", choroplethData?.length || 0)
  console.log("Dimension settings:", dimensionSettings)
  console.log("Selected Country:", selectedCountry) // NEW
  console.log("Selected Projection:", selectedProjection) // NEW

  const [isExpanded, setIsExpanded] = useState(true)
  const [topoJSONData, setTopoJSONData] = useState<TopoJSONData | null>(null) // Renamed from usData to be generic
  const [isLoadingMapData, setIsLoadingMapData] = useState(true) // Renamed from isLoading
  const svgRef = useRef<SVGSVGElement>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => \{
    const loadMapData = async () => \{
      const topojsonUrl = countryTopoJSONMap[selectedCountry];
      if (!topojsonUrl) \
        console.error(`No TopoJSON URL found for country: $\{selectedCountry\}`);
        setIsLoadingMapData(false);
        setTopoJSONData(null);
        toast(\{
          title: "Map loading failed",
          description: `No map data available for $\{selectedCountry\}.`,
          variant: "destructive",
          duration: 3000,
        \});
        return;
      \

      try \{
        setIsLoadingMapData(true);
        const response = await fetch(topojsonUrl);
        const data = await response.json();
        setTopoJSONData(data);
      \} catch (error) \
        console.error(`Failed to load map data for $\{selectedCountry\}:`, error);
        toast(\{
          title: "Map loading failed",
          description: `Failed to load map data for $\{selectedCountry\}.`,
          variant: "destructive",
          duration: 3000,
        \});
        setTopoJSONData(null);
      \finally \
        setIsLoadingMapData(false);
      \
    \};

    // Only load if not a custom map and a country is selected
    if (!customMapData && selectedCountry) \{
      loadMapData();
    \} else if (customMapData) \{
      // If custom map data is present, we don't need to load external topojson
      setTopoJSONData(null);
      setIsLoadingMapData(false);
    \}
  \}, [selectedCountry, customMapData]); // Re-run when selectedCountry or customMapData changes

  useEffect(() => \{
    console.log("=== MAP PREVIEW USEEFFECT TRIGGERED ===")
    console.log("Map type:", mapType)
    console.log("Custom map data length:", customMapData?.length || 0)
    console.log("TopoJSON data loaded:", !!topoJSONData)
    console.log("Selected Country:", selectedCountry)
    console.log("Selected Projection:", selectedProjection)

    if (!svgRef.current || !mapContainerRef.current) \{
      console.log("SVG ref or container ref not ready")
      return
    \}

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = 975
    const mapHeight = 610
    let height = mapHeight // Base height for map, legends will add to this

    // Create scales that will be used by both symbols and legends
    const sizeScale: any = null
    const symbolColorScale: any = null
    let choroplethColorScale: any = null

    // Determine what should be rendered
    const shouldRenderSymbols =
      symbolDataExists &&
      dimensionSettings?.symbol?.latitude &&
      dimensionSettings?.symbol?.longitude &&
      symbolData.length > 0 &&
      !customMapData

    const shouldRenderChoropleth =
      choroplethDataExists &&
      dimensionSettings?.choropleth?.stateColumn &&
      dimensionSettings?.choropleth?.colorBy &&
      choroplethData.length > 0

    // Calculate dynamic height based on legends needed
    let legendHeight = 0
    const shouldShowSymbolSizeLegend =
      shouldRenderSymbols &&
      dimensionSettings.symbol.sizeBy &&
      dimensionSettings.symbol.sizeMinValue !== dimensionSettings.symbol.sizeMaxValue
    const shouldShowSymbolColorLegend = shouldRenderSymbols && dimensionSettings.symbol.colorBy
    const shouldShowChoroplethColorLegend = shouldRenderChoropleth && dimensionSettings.choropleth.colorBy && selectedCountry === "united-states" // Only for US states for now

    if (shouldShowSymbolSizeLegend) legendHeight += 80
    if (shouldShowSymbolColorLegend) legendHeight += 80
    if (shouldShowChoroplethColorLegend) legendHeight += 80

    height = mapHeight + legendHeight

    mapContainerRef.current.style.backgroundColor = stylingSettings.base.mapBackgroundColor

    svg
      .attr("viewBox", `0 0 $\{width\} $\{height\}`)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("style", "max-width: 100%; height: auto;")

    let projection: d3.GeoProjection | null = null;
    let path: d3.GeoPath | null = null;

    // Determine projection based on selectedProjection and selectedCountry
    if (selectedCountry === "united-states" && selectedProjection === "geoAlbersUsa") \{
      projection = d3.geoAlbersUsa().scale(1300).translate([width / 2, mapHeight / 2]);
    \} else if (selectedCountry === "world" && selectedProjection === "geoMercator") \{
      projection = d3.geoMercator().scale(150).translate([width / 2, mapHeight / 2]);
    \} else \{
      // Fallback if combination is not explicitly handled or if a custom projection is selected
      if (selectedCountry === "united-states") \
        projection = d3.geoAlbersUsa().scale(1300).translate([width / 2, mapHeight / 2]);
      \else \
        projection = d3.geoMercator().scale(150).translate([width / 2, mapHeight / 2]);
      \
      console.warn(`Unsupported projection/country combination: $\{selectedProjection\} for $\{selectedCountry\}. Falling back to default.`)
    \}

    if (projection) \{
      path = d3.geoPath().projection(projection);
    \} else \{
      console.error("No valid projection could be determined.");
      return;
    \}


    // PRIORITY: Custom map takes precedence if custom map data exists
    if (customMapData && customMapData.trim().length > 0) \{
      console.log("=== CUSTOM MAP RENDERING START ===")
      console.log("Custom map data length:", customMapData.length)

      try \{
        const parser = new DOMParser()
        const doc = parser.parseFromString(customMapData, "image/svg+xml")

        const errorNode = doc.querySelector("parsererror")
        if (errorNode) \
          console.error("SVG parsing error:", errorNode.textContent)
          toast(\{
            title: "Custom Map Error",
            description: `SVG parsing error: $\{errorNode.textContent\}`,
            variant: "destructive",
            duration: 5000,
          \})
          return
        \

        const customMapElement = doc.documentElement
        console.log("Parsed SVG element:", customMapElement.tagName)

        // Try multiple approaches to import the custom map
        const mapGroupToImport = d3.select(customMapElement).select("#Map")
        if (!mapGroupToImport.empty()) \{
          const importedMapGroup = document.importNode(mapGroupToImport.node()!, true)
          svg.node()?.appendChild(importedMapGroup)
          console.log("✅ Imported #Map group successfully")
        \} else \{
          console.log("No #Map group found, importing entire SVG content")
          const mapGroup = svg.append("g").attr("id", "Map")
          Array.from(customMapElement.children).forEach((child) => \{
            const importedChild = document.importNode(child, true)
            mapGroup.node()?.appendChild(importedChild)
          \})
          console.log("✅ Imported", customMapElement.children.length, "elements into new Map group")
        \}

        // Look for Nations and States groups
        let nationsGroup = svg.select("#Nations")
        let statesGroup = svg.select("#States")

        if (nationsGroup.empty()) \
          nationsGroup = svg.select("#Countries")
        \
        if (statesGroup.empty()) \
          statesGroup = svg.select("#Provinces, #Regions")
        \

        console.log("Nations group found:", !nationsGroup.empty(), "Paths:", nationsGroup.selectAll("path").size())
        console.log("States group found:", !statesGroup.empty(), "Paths:", statesGroup.selectAll("path").size())

        // Apply styling
        if (!nationsGroup.empty()) \
          nationsGroup
            .selectAll("path")
            .attr("fill", stylingSettings.base.nationFillColor)
            .attr("stroke", stylingSettings.base.nationStrokeColor)
            .attr("stroke-width", stylingSettings.base.nationStrokeWidth)
        \

        if (!statesGroup.empty()) \
          statesGroup
            .selectAll("path")
            .attr("fill", stylingSettings.base.defaultStateFillColor)
            .attr("stroke", stylingSettings.base.defaultStateStrokeColor)
            .attr("stroke-width", stylingSettings.base.defaultStateStrokeWidth)
        \

        console.log("=== CUSTOM MAP RENDERING COMPLETE ===")
      \} catch (error) \
        console.error("Error processing custom map data:", error)
        toast(\{
          title: "Custom Map Error",
          description: `Error processing custom map data: $\{error.message\}`,
          variant: "destructive",
          duration: 5000,
        \})
      \
    \} else if (topoJSONData) \{ // Use topoJSONData instead of usData
      // Render standard map based on selected country
      console.log("=== STANDARD MAP RENDERING START ===")
      console.log("Rendering for country:", selectedCountry)

      const mapGroup = svg.append("g").attr("id", "Map")
      const nationsGroup = mapGroup.append("g").attr("id", "Nations")
      const statesGroup = mapGroup.append("g").attr("id", "States") // Still create, might be empty

      if (selectedCountry === "united-states") \{
        nationsGroup
          .append("path")
          .attr("id", "Country-US")
          .attr("fill", stylingSettings.base.nationFillColor)
          .attr("stroke", stylingSettings.base.nationStrokeColor)
          .attr("stroke-width", stylingSettings.base.nationStrokeWidth)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", path(topojson.feature(topoJSONData, topoJSONData.objects.nation)))

        const stateFeatures = topojson.feature(topoJSONData, topoJSONData.objects.states).features
        statesGroup
          .selectAll("path")
          .data(stateFeatures)
          .join("path")
          .attr("id", (d) => \{
            let identifier = d.properties?.postal
            if (!identifier && d.id) \{
              identifier = fipsToStateAbbrMap[String(d.id).padStart(2, "0")]
            \}
            return `State-$\{identifier || ""\}`
          \})
          .attr("fill", stylingSettings.base.defaultStateFillColor)
          .attr("stroke", stylingSettings.base.defaultStateStrokeColor)
          .attr("stroke-width", stylingSettings.base.defaultStateStrokeWidth)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", path)
      \} else if (selectedCountry === "world") \{
        // Render world map
        nationsGroup
          .selectAll("path")
          .data(topojson.feature(topoJSONData, topoJSONData.objects.countries).features) // Use 'countries' object for world
          .join("path")
          .attr("id", (d) => `Country-$\{d.id\}`) // Assuming country ID is available
          .attr("fill", stylingSettings.base.nationFillColor)
          .attr("stroke", stylingSettings.base.nationStrokeColor)
          .attr("stroke-width", stylingSettings.base.nationStrokeWidth)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", path)

        // Clear states group for world map
        statesGroup.selectAll("*").remove();
      \}

      console.log("=== STANDARD MAP RENDERING COMPLETE ===")
    \}

    // Apply choropleth data if available
    // Only apply choropleth if US map is selected AND choropleth data exists
    if (shouldRenderChoropleth && selectedCountry === "united-states") \{
      // Build state data map
      const stateDataMap = new Map()

      console.log("=== Building state data map for choropleth ===")
      choroplethData.forEach((d, index) => \{
        const rawStateValue = String(d[dimensionSettings.choropleth.stateColumn] || "")
        if (!rawStateValue.trim()) return

        const normalizedStateAbbr = normalizeStateValue(rawStateValue)
        const value =
          dimensionSettings.choropleth.colorScale === "linear"
            ? getNumericValue(d, dimensionSettings.choropleth.colorBy)
            : String(d[dimensionSettings.choropleth.colorBy])

        if (
          value !== null &&
          (dimensionSettings.choropleth.colorScale === "linear" ? !isNaN(value as number) : value)
        ) \
          stateDataMap.set(normalizedStateAbbr, value)
          console.log(`✓ Mapped $\{rawStateValue\} → $\{normalizedStateAbbr\} = $\{value\}`)
        \
      \})

      console.log("Total mapped states:", stateDataMap.size)
      console.log("State data map:", Array.from(stateDataMap.entries()))

      // Create color scale
      if (dimensionSettings?.choropleth?.colorScale === "linear") \{
        const domain = [dimensionSettings.choropleth.colorMinValue, dimensionSettings.choropleth.colorMaxValue]
        const rangeColors = [
          dimensionSettings.choropleth.colorMinColor || stylingSettings.base.defaultStateFillColor,
          dimensionSettings.choropleth.colorMaxColor || stylingSettings.base.defaultStateFillColor,
        ]

        if (dimensionSettings.choropleth.colorMidColor) \
          domain.splice(1, 0, dimensionSettings.choropleth.colorMidValue)
          rangeColors.splice(1, 0, dimensionSettings.choropleth.colorMidColor)
        \
        choroplethColorScale = d3.scaleLinear().domain(domain).range(rangeColors)
        console.log("Created linear color scale with domain:", domain, "range:", rangeColors)
      \} else \{
        const uniqueDataCategories = getUniqueValues(dimensionSettings.choropleth.colorBy, choroplethData)
        const colorMap = new Map()
        dimensionSettings?.choropleth?.categoricalColors?.forEach((item: any, index: number) => \{
          const dataCategory = uniqueDataCategories[index]
          if (dataCategory !== undefined) \{
            colorMap.set(String(dataCategory), item.color)
          \}
        \})
        choroplethColorScale = (value: any) => colorMap.get(String(value)) || stylingSettings.base.defaultStateFillColor
        console.log("Created categorical color scale with map:", Array.from(colorMap.entries()))
      \}

      // Apply colors to state paths
      const mapGroup = svg.select("#Map")
      if (!mapGroup.empty()) \{
        console.log("Found map group, applying choropleth colors...")
        let statesColored = 0

        mapGroup.selectAll("path").each(function (this: SVGPathElement) \{
          const pathElement = d3.select(this)
          const id = pathElement.attr("id")
          let stateAbbrFromSVG: string | null = null

          if (id) \{
            stateAbbrFromSVG = extractStateFromSVGId(id)
          \}

          if (!stateAbbrFromSVG) \{
            const parentGroup = d3.select(this.parentNode as SVGElement)
            const parentId = parentGroup.attr("id")
            if (parentId) \
              stateAbbrFromSVG = extractStateFromSVGId(parentId)
            \
          \}

          if (!stateAbbrFromSVG) \
            pathElement.attr("fill", stylingSettings.base.defaultStateFillColor)
            return
          \

          const value = stateDataMap.get(stateAbbrFromSVG)
          if (value !== undefined) \{
            const color = choroplethColorScale(value)
            pathElement.attr("fill", color)
            statesColored++
            console.log(`✅ Applied color $\{color\} to state $\{stateAbbrFromSVG\} (value: $\{value\})`)
          \} else \
            pathElement.attr("fill", stylingSettings.base.defaultStateFillColor)
            console.log(`No data found for state: $\{stateAbbrFromSVG\}, applying default fill.`)
          \
        \})
        console.log("States actually colored:", statesColored)
      \} else \{
        console.log("❌ No map group found for choropleth rendering")
      \}
    \} else if (shouldRenderChoropleth && selectedCountry === "world") \{
      // TODO: Implement world choropleth if needed, requires country-level data mapping
      console.warn("World choropleth not yet implemented. Data will not be applied to countries.")
    \}

    // Render symbol data if available, and only if not using a custom map
    if (shouldRenderSymbols && !customMapData) \{
      console.log("=== Rendering symbol data ===")
      console.log("Symbol data before filter:", symbolData.length)
      console.log("Dimension settings for symbols:", dimensionSettings.symbol)

      // Create symbol group
      const symbolGroup = svg.append("g").attr("id", "Symbols")
      const symbolLabelGroup = svg.append("g").attr("id", "SymbolLabels")

      // Filter data with valid coordinates
      const validSymbolData = symbolData.filter((d) => \{
        const lat = Number(d[dimensionSettings.symbol.latitude])
        const lng = Number(d[dimensionSettings.symbol.longitude])
        const isValid = !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
        if (!isValid) \{
          console.log(`Invalid coordinates for row:`, \{ lat, lng, row: d \})
        \}
        return isValid
      \})

      console.log("Valid symbol data points after filter:", validSymbolData.length)
      console.log("Sample valid data:", validSymbolData.slice(0, 3))

      if (validSymbolData.length > 0) \{
        // Use the determined projection for symbol placement
        const symbolProjection = projection;

        console.log("Projection created:", symbolProjection)

        // Create size scale if size mapping exists
        if (dimensionSettings.symbol.sizeBy) \{
          sizeScale = d3
            .scaleLinear()
            .domain([dimensionSettings.symbol.sizeMinValue, dimensionSettings.symbol.sizeMaxValue])
            .range([dimensionSettings.
