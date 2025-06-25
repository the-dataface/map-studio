"use client"

import { useRef, useEffect, useState } from "react"
import * as d3 from "d3"
import * as topojson from "topojson-client"
import type { DataRow as DataRowType, GeocodedRow } from "@/app/page"
import { useToast } from "@/components/ui/use-toast"

// Define interfaces for props
interface StylingSettings {
  activeTab: "base" | "symbol" | "choropleth"
  base: {
    mapBackgroundColor: string
    nationFillColor: string
    nationStrokeColor: string
    nationStrokeWidth: number
    defaultStateFillColor: string
    defaultStateStrokeColor: string
    defaultStateStrokeWidth: number
    savedStyles: Array<{
      id: string
      name: string
      type: "preset" | "user"
      settings: {
        mapBackgroundColor: string
        nationFillColor: string
        nationStrokeColor: string
        nationStrokeWidth: number
        defaultStateFillColor: string
        defaultStateStrokeColor: string
      }
    }>
  }
  symbol: {
    symbolType: "symbol" | "spike" | "arrow"
    symbolShape:
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
    customSvgPath?: string // NEW: Add customSvgPath
  }
  choropleth: {
    labelFontFamily: string
    labelBold: boolean
    labelItalic: boolean
    labelUnderline: boolean
    labelStrikethrough: boolean
    labelColor: string
    labelOutlineColor: string
    labelFontSize: number
    labelOutlineThickness: number
  }
}

interface DimensionSettings {
  symbol: {
    latitude: string
    longitude: string
    sizeBy: string
    sizeMin: number
    sizeMax: number
    sizeMinValue: number
    sizeMaxValue: number
    colorBy: string
    colorScale: "linear" | "categorical"
    colorPalette: string
    colorMinValue: number
    colorMidValue: number
    colorMaxValue: number
    colorMinColor: string
    colorMidColor: string
    colorMaxColor: string
    categoricalColors: { value: string; color: string }[]
    labelTemplate: string
  }
  choropleth: {
    stateColumn: string
    colorBy: string
    colorScale: "linear" | "categorical"
    colorPalette: string
    colorMinValue: number
    colorMidValue: number
    colorMaxValue: number
    colorMinColor: string
    colorMidColor: string
    colorMaxColor: string
    categoricalColors: { value: string; color: string }[]
    labelTemplate: string
  }
}

interface MapPreviewProps {
  symbolData: DataRowType[]
  choroplethData: DataRowType[]
  symbolColumns: string[]
  choroplethColumns: string[]
  mapType: "symbol" | "choropleth" | "custom"
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
  symbolDataExists: boolean
  choroplethDataExists: boolean
  columnTypes: { [key: string]: "text" | "number" | "date" | "coordinate" | "state" }
  columnFormats: { [key: string]: string }
  customMapData: string
  selectedGeography: "usa-states" | "usa-counties" | "usa-nation" | "canada-provinces" | "canada-nation" | "world"
  selectedProjection: "albersUsa" | "mercator" | "equalEarth" | "albers"
  clipToCountry: boolean
}

const stateMap: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
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
}

const reverseStateMap: Record<string, string> = Object.fromEntries(
  Object.entries(stateMap).map(([abbr, full]) => [full.toLowerCase(), abbr]),
)

// Canadian Province Map
const canadaProvinceMap: Record<string, string> = {
  AB: "Alberta",
  BC: "British Columbia",
  MB: "Manitoba",
  NB: "New Brunswick",
  NL: "Newfoundland and Labrador",
  NS: "Nova Scotia",
  ON: "Ontario",
  PE: "Prince Edward Island",
  QC: "Quebec",
  SK: "Saskatchewan",
  NT: "Northwest Territories",
  NU: "Nunavut",
  YT: "Yukon",
}
const reverseCanadaProvinceMap: Record<string, string> = Object.fromEntries(
  Object.entries(canadaProvinceMap).map(([abbr, full]) => [full.toLowerCase(), abbr]),
)

// FIPS to State Abbreviation Map
const fipsToStateAbbrMap: Record<string, string> = {
  "01": "AL",
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
}

// Enhanced geographic identifier normalization function
const normalizeGeoIdentifier = (
  value: string,
  geoType: "usa-states" | "usa-counties" | "usa-nation" | "canada-provinces" | "canada-nation" | "world",
): string => {
  if (!value) return ""

  const trimmed = String(value).trim()

  if (geoType.startsWith("usa-states")) {
    // NEW: Check for 2-digit FIPS code first if applicable
    if (trimmed.length === 2 && /^\d{2}$/.test(trimmed)) {
      const abbr = fipsToStateAbbrMap[trimmed]
      if (abbr) return abbr
    }
    // US state logic (existing)
    if (trimmed.length === 2 && stateMap[trimmed.toUpperCase()]) {
      return trimmed.toUpperCase()
    }
    const lowerValue = trimmed.toLowerCase()
    const abbreviation = reverseStateMap[lowerValue]
    if (abbreviation) return abbreviation
    for (const [abbr, fullName] of Object.entries(stateMap)) {
      if (fullName.toLowerCase() === lowerValue) return abbr
    }
    return trimmed.toUpperCase() // Fallback
  } else if (geoType.startsWith("usa-counties")) {
    // For US counties, assume data provides FIPS code directly (e.g., "01001")
    // us-atlas county IDs are 5-digit FIPS codes
    return trimmed
  } else if (geoType.startsWith("canada-provinces")) {
    // For Canadian provinces
    if (trimmed.length === 2 && canadaProvinceMap[trimmed.toUpperCase()]) {
      return trimmed.toUpperCase()
    }
    const lowerValue = trimmed.toLowerCase()
    const abbreviation = reverseCanadaProvinceMap[lowerValue]
    if (abbreviation) return abbreviation
    for (const [abbr, fullName] of Object.entries(canadaProvinceMap)) {
      if (fullName.toLowerCase() === lowerValue) return abbr
    }
    return trimmed.toUpperCase() // Fallback
  } else if (geoType === "world") {
    // For world countries, use the value as is (expecting country name or ISO code)
    return trimmed
  }
  return trimmed // Default fallback
}

