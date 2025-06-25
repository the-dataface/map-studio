"use client"

import { useState, useEffect, useCallback } from "react"
import { DataInput } from "@/components/data-input"
import { GeocodingSection } from "@/components/geocoding-section"
import { DataPreview } from "@/components/data-preview"
import { DimensionMapping } from "@/components/dimension-mapping"
import { MapPreview } from "@/components/map-preview"
import { Header } from "@/components/header"
import { Toaster } from "@/components/ui/toaster"
import { MapStyling } from "@/components/map-styling"
import { MapProjectionSelection } from "@/components/map-projection-selection"

export interface DataRow {
  [key: string]: string | number
}

export interface GeocodedRow extends DataRow {
  latitude?: number
  longitude?: number
  geocoded?: boolean
  source?: string
  processing?: boolean
}

interface DataState {
  rawData: string
  parsedData: DataRow[]
  geocodedData: GeocodedRow[]
  columns: string[]
  customMapData: string
}

interface ColumnType {
  [key: string]: "text" | "number" | "date" | "coordinate" | "state"
}

interface ColumnFormat {
  [key: string]: string
}

interface SavedStyle {
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
    defaultStateStrokeWidth: number
  }
}

// Define StylingSettings interface
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
    savedStyles: SavedStyle[]
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

// Default preset styles
const defaultPresetStyles: SavedStyle[] = [
  {
    id: "preset-light",
    name: "Light map",
    type: "preset",
    settings: {
      mapBackgroundColor: "#ffffff",
      nationFillColor: "#f0f0f0",
      nationStrokeColor: "#000000",
      nationStrokeWidth: 1,
      defaultStateFillColor: "#e0e0e0",
      defaultStateStrokeColor: "#999999",
      defaultStateStrokeWidth: 0.5,
    },
  },
  {
    id: "preset-dark",
    name: "Dark map",
    type: "preset",
    settings: {
      mapBackgroundColor: "#333333",
      nationFillColor: "#444444",
      nationStrokeColor: "#ffffff",
      nationStrokeWidth: 1,
      defaultStateFillColor: "#555555",
      defaultStateStrokeColor: "#888888",
      defaultStateStrokeWidth: 0.5,
    },
  },
]

