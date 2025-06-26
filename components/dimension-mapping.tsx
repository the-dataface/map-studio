"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronDown, ChevronUp, MapPin, Palette, Trash2 } from "lucide-react"
import { Toggle } from "@/components/ui/toggle"
import { Input } from "@/components/ui/input"
import { ColorInput } from "./color-input"
// Assuming ScrollArea exists and is needed, as it was commented out in previous brevity.
// import { ScrollArea } from "@/components/ui/scroll-area"
// Assuming CompactPicker exists and is needed for some reason, though SimpleColorPicker is also there.
// import { CompactPicker } from "react-color"

// Placeholder for type definitions from app/page.tsx or elsewhere
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
  onUpdateSettings: (settings: any) => void
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
  const [activeTab, setActiveTab] = useState<"symbol" | "choropleth">(() => {
    // Determine initial active tab based on mapType and data existence
    if (mapType === "custom" && choroplethDataExists) {
      return "choropleth"
    }
    return mapType === "custom" ? "choropleth" : mapType
  })

  useEffect(() => {
    // Sync active tab with mapType
    if (mapType === "custom" && choroplethDataExists) {
      setActiveTab("choropleth")
    } else {
      setActiveTab(mapType === "custom" ? "choropleth" : mapType)
    }
  }, [mapType, choroplethDataExists])

  const getFilteredColumns = (
    dataColumns: string[],
    allowedTypes: Array<"text" | "number" | "date" | "coordinate" | "state">,
  ) => {
    return dataColumns.filter((col) => allowedTypes.includes(columnTypes[col]))
  }

  const numericColumnsSymbol = useMemo(
    () => getFilteredColumns(symbolColumns, ["number"]),
    [symbolColumns, columnTypes],
  )
  const coordinateColumnsSymbol = useMemo(
    () => getFilteredColumns(symbolColumns, ["coordinate"]),
    [symbolColumns, columnTypes],
  )
  const textColumnsSymbol = useMemo(
    () => getFilteredColumns(symbolColumns, ["text", "number", "date", "coordinate", "state"]),
    [symbolColumns, columnTypes],
  )

  const numericColumnsChoropleth = useMemo(
    () => getFilteredColumns(choroplethColumns, ["number"]),
    [choroplethColumns, columnTypes],
  )
  const stateColumnsChoropleth = useMemo(
    () => getFilteredColumns(choroplethColumns, ["state"]),
    [choroplethColumns, columnTypes],
  )
  const textColumnsChoropleth = useMemo(
    () => getFilteredColumns(choroplethColumns, ["text", "number", "date", "coordinate", "state"]),
    [choroplethColumns, columnTypes],
  )

  const handleSymbolSettingChange = (key: string, value: any) => {
    onUpdateSettings({
      ...dimensionSettings,
      symbol: {
        ...dimensionSettings.symbol,
        [key]: value,
      },
    })
  }

  const handleChoroplethSettingChange = (key: string, value: any) => {
    onUpdateSettings({
      ...dimensionSettings,
      choropleth: {
        ...dimensionSettings.choropleth,
        [key]: value,
      },
    })
  }

  // Determine the label for the "State" option in the choropleth column dropdown
  const getChoroplethStateColumnLabel = () => {
    if (selectedGeography === "usa-counties") return "County Column"
    if (selectedGeography === "canada-provinces") return "Province Column"
    return "State Column"
  }

  const getColorPaletteOptions = () => [
    { value: "Blues", label: "Blues" },
    { value: "Greens", label: "Greens" },
    { value: "Reds", label: "Reds" },
    { value: "Purples", label: "Purples" },
    { value: "Oranges", label: "Oranges" },
    { value: "Grays", label: "Grays" },
    { value: "Spectral", label: "Spectral (Diverging)" },
    { value: "RdYlGn", label: "Red-Yellow-Green (Diverging)" },
  ]

  const getCategoricalColorPreview = (colors: string[]) => {
    return (
      <div className="flex gap-1">
        {colors.map((color, idx) => (
          <div key={idx} className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: color }} />
        ))}
        {colors.length === 0 && <span className="text-gray-500 text-xs italic">No colors added</span>}
      </div>
    )
  }

  const handleAddCategoricalColor = (mapType: "symbol" | "choropleth") => {
    const currentColors = dimensionSettings[mapType].categoricalColors || []
    const newColor = "#CCCCCC" // Default new color
    const updatedColors = [...currentColors, newColor]
    if (mapType === "symbol") {
      handleSymbolSettingChange("categoricalColors", updatedColors)
    } else {
      handleChoroplethSettingChange("categoricalColors", updatedColors)
    }
  }

  const handleRemoveCategoricalColor = (mapType: "symbol" | "choropleth", indexToRemove: number) => {
    const currentColors = dimensionSettings[mapType].categoricalColors || []
    const updatedColors = currentColors.filter((_: any, idx: number) => idx !== indexToRemove)
    if (mapType === "symbol") {
      handleSymbolSettingChange("categoricalColors", updatedColors)
    } else {
      handleChoroplethSettingChange("categoricalColors", updatedColors)
    }
  }

  const handleCategoricalColorChange = (mapType: "symbol" | "choropleth", index: number, newColor: string) => {
    const currentColors = dimensionSettings[mapType].categoricalColors || []
    const updatedColors = currentColors.map((color: string, idx: number) => (idx === index ? newColor : color))
    if (mapType === "symbol") {
      handleSymbolSettingChange("categoricalColors", updatedColors)
    } else {
      handleChoroplethSettingChange("categoricalColors", updatedColors)
    }
  }

  const isChoroplethColorDimensionMapped = !!dimensionSettings.choropleth.colorBy
  const isSymbolColorDimensionMapped = !!dimensionSettings.symbol.colorBy

  return (
    <Card className="shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden">
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out py-4 px-6 rounded-t-xl relative"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-gray-900 dark:text-white transition-colors duration-200">
              Dimension Mapping
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
          isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <CardContent className="space-y-6 px-6 pb-6 pt-2">
          <div className="inline-flex h-auto items-center justify-start gap-2 bg-transparent p-0">
            {symbolDataExists && (
              <Toggle
                variant="outline"
                pressed={activeTab === "symbol"}
                onPressedChange={() => setActiveTab("symbol")}
                className="px-3 py-1.5 text-xs font-normal transition-colors duration-200 group"
              >
                <MapPin className="w-3 h-3 mr-1.5 transition-transform duration-300 group-hover:translate-y-0.5" />
                Symbol Map
              </Toggle>
            )}
            {(choroplethDataExists || customDataExists) && (
              <Toggle
                variant="outline"
                pressed={activeTab === "choropleth"}
                onPressedChange={() => setActiveTab("choropleth")}
                className="px-3 py-1.5 text-xs font-normal transition-colors duration-200 group"
              >
                <Palette className="w-3 h-3 mr-1.5 transition-transform duration-300 group-hover:translate-y-0.5" />
                Choropleth Map
              </Toggle>
            )}
          </div>

          {activeTab === "symbol" && symbolDataExists && (
            <div className="grid gap-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              {/* Latitude and Longitude */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="latitude-column">Latitude Column</Label>
                  <Select
                    value={dimensionSettings.symbol.latitude || "defaultLatitude"}
                    onValueChange={(value) => handleSymbolSettingChange("latitude", value)}
                  >
                    <SelectTrigger id="latitude-column">
                      <SelectValue placeholder="Select Latitude Column" />
                    </SelectTrigger>
                    <SelectContent>
                      {coordinateColumnsSymbol.length === 0 && (
                        <p className="p-2 text-sm text-gray-500">No coordinate columns found</p>
                      )}
                      {coordinateColumnsSymbol.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="longitude-column">Longitude Column</Label>
                  <Select
                    value={dimensionSettings.symbol.longitude || "defaultLongitude"}
                    onValueChange={(value) => handleSymbolSettingChange("longitude", value)}
                  >
                    <SelectTrigger id="longitude-column">
                      <SelectValue placeholder="Select Longitude Column" />
                    </SelectTrigger>
                    <SelectContent>
                      {coordinateColumnsSymbol.length === 0 && (
                        <p className="p-2 text-sm text-gray-500">No coordinate columns found</p>
                      )}
                      {coordinateColumnsSymbol.map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Size By */}
              <div className="grid gap-2">
                <Label htmlFor="size-by">Size By</Label>
                <Select
                  value={dimensionSettings.symbol.sizeBy || "none"}
                  onValueChange={(value) => handleSymbolSettingChange("sizeBy", value)}
                >
                  <SelectTrigger id="size-by">
                    <SelectValue placeholder="Select Column to Size By (Optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {numericColumnsSymbol.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {dimensionSettings.symbol.sizeBy && (
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div className="grid gap-2">
                      <Label htmlFor="size-min-value">Min Data Value (Optional)</Label>
                      <Input
                        id="size-min-value"
                        type="number"
                        placeholder="Auto"
                        value={dimensionSettings.symbol.sizeMinValue}
                        onChange={(e) =>
                          handleSymbolSettingChange(
                            "sizeMinValue",
                            e.target.value === "" ? null : Number(e.target.value),
                          )
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="size-max-value">Max Data Value (Optional)</Label>
                      <Input
                        id="size-max-value"
                        type="number"
                        placeholder="Auto"
                        value={dimensionSettings.symbol.sizeMaxValue}
                        onChange={(e) =>
                          handleSymbolSettingChange(
                            "sizeMaxValue",
                            e.target.value === "" ? null : Number(e.target.value),
                          )
                        }
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Color By */}
              <div className="grid gap-2">
                <Label htmlFor="color-by">Color By</Label>
                <Select
                  value={dimensionSettings.symbol.colorBy || "none"}
                  onValueChange={(value) => handleSymbolSettingChange("colorBy", value)}
                >
                  <SelectTrigger id="color-by">
                    <SelectValue placeholder="Select Column to Color By (Optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {textColumnsSymbol.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {dimensionSettings.symbol.colorBy && (
                  <div className="grid gap-4 mt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="color-scale">Color Scale</Label>
                        <Select
                          value={dimensionSettings.symbol.colorScale || "linear"}
                          onValueChange={(value) => handleSymbolSettingChange("colorScale", value)}
                        >
                          <SelectTrigger id="color-scale">
                            <SelectValue placeholder="Select Color Scale" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linear">Linear</SelectItem>
                            <SelectItem value="categorical">Categorical</SelectItem>
                            <SelectItem value="diverging">Diverging</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="color-palette">Color Palette</Label>
                        <Select
                          value={dimensionSettings.symbol.colorPalette || "Blues"}
                          onValueChange={(value) => handleSymbolSettingChange("colorPalette", value)}
                        >
                          <SelectTrigger id="color-palette">
                            <SelectValue placeholder="Select Color Palette" />
                          </SelectTrigger>
                          <SelectContent>
                            {getColorPaletteOptions().map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {dimensionSettings.symbol.colorScale === "linear" && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="color-min-value">Min Value</Label>
                          <Input
                            id="color-min-value"
                            type="number"
                            value={dimensionSettings.symbol.colorMinValue}
                            onChange={(e) => handleSymbolSettingChange("colorMinValue", Number(e.target.value))}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="color-mid-value">Mid Value</Label>
                          <Input
                            id="color-mid-value"
                            type="number"
                            value={dimensionSettings.symbol.colorMidValue}
                            onChange={(e) => handleSymbolSettingChange("colorMidValue", Number(e.target.value))}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="color-max-value">Max Value</Label>
                          <Input
                            id="color-max-value"
                            type="number"
                            value={dimensionSettings.symbol.colorMaxValue}
                            onChange={(e) => handleSymbolSettingChange("colorMaxValue", Number(e.target.value))}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="color-min-color">Min Color</Label>
                          <ColorInput
                            id="color-min-color"
                            color={dimensionSettings.symbol.colorMinColor}
                            onChange={(color) => handleSymbolSettingChange("colorMinColor", color)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="color-mid-color">Mid Color</Label>
                          <ColorInput
                            id="color-mid-color"
                            color={dimensionSettings.symbol.colorMidColor}
                            onChange={(color) => handleSymbolSettingChange("colorMidColor", color)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="color-max-color">Max Color</Label>
                          <ColorInput
                            id="color-max-color"
                            color={dimensionSettings.symbol.colorMaxColor}
                            onChange={(color) => handleSymbolSettingChange("colorMaxColor", color)}
                          />
                        </div>
                      </div>
                    )}
                    {dimensionSettings.symbol.colorScale === "categorical" && (
                      <div className="grid gap-2">
                        <Label>Categorical Colors</Label>
                        <div className="flex flex-wrap gap-2">
                          {(dimensionSettings.symbol.categoricalColors || []).map((color: string, index: number) => (
                            <div key={index} className="flex items-center gap-1">
                              <ColorInput
                                id={`symbol-cat-color-${index}`}
                                color={color}
                                onChange={(newColor) => handleCategoricalColorChange("symbol", index, newColor)}
                              />
                              <button
                                className="bg-red-500 text-white px-2 py-1 rounded"
                                onClick={() => handleRemoveCategoricalColor("symbol", index)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                          <button
                            className="bg-blue-500 text-white px-2 py-1 rounded"
                            onClick={() => handleAddCategoricalColor("symbol")}
                          >
                            Add Color
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Label Template */}
              <div className="grid gap-2">
                <Label htmlFor="symbol-label-template">Label Template</Label>
                <Input
                  id="symbol-label-template"
                  placeholder="e.g., {City}, {Population}"
                  value={dimensionSettings.symbol.labelTemplate || ""}
                  onChange={(e) => handleSymbolSettingChange("labelTemplate", e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Use {"{ColumnName}"} to insert data values.</p>
              </div>
            </div>
          )}

          {activeTab === "choropleth" && (choroplethDataExists || customDataExists) && (
            <div className="grid gap-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              {/* State/Province/County Column */}
              <div className="grid gap-2">
                <Label htmlFor="state-column">{getChoroplethStateColumnLabel()}</Label>
                <Select
                  value={dimensionSettings.choropleth.stateColumn || "defaultState"}
                  onValueChange={(value) => handleChoroplethSettingChange("stateColumn", value)}
                >
                  <SelectTrigger id="state-column">
                    <SelectValue placeholder={`Select ${getChoroplethStateColumnLabel()}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {stateColumnsChoropleth.length === 0 && (
                      <p className="p-2 text-sm text-gray-500">No state/province/county columns found</p>
                    )}
                    {stateColumnsChoropleth.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color By */}
              <div className="grid gap-2">
                <Label htmlFor="choropleth-color-by">Color By</Label>
                <Select
                  value={dimensionSettings.choropleth.colorBy || "none"}
                  onValueChange={(value) => handleChoroplethSettingChange("colorBy", value)}
                >
                  <SelectTrigger id="choropleth-color-by">
                    <SelectValue placeholder="Select Column to Color By (Optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {numericColumnsChoropleth.map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {dimensionSettings.choropleth.colorBy && (
                  <div className="grid gap-4 mt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="choropleth-color-scale">Color Scale</Label>
                        <Select
                          value={dimensionSettings.choropleth.colorScale || "linear"}
                          onValueChange={(value) => handleChoroplethSettingChange("colorScale", value)}
                        >
                          <SelectTrigger id="choropleth-color-scale">
                            <SelectValue placeholder="Select Color Scale" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="linear">Linear</SelectItem>
                            <SelectItem value="categorical">Categorical</SelectItem>
                            <SelectItem value="diverging">Diverging</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="choropleth-color-palette">Color Palette</Label>
                        <Select
                          value={dimensionSettings.choropleth.colorPalette || "Blues"}
                          onValueChange={(value) => handleChoroplethSettingChange("colorPalette", value)}
                        >
                          <SelectTrigger id="choropleth-color-palette">
                            <SelectValue placeholder="Select Color Palette" />
                          </SelectTrigger>
                          <SelectContent>
                            {getColorPaletteOptions().map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {dimensionSettings.choropleth.colorScale === "linear" && (
                      <div className="grid grid-cols-3 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="choropleth-color-min-value">Min Value</Label>
                          <Input
                            id="choropleth-color-min-value"
                            type="number"
                            value={dimensionSettings.choropleth.colorMinValue}
                            onChange={(e) => handleChoroplethSettingChange("colorMinValue", Number(e.target.value))}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="choropleth-color-mid-value">Mid Value</Label>
                          <Input
                            id="choropleth-color-mid-value"
                            type="number"
                            value={dimensionSettings.choropleth.colorMidValue}
                            onChange={(e) => handleChoroplethSettingChange("colorMidValue", Number(e.target.value))}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="choropleth-color-max-value">Max Value</Label>
                          <Input
                            id="choropleth-color-max-value"
                            type="number"
                            value={dimensionSettings.choropleth.colorMaxValue}
                            onChange={(e) => handleChoroplethSettingChange("colorMaxValue", Number(e.target.value))}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="choropleth-color-min-color">Min Color</Label>
                          <ColorInput
                            id="choropleth-color-min-color"
                            color={dimensionSettings.choropleth.colorMinColor}
                            onChange={(color) => handleChoroplethSettingChange("colorMinColor", color)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="choropleth-color-mid-color">Mid Color</Label>
                          <ColorInput
                            id="choropleth-color-mid-color"
                            color={dimensionSettings.choropleth.colorMidColor}
                            onChange={(color) => handleChoroplethSettingChange("colorMidColor", color)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="choropleth-color-max-color">Max Color</Label>
                          <ColorInput
                            id="choropleth-color-max-color"
                            color={dimensionSettings.choropleth.colorMaxColor}
                            onChange={(color) => handleChoroplethSettingChange("colorMaxColor", color)}
                          />
                        </div>
                      </div>
                    )}
                    {dimensionSettings.choropleth.colorScale === "categorical" && (
                      <div className="grid gap-2">
                        <Label>Categorical Colors</Label>
                        <div className="flex flex-wrap gap-2">
                          {(dimensionSettings.choropleth.categoricalColors || []).map(
                            (color: string, index: number) => (
                              <div key={index} className="flex items-center gap-1">
                                <ColorInput
                                  id={`choropleth-cat-color-${index}`}
                                  color={color}
                                  onChange={(newColor) => handleCategoricalColorChange("choropleth", index, newColor)}
                                />
                                <button
                                  className="bg-red-500 text-white px-2 py-1 rounded"
                                  onClick={() => handleRemoveCategoricalColor("choropleth", index)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                            ),
                          )}
                          <button
                            className="bg-blue-500 text-white px-2 py-1 rounded"
                            onClick={() => handleAddCategoricalColor("choropleth")}
                          >
                            Add Color
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Label Template */}
              <div className="grid gap-2">
                <Label htmlFor="choropleth-label-template">Label Template</Label>
                <Input
                  id="choropleth-label-template"
                  placeholder="e.g., {State}, {Value}"
                  value={dimensionSettings.choropleth.labelTemplate || ""}
                  onChange={(e) => handleChoroplethSettingChange("labelTemplate", e.target.value)}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400">Use {"{ColumnName}"} to insert data values.</p>
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}
