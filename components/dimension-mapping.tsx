"use client"

import { useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { sequentialColorPalettes, divergingColorPalettes, categoricalColorPalettes } from "@/lib/color-schemes"
import { Slider } from "@/components/ui/slider"
import { ColorInput } from "@/components/color-input"
import { ChromeColorPicker } from "@/components/chrome-color-picker"
import { TooltipProvider } from "@/components/ui/tooltip"
import { DataPreview } from "@/lib/data-preview" // Declare the DataPreview variable

// Interfaces and types, assuming they are defined elsewhere or passed correctly
interface ColumnType {
  [key: string]: "text" | "number" | "date" | "coordinate" | "state"
}

interface DataRow {
  [key: string]: string | number
}

interface GeocodedRow extends DataRow {
  latitude?: number
  longitude?: number
  geocoded?: boolean
  source?: string
  processing?: boolean
}

interface ColumnFormat {
  [key: string]: string
}

interface DimensionMappingProps {
  mapType: "symbol" | "choropleth" | "custom"
  symbolDataExists: boolean
  choroplethDataExists: boolean
  customDataExists: boolean
  columnTypes: ColumnType
  dimensionSettings: any
  onUpdateSettings: (newSettings: any) => void
  columnFormats: ColumnFormat
  symbolParsedData: DataRow[]
  symbolGeocodedData: GeocodedRow[]
  symbolColumns: string[]
  choroplethParsedData: DataRow[]
  choroplethGeocodedData: GeocodedRow[]
  choroplethColumns: string[]
  selectedGeography: "usa-states" | "usa-counties" | "usa-nation" | "canada-provinces" | "canada-nation" | "world"
}

export function DimensionMapping({
  mapType,
  symbolDataExists,
  choroplethDataExists,
  customDataExists,
  columnTypes,
  dimensionSettings,
  onUpdateSettings,
  columnFormats,
  symbolParsedData,
  symbolGeocodedData,
  symbolColumns,
  choroplethParsedData,
  choroplethGeocodedData,
  choroplethColumns,
  selectedGeography,
}: DimensionMappingProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null)
  const [tempColor, setTempColor] = useState<string | null>(null)

  const [isSymbolDimensionsOpen, setIsSymbolDimensionsOpen] = useState(true)
  const [isChoroplethDimensionsOpen, setIsChoroplethDimensionsOpen] = useState(true)
  const [isCustomMapDimensionsOpen, setIsCustomMapDimensionsOpen] = useState(true)

  const currentData = useMemo(() => {
    if (mapType === "symbol") {
      return symbolGeocodedData.length > 0 ? symbolGeocodedData : symbolParsedData
    } else if (mapType === "choropleth" || (mapType === "custom" && choroplethDataExists)) {
      return choroplethGeocodedData.length > 0 ? choroplethGeocodedData : choroplethParsedData
    }
    return []
  }, [
    mapType,
    symbolGeocodedData,
    symbolParsedData,
    choroplethGeocodedData,
    choroplethParsedData,
    choroplethDataExists,
  ])

  const currentColumns = useMemo(() => {
    if (mapType === "symbol") {
      return symbolColumns
    } else if (mapType === "choropleth" || (mapType === "custom" && choroplethDataExists)) {
      return choroplethColumns
    }
    return []
  }, [mapType, symbolColumns, choroplethColumns, choroplethDataExists])

  const currentDimensionSettings =
    mapType === "symbol"
      ? dimensionSettings.symbol
      : mapType === "choropleth"
        ? dimensionSettings.choropleth
        : dimensionSettings.custom // For custom maps, use custom settings

  const handleDimensionChange = useCallback(
    (key: string, value: any) => {
      const newSettings = { ...dimensionSettings }
      if (mapType === "symbol") {
        newSettings.symbol = { ...newSettings.symbol, [key]: value }
      } else if (mapType === "choropleth") {
        newSettings.choropleth = { ...newSettings.choropleth, [key]: value }
      } else if (mapType === "custom") {
        newSettings.custom = { ...newSettings.custom, [key]: value }
      }
      onUpdateSettings(newSettings)
    },
    [dimensionSettings, onUpdateSettings, mapType],
  )

  const getFilteredColumns = useCallback(
    (allowedTypes: ("text" | "number" | "date" | "coordinate" | "state")[]) => {
      return currentColumns.filter((col) => allowedTypes.includes(columnTypes[col] || "text"))
    },
    [currentColumns, columnTypes],
  )

  const getFilteredNumericColumns = useCallback(() => {
    return currentColumns.filter((col) => columnTypes[col] === "number")
  }, [currentColumns, columnTypes])

  const getFilteredStateColumns = useCallback(() => {
    return currentColumns.filter((col) => columnTypes[col] === "state")
  }, [currentColumns, columnTypes])

  const handleColorChange = useCallback(
    (color: string, key: string) => {
      setTempColor(color)
      handleDimensionChange(key, color)
    },
    [handleDimensionChange],
  )

  const handleOpenColorPicker = useCallback((key: string, initialColor: string) => {
    setShowColorPicker(key)
    setTempColor(initialColor)
  }, [])

  const handleCloseColorPicker = useCallback(() => {
    setShowColorPicker(null)
    setTempColor(null)
  }, [])

  const inferColumnOptionLabel = useCallback(() => {
    if (selectedGeography === "usa-counties") {
      return "County column"
    } else if (selectedGeography === "canada-provinces") {
      return "Province column"
    }
    return "State column"
  }, [selectedGeography])

  const inferSelectValueForGeography = useCallback(() => {
    if (selectedGeography === "usa-counties") {
      return "Select county column"
    } else if (selectedGeography === "canada-provinces") {
      return "Select province column"
    }
    return "Select state column"
  }, [selectedGeography])

  const getMinMaxValues = useCallback(
    (column: string) => {
      if (!column || !currentData.length) return { min: 0, max: 100 }
      const numericValues = currentData
        .map((row) => {
          const rawValue = row[column]
          // Apply number formatting logic to get the raw numeric value
          if (columnFormats[column]) {
            const strValue = String(rawValue).trim()
            const compactNum = DataPreview.parseCompactNumber(strValue) // Use declared DataPreview variable
            if (compactNum !== null) return compactNum
            const cleanedValue = strValue.replace(/[,$%]/g, "")
            const num = Number.parseFloat(cleanedValue)
            return isNaN(num) ? null : num
          }
          return typeof rawValue === "number" ? rawValue : null
        })
        .filter((v): v is number => v !== null && !isNaN(v))
      if (numericValues.length === 0) return { min: 0, max: 100 }
      const min = Math.min(...numericValues)
      const max = Math.max(...numericValues)
      return { min, max }
    },
    [currentData, columnFormats],
  )

  const choroplethMinMax = useMemo(
    () => getMinMaxValues(currentDimensionSettings.colorBy),
    [currentDimensionSettings.colorBy, getMinMaxValues],
  )
  const symbolSizeMinMax = useMemo(
    () => getMinMaxValues(currentDimensionSettings.sizeBy),
    [currentDimensionSettings.sizeBy, getMinMaxValues],
  )
  const symbolColorMinMax = useMemo(
    () => getMinMaxValues(currentDimensionSettings.colorBy),
    [currentDimensionSettings.colorBy, getMinMaxValues],
  )

  const allColorPalettes = useMemo(() => {
    return [
      { label: "Sequential", options: sequentialColorPalettes },
      { label: "Diverging", options: divergingColorPalettes },
      { label: "Categorical", options: categoricalColorPalettes },
    ]
  }, [])

  return (
    <TooltipProvider>
      <Card className="shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden">
        <CardHeader
          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out py-4 px-6 rounded-t-xl"
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
                <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              )}
            </div>
          </div>
        </CardHeader>
        <div
          className={`transition-all duration-300 ease-in-out ${
            isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          } overflow-hidden`}
        >
          <CardContent className="space-y-4 px-6 pb-6 pt-2">
            {mapType === "symbol" && symbolDataExists && (
              <Collapsible
                open={isSymbolDimensionsOpen}
                onOpenChange={setIsSymbolDimensionsOpen}
                className="space-y-2 animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Symbol Map Dimensions</h4>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isSymbolDimensionsOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                  <div className="space-y-2">
                    <Label htmlFor="latitude" className="text-xs">
                      Latitude column
                    </Label>
                    <Select
                      value={currentDimensionSettings.latitude || "default"} // Set default value to non-empty string
                      onValueChange={(value) => handleDimensionChange("latitude", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select latitude column" />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilteredColumns(["coordinate", "number"]).map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude" className="text-xs">
                      Longitude column
                    </Label>
                    <Select
                      value={currentDimensionSettings.longitude || "default"} // Set default value to non-empty string
                      onValueChange={(value) => handleDimensionChange("longitude", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select longitude column" />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilteredColumns(["coordinate", "number"]).map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sizeBy" className="text-xs">
                      Size by
                    </Label>
                    <Select
                      value={currentDimensionSettings.sizeBy || "default"} // Set default value to non-empty string
                      onValueChange={(value) => handleDimensionChange("sizeBy", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select column to size by (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {getFilteredNumericColumns().map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {currentDimensionSettings.sizeBy && (
                    <div className="space-y-2 border border-gray-100 dark:border-gray-700 p-3 rounded-md">
                      <Label htmlFor="sizeMin" className="text-xs">
                        Min symbol size ({currentDimensionSettings.sizeMin})
                      </Label>
                      <Slider
                        id="sizeMin"
                        min={1}
                        max={100}
                        step={1}
                        value={[currentDimensionSettings.sizeMin]}
                        onValueChange={([value]) => handleDimensionChange("sizeMin", value)}
                      />
                      <Label htmlFor="sizeMax" className="text-xs">
                        Max symbol size ({currentDimensionSettings.sizeMax})
                      </Label>
                      <Slider
                        id="sizeMax"
                        min={1}
                        max={100}
                        step={1}
                        value={[currentDimensionSettings.sizeMax]}
                        onValueChange={([value]) => handleDimensionChange("sizeMax", value)}
                      />
                      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                        <span>Data Min: {symbolSizeMinMax.min}</span>
                        <span>Data Max: {symbolSizeMinMax.max}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="colorBy" className="text-xs">
                      Color by
                    </Label>
                    <Select
                      value={currentDimensionSettings.colorBy || "default"} // Set default value to non-empty string
                      onValueChange={(value) => handleDimensionChange("colorBy", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select column to color by (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {getFilteredColumns(["number", "text", "date"]).map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {currentDimensionSettings.colorBy && (
                    <div className="space-y-2 border border-gray-100 dark:border-gray-700 p-3 rounded-md">
                      <Label htmlFor="colorScale" className="text-xs">
                        Color scale type
                      </Label>
                      <Select
                        value={currentDimensionSettings.colorScale || "default"} // Set default value to non-empty string
                        onValueChange={(value) => handleDimensionChange("colorScale", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select color scale" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear">Linear</SelectItem>
                          <SelectItem value="quantize">Quantize</SelectItem>
                          <SelectItem value="quantile">Quantile</SelectItem>
                          <SelectItem value="ordinal">Categorical</SelectItem>
                        </SelectContent>
                      </Select>

                      <Label htmlFor="colorPalette" className="text-xs">
                        Color palette
                      </Label>
                      <Select
                        value={currentDimensionSettings.colorPalette || "default"} // Set default value to non-empty string
                        onValueChange={(value) => handleDimensionChange("colorPalette", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select color palette" />
                        </SelectTrigger>
                        <SelectContent>
                          {allColorPalettes.map((group, index) => (
                            <SelectGroup key={index}>
                              <SelectLabel>{group.label}</SelectLabel>
                              {group.options.map((palette) => (
                                <SelectItem key={palette.name} value={palette.name}>
                                  <div className="flex items-center">
                                    <span>{palette.name}</span>
                                    <div className="flex ml-2">
                                      {palette.colors.map((color, i) => (
                                        <div key={i} className="w-4 h-4" style={{ backgroundColor: color }} />
                                      ))}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>

                      {(currentDimensionSettings.colorScale === "linear" ||
                        currentDimensionSettings.colorScale === "quantize" ||
                        currentDimensionSettings.colorScale === "quantile") &&
                        columnTypes[currentDimensionSettings.colorBy] === "number" && (
                          <div className="space-y-2">
                            <Label htmlFor="colorMinValue" className="text-xs">
                              Color min value ({currentDimensionSettings.colorMinValue})
                            </Label>
                            <Slider
                              id="colorMinValue"
                              min={symbolColorMinMax.min}
                              max={symbolColorMinMax.max}
                              step={(symbolColorMinMax.max - symbolColorMinMax.min) / 100 || 1}
                              value={[currentDimensionSettings.colorMinValue]}
                              onValueChange={([value]) => handleDimensionChange("colorMinValue", value)}
                            />
                            {currentDimensionSettings.colorScale === "linear" && (
                              <>
                                <Label htmlFor="colorMidValue" className="text-xs">
                                  Color mid value ({currentDimensionSettings.colorMidValue})
                                </Label>
                                <Slider
                                  id="colorMidValue"
                                  min={symbolColorMinMax.min}
                                  max={symbolColorMinMax.max}
                                  step={(symbolColorMinMax.max - symbolColorMinMax.min) / 100 || 1}
                                  value={[currentDimensionSettings.colorMidValue]}
                                  onValueChange={([value]) => handleDimensionChange("colorMidValue", value)}
                                />
                              </>
                            )}
                            <Label htmlFor="colorMaxValue" className="text-xs">
                              Color max value ({currentDimensionSettings.colorMaxValue})
                            </Label>
                            <Slider
                              id="colorMaxValue"
                              min={symbolColorMinMax.min}
                              max={symbolColorMinMax.max}
                              step={(symbolColorMinMax.max - symbolColorMinMax.min) / 100 || 1}
                              value={[currentDimensionSettings.colorMaxValue]}
                              onValueChange={([value]) => handleDimensionChange("colorMaxValue", value)}
                            />
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>Data Min: {symbolColorMinMax.min}</span>
                              <span>Data Max: {symbolColorMinMax.max}</span>
                            </div>
                          </div>
                        )}
                      {currentDimensionSettings.colorScale === "linear" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="colorMinColor" className="text-xs">
                              Min Color
                            </Label>
                            <ColorInput
                              id="colorMinColor"
                              color={currentDimensionSettings.colorMinColor}
                              onChange={(color) => handleDimensionChange("colorMinColor", color)}
                              onOpenPicker={() =>
                                handleOpenColorPicker("colorMinColor", currentDimensionSettings.colorMinColor)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="colorMidColor" className="text-xs">
                              Mid Color
                            </Label>
                            <ColorInput
                              id="colorMidColor"
                              color={currentDimensionSettings.colorMidColor}
                              onChange={(color) => handleDimensionChange("colorMidColor", color)}
                              onOpenPicker={() =>
                                handleOpenColorPicker("colorMidColor", currentDimensionSettings.colorMidColor)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="colorMaxColor" className="text-xs">
                              Max Color
                            </Label>
                            <ColorInput
                              id="colorMaxColor"
                              color={currentDimensionSettings.colorMaxColor}
                              onChange={(color) => handleDimensionChange("colorMaxColor", color)}
                              onOpenPicker={() =>
                                handleOpenColorPicker("colorMaxColor", currentDimensionSettings.colorMaxColor)
                              }
                            />
                          </div>
                        </>
                      )}
                      {currentDimensionSettings.colorScale === "ordinal" && (
                        <div className="space-y-2">
                          <Label className="text-xs">Categorical Colors (overrides palette)</Label>
                          {currentDimensionSettings.categoricalColors.map(
                            (catColor: { category: string; color: string }, index: number) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Input
                                  value={catColor.category}
                                  onChange={(e) => {
                                    const newCatColors = [...currentDimensionSettings.categoricalColors]
                                    newCatColors[index].category = e.target.value
                                    handleDimensionChange("categoricalColors", newCatColors)
                                  }}
                                  placeholder="Category"
                                  className="w-1/2"
                                />
                                <ColorInput
                                  color={catColor.color}
                                  onChange={(color) => {
                                    const newCatColors = [...currentDimensionSettings.categoricalColors]
                                    newCatColors[index].color = color
                                    handleDimensionChange("categoricalColors", newCatColors)
                                  }}
                                  onOpenPicker={() =>
                                    handleOpenColorPicker(`categoricalColor-${index}`, catColor.color)
                                  }
                                  className="w-1/2"
                                />
                                {/* Button component is not imported, assuming it's available */}
                                <button
                                  className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-2 py-1 rounded"
                                  onClick={() => {
                                    const newCatColors = currentDimensionSettings.categoricalColors.filter(
                                      (_: any, i: number) => i !== index,
                                    )
                                    handleDimensionChange("categoricalColors", newCatColors)
                                  }}
                                >
                                  -
                                </button>
                              </div>
                            ),
                          )}
                          {/* Button component is not imported, assuming it's available */}
                          <button
                            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-2 py-1 rounded"
                            onClick={() =>
                              handleDimensionChange("categoricalColors", [
                                ...currentDimensionSettings.categoricalColors,
                                { category: "", color: "#cccccc" },
                              ])
                            }
                          >
                            Add Category
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="labelTemplate" className="text-xs">
                      Label template (optional)
                    </Label>
                    <Input
                      id="labelTemplate"
                      value={currentDimensionSettings.labelTemplate}
                      onChange={(e) => handleDimensionChange("labelTemplate", e.target.value)}
                      placeholder="e.g., {City}, {Value}"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Use {"{ColumnName}"} to embed data.</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {(mapType === "choropleth" || (mapType === "custom" && choroplethDataExists)) && choroplethDataExists && (
              <Collapsible
                open={isChoroplethDimensionsOpen}
                onOpenChange={setIsChoroplethDimensionsOpen}
                className="space-y-2 animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Choropleth Dimensions</h4>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isChoroplethDimensionsOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                  <div className="space-y-2">
                    <Label htmlFor="stateColumn" className="text-xs">
                      {inferColumnOptionLabel()}
                    </Label>
                    <Select
                      value={currentDimensionSettings.stateColumn || "default"} // Set default value to non-empty string
                      onValueChange={(value) => handleDimensionChange("stateColumn", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={inferSelectValueForGeography()} />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilteredStateColumns().map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="colorBy" className="text-xs">
                      Color by
                    </Label>
                    <Select
                      value={currentDimensionSettings.colorBy || "default"} // Set default value to non-empty string
                      onValueChange={(value) => handleDimensionChange("colorBy", value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select column to color by" />
                      </SelectTrigger>
                      <SelectContent>
                        {getFilteredColumns(["number", "text", "date"]).map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {currentDimensionSettings.colorBy && (
                    <div className="space-y-2 border border-gray-100 dark:border-gray-700 p-3 rounded-md">
                      <Label htmlFor="colorScale" className="text-xs">
                        Color scale type
                      </Label>
                      <Select
                        value={currentDimensionSettings.colorScale || "default"} // Set default value to non-empty string
                        onValueChange={(value) => handleDimensionChange("colorScale", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select color scale" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear">Linear</SelectItem>
                          <SelectItem value="quantize">Quantize</SelectItem>
                          <SelectItem value="quantile">Quantile</SelectItem>
                          <SelectItem value="ordinal">Categorical</SelectItem>
                        </SelectContent>
                      </Select>

                      <Label htmlFor="colorPalette" className="text-xs">
                        Color palette
                      </Label>
                      <Select
                        value={currentDimensionSettings.colorPalette || "default"} // Set default value to non-empty string
                        onValueChange={(value) => handleDimensionChange("colorPalette", value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select color palette" />
                        </SelectTrigger>
                        <SelectContent>
                          {allColorPalettes.map((group, index) => (
                            <SelectGroup key={index}>
                              <SelectLabel>{group.label}</SelectLabel>
                              {group.options.map((palette) => (
                                <SelectItem key={palette.name} value={palette.name}>
                                  <div className="flex items-center">
                                    <span>{palette.name}</span>
                                    <div className="flex ml-2">
                                      {palette.colors.map((color, i) => (
                                        <div key={i} className="w-4 h-4" style={{ backgroundColor: color }} />
                                      ))}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          ))}
                        </SelectContent>
                      </Select>

                      {(currentDimensionSettings.colorScale === "linear" ||
                        currentDimensionSettings.colorScale === "quantize" ||
                        currentDimensionSettings.colorScale === "quantile") &&
                        columnTypes[currentDimensionSettings.colorBy] === "number" && (
                          <div className="space-y-2">
                            <Label htmlFor="colorMinValue" className="text-xs">
                              Color min value ({currentDimensionSettings.colorMinValue})
                            </Label>
                            <Slider
                              id="colorMinValue"
                              min={choroplethMinMax.min}
                              max={choroplethMinMax.max}
                              step={(choroplethMinMax.max - choroplethMinMax.min) / 100 || 1}
                              value={[currentDimensionSettings.colorMinValue]}
                              onValueChange={([value]) => handleDimensionChange("colorMinValue", value)}
                            />
                            {currentDimensionSettings.colorScale === "linear" && (
                              <>
                                <Label htmlFor="colorMidValue" className="text-xs">
                                  Color mid value ({currentDimensionSettings.colorMidValue})
                                </Label>
                                <Slider
                                  id="colorMidValue"
                                  min={choroplethMinMax.min}
                                  max={choroplethMinMax.max}
                                  step={(choroplethMinMax.max - choroplethMinMax.min) / 100 || 1}
                                  value={[currentDimensionSettings.colorMidValue]}
                                  onValueChange={([value]) => handleDimensionChange("colorMidValue", value)}
                                />
                              </>
                            )}
                            <Label htmlFor="colorMaxValue" className="text-xs">
                              Color max value ({currentDimensionSettings.colorMaxValue})
                            </Label>
                            <Slider
                              id="colorMaxValue"
                              min={choroplethMinMax.min}
                              max={choroplethMinMax.max}
                              step={(choroplethMinMax.max - choroplethMinMax.min) / 100 || 1}
                              value={[currentDimensionSettings.colorMaxValue]}
                              onValueChange={([value]) => handleDimensionChange("colorMaxValue", value)}
                            />
                            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                              <span>Data Min: {choroplethMinMax.min}</span>
                              <span>Data Max: {choroplethMinMax.max}</span>
                            </div>
                          </div>
                        )}
                      {currentDimensionSettings.colorScale === "linear" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="colorMinColor" className="text-xs">
                              Min Color
                            </Label>
                            <ColorInput
                              id="colorMinColor"
                              color={currentDimensionSettings.colorMinColor}
                              onChange={(color) => handleDimensionChange("colorMinColor", color)}
                              onOpenPicker={() =>
                                handleOpenColorPicker("colorMinColor", currentDimensionSettings.colorMinColor)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="colorMidColor" className="text-xs">
                              Mid Color
                            </Label>
                            <ColorInput
                              id="colorMidColor"
                              color={currentDimensionSettings.colorMidColor}
                              onChange={(color) => handleDimensionChange("colorMidColor", color)}
                              onOpenPicker={() =>
                                handleOpenColorPicker("colorMidColor", currentDimensionSettings.colorMidColor)
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="colorMaxColor" className="text-xs">
                              Max Color
                            </Label>
                            <ColorInput
                              id="colorMaxColor"
                              color={currentDimensionSettings.colorMaxColor}
                              onChange={(color) => handleDimensionChange("colorMaxColor", color)}
                              onOpenPicker={() =>
                                handleOpenColorPicker("colorMaxColor", currentDimensionSettings.colorMaxColor)
                              }
                            />
                          </div>
                        </>
                      )}
                      {currentDimensionSettings.colorScale === "ordinal" && (
                        <div className="space-y-2">
                          <Label className="text-xs">Categorical Colors (overrides palette)</Label>
                          {currentDimensionSettings.categoricalColors.map(
                            (catColor: { category: string; color: string }, index: number) => (
                              <div key={index} className="flex items-center space-x-2">
                                <Input
                                  value={catColor.category}
                                  onChange={(e) => {
                                    const newCatColors = [...currentDimensionSettings.categoricalColors]
                                    newCatColors[index].category = e.target.value
                                    handleDimensionChange("categoricalColors", newCatColors)
                                  }}
                                  placeholder="Category"
                                  className="w-1/2"
                                />
                                <ColorInput
                                  color={catColor.color}
                                  onChange={(color) => {
                                    const newCatColors = [...currentDimensionSettings.categoricalColors]
                                    newCatColors[index].color = color
                                    handleDimensionChange("categoricalColors", newCatColors)
                                  }}
                                  onOpenPicker={() =>
                                    handleOpenColorPicker(`categoricalColor-${index}`, catColor.color)
                                  }
                                  className="w-1/2"
                                />
                                {/* Button component is not imported, assuming it's available */}
                                <button
                                  className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-2 py-1 rounded"
                                  onClick={() => {
                                    const newCatColors = currentDimensionSettings.categoricalColors.filter(
                                      (_: any, i: number) => i !== index,
                                    )
                                    handleDimensionChange("categoricalColors", newCatColors)
                                  }}
                                >
                                  -
                                </button>
                              </div>
                            ),
                          )}
                          {/* Button component is not imported, assuming it's available */}
                          <button
                            className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-2 py-1 rounded"
                            onClick={() =>
                              handleDimensionChange("categoricalColors", [
                                ...currentDimensionSettings.categoricalColors,
                                { category: "", color: "#cccccc" },
                              ])
                            }
                          >
                            Add Category
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="labelTemplate" className="text-xs">
                      Label template (optional)
                    </Label>
                    <Input
                      id="labelTemplate"
                      value={currentDimensionSettings.labelTemplate}
                      onChange={(e) => handleDimensionChange("labelTemplate", e.target.value)}
                      placeholder="e.g., {State}, {Value}"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Use {"{ColumnName}"} to embed data.</p>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {mapType === "custom" && customDataExists && !choroplethDataExists && (
              <Collapsible
                open={isCustomMapDimensionsOpen}
                onOpenChange={setIsCustomMapDimensionsOpen}
                className="space-y-2 animate-in fade-in-50 slide-in-from-bottom-2 duration-300"
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Custom Map Data</h4>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isCustomMapDimensionsOpen ? "rotate-180" : ""}`}
                    />
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Custom SVG map code is loaded. No specific data dimensions to map here unless choropleth data is
                    also loaded.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            )}
          </CardContent>
        </div>
      </Card>
      {showColorPicker && tempColor !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={handleCloseColorPicker}
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <ChromeColorPicker color={tempColor} onChange={(color) => handleColorChange(color.hex, showColorPicker)} />
            {/* Button component is not imported, assuming it's available */}
            <button onClick={handleCloseColorPicker} className="absolute top-2 right-2">
              Close
            </button>
          </div>
        </div>
      )}
    </TooltipProvider>
  )
}
