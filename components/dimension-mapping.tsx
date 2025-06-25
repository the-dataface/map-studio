"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react" // Import useRef

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group" // Import ToggleGroup and ToggleGroupItem
import { ChevronDown, ChevronUp, MapPin, Palette, Hash, Calendar, Flag, Type, BarChart3, Save } from "lucide-react"
import type { DataRow, GeocodedRow } from "@/app/page"
import { cn } from "@/lib/utils"

import { TooltipProvider } from "@/components/ui/tooltip"
import * as d3 from "d3"

// Update the component props to include dimensionSettings and onUpdateSettings
interface DimensionMappingProps {
  mapType: "symbol" | "choropleth" | "custom" // Still receive mapType for initial sync
  symbolDataExists: boolean
  choroplethDataExists: boolean
  customDataExists: boolean // Still need this to determine if custom map is active
  columnTypes: { [key: string]: "text" | "number" | "date" | "coordinate" | "state" }
  dimensionSettings: DimensionSettings // Use the defined interface
  onUpdateSettings: (settings: DimensionSettings) => void // Use the defined interface
  columnFormats: { [key: string]: string } // Add columnFormats prop
  symbolParsedData: DataRow[]
  symbolGeocodedData: GeocodedRow[]
  choroplethParsedData: DataRow[]
  choroplethGeocodedData: GeocodedRow[]
  symbolColumns: string[]
  choroplethColumns: string[]
  selectedGeography: string // NEW: Add selectedGeography prop
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
    labelTemplate: string // NEW: Add labelTemplate
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
    labelTemplate: string // NEW: Add labelTemplate
  }
  // REMOVED: custom: { ... } // Custom map settings are now handled by choropleth
}

// Update the initialDimensionSettings constant to reflect the new default for sizeMin
const initialDimensionSettings: DimensionSettings = {
  symbol: {
    latitude: "",
    longitude: "",
    sizeBy: "",
    sizeMin: 1, // Update this line
    sizeMax: 100,
    sizeMinValue: 0,
    sizeMaxValue: 0,
    colorBy: "",
    colorScale: "linear",
    colorPalette: "",
    colorMinValue: 0,
    colorMidValue: 0,
    colorMaxValue: 0,
    colorMinColor: "",
    colorMidColor: "",
    colorMaxColor: "",
    categoricalColors: [],
    labelTemplate: "",
  },
  choropleth: {
    stateColumn: "",
    colorBy: "",
    colorScale: "linear",
    colorPalette: "",
    colorMinValue: 0,
    colorMidValue: 0,
    colorMaxValue: 0,
    colorMinColor: "",
    colorMidColor: "",
    colorMaxColor: "",
    categoricalColors: [],
    labelTemplate: "",
  },
}

const sequentialPalettes = [
  { name: "Blues", colors: ["#f7fbff", "#08519c"] },
  { name: "Greens", colors: ["#f7fcf5", "#00441b"] },
  { name: "Oranges", colors: ["#fff5eb", "#cc4c02"] },
  { name: "Purples", colors: ["#fcfbfd", "#3f007d"] },
  { name: "Reds", colors: ["#fff5f0", "#a50f15"] },
]

const divergingPalettes = [
  { name: "RdYlBu", colors: ["#a50026", "#ffffbf", "#313695"] },
  { name: "RdBu", colors: ["#67001f", "#f7f7f7", "#053061"] },
  { name: "PiYG", colors: ["#8e0152", "#f7f7f7", "#276419"] },
  { name: "BrBG", colors: ["#543005", "#f5f5f5", "#003c30"] },
]

const categoricalPalettes = [
  { name: "Category10", colors: ["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd"] },
  { name: "Set3", colors: ["#8dd3c7", "#ffffb3", "#bebada", "#fb8072", "#80b1d3"] },
  { name: "Pastel1", colors: ["#fbb4ae", "#b3cde3", "#ccebc5", "#decbe4", "#fed9a6"] },
]

const colorSchemes = {
  Blues: ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"],
  Greens: ["#f7fcf5", "#e0f3db", "#ccebc5", "#a8ddb5", "#7bccc4", "#4eb3d3", "#2b8cbe", "#0868ac", "#084081"],
  Reds: ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"],
  Purples: ["#fcfbfd", "#efedf5", "#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#54278f", "#3f007d"],
  Oranges: ["#fff5eb", "#fee6ce", "#fdd0a2", "#fdae6b", "#fd8d3c", "#f16913", "#d94801", "#a63603", "#7f2704"],
  Grays: ["#ffffff", "#f0f0f0", "#d9d9d9", "#bdbdbd", "#969696", "#737373", "#525252", "#252525", "#000000"],
}

// Helper function to return a gray icon (used for panel titles)
const getGrayTypeIcon = (type: string) => {
  switch (type) {
    case "coordinate":
      return <MapPin className="w-3 h-3 text-gray-500 dark:text-gray-400" />
    case "number":
      return <Hash className="w-3 h-3 text-gray-500 dark:text-gray-400" />
    case "date":
      return <Calendar className="w-3 h-3 text-gray-500 dark:text-gray-400" />
    case "state":
      return <Flag className="w-3 h-3 text-gray-500 dark:text-gray-400" />
    default:
      return <Type className="w-3 h-3 text-gray-500 dark:text-gray-400" />
  }
}

// Helper function to return a colored icon (used for dropdown items)
const getColoredTypeIcon = (type: string) => {
  let IconComponent: React.ElementType
  let colorClasses: string

  switch (type) {
    case "coordinate":
      IconComponent = MapPin
      colorClasses = "text-purple-600 dark:text-purple-400"
      break
    case "number":
      IconComponent = Hash
      colorClasses = "text-green-600 dark:text-green-400"
      break
    case "date":
      IconComponent = Calendar
      colorClasses = "text-blue-600 dark:text-blue-400"
      break
    case "state":
      IconComponent = Flag
      colorClasses = "text-orange-600 dark:text-orange-400"
      break
    case "text":
    default:
      IconComponent = Type
      colorClasses = "text-gray-600 dark:text-gray-400"
      break
  }
  return <IconComponent className={cn("w-3 h-3", colorClasses)} />
}

// Helper function to parse compact numbers (e.g., "45M")
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