export default function MapStudio() {
  // Separate data states for different map types
  const [symbolData, setSymbolData] = useState<DataState>({
    rawData: "",
    parsedData: [],
    geocodedData: [],
    columns: [],
    customMapData: "",
  })

  const [choroplethData, setChoroplethData] = useState<DataState>({
    rawData: "",
    parsedData: [],
    geocodedData: [],
    columns: [],
    customMapData: "",
  })

  const [customData, setCustomData] = useState<DataState>({
    rawData: "",
    parsedData: [],
    geocodedData: [],
    columns: [],
    customMapData: "",
  })

  const [isGeocoding, setIsGeocoding] = useState(false)
  const [activeMapType, setActiveMapType] = useState<"symbol" | "choropleth" | "custom">("symbol")
  const [dataInputExpanded, setDataInputExpanded] = useState(true)
  const [showGeocoding, setShowGeocoding] = useState(false)

  // Map Projection and Geography states
  const [selectedGeography, setSelectedGeography] = useState<
    "usa-states" | "usa-counties" | "usa-nation" | "canada-provinces" | "canada-nation" | "world"
  >("usa-states")
  const [selectedProjection, setSelectedProjection] = useState<"albersUsa" | "mercator" | "equalEarth" | "albers">(
    "albersUsa",
  ) // Added "albers"
  const [clipToCountry, setClipToCountry] = useState(false) // New state for clipping

  // Update the state management to connect dimension settings between components
  const [columnTypes, setColumnTypes] = useState<ColumnType>({})
  const [columnFormats, setColumnFormats] = useState<ColumnFormat>({})
  const [dimensionSettings, setDimensionSettings] = useState<any>(() => {
    const defaultChoroplethSettings = {
      stateColumn: "",
      colorBy: "",
      colorScale: "linear",
      colorPalette: "Blues",
      colorMinValue: 0,
      colorMidValue: 50,
      colorMaxValue: 100,
      colorMinColor: "#f7fbff",
      colorMidColor: "#6baed6",
      colorMaxColor: "#08519c",
      categoricalColors: [],
      labelTemplate: "",
    }
    return {
      symbol: {
        latitude: "",
        longitude: "",
        sizeBy: "",
        sizeMin: 5,
        sizeMax: 20,
        sizeMinValue: 0,
        sizeMaxValue: 100,
        colorBy: "",
        colorScale: "linear",
        colorPalette: "Blues",
        colorMinValue: 0,
        colorMidValue: 50,
        colorMaxValue: 100,
        colorMinColor: "#f7fbff",
        colorMidColor: "#6baed6",
        colorMaxColor: "#08519c",
        categoricalColors: [],
        labelTemplate: "",
      },
      choropleth: defaultChoroplethSettings,
      // NEW: Initialize custom with choropleth settings
      custom: { ...defaultChoroplethSettings },
    }
  })

  // Styling settings state, initialized from localStorage or defaults
  const [stylingSettings, setStylingSettings] = useState<StylingSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const savedStyles = localStorage.getItem("mapstudio_saved_styles")
        const initialBaseSettings = {
          mapBackgroundColor: "#ffffff",
          nationFillColor: "#f0f0f0",
          nationStrokeColor: "#000000",
          nationStrokeWidth: 1,
          defaultStateFillColor: "#e0e0e0",
          defaultStateStrokeColor: "#999999",
          defaultStateStrokeWidth: 0.5,
          savedStyles: savedStyles ? JSON.parse(savedStyles) : defaultPresetStyles,
        }

        // Attempt to load full styling settings if available, otherwise use defaults
        const savedStylingSettings = localStorage.getItem("mapstudio_styling_settings")
        if (savedStylingSettings) {
          const parsedSettings = JSON.parse(savedStylingSettings)
          return {
            ...parsedSettings,
            base: {
              ...parsedSettings.base,
              savedStyles: initialBaseSettings.savedStyles, // Ensure savedStyles are from the dedicated key
            },
          }
        }

        return {
          activeTab: "base",
          base: initialBaseSettings,
          symbol: {
            symbolType: "symbol",
            symbolShape: "circle",
            symbolFillColor: "#1f77b4",
            symbolStrokeColor: "#ffffff",
            symbolSize: 5,
            symbolStrokeWidth: 1,
            labelFontFamily: "Inter",
            labelBold: false,
            labelItalic: false,
            labelUnderline: false,
            labelStrikethrough: false,
            labelColor: "#333333",
            labelOutlineColor: "#ffffff",
            labelFontSize: 10,
            labelOutlineThickness: 0,
            labelAlignment: "auto",
            customSvgPath: "",
          },
          choropleth: {
            labelFontFamily: "Inter",
            labelBold: false,
            labelItalic: false,
            labelUnderline: false,
            labelStrikethrough: false,
            labelColor: "#333333",
            labelOutlineColor: "#ffffff",
            labelFontSize: 10,
            labelOutlineThickness: 0,
          },
        }
      } catch (error) {
        console.error("Failed to parse styling settings from localStorage", error)
        // Fallback to default if parsing fails
        return {
          activeTab: "base",
          base: {
            mapBackgroundColor: "#ffffff",
            nationFillColor: "#f0f0f0",
            nationStrokeColor: "#000000",
            nationStrokeWidth: 1,
            defaultStateFillColor: "#e0e0e0",
            defaultStateStrokeColor: "#999999",
            defaultStateStrokeWidth: 0.5,
            savedStyles: defaultPresetStyles,
          },
          symbol: {
            symbolType: "symbol",
            symbolShape: "circle",
            symbolFillColor: "#1f77b4",
            symbolStrokeColor: "#ffffff",
            symbolSize: 5,
            symbolStrokeWidth: 1,
            labelFontFamily: "Inter",
            labelBold: false,
            labelItalic: false,
            labelUnderline: false,
            labelStrikethrough: false,
            labelColor: "#333333",
            labelOutlineColor: "#ffffff",
            labelFontSize: 10,
            labelOutlineThickness: 0,
            labelAlignment: "auto",
            customSvgPath: "",
          },
          choropleth: {
            labelFontFamily: "Inter",
            labelBold: false,
            labelItalic: false,
            labelUnderline: false,
            labelStrikethrough: false,
            labelColor: "#333333",
            labelOutlineColor: "#ffffff",
            labelFontSize: 10,
            labelOutlineThickness: 0,
          },
        }
      }
    }
    // Default for server-side rendering or if window is undefined
    return {
      activeTab: "base",
      base: {
        mapBackgroundColor: "#ffffff",
        nationFillColor: "#f0f0f0",
        nationStrokeColor: "#000000",
        nationStrokeWidth: 1,
        defaultStateFillColor: "#e0e0e0",
        defaultStateStrokeColor: "#999999",
        defaultStateStrokeWidth: 0.5,
        savedStyles: defaultPresetStyles,
      },
      symbol: {
        symbolType: "symbol",
        symbolShape: "circle",
        symbolFillColor: "#1f77b4",
        symbolStrokeColor: "#ffffff",
        symbolSize: 5,
        symbolStrokeWidth: 1,
        labelFontFamily: "Inter",
        labelBold: false,
        labelItalic: false,
        labelUnderline: false,
        labelStrikethrough: false,
        labelColor: "#333333",
        labelOutlineColor: "#ffffff",
        labelFontSize: 10,
        labelOutlineThickness: 0,
        labelAlignment: "auto",
        customSvgPath: "",
      },
      choropleth: {
        labelFontFamily: "Inter",
        labelBold: false,
        labelItalic: false,
        labelUnderline: false,
        labelStrikethrough: false,
        labelColor: "#333333",
        labelOutlineColor: "#ffffff",
        labelFontSize: 10,
        labelOutlineThickness: 0,
      },
    }
  })

  // Effect to persist all styling settings to localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("mapstudio_styling_settings", JSON.stringify(stylingSettings))
      // Also persist only the saved styles separately for easier management
      localStorage.setItem("mapstudio_saved_styles", JSON.stringify(stylingSettings.base.savedStyles))
    }
  }, [stylingSettings])

  // Add a function to update dimension settings
  const updateDimensionSettings = (newSettings: any) => {
    setDimensionSettings(newSettings)
  }

  // Add a function to update styling settings
  const updateStylingSettings = (newSettings: StylingSettings) => {
    setStylingSettings(newSettings)
  }

  // Add a function to update column types
  const updateColumnTypes = (newTypes: ColumnType) => {
    setColumnTypes(newTypes)
  }

  // Add a function to update column formats
  const updateColumnFormats = (newFormats: ColumnFormat) => {
    setColumnFormats(newFormats)
  }

  const getCurrentData = () => {
    switch (activeMapType) {
      case "symbol":
        return symbolData
      case "choropleth":
        return choroplethData
      case "custom":
        return customData
      default:
        return symbolData
    }
  }

  // Check if any data exists for a specific map type
  const hasDataForType = (type: "symbol" | "choropleth" | "custom") => {
    switch (type) {
      case "symbol":
        return symbolData.parsedData.length > 0 || symbolData.geocodedData.length > 0
      case "choropleth":
        return choroplethData.parsedData.length > 0 || choroplethData.geocodedData.length > 0
      case "custom":
        return customData.customMapData.length > 0
      default:
        return false
    }
  }

  // Check if any data exists at all
  const hasAnyData = () => {
    return hasDataForType("symbol") || hasDataForType("choropleth") || hasDataForType("custom")
  }

  const onlyCustomDataLoaded = hasDataForType("custom") && !hasDataForType("symbol") && !hasDataForType("choropleth")

  const handleDataLoad = (
    mapType: "symbol" | "choropleth" | "custom",
    parsedData: DataRow[],
    columns: string[],
    rawData: string,
    customMapDataParam?: string,
  ) => {
    console.log("=== DATA LOAD DEBUG ===")
    console.log("Map type:", mapType)
    console.log("Custom map data param length:", customMapDataParam?.length || 0)
    console.log("Custom map data preview:", customMapDataParam?.substring(0, 100) || "none")

    const newDataState: DataState = {
      rawData,
      parsedData,
      geocodedData: [],
      columns,
      customMapData: customMapDataParam || "",
    }

    // Update the relevant data state
    switch (mapType) {
      case "symbol":
        setSymbolData(newDataState)
        setShowGeocoding(true)
        break
      case "choropleth":
        setChoroplethData(newDataState)
        break
      case "custom":
        console.log("Setting custom data with map data length:", newDataState.customMapData.length)
        setCustomData(newDataState)
        break
    }

    // NEW: Enhanced logic for determining active map type
    const hasCustomMap =
      (mapType === "custom" && customMapDataParam && customMapDataParam.length > 0) ||
      (mapType !== "custom" && customData.customMapData.length > 0)
    const hasChoroplethData =
      (mapType === "choropleth" && parsedData.length > 0) ||
      (mapType !== "choropleth" && choroplethData.parsedData.length > 0)

    console.log("Has custom map:", hasCustomMap)
    console.log("Has choropleth data:", hasChoroplethData)

    // Priority logic:
    // 1. If choropleth data is loaded and custom map exists -> use custom map with choropleth styling
    // 2. If only custom map exists -> use custom
    // 3. If only choropleth data exists -> use choropleth
    // 4. Otherwise use the loaded map type
    if (hasChoroplethData && hasCustomMap) {
      // Choropleth data with custom map -> render custom map with choropleth styling
      console.log("Setting active map type to: custom (choropleth + custom)")
      setActiveMapType("custom")
    } else if (mapType === "choropleth") {
      // Always activate choropleth tab when choropleth data is loaded
      console.log("Setting active map type to: choropleth")
      setActiveMapType("choropleth")
    } else if (hasCustomMap) {
      console.log("Setting active map type to: custom")
      setActiveMapType("custom")
    } else {
      console.log("Setting active map type to:", mapType)
      setActiveMapType(mapType)
    }

    setDataInputExpanded(false) // Collapse data input after loading

    // NEW: Infer geography and projection directly here
    let inferredGeo: "usa-states" | "usa-counties" | "usa-nation" | "canada-provinces" | "canada-nation" | "world" =
      "usa-states"
    let inferredProj: "albersUsa" | "mercator" | "equalEarth" = "albersUsa"

    const lowerCaseColumns = columns.map((col) => col.toLowerCase())
    const hasCountryColumn = lowerCaseColumns.some((col) => col.includes("country") || col.includes("nation"))
    const hasStateColumn = lowerCaseColumns.some((col) => col.includes("state") || col.includes("province"))
    const hasLatLon =
      lowerCaseColumns.some((col) => col.includes("lat")) && lowerCaseColumns.some((col) => col.includes("lon"))

    const sampleDataString = JSON.stringify(parsedData.slice(0, 10)).toLowerCase() // Use parsedData for inference
    const containsUsStates =
      sampleDataString.includes("california") ||
      sampleDataString.includes("texas") ||
      sampleDataString.includes("new york") ||
      sampleDataString.includes("florida")
    const containsWorldCountries =
      sampleDataString.includes("canada") ||
      sampleDataString.includes("china") ||
      sampleDataString.includes("india") ||
      sampleDataString.includes("brazil")

    // Check for Canadian provinces
    const hasCanadaProvinceColumn = lowerCaseColumns.some(
      (col) => col.includes("province") || col.includes("territory"),
    )
    const containsCanadaProvinces =
      sampleDataString.includes("ontario") ||
      sampleDataString.includes("quebec") ||
      sampleDataString.includes("alberta")

    // Check for US counties
    const hasCountyColumn = lowerCaseColumns.some((col) => col.includes("county") || col.includes("fips"))
    const containsUsCounties = sampleDataString.match(/\b\d{5}\b/) // Simple check for 5-digit FIPS

    if (hasCountryColumn || containsWorldCountries) {
      inferredGeo = "world"
      inferredProj = "equalEarth"
    } else if (hasCanadaProvinceColumn || containsCanadaProvinces) {
      inferredGeo = "canada-provinces"
      inferredProj = "mercator" // Mercator is often used for Canada
    } else if (hasCountyColumn || containsUsCounties) {
      inferredGeo = "usa-counties"
      inferredProj = "albersUsa"
    } else if (hasStateColumn || containsUsStates) {
      inferredGeo = "usa-states"
      inferredProj = "albersUsa"
    } else if (hasLatLon) {
      inferredGeo = "world" // Default to world for lat/lon if no other geo hint
      inferredProj = "mercator"
    }

    // Apply inferred settings if they are different from current defaults
    // This ensures user's previous manual selection isn't overridden if they re-load similar data
    if (inferredGeo !== selectedGeography) {
      setSelectedGeography(inferredGeo)
    }
    if (inferredProj !== selectedProjection) {
      setSelectedProjection(inferredProj)
    }
  }

  const handleClearData = (mapType: "symbol" | "choropleth" | "custom") => {
    const emptyDataState: DataState = {
      rawData: "",
      parsedData: [],
      geocodedData: [],
      columns: [],
      customMapData: "",
    }

    // Clear data for the specified map type
    switch (mapType) {
      case "symbol":
        setSymbolData(emptyDataState)
        setShowGeocoding(false) // Hide geocoding when symbol data is cleared
        break
      case "choropleth":
        setChoroplethData(emptyDataState)
        break
      case "custom":
        setCustomData(emptyDataState)
        break
    }

    // After clearing, re-evaluate which map type should be active
    // Check if any other data types still exist
    const hasSymbol = mapType !== "symbol" ? hasDataForType("symbol") : false
    const hasChoropleth = mapType !== "choropleth" ? hasDataForType("choropleth") : false
    const hasCustom = mapType !== "custom" ? hasDataForType("custom") : false

    // NEW: Enhanced priority logic after clearing
    if (hasChoropleth && hasCustom) {
      // If both choropleth data and custom map exist, use custom with choropleth
      setActiveMapType("custom")
    } else if (hasChoropleth) {
      setActiveMapType("choropleth")
    } else if (hasCustom) {
      setActiveMapType("custom")
    } else if (hasSymbol) {
      setActiveMapType("symbol")
    } else {
      // If no data exists anywhere, expand the data input panel
      setDataInputExpanded(true)
      setActiveMapType("symbol") // Default to symbol tab if no data
    }
  }

  const updateGeocodedData = (geocodedData: GeocodedRow[]) => {
    // Update symbol data with geocoded coordinates
    if (symbolData.parsedData.length > 0) {
      const newColumns = [...symbolData.columns]
      let latCol = dimensionSettings.symbol.latitude
      let lngCol = dimensionSettings.symbol.longitude

      // Check if 'latitude' and 'longitude' columns are newly added by geocoding
      if (!newColumns.includes("latitude") && geocodedData.some((row) => row.latitude !== undefined)) {
        newColumns.push("latitude")
        latCol = "latitude" // Set to the new geocoded column name
      }
      if (!newColumns.includes("longitude") && geocodedData.some((row) => row.longitude !== undefined)) {
        newColumns.push("longitude")
        lngCol = "longitude" // Set to the new geocoded column name
      }

      // Update column types to include the geocoded columns as coordinate type
      const newColumnTypes = { ...columnTypes }
      if (geocodedData.some((row) => row.latitude !== undefined)) {
        newColumnTypes["latitude"] = "coordinate"
      }
      if (geocodedData.some((row) => row.longitude !== undefined)) {
        newColumnTypes["longitude"] = "coordinate"
      }

      // Update both column types and symbol data
      setColumnTypes(newColumnTypes)
      setSymbolData((prev) => ({
        ...prev,
        geocodedData,
        columns: newColumns,
      }))

      // Directly update dimension settings for symbol map with geocoded columns
      // This ensures MapPreview gets the correct dimension settings immediately
      setDimensionSettings((prevSettings: any) => ({
        ...prevSettings,
        symbol: {
          ...prevSettings.symbol,
          latitude: latCol,
          longitude: lngCol,
        },
      }))
    }
  }

  // Get both symbol and choropleth data for the map preview
  const getSymbolDisplayData = () => {
    return symbolData.geocodedData.length > 0 ? symbolData.geocodedData : symbolData.parsedData
  }

  const getChoroplethDisplayData = () => {
    return choroplethData.geocodedData.length > 0 ? choroplethData.geocodedData : choroplethData.parsedData
  }

  // NEW: Enhanced function to determine which data to display in preview
  const getCurrentDisplayData = () => {
    // If custom map is active and choropleth data exists, show choropleth data
    if (activeMapType === "custom" && hasDataForType("choropleth")) {
      return getChoroplethDisplayData()
    }
    // Otherwise use the current data based on active map type
    const currentData = getCurrentData()
    return currentData.geocodedData.length > 0 ? currentData.geocodedData : currentData.parsedData
  }

  // NEW: Enhanced function to get current columns for preview
  const getCurrentColumns = useCallback(() => {
    // If custom map is active and choropleth data exists, show choropleth columns
    if (activeMapType === "custom" && hasDataForType("choropleth")) {
      return choroplethData.columns
    }
    // Otherwise use the current columns based on active map type
    return getCurrentData().columns
  }, [activeMapType, choroplethData.columns, symbolData.columns, customData.columns]) // Added dependencies

  // Provide a lightweight “sample” matrix so the projection panel can
  // guess geography. It uses only primitive values, so we keep it tiny.
  const getCurrentSampleRows = useCallback(() => {
    const rows =
      activeMapType === "symbol"
        ? symbolData.parsedData
        : activeMapType === "choropleth"
          ? choroplethData.parsedData
          : choroplethData.parsedData.length > 0
            ? choroplethData.parsedData
            : symbolData.parsedData

    return rows.slice(0, 10).map((r) => Object.values(r))
  }, [activeMapType, symbolData.parsedData, choroplethData.parsedData])

  useEffect(() => {
    // Only show geocoding panel when symbol data exists
    setShowGeocoding(symbolData.parsedData.length > 0)
  }, [symbolData.parsedData])

  // Effect to handle projection changes based on geography
  useEffect(() => {
    const isUSGeography =
      selectedGeography === "usa-states" || selectedGeography === "usa-counties" || selectedGeography === "usa-nation"

    if (!isUSGeography && (selectedProjection === "albersUsa" || selectedProjection === "albers")) {
      setSelectedProjection("mercator")
    }

    // If geography is not a single country, disable clipping
    const isSingleCountryGeography =
      selectedGeography === "usa-nation" || selectedGeography === "canada-nation" || selectedGeography === "world"
    if (!isSingleCountryGeography) {
      setClipToCountry(false)
    }
  }, [selectedGeography, selectedProjection])

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <DataInput
          onDataLoad={handleDataLoad}
          isExpanded={dataInputExpanded}
          setIsExpanded={setDataInputExpanded}
          onClearData={handleClearData} // Pass handleClearData to DataInput
        />

        {hasAnyData() &&
          !hasDataForType("custom") && ( // Conditional rendering for MapProjectionSelection
            <MapProjectionSelection
              geography={selectedGeography}
              projection={selectedProjection}
              onGeographyChange={setSelectedGeography}
              onProjectionChange={setSelectedProjection}
              columns={getCurrentColumns()}
              sampleRows={getCurrentSampleRows()}
              clipToCountry={clipToCountry} // New prop
              onClipToCountryChange={setClipToCountry} // New prop
            />
          )}

        {showGeocoding && (
          <GeocodingSection
            columns={symbolData.columns}
            parsedData={symbolData.parsedData}
            setGeocodedData={updateGeocodedData}
            isGeocoding={isGeocoding}
            setIsGeocoding={setIsGeocoding}
          />
        )}

        {hasAnyData() && (
          <>
            {!onlyCustomDataLoaded && (
              <>
                <DataPreview
                  data={getCurrentDisplayData()} // Use enhanced function
                  columns={getCurrentColumns()} // Use enhanced function
                  mapType={activeMapType}
                  onClearData={handleClearData}
                  symbolDataExists={hasDataForType("symbol")}
                  choroplethDataExists={hasDataForType("choropleth")}
                  customDataExists={hasDataForType("custom")}
                  columnTypes={columnTypes}
                  onUpdateColumnTypes={updateColumnTypes}
                  onUpdateColumnFormats={updateColumnFormats}
                  columnFormats={columnFormats}
                  // Pass data lengths for header badges
                  symbolDataLength={symbolData.parsedData.length}
                  choroplethDataLength={choroplethData.parsedData.length}
                  customDataLoaded={customData.customMapData.length > 0}
                  onMapTypeChange={setActiveMapType}
                />

                <DimensionMapping
                  mapType={activeMapType}
                  symbolDataExists={hasDataForType("symbol")}
                  choroplethDataExists={hasDataForType("choropleth")}
                  customDataExists={hasDataForType("custom")}
                  columnTypes={columnTypes}
                  dimensionSettings={dimensionSettings}
                  onUpdateSettings={updateDimensionSettings}
                  columnFormats={columnFormats}
                  // Pass specific data for each map type to DimensionMapping
                  symbolParsedData={symbolData.parsedData}
                  symbolGeocodedData={symbolData.geocodedData}
                  symbolColumns={symbolData.columns}
                  choroplethParsedData={choroplethData.parsedData}
                  choroplethGeocodedData={choroplethData.geocodedData}
                  choroplethColumns={choroplethData.columns}
                  selectedGeography={selectedGeography} // Add this line
                />
              </>
            )}
            <MapStyling
              stylingSettings={stylingSettings}
              onUpdateStylingSettings={updateStylingSettings}
              dimensionSettings={dimensionSettings}
              symbolDataExists={hasDataForType("symbol")}
              choroplethDataExists={hasDataForType("choropleth")}
              customDataExists={hasDataForType("custom")}
              selectedGeography={selectedGeography} // Add this line
            />

            <MapPreview
              symbolData={getSymbolDisplayData()}
              choroplethData={getChoroplethDisplayData()}
              symbolColumns={symbolData.columns}
              choroplethColumns={choroplethData.columns}
              mapType={activeMapType}
              dimensionSettings={dimensionSettings}
              stylingSettings={stylingSettings}
              symbolDataExists={hasDataForType("symbol")}
              choroplethDataExists={hasDataForType("choropleth")}
              columnTypes={columnTypes}
              columnFormats={columnFormats}
              customMapData={customData.customMapData}
              selectedGeography={selectedGeography}
              selectedProjection={selectedProjection}
              clipToCountry={clipToCountry} // New prop
            />
          </>
        )}
      </main>
      <Toaster />
    </div>
  )
}
