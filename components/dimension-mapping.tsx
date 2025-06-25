"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ColorInput } from "@/components/color-input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Toggle } from "@/components/ui/toggle"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  ArrowUpLeft,
  ArrowUp,
  ArrowUpRight,
  ArrowLeft,
  AlignCenter,
  ArrowRight,
  ArrowDownLeft,
  ArrowDown,
  ArrowDownRight,
} from "lucide-react"
import { useEffect, useState, useMemo } from "react"
import { Textarea } from "./ui/textarea"
import { FormattedNumberInput } from "./formatted-number-input"

interface DataRow {
  [key: string]: string | number
}

interface ColumnType {
  [key: string]: "text" | "number" | "date" | "coordinate" | "state"
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
  symbolGeocodedData: DataRow[]
  symbolColumns: string[]
  choroplethParsedData: DataRow[]
  choroplethGeocodedData: DataRow[]
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
  selectedGeography, // New prop
}: DimensionMappingProps) {
  const [activeTab, setActiveTab] = useState<"symbol" | "choropleth" | "custom">(mapType)

  useEffect(() => {
    setActiveTab(mapType)
  }, [mapType])

  const currentSettings = dimensionSettings[activeTab] || {}
  const currentData =
    activeTab === "symbol"
      ? symbolGeocodedData.length > 0
        ? symbolGeocodedData
        : symbolParsedData
      : choroplethGeocodedData.length > 0
        ? choroplethGeocodedData
        : choroplethParsedData
  const currentColumns = activeTab === "symbol" ? symbolColumns : choroplethColumns

  const getFilteredColumns = (type: "text" | "number" | "date" | "coordinate" | "state") => {
    return currentColumns.filter((col) => columnTypes[col] === type)
  }

  const numericColumns = getFilteredColumns("number")
  const textColumns = getFilteredColumns("text")
  const coordinateColumns = getFilteredColumns("coordinate")
  const stateColumns = getFilteredColumns("state")

  const updateSetting = (key: string, value: any) => {
    onUpdateSettings({
      ...dimensionSettings,
      [activeTab]: {
        ...dimensionSettings[activeTab],
        [key]: value,
      },
    })
  }

  const choroplethLabel = useMemo(() => {
    if (selectedGeography === "usa-counties") {
      return "County Column"
    }
    if (selectedGeography === "canada-provinces") {
      return "Province Column"
    }
    return "State Column"
  }, [selectedGeography])

  // Get unique values for categorical color mapping
  const getCategoricalValues = (column: string) => {
    if (!column || !currentData.length) return []
    const values = currentData.map((row) => row[column])
    return Array.from(new Set(values)).filter((v) => typeof v === "string" || typeof v === "number")
  }

  // Pre-define common color palettes
  const colorPalettes = {
    Blues: ["#f7fbff", "#deebf7", "#c6dbef", "#9ecae1", "#6baed6", "#4292c6", "#2171b5", "#08519c", "#08306b"],
    Greens: ["#f7fcf5", "#e5f5e0", "#c7e9c0", "#a1d99b", "#74c476", "#41ab5d", "#238b45", "#006d2c", "#00441b"],
    Reds: ["#fff5f0", "#fee0d2", "#fcbba1", "#fc9272", "#fb6a4a", "#ef3b2c", "#cb181d", "#a50f15", "#67000d"],
    Purples: ["#fcfbfd", "#efedf5", "#dadaeb", "#bcbddc", "#9e9ac8", "#807dba", "#6a51a3", "#54278f", "#3f007d"],
    Grays: ["#ffffff", "#f0f0f0", "#d9d9d9", "#bdbdbd", "#969696", "#737373", "#525252", "#252525", "#000000"],
    Viridis: [
      "#440154",
      "#482878",
      "#3e4989",
      "#31688e",
      "#26828e",
      "#1f9e89",
      "#35b779",
      "#6ece58",
      "#b5de2b",
      "#fde725",
    ],
    Plasma: [
      "#0d0887",
      "#47039a",
      "#7301a8",
      "#9c179e",
      "#bd3786",
      "#d8576b",
      "#ed7953",
      "#fb9f3a",
      "#fdc42e",
      "#f0f624",
    ],
    Inferno: [
      "#000004",
      "#1b0c41",
      "#4a0c6b",
      "#7b0f7f",
      "#af2b7e",
      "#de4968",
      "#f88b41",
      "#ffc72c",
      "#fcfea4",
      "#fcfdbf",
    ],
    Magma: [
      "#000004",
      "#180c40",
      "#45086b",
      "#781c6d",
      "#ae396a",
      "#e05f63",
      "#f89441",
      "#fdc82e",
      "#f0f921",
      "#fcfdbf",
    ],
  }

  // Helper to get formatted value for legend/tooltip previews
  const getFormattedValue = (columnName: string, value: any) => {
    if (columnFormats[columnName]) {
      try {
        const formatFn = new Function(
          "value",
          `return \`${columnFormats[columnName].replace(/{value}/g, "${value}")}\`;`,
        )
        return formatFn(value)
      } catch (e) {
        console.error("Error applying format string:", e)
        return value // Fallback to raw value
      }
    }
    return value
  }

  const currentActiveTabHasData =
    (activeTab === "symbol" && symbolDataExists) ||
    (activeTab === "choropleth" && choroplethDataExists) ||
    (activeTab === "custom" && customDataExists && choroplethDataExists) // Custom uses choropleth data for dimensions

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Dimension Mapping</CardTitle>
        <CardDescription>Map your data columns to visual dimensions like position, size, and color.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex space-x-2 border-b border-gray-200 dark:border-gray-700">
          <button
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === "symbol"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
            onClick={() => setActiveTab("symbol")}
            disabled={!symbolDataExists}
          >
            Symbol Map{" "}
            {symbolDataExists && (
              <Badge className="ml-2" variant="secondary">
                Data Loaded
              </Badge>
            )}
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === "choropleth"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
            onClick={() => setActiveTab("choropleth")}
            disabled={!choroplethDataExists}
          >
            Choropleth Map{" "}
            {choroplethDataExists && (
              <Badge className="ml-2" variant="secondary">
                Data Loaded
              </Badge>
            )}
          </button>
          <button
            className={`py-2 px-4 text-sm font-medium ${
              activeTab === "custom"
                ? "border-b-2 border-blue-500 text-blue-500"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
            onClick={() => setActiveTab("custom")}
            disabled={!customDataExists || !choroplethDataExists}
          >
            Custom Map{" "}
            {customDataExists && (
              <Badge className="ml-2" variant="secondary">
                SVG Loaded
              </Badge>
            )}{" "}
            {choroplethDataExists && customDataExists && (
              <Badge className="ml-2" variant="secondary">
                Data Loaded
              </Badge>
            )}
          </button>
        </div>

        {!currentActiveTabHasData && (
          <p className="text-gray-500 dark:text-gray-400">Load data to enable dimension mapping for this map type.</p>
        )}

        {currentActiveTabHasData && (
          <>
            {activeTab === "symbol" && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude Column</Label>
                    <Select
                      value={currentSettings.latitude || ""}
                      onValueChange={(value) => updateSetting("latitude", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select latitude column" />
                      </SelectTrigger>
                      <SelectContent>
                        {coordinateColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude Column</Label>
                    <Select
                      value={currentSettings.longitude || ""}
                      onValueChange={(value) => updateSetting("longitude", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select longitude column" />
                      </SelectTrigger>
                      <SelectContent>
                        {coordinateColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <h3 className="text-lg font-semibold">Size</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sizeBy">Size By</Label>
                    <Select
                      value={currentSettings.sizeBy || ""}
                      onValueChange={(value) => updateSetting("sizeBy", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column for size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {numericColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {currentSettings.sizeBy && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="sizeMin">Min Size (px)</Label>
                        <Input
                          id="sizeMin"
                          type="number"
                          value={currentSettings.sizeMin}
                          onChange={(e) => updateSetting("sizeMin", Number(e.target.value))}
                          min={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sizeMax">Max Size (px)</Label>
                        <Input
                          id="sizeMax"
                          type="number"
                          value={currentSettings.sizeMax}
                          onChange={(e) => updateSetting("sizeMax", Number(e.target.value))}
                          min={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sizeMinValue">Data Min Value</Label>
                        <FormattedNumberInput
                          id="sizeMinValue"
                          value={currentSettings.sizeMinValue}
                          onValueChange={(value) => updateSetting("sizeMinValue", value)}
                          columnFormat={columnFormats[currentSettings.sizeBy]}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sizeMaxValue">Data Max Value</Label>
                        <FormattedNumberInput
                          id="sizeMaxValue"
                          value={currentSettings.sizeMaxValue}
                          onValueChange={(value) => updateSetting("sizeMaxValue", value)}
                          columnFormat={columnFormats[currentSettings.sizeBy]}
                        />
                      </div>
                    </>
                  )}
                </div>

                <h3 className="text-lg font-semibold">Color</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="colorBy">Color By</Label>
                    <Select
                      value={currentSettings.colorBy || ""}
                      onValueChange={(value) => updateSetting("colorBy", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column for color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {currentColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {currentSettings.colorBy && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="colorScale">Color Scale</Label>
                        <Select
                          value={currentSettings.colorScale}
                          onValueChange={(value) => updateSetting("colorScale", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select color scale" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linear">Linear</SelectItem>
                            <SelectItem value="categorical">Categorical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {currentSettings.colorScale === "linear" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="colorPalette">Color Palette</Label>
                            <Select
                              value={currentSettings.colorPalette}
                              onValueChange={(value) => {
                                updateSetting("colorPalette", value)
                                // Also update the min/mid/max colors based on the chosen palette's range
                                const palette = colorPalettes[value as keyof typeof colorPalettes]
                                if (palette && palette.length >= 3) {
                                  updateSetting("colorMinColor", palette[0])
                                  updateSetting("colorMidColor", palette[Math.floor(palette.length / 2)])
                                  updateSetting("colorMaxColor", palette[palette.length - 1])
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select color palette" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.keys(colorPalettes).map((paletteName) => (
                                  <SelectItem key={paletteName} value={paletteName}>
                                    <div className="flex items-center">
                                      {paletteName}
                                      <div className="ml-2 flex -space-x-1">
                                        {colorPalettes[paletteName as keyof typeof colorPalettes]
                                          .slice(0, 5)
                                          .map((color, i) => (
                                            <div
                                              key={i}
                                              className="h-4 w-4 rounded-full border border-gray-200 dark:border-gray-700"
                                              style={{ backgroundColor: color }}
                                            />
                                          ))}
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="colorMinValue">Data Min Value</Label>
                            <FormattedNumberInput
                              id="colorMinValue"
                              value={currentSettings.colorMinValue}
                              onValueChange={(value) => updateSetting("colorMinValue", value)}
                              columnFormat={columnFormats[currentSettings.colorBy]}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="colorMinColor">Min Color</Label>
                            <ColorInput
                              color={currentSettings.colorMinColor}
                              onChange={(color) => updateSetting("colorMinColor", color)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="colorMidValue">Data Mid Value</Label>
                            <FormattedNumberInput
                              id="colorMidValue"
                              value={currentSettings.colorMidValue}
                              onValueChange={(value) => updateSetting("colorMidValue", value)}
                              columnFormat={columnFormats[currentSettings.colorBy]}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="colorMidColor">Mid Color</Label>
                            <ColorInput
                              color={currentSettings.colorMidColor}
                              onChange={(color) => updateSetting("colorMidColor", color)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="colorMaxValue">Data Max Value</Label>
                            <FormattedNumberInput
                              id="colorMaxValue"
                              value={currentSettings.colorMaxValue}
                              onValueChange={(value) => updateSetting("colorMaxValue", value)}
                              columnFormat={columnFormats[currentSettings.colorBy]}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="colorMaxColor">Max Color</Label>
                            <ColorInput
                              color={currentSettings.colorMaxColor}
                              onChange={(color) => updateSetting("colorMaxColor", color)}
                            />
                          </div>
                        </>
                      )}
                      {currentSettings.colorScale === "categorical" && (
                        <div className="col-span-full space-y-4">
                          <Label>Categorical Colors</Label>
                          {getCategoricalValues(currentSettings.colorBy).map((value, index) => (
                            <div key={value as string | number} className="flex items-center space-x-2">
                              <Input
                                value={value as string | number}
                                readOnly
                                className="flex-1"
                                title={getFormattedValue(currentSettings.colorBy, value).toString()}
                              />
                              <ColorInput
                                color={currentSettings.categoricalColors[index]?.color || "#cccccc"} // Default grey
                                onChange={(color) => {
                                  const newCategoricalColors = [...currentSettings.categoricalColors]
                                  newCategoricalColors[index] = { value, color }
                                  updateSetting("categoricalColors", newCategoricalColors)
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <h3 className="text-lg font-semibold">Labels</h3>
                <div className="space-y-2">
                  <Label htmlFor="labelTemplate">Label Template</Label>
                  <Textarea
                    id="labelTemplate"
                    placeholder="e.g., {City}, {State}"
                    value={currentSettings.labelTemplate || ""}
                    onChange={(e) => updateSetting("labelTemplate", e.target.value)}
                    className="font-mono text-xs"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Use {"{Column Name}"} to insert data values.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="labelFontFamily">Font Family</Label>
                    <Select
                      value={currentSettings.labelFontFamily}
                      onValueChange={(value) => updateSetting("labelFontFamily", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Open Sans">Open Sans</SelectItem>
                        <SelectItem value="Lato">Lato</SelectItem>
                        <SelectItem value="Montserrat">Montserrat</SelectItem>
                        <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                        <SelectItem value="Ubuntu">Ubuntu</SelectItem>
                        <SelectItem value="Lora">Lora</SelectItem>
                        <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                        <SelectItem value="serif">Serif (Fallback)</SelectItem>
                        <SelectItem value="sans-serif">Sans-serif (Fallback)</SelectItem>
                        <SelectItem value="monospace">Monospace (Fallback)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="labelFontSize">Font Size (px)</Label>
                    <Input
                      id="labelFontSize"
                      type="number"
                      value={currentSettings.labelFontSize}
                      onChange={(e) => updateSetting("labelFontSize", Number(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="labelColor">Font Color</Label>
                    <ColorInput
                      color={currentSettings.labelColor}
                      onChange={(color) => updateSetting("labelColor", color)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="labelOutlineColor">Outline Color</Label>
                    <ColorInput
                      color={currentSettings.labelOutlineColor}
                      onChange={(color) => updateSetting("labelOutlineColor", color)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="labelOutlineThickness">Outline Thickness (px)</Label>
                    <Input
                      id="labelOutlineThickness"
                      type="number"
                      value={currentSettings.labelOutlineThickness}
                      onChange={(e) => updateSetting("labelOutlineThickness", Number(e.target.value))}
                      min={0}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Toggle
                    pressed={currentSettings.labelBold}
                    onPressedChange={(pressed) => updateSetting("labelBold", pressed)}
                    aria-label="Toggle bold"
                  >
                    <Bold className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    pressed={currentSettings.labelItalic}
                    onPressedChange={(pressed) => updateSetting("labelItalic", pressed)}
                    aria-label="Toggle italic"
                  >
                    <Italic className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    pressed={currentSettings.labelUnderline}
                    onPressedChange={(pressed) => updateSetting("labelUnderline", pressed)}
                    aria-label="Toggle underline"
                  >
                    <Underline className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    pressed={currentSettings.labelStrikethrough}
                    onPressedChange={(pressed) => updateSetting("labelStrikethrough", pressed)}
                    aria-label="Toggle strikethrough"
                  >
                    <Strikethrough className="h-4 w-4" />
                  </Toggle>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="labelAlignment">Label Alignment</Label>
                  <ToggleGroup
                    type="single"
                    value={currentSettings.labelAlignment}
                    onValueChange={(value) => value && updateSetting("labelAlignment", value)}
                    className="grid grid-cols-3 w-full"
                  >
                    <ToggleGroupItem value="top-left" aria-label="Align top-left">
                      <ArrowUpLeft className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="top-center" aria-label="Align top-center">
                      <ArrowUp className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="top-right" aria-label="Align top-right">
                      <ArrowUpRight className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="middle-left" aria-label="Align middle-left">
                      <ArrowLeft className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="center" aria-label="Align center">
                      <AlignCenter className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="middle-right" aria-label="Align middle-right">
                      <ArrowRight className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="bottom-left" aria-label="Align bottom-left">
                      <ArrowDownLeft className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="bottom-center" aria-label="Align bottom-center">
                      <ArrowDown className="h-4 w-4" />
                    </ToggleGroupItem>
                    <ToggleGroupItem value="bottom-right" aria-label="Align bottom-right">
                      <ArrowDownRight className="h-4 w-4" />
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Determines label position relative to symbol.
                  </p>
                </div>
              </div>
            )}

            {(activeTab === "choropleth" || (activeTab === "custom" && customDataExists)) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Geography and Color</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stateColumn">{choroplethLabel}</Label> {/* Dynamic label */}
                    <Select
                      value={currentSettings.stateColumn || ""}
                      onValueChange={(value) => updateSetting("stateColumn", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${choroplethLabel.toLowerCase().replace(" column", "")}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {stateColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="colorBy">Color By</Label>
                    <Select
                      value={currentSettings.colorBy || ""}
                      onValueChange={(value) => updateSetting("colorBy", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select column for color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {numericColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {currentSettings.colorBy && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="colorScale">Color Scale</Label>
                        <Select
                          value={currentSettings.colorScale}
                          onValueChange={(value) => updateSetting("colorScale", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select color scale" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linear">Linear</SelectItem>
                            <SelectItem value="categorical">Categorical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {currentSettings.colorScale === "linear" && (
                        <>
                          <div className="space-y-2">
                            <Label htmlFor="colorPalette">Color Palette</Label>
                            <Select
                              value={currentSettings.colorPalette}
                              onValueChange={(value) => {
                                updateSetting("colorPalette", value)
                                const palette = colorPalettes[value as keyof typeof colorPalettes]
                                if (palette && palette.length >= 3) {
                                  updateSetting("colorMinColor", palette[0])
                                  updateSetting("colorMidColor", palette[Math.floor(palette.length / 2)])
                                  updateSetting("colorMaxColor", palette[palette.length - 1])
                                }
                              }}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select color palette" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.keys(colorPalettes).map((paletteName) => (
                                  <SelectItem key={paletteName} value={paletteName}>
                                    <div className="flex items-center">
                                      {paletteName}
                                      <div className="ml-2 flex -space-x-1">
                                        {colorPalettes[paletteName as keyof typeof colorPalettes]
                                          .slice(0, 5)
                                          .map((color, i) => (
                                            <div
                                              key={i}
                                              className="h-4 w-4 rounded-full border border-gray-200 dark:border-gray-700"
                                              style={{ backgroundColor: color }}
                                            />
                                          ))}
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="colorMinValue">Data Min Value</Label>
                            <FormattedNumberInput
                              id="colorMinValue"
                              value={currentSettings.colorMinValue}
                              onValueChange={(value) => updateSetting("colorMinValue", value)}
                              columnFormat={columnFormats[currentSettings.colorBy]}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="colorMinColor">Min Color</Label>
                            <ColorInput
                              color={currentSettings.colorMinColor}
                              onChange={(color) => updateSetting("colorMinColor", color)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="colorMidValue">Data Mid Value</Label>
                            <FormattedNumberInput
                              id="colorMidValue"
                              value={currentSettings.colorMidValue}
                              onValueChange={(value) => updateSetting("colorMidValue", value)}
                              columnFormat={columnFormats[currentSettings.colorBy]}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="colorMidColor">Mid Color</Label>
                            <ColorInput
                              color={currentSettings.colorMidColor}
                              onChange={(color) => updateSetting("colorMidColor", color)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="colorMaxValue">Data Max Value</Label>
                            <FormattedNumberInput
                              id="colorMaxValue"
                              value={currentSettings.colorMaxValue}
                              onValueChange={(value) => updateSetting("colorMaxValue", value)}
                              columnFormat={columnFormats[currentSettings.colorBy]}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="colorMaxColor">Max Color</Label>
                            <ColorInput
                              color={currentSettings.colorMaxColor}
                              onChange={(color) => updateSetting("colorMaxColor", color)}
                            />
                          </div>
                        </>
                      )}
                      {currentSettings.colorScale === "categorical" && (
                        <div className="col-span-full space-y-4">
                          <Label>Categorical Colors</Label>
                          {getCategoricalValues(currentSettings.colorBy).map((value, index) => (
                            <div key={value as string | number} className="flex items-center space-x-2">
                              <Input
                                value={value as string | number}
                                readOnly
                                className="flex-1"
                                title={getFormattedValue(currentSettings.colorBy, value).toString()}
                              />
                              <ColorInput
                                color={currentSettings.categoricalColors[index]?.color || "#cccccc"} // Default grey
                                onChange={(color) => {
                                  const newCategoricalColors = [...currentSettings.categoricalColors]
                                  newCategoricalColors[index] = { value, color }
                                  updateSetting("categoricalColors", newCategoricalColors)
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>

                <h3 className="text-lg font-semibold">Labels</h3>
                <div className="space-y-2">
                  <Label htmlFor="labelTemplate">Label Template</Label>
                  <Textarea
                    id="labelTemplate"
                    placeholder="e.g., {State}: {Value}"
                    value={currentSettings.labelTemplate || ""}
                    onChange={(e) => updateSetting("labelTemplate", e.target.value)}
                    className="font-mono text-xs"
                  />
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Use {"{Column Name}"} to insert data values.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="labelFontFamily">Font Family</Label>
                    <Select
                      value={currentSettings.labelFontFamily}
                      onValueChange={(value) => updateSetting("labelFontFamily", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select font" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Roboto">Roboto</SelectItem>
                        <SelectItem value="Open Sans">Open Sans</SelectItem>
                        <SelectItem value="Lato">Lato</SelectItem>
                        <SelectItem value="Montserrat">Montserrat</SelectItem>
                        <SelectItem value="Source Sans Pro">Source Sans Pro</SelectItem>
                        <SelectItem value="Poppins">Poppins</SelectItem>
                        <SelectItem value="Ubuntu">Ubuntu</SelectItem>
                        <SelectItem value="Lora">Lora</SelectItem>
                        <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                        <SelectItem value="serif">Serif (Fallback)</SelectItem>
                        <SelectItem value="sans-serif">Sans-serif (Fallback)</SelectItem>
                        <SelectItem value="monospace">Monospace (Fallback)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="labelFontSize">Font Size (px)</Label>
                    <Input
                      id="labelFontSize"
                      type="number"
                      value={currentSettings.labelFontSize}
                      onChange={(e) => updateSetting("labelFontSize", Number(e.target.value))}
                      min={1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="labelColor">Font Color</Label>
                    <ColorInput
                      color={currentSettings.labelColor}
                      onChange={(color) => updateSetting("labelColor", color)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="labelOutlineColor">Outline Color</Label>
                    <ColorInput
                      color={currentSettings.labelOutlineColor}
                      onChange={(color) => updateSetting("labelOutlineColor", color)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="labelOutlineThickness">Outline Thickness (px)</Label>
                    <Input
                      id="labelOutlineThickness"
                      type="number"
                      value={currentSettings.labelOutlineThickness}
                      onChange={(e) => updateSetting("labelOutlineThickness", Number(e.target.value))}
                      min={0}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Toggle
                    pressed={currentSettings.labelBold}
                    onPressedChange={(pressed) => updateSetting("labelBold", pressed)}
                    aria-label="Toggle bold"
                  >
                    <Bold className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    pressed={currentSettings.labelItalic}
                    onPressedChange={(pressed) => updateSetting("labelItalic", pressed)}
                    aria-label="Toggle italic"
                  >
                    <Italic className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    pressed={currentSettings.labelUnderline}
                    onPressedChange={(pressed) => updateSetting("labelUnderline", pressed)}
                    aria-label="Toggle underline"
                  >
                    <Underline className="h-4 w-4" />
                  </Toggle>
                  <Toggle
                    pressed={currentSettings.labelStrikethrough}
                    onPressedChange={(pressed) => updateSetting("labelStrikethrough", pressed)}
                    aria-label="Toggle strikethrough"
                  >
                    <Strikethrough className="h-4 w-4" />
                  </Toggle>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