// Replace the existing `extractStateFromSVGId` function definition with the following:
const extractCandidateFromSVGId = (id: string): string | null => {
  if (!id) return null

  // Prioritize direct matches first for clean IDs (e.g., "CA", "California", "06001", "06")
  const directMatchPatterns = [
    /^([A-Z]{2})$/, // Direct 2-letter abbreviation like "CA"
    /^([a-zA-Z\s]+)$/, // Direct full name like "California", "New York"
    /^(\d{5})$/, // Direct 5-digit FIPS (for counties)
    /^(\d{2})$/, // Direct 2-digit FIPS (for states)
  ]

  // Then try patterns with common prefixes and flexible separators
  const prefixedPatterns = [
    // Matches "State-California", "state_CA", "County-06001", "province AB", "country-USA"
    // Allows for optional underscore, hyphen, or space after prefix.
    // Captures alphanumeric, spaces, and periods (for complex IDs) in the identifier.
    /^(?:state|province|country|county)[_\- ]?([a-zA-Z0-9.\s]+)$/i,
  ]

  const allPatterns = [...directMatchPatterns, ...prefixedPatterns]

  for (const pattern of allPatterns) {
    const match = id.match(pattern)
    if (match && match[1]) {
      return match[1].trim()
    }
  }
  return null
}

const parseCompactNumber = (value: string): number | null => {
  const match = value.match(/^(\d+(\.\d+)?)([KMB])$/i)
  if (!match) return null

  let num = Number.parseFloat(match[1])
  const suffix = match[3].toUpperCase()

  switch (suffix) {
    case "K":
      num *= 1_000
      break
    case "M":
      num *= 1_000_000
      break
    case "B":
      num *= 1_000_000_000
      break
  }
  return num
}

const getNumericValue = (row: DataRowType | GeocodedRow, column: string): number | null => {
  const rawValue = String(row[column] || "").trim()
  let parsedNum: number | null = parseCompactNumber(rawValue)

  if (parsedNum === null) {
    const cleanedValue = rawValue.replace(/[,$%]/g, "")
    parsedNum = Number.parseFloat(cleanedValue)
  }
  return isNaN(parsedNum) ? null : parsedNum
}

const getUniqueValues = (column: string, data: (DataRowType | GeocodedRow)[]): any[] => {
  const uniqueValues = new Set()
  data.forEach((row) => {
    const value = row[column]
    uniqueValues.add(value)
  })
  return Array.from(uniqueValues)
}

const getSymbolPathData = (
  type: StylingSettings["symbol"]["symbolType"],
  shape: StylingSettings["symbol"]["symbolShape"],
  size: number,
  customSvgPath?: string,
) => {
  const area = Math.PI * size * size
  let transform = ""

  // Handle custom SVG path first
  if (shape === "custom-svg") {
    if (customSvgPath && customSvgPath.trim() !== "") {
      if (customSvgPath.trim().startsWith("M") || customSvgPath.trim().startsWith("m")) {
        const scale = Math.sqrt(area) / 100 // Adjust scale as needed
        return {
          pathData: customSvgPath,
          transform: `scale(${scale}) translate(-12, -12)`, // Scale and center from origin
        }
      } else {
        console.warn("Invalid custom SVG path provided. Falling back to default circle symbol.")
        return { pathData: d3.symbol().type(d3.symbolCircle).size(area)(), transform: "" }
      }
    } else {
      console.warn("Custom SVG shape selected but no path provided. Falling back to default circle symbol.")
      return { pathData: d3.symbol().type(d3.symbolCircle).size(area)(), transform: "" }
    }
  }

  // For all other shapes, use d3.symbol
  let pathGenerator: any = null

  if (type === "symbol") {
    switch (shape) {
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
        pathGenerator = d3.symbol().type(d3.symbolHexagon).size(area)
        break
      case "map-marker":
        // Use the Lucide MapPin icon path, scaled appropriately with larger base scale
        // Base viewport is 24px, so we use that as our reference
        const baseSize = 24
        const targetSize = Math.max(size, 16) // Ensure minimum visible size of 16px
        const scale = targetSize / baseSize // Scale based on 24px viewport

        return {
          pathData: `M${12 * scale} ${2 * scale}C${8.13 * scale} ${2 * scale} ${5 * scale} ${5.13 * scale} ${5 * scale} ${9 * scale}C${5 * scale} ${14.25 * scale} ${12 * scale} ${22 * scale} ${12 * scale} ${22 * scale}C${12 * scale} ${22 * scale} ${19 * scale} ${14.25 * scale} ${19 * scale} ${9 * scale}C${19 * scale} ${5.13 * scale} ${15.87 * scale} ${2 * scale} ${12 * scale} ${2 * scale}ZM${7 * scale} ${9 * scale}C${7 * scale} ${6.24 * scale} ${9.24 * scale} ${4 * scale} ${12 * scale} ${4 * scale}C${14.76 * scale} ${4 * scale} ${17 * scale} ${6.24 * scale} ${17 * scale} ${9 * scale}C${17 * scale} ${11.88 * scale} ${14.12 * scale} ${16.19 * scale} ${12 * scale} ${18.88 * scale}C${9.92 * scale} ${16.21 * scale} ${7 * scale} ${11.85 * scale} ${7 * scale} ${9 * scale}Z M${12 * scale} ${11.5 * scale}C${13.3807 * scale} ${11.5 * scale} ${14.5 * scale} ${10.3807 * scale} ${14.5 * scale} ${9 * scale}C${14.5 * scale} ${7.61929 * scale} ${13.3807 * scale} ${6.5 * scale} ${12 * scale} ${6.5 * scale}C${10.6193 * scale} ${6.5 * scale} ${9.5 * scale} ${7.61929 * scale} ${9.5 * scale} ${9 * scale}C${9.5 * scale} ${10.3807 * scale} ${10.6193 * scale} ${11.5 * scale} ${12 * scale} ${11.5 * scale}Z`,
          transform: `translate(${-12 * scale}, ${-22 * scale})`, // Position tip at coordinate (bottom center of marker)
        }
      default:
        pathGenerator = d3.symbol().type(d3.symbolCircle).size(area)
    }
  }

  if (!pathGenerator) {
    return { pathData: d3.symbol().type(d3.symbolCircle).size(area)(), transform: "" }
  }

  return { pathData: pathGenerator(), transform }
}

