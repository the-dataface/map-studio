"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import * as d3 from "d3"
import * as topojson from "topojson-client"
import type { DataRow, GeocodedRow } from "@/app/page"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Download, Copy } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"

interface MapPreviewProps {
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
  selectedGeography: "usa" | "world" // New prop
  selectedProjection: "albersUsa" | "mercator" | "equalEarth" // New prop
}

interface TopoJSONData {
  type: string
  objects: {
    nation: any
    states?: any // states is optional for world map
    countries?: any // countries is optional for US map
  }
  arcs: any[]
}

interface ColumnType {
  [key: string]: "text" | "number" | "date" | "coordinate" | "state"
}

interface ColumnFormat {
  [key: string]: string
}

interface StylingSettings {
  activeTab: "base" | "symbol" | "choropleth"
  base: {
    mapBackgroundColor: string
    nationFillColor: string
    nationStrokeColor: string
    nationStrokeWidth: number
    defaultStateFillColor: string
    defaultStateStrokeColor: string // Corrected type to string
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
    customSvgPath?: string
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

// Enhanced state matching function
const normalizeStateValue = (value: string): string => {
  if (!value) return ""

  const trimmed = value.trim()

  // If it's already a 2-letter abbreviation, return uppercase
  if (trimmed.length === 2 && stateMap[trimmed.toUpperCase()]) {
    return trimmed.toUpperCase()
  }

  // If it's a full state name, convert to abbreviation
  const lowerValue = trimmed.toLowerCase()
  const abbreviation = reverseStateMap[lowerValue]
  if (abbreviation) {
    return abbreviation
  }

  // Try partial matching for state names
  for (const [abbr, fullName] of Object.entries(stateMap)) {
    if (fullName.toLowerCase() === lowerValue) {
      return abbr
    }
  }

  // Return original value if no match found
  return trimmed.toUpperCase()
}

// Enhanced function to extract state from SVG ID
const extractStateFromSVGId = (id: string): string | null => {
  if (!id) return null

  console.log(`Extracting state from SVG ID: "${id}"`)

  // Try different patterns for state extraction
  const patterns = [
    /^State-(\d{2})$/i, // State-01 (FIPS code)
    /^State-([A-Z]{2})$/i, // State-CA
    /^State-([a-zA-Z\s]+)$/i, // State-California
    /^(\d{2})$/i, // 01 (FIPS code directly)
    /^([A-Z]{2})$/i, // CA
    /^([a-zA-Z\s]+)$/i, // California
    /State.*?([A-Z]{2})$/i, // Any State prefix with 2-letter code at end
    /State.*?([a-zA-Z\s]{4,})$/i, // Any State prefix with longer name
  ]

  for (const pattern of patterns) {
    const match = id.match(pattern)
    if (match && match[1]) {
      const extracted = match[1].trim()
      let normalized: string

      // Check if the extracted value is a FIPS code
      if (pattern.source.includes("\\d{2}")) {
        const fipsAbbr = fipsToStateAbbrMap[extracted]
        if (fipsAbbr) {
          normalized = fipsAbbr
          console.log(
            `Pattern matched FIPS: ${pattern} -> extracted: "${extracted}" -> converted to abbr: "${normalized}"`,
          )
        } else {
          console.log(`Pattern matched FIPS: ${pattern} -> extracted: "${extracted}" but no FIPS mapping found.`)
          continue
        }
      } else {
        normalized = normalizeStateValue(extracted)
        console.log(`Pattern matched: ${pattern} -> extracted: "${extracted}" -> normalized: "${normalized}"`)
      }

      // Verify the normalized value is a valid state abbreviation
      if (stateMap[normalized]) {
        return normalized
      }
    }
  }

  console.log(`No valid state extracted from ID: "${id}"`)
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

const getNumericValue = (row: DataRow | GeocodedRow, column: string): number | null => {
  const rawValue = String(row[column] || "").trim()
  let parsedNum: number | null = parseCompactNumber(rawValue)

  if (parsedNum === null) {
    const cleanedValue = rawValue.replace(/[,$%]/g, "")
    parsedNum = Number.parseFloat(cleanedValue)
  }
  return isNaN(parsedNum) ? null : parsedNum
}

const getUniqueValues = (column: string, data: (DataRow | GeocodedRow)[]): any[] => {
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

  const strValue = String(value).trim()

  // Try compact notation first (e.g. 1.2M)
  const compact = parseCompactNumber(strValue)
  let num: number

  if (compact !== null) {
    num = compact
  } else {
    const cleaned = strValue.replace(/[,$%]/g, "")
    num = Number.parseFloat(cleaned)
    if (isNaN(num)) return strValue
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
const formatState = (value: any, format: string): string => {
  if (value === null || value === undefined || value === "") return ""

  const str = String(value).trim()

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
}

// Helper function to format legend values based on column type and format
const formatLegendValue = (value: any, column: string, columnTypes: any, columnFormats: any): string => {
  const type = columnTypes[column] || "text"
  const format = columnFormats[column]

  if (type === "number" && format) {
    return formatNumber(value, format)
  }
  if (type === "date" && format) {
    return formatDate(value, format)
  }
  if (type === "state" && format) {
    return formatState(value, format)
  }
  return String(value)
}

// Helper function to render the label preview with HTML tag support
const renderLabelPreview = (
  template: string,
  dataRow: DataRow | GeocodedRow,
  columnTypes: { [key: string]: "text" | "number" | "date" | "coordinate" | "state" },
  columnFormats: { [key: string]: string },
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
    return formatLegendValue(value, columnName, columnTypes, columnFormats)
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
              currentStyles.textDecoration = (currentStyles.textDecoration || "") + " underline"
              break
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
          if (isFirstLine && lineIndex === 0 && !hasAddedContent) {
            tspan.attr("dy", `${verticalOffset}em`)
          } else if (lineIndex > 0 && !hasAddedContent) {
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
}: MapPreviewProps) {
  console.log("=== MAP PREVIEW RENDER DEBUG ===")
  console.log("Map type:", mapType)
  console.log("Custom map data length:", customMapData?.length || 0)
  console.log("Dimension settings:", dimensionSettings)
  console.log("Selected Geography:", selectedGeography)
  console.log("Selected Projection:", selectedProjection)

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
        let dataUrl = ""
        if (selectedGeography === "usa") {
          // Use the unprojected states-10m.json for USA
          dataUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"
        } else if (selectedGeography === "world") {
          dataUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
        }

        if (dataUrl) {
          const response = await fetch(dataUrl)
          const data = await response.json()
          setGeoAtlasData(data)
        } else {
          setGeoAtlasData(null)
        }
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

    // Ensure topoType is always defined even if we render a custom SVG first
    let topoType: "usa" | "world" = selectedGeography

    if (!svgRef.current || !mapContainerRef.current) {
      console.log("SVG ref or container ref not ready")
      return
    }

    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove()

    const width = 975

    // Create scales that will be used by both symbols and legends
    let sizeScale: any = null
    let symbolColorScale: any = null
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

        // Look for Nations and States groups
        let nationsGroup = svg.select("#Nations")
        let statesGroup = svg.select("#States")

        if (nationsGroup.empty()) {
          nationsGroup = svg.select("#Countries")
        }
        if (statesGroup.empty()) {
          statesGroup = svg.select("#Provinces, #Regions")
        }

        console.log("Nations group found:", !nationsGroup.empty(), "Paths:", nationsGroup.selectAll("path").size())
        console.log("States group found:", !statesGroup.empty(), "Paths:", statesGroup.selectAll("path").size())

        // Apply styling
        if (!nationsGroup.empty()) {
          nationsGroup
            .selectAll("path")
            .attr("fill", stylingSettings.base.nationFillColor)
            .attr("stroke", stylingSettings.base.nationStrokeColor)
            .attr("stroke-width", stylingSettings.base.nationStrokeWidth)
        }

        if (!statesGroup.empty()) {
          statesGroup
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
      // Determine atlas type
      topoType = geoAtlasData.objects.countries ? "world" : "usa"

      // Render standard US or World map
      console.log("=== STANDARD MAP RENDERING START ===")

      const mapGroup = svg.append("g").attr("id", "Map")
      const nationsGroup = mapGroup.append("g").attr("id", "Nations")
      const statesGroup = mapGroup.append("g").attr("id", "States") // This group will hold states or countries

      let geoFeatures: any[] = []
      let nationMesh: any = null

      // Ensure expected TopoJSON objects exist before processing
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

      /**
       * The file might not match the UI's `selectedGeography`.
       *  • If it has `objects.countries` we treat it as a WORLD file.
       *  • Otherwise, if it has `objects.states`, we treat it as a USA file.
       */
      // const topoType: "usa" | "world" = objects.countries ? "world" : "usa"

      if (!objects) {
        console.error("TopoJSON file has no 'objects' property:", geoAtlasData)
        toast({
          title: "Invalid TopoJSON",
          description: "The downloaded map file is missing required data.",
          variant: "destructive",
        })
        return
      }

      if (topoType === "usa") {
        if (!objects.states || !objects.nation) {
          console.error("US atlas missing 'states' or 'nation' objects:", objects)
          toast({
            title: "Atlas format error",
            description: "Could not find states/nation layers in US-atlas file.",
            variant: "destructive",
          })
          return
        }
        geoFeatures = topojson.feature(geoAtlasData, objects.states).features
        nationMesh = topojson.mesh(geoAtlasData, objects.nation)
      } else if (topoType === "world") {
        if (!objects.countries) {
          console.error("World atlas missing 'countries' object:", objects)
          toast({
            title: "Atlas format error",
            description: "Could not find country layer in World-atlas file.",
            variant: "destructive",
          })
          return
        }
        geoFeatures = topojson.feature(geoAtlasData, objects.countries).features
        nationMesh = topojson.mesh(geoAtlasData, objects.countries, (a: any, b: any) => a !== b)
      } else {
        // Unknown geography – bail out gracefully
        toast({
          title: "Unsupported geography",
          description: `No renderer for “${selectedGeography}”.`,
        })
        return
      }

      nationsGroup
        .append("path")
        .attr("id", topoType === "usa" ? "Country-US" : "World-Outline")
        .attr("fill", stylingSettings.base.nationFillColor)
        .attr("stroke", stylingSettings.base.nationStrokeColor)
        .attr("stroke-width", stylingSettings.base.nationStrokeWidth)
        .attr("stroke-linejoin", "round")
        .attr("stroke-linecap", "round")
        .attr("d", path(nationMesh))

      console.log("=== STATE/COUNTRY FEATURES DEBUG ===")
      console.log("Number of features:", geoFeatures.length)
      geoFeatures.slice(0, 5).forEach((feature, index) => {
        console.log(`Feature ${index}:`, {
          id: feature.id,
          properties: feature.properties,
          postal: feature.properties?.postal,
          name: feature.properties?.name,
        })
      })

      statesGroup
        .selectAll("path")
        .data(geoFeatures)
        .join("path")
        .attr("id", (d) => {
          let identifier = d.properties?.postal // Try postal code first (e.g., "TX") for US states
          if (!identifier && d.id) {
            // If postal is not available, try FIPS ID for US states and convert to abbr
            if (topoType === "usa") {
              identifier = fipsToStateAbbrMap[String(d.id).padStart(2, "0")]
            } else if (topoType === "world") {
              // For world countries, use name or ID directly
              identifier = d.properties?.name || d.id
            }
          }
          const featureId = `${topoType === "usa" ? "State" : "Country"}-${identifier || ""}` // Fallback to empty string if no identifier found
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
      const stateDataMap = new Map()

      console.log("=== Building state data map for choropleth ===")
      choroplethData.forEach((d, index) => {
        const rawStateValue = String(d[dimensionSettings.choropleth.stateColumn] || "")
        if (!rawStateValue.trim()) return

        // Normalize state/country value based on selected geography
        let normalizedKey: string
        if (topoType === "usa") {
          normalizedKey = normalizeStateValue(rawStateValue)
        } else {
          // For world map, use the raw value as the key (assuming it's country name)
          normalizedKey = rawStateValue.trim()
        }

        const value =
          dimensionSettings.choropleth.colorScale === "linear"
            ? getNumericValue(d, dimensionSettings.choropleth.colorBy)
            : String(d[dimensionSettings.choropleth.colorBy])

        if (
          value !== null &&
          (dimensionSettings.choropleth.colorScale === "linear" ? !isNaN(value as number) : value)
        ) {
          stateDataMap.set(normalizedKey, value)
          console.log(`✓ Mapped ${rawStateValue} → ${normalizedKey} = ${value}`)
        }
      })

      console.log("Total mapped states/countries:", stateDataMap.size)
      console.log("State/Country data map:", Array.from(stateDataMap.entries()))

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

      // Apply colors to state/country paths
      const mapGroup = svg.select("#Map")
      if (!mapGroup.empty()) {
        console.log("Found map group, applying choropleth colors...")
        let featuresColored = 0

        mapGroup.selectAll("path").each(function (this: SVGPathElement) {
          const pathElement = d3.select(this)
          const id = pathElement.attr("id")
          let featureKey: string | null = null

          if (id) {
            if (topoType === "usa") {
              featureKey = extractStateFromSVGId(id) // Use existing state extraction for US
            } else if (topoType === "world") {
              // For world map, try to get country name from ID or properties
              const d = pathElement.datum() as any
              featureKey = d?.properties?.name || id // Prefer name from data, fallback to ID
            }
          }

          if (!featureKey) {
            pathElement.attr("fill", stylingSettings.base.defaultStateFillColor)
            return
          }

          const value = stateDataMap.get(featureKey)
          if (value !== undefined) {
            const color = choroplethColorScale(value)
            pathElement.attr("fill", color)
            featuresColored++
            console.log(`✅ Applied color ${color} to feature ${featureKey} (value: ${value})`)
          } else {
            pathElement.attr("fill", stylingSettings.base.defaultStateFillColor)
            console.log(`No data found for feature: ${featureKey}, applying default fill.`)
          }
        })
        console.log("Features actually colored:", featuresColored)
      } else {
        console.log("❌ No map group found for choropleth rendering")
      }
    }

    // Render symbol data if available, and only if not using a custom map

    console.log("=== SYMBOL RENDERING DEBUG ===")
    console.log("Should render symbols:", shouldRenderSymbols)
    console.log("Symbol data exists:", symbolDataExists)
    console.log("Latitude column:", dimensionSettings?.symbol?.latitude)
    console.log("Longitude column:", dimensionSettings?.symbol?.longitude)
    console.log("Symbol data length:", symbolData.length)
    console.log("Custom map data present (for symbol check):", !!customMapData)

    if (shouldRenderSymbols) {
      console.log("=== Rendering symbol data ===")
      console.log("Symbol data before filter:", symbolData.length)
      console.log("Dimension settings for symbols:", dimensionSettings.symbol)

      // Create symbol group
      const symbolGroup = svg.append("g").attr("id", "Symbols")
      const symbolLabelGroup = svg.append("g").attr("id", "SymbolLabels")

      // Filter data with valid coordinates
      const validSymbolData = symbolData.filter((d) => {
        const lat = Number(d[dimensionSettings.symbol.latitude])
        const lng = Number(d[dimensionSettings.symbol.longitude])
        const isValid = !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
        if (!isValid) {
          console.log(`Invalid coordinates for row:`, { lat, lng, row: d })
        }
        return isValid
      })

      console.log("Valid symbol data points after filter:", validSymbolData.length)
      console.log("Sample valid data:", validSymbolData.slice(0, 3))

      if (validSymbolData.length > 0) {
        // Create size scale if size mapping exists
        if (dimensionSettings.symbol.sizeBy) {
          sizeScale = d3
            .scaleLinear()
            .domain([dimensionSettings.symbol.sizeMinValue, dimensionSettings.symbol.sizeMaxValue])
            .range([dimensionSettings.symbol.sizeMin, dimensionSettings.symbol.sizeMax])
          console.log("Created size scale:", {
            domain: [dimensionSettings.symbol.sizeMinValue, dimensionSettings.symbol.sizeMaxValue],
            range: [dimensionSettings.symbol.sizeMin, dimensionSettings.symbol.sizeMax],
          })
        }

        // Create color scale if color mapping exists
        if (dimensionSettings.symbol.colorBy) {
          if (dimensionSettings.symbol.colorScale === "linear") {
            const domain = [dimensionSettings.symbol.colorMinValue, dimensionSettings.symbol.colorMaxValue]
            const rangeColors = [
              stylingSettings.symbol.symbolFillColor, // Use default if not set
              stylingSettings.symbol.symbolFillColor, // Use default if not set
            ]

            // Ensure min/max colors are set, fallback to default symbol fill
            rangeColors[0] = dimensionSettings.symbol.colorMinColor || stylingSettings.symbol.symbolFillColor
            rangeColors[1] = dimensionSettings.symbol.colorMaxColor || stylingSettings.symbol.symbolFillColor

            if (dimensionSettings.symbol.colorMidColor) {
              domain.splice(1, 0, dimensionSettings.symbol.colorMidValue)
              rangeColors.splice(1, 0, dimensionSettings.symbol.colorMidColor)
            }
            symbolColorScale = d3.scaleLinear().domain(domain).range(rangeColors)
            console.log("Created symbol linear color scale:", { domain, rangeColors })
          } else {
            const uniqueDataCategories = getUniqueValues(dimensionSettings.symbol.colorBy, symbolData)
            const colorMap = new Map()
            dimensionSettings?.symbol?.categoricalColors?.forEach((item: any, index: number) => {
              const dataCategory = uniqueDataCategories[index]
              if (dataCategory !== undefined) {
                colorMap.set(String(dataCategory), item.color)
              }
            })
            symbolColorScale = (value: any) => colorMap.get(String(value)) || stylingSettings.symbol.symbolFillColor
            console.log("Created symbol categorical color scale:", Array.from(colorMap.entries()))
          }
        }

        // Render symbols
        const symbols = symbolGroup
          .selectAll("path")
          .data(validSymbolData)
          .join("path")
          .attr("transform", (d) => {
            const lat = Number(d[dimensionSettings.symbol.latitude])
            const lng = Number(d[dimensionSettings.symbol.longitude])
            const projected = projection([lng, lat])

            if (!projected) return "translate(0, 0)"

            const size = sizeScale
              ? sizeScale(getNumericValue(d, dimensionSettings.symbol.sizeBy) || 0)
              : stylingSettings.symbol.symbolSize

            const { transform: symbolTransform } = getSymbolPathData(
              stylingSettings.symbol.symbolType,
              stylingSettings.symbol.symbolShape,
              size,
              stylingSettings.symbol.customSvgPath,
            )

            // Combine the coordinate projection with the symbol-specific transform
            const baseTransform = `translate(${projected[0]}, ${projected[1]})`
            return symbolTransform ? `${baseTransform} ${symbolTransform}` : baseTransform
          })
          .attr("d", (d) => {
            const size = sizeScale
              ? sizeScale(getNumericValue(d, dimensionSettings.symbol.sizeBy) || 0)
              : stylingSettings.symbol.symbolSize

            const { pathData } = getSymbolPathData(
              stylingSettings.symbol.symbolType,
              stylingSettings.symbol.symbolShape,
              size,
              stylingSettings.symbol.customSvgPath,
            )
            return pathData
          })
          .attr("fill", (d) => {
            if (symbolColorScale && dimensionSettings.symbol.colorBy) {
              const value =
                dimensionSettings.symbol.colorScale === "linear"
                  ? getNumericValue(d, dimensionSettings.symbol.colorBy)
                  : String(d[dimensionSettings.symbol.colorBy])
              return symbolColorScale(value)
            }
            return stylingSettings.symbol.symbolFillColor
          })
          .attr("stroke", stylingSettings.symbol.symbolStrokeColor)
          .attr("stroke-width", stylingSettings.symbol.symbolStrokeWidth)
          .attr("fill-opacity", (stylingSettings.symbol.symbolFillTransparency || 80) / 100)
          .attr("stroke-opacity", (stylingSettings.symbol.symbolStrokeTransparency || 100) / 100)

        console.log("Rendered", symbols.size(), "symbols")

        // Render Symbol Labels with improved positioning and HTML tag support
        if (dimensionSettings.symbol.labelTemplate) {
          const symbolLabels = symbolLabelGroup
            .selectAll("text")
            .data(validSymbolData)
            .join("text")
            .each(function (d) {
              const textElement = d3.select(this)
              const lat = Number(d[dimensionSettings.symbol.latitude])
              const lng = Number(d[dimensionSettings.symbol.longitude])
              const projected = projection([lng, lat])

              if (!projected) return

              const labelText = renderLabelPreview(
                dimensionSettings.symbol.labelTemplate,
                d,
                columnTypes,
                columnFormats,
              )

              if (!labelText) return

              const symbolSize = sizeScale
                ? sizeScale(getNumericValue(d, dimensionSettings.symbol.sizeBy) || 0)
                : stylingSettings.symbol.symbolSize

              // Create base styles object
              const baseStyles = {
                fontWeight: stylingSettings.symbol.labelBold ? "bold" : "normal",
                fontStyle: stylingSettings.symbol.labelItalic ? "italic" : "normal",
                textDecoration: (() => {
                  let decoration = ""
                  if (stylingSettings.symbol.labelUnderline) decoration += "underline "
                  if (stylingSettings.symbol.labelStrikethrough) decoration += "line-through"
                  return decoration.trim()
                })(),
              }

              // Set basic text properties
              textElement
                .attr("font-family", stylingSettings.symbol.labelFontFamily)
                .attr("font-size", `${stylingSettings.symbol.labelFontSize}px`)
                .attr("fill", stylingSettings.symbol.labelColor)
                .attr("stroke", stylingSettings.symbol.labelOutlineColor)
                .attr("stroke-width", stylingSettings.symbol.labelOutlineThickness)
                .attr("stroke-linejoin", "round")
                .attr("stroke-linecap", "round")
                .style("paint-order", "stroke fill")
                .style("pointer-events", "none")

              // Create formatted text with HTML support
              createFormattedText(textElement, labelText, baseStyles)

              // Position the label based on alignment setting
              let position
              if (stylingSettings.symbol.labelAlignment === "auto") {
                // For auto positioning, estimate label dimensions
                const estimatedWidth = labelText.length * (stylingSettings.symbol.labelFontSize * 0.6)
                const estimatedHeight = stylingSettings.symbol.labelFontSize * 1.2
                position = getAutoPosition(
                  projected[0],
                  projected[1],
                  symbolSize,
                  estimatedWidth,
                  estimatedHeight,
                  width,
                  height,
                )
              } else {
                // Manual positioning based on symbol size
                const offset = symbolSize / 2 + Math.max(8, symbolSize * 0.3) // Increased scaling factor
                switch (stylingSettings.symbol.labelAlignment) {
                  case "top-left":
                    position = { dx: -offset, dy: -offset, anchor: "end", baseline: "baseline" }
                    break
                  case "top-center":
                    position = { dx: 0, dy: -offset, anchor: "middle", baseline: "baseline" }
                    break
                  case "top-right":
                    position = { dx: offset, dy: -offset, anchor: "start", baseline: "baseline" }
                    break
                  case "middle-left":
                    position = { dx: -offset, dy: 0, anchor: "end", baseline: "middle" }
                    break
                  case "center":
                    position = { dx: 0, dy: 0, anchor: "middle", baseline: "middle" }
                    break
                  case "middle-right":
                    position = { dx: offset, dy: 0, anchor: "start", baseline: "middle" }
                    break
                  case "bottom-left":
                    position = { dx: -offset, dy: offset, anchor: "end", baseline: "hanging" }
                    break
                  case "bottom-center":
                    position = { dx: 0, dy: offset, anchor: "middle", baseline: "hanging" }
                    break
                  case "bottom-right":
                    position = { dx: offset, dy: offset, anchor: "start", baseline: "hanging" }
                    break
                  default:
                    position = { dx: offset, dy: 0, anchor: "start", baseline: "middle" }
                    break
                }
              }

              textElement
                .attr("x", projected[0] + position.dx)
                .attr("y", projected[1] + position.dy)
                .attr("text-anchor", position.anchor)
                .attr("dominant-baseline", position.baseline)

              // Fix tspan positioning to maintain proper text anchor
              textElement.selectAll("tspan").each(function (d, i) {
                const tspan = d3.select(this)
                // Only set x position for non-first tspans to maintain text anchor
                if (i > 0 || tspan.attr("x") === "0") {
                  tspan.attr("x", projected[0] + position.dx)
                }
              })
            })

          console.log("Rendered", symbolLabels.size(), "symbol labels")
        }
      }
    }

    // Render Choropleth Labels
    const shouldRenderChoroplethLabels =
      choroplethDataExists &&
      dimensionSettings?.choropleth?.stateColumn &&
      dimensionSettings?.choropleth?.labelTemplate &&
      choroplethData.length > 0

    console.log("=== CHOROPLETH LABELS DEBUG ===")
    console.log("Should render choropleth labels:", shouldRenderChoroplethLabels)
    console.log("Choropleth data exists:", choroplethDataExists)
    console.log("State column:", dimensionSettings?.choropleth?.stateColumn)
    console.log("Label template:", dimensionSettings?.choropleth?.labelTemplate)
    console.log("Choropleth data length:", choroplethData.length)

    if (shouldRenderChoroplethLabels) {
      console.log("=== Rendering choropleth labels ===")
      const choroplethLabelGroup = svg.append("g").attr("id", "ChoroplethLabels")

      // Create multiple maps for different state identifier formats
      const stateDataMapByAbbr = new Map<string, DataRow | GeocodedRow>()
      const stateDataMapByFips = new Map<string, DataRow | GeocodedRow>()
      const stateDataMapByName = new Map<string, DataRow | GeocodedRow>()

      // Log some sample data to see what we're working with
      console.log("Sample choropleth data:", choroplethData.slice(0, 3))

      choroplethData.forEach((d) => {
        const rawStateValue = String(d[dimensionSettings.choropleth.stateColumn] || "")
        if (!rawStateValue.trim()) return

        // Store by state abbreviation (normalized)
        const normalizedStateAbbr = normalizeStateValue(rawStateValue)
        stateDataMapByAbbr.set(normalizedStateAbbr, d)

        // Also store by state name (lowercase for case-insensitive lookup)
        if (stateMap[normalizedStateAbbr]) {
          const stateName = stateMap[normalizedStateAbbr].toLowerCase()
          stateDataMapByName.set(stateName, d)
        }

        // Try to find FIPS code for this state and store by FIPS
        for (const [fips, abbr] of Object.entries(fipsToStateAbbrMap)) {
          if (abbr === normalizedStateAbbr) {
            stateDataMapByFips.set(fips, d)
          }
        }
      })

      console.log("State data map by abbreviation size:", stateDataMapByAbbr.size)
      console.log("State data map by FIPS size:", stateDataMapByFips.size)
      console.log("State data map by name size:", stateDataMapByName.size)

      // Get state/country features from geoAtlasData or custom map paths
      let featuresForLabels: any[] = []
      if (geoAtlasData && mapType !== "custom") {
        if (topoType === "usa" && geoAtlasData.objects.states) {
          featuresForLabels = topojson.feature(geoAtlasData, geoAtlasData.objects.states).features
        } else if (topoType === "world" && geoAtlasData.objects.countries) {
          featuresForLabels = topojson.feature(geoAtlasData, geoAtlasData.objects.countries).features
        }
        console.log("Using geoAtlasData for labels, features count:", featuresForLabels.length)
      } else if (customMapData) {
        // For custom maps, iterate through both paths and groups in the #States group
        const statesGroup = svg.select("#States")
        console.log("Custom map - States group found:", !statesGroup.empty())
        if (!statesGroup.empty()) {
          // First, handle individual path elements
          statesGroup.selectAll("path").each(function (this: SVGPathElement) {
            const pathElement = d3.select(this)
            const id = pathElement.attr("id")
            let featureId = null
            if (id) {
              featureId = topoType === "usa" ? extractStateFromSVGId(id) : id
            }
            if (featureId) {
              featuresForLabels.push({
                id: featureId,
                properties: { postal: featureId, name: featureId }, // Mock properties for consistency
                pathNode: this,
                isGroup: false,
              })
            }
          })

          // Then, handle group elements (for multi-path states)
          statesGroup.selectAll("g").each(function (this: SVGGElement) {
            const groupElement = d3.select(this)
            const id = groupElement.attr("id")
            let featureId = null
            if (id) {
              featureId = topoType === "usa" ? extractStateFromSVGId(id) : id
            }
            if (featureId) {
              featuresForLabels.push({
                id: featureId,
                properties: { postal: featureId, name: featureId },
                pathNode: this,
                isGroup: true,
              })
            }
          })
        }
        console.log("Custom map features for labels count:", featuresForLabels.length)
      }

      const labelElements = choroplethLabelGroup
        .selectAll("text")
        .data(featuresForLabels)
        .join("text")
        .each(function (d) {
          // Try multiple ways to identify the state/country
          const featureId = d.id || d.properties?.postal || d.properties?.name

          // Determine if this looks like a FIPS code (numeric string or number)
          let stateFips = null
          let isNumericId = false

          if (typeof featureId === "number") {
            stateFips = String(featureId).padStart(2, "0")
            isNumericId = true
          } else if (typeof featureId === "string" && /^\d{1,2}$/.test(featureId)) {
            // String that contains only 1-2 digits (FIPS code)
            stateFips = featureId.padStart(2, "0")
            isNumericId = true
          }

          // Try to find data for this state/country using multiple identifiers
          let dataRow: DataRow | GeocodedRow | undefined

          if (topoType === "usa") {
            // If it looks like a FIPS code, try FIPS lookup first
            if (isNumericId && stateFips) {
              console.log(`Trying FIPS lookup for: ${stateFips}`)

              // Try direct FIPS lookup
              if (stateDataMapByFips.has(stateFips)) {
                dataRow = stateDataMapByFips.get(stateFips)
                console.log(`✅ Found data via FIPS: ${stateFips}`)
              }
              // Try converting FIPS to abbreviation and look up
              else if (fipsToStateAbbrMap[stateFips]) {
                const stateAbbr = fipsToStateAbbrMap[stateFips]
                if (stateDataMapByAbbr.has(stateAbbr)) {
                  dataRow = stateDataMapByAbbr.get(stateAbbr)
                  console.log(`✅ Found data via FIPS->Abbr: ${stateFips} -> ${stateAbbr}`)
                }
              }
            }
            // Otherwise try state abbreviation lookup
            else if (featureId && stateDataMapByAbbr.has(featureId)) {
              dataRow = stateDataMapByAbbr.get(featureId)
              console.log(`✅ Found data via abbreviation: ${featureId}`)
            }
            // Try state name lookup
            else if (featureId && stateMap[featureId]) {
              const stateName = stateMap[featureId].toLowerCase()
              if (stateDataMapByName.has(stateName)) {
                dataRow = stateDataMapByName.get(stateName)
                console.log(`✅ Found data via state name: ${featureId} -> ${stateName}`)
              }
            }
          } else if (topoType === "world") {
            // For world maps, try to match by country name (d.properties.name or d.id)
            const countryName = d.properties?.name || d.id
            const stateDataMap = new Map()
            if (countryName && stateDataMap.has(countryName)) {
              dataRow = stateDataMap.get(countryName)
              console.log(`✅ Found data for country: ${countryName}`)
            }
          }

          console.log(
            `Processing label for feature ID: ${featureId}, FIPS: ${stateFips}, isNumeric: ${isNumericId}, has data: ${!!dataRow}`,
          )

          const labelText = dataRow
            ? renderLabelPreview(dimensionSettings.choropleth.labelTemplate, dataRow, columnTypes, columnFormats)
            : ""

          if (labelText) {
            let centroid
            if (d.pathNode) {
              // For custom maps, calculate centroid from the actual path or group element
              const bbox = d.pathNode.getBBox()
              centroid = [bbox.x + bbox.width / 2, bbox.y + bbox.height / 2]
            } else {
              // For TopoJSON data, use d3 path centroid
              centroid = path.centroid(d)
            }

            if (centroid && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
              const textElement = d3.select(this)

              // Create base styles object for choropleth labels
              const baseStyles = {
                fontWeight: stylingSettings.choropleth.labelBold ? "bold" : "normal",
                fontStyle: stylingSettings.choropleth.labelItalic ? "italic" : "normal",
                textDecoration: (() => {
                  let decoration = ""
                  if (stylingSettings.choropleth.labelUnderline) decoration += "underline "
                  if (stylingSettings.choropleth.labelStrikethrough) decoration += "line-through"
                  return decoration.trim()
                })(),
              }

              textElement
                .attr("x", centroid[0])
                .attr("y", centroid[1])
                .attr("text-anchor", "middle")
                .attr("dominant-baseline", "middle")
                .attr("font-family", stylingSettings.choropleth.labelFontFamily)
                .attr("font-size", `${stylingSettings.choropleth.labelFontSize}px`)
                .attr("fill", stylingSettings.choropleth.labelColor)
                .attr("stroke", stylingSettings.choropleth.labelOutlineColor)
                .attr("stroke-width", stylingSettings.choropleth.labelOutlineThickness)
                .style("paint-order", "stroke fill")
                .style("pointer-events", "none")

              // Create formatted text with HTML support
              createFormattedText(textElement, labelText, baseStyles)

              // Fix tspan positioning for choropleth labels to maintain center alignment
              textElement.selectAll("tspan").each(function (d, i) {
                const tspan = d3.select(this)
                if (i > 0 || tspan.attr("x") === "0") {
                  tspan.attr("x", centroid[0])
                }
              })

              console.log(`✅ Rendered label for feature ID: ${featureId} at position:`, centroid)
            } else {
              console.log(`❌ Invalid centroid for feature ID: ${featureId}:`, centroid)
              d3.select(this).remove()
            }
          } else {
            console.log(`❌ No label text for feature ID: ${featureId}`)
            d3.select(this).remove()
          }
        })

      console.log("Total choropleth labels rendered:", labelElements.size())
    }

    // Add Legends - positioned below the map
    const legendGroup = svg.append("g").attr("id", "Legends")
    let currentLegendY = mapHeight + 20

    // Symbol Size Legend
    if (shouldShowSymbolSizeLegend) {
      console.log("=== Rendering Symbol Size Legend ===")

      const sizeLegendGroup = legendGroup.append("g").attr("id", "SizeLegend")

      // More compact legend background
      const legendWidth = 400
      const legendX = (width - legendWidth) / 2

      const legendBg = sizeLegendGroup
        .append("rect")
        .attr("x", legendX)
        .attr("y", currentLegendY - 10)
        .attr("width", legendWidth)
        .attr("height", 60)
        .attr("fill", "rgba(255, 255, 255, 0.95)")
        .attr("stroke", "#ddd")
        .attr("stroke-width", 1)
        .attr("rx", 6)

      // Legend title
      sizeLegendGroup
        .append("text")
        .attr("x", legendX + 15)
        .attr("y", currentLegendY + 8)
        .attr("font-family", "Arial, sans-serif")
        .attr("font-size", "14px")
        .attr("font-weight", "600")
        .attr("fill", "#333")
        .text(`Size: ${dimensionSettings.symbol.sizeBy}`)

      // Create size legend with two symbols and arrow - tighter spacing
      // Use fixed sizes for legend display instead of data-driven sizes
      const minLegendSize = 8 // Fixed small size for min symbol
      const maxLegendSize = 20 // Fixed large size for max symbol

      // Determine symbol color - use default if no color mapping, otherwise use nation colors
      const symbolColor = dimensionSettings.symbol.colorBy
        ? stylingSettings.base.nationFillColor
        : stylingSettings.symbol.symbolFillColor
      const symbolStroke = dimensionSettings.symbol.colorBy
        ? stylingSettings.base.nationStrokeColor
        : stylingSettings.symbol.symbolStrokeColor

      const legendCenterX = width / 2
      const symbolY = currentLegendY + 35

      // Min value label (left) - moved much closer to symbol
      sizeLegendGroup
        .append("text")
        .attr("x", legendCenterX - 45) // Moved closer (was -60)
        .attr("y", symbolY + 5)
        .attr("font-family", "Arial, sans-serif")
        .attr("font-size", "11px")
        .attr("fill", "#666")
        .attr("text-anchor", "middle")
        .text(
          formatLegendValue(
            dimensionSettings.symbol.sizeMinValue,
            dimensionSettings.symbol.sizeBy,
            columnTypes,
            columnFormats,
          ),
        )

      // Min symbol - moved closer to center
      const { pathData: minPathData } = getSymbolPathData(
        stylingSettings.symbol.symbolType,
        stylingSettings.symbol.symbolShape,
        minLegendSize,
        stylingSettings.symbol.customSvgPath,
      )

      sizeLegendGroup
        .append("path")
        .attr("d", minPathData)
        .attr("transform", `translate(${legendCenterX - 20}, ${symbolY})`) // Moved closer (was -25)
        .attr("fill", symbolColor)
        .attr("stroke", symbolStroke)
        .attr("stroke-width", 1)

      // Arrow - moved closer to min symbol
      sizeLegendGroup
        .append("path")
        .attr("d", "M-6,0 L6,0 M3,-2 L6,0 L3,2") // Shorter and moved closer
        .attr("transform", `translate(${legendCenterX - 5}, ${symbolY})`) // Moved closer (was 0)
        .attr("fill", "none")
        .attr("stroke", "#666")
        .attr("stroke-width", 1.5)

      // Max symbol - closer to center, using fixed large size
      const { pathData: maxPathData } = getSymbolPathData(
        stylingSettings.symbol.symbolType,
        stylingSettings.symbol.symbolShape,
        maxLegendSize, // Use fixed size instead of sizeScale(dimensionSettings.symbol.sizeMaxValue)
        stylingSettings.symbol.customSvgPath,
      )

      sizeLegendGroup
        .append("path")
        .attr("d", maxPathData)
        .attr("transform", `translate(${legendCenterX + 25}, ${symbolY})`) // Moved closer (was +40)
        .attr("fill", symbolColor)
        .attr("stroke", symbolStroke)
        .attr("stroke-width", 1)

      // Max value label (right) - closer to symbol
      sizeLegendGroup
        .append("text")
        .attr("x", legendCenterX + 60) // Moved closer (was +80)
        .attr("y", symbolY + 5)
        .attr("font-family", "Arial, sans-serif")
        .attr("font-size", "11px")
        .attr("fill", "#666")
        .attr("text-anchor", "middle")
        .text(
          formatLegendValue(
            dimensionSettings.symbol.sizeMaxValue,
            dimensionSettings.symbol.sizeBy,
            columnTypes,
            columnFormats,
          ),
        )

      currentLegendY += 80
    }

    // Symbol Color Legend
    if (shouldShowSymbolColorLegend) {
      console.log("=== Rendering Symbol Color Legend ===")

      const colorLegendGroup = legendGroup.append("g").attr("id", "SymbolColorLegend")

      if (dimensionSettings.symbol.colorScale === "linear") {
        // Linear color legend with wide gradient
        const legendBg = colorLegendGroup
          .append("rect")
          .attr("x", 20)
          .attr("y", currentLegendY - 10)
          .attr("width", width - 40)
          .attr("height", 60)
          .attr("fill", "rgba(255, 255, 255, 0.95)")
          .attr("stroke", "#ddd")
          .attr("stroke-width", 1)
          .attr("rx", 6)

        // Legend title
        colorLegendGroup
          .append("text")
          .attr("x", 35)
          .attr("y", currentLegendY + 8)
          .attr("font-family", "Arial, sans-serif")
          .attr("font-size", "14px")
          .attr("font-weight", "600")
          .attr("fill", "#333")
          .text(`Color: ${dimensionSettings.symbol.colorBy}`)

        // Create gradient
        const gradient = svg
          .append("defs")
          .append("linearGradient")
          .attr("id", "symbolColorGradient")
          .attr("x1", "0%")
          .attr("x2", "100%")
          .attr("y1", "0%")
          .attr("y2", "0%")

        const domain = [dimensionSettings.symbol.colorMinValue, dimensionSettings.symbol.colorMaxValue]
        const rangeColors = [
          stylingSettings.symbol.colorMinColor || stylingSettings.symbol.symbolFillColor,
          stylingSettings.symbol.colorMaxColor || stylingSettings.symbol.symbolFillColor,
        ]

        rangeColors.forEach((color, index) => {
          gradient
            .append("stop")
            .attr("offset", `${(index / (rangeColors.length - 1)) * 100}%`)
            .attr("stop-color", color)
        })

        // Wide gradient bar
        const gradientWidth = width - 200
        const gradientX = (width - gradientWidth) / 2

        colorLegendGroup
          .append("rect")
          .attr("x", gradientX)
          .attr("y", currentLegendY + 25)
          .attr("width", gradientWidth)
          .attr("height", 12)
          .attr("fill", "url(#symbolColorGradient)")
          .attr("stroke", "#ccc")
          .attr("stroke-width", 1)
          .attr("rx", 2)

        // Min label (left)
        colorLegendGroup
          .append("text")
          .attr("x", gradientX - 10)
          .attr("y", currentLegendY + 33)
          .attr("font-family", "Arial, sans-serif")
          .attr("font-size", "11px")
          .attr("fill", "#666")
          .attr("text-anchor", "end")
          .text(formatLegendValue(domain[0], dimensionSettings.symbol.colorBy, columnTypes, columnFormats))

        // Max label (right)
        colorLegendGroup
          .append("text")
          .attr("x", gradientX + gradientWidth + 10)
          .attr("y", currentLegendY + 33)
          .attr("font-family", "Arial, sans-serif")
          .attr("font-size", "11px")
          .attr("fill", "#666")
          .attr("text-anchor", "start")
          .text(
            formatLegendValue(domain[domain.length - 1], dimensionSettings.symbol.colorBy, columnTypes, columnFormats),
          )
      } else {
        // Categorical color legend with horizontal swatches
        const uniqueValues = getUniqueValues(dimensionSettings.symbol.colorBy, symbolData)
        const maxItems = Math.min(uniqueValues.length, 10)

        // Calculate legend width based on content
        const estimatedLegendWidth = Math.min(700, maxItems * 90 + 100)
        const legendX = (width - estimatedLegendWidth) / 2

        const legendBg = colorLegendGroup
          .append("rect")
          .attr("x", legendX)
          .attr("y", currentLegendY - 10)
          .attr("width", estimatedLegendWidth)
          .attr("height", 60)
          .attr("fill", "rgba(255, 255, 255, 0.95)")
          .attr("stroke", "#ddd")
          .attr("stroke-width", 1)
          .attr("rx", 6)

        // Legend title
        colorLegendGroup
          .append("text")
          .attr("x", legendX + 15)
          .attr("y", currentLegendY + 8)
          .attr("font-family", "Arial, sans-serif")
          .attr("font-size", "14px")
          .attr("font-weight", "600")
          .attr("fill", "#333")
          .text(`Color: ${dimensionSettings.symbol.colorBy}`)

        // Calculate spacing for horizontal layout
        let currentX = legendX + 25
        const swatchY = currentLegendY + 30

        uniqueValues.slice(0, maxItems).forEach((value, index) => {
          const color = symbolColorScale(value)
          const labelText = formatLegendValue(value, dimensionSettings.symbol.colorBy, columnTypes, columnFormats)

          // Create smaller fixed-size symbol swatch for categorical legend
          const fixedLegendSize = 12 // Smaller size for better proportion
          const { pathData } = getSymbolPathData(
            stylingSettings.symbol.symbolType,
            stylingSettings.symbol.symbolShape,
            fixedLegendSize,
            stylingSettings.symbol.customSvgPath,
          )

          colorLegendGroup
            .append("path")
            .attr("d", pathData)
            .attr("transform", `translate(${currentX}, ${swatchY})`)
            .attr("fill", color)
            .attr("stroke", "#666")
            .attr("stroke-width", 1)

          // Label positioned to the right of swatch, vertically centered
          colorLegendGroup
            .append("text")
            .attr("x", currentX + 15) // Position to the right of swatch
            .attr("y", swatchY + 3) // Vertically centered with swatch
            .attr("font-family", "Arial, sans-serif")
            .attr("font-size", "10px")
            .attr("fill", "#666")
            .attr("text-anchor", "start") // Left-aligned text
            .text(labelText)

          // Calculate next position based on label width with tighter spacing
          const labelWidth = Math.max(60, labelText.length * 6 + 35) // Account for swatch + spacing
          currentX += labelWidth
        })
      }

      currentLegendY += 80
    }

    // Choropleth Color Legend
    if (shouldShowChoroplethColorLegend) {
      console.log("=== Rendering Choropleth Color Legend ===")

      const choroplethColorLegendGroup = legendGroup.append("g").attr("id", "ChoroplethColorLegend")

      if (dimensionSettings.choropleth.colorScale === "linear") {
        // Linear color legend with wide gradient
        const legendBg = choroplethColorLegendGroup
          .append("rect")
          .attr("x", 20)
          .attr("y", currentLegendY - 10)
          .attr("width", width - 40)
          .attr("height", 60)
          .attr("fill", "rgba(255, 255, 255, 0.95)")
          .attr("stroke", "#ddd")
          .attr("stroke-width", 1)
          .attr("rx", 6)

        // Legend title
        choroplethColorLegendGroup
          .append("text")
          .attr("x", 35)
          .attr("y", currentLegendY + 8)
          .attr("font-family", "Arial, sans-serif")
          .attr("font-size", "14px")
          .attr("font-weight", "600")
          .attr("fill", "#333")
          .text(`Color: ${dimensionSettings.choropleth.colorBy}`)

        // Create gradient
        const gradient = svg
          .append("defs")
          .append("linearGradient")
          .attr("id", "choroplethColorGradient")
          .attr("x1", "0%")
          .attr("x2", "100%")
          .attr("y1", "0%")
          .attr("y2", "0%")

        const domain = [dimensionSettings.choropleth.colorMinValue, dimensionSettings.choropleth.colorMaxValue]
        const rangeColors = [
          stylingSettings.base.defaultStateFillColor, // Use default if not set
          stylingSettings.base.defaultStateFillColor, // Use default if not set
        ]

        rangeColors.forEach((color, index) => {
          gradient
            .append("stop")
            .attr("offset", `${(index / (rangeColors.length - 1)) * 100}%`)
            .attr("stop-color", color)
        })

        // Wide gradient bar
        const gradientWidth = width - 200
        const gradientX = (width - gradientWidth) / 2

        choroplethColorLegendGroup
          .append("rect")
          .attr("x", gradientX)
          .attr("y", currentLegendY + 25)
          .attr("width", gradientWidth)
          .attr("height", 12)
          .attr("fill", "url(#choroplethColorGradient)")
          .attr("stroke", "#ccc")
          .attr("stroke-width", 1)
          .attr("rx", 2)

        // Min label (left)
        choroplethColorLegendGroup
          .append("text")
          .attr("x", gradientX - 10)
          .attr("y", currentLegendY + 33)
          .attr("font-family", "Arial, sans-serif")
          .attr("font-size", "11px")
          .attr("fill", "#666")
          .attr("text-anchor", "end")
          .text(formatLegendValue(domain[0], dimensionSettings.choropleth.colorBy, columnTypes, columnFormats))

        // Max label (right)
        choroplethColorLegendGroup
          .append("text")
          .attr("x", gradientX + gradientWidth + 10)
          .attr("y", currentLegendY + 33)
          .attr("font-family", "Arial, sans-serif")
          .attr("font-size", "11px")
          .attr("fill", "#666")
          .attr("text-anchor", "start")
          .text(
            formatLegendValue(
              domain[domain.length - 1],
              dimensionSettings.choropleth.colorBy,
              columnTypes,
              columnFormats,
            ),
          )
      } else {
        // Categorical color legend with horizontal square swatches
        const uniqueValues = getUniqueValues(dimensionSettings.choropleth.colorBy, choroplethData)
        const maxItems = Math.min(uniqueValues.length, 10)

        // Calculate legend width based on content
        const estimatedLegendWidth = Math.min(700, maxItems * 90 + 100)
        const legendX = (width - estimatedLegendWidth) / 2

        const legendBg = choroplethColorLegendGroup
          .append("rect")
          .attr("x", legendX)
          .attr("y", currentLegendY - 10)
          .attr("width", estimatedLegendWidth)
          .attr("height", 60)
          .attr("fill", "rgba(255, 255, 255, 0.95)")
          .attr("stroke", "#ddd")
          .attr("stroke-width", 1)
          .attr("rx", 6)

        // Legend title
        choroplethColorLegendGroup
          .append("text")
          .attr("x", legendX + 15)
          .attr("y", currentLegendY + 8)
          .attr("font-family", "Arial, sans-serif")
          .attr("font-size", "14px")
          .attr("font-weight", "600")
          .attr("fill", "#333")
          .text(`Color: ${dimensionSettings.choropleth.colorBy}`)

        // Calculate spacing for horizontal layout
        let currentX = legendX + 25
        const swatchY = currentLegendY + 25

        uniqueValues.slice(0, maxItems).forEach((value, index) => {
          const color = choroplethColorScale(value)
          const labelText = formatLegendValue(value, dimensionSettings.choropleth.colorBy, columnTypes, columnFormats)

          // Smaller square swatch for choropleth categorical
          choroplethColorLegendGroup
            .append("rect")
            .attr("x", currentX - 6) // Smaller 12x12 square
            .attr("y", swatchY - 6)
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", color)
            .attr("stroke", "#666")
            .attr("stroke-width", 1)
            .attr("rx", 2)

          // Label positioned to the right of swatch, vertically centered
          choroplethColorLegendGroup
            .append("text")
            .attr("x", currentX + 15) // Position to the right of swatch
            .attr("y", swatchY + 3) // Vertically centered with swatch
            .attr("font-family", "Arial, sans-serif")
            .attr("font-size", "10px")
            .attr("fill", "#666")
            .attr("text-anchor", "start") // Left-aligned text
            .text(labelText)

          // Calculate next position based on label width with tighter spacing
          const labelWidth = Math.max(60, labelText.length * 6 + 35) // Account for swatch + spacing
          currentX += labelWidth
        })
      }

      currentLegendY += 80
    }

    console.log("=== MAP PREVIEW RENDER COMPLETE ===")
  }, [
    geoAtlasData,
    symbolData,
    choroplethData,
    mapType,
    dimensionSettings,
    stylingSettings,
    symbolDataExists,
    choroplethDataExists,
    columnTypes,
    columnFormats,
    customMapData,
    selectedGeography,
    selectedProjection,
    toast,
  ])

  const renderMap = useCallback(() => {
    console.log("renderMap useCallback triggered")
  }, [
    geoAtlasData,
    symbolData,
    choroplethData,
    mapType,
    dimensionSettings,
    stylingSettings,
    symbolDataExists,
    choroplethDataExists,
    columnTypes,
    columnFormats,
    customMapData,
    selectedGeography,
    selectedProjection,
    toast,
  ])

  useEffect(() => {
    renderMap()
  }, [renderMap])

  const handleDownloadSVG = () => {
    if (!svgRef.current) return

    try {
      const svgElement = svgRef.current
      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(svgElement)

      const blob = new Blob([svgString], { type: "image/svg+xml" })
      const url = URL.createObjectURL(blob)

      const link = document.createElement("a")
      link.href = url
      link.download = "map.svg"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)

      toast({
        icon: <Download className="h-4 w-4" />,
        description: "SVG downloaded successfully.",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error downloading SVG:", error)
      toast({
        title: "Download failed",
        description: "Failed to download SVG file",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleCopySVG = async () => {
    if (!svgRef.current) return

    try {
      const svgElement = svgRef.current
      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(svgElement)

      await navigator.clipboard.writeText(svgString)

      toast({
        icon: <Copy className="h-4 w-4" />,
        description: "SVG copied to clipboard.",
        duration: 3000,
      })
    } catch (error) {
      console.error("Error copying SVG:", error)
      toast({
        title: "Copy failed",
        description: "Failed to copy SVG to clipboard",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Map Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="text-muted-foreground">Loading map data...</div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden">
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out py-4 px-6 rounded-t-xl relative"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-gray-900 dark:text-white transition-colors duration-200">Map preview</CardTitle>
          </div>
          {/* Right side: Download and Copy buttons (with stopPropagation) */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "flex items-center gap-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700",
                "group",
              )}
              onClick={(e) => {
                e.stopPropagation()
                handleCopySVG()
              }}
            >
              <Copy className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
              Copy to Figma
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "flex items-center gap-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700",
                "group",
              )}
              onClick={(e) => {
                e.stopPropagation()
                handleDownloadSVG()
              }}
            >
              <Download className="h-3 w-3 transition-transform duration-300 group-hover:translate-y-1" />
              Download SVG
            </Button>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("transition-all duration-200", isExpanded ? "pb-6" : "pb-0 h-0 overflow-hidden")}>
        <div
          ref={mapContainerRef}
          className="w-full border rounded-lg overflow-hidden"
          style={{
            backgroundColor: stylingSettings.base.mapBackgroundColor,
          }}
        >
          <svg ref={svgRef} className="w-full h-full" />
        </div>
      </CardContent>
    </Card>
  )
}
</ ref=
{
  svgRef
}
className="w-full h-full" />
</div>
      </CardContent>
    </Card>
  )
}
