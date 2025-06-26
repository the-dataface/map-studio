"use client"

import { Badge } from "@/components/ui/badge"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Save, Trash2, Palette, ImageIcon, Pin, Text } from "lucide-react"
import { ColorInput } from "./color-input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"
import { SaveSchemeModal } from "./save-scheme-modal"

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

interface MapStylingProps {
  stylingSettings: StylingSettings
  onUpdateStylingSettings: (settings: StylingSettings) => void
  dimensionSettings: any // Placeholder type, adjust if needed
  symbolDataExists: boolean
  choroplethDataExists: boolean
  customDataExists: boolean
  selectedGeography: "usa-states" | "usa-counties" | "usa-nation" | "canada-provinces" | "canada-nation" | "world"
}

export function MapStyling({
  stylingSettings,
  onUpdateStylingSettings,
  dimensionSettings,
  symbolDataExists,
  choroplethDataExists,
  customDataExists,
  selectedGeography,
}: MapStylingProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState(stylingSettings.activeTab)
  const [showSaveModal, setShowSaveModal] = useState(false)

  // Explicitly manage nation and state panel visibility
  // Nation/Country Styles panel is ALWAYS visible
  const isNationPanelVisible = true
  // State/Province/County Styles panel is conditionally visible
  const isStatePanelVisible =
    selectedGeography === "usa-states" ||
    selectedGeography === "usa-counties" ||
    selectedGeography === "canada-provinces"

  useEffect(() => {
    onUpdateStylingSettings({ ...stylingSettings, activeTab })
  }, [activeTab])

  const handleBaseSettingChange = (key: keyof StylingSettings["base"], value: any) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      base: {
        ...stylingSettings.base,
        [key]: value,
      },
    })
  }

  const handleSymbolSettingChange = (key: keyof StylingSettings["symbol"], value: any) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      symbol: {
        ...stylingSettings.symbol,
        [key]: value,
      },
    })
  }

  const handleChoroplethSettingChange = (key: keyof StylingSettings["choropleth"], value: any) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      choropleth: {
        ...stylingSettings.choropleth,
        [key]: value,
      },
    })
  }

  const applySavedStyle = (style: SavedStyle) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      base: {
        ...stylingSettings.base,
        ...style.settings,
      },
    })
    toast({
      description: `Applied style: ${style.name}`,
      duration: 2000,
    })
  }

  const deleteSavedStyle = (id: string) => {
    const updatedStyles = stylingSettings.base.savedStyles.filter((s) => s.id !== id)
    onUpdateStylingSettings({
      ...stylingSettings,
      base: {
        ...stylingSettings.base,
        savedStyles: updatedStyles,
      },
    })
    toast({
      description: "Style deleted.",
      duration: 2000,
    })
  }

  const handleSaveStyle = (styleName: string) => {
    const newStyle: SavedStyle = {
      id: crypto.randomUUID(),
      name: styleName,
      type: "user",
      settings: {
        mapBackgroundColor: stylingSettings.base.mapBackgroundColor,
        nationFillColor: stylingSettings.base.nationFillColor,
        nationStrokeColor: stylingSettings.base.nationStrokeColor,
        nationStrokeWidth: stylingSettings.base.nationStrokeWidth,
        defaultStateFillColor: stylingSettings.base.defaultStateFillColor,
        defaultStateStrokeColor: stylingSettings.base.defaultStateStrokeColor,
        defaultStateStrokeWidth: stylingSettings.base.defaultStateStrokeWidth,
      },
    }

    const updatedStyles = [...stylingSettings.base.savedStyles, newStyle]
    onUpdateStylingSettings({
      ...stylingSettings,
      base: {
        ...stylingSettings.base,
        savedStyles: updatedStyles,
      },
    })
    setShowSaveModal(false)
    toast({
      description: `Style "${styleName}" saved.`,
      duration: 2000,
    })
  }

  const getLabelSuffixForGeo = () => {
    if (selectedGeography === "usa-counties") return " (County)"
    if (selectedGeography === "canada-provinces") return " (Province)"
    return " (State)"
  }

  const choroplethColorByColumn = dimensionSettings.choropleth?.colorBy
  const symbolColorByColumn = dimensionSettings.symbol?.colorBy

  const isChoroplethColorDimensionMapped = !!choroplethColorByColumn
  const isSymbolColorDimensionMapped = !!symbolColorByColumn

  return (
    <Card className="shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden">
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out py-4 px-6 rounded-t-xl relative"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-gray-900 dark:text-white transition-colors duration-200">Map Styling</CardTitle>
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
            <Button
              variant={activeTab === "base" ? "secondary" : "ghost"}
              size="sm"
              className="px-3 py-1.5 text-xs font-normal hover:bg-gray-100 dark:hover:bg-gray-700 w-auto transition-colors duration-200 group"
              onClick={() => setActiveTab("base")}
            >
              <Palette className="w-3 h-3 mr-1.5 transition-transform duration-300 group-hover:translate-y-0.5" />
              Base Styles
            </Button>
            {symbolDataExists && (
              <Button
                variant={activeTab === "symbol" ? "secondary" : "ghost"}
                size="sm"
                className="px-3 py-1.5 text-xs font-normal hover:bg-gray-100 dark:hover:bg-gray-700 w-auto transition-colors duration-200 group"
                onClick={() => setActiveTab("symbol")}
              >
                <Pin className="w-3 h-3 mr-1.5 transition-transform duration-300 group-hover:translate-y-0.5" />
                Symbol Styles
              </Button>
            )}
            {(choroplethDataExists || customDataExists) && (
              <Button
                variant={activeTab === "choropleth" ? "secondary" : "ghost"}
                size="sm"
                className="px-3 py-1.5 text-xs font-normal hover:bg-gray-100 dark:hover:bg-gray-700 w-auto transition-colors duration-200 group"
                onClick={() => setActiveTab("choropleth")}
              >
                <ImageIcon className="w-3 h-3 mr-1.5 transition-transform duration-300 group-hover:translate-y-0.5" />
                Choropleth Styles
              </Button>
            )}
          </div>

          {activeTab === "base" && (
            <div className="grid gap-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              {/* Saved Styles */}
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Saved Styles</Label>
                  <Button variant="outline" size="sm" onClick={() => setShowSaveModal(true)}>
                    <Save className="w-3 h-3 mr-1" /> Save Current
                  </Button>
                  <SaveSchemeModal
                    isOpen={showSaveModal}
                    onClose={() => setShowSaveModal(false)}
                    onSave={handleSaveStyle}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {stylingSettings.base.savedStyles.map((style) => (
                    <Badge
                      key={style.id}
                      variant={style.type === "preset" ? "secondary" : "default"}
                      className={cn(
                        "cursor-pointer flex items-center justify-between gap-1 text-xs px-2 py-1 transition-colors duration-200",
                        "hover:bg-gray-200 dark:hover:bg-gray-700",
                      )}
                      onClick={() => applySavedStyle(style)}
                    >
                      <span>{style.name}</span>
                      {style.type === "user" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="w-4 h-4 rounded-full ml-1 hover:bg-gray-300 dark:hover:bg-gray-600"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteSavedStyle(style.id)
                          }}
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </Button>
                      )}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Map Background Color */}
              <div className="grid gap-2">
                <Label htmlFor="map-background-color">Map Background Color</Label>
                <ColorInput
                  id="map-background-color"
                  color={stylingSettings.base.mapBackgroundColor}
                  onChange={(color) => handleBaseSettingChange("mapBackgroundColor", color)}
                />
              </div>

              {/* Nation/Country Styles - Always visible */}
              {isNationPanelVisible && (
                <div className="grid gap-4 border border-gray-200 dark:border-gray-700 p-4 rounded-md">
                  <h4 className="font-semibold text-sm">Nation/Country Styles</h4>
                  <div className="grid gap-2">
                    <Label htmlFor="nation-fill-color">Fill Color</Label>
                    <ColorInput
                      id="nation-fill-color"
                      color={stylingSettings.base.nationFillColor}
                      onChange={(color) => handleBaseSettingChange("nationFillColor", color)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nation-stroke-color">Stroke Color</Label>
                    <ColorInput
                      id="nation-stroke-color"
                      color={stylingSettings.base.nationStrokeColor}
                      onChange={(color) => handleBaseSettingChange("nationStrokeColor", color)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nation-stroke-width">Stroke Width</Label>
                    <Slider
                      id="nation-stroke-width"
                      min={0}
                      max={5}
                      step={0.1}
                      value={[stylingSettings.base.nationStrokeWidth]}
                      onValueChange={(val) => handleBaseSettingChange("nationStrokeWidth", val[0])}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {stylingSettings.base.nationStrokeWidth.toFixed(1)}px
                    </span>
                  </div>
                </div>
              )}

              {/* State/Province/County Styles - Conditionally visible */}
              {isStatePanelVisible && (
                <div className="grid gap-4 border border-gray-200 dark:border-gray-700 p-4 rounded-md animate-in fade-in-50 duration-300">
                  <h4 className="font-semibold text-sm">
                    State/Province/County Styles
                    {getLabelSuffixForGeo()}
                  </h4>
                  <div className="grid gap-2">
                    <Label htmlFor="default-state-fill-color">Default Fill Color</Label>
                    <ColorInput
                      id="default-state-fill-color"
                      color={stylingSettings.base.defaultStateFillColor}
                      onChange={(color) => handleBaseSettingChange("defaultStateFillColor", color)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="default-state-stroke-color">Default Stroke Color</Label>
                    <ColorInput
                      id="default-state-stroke-color"
                      color={stylingSettings.base.defaultStateStrokeColor}
                      onChange={(color) => handleBaseSettingChange("defaultStateStrokeColor", color)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="default-state-stroke-width">Default Stroke Width</Label>
                    <Slider
                      id="default-state-stroke-width"
                      min={0}
                      max={5}
                      step={0.1}
                      value={[stylingSettings.base.defaultStateStrokeWidth]}
                      onValueChange={(val) => handleBaseSettingChange("defaultStateStrokeWidth", val[0])}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {stylingSettings.base.defaultStateStrokeWidth.toFixed(1)}px
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "symbol" && symbolDataExists && (
            <div className="grid gap-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              <div className="grid gap-2">
                <Label htmlFor="symbol-type">Symbol Type</Label>
                <Select
                  value={stylingSettings.symbol.symbolType}
                  onValueChange={(value) =>
                    handleSymbolSettingChange("symbolType", value as "symbol" | "spike" | "arrow")
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select symbol type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="symbol">Standard Symbol</SelectItem>
                    <SelectItem value="spike">Spike</SelectItem>
                    <SelectItem value="arrow">Arrow</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {stylingSettings.symbol.symbolType === "symbol" && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="symbol-shape">Symbol Shape</Label>
                    <Select
                      value={stylingSettings.symbol.symbolShape}
                      onValueChange={(value) =>
                        handleSymbolSettingChange(
                          "symbolShape",
                          value as
                            | "circle"
                            | "square"
                            | "diamond"
                            | "triangle"
                            | "triangle-down"
                            | "hexagon"
                            | "map-marker"
                            | "custom-svg",
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select symbol shape" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="circle">Circle</SelectItem>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="diamond">Diamond</SelectItem>
                        <SelectItem value="triangle">Triangle (Up)</SelectItem>
                        <SelectItem value="triangle-down">Triangle (Down)</SelectItem>
                        <SelectItem value="hexagon">Hexagon</SelectItem>
                        <SelectItem value="map-marker">Map Marker</SelectItem>
                        <SelectItem value="custom-svg">Custom SVG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {stylingSettings.symbol.symbolShape === "custom-svg" && (
                    <div className="grid gap-2">
                      <Label htmlFor="custom-svg-path">Custom SVG Path (e.g., M0,0L10,10...)</Label>
                      <Input
                        id="custom-svg-path"
                        value={stylingSettings.symbol.customSvgPath || ""}
                        onChange={(e) => handleSymbolSettingChange("customSvgPath", e.target.value)}
                        placeholder="Enter SVG path data (d attribute)"
                      />
                    </div>
                  )}
                </>
              )}

              {/* Fill and Stroke colors only if choropleth data is NOT mapped to color */}
              {!isSymbolColorDimensionMapped && (
                <>
                  <div className="grid gap-2">
                    <Label htmlFor="symbol-fill-color">Symbol Fill Color</Label>
                    <ColorInput
                      id="symbol-fill-color"
                      color={stylingSettings.symbol.symbolFillColor}
                      onChange={(color) => handleSymbolSettingChange("symbolFillColor", color)}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="symbol-stroke-color">Symbol Stroke Color</Label>
                    <ColorInput
                      id="symbol-stroke-color"
                      color={stylingSettings.symbol.symbolStrokeColor}
                      onChange={(color) => handleSymbolSettingChange("symbolStrokeColor", color)}
                    />
                  </div>
                </>
              )}

              <div className="grid gap-2">
                <Label htmlFor="symbol-size">Symbol Size</Label>
                <Slider
                  id="symbol-size"
                  min={1}
                  max={50}
                  step={1}
                  value={[stylingSettings.symbol.symbolSize]}
                  onValueChange={(val) => handleSymbolSettingChange("symbolSize", val[0])}
                  className="w-full"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">{stylingSettings.symbol.symbolSize}px</span>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="symbol-stroke-width">Symbol Stroke Width</Label>
                <Slider
                  id="symbol-stroke-width"
                  min={0}
                  max={10}
                  step={0.5}
                  value={[stylingSettings.symbol.symbolStrokeWidth]}
                  onValueChange={(val) => handleSymbolSettingChange("symbolStrokeWidth", val[0])}
                  className="w-full"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {stylingSettings.symbol.symbolStrokeWidth}px
                </span>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="symbol-fill-transparency">Symbol Fill Transparency</Label>
                <Slider
                  id="symbol-fill-transparency"
                  min={0}
                  max={100}
                  step={1}
                  value={[stylingSettings.symbol.symbolFillTransparency || 100]}
                  onValueChange={(val) => handleSymbolSettingChange("symbolFillTransparency", val[0])}
                  className="w-full"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {stylingSettings.symbol.symbolFillTransparency || 100}%
                </span>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="symbol-stroke-transparency">Symbol Stroke Transparency</Label>
                <Slider
                  id="symbol-stroke-transparency"
                  min={0}
                  max={100}
                  step={1}
                  value={[stylingSettings.symbol.symbolStrokeTransparency || 100]}
                  onValueChange={(val) => handleSymbolSettingChange("symbolStrokeTransparency", val[0])}
                  className="w-full"
                />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {stylingSettings.symbol.symbolStrokeTransparency || 100}%
                </span>
              </div>

              {/* Label Styling */}
              <div className="grid gap-4 border border-gray-200 dark:border-gray-700 p-4 rounded-md">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Text className="w-4 h-4" /> Label Styling
                </h4>
                <div className="grid gap-2">
                  <Label htmlFor="label-font-family">Font Family</Label>
                  <Select
                    value={stylingSettings.symbol.labelFontFamily}
                    onValueChange={(value) => handleSymbolSettingChange("labelFontFamily", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Verdana">Verdana</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Courier New">Courier New</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="label-font-size">Font Size</Label>
                  <Slider
                    id="label-font-size"
                    min={6}
                    max={24}
                    step={1}
                    value={[stylingSettings.symbol.labelFontSize]}
                    onValueChange={(val) => handleSymbolSettingChange("labelFontSize", val[0])}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {stylingSettings.symbol.labelFontSize}px
                  </span>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="label-color">Label Color</Label>
                  <ColorInput
                    id="label-color"
                    color={stylingSettings.symbol.labelColor}
                    onChange={(color) => handleSymbolSettingChange("labelColor", color)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="label-outline-color">Label Outline Color</Label>
                  <ColorInput
                    id="label-outline-color"
                    color={stylingSettings.symbol.labelOutlineColor}
                    onChange={(color) => handleSymbolSettingChange("labelOutlineColor", color)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="label-outline-thickness">Label Outline Thickness</Label>
                  <Slider
                    id="label-outline-thickness"
                    min={0}
                    max={5}
                    step={0.1}
                    value={[stylingSettings.symbol.labelOutlineThickness]}
                    onValueChange={(val) => handleSymbolSettingChange("labelOutlineThickness", val[0])}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {stylingSettings.symbol.labelOutlineThickness.toFixed(1)}px
                  </span>
                </div>
                <div className="grid gap-2">
                  <Label>Font Styles</Label>
                  <ToggleGroup
                    type="multiple"
                    value={[]}
                    onValueChange={(values) => {
                      handleSymbolSettingChange("labelBold", values.includes("bold"))
                      handleSymbolSettingChange("labelItalic", values.includes("italic"))
                      handleSymbolSettingChange("labelUnderline", values.includes("underline"))
                      handleSymbolSettingChange("labelStrikethrough", values.includes("strikethrough"))
                    }}
                    className="flex justify-start"
                  >
                    <ToggleGroupItem value="bold" aria-label="Toggle bold">
                      B
                    </ToggleGroupItem>
                    <ToggleGroupItem value="italic" aria-label="Toggle italic">
                      I
                    </ToggleGroupItem>
                    <ToggleGroupItem value="underline" aria-label="Toggle underline">
                      U
                    </ToggleGroupItem>
                    <ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough">
                      S
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="label-alignment">Label Alignment</Label>
                  <Select
                    value={stylingSettings.symbol.labelAlignment}
                    onValueChange={(value) =>
                      handleSymbolSettingChange(
                        "labelAlignment",
                        value as
                          | "auto"
                          | "top-left"
                          | "top-center"
                          | "top-right"
                          | "middle-left"
                          | "center"
                          | "middle-right"
                          | "bottom-left"
                          | "bottom-center"
                          | "bottom-right",
                      )
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select alignment" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto</SelectItem>
                      <SelectItem value="top-left">Top-Left</SelectItem>
                      <SelectItem value="top-center">Top-Center</SelectItem>
                      <SelectItem value="top-right">Top-Right</SelectItem>
                      <SelectItem value="middle-left">Middle-Left</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="middle-right">Middle-Right</SelectItem>
                      <SelectItem value="bottom-left">Bottom-Left</SelectItem>
                      <SelectItem value="bottom-center">Bottom-Center</SelectItem>
                      <SelectItem value="bottom-right">Bottom-Right</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "choropleth" && (choroplethDataExists || customDataExists) && (
            <div className="grid gap-6 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
              {/* Label Styling */}
              <div className="grid gap-4 border border-gray-200 dark:border-gray-700 p-4 rounded-md">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Text className="w-4 h-4" /> Label Styling
                </h4>
                <div className="grid gap-2">
                  <Label htmlFor="choropleth-label-font-family">Font Family</Label>
                  <Select
                    value={stylingSettings.choropleth.labelFontFamily}
                    onValueChange={(value) => handleChoroplethSettingChange("labelFontFamily", value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select font" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Inter">Inter</SelectItem>
                      <SelectItem value="Arial">Arial</SelectItem>
                      <SelectItem value="Verdana">Verdana</SelectItem>
                      <SelectItem value="Georgia">Georgia</SelectItem>
                      <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                      <SelectItem value="Courier New">Courier New</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="choropleth-label-font-size">Font Size</Label>
                  <Slider
                    id="choropleth-label-font-size"
                    min={6}
                    max={24}
                    step={1}
                    value={[stylingSettings.choropleth.labelFontSize]}
                    onValueChange={(val) => handleChoroplethSettingChange("labelFontSize", val[0])}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {stylingSettings.choropleth.labelFontSize}px
                  </span>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="choropleth-label-color">Label Color</Label>
                  <ColorInput
                    id="choropleth-label-color"
                    color={stylingSettings.choropleth.labelColor}
                    onChange={(color) => handleChoroplethSettingChange("labelColor", color)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="choropleth-label-outline-color">Label Outline Color</Label>
                  <ColorInput
                    id="choropleth-label-outline-color"
                    color={stylingSettings.choropleth.labelOutlineColor}
                    onChange={(color) => handleChoroplethSettingChange("labelOutlineColor", color)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="choropleth-label-outline-thickness">Label Outline Thickness</Label>
                  <Slider
                    id="choropleth-label-outline-thickness"
                    min={0}
                    max={5}
                    step={0.1}
                    value={[stylingSettings.choropleth.labelOutlineThickness]}
                    onValueChange={(val) => handleChoroplethSettingChange("labelOutlineThickness", val[0])}
                    className="w-full"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {stylingSettings.choropleth.labelOutlineThickness.toFixed(1)}px
                  </span>
                </div>
                <div className="grid gap-2">
                  <Label>Font Styles</Label>
                  <ToggleGroup
                    type="multiple"
                    value={[]}
                    onValueChange={(values) => {
                      handleChoroplethSettingChange("labelBold", values.includes("bold"))
                      handleChoroplethSettingChange("labelItalic", values.includes("italic"))
                      handleChoroplethSettingChange("labelUnderline", values.includes("underline"))
                      handleChoroplethSettingChange("labelStrikethrough", values.includes("strikethrough"))
                    }}
                    className="flex justify-start"
                  >
                    <ToggleGroupItem value="bold" aria-label="Toggle bold">
                      B
                    </ToggleGroupItem>
                    <ToggleGroupItem value="italic" aria-label="Toggle italic">
                      I
                    </ToggleGroupItem>
                    <ToggleGroupItem value="underline" aria-label="Toggle underline">
                      U
                    </ToggleGroupItem>
                    <ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough">
                      S
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  )
}