// Helper to get default format for a type
const getDefaultFormat = (type: "number" | "date" | "state" | "coordinate"): string => {
  switch (type) {
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
  }
}

// Format a number value based on the selected format
const formatNumber = (value: any, format: string): string => {
  if (value === null || value === undefined || value === "") return ""

  let num: number // Declare num here

  const strValue = String(value).trim()

  const parsedNum: number | null = parseCompactNumber(strValue)
  if (parsedNum !== null) {
    num = parsedNum // Assign num here
  } else {
    const cleanedValue = strValue.replace(/[,$%]/g, "")
    num = Number.parseFloat(cleanedValue) // Assign num here
  }

  if (isNaN(num)) {
    return strValue
  }

  switch (format) {
    case "raw":
      return num.toString()
    case "comma":
      return num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 20 })
    case "compact":
      if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + "B"
      if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + "M"
      if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + "K"
      return num.toString()
    case "currency":
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num)
    case "percent":
      return (num * 100).toFixed(0) + "%"
    case "0-decimals":
      return Math.round(num).toLocaleString("en-US")
    case "1-decimal":
      return num.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    case "2-decimals":
      return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    default:
      return num.toString()
  }
}

// Format a date value based on the selected format
const formatDate = (value: any, format: string): string => {
  if (value === null || value === undefined || value === "") return ""

  let date: Date
  if (value instanceof Date) {
    date = value
  } else {
    date = new Date(String(value))
    if (isNaN(date.getTime())) return String(value)
  }

  switch (format) {
    case "yyyy-mm-dd":
      return date.toISOString().split("T")[0]
    case "mm/dd/yyyy":
      return date.toLocaleDateString("en-US")
    case "dd/mm/yyyy":
      return date.toLocaleDateString("en-GB")
    case "mmm-dd-yyyy":
      return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" })
    case "mmmm-dd-yyyy":
      return date.toLocaleDateString("en-US", { month: "long", day: "2-digit", year: "numeric" })
    case "dd-mmm-yyyy":
      return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    case "yyyy":
      return date.getFullYear().toString()
    case "mmm-yyyy":
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    case "mm/dd/yy":
      return date.toLocaleDateString("en-US", { year: "2-digit" })
    case "dd/mm/yy":
      return date.toLocaleDateString("en-GB", { year: "2-digit" })
    default:
      return String(value)
  }
}

// Format a state value based on the selected format
const formatState = (value: any, format: string, geoType: string): string => {
  if (value === null || value === undefined || value === "") return ""

  const str = String(value).trim()

  if (geoType.startsWith("usa-states")) {
    switch (format) {
      case "abbreviated":
        if (str.length === 2 && stateMap[str.toUpperCase()]) {
          return str.toUpperCase()
        }
        const abbr = reverseStateMap[str.toLowerCase()]
        return abbr || str
      case "full":
        if (str.length === 2) {
          return stateMap[str.toUpperCase()] || str
        }
        const fullName = Object.values(stateMap).find((state) => state.toLowerCase() === str.toLowerCase())
        return fullName || str
      default:
        return str
    }
  } else if (geoType.startsWith("canada-provinces")) {
    switch (format) {
      case "abbreviated":
        if (str.length === 2 && canadaProvinceMap[str.toUpperCase()]) {
          return str.toUpperCase()
        }
        const abbr = reverseCanadaProvinceMap[str.toLowerCase()]
        return abbr || str
      case "full":
        if (str.length === 2) {
          return canadaProvinceMap[str.toUpperCase()] || str
        }
        const fullName = Object.values(canadaProvinceMap).find(
          (province) => province.toLowerCase() === str.toLowerCase(),
        )
        return fullName || str
      default:
        return str
    }
  }
  // For counties or world, just return raw for now
  return str
}

// Helper function to format legend values based on column type and format
const formatLegendValue = (
  value: any,
  column: string,
  columnTypes: any,
  columnFormats: any,
  geoType: string,
): string => {
  const type = columnTypes[column] || "text"
  const format = columnFormats[column] || getDefaultFormat(type as "number" | "date" | "state" | "coordinate")

  if (type === "number") {
    return formatNumber(value, format)
  }
  if (type === "date") {
    return formatDate(value, format)
  }
  if (type === "state") {
    return formatState(value, format, geoType)
  }
  return String(value)
}

// Helper function to render the label preview with HTML tag support
const renderLabelPreview = (
  template: string,
  dataRow: DataRowType | GeocodedRow,
  columnTypes: { [key: string]: "text" | "number" | "date" | "coordinate" | "state" },
  columnFormats: { [key: string]: string },
  geoType: string,
): string => {
  if (!template || !dataRow) {
    return ""
  }

  const previewText = template.replace(/{([^}]+)}/g, (match, columnName) => {
    const value = dataRow[columnName]
    if (value === undefined || value === null) {
      return ""
    }
    const type = columnTypes[columnName] || "text"
    const format = columnFormats[columnName] || getDefaultFormat(type as "number" | "date" | "state" | "coordinate")
    return formatLegendValue(value, columnName, columnTypes, columnFormats, geoType)
  })

  return previewText
}

