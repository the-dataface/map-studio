"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChromeColorPicker } from "@/components/chrome-color-picker"
import { ColorInput } from "@/components/color-input"
import { FormattedNumberInput } from "@/components/formatted-number-input"
import { ChevronDown, ChevronUp, Save, Trash2, Palette, PenTool, Text, Star } from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "@/components/ui/use-toast"

// Interfaces imported from app/page.tsx or defined here
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

interface MapStylingProps {
  stylingSettings: StylingSettings
  onUpdateStylingSettings: (newSettings: StylingSettings) => void
  dimensionSettings: any // Placeholder for now, will refine type if needed
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
  const [activeSubTab, setActiveSubTab] = useState(stylingSettings.activeTab)
  const [showColorPicker, setShowColorPicker] = useState<string | null>(null) // State to manage which color picker is open
  const [tempColor, setTempColor] = useState<string | null>(null)

  // Collapsible states for each section
  const [isBaseStylesOpen, setIsBaseStylesOpen] = useState(true)
  const [isNationStylesOpen, setIsNationStylesOpen] = useState(true) // Always open for now
  const [isStateStylesOpen, setIsStateStylesOpen] = useState(true)
  const [isSymbolStylesOpen, setIsSymbolStylesOpen] = useState(true)
  const [isChoroplethLabelStylesOpen, setIsChoroplethLabelStylesOpen] = useState(true)
  const [isSymbolLabelStylesOpen, setIsSymbolLabelStylesOpen] = useState(true)
  const [isSavedStylesOpen, setIsSavedStylesOpen] = useState(true)

  useEffect(() => {
    setActiveSubTab(stylingSettings.activeTab)
  }, [stylingSettings.activeTab])

  const handleBaseChange = useCallback(
    (key: keyof StylingSettings["base"], value: string | number) => {
      onUpdateStylingSettings({
        ...stylingSettings,
        base: {
          ...stylingSettings.base,
          [key]: value,
        },
      })
    },
    [stylingSettings, onUpdateStylingSettings],
  )

  const handleSymbolChange = useCallback(
    (key: keyof StylingSettings["symbol"], value: string | number | boolean) => {
      onUpdateStylingSettings({
        ...stylingSettings,
        symbol: {
          ...stylingSettings.symbol,
          [key]: value,
        },
      })
    },
    [stylingSettings, onUpdateStylingSettings],
  )

  const handleChoroplethChange = useCallback(
    (key: keyof StylingSettings["choropleth"], value: string | boolean | number) => {
      onUpdateStylingSettings({
        ...stylingSettings,
        choropleth: {
          ...stylingSettings.choropleth,
          [key]: value,
        },
      })
    },
    [stylingSettings, onUpdateStylingSettings],
  )

  const handleTabChange = (tab: "base" | "symbol" | "choropleth") => {
    onUpdateStylingSettings({
      ...stylingSettings,
      activeTab: tab,
    })
  }

  const handleColorChange = useCallback(
    (color: string, key: string) => {
      setTempColor(color)
      if (activeSubTab === "base") {
        handleBaseChange(key as keyof StylingSettings["base"], color)
      } else if (activeSubTab === "symbol") {
        handleSymbolChange(key as keyof StylingSettings["symbol"], color)
      } else if (activeSubTab === "choropleth") {
        handleChoroplethChange(key as keyof StylingSettings["choropleth"], color)
      }
    },
    [activeSubTab, handleBaseChange, handleSymbolChange, handleChoroplethChange],
  )

  const handleOpenColorPicker = useCallback((key: string, initialColor: string) => {
    setShowColorPicker(key)
    setTempColor(initialColor)
  }, [])

  const handleCloseColorPicker = useCallback(() => {
    setShowColorPicker(null)
    setTempColor(null)
  }, [])