// Format a number value based on the selected format (replicated from data-preview)
const formatNumber = (value: any, format: string): string => {
  if (value === null || value === undefined || value === "") return ""

  let num: number
  const strValue = String(value).trim()

  const compactNum = parseCompactNumber(strValue)
  if (compactNum !== null) {
    num = compactNum
  } else {
    const cleanedValue = strValue.replace(/[,$%]/g, "")
    num = Number.parseFloat(cleanedValue)
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

// Format a date value based on the selected format (replicated from data-preview)
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

// State abbreviation to full name mapping (re-declared for this component's scope)
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

// Reverse mapping for full name to abbreviation (re-declared for this component's scope)
const reverseStateMap: Record<string, string> = Object.fromEntries(
  Object.entries(stateMap).map(([abbr, full]) => [full.toLowerCase(), abbr]),
)

// Helper to get default format for a type (replicated from data-preview)
const getDefaultFormat = (type: "number" | "date" | "state" | "coordinate"): string => {
  switch (type) {
    case "number":
      return "raw"
    case "date":
      return "yyyy-mm-dd"
    case "state":
      return "abbreviated"
    case "coordinate":
      return "raw" // Coordinates typically don't have specific formats beyond raw numbers
    default:
      return "raw"
  }
}

// Helper function to format legend values based on column type and format
export const formatLegendValue = (value: any, column: string, columnTypes: any, columnFormats: any): string => {
  const type = columnTypes[column] || "text"
  // FIX: Add fallback to getDefaultFormat if columnFormats[column] is not set
  const format = columnFormats[column] || getDefaultFormat(type as "number" | "date" | "state" | "coordinate")

  if (type === "number") {
    return formatNumber(value, format)
  }
  if (type === "date") {
    return formatDate(value, format)
  }
  if (type === "state") {
    return formatState(value, format)
  }
  return String(value)
}

// NEW: Helper function to render the label preview
const renderLabelPreview = (
  template: string,
  firstRow: DataRow | GeocodedRow | undefined,
  columnTypes: { [key: string]: "text" | "number" | "date" | "coordinate" | "state" },
  columnFormats: { [key: string]: string },
): string => {
  if (!template || !firstRow) {
    return "No data or template to preview."
  }

  let previewHtml = template.replace(/{([^}]+)}/g, (match, columnName) => {
    const value = firstRow[columnName]
    if (value === undefined || value === null) {
      return "" // Or a placeholder like "[N/A]"
    }
    const type = columnTypes[columnName] || "text"
    const format = columnFormats[columnName] || getDefaultFormat(type as "number" | "date" | "state" | "coordinate")
    return formatLegendValue(value, columnName, columnTypes, columnFormats)
  })

  // Replace line breaks with <br> for HTML rendering
  previewHtml = previewHtml.replace(/\n/g, "<br/>") // Handle actual newlines for line breaks

  return previewHtml
}

// Refactored applyColorSchemePreset to return new settings (NO onUpdateSettings call inside)
const applyColorSchemePreset = (
  schemeName: string,
  section: "symbol" | "choropleth", // REMOVED: custom
  colorScale: "linear" | "categorical",
  colorByColumn: string,
  currentDimensionSettings: DimensionSettings, // Pass current settings
  getUniqueValuesFunc: (column: string) => string[], // Renamed to avoid conflict
  customSchemes: { name: string; type: "linear" | "categorical"; colors: string[]; hasMidpoint?: boolean }[], // Pass custom schemes
  currentShowMidpoint: boolean, // Pass the current state of showMidpointSymbol/Choropleth
): DimensionSettings => {
  let colors: string[] | undefined

  if (schemeName.startsWith("custom-linear-")) {
    const customName = schemeName.replace("custom-linear-", "")
    const customLinearScheme = customSchemes.find((s) => s.name === customName && s.type === "linear")
    if (customLinearScheme) {
      colors = customLinearScheme.colors
    }
  } else {
    colors = d3ColorSchemes[schemeName as keyof typeof d3ColorSchemes]
  }

  if (!colors) {
    console.warn(`Color scheme "${schemeName}" not found`)
    return currentDimensionSettings
  }

  const newSectionSettings = { ...currentDimensionSettings[section] }

  if (colorScale === "linear") {
    newSectionSettings.colorMinColor = colors[0]
    newSectionSettings.colorMaxColor = colors[colors.length - 1]

    // Only set midpoint color if the midpoint is currently shown/active
    if (currentShowMidpoint) {
      if (colors.length >= 3) {
        newSectionSettings.colorMidColor = colors[Math.floor(colors.length / 2)] // Use existing mid color if available
      } else {
        // Interpolate for 2-color schemes and convert to hex
        const d3Scale = d3
          .scaleLinear()
          .domain([0, 1])
          .range([colors[0], colors[colors.length - 1]])
        newSectionSettings.colorMidColor = d3.color(d3Scale(0.5))?.hex() || "#808080"
      }
    } else {
      // If midpoint is not meant to be shown, explicitly clear its color.
      // This handles cases where a preset with a midpoint was previously applied,
      // then user removed midpoint, and then applies another preset.
      newSectionSettings.colorMidColor = ""
    }

    newSectionSettings.colorPalette = schemeName
  } else if (colorScale === "categorical" && colorByColumn) {
    const uniqueValues = getUniqueValuesFunc(colorByColumn) // Use the passed function
    const categoricalColors = uniqueValues.map((_, index) => ({
      value: `color-${index}`,
      color: colors[index % colors.length], // Cycle through colors
    }))

    newSectionSettings.categoricalColors = categoricalColors
    newSectionSettings.colorPalette = schemeName
  }

  return {
    ...currentDimensionSettings,
    [section]: newSectionSettings,
  }
}

export function DimensionMapping({
  mapType,
  symbolDataExists,
  choroplethDataExists,
  customDataExists, // Still needed to determine if custom map is active
  columnTypes,
  dimensionSettings,
  onUpdateSettings,
  columnFormats, // Receive columnFormats prop
  symbolParsedData,
  symbolGeocodedData,
  choroplethParsedData,
  choroplethGeocodedData,
  symbolColumns,
  choroplethColumns,
  selectedGeography, // NEW: Add selectedGeography prop
}: DimensionMappingProps) {
  // Add this log at the beginning of the function
  console.log("Current symbol size range:", dimensionSettings.symbol.sizeMin, "-", dimensionSettings.symbol.sizeMax)

  const [isExpanded, setIsExpanded] = useState(true)
  const [expandedPanels, setExpandedPanels] = useState<{ [key: string]: boolean }>({
    coordinates: true,
    size: false,
    color: false,
    state: true,
    fill: false,
    labels: false, // NEW: Add labels panel state
  })

  // Internal state for active tab, synchronized with mapType prop on initial load/change
  // If mapType is "custom", we treat it as "choropleth" for dimension mapping UI purposes
  const [internalActiveTab, setInternalActiveTab] = useState<"symbol" | "choropleth">(
    mapType === "custom" ? "choropleth" : mapType,
  )

  // State for selected color scheme preset
  const [selectedSymbolColorScheme, setSelectedSymbolColorScheme] = useState<string>("")
  const [selectedChoroplethColorScheme, setSelectedChoroplethColorScheme] = useState<string>("")
  // REMOVED: selectedCustomColorScheme

  // State for custom categorical schemes loaded from local storage
  const [customSchemes, setCustomSchemes] = useState<
    { name: string; type: "linear" | "categorical"; colors: string[]; hasMidpoint?: boolean }[]
  >([])

  // State for Save Scheme Modal
  const [showSaveSchemeModal, setShowSaveSchemeModal] = useState(false)
  const [schemeColorsToSave, setSchemeColorsToSave] = useState<string[]>([])
  const [schemeSectionToSave, setSchemeSectionToSave] = useState<"symbol" | "choropleth" | null>(null) // REMOVED: custom
  const [schemeTypeToSave, setSchemeTypeToSave] = useState<"linear" | "categorical" | null>(null) // NEW
  const [schemeHasMidpointToSave, setSchemeHasMidpointToSave] = useState(false) // NEW

  // NEW: State to control visibility of midpoint inputs
  const [showMidpointSymbol, setShowMidpointSymbol] = useState(false)
  const [showMidpointChoropleth, setShowMidpointChoropleth] = useState(false)
  // REMOVED: showMidpointCustom

  // Load custom schemes from local storage on mount
  useEffect(() => {
    try {
      const storedSchemes = localStorage.getItem("v0_custom_color_schemes")
      if (storedSchemes) {
        setCustomSchemes(JSON.parse(storedSchemes))
      }
    } catch (error) {
      console.error("Failed to load custom color schemes from local storage:", error)
    }
  }, [])

  const saveCustomScheme = (name: string, type: "linear" | "categorical", colors: string[], hasMidpoint?: boolean) => {
    const newScheme = { name, type, colors, hasMidpoint }
    const updatedSchemes = [...customSchemes.filter((s) => s.name !== name || s.type !== type), newScheme] // Filter by name AND type
    setCustomSchemes(updatedSchemes)
    try {
      localStorage.setItem("v0_custom_color_schemes", JSON.stringify(updatedSchemes))
      console.log(`Saved custom ${type} scheme "${name}"`)
    } catch (error) {
      console.error("Failed to save custom color scheme to local storage:", error)
    }
  }

  // Ref to store the latest dimensionSettings to avoid it being a dependency of the main effect
  const latestDimensionSettings = useRef(dimensionSettings)
  useEffect(() => {
    latestDimensionSettings.current = dimensionSettings
  }, [dimensionSettings])

  // Ref to store the initial data-derived min/mid/max values for color scales
  const initialColorValues = useRef<{
    symbol: { min: number | null; mid: number | null; max: number | null }
    choropleth: { min: number | null; mid: number | null; max: number | null }
  }>({
    symbol: { min: null, mid: null, max: null },
    choropleth: { min: null, mid: null, max: null },
  })

  // Ref to store the values that were last auto-populated by this effect
  const lastAutoPopulatedValues = useRef<{
    symbol: { min: number | null; mid: number | null; max: number | null }
    choropleth: { min: null; mid: null; max: number | null }
  }>({
    symbol: { min: null, mid: null, max: null },
    choropleth: { min: null, mid: null, max: null },
  })

  // Ref to store the previous colorBy and colorScale values for the active tab
  // This helps detect changes in these specific settings without making dimensionSettings a direct dependency
  const prevActiveTabColorSettings = useRef<{
    colorBy: string | null
    colorScale: string | null
  }>({
    colorBy: null,
    colorScale: null,
  })

  // Synchronize internalActiveTab with mapType prop
  useEffect(() => {
    setInternalActiveTab(mapType === "custom" ? "choropleth" : mapType)
  }, [mapType])

  // Drag and drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const toSentenceCase = (str: string) => {
    if (!str) return ""
    return str.charAt(0).toUpperCase() + str.slice(1)
  }

  // Helper to get the display data for the currently active internal tab
  const getDisplayDataForTab = (tab: "symbol" | "choropleth") => {
    if (tab === "symbol") {
      return symbolGeocodedData.length > 0 ? symbolGeocodedData : symbolParsedData
    } else if (tab === "choropleth") {
      // Choropleth and custom maps use choropleth data for dimension mapping
      return choroplethGeocodedData.length > 0 ? choroplethGeocodedData : choroplethParsedData
    }
    return []
  }

  // Helper to get the columns for the currently active internal tab
  const getColumnsForTab = (tab: "symbol" | "choropleth") => {
    if (tab === "symbol") {
      return symbolColumns
    } else if (tab === "choropleth") {
      // Choropleth and custom maps use choropleth columns for dimension mapping
      return choroplethColumns
    }
    return []
  }

  // Calculate min/max values for numeric columns
  const getColumnStats = (column: string, tab: "symbol" | "choropleth") => {
    const currentDisplayData = getDisplayDataForTab(tab)
    if (!column || !currentDisplayData.length) return { min: 0, max: 100 }

    const values = currentDisplayData
      .map((row) => {
        const rawValue = String(row[column] || "").trim()
        let parsedNum: number | null = parseCompactNumber(rawValue)

        if (parsedNum === null) {
          // Fallback for regular numbers (e.g., "1,234.56", "$100")
          const cleanedValue = rawValue.replace(/[,$%]/g, "")
          parsedNum = Number.parseFloat(cleanedValue)
        }
        return parsedNum
      })
      .filter((val) => !isNaN(val))

    if (values.length === 0) return { min: 0, max: 100 }

    return {
      min: Math.min(...values),
      max: Math.max(...values),
    }
  }

  // Get unique values for categorical columns
  const getUniqueValues = (column: string) => {
    const currentDisplayData = getDisplayDataForTab(internalActiveTab)
    if (!column || !currentDisplayData.length) return []

    return [...new Set(currentDisplayData.map((row) => String(row[column] || "")).filter(Boolean))].sort()
  }

  // Get the format for a specific column
  const getColumnFormat = (column: string): string => {
    return columnFormats[column] || "raw"
  }

  // Renamed updateSetting to handleDimensionSettingChange
  const handleDimensionSettingChange = (section: "symbol" | "choropleth", key: string, value: any) => {
    // Handle null values by converting to 0 for numeric settings
    const processedValue =
      value === null && (key.includes("Value") || key.includes("Min") || key.includes("Max")) ? 0 : value

    const newSettings = {
      ...dimensionSettings,
      [section]: {
        ...dimensionSettings[section],
        [key]: processedValue,
      },
    }

    if (key === "sizeBy" && processedValue) {
      const stats = getColumnStats(processedValue, section)
      onUpdateSettings({
        ...newSettings,
        [section]: {
          ...newSettings[section],
          sizeMinValue: stats.min,
          sizeMaxValue: stats.max,
        },
      })
    } else if (key === "colorBy" && processedValue) {
      const columnType = columnTypes[processedValue]
      const isNumericOrDate = columnType === "number" || columnType === "date"

      if (isNumericOrDate) {
        const stats = getColumnStats(processedValue, section)
        initialColorValues.current = {
          ...initialColorValues.current,
          [section]: { min: stats.min, mid: (stats.min + stats.max) / 2, max: stats.max },
        }
        lastAutoPopulatedValues.current = {
          ...lastAutoPopulatedValues.current,
          [section]: { min: stats.min, mid: (stats.min + stats.max) / 2, max: stats.max },
        }

        // Determine default linear palette
        const defaultLinearPaletteName = colorSchemeCategories.sequential["Single Hue"][0] // "Blues"
        const defaultLinearColors = d3ColorSchemes[defaultLinearPaletteName as keyof typeof d3ColorSchemes]

        // Apply default colors
        const minColor = defaultLinearColors[0]
        const maxColor = defaultLinearColors[defaultLinearColors.length - 1]
        let midColor = ""
        // If the default palette has 3+ colors, use its middle color, otherwise interpolate
        if (defaultLinearColors.length >= 3) {
          midColor = defaultLinearColors[Math.floor(defaultLinearColors.length / 2)]
        } else {
          const d3Scale = d3.scaleLinear().domain([0, 1]).range([minColor, maxColor])
          midColor = d3.color(d3Scale(0.5))?.hex() || "#808080"
        }

        onUpdateSettings({
          ...newSettings,
          [section]: {
            ...newSettings[section],
            colorScale: "linear", // Force linear if numeric/date
            colorMinValue: stats.min,
            colorMidValue: (stats.min + stats.max) / 2,
            colorPalette: defaultLinearPaletteName, // Set default palette
            colorMinColor: minColor,
            colorMidColor: midColor,
            colorMaxColor: maxColor,
          },
        })
      } else {
        const uniqueValues = getUniqueValues(processedValue)
        const defaultColors = categoricalPalettes[0].colors
        initialColorValues.current = {
          ...initialColorValues.current,
          [section]: { min: null, mid: null, max: null },
        }
        lastAutoPopulatedValues.current = {
          ...lastAutoPopulatedValues.current,
          [section]: { min: null, mid: null, max: null },
        }

        // Initialize categoricalColors with stable IDs and default colors
        const categoricalColors = uniqueValues.map((_, idx) => ({
          value: `color-${idx}`, // Stable ID for the UI element
          color: defaultColors[idx % defaultColors.length],
        }))

        onUpdateSettings({
          ...newSettings,
          [section]: {
            ...newSettings[section],
            colorScale: "categorical", // Force categorical if not numeric/date
            categoricalColors,
            colorPalette: "", // Clear palette when colorBy changes to categorical
          },
        })
      }
    } else {
      onUpdateSettings(newSettings)
    }
  }

  // New function to handle color input changes and clear the preset
  const handleColorValueChange = (
    section: "symbol" | "choropleth", // REMOVED: custom
    colorKey: "colorMinColor" | "colorMidColor" | "colorMaxColor",
    value: string,
  ) => {
    const newSectionSettings = { ...dimensionSettings[section] }
    newSectionSettings[colorKey] = value
    newSectionSettings.colorPalette = "" // Clear the preset

    const newSettings = {
      ...dimensionSettings,
      [section]: newSectionSettings,
    }
    onUpdateSettings(newSettings)

    // Also update the local state for the dropdown to reflect no preset selected
    if (section === "symbol") {
      setSelectedSymbolColorScheme("")
    } else if (section === "choropleth") {
      setSelectedChoroplethColorScheme("")
    }
  }

  // New function to handle categorical color changes and clear the preset
  const handleCategoricalColorChange = (
    section: "symbol" | "choropleth", // REMOVED: custom
    index: number,
    newColor: string,
  ) => {
    const newSectionSettings = { ...dimensionSettings[section] }
    const newCategoricalColors = [...newSectionSettings.categoricalColors]
    newCategoricalColors[index] = { ...newCategoricalColors[index], color: newColor }
    newSectionSettings.categoricalColors = newCategoricalColors
    newSectionSettings.colorPalette = "" // Clear the preset

    const newSettings = {
      ...dimensionSettings,
      [section]: newSectionSettings,
    }
    onUpdateSettings(newSettings)

    // Also update the local state for the dropdown to reflect no preset selected
    if (section === "symbol") {
      setSelectedSymbolColorScheme("")
    } else if (section === "choropleth") {
      setSelectedChoroplethColorScheme("")
    }
  }

  const togglePanel = (panelKey: string) => {
    setExpandedPanels((prev) => ({
      ...prev,
      [panelKey]: !prev[panelKey],
    }))
  }

  // Updated getColumnsByType to properly filter based on columnTypes from data preview
  const getColumnsByType = (types: string[]) => {
    const relevantColumns = getColumnsForTab(internalActiveTab)
    const currentTabDisplayData = getDisplayDataForTab(internalActiveTab)

    return relevantColumns.filter((col) => {
      const columnType = columnTypes[col]

      // Special handling for coordinate type - include geocoded columns
      if (types.includes("coordinate")) {
        const lowerCol = col.toLowerCase()
        if (columnType === "coordinate") {
          return true
        }
        if (
          (lowerCol === "latitude" || lowerCol === "longitude") &&
          currentTabDisplayData.some((row) => row.latitude !== undefined && row.latitude !== null)
        ) {
          return true
        }
      }

      // For all other types, strictly use the columnTypes from data preview
      return types.includes(columnType || "text")
    })
  }

  // Updated getColumnIcon to use the correct column type from columnTypes prop
  const getColumnIcon = (column: string) => {
    const columnType = columnTypes[column]
    const lowerCol = column.toLowerCase()
    const currentTabDisplayData = getDisplayDataForTab(internalActiveTab)

    // Special handling for geocoded columns that might not be typed yet
    if (
      (lowerCol === "latitude" || lowerCol === "longitude") &&
      currentTabDisplayData.some((row) => row.latitude !== undefined && row.longitude !== null) &&
      !columnType
    ) {
      return getColoredTypeIcon("coordinate")
    }

    // Use the column type from the data preview panel
    return getColoredTypeIcon(columnType || "text")
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number, section: "symbol" | "choropleth") => {
    e.preventDefault()

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const currentColors = [...dimensionSettings[section].categoricalColors] // Use dimensionSettings directly
    const draggedItem = currentColors[draggedIndex]

    // Remove the dragged item
    currentColors.splice(draggedIndex, 1)

    // Insert at the new position
    const insertIndex = draggedIndex < dropIndex ? dropIndex - 1 : dropIndex
    currentColors.splice(insertIndex, 0, draggedItem)

    handleDimensionSettingChange(section, "categoricalColors", currentColors) // Use new handler

    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  // Logic for "Add color +" button
  const handleAddColor = (section: "symbol" | "choropleth") => {
    const currentSettings = dimensionSettings[section]
    const currentCategoricalColors = currentSettings.categoricalColors
    const selectedSchemeName = currentSettings.colorPalette // This is the name of the last applied preset

    let newColor = "#cccccc" // Default fallback color

    if (selectedSchemeName) {
      let sourceColors: string[] | undefined
      if (selectedSchemeName.startsWith("custom-")) {
        const customName = selectedSchemeName.replace("custom-", "")
        sourceColors = customSchemes.find((s) => s.name === customName && s.type === "categorical")?.colors
      } else {
        sourceColors = d3ColorSchemes[selectedSchemeName as keyof typeof d3ColorSchemes]
      }

      if (sourceColors && sourceColors.length > 0) {
        const usedColors = new Set(currentCategoricalColors.map((item) => item.color))
        let foundNewColor = false
        for (const color of sourceColors) {
          if (!usedColors.has(color)) {
            newColor = color
            foundNewColor = true
            break
          }
        }
        // If all sourceColors are already used, cycle through them based on current length
        if (!foundNewColor) {
          newColor = sourceColors[currentCategoricalColors.length % sourceColors.length]
        }
      }
    }

    const newCategoricalColors = [
      ...currentCategoricalColors,
      { value: `color-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, color: newColor }, // Unique dummy key
    ]
    handleDimensionSettingChange(section, "categoricalColors", newCategoricalColors)
  }

  // Logic for "Add midpoint" button
  const handleAddMidpoint = (section: "symbol" | "choropleth") => {
    const currentSettings = dimensionSettings[section]
    const stats = getColumnStats(currentSettings.colorBy, section)

    // Get the current selected palette's colors to find a mid-color
    let paletteColors: string[] | undefined
    const selectedSchemeName = currentSettings.colorPalette

    if (selectedSchemeName.startsWith("custom-linear-")) {
      const customName = selectedSchemeName.replace("custom-linear-", "")
      paletteColors = customSchemes.find((s) => s.name === customName && s.type === "linear")?.colors
    } else if (d3ColorSchemes[selectedSchemeName as keyof typeof d3ColorSchemes]) {
      paletteColors = d3ColorSchemes[selectedSchemeName as keyof typeof d3ColorSchemes]
    }

    let newMidColor = "#808080" // Default grey fallback for interpolation

    // Ensure min/max colors are available for interpolation if no palette is selected
    const minColorForInterpolation = currentSettings.colorMinColor || "#000000" // Default black
    const maxColorForInterpolation = currentSettings.colorMaxColor || "#FFFFFF" // Default white

    if (paletteColors && paletteColors.length >= 3) {
      newMidColor = paletteColors[Math.floor(paletteColors.length / 2)] // Use the actual middle color from a 3+ color scheme
    } else if (minColorForInterpolation && maxColorForInterpolation) {
      // Use the ensured colors
      // Interpolate if only two colors are present and convert to hex
      const d3Scale = d3.scaleLinear().domain([0, 1]).range([minColorForInterpolation, maxColorForInterpolation])
      newMidColor = d3.color(d3Scale(0.5))?.hex() || "#808080"
    }

    const newMidValue = (stats.min + stats.max) / 2

    const updates: Partial<typeof currentSettings> = {}
    updates.colorMidValue = newMidValue // Always set to data-derived midpoint value when adding
    updates.colorMidColor = newMidColor // Set intelligently derived midpoint color

    // Always set midpoint visibility to true when adding
    if (section === "symbol") setShowMidpointSymbol(true)
    if (section === "choropleth") setShowMidpointChoropleth(true)
  }

  // Implement `handleRemoveMidpoint` function
  const handleRemoveMidpoint = (section: "symbol" | "choropleth") => {
    const currentSettings = dimensionSettings[section]
    // Reset mid values and hide midpoint
    const newSettings = {
      ...dimensionSettings,
      [section]: {
        ...currentSettings,
        colorMidValue: 0, // Reset to default/empty value
        colorMidColor: "", // Reset to default/empty color
      },
    }
    onUpdateSettings(newSettings)
    // Explicitly hide midpoint when removing
    if (section === "symbol") setShowMidpointSymbol(false)
    if (section === "choropleth") setShowMidpointChoropleth(false)
  }

  // Logic for "Save scheme" button
  const handleSaveScheme = (section: "symbol" | "choropleth") => {
    const currentSettings = dimensionSettings[section]
    let colorsToSave: string[] = []

    if (currentSettings.colorScale === "linear") {
      // For linear, save min, mid, max colors
      colorsToSave = [
        currentSettings.colorMinColor,
        currentSettings.colorMidColor,
        currentSettings.colorMaxColor,
      ].filter(Boolean)
    } else {
      // For categorical, save all defined colors
      colorsToSave = currentSettings.categoricalColors.map((item) => item.color)
    }

    setSchemeColorsToSave(colorsToSave)
    setSchemeSectionToSave(section)
    // Pass the scheme type (linear/categorical) and midpoint status for linear schemes
    setShowSaveSchemeModal(true)
    setSchemeTypeToSave(currentSettings.colorScale) // Assuming a new state `schemeTypeToSave`
    if (currentSettings.colorScale === "linear") {
      setSchemeHasMidpointToSave(section === "symbol" ? showMidpointSymbol : showMidpointChoropleth)
    } else {
      setSchemeHasMidpointToSave(false)
    }
  }

  const handleSaveSchemeConfirm = (
    schemeName: string,
    colors: string[],
    type: "linear" | "categorical",
    hasMidpoint?: boolean,
  ) => {
    saveCustomScheme(schemeName, type, colors, hasMidpoint)
    const prefix = type === "linear" ? "custom-linear-" : "custom-"
    const fullSchemeName = `${prefix}${schemeName}`

    const sectionToUpdate = schemeSectionToSave as "symbol" | "choropleth" // Cast to correct type
    const currentSettingsForSection = dimensionSettings[sectionToUpdate]

    // Call applyColorSchemePreset to get the full updated settings for the section
    // This will set the colorPalette and the min/mid/max colors or categoricalColors
    const updatedSettings = applyColorSchemePreset(
      fullSchemeName, // The new scheme name to apply
      sectionToUpdate,
      type,
      currentSettingsForSection.colorBy,
      dimensionSettings, // Pass the current full dimensionSettings
      getUniqueValues, // Use the local getUniqueValues
      customSchemes,
      sectionToUpdate === "symbol" ? showMidpointSymbol : showMidpointChoropleth,
    )

    // Update the parent state with the new settings
    onUpdateSettings(updatedSettings)

    // Explicitly set the selected scheme for immediate UI update
    if (sectionToUpdate === "symbol") {
      setSelectedSymbolColorScheme(fullSchemeName)
    } else if (sectionToUpdate === "choropleth") {
      setSelectedChoroplethColorScheme(fullSchemeName)
    }
  }

  const handleDeleteCustomScheme = (schemeToDelete: string, section: "symbol" | "choropleth") => {
    let actualName = ""
    let actualType: "linear" | "categorical" = "categorical" // Default

    if (schemeToDelete.startsWith("custom-linear-")) {
      actualName = schemeToDelete.replace("custom-linear-", "")
      actualType = "linear"
    } else if (schemeToDelete.startsWith("custom-")) {
      actualName = schemeToDelete.replace("custom-", "")
      actualType = "categorical"
    } else {
      console.warn("Attempted to delete a non-custom scheme:", schemeToDelete)
      return
    }

    const updatedSchemes = customSchemes.filter((s) => !(s.name === actualName && s.type === actualType))
    setCustomSchemes(updatedSchemes)
    try {
      localStorage.setItem("v0_custom_color_schemes", JSON.stringify(updatedSchemes))
      console.log(`Deleted custom ${actualType} scheme "${actualName}"`)
    } catch (error) {
      console.error("Failed to delete custom color scheme to local storage:", error)
    }

    // Reset the selected scheme for the current section
    if (section === "symbol") {
      setSelectedSymbolColorScheme("") // Clear selection
      // Also clear the color palette in settings
      handleDimensionSettingChange("symbol", "colorPalette", "")
    } else if (section === "choropleth") {
      setSelectedChoroplethColorScheme("") // Clear selection
      // Also clear the color palette in settings
      handleDimensionSettingChange("choropleth", "colorPalette", "")
    }
  }

  // Auto-populate coordinate columns - Updated to handle geocoded columns better
  useEffect(() => {
    const currentColumns = getColumnsForTab(internalActiveTab)
    const currentDisplayData = getDisplayDataForTab(internalActiveTab)

    if (currentColumns.length > 0) {
      // Look for latitude columns with intelligent matching
      const latColumns = currentColumns.filter((col) => {
        const lowerCol = col.toLowerCase()
        return (
          lowerCol === "latitude" ||
          (lowerCol.includes("lat") && columnTypes[col] === "coordinate") ||
          // Also check if it's a geocoded latitude column even if not typed yet
          (lowerCol === "latitude" &&
            currentDisplayData.some((row) => row.latitude !== undefined && row.latitude !== null))
        )
      })

      // Look for longitude columns with intelligent matching
      const lngColumns = currentColumns.filter((col) => {
        const lowerCol = col.toLowerCase()
        return (
          lowerCol === "longitude" ||
          ((lowerCol.includes("lon") || lowerCol.includes("lng")) && columnTypes[col] === "coordinate") ||
          // Also check if it's a geocoded longitude column even if not typed yet
          (lowerCol === "longitude" &&
            currentDisplayData.some((row) => row.longitude !== undefined && row.longitude !== null))
        )
      })

      // Look for state columns
      const stateColumn = currentColumns.find((col) => columnTypes[col] === "state")

      // Prioritize exact matches first, then partial matches
      const bestLatColumn =
        latColumns.find((col) => col.toLowerCase() === "latitude") || latColumns[0] || dimensionSettings.symbol.latitude

      const bestLngColumn =
        lngColumns.find((col) => col.toLowerCase() === "longitude") ||
        lngColumns[0] ||
        dimensionSettings.symbol.longitude

      // Safely initialize updated settings objects
      const updatedSymbolSettings = { ...(dimensionSettings.symbol || {}) }
      const updatedChoroplethSettings = { ...(dimensionSettings.choropleth || {}) }
      let changed = false

      if (bestLatColumn && bestLatColumn !== updatedSymbolSettings.latitude) {
        updatedSymbolSettings.latitude = bestLatColumn
        changed = true
      }
      if (bestLngColumn && bestLngColumn !== updatedSymbolSettings.longitude) {
        updatedSymbolSettings.longitude = bestLngColumn
        changed = true
      }
      // Safely access stateColumn
      if (stateColumn && stateColumn !== (updatedChoroplethSettings.stateColumn || "")) {
        updatedChoroplethSettings.stateColumn = stateColumn
        changed = true
      }

      if (changed) {
        onUpdateSettings({
          ...dimensionSettings,
          symbol: updatedSymbolSettings,
          choropleth: updatedChoroplethSettings,
        })
      }
    }
  }, [
    internalActiveTab,
    symbolColumns,
    choroplethColumns,
    symbolParsedData,
    symbolGeocodedData,
    choroplethParsedData,
    choroplethGeocodedData,
    columnTypes,
    dimensionSettings, // This dependency is fine here as it's for initial auto-population of coordinates
    onUpdateSettings,
  ])

  // Main useEffect for auto-population of values and dynamic midpoint color updates
  useEffect(() => {
    const currentSettings = latestDimensionSettings.current[internalActiveTab]
    const colorByColumn = currentSettings.colorBy
    const colorScale = currentSettings.colorScale
    const currentTabType = internalActiveTab
    const currentColumnType = columnTypes[colorByColumn]
    const isNumericOrDate = currentColumnType === "number" || currentColumnType === "date"

    const hasColorByOrScaleChanged =
      colorByColumn !== prevActiveTabColorSettings.current.colorBy ||
      colorScale !== prevActiveTabColorSettings.current.colorScale

    const currentShowMidpoint = currentTabType === "symbol" ? showMidpointSymbol : showMidpointChoropleth

    const tempNewSettings = { ...currentSettings }
    let changesToParentSettings = false

    // --- Part 1: Auto-populate min/mid/max VALUES for linear scales ---
    if (colorByColumn && colorScale === "linear" && isNumericOrDate) {
      const stats = getColumnStats(colorByColumn, currentTabType)
      const dataMin = stats.min
      const dataMax = stats.max
      const dataMid = (dataMin + dataMax) / 2
      const epsilon = 1e-9

      const isMinDefaultOrAuto =
        (Math.abs(currentSettings.colorMinValue) < epsilon && currentSettings.colorMinValue === 0) ||
        (lastAutoPopulatedValues.current[currentTabType].min !== null &&
          Math.abs(currentSettings.colorMinValue - lastAutoPopulatedValues.current[currentTabType].min!) < epsilon)

      const isMaxDefaultOrAuto =
        (Math.abs(currentSettings.colorMaxValue) < epsilon && currentSettings.colorMaxValue === 0) ||
        (lastAutoPopulatedValues.current[currentTabType].max !== null &&
          Math.abs(currentSettings.colorMaxValue - lastAutoPopulatedValues.current[currentTabType].max!) < epsilon)

      if (
        (isMinDefaultOrAuto || hasColorByOrScaleChanged) &&
        Math.abs(tempNewSettings.colorMinValue - dataMin) >= epsilon
      ) {
        tempNewSettings.colorMinValue = dataMin
        changesToParentSettings = true
      }
      if (
        (isMaxDefaultOrAuto || hasColorByOrScaleChanged) &&
        Math.abs(tempNewSettings.colorMaxValue - dataMax) >= epsilon
      ) {
        tempNewSettings.colorMaxValue = dataMax
        changesToParentSettings = true
      }

      // Midpoint value logic: Auto-populate if midpoint is visible AND value is default/auto.
      const isMidValueDefaultOrAuto =
        (Math.abs(currentSettings.colorMidValue) < epsilon && currentSettings.colorMidValue === 0) ||
        (lastAutoPopulatedValues.current[currentTabType].mid !== null &&
          Math.abs(currentSettings.colorMidValue - lastAutoPopulatedValues.current[currentTabType].mid!) < epsilon)

      if (currentShowMidpoint && (isMidValueDefaultOrAuto || hasColorByOrScaleChanged)) {
        if (Math.abs(tempNewSettings.colorMidValue - dataMid) >= epsilon) {
          tempNewSettings.colorMidValue = dataMid
          changesToParentSettings = true
        }
      } else if (!currentShowMidpoint && tempNewSettings.colorMidColor !== "") {
        // If midpoint is not visible, ensure its value is cleared
        tempNewSettings.colorMidColor = ""
        changesToParentSettings = true
      }
    } else if (colorByColumn && colorScale === "categorical") {
      // Reset linear-specific values if switching to categorical
      if (initialColorValues.current[currentTabType].min !== null) {
        initialColorValues.current = {
          ...initialColorValues.current,
          [currentTabType]: { min: null, mid: null, max: null },
        }
        lastAutoPopulatedValues.current = {
          ...lastAutoPopulatedValues.current,
          [currentTabType]: { min: null, mid: null, max: null },
        }
        changesToParentSettings = true
      }
    }

    // Only update parent state if changes were detected
    if (changesToParentSettings) {
      onUpdateSettings({ ...latestDimensionSettings.current, [currentTabType]: tempNewSettings })
    }

    // Update ref for next render cycle
    prevActiveTabColorSettings.current = {
      colorBy: colorByColumn,
      colorScale: colorScale,
    }
  }, [
    internalActiveTab,
    dimensionSettings, // Keep this as the primary trigger for changes in settings
    symbolParsedData,
    symbolGeocodedData,
    choroplethParsedData,
    choroplethGeocodedData,
    columnTypes,
    onUpdateSettings,
    showMidpointSymbol,
    showMidpointChoropleth,
    customSchemes,
  ])

  // Add this useEffect after the existing effects to debug color updates
  useEffect(() => {
    const currentSettings = dimensionSettings[internalActiveTab]
    if (currentSettings.colorBy && currentSettings.colorScale === "linear") {
      console.log(`${internalActiveTab} linear colors:`, {
        min: { value: currentSettings.colorMinValue, color: currentSettings.colorMinColor },
        mid: { value: currentSettings.colorMidValue, color: currentSettings.colorMidColor },
        max: { value: currentSettings.colorMaxValue, color: currentSettings.colorMaxColor },
        palette: currentSettings.colorPalette,
      })
    }
  }, [dimensionSettings, internalActiveTab])

  // Determine the label for the "State" dimension setting based on selectedGeography
  let subFeatureDimensionLabel = "State"
  if (selectedGeography === "usa-counties") {
    subFeatureDimensionLabel = "County"
  } else if (selectedGeography === "canada-provinces") {
    subFeatureDimensionLabel = "Province"
  }

  // Update the renderDropdown function to show correct icons and ensure proper filtering
  const renderDropdown = (
    label: string,
    value: string,
    onValueChange: (value: string) => void,
    allowedTypes: string[],
    placeholder = "Select column",
  ) => {
    const availableColumns = getColumnsByType(allowedTypes)

    return (
      <div className="space-y-2 w-full">
        <div className="flex items-center gap-2">
          <Label className="text-sm font-medium">{label}</Label>
          <div className="flex gap-1">
            {allowedTypes.map((type, index) => (
              <span key={index}>{getGrayTypeIcon(type)}</span>
            ))}
          </div>
        </div>
        <Select value={value || "default"} onValueChange={(val) => onValueChange(val === "default" ? "" : val)}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="default">None</SelectItem>
            {availableColumns.map((column) => (
              <SelectItem key={column} value={column}>
                <div className="flex items-center gap-2">
                  {getColumnIcon(column)} {/* These icons are now colored */}
                  {toSentenceCase(column)}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <Card className="shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden">
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out py-5 px-6 rounded-t-xl relative"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-gray-900 dark:text-white transition-colors duration-200">
                Dimension mapping
              </CardTitle>
            </div>
            <div className="transform transition-transform duration-200 ease-in-out">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400 transition-colors duration-200" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400 transition-colors duration-200" />
              )}
            </div>
          </div>
        </CardHeader>

        <div
          className={`transition-all duration-300 ease-in-out ${
            isExpanded ? "max-h-[9999px] opacity-100" : "max-h-0 opacity-0"
          } overflow-hidden`}
        >
          <CardContent className="space-y-4 px-6 pb-6 pt-2">
            <div className="inline-flex h-auto items-center justify-start gap-2 bg-transparent p-0">
              {renderTabButton(
                "symbol",
                <MapPin className="w-3 h-3 mr-1.5 transition-transform duration-300 group-hover:translate-y-0.5" />,
                "Symbol map",
                internalActiveTab === "symbol", // Use internal state
              )}

              {renderTabButton(
                "choropleth",
                <BarChart3 className="w-3 h-3 mr-1.5 transition-transform duration-300 group-hover:translate-y-0.5" />,
                "Choropleth",
                internalActiveTab === "choropleth", // Use internal state
              )}
              {/* REMOVED: Custom map tab button */}
            </div>

            {internalActiveTab === "choropleth" && ( // Use internal state
              <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                {/* State Panel */}
                {renderSubPanel(
                  "state",
                  subFeatureDimensionLabel,
                  <Flag className="w-4 h-4" />,
                  dimensionSettings[internalActiveTab].stateColumn
                    ? toSentenceCase(dimensionSettings[internalActiveTab].stateColumn)
                    : "Not mapped",
                  <div>
                    {renderDropdown(
                      `${subFeatureDimensionLabel} column`,
                      dimensionSettings[internalActiveTab].stateColumn,
                      (value) => handleDimensionSettingChange(internalActiveTab, "stateColumn", value), // Use new handler
                      ["state"],
                    )}
                  </div>,
                )}

                {/* Fill Panel */}
                {renderSubPanel(
                  "fill",
                  "Fill",
                  <Palette className="w-4 h-4" />,
                  dimensionSettings[internalActiveTab].colorBy
                    ? toSentenceCase(dimensionSettings[internalActiveTab].colorBy)
                    : "Not mapped",
                  <div className="space-y-4">
                    <div className="flex items-end justify-between gap-2">
                      {" "}
                      {/* Flex container for alignment */}
                      {renderDropdown(
                        "Fill by",
                        dimensionSettings[internalActiveTab].colorBy,
                        (value) => handleDimensionSettingChange(internalActiveTab, "colorBy", value), // Use new handler
                        ["number", "text", "date", "state"],
                      )}
                      {dimensionSettings[internalActiveTab].colorBy && (
                        <ToggleGroup
                          type="single"
                          value={dimensionSettings[internalActiveTab].colorScale}
                          onValueChange={
                            (value: "linear" | "categorical") =>
                              value && handleDimensionSettingChange(internalActiveTab, "colorScale", value) // Use new handler
                          }
                          className="flex flex-shrink-0 h-auto rounded-md border bg-muted p-1 text-muted-foreground"
                          aria-label="Color scale type"
                        >
                          <ToggleGroupItem
                            value="linear"
                            aria-label="Linear scale"
                            className="h-7 px-3 text-xs data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
                          >
                            Linear scale
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="categorical"
                            aria-label="Categorical scale"
                            className="h-7 px-3 text-xs data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
                          >
                            Categorical scale
                          </ToggleGroupItem>
                        </ToggleGroup>
                      )}
                    </div>

                    {/* MOVED: Color Scheme Preset Dropdown for Choropleth / Custom */}
                    {dimensionSettings[internalActiveTab].colorBy && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Color scheme presets</Label>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSaveScheme(internalActiveTab)}
                            className="h-7 text-xs px-2"
                          >
                            <Save className="w-3 h-3 mr-1" /> Save scheme
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Select
                            value={selectedChoroplethColorScheme}
                            onValueChange={(schemeName) => {
                              setSelectedChoroplethColorScheme(schemeName)
                              if (schemeName) {
                                const updatedSettings = applyColorSchemePreset(
                                  schemeName,
                                  internalActiveTab,
                                  dimensionSettings[internalActiveTab].colorScale,
                                  dimensionSettings[internalActiveTab].colorBy, // Pass colorByColumn
                                  dimensionSettings,
                                  getUniqueValues, // Use the local getUniqueValues
                                  customSchemes,
                                  showMidpointChoropleth,
                                )
                                onUpdateSettings(updatedSettings)
                              }
                            }}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Choose a color scheme..." />
                            </SelectTrigger>

                            <SelectContent className="max-h-80">
                              {/* Conditional rendering based on colorScale */}
                              {dimensionSettings[internalActiveTab].colorScale === "linear" && (
                                <>
                                  {/* Sequential Schemes */}
                                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b bg-gray-50 dark:bg-gray-800">
                                    Sequential (Single Hue)
                                  </div>
                                  {colorSchemeCategories.sequential["Single Hue"].map((scheme) => (
                                    <SelectItem
                                      key={scheme}
                                      value={scheme}
                                      className="p-3 pl-8 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                      <div className="flex items-center gap-3 w-full">
                                        <span className="text-sm font-medium min-w-[80px] text-gray-900 dark:text-gray-100">
                                          {scheme}
                                        </span>
                                        <div className="flex-1 min-w-[120px]">
                                          {renderColorSchemePreview(
                                            d3ColorSchemes[scheme as keyof typeof d3ColorSchemes],
                                            "linear",
                                            scheme,
                                          )}
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {d3ColorSchemes[scheme as keyof typeof d3ColorSchemes].length} colors
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}

                                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-t bg-gray-50 dark:bg-gray-800">
                                    Sequential (Multi-Hue)
                                  </div>
                                  {colorSchemeCategories.sequential["Multi-Hue"].map((scheme) => (
                                    <SelectItem
                                      key={scheme}
                                      value={scheme}
                                      className="p-3 pl-8 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                      <div className="flex items-center gap-3 w-full">
                                        <span className="text-sm font-medium min-w-[80px] text-gray-900 dark:text-gray-100">
                                          {scheme}
                                        </span>
                                        <div className="flex-1 min-w-[120px]">
                                          {renderColorSchemePreview(
                                            d3ColorSchemes[scheme as keyof typeof d3ColorSchemes],
                                            "linear",
                                            scheme,
                                          )}
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {d3ColorSchemes[scheme as keyof typeof d3ColorSchemes].length} colors
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}

                                  {/* Diverging Schemes */}
                                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-t bg-gray-50 dark:bg-gray-800">
                                    Diverging
                                  </div>
                                  {colorSchemeCategories.diverging.map((scheme) => (
                                    <SelectItem
                                      key={scheme}
                                      value={scheme}
                                      className="p-3 pl-8 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                      <div className="flex items-center gap-3 w-full">
                                        <span className="text-sm font-medium min-w-[80px] text-gray-900 dark:text-gray-100">
                                          {scheme}
                                        </span>
                                        <div className="flex-1 min-w-[120px]">
                                          {renderColorSchemePreview(
                                            d3ColorSchemes[scheme as keyof typeof d3ColorSchemes],
                                            "linear",
                                            scheme,
                                          )}
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {d3ColorSchemes[scheme as keyof typeof d3ColorSchemes].length} colors
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                  {customSchemes.filter((s) => s.type === "linear").length > 0 && (
                                    <>
                                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-t bg-gray-50 dark:bg-gray-800">
                                        Custom Linear
                                      </div>
                                      {customSchemes
                                        .filter((s) => s.type === "linear")
                                        .map((scheme) => (
                                          <SelectItem
                                            key={`custom-linear-${scheme.name}`}
                                            value={`custom-linear-${scheme.name}`} // Prefix to distinguish
                                            className="p-3 pl-8 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                          >
                                            <div className="flex items-center gap-3 w-full">
                                              <span className="text-sm font-medium min-w-[80px] text-gray-900 dark:text-gray-100">
                                                {scheme.name}
                                              </span>
                                              <div className="flex-1 min-w-[120px]">
                                                {/* Render preview using the 3 colors */}
                                                {renderColorSchemePreview(
                                                  [
                                                    scheme.colors[0],
                                                    scheme.colors[1] || scheme.colors[0],
                                                    scheme.colors[2] || scheme.colors[0],
                                                  ],
                                                  "linear",
                                                  scheme.name,
                                                )}
                                              </div>
                                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                                {scheme.hasMidpoint ? "3 colors" : "2 colors"}
                                              </span>
                                            </div>
                                          </SelectItem>
                                        ))}
                                    </>
                                  )}
                                </>
                              )}

                              {dimensionSettings[internalActiveTab].colorScale === "categorical" && (
                                <>
                                  {/* Categorical Schemes */}
                                  <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-t bg-gray-50 dark:bg-gray-800">
                                    Categorical
                                  </div>
                                  {colorSchemeCategories.categorical.map((scheme) => (
                                    <SelectItem
                                      key={scheme}
                                      value={scheme}
                                      className="p-3 pl-8 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                    >
                                      <div className="flex items-center gap-3 w-full">
                                        <span className="text-sm font-medium min-w-[80px] text-gray-900 dark:text-gray-100">
                                          {scheme}
                                        </span>
                                        <div className="flex-1 min-w-[120px]">
                                          {renderColorSchemePreview(
                                            d3ColorSchemes[scheme as keyof typeof d3ColorSchemes],
                                            "categorical",
                                            scheme,
                                          )}
                                        </div>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          {d3ColorSchemes[scheme as keyof typeof d3ColorSchemes].length} colors
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                  {/* Custom Schemes */}
                                  {customSchemes.filter((s) => s.type === "categorical").length > 0 && ( // Filter by type
                                    <>
                                      <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-t bg-gray-50 dark:bg-gray-800">
                                        Custom Categorical
                                      </div>
                                      {customSchemes
                                        .filter((s) => s.type === "categorical")
                                        .map(
                                          (
                                            scheme, // Filter by type
                                          ) => (
                                            <SelectItem
                                              key={`custom-${scheme.name}`}
                                              value={`custom-${scheme.name}`} // Prefix to distinguish from D3 schemes
                                              className="p-3 pl-8 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                                            >
                                              <div className="flex items-center gap-3 w-full">
                                                <span className="text-sm font-medium min-w-[80px] text-gray-900 dark:text-gray-100">
                               \