// Helper function for intelligent auto-positioning
const getAutoPosition = (
  x: number,
  y: number,
  symbolSize: number,
  labelWidth: number,
  labelHeight: number,
  svgWidth: number,
  svgHeight: number,
) => {
  const margin = Math.max(8, symbolSize * 0.3) // Increased scaling factor for better spacing
  const edgeBuffer = 20

  // Preferred positions in order: right, left, bottom, top
  const positions = [
    {
      dx: symbolSize / 2 + margin,
      dy: 0,
      anchor: "start",
      baseline: "middle",
      name: "right",
    },
    {
      dx: -(symbolSize / 2 + margin), // Removed labelWidth from calculation for tighter left spacing
      dy: 0,
      anchor: "end", // Changed to "end" for proper right-aligned text
      baseline: "middle",
      name: "left",
    },
    {
      dx: -labelWidth / 2,
      dy: symbolSize / 2 + margin + labelHeight,
      anchor: "start",
      baseline: "hanging",
      name: "bottom",
    },
    {
      dx: -labelWidth / 2,
      dy: -(symbolSize / 2 + margin),
      anchor: "start",
      baseline: "baseline",
      name: "top",
    },
  ]

  // Check each position for validity
  for (const pos of positions) {
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
    ) {
      return pos
    }
  }

  // If no position fits perfectly, return the default (right)
  return positions[0]
}

// Helper function to create formatted text with HTML tag support
const createFormattedText = (
  textElement: d3.Selection<SVGTextElement, any, any, any>,
  labelText: string,
  baseStyles: any,
) => {
  // Clear existing content
  textElement.selectAll("*").remove()
  textElement.text("")

  // Split by line breaks first and filter out empty lines
  const lines = labelText.split(/\n|<br\s*\/?>/i).filter((line) => line.trim() !== "")

  // Calculate vertical offset for centering multi-line text
  const totalLines = lines.length
  const lineHeight = 1.2
  const verticalOffset = totalLines > 1 ? -((totalLines - 1) * lineHeight * 0.5) : 0

  lines.forEach((line, lineIndex) => {
    // Parse HTML tags for each line
    const parseAndCreateSpans = (text: string, parentElement: any, isFirstLine = false) => {
      const htmlTagRegex = /<(\/?)([^>]+)>/g
      let lastIndex = 0
      let match
      const currentStyles = { ...baseStyles }
      let hasAddedContent = false

      while ((match = htmlTagRegex.exec(text)) !== null) {
        // Add text before the tag
        if (match.index > lastIndex) {
          const textContent = text.substring(lastIndex, match.index)
          if (textContent) {
            const tspan = parentElement.append("tspan").text(textContent)
            if (isFirstLine && lineIndex === 0 && !hasAddedContent) {
              tspan.attr("dy", `${verticalOffset}em`)
            } else if (lineIndex > 0 && !hasAddedContent) {
              tspan.attr("x", 0).attr("dy", `${lineHeight}em`)
            }
            applyStylesToTspan(tspan, currentStyles)
            hasAddedContent = true
          }
        }

        const isClosing = match[1] === "/"
        const tagName = match[2].toLowerCase()

        if (!isClosing) {
          // Opening tag - update current styles
          switch (tagName) {
            case "b":
            case "strong":
              currentStyles.fontWeight = "bold"
              break
            case "i":
            case "em":
              currentStyles.fontStyle = "italic"
              break
            case "u":
            case "s":
            case "strike":
              currentStyles.textDecoration = (currentStyles.textDecoration || "") + " line-through"
              break
          }
        } else {
          // Closing tag - revert styles
          switch (tagName) {
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
          }
          if (currentStyles.textDecoration === "") delete currentStyles.textDecoration
        }

        lastIndex = htmlTagRegex.lastIndex
      }

      // Add remaining text after last tag
      if (lastIndex < text.length) {
        const textContent = text.substring(lastIndex)
        if (textContent) {
          const tspan = parentElement.append("tspan").text(textContent)
          if (isFirstLine && lineIndex === 0) {
            tspan.attr("dy", `${verticalOffset}em`)
          } else if (lineIndex > 0) {
            tspan.attr("x", 0).attr("dy", `${lineHeight}em`)
          }
          applyStylesToTspan(tspan, currentStyles)
          hasAddedContent = true
        }
      }

      // If no HTML tags found and we have content, add the entire text as single tspan
      if (lastIndex === 0 && text.trim() && !hasAddedContent) {
        const tspan = parentElement.append("tspan").text(text)
        if (isFirstLine && lineIndex === 0) {
          tspan.attr("dy", `${verticalOffset}em`)
        } else if (lineIndex > 0) {
          tspan.attr("x", 0).attr("dy", `${lineHeight}em`)
        }
        applyStylesToTspan(tspan, currentStyles)
        hasAddedContent = true
      }
    }

    const applyStylesToTspan = (tspan: any, styles: any) => {
      if (styles.fontWeight) tspan.attr("font-weight", styles.fontWeight)
      if (styles.fontStyle) tspan.attr("font-style", styles.fontStyle)
      if (styles.textDecoration) tspan.attr("text-decoration", styles.textDecoration)
    }

    parseAndCreateSpans(line, textElement, lineIndex === 0)
  })
}

/**
 * Canada topo files come with wildly different object names.
 * This inspects the object keys and aliases them so that
 *   data.objects.provinces   ⟶ provincial geometries (adm-1 level)
 *   data.objects.nation      ⟶ Canada outline
 */
function normaliseCanadaObjects(data: TopoJSONData) {
  const objects = data.objects ?? {}

  // Detect a candidate for provinces (adm1)
  const provincesKey = Object.keys(objects).find((k) => /prov|adm1|can_adm1|canada_provinces/i.test(k)) ?? null

  // Detect a candidate for the national outline
  const nationKey = Object.keys(objects).find((k) => /nation|country|canada|can/i.test(k)) ?? null

  // Only alias when we actually find something
  if (provincesKey && !objects.provinces) {
    objects.provinces = objects[provincesKey]
  }
  if (nationKey && !objects.nation) {
    objects.nation = objects[nationKey]
  }

  data.objects = objects
  return data
}

/**
 * Try a list of candidate URLs until we find one that contains the
 * expected TopoJSON object(s).  Returns null if all attempts fail.
 */
async function fetchTopoJSON(urls: string[], expected: string[]): Promise<TopoJSONData | null> {
  for (const url of urls) {
    try {
      const res = await fetch(url)
      if (!res.ok) continue
      const data = (await res.json()) as TopoJSONData
      console.log(`Fetched data from ${url}. Objects found:`, Object.keys(data.objects || {})) // Debugging
      const ok = expected.every((k) => data.objects && data.objects[k] && Object.keys(data.objects[k]).length > 0) // Check if object exists and is not empty
      if (ok) return data
    } catch (error) {
      console.error(`Error fetching or parsing ${url}:`, error) // More detailed error logging
      // ignore and try the next URL
    }
  }
  return null
}