  const saveCurrentStyle = () => {
    const styleName = prompt("Enter a name for your saved style:")
    if (styleName) {
      const newStyle: SavedStyle = {
        id: `user-${Date.now()}`,
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
      onUpdateStylingSettings({
        ...stylingSettings,
        base: {
          ...stylingSettings.base,
          savedStyles: [...stylingSettings.base.savedStyles, newStyle],
        },
      })
      toast({
        icon: <Save className="h-4 w-4" />,
        description: "Style saved successfully!",
        duration: 3000,
      })
    }
  }

  const applySavedStyle = (style: SavedStyle) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      base: {
        ...stylingSettings.base,
        mapBackgroundColor: style.settings.mapBackgroundColor,
        nationFillColor: style.settings.nationFillColor,
        nationStrokeColor: style.settings.nationStrokeColor,
        nationStrokeWidth: style.settings.nationStrokeWidth,
        defaultStateFillColor: style.settings.defaultStateFillColor,
        defaultStateStrokeColor: style.settings.defaultStateStrokeColor,
        defaultStateStrokeWidth: style.settings.defaultStateStrokeWidth,
      },
    })
    toast({
      icon: <Palette className="h-4 w-4" />,
      description: `Applied "${style.name}" style.`,
      duration: 3000,
    })
  }

  const deleteSavedStyle = (id: string) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      base: {
        ...stylingSettings.base,
        savedStyles: stylingSettings.base.savedStyles.filter((style) => style.id !== id),
      },
    })
    toast({
      icon: <Trash2 className="h-4 w-4" />,
      description: "Style deleted.",
      duration: 3000,
    })
  }

  // Determine visibility of State/Province/County styles panel
  const showStateProvinceCountyStyles =
    selectedGeography === "usa-states" ||
    selectedGeography === "usa-counties" ||
    selectedGeography === "canada-provinces"

  const getStateProvinceCountyLabel = () => {
    if (selectedGeography === "usa-states") return "State Styles"
    if (selectedGeography === "usa-counties") return "County Styles"
    if (selectedGeography === "canada-provinces") return "Province Styles"
    return "State/Province/County Styles" // Fallback, though should be covered by checks
  }

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
                Map styling
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
            <div className="inline-flex h-auto items-center justify-start gap-2 bg-transparent p-0">
              <Button
                variant={activeSubTab === "base" ? "secondary" : "ghost"}
                size="sm"
                className="px-3 py-1.5 text-xs font-normal hover:bg-gray-100 dark:hover:bg-gray-700 w-auto transition-colors duration-200"
                onClick={() => handleTabChange("base")}
              >
                <Palette className="w-3 h-3 mr-1.5" />
                Base map
              </Button>
              {symbolDataExists && (
                <Button
                  variant={activeSubTab === "symbol" ? "secondary" : "ghost"}
                  size="sm"
                  className="px-3 py-1.5 text-xs font-normal hover:bg-gray-100 dark:hover:bg-gray-700 w-auto transition-colors duration-200"
                  onClick={() => handleTabChange("symbol")}
                >
                  <PenTool className="w-3 h-3 mr-1.5" />
                  Symbol map
                </Button>
              )}
              {choroplethDataExists && (
                <Button
                  variant={activeSubTab === "choropleth" ? "secondary" : "ghost"}
                  size="sm"
                  className="px-3 py-1.5 text-xs font-normal hover:bg-gray-100 dark:hover:bg-gray-700 w-auto transition-colors duration-200"
                  onClick={() => handleTabChange("choropleth")}
                >
                  <Text className="w-3 h-3 mr-1.5" />
                  Choropleth
                </Button>
              )}
            </div>

            {activeSubTab === "base" && (
              <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                <Collapsible open={isBaseStylesOpen} onOpenChange={setIsBaseStylesOpen} className="space-y-2">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Base Styles</h4>
                      <ChevronDown className={`h-4 w-4 transition-transform ${isBaseStylesOpen ? "rotate-180" : ""}`} />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                    <div className="space-y-2">
                      <Label htmlFor="mapBackgroundColor" className="text-xs">
                        Map background color
                      </Label>
                      <ColorInput
                        id="mapBackgroundColor"
                        color={stylingSettings.base.mapBackgroundColor}
                        onChange={(color) => handleBaseChange("mapBackgroundColor", color)}
                        onOpenPicker={() =>
                          handleOpenColorPicker("mapBackgroundColor", stylingSettings.base.mapBackgroundColor)
                        }
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <Collapsible open={isNationStylesOpen} onOpenChange={setIsNationStylesOpen} className="space-y-2">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Nation/Country Styles</h4>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${isNationStylesOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                    <div className="space-y-2">
                      <Label htmlFor="nationFillColor" className="text-xs">
                        Nation fill color
                      </Label>
                      <ColorInput
                        id="nationFillColor"
                        color={stylingSettings.base.nationFillColor}
                        onChange={(color) => handleBaseChange("nationFillColor", color)}
                        onOpenPicker={() =>
                          handleOpenColorPicker("nationFillColor", stylingSettings.base.nationFillColor)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nationStrokeColor" className="text-xs">
                        Nation stroke color
                      </Label>
                      <ColorInput
                        id="nationStrokeColor"
                        color={stylingSettings.base.nationStrokeColor}
                        onChange={(color) => handleBaseChange("nationStrokeColor", color)}
                        onOpenPicker={() =>
                          handleOpenColorPicker("nationStrokeColor", stylingSettings.base.nationStrokeColor)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nationStrokeWidth" className="text-xs">
                        Nation stroke width
                      </Label>
                      <FormattedNumberInput
                        value={stylingSettings.base.nationStrokeWidth}
                        onChange={(value) => handleBaseChange("nationStrokeWidth", value)}
                        min={0}
                        max={10}
                        step={0.1}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {showStateProvinceCountyStyles && (
                  <Collapsible open={isStateStylesOpen} onOpenChange={setIsStateStylesOpen} className="space-y-2">
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {getStateProvinceCountyLabel()}
                        </h4>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isStateStylesOpen ? "rotate-180" : ""}`}
                        />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                      <div className="space-y-2">
                        <Label htmlFor="defaultStateFillColor" className="text-xs">
                          Default {getStateProvinceCountyLabel().replace(" Styles", "")} fill color
                        </Label>
                        <ColorInput
                          id="defaultStateFillColor"
                          color={stylingSettings.base.defaultStateFillColor}
                          onChange={(color) => handleBaseChange("defaultStateFillColor", color)}
                          onOpenPicker={() =>
                            handleOpenColorPicker("defaultStateFillColor", stylingSettings.base.defaultStateFillColor)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="defaultStateStrokeColor" className="text-xs">
                          Default {getStateProvinceCountyLabel().replace(" Styles", "")} stroke color
                        </Label>
                        <ColorInput
                          id="defaultStateStrokeColor"
                          color={stylingSettings.base.defaultStateStrokeColor}
                          onChange={(color) => handleBaseChange("defaultStateStrokeColor", color)}
                          onOpenPicker={() =>
                            handleOpenColorPicker(
                              "defaultStateStrokeColor",
                              stylingSettings.base.defaultStateStrokeColor,
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="defaultStateStrokeWidth" className="text-xs">
                          Default {getStateProvinceCountyLabel().replace(" Styles", "")} stroke width
                        </Label>
                        <FormattedNumberInput
                          value={stylingSettings.base.defaultStateStrokeWidth}
                          onChange={(value) => handleBaseChange("defaultStateStrokeWidth", value)}
                          min={0}
                          max={10}
                          step={0.1}
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                <Collapsible open={isSavedStylesOpen} onOpenChange={setIsSavedStylesOpen} className="space-y-2">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Saved Styles</h4>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${isSavedStylesOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                    <Button onClick={saveCurrentStyle} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      Save Current Style
                    </Button>
                    <div className="space-y-2">
                      {stylingSettings.base.savedStyles.length === 0 ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400 text-center">No saved styles.</p>
                      ) : (
                        stylingSettings.base.savedStyles.map((style) => (
                          <div
                            key={style.id}
                            className="flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800"
                          >
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {style.name}{" "}
                              {style.type === "preset" && (
                                <Star className="inline-block h-3 w-3 ml-1 text-yellow-500" />
                              )}
                            </span>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => applySavedStyle(style)}>
                                Apply
                              </Button>
                              {style.type === "user" && (
                                <Button variant="ghost" size="sm" onClick={() => deleteSavedStyle(style.id)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            )}

            {activeSubTab === "symbol" && symbolDataExists && (
              <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                <Collapsible open={isSymbolStylesOpen} onOpenChange={setIsSymbolStylesOpen} className="space-y-2">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Symbol Styles</h4>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${isSymbolStylesOpen ? "rotate-180" : ""}`}
                      />
                    </div>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                    <div className="space-y-2">
                      <Label htmlFor="symbolType" className="text-xs">
                        Symbol Type
                      </Label>
                      <Select
                        value={stylingSettings.symbol.symbolType}
                        onValueChange={(value) =>
                          handleSymbolChange("symbolType", value as "symbol" | "spike" | "arrow")
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select symbol type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="symbol">Symbol</SelectItem>
                          <SelectItem value="spike">Spike</SelectItem>
                          <SelectItem value="arrow">Arrow</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="symbolShape" className="text-xs">
                        Symbol Shape
                      </Label>
                      <Select
                        value={stylingSettings.symbol.symbolShape}
                        onValueChange={(value) =>
                          handleSymbolChange(
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
                          <SelectItem value="triangle">Triangle Up</SelectItem>
                          <SelectItem value="triangle-down">Triangle Down</SelectItem>
                          <SelectItem value="hexagon">Hexagon</SelectItem>
                          <SelectItem value="map-marker">Map Marker</SelectItem>
                          <SelectItem value="custom-svg">Custom SVG</SelectItem>
                        </SelectContent>
                      </Select>
                      {stylingSettings.symbol.symbolShape === "custom-svg" && (
                        <div className="space-y-2 mt-2">
                          <Label htmlFor="customSvgPath" className="text-xs">
                            Custom SVG Path (d attribute)
                          </Label>
                          <Input
                            id="customSvgPath"
                            value={stylingSettings.symbol.customSvgPath || ""}
                            onChange={(e) => handleSymbolChange("customSvgPath", e.target.value)}
                            placeholder="e.g., M0,0 L10,0 L5,10 Z"
                          />
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="symbolFillColor" className="text-xs">
                        Symbol fill color
                      </Label>
                      <ColorInput
                        id="symbolFillColor"
                        color={stylingSettings.symbol.symbolFillColor}
                        onChange={(color) => handleSymbolChange("symbolFillColor", color)}
                        onOpenPicker={() =>
                          handleOpenColorPicker("symbolFillColor", stylingSettings.symbol.symbolFillColor)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="symbolStrokeColor" className="text-xs">
                        Symbol stroke color
                      </Label>
                      <ColorInput
                        id="symbolStrokeColor"
                        color={stylingSettings.symbol.symbolStrokeColor}
                        onChange={(color) => handleSymbolChange("symbolStrokeColor", color)}
                        onOpenPicker={() =>
                          handleOpenColorPicker("symbolStrokeColor", stylingSettings.symbol.symbolStrokeColor)
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="symbolSize" className="text-xs">
                        Symbol size
                      </Label>
                      <FormattedNumberInput
                        value={stylingSettings.symbol.symbolSize}
                        onChange={(value) => handleSymbolChange("symbolSize", value)}
                        min={1}
                        max={100}
                        step={1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="symbolStrokeWidth" className="text-xs">
                        Symbol stroke width
                      </Label>
                      <FormattedNumberInput
                        value={stylingSettings.symbol.symbolStrokeWidth}
                        onChange={(value) => handleSymbolChange("symbolStrokeWidth", value)}
                        min={0}
                        max={10}
                        step={0.1}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="symbolFillTransparency" className="text-xs">
                        Symbol fill transparency
                      </Label>
                      <FormattedNumberInput
                        value={stylingSettings.symbol.symbolFillTransparency || 1}
                        onChange={(value) => handleSymbolChange("symbolFillTransparency", value)}
                        min={0}
                        max={1}
                        step={0.01}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="symbolStrokeTransparency" className="text-xs">
                        Symbol stroke transparency
                      </Label>
                      <FormattedNumberInput
                        value={stylingSettings.symbol.symbolStrokeTransparency || 1}
                        onChange={(value) => handleSymbolChange("symbolStrokeTransparency", value)}
                        min={0}
                        max={1}
                        step={0.01}
                      />
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                {dimensionSettings.symbol.labelTemplate && (
                  <Collapsible
                    open={isSymbolLabelStylesOpen}
                    onOpenChange={setIsSymbolLabelStylesOpen}
                    className="space-y-2"
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Symbol Label Styles</h4>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isSymbolLabelStylesOpen ? "rotate-180" : ""}`}
                        />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                      <div className="space-y-2">
                        <Label htmlFor="labelFontFamily" className="text-xs">
                          Font Family
                        </Label>
                        <Select
                          value={stylingSettings.symbol.labelFontFamily}
                          onValueChange={(value) => handleSymbolChange("labelFontFamily", value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select font family" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="serif">Serif</SelectItem>
                            <SelectItem value="monospace">Monospace</SelectItem>
                            <SelectItem value="cursive">Cursive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Font Styles:</Label>
                        <ToggleGroup
                          type="multiple"
                          value={[]} // Manage these based on true/false props
                          onValueChange={(value) => {
                            handleSymbolChange("labelBold", value.includes("bold"))
                            handleSymbolChange("labelItalic", value.includes("italic"))
                            handleSymbolChange("labelUnderline", value.includes("underline"))
                            handleSymbolChange("labelStrikethrough", value.includes("strikethrough"))
                          }}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <ToggleGroupItem
                                value="bold"
                                aria-label="Toggle bold"
                                pressed={stylingSettings.symbol.labelBold}
                              >
                                B
                              </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent>Bold</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <ToggleGroupItem
                                value="italic"
                                aria-label="Toggle italic"
                                pressed={stylingSettings.symbol.labelItalic}
                              >
                                I
                              </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent>Italic</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <ToggleGroupItem
                                value="underline"
                                aria-label="Toggle underline"
                                pressed={stylingSettings.symbol.labelUnderline}
                              >
                                U
                              </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent>Underline</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <ToggleGroupItem
                                value="strikethrough"
                                aria-label="Toggle strikethrough"
                                pressed={stylingSettings.symbol.labelStrikethrough}
                              >
                                S
                              </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent>Strikethrough</TooltipContent>
                          </Tooltip>
                        </ToggleGroup>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelColor" className="text-xs">
                          Label Color
                        </Label>
                        <ColorInput
                          id="labelColor"
                          color={stylingSettings.symbol.labelColor}
                          onChange={(color) => handleSymbolChange("labelColor", color)}
                          onOpenPicker={() => handleOpenColorPicker("labelColor", stylingSettings.symbol.labelColor)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelOutlineColor" className="text-xs">
                          Label Outline Color
                        </Label>
                        <ColorInput
                          id="labelOutlineColor"
                          color={stylingSettings.symbol.labelOutlineColor}
                          onChange={(color) => handleSymbolChange("labelOutlineColor", color)}
                          onOpenPicker={() =>
                            handleOpenColorPicker("labelOutlineColor", stylingSettings.symbol.labelOutlineColor)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelFontSize" className="text-xs">
                          Label Font Size
                        </Label>
                        <FormattedNumberInput
                          value={stylingSettings.symbol.labelFontSize}
                          onChange={(value) => handleSymbolChange("labelFontSize", value)}
                          min={8}
                          max={32}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelOutlineThickness" className="text-xs">
                          Label Outline Thickness
                        </Label>
                        <FormattedNumberInput
                          value={stylingSettings.symbol.labelOutlineThickness}
                          onChange={(value) => handleSymbolChange("labelOutlineThickness", value)}
                          min={0}
                          max={5}
                          step={0.1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelAlignment" className="text-xs">
                          Label Alignment
                        </Label>
                        <Select
                          value={stylingSettings.symbol.labelAlignment}
                          onValueChange={(value) =>
                            handleSymbolChange(
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
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            )}

            {activeSubTab === "choropleth" && choroplethDataExists && (
              <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                {dimensionSettings.choropleth.labelTemplate && (
                  <Collapsible
                    open={isChoroplethLabelStylesOpen}
                    onOpenChange={setIsChoroplethLabelStylesOpen}
                    className="space-y-2"
                  >
                    <CollapsibleTrigger asChild>
                      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-md cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          Choropleth Label Styles
                        </h4>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform ${isChoroplethLabelStylesOpen ? "rotate-180" : ""}`}
                        />
                      </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md">
                      <div className="space-y-2">
                        <Label htmlFor="labelFontFamily" className="text-xs">
                          Font Family
                        </Label>
                        <Select
                          value={stylingSettings.choropleth.labelFontFamily}
                          onValueChange={(value) => handleChoroplethChange("labelFontFamily", value)}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select font family" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Inter">Inter</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="serif">Serif</SelectItem>
                            <SelectItem value="monospace">Monospace</SelectItem>
                            <SelectItem value="cursive">Cursive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label className="text-xs">Font Styles:</Label>
                        <ToggleGroup
                          type="multiple"
                          value={[]} // Manage these based on true/false props
                          onValueChange={(value) => {
                            handleChoroplethChange("labelBold", value.includes("bold"))
                            handleChoroplethChange("labelItalic", value.includes("italic"))
                            handleChoroplethChange("labelUnderline", value.includes("underline"))
                            handleChoroplethChange("labelStrikethrough", value.includes("strikethrough"))
                          }}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <ToggleGroupItem
                                value="bold"
                                aria-label="Toggle bold"
                                pressed={stylingSettings.choropleth.labelBold}
                              >
                                B
                              </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent>Bold</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <ToggleGroupItem
                                value="italic"
                                aria-label="Toggle italic"
                                pressed={stylingSettings.choropleth.labelItalic}
                              >
                                I
                              </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent>Italic</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <ToggleGroupItem
                                value="underline"
                                aria-label="Toggle underline"
                                pressed={stylingSettings.choropleth.labelUnderline}
                              >
                                U
                              </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent>Underline</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <ToggleGroupItem
                                value="strikethrough"
                                aria-label="Toggle strikethrough"
                                pressed={stylingSettings.choropleth.labelStrikethrough}
                              >
                                S
                              </ToggleGroupItem>
                            </TooltipTrigger>
                            <TooltipContent>Strikethrough</TooltipContent>
                          </Tooltip>
                        </ToggleGroup>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelColor" className="text-xs">
                          Label Color
                        </Label>
                        <ColorInput
                          id="labelColor"
                          color={stylingSettings.choropleth.labelColor}
                          onChange={(color) => handleChoroplethChange("labelColor", color)}
                          onOpenPicker={() =>
                            handleOpenColorPicker("labelColor", stylingSettings.choropleth.labelColor)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelOutlineColor" className="text-xs">
                          Label Outline Color
                        </Label>
                        <ColorInput
                          id="labelOutlineColor"
                          color={stylingSettings.choropleth.labelOutlineColor}
                          onChange={(color) => handleChoroplethChange("labelOutlineColor", color)}
                          onOpenPicker={() =>
                            handleOpenColorPicker("labelOutlineColor", stylingSettings.choropleth.labelOutlineColor)
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelFontSize" className="text-xs">
                          Label Font Size
                        </Label>
                        <FormattedNumberInput
                          value={stylingSettings.choropleth.labelFontSize}
                          onChange={(value) => handleChoroplethChange("labelFontSize", value)}
                          min={8}
                          max={32}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labelOutlineThickness" className="text-xs">
                          Label Outline Thickness
                        </Label>
                        <FormattedNumberInput
                          value={stylingSettings.choropleth.labelOutlineThickness}
                          onChange={(value) => handleChoroplethChange("labelOutlineThickness", value)}
                          min={0}
                          max={5}
                          step={0.1}
                        />
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
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
            <Button onClick={handleCloseColorPicker} className="absolute top-2 right-2">
              Close
            </Button>
          </div>
        </div>
      )}
    </TooltipProvider>
  )
}