export function MapPreview({
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
  selectedGeography, // Destructure new prop
  selectedProjection, // Destructure new prop
  clipToCountry, // Destructure new prop
}: MapPreviewProps) {
  console.log("=== MAP PREVIEW RENDER DEBUG ===")
  console.log("Map type:", mapType)
  console.log("Custom map data length:", customMapData?.length || 0)
  console.log("Dimension settings:", dimensionSettings)
  console.log("Selected Geography:", selectedGeography)
  console.log("Selected Projection:", selectedProjection)
  console.log("Clip to Country:", clipToCountry)

  const [isExpanded, setIsExpanded] = useState(true)
  const [geoAtlasData, setGeoAtlasData] = useState<TopoJSONData | null>(null) // Renamed from usData
  const [isLoading, setIsLoading] = useState(true)
  const svgRef = useRef<SVGSVGElement>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Load TopoJSON data based on selectedGeography
  useEffect(() => {
    const loadGeoData = async () => {
      try {
        setIsLoading(true)
        setGeoAtlasData(null) // Clear previous data immediately

        let data: TopoJSONData | null = null

        switch (selectedGeography) {
          case "usa-states":
            data = await fetchTopoJSON(
              [
                // states file
                "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json",
                "https://unpkg.com/us-atlas@3/states-10m.json",
              ],
              ["nation", "states"],
            )
            break

          case "usa-counties":
            data = await fetchTopoJSON(
              [
                // counties file
                "https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json",
                "https://unpkg.com/us-atlas@3/counties-10m.json",
              ],
              ["nation", "counties"],
            )
            if (!data) {
              toast({
                title: "Map data error",
                description: "Couldn’t load US county boundaries. Please retry or check your connection.",
                variant: "destructive",
                duration: 4000,
              })
              return
            }
            break
          case "usa-nation":
          case "canada-nation":
            // For single nation, load higher detail world-atlas
            data = await fetchTopoJSON(
              [
                "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-10m.json", // Higher detail
                "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json",
                "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
                "https://unpkg.com/world-atlas@2/countries-10m.json",
              ],
              ["countries"], // Always expect 'countries' for world-atlas
            )
            if (!data) {
              toast({
                title: "Map data error",
                description: "Couldn’t load country boundaries. Please retry or check your connection.",
                variant: "destructive",
                duration: 4000,
              })
              return
            }
            break
          case "world":
            // For world, load lower detail world-atlas
            data = await fetchTopoJSON(
              [
                "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json",
                "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json",
                "https://unpkg.com/world-atlas@2/countries-110m.json",
              ],
              ["countries"], // Always expect 'countries' for world-atlas
            )
            if (!data) {
              toast({
                title: "Map data error",
                description: "Couldn’t load world country boundaries. Please retry or check your connection.",
                variant: "destructive",
                duration: 4000,
              })
              return
            }
            break

          case "canada-provinces":
            // This still loads Canada provinces atlas
            data = await fetchTopoJSON(
              [
                "https://gist.githubusercontent.com/Brideau/2391df60938462571ca9/raw/f5a1f3b47ff671eaf2fb7e7b798bacfc6962606a/canadaprovtopo.json",
                "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/canada/canada-provinces.json",
                "https://cdn.jsdelivr.net/gh/deldersveld/topojson@master/countries/canada/canada-provinces.json",
              ],
              [], // Accept any objects, normalise below
            )
            if (!data) {
              toast({
                title: "Map data error",
                description: "Couldn’t load Canadian province boundaries.",
                variant: "destructive",
                duration: 4000,
              })
              setGeoAtlasData(null)
              return
            }
            data = normaliseCanadaObjects(data) // Normalise after fetching

            // No longer return here if provinces are missing, allow fallback to nation outline
            if (!data.objects?.provinces) {
              console.warn(
                "[map-studio] Canada topojson has no provincial shapes – falling back to nation view.",
                Object.keys(data.objects ?? {}),
              )
            }
            break

          default:
            setGeoAtlasData(null)
            setIsLoading(false)
            return
        }
        setGeoAtlasData(data)
      } catch (error) {
        console.error("Error loading geo data:", error)
        toast({
          title: "Map loading failed",
          description: `Failed to load map data for ${selectedGeography}.`,
          variant: "destructive",
          duration: 3000,
        })
        setGeoAtlasData(null)
      } finally {
        setIsLoading(false)
      }
    }
    loadGeoData()
  }, [selectedGeography, toast]) // Re-run when selectedGeography changes

  useEffect(() => {
    console.log("=== MAP PREVIEW USEEFFECT TRIGGERED ===")
    console.log("Map type:", mapType)
    console.log("Custom map data length:", customMapData?.length || 0)
    console.log("Geo atlas data loaded:", !!geoAtlasData)

    if (!svgRef.current || !mapContainerRef.current) {
      console.log("SVG ref or container ref not ready")
      return
    }

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = 975

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
    const shouldShowChoroplethColorLegend = shouldRenderChoropleth && dimensionSettings.choropleth.colorBy

    if (shouldShowSymbolSizeLegend) legendHeight += 80
    if (shouldShowSymbolColorLegend) legendHeight += 80
    if (shouldShowChoroplethColorLegend) legendHeight += 80

    const mapHeight = 610
    const height = mapHeight + legendHeight

    mapContainerRef.current.style.backgroundColor = stylingSettings.base.mapBackgroundColor

    svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("style", "max-width: 100%; height: auto;")

    let projection: d3.GeoProjection
    if (selectedProjection === "albersUsa") {
      projection = d3
        .geoAlbersUsa()
        .scale(1300)
        .translate([width / 2, mapHeight / 2])
      console.log(`Using Albers USA projection with scale: 1300, translate: [${width / 2}, ${mapHeight / 2}]`)
    } else if (selectedProjection === "albers") {
      // Albers projection (suitable for single countries or continents)
      projection = d3
        .geoAlbers()
        .scale(1300) // Default scale, will be adjusted by fitSize if clipping
        .translate([width / 2, mapHeight / 2])
      console.log(`Using Albers projection with scale: 1300, translate: [${width / 2}, ${mapHeight / 2}]`)
    } else if (selectedProjection === "mercator") {
      // Adjust scale for Mercator to fit the world
      projection = d3
        .geoMercator()
        .scale(150)
        .translate([width / 2, mapHeight / 2])
    } else if (selectedProjection === "equalEarth") {
      // Adjust scale for Equal Earth to fit the world
      projection = d3
        .geoEqualEarth()
        .scale(150)
        .translate([width / 2, mapHeight / 2])
    } else {
      // Fallback to Albers USA
      projection = d3
        .geoAlbersUsa()
        .scale(1300)
        .translate([width / 2, mapHeight / 2])
    }

    const path = d3.geoPath().projection(projection)

    // PRIORITY: Custom map takes precedence if custom map data exists
    if (customMapData && customMapData.trim().length > 0) {
      console.log("=== CUSTOM MAP RENDERING START ===")
      console.log("Custom map data length:", customMapData.length)

      try {
        const parser = new DOMParser()
        const doc = parser.parseFromString(customMapData, "image/svg+xml")

        const errorNode = doc.querySelector("parsererror")
        if (errorNode) {
          console.error("SVG parsing error:", errorNode.textContent)
          toast({
            title: "Custom Map Error",
            description: `SVG parsing error: ${errorNode.textContent}`,
            variant: "destructive",
            duration: 5000,
          })
          return
        }

        const customMapElement = doc.documentElement
        console.log("Parsed SVG element:", customMapElement.tagName)

        // Try multiple approaches to import the custom map
        const mapGroupToImport = d3.select(customMapElement).select("#Map")
        if (!mapGroupToImport.empty()) {
          const importedMapGroup = document.importNode(mapGroupToImport.node()!, true)
          svg.node()?.appendChild(importedMapGroup)
          console.log("✅ Imported #Map group successfully")
        } else {
          console.log("No #Map group found, importing entire SVG content")
          const mapGroup = svg.append("g").attr("id", "Map")
          Array.from(customMapElement.children).forEach((child) => {
            const importedChild = document.importNode(child, true)
            mapGroup.node()?.appendChild(importedChild)
          })
          console.log("✅ Imported", customMapElement.children.length, "elements into new Map group")
        }

        // Look for Nations and States/Counties/Provinces groups
        let nationsGroup = svg.select("#Nations")
        let statesOrCountiesGroup = svg.select("#States")

        if (nationsGroup.empty()) {
          nationsGroup = svg.select("#Countries")
        }
        if (statesOrCountiesGroup.empty()) {
          statesOrCountiesGroup = svg.select("#Counties, #Provinces, #Regions")
        }

        console.log("Nations group found:", !nationsGroup.empty(), "Paths:", nationsGroup.selectAll("path").size())
        console.log(
          "States/Counties/Provinces group found:",
          !statesOrCountiesGroup.empty(),
          "Paths:",
          statesOrCountiesGroup.selectAll("path").size(),
        )

        // Apply styling
        if (!nationsGroup.empty()) {
          nationsGroup
            .selectAll("path")
            .attr("fill", stylingSettings.base.nationFillColor)
            .attr("stroke", stylingSettings.base.nationStrokeColor)
            .attr("stroke-width", stylingSettings.base.nationStrokeWidth)
        }

        if (!statesOrCountiesGroup.empty()) {
          statesOrCountiesGroup
            .selectAll("path")
            .attr("fill", stylingSettings.base.defaultStateFillColor)
            .attr("stroke", stylingSettings.base.defaultStateStrokeColor)
            .attr("stroke-width", stylingSettings.base.defaultStateStrokeWidth)
        }

        console.log("=== CUSTOM MAP RENDERING COMPLETE ===")
      } catch (error: any) {
        console.error("Error processing custom map data:", error)
        toast({
          title: "Custom Map Error",
          description: `Error processing custom map data: ${error.message}`,
          variant: "destructive",
          duration: 5000,
        })
      }
    } else if (geoAtlasData) {
      // Render standard US or World map
      console.log("=== STANDARD MAP RENDERING START ===")

      const mapGroup = svg.append("g").attr("id", "Map")
      const nationsGroup = mapGroup.append("g").attr("id", "Nations")
      const statesOrCountiesGroup = mapGroup.append("g").attr("id", "StatesOrCounties") // New group name

      let geoFeatures: any[] = []
      let nationMesh: any = null
      let countryFeatureForClipping: any = null // To store the feature for clipping

      const { objects } = geoAtlasData as TopoJSONData
      if (!objects) {
        console.error("TopoJSON file has no 'objects' property:", geoAtlasData)
        toast({
          title: "Invalid TopoJSON",
          description: "The downloaded map file is missing required data.",
          variant: "destructive",
        })
        return
      }

      // Utility ─ find a country feature by several possible identifiers
      function findCountryFeature(features: any[], candidates: (string | number)[]) {
        return features.find((f) => {
          const props = f.properties ?? {}
          return candidates.some((c) =>
            [props.name, props.name_long, props.admin, props.iso_a3, String(f.id)]
              .filter(Boolean)
              .map((v) => v.toString().toLowerCase())
              .includes(String(c).toLowerCase()),
          )
        })
      }

      // Determine nation mesh and countryFeatureForClipping based on selectedGeography
      if (selectedGeography === "usa-states") {
        // US States: use us-atlas with states + nation outline
        if (!objects.nation || !objects.states) {
          console.error("US atlas missing 'nation' or 'states' object:", objects)
          toast({
            title: "Map data error",
            description: "US states map data is incomplete.",
            variant: "destructive",
            duration: 4000,
          })
          return
        }
        nationMesh = topojson.mesh(geoAtlasData, objects.nation)
        countryFeatureForClipping = topojson.feature(geoAtlasData, objects.nation)
        geoFeatures = topojson.feature(geoAtlasData, objects.states).features
      } else if (selectedGeography === "usa-counties") {
        // US Counties: use us-atlas with counties + nation outline
        if (!objects.nation || !objects.counties) {
          console.error("US atlas missing 'nation' or 'counties' object:", objects)
          toast({
            title: "Map data error",
            description: "US counties map data is incomplete.",
            variant: "destructive",
            duration: 4000,
          })
          return
        }
        nationMesh = topojson.mesh(geoAtlasData, objects.nation)
        countryFeatureForClipping = topojson.feature(geoAtlasData, objects.nation)
        geoFeatures = topojson.feature(geoAtlasData, objects.counties).features
      } else if (selectedGeography === "canada-provinces") {
        // Canada Provinces: use canada-specific atlas
        if (objects.provinces) {
          // Has provinces - render them with nation outline
          const nationSource = objects.nation || objects.countries
          if (nationSource) {
            nationMesh = topojson.mesh(geoAtlasData, nationSource)
            countryFeatureForClipping = topojson.feature(geoAtlasData, nationSource)
          }
          geoFeatures = topojson.feature(geoAtlasData, objects.provinces).features
        } else {
          // No provinces - fall back to nation-only view using world atlas
          console.warn("[map-studio] No provinces found, falling back to Canada nation view")
          if (objects.countries) {
            const allCountries = topojson.feature(geoAtlasData, objects.countries).features
            countryFeatureForClipping = findCountryFeature(allCountries, ["Canada", "CAN", 124])
            if (countryFeatureForClipping) {
              nationMesh = topojson.mesh(geoAtlasData, countryFeatureForClipping)
            }
          }
          geoFeatures = []
        }
      } else if (selectedGeography === "usa-nation" || selectedGeography === "canada-nation") {
        // USA Nation or Canada Nation: use world atlas, find specific country
        if (objects.countries) {
          const allCountries = topojson.feature(geoAtlasData, objects.countries).features
          const targetCountryName = selectedGeography === "usa-nation" ? "United States" : "Canada"
          const specificCountryFeature = findCountryFeature(allCountries, [
            targetCountryName,
            targetCountryName === "United States" ? "USA" : "CAN",
            targetCountryName === "United States" ? 840 : 124,
          ])
          if (specificCountryFeature) {
            nationMesh = topojson.mesh(geoAtlasData, specificCountryFeature)
            countryFeatureForClipping = specificCountryFeature // Set for clipping
            geoFeatures = [specificCountryFeature] // Render this single feature
          } else {
            console.warn(`[map-studio] Could not find ${targetCountryName} in world atlas.`)
            toast({
              title: "Map data error",
              description: `Could not find ${targetCountryName} in the world map data.`,
              variant: "destructive",
              duration: 4000,
            })
            // Fallback to rendering all countries if specific country not found
            nationMesh = topojson.mesh(geoAtlasData, objects.countries)
            geoFeatures = topojson.feature(geoAtlasData, objects.countries).features
          }
        }
      } else if (selectedGeography === "world") {
        // World: use world atlas, render all countries
        const countriesSource = objects.countries || objects.land
        if (countriesSource) {
          nationMesh = topojson.mesh(geoAtlasData, countriesSource, (a: any, b: any) => a !== b)
          countryFeatureForClipping = topojson.feature(geoAtlasData, countriesSource)
          geoFeatures = topojson.feature(geoAtlasData, countriesSource).features
        } else {
          console.error("World atlas missing 'countries' or 'land' object:", objects)
          toast({
            title: "Map data error",
            description: "The world map data is incomplete.",
            variant: "destructive",
            duration: 4000,
          })
          return
        }
      }

      // Apply clipping and projection fitting
      if (clipToCountry && countryFeatureForClipping && selectedProjection !== "albersUsa") {
        const clipPathId = "clip-path-country"
        const defs = svg.append("defs")
        defs.append("clipPath").attr("id", clipPathId).append("path").attr("d", path(countryFeatureForClipping))
        mapGroup.attr("clip-path", `url(#${clipPathId})`)

        // Fit projection to the specific country/region
        projection.fitSize([width, mapHeight], countryFeatureForClipping)
        path.projection(projection) // Update path generator with new projection
        console.log(
          `Projection fitted to bounds. New scale: ${projection.scale()}, translate: ${projection.translate()}`,
        )
      } else if (geoFeatures.length > 0 && selectedProjection !== "albersUsa") {
        // If no clipping but we have sub-features, fit to those bounds
        const featureCollection = { type: "FeatureCollection", features: geoFeatures }
        projection.fitSize([width, mapHeight], featureCollection)
        path.projection(projection)
        console.log(
          `Projection fitted to sub-features. New scale: ${projection.scale()}, translate: ${projection.translate()}`,
        )
      } else {
        mapGroup.attr("clip-path", null) // Remove clip path if not enabled
        console.log("Using default projection scale and translate.")
      }

      // Only proceed if we have a nationMesh or geoFeatures to draw
      if (!nationMesh && geoFeatures.length === 0) {
        console.warn("No map features or nation mesh to render for selected geography.")
        toast({
          title: "Map data unavailable",
          description: `No map data found for ${selectedGeography}.`,
          variant: "destructive",
          duration: 3000,
        })
        return
      }

      // Render the main nation outline (or single country outline)
      if (nationMesh) {
        nationsGroup
          .append("path")
          .attr(
            "id",
            selectedGeography === "usa-nation"
              ? "Country-US"
              : selectedGeography === "canada-nation"
                ? "Country-CA"
                : "World-Outline", // This ID might need to be more dynamic for world countries
          )
          .attr("fill", stylingSettings.base.nationFillColor)
          .attr("stroke", stylingSettings.base.nationStrokeColor)
          .attr("stroke-width", stylingSettings.base.nationStrokeWidth)
          .attr("stroke-linejoin", "round")
          .attr("stroke-linecap", "round")
          .attr("d", path(nationMesh))
        console.log(
          `Nation mesh rendered with fill: ${stylingSettings.base.nationFillColor}, stroke: ${stylingSettings.base.nationStrokeColor}`,
        )
      }

      // Render sub-features (states, counties, provinces, or individual countries for world map)
      console.log("=== SUB-FEATURE FEATURES DEBUG ===")
      console.log("Number of features:", geoFeatures.length)
      geoFeatures.slice(0, 5).forEach((feature, index) => {
        console.log(`Feature ${index}:`, {
          id: feature.id,
          properties: feature.properties,
          postal: feature.properties?.postal,
          name: feature.properties?.name,
        })
      })

      statesOrCountiesGroup
        .selectAll("path")
        .data(geoFeatures)
        .join("path")
        .attr("id", (d) => {
          const identifier = d.properties?.postal || d.properties?.name || d.id // Prioritize postal, then name, then id
          let prefix = ""
          if (selectedGeography === "usa-states") prefix = "State"
          else if (selectedGeography === "usa-counties") prefix = "County"
          else if (selectedGeography === "canada-provinces") prefix = "Province"
          else if (
            selectedGeography === "world" ||
            selectedGeography === "usa-nation" ||
            selectedGeography === "canada-nation"
          )
            prefix = "Country" // For world, each feature is a country

          const featureId = `${prefix}-${identifier || ""}`
          console.log(`Creating feature path with ID: ${featureId}`)
          return featureId
        })
        .attr("fill", stylingSettings.base.defaultStateFillColor)
        .attr("stroke", stylingSettings.base.defaultStateStrokeColor)
        .attr("stroke-width", stylingSettings.base.defaultStateStrokeWidth)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", path)

      console.log("=== STANDARD MAP RENDERING COMPLETE ===")
    }

    // Apply choropleth data if available
    console.log("=== CHOROPLETH RENDERING DEBUG ===")
    console.log("Should render choropleth:", shouldRenderChoropleth)
    console.log("Choropleth data exists:", choroplethDataExists)
    console.log("State column:", dimensionSettings?.choropleth?.stateColumn)
    console.log("Color by:", dimensionSettings?.choropleth?.colorBy)
    console.log("Choropleth data length:", choroplethData.length)

    if (shouldRenderChoropleth) {
      // Build state data map
      const geoDataMap = new Map()

      console.log("=== Building geo data map for choropleth ===")
      choroplethData.forEach((d, index) => {
        const rawGeoValue = String(d[dimensionSettings.choropleth.stateColumn] || "")
        if (!rawGeoValue.trim()) return

        // Normalize geo value based on selected geography
        const normalizedKey = normalizeGeoIdentifier(rawGeoValue, selectedGeography)

        const value =
          dimensionSettings.choropleth.colorScale === "linear"
            ? getNumericValue(d, dimensionSettings.choropleth.colorBy)
            : String(d[dimensionSettings.choropleth.colorBy])

        if (
          value !== null &&
          (dimensionSettings.choropleth.colorScale === "linear" ? !isNaN(value as number) : value)
        ) {
          geoDataMap.set(normalizedKey, value)
          console.log(`✓ Mapped ${rawGeoValue} → ${normalizedKey} = ${value}`)
        }
      })

      console.log("Total mapped geos:", geoDataMap.size)
      console.log("Geo data map:", Array.from(geoDataMap.entries()))

      // Create color scale
      if (dimensionSettings?.choropleth?.colorScale === "linear") {
        const domain = [dimensionSettings.choropleth.colorMinValue, dimensionSettings.choropleth.colorMaxValue]
        const rangeColors = [
          dimensionSettings.choropleth.colorMinColor || stylingSettings.base.defaultStateFillColor,
          dimensionSettings.choropleth.colorMaxColor || stylingSettings.base.defaultStateFillColor,
        ]

        if (dimensionSettings.choropleth.colorMidColor) {
          domain.splice(1, 0, dimensionSettings.choropleth.colorMidValue)
          rangeColors.splice(1, 0, dimensionSettings.choropleth.colorMidColor)
        }
        choroplethColorScale = d3.scaleLinear().domain(domain).range(rangeColors)
        console.log("Created linear color scale with domain:", domain, "range:", rangeColors)
      } else {
        const uniqueDataCategories = getUniqueValues(dimensionSettings.choropleth.colorBy, choroplethData)
        const colorMap = new Map()
        dimensionSettings?.choropleth?.categoricalColors?.forEach((item: any, index: number) => {
          const dataCategory = uniqueDataCategories[index]
          if (dataCategory !== undefined) {
            colorMap.set(String(dataCategory), item.color)
          }
        })
        choroplethColorScale = (value: any) => colorMap.get(String(value)) || stylingSettings.base.defaultStateFillColor
        console.log("Created categorical color scale with map:", Array.from(colorMap.entries()))
      }

      // Apply colors to state/country/county/province paths and groups
      const mapGroup = svg.select("#Map")
      if (!mapGroup.empty()) {
        console.log("Found map group, applying choropleth colors...")
        const featuresColored = 0

        mapGroup.selectAll("path, g").each(function (this: SVGElement) {
          const element = d3.select(this)
          const id = element.attr("id")
          let featureKey: string | null = null

          // Determine the effective ID: prioritize element's own ID, then parent's ID if it's a path without ID
          let effectiveId = id
          if (this.tagName === "path" && !effectiveId && this.parentElement && this.parentElement.tagName === "g") {
            effectiveId = d3.select(this.parentElement).attr("id")
          }

          if (effectiveId) {
            if (customMapData) {
              const extractedCandidate = extractCandidateFromSVGId(effectiveId)
              featureKey = normalizeGeoIdentifier(extractedCandidate || effectiveId, selectedGeography)
            } else {
              // For standard TopoJSON maps (which use d.id on paths)
              const d = element.datum() as any // Here, d.properties.name or d.id is valid for TopoJSON
              if (selectedGeography.startsWith("usa-states")) {
                featureKey = d?.id ? normalizeGeoIdentifier(String(d.id), selectedGeography) : null // Use d.id for TopoJSON US states
              } else if (selectedGeography.startsWith("usa-counties")) {
                featureKey = d?.id ? normalizeGeoIdentifier(String(d.id), selectedGeography) : null // Use d.id (FIPS) for US counties
