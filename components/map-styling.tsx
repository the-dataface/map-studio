"use client"

import { Input } from "@/components/ui/input"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip" // Import Tooltip components
import { toast } from "@/components/ui/use-toast" // Import toast
import {
  ChevronDown,
  ChevronUp,
  Palette,
  Map,
  Type,
  Trash2,
  Save,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Square,
  Circle,
  ArrowUpLeft,
  ArrowUp,
  ArrowUpRight,
  ArrowLeft,
  Minus,
  ArrowRight,
  ArrowDownLeft,
  ArrowDown,
  ArrowDownRight,
  LandPlot,
  Sparkles,
  Play,
  Diamond,
  Triangle,
  Code,
  CheckCircle,
} from "lucide-react"
import { ColorInput } from "@/components/color-input"
import { v4 as uuidv4 } from "uuid" // For unique IDs for saved styles
import { cn } from "@/lib/utils"

// Define interfaces for props and internal state
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
        defaultStateStrokeColor: string // Corrected type to string
        defaultStateStrokeWidth: number
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
    sizeBy: string
    colorBy: string
  }
  choropleth: {
    stateColumn: string
  }
}

interface MapStylingProps {
  stylingSettings: StylingSettings
  onUpdateStylingSettings: (settings: StylingSettings) => void
  dimensionSettings: DimensionSettings // To check if inputs should be disabled
  symbolDataExists: boolean
  choroplethDataExists: boolean
  customDataExists: boolean // NEW
  selectedGeography: string // NEW: Add selectedGeography prop
}

const googleFontFamilies = [
  "Inter", // Default
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Oswald",
  "Playfair Display",
  "Merriweather",
  "Raleway",
  "Poppins",
  "Source Sans Pro",
]

export function MapStyling({
  stylingSettings,
  onUpdateStylingSettings,
  dimensionSettings,
  symbolDataExists,
  choroplethDataExists,
  customDataExists, // NEW
  selectedGeography, // NEW: Destructure selectedGeography
}: MapStylingProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState(stylingSettings.activeTab)
  const [expandedPanels, setExpandedPanels] = useState<{ [key: string]: boolean }>({
    savedStyles: false, // Collapsed by default
    background: false, // Collapsed by default
    nation: false, // Collapsed by default
    states: false, // Collapsed by default
    symbols: false, // Collapsed by default
    symbolLabels: false, // Collapsed by default
    choroplethLabels: false, // Collapsed by default
  })
  const [newStyleName, setNewStyleName] = useState("")

  useEffect(() => {
    setActiveTab(stylingSettings.activeTab)
  }, [stylingSettings.activeTab])

  const togglePanel = (panelKey: string) => {
    setExpandedPanels((prev) => ({
      ...prev,
      [panelKey]: !prev[panelKey],
    }))
  }

  const updateSetting = (tab: "base" | "symbol" | "choropleth", key: string, value: any) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      [tab]: {
        ...stylingSettings[tab],
        [key]: value,
      },
    })
    console.log(`Updated setting for ${tab}.${key}:`, value)
  }

  const handleSaveStyle = () => {
    if (!newStyleName.trim()) {
      alert("Please enter a name for your style.")
      return
    }

    const newStyle = {
      id: uuidv4(),
      name: newStyleName.trim(),
      type: "user" as const,
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
    setNewStyleName("")
    toast({
      description: `Style "${newStyle.name}" saved.`,
      variant: "success",
      icon: <CheckCircle className="h-5 w-5" />,
    })
  }

  const handleDeleteStyle = (id: string) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      base: {
        ...stylingSettings.base,
        savedStyles: stylingSettings.base.savedStyles.filter((style) => style.id !== id),
      },
    })
    toast({ description: "Style deleted.", variant: "default", icon: <Trash2 className="h-5 w-5" /> })
  }

  const handleApplyStyle = (styleSettings: StylingSettings["base"]["settings"], styleName: string) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      base: {
        ...stylingSettings.base,
        ...styleSettings,
      },
    })
    toast({ description: `Style "${styleName}" applied.`, variant: "default", icon: <Sparkles className="h-5 w-5" /> })
  }

  const renderSubPanel = (
    key: string,
    title: string,
    icon: React.ReactNode,
    children: React.ReactNode,
    badge?: string,
  ) => {
    const isPanelExpanded = expandedPanels[key]
    return (
      <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
        <div
          className="bg-gray-100 dark:bg-gray-700 px-4 py-3 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-650 transition-colors duration-200"
          onClick={() => togglePanel(key)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="text-black dark:text-white transform scale-75">{icon}</div>
              <span className="font-medium text-gray-900 dark:text-white">{title}</span>
              {badge && (
                <span className="text-xs font-normal bg-white dark:bg-gray-800 px-2 py-0.5 rounded-full ml-1">
                  {badge}
                </span>
              )}
            </div>
            <div className="transition-transform duration-200">
              {isPanelExpanded ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </div>
          </div>
        </div>
        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            isPanelExpanded ? "max-h-[9999px] opacity-100" : "max-h-0 opacity-0" // Ensure full height
          }`}
        >
          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-600">{children}</div>
        </div>
      </div>
    )
  }

  const isSymbolFillDisabled = symbolDataExists && !!dimensionSettings.symbol.colorBy
  const isSymbolSizeDisabled = symbolDataExists && !!dimensionSettings.symbol.sizeBy
  // Choropleth fill is disabled if choropleth data exists AND color is mapped, OR if custom map exists AND color is mapped
  const isChoroplethFillDisabled =
    (choroplethDataExists && !!dimensionSettings.choropleth.colorBy) ||
    (customDataExists && !!dimensionSettings.choropleth.colorBy)

  console.log("MapStyling received dimensionSettings:", dimensionSettings)
  console.log("isSymbolFillDisabled:", isSymbolFillDisabled)
  console.log("isSymbolSizeDisabled:", isSymbolSizeDisabled)
  console.log("isChoroplethFillDisabled:", isChoroplethFillDisabled)

  const renderStylingTabButton = (
    tab: "base" | "symbol" | "choropleth",
    icon: React.ReactNode,
    label: string,
    isActive: boolean,
    disabled: boolean,
    tooltipContent: string,
  ) => {
    if (disabled) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-normal opacity-50 text-gray-500 dark:text-gray-400 transition-all duration-200">
              {icon}
              {label}
            </div>
          </TooltipTrigger>
          <TooltipContent
            side="bottom"
            className="bg-black text-white border-black px-3 py-2 rounded-md shadow-lg text-xs font-medium z-50"
            sideOffset={8}
          >
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      )
    }

    return (
      <ToggleGroupItem
        value={tab}
        aria-label={`${label} styling`}
        className="px-3 py-1.5 text-xs font-normal hover:bg-gray-100 dark:hover:bg-gray-700 data-[state=on]:bg-secondary data-[state=on]:text-foreground transition-colors duration-200 group"
      >
        {icon}
        {label}
      </ToggleGroupItem>
    )
  }

  // Determine the label for the "States" subpanel based on selectedGeography
  let subFeatureLabel = "States"
  if (selectedGeography === "usa-counties") {
    subFeatureLabel = "Counties"
  } else if (selectedGeography === "canada-provinces") {
    subFeatureLabel = "Provinces"
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
                Map styling
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
            <ToggleGroup
              type="single"
              value={activeTab}
              onValueChange={(value: "base" | "symbol" | "choropleth") => {
                if (value) {
                  setActiveTab(value)
                  onUpdateStylingSettings({ ...stylingSettings, activeTab: value })
                }
              }}
              className="inline-flex h-auto items-center justify-start gap-2 bg-transparent p-0"
              aria-label="Map styling tabs"
            >
              {renderStylingTabButton(
                "base",
                <Map className="w-3 h-3 mr-1.5 transition-transform duration-300 group-hover:translate-y-0.5" />,
                "Base map",
                activeTab === "base",
                false, // Base map is always accessible
                "",
              )}
              {renderStylingTabButton(
                "symbol",
                <Circle className="w-3 h-3 mr-1.5 transition-transform duration-300 group-hover:translate-y-0.5" />,
                "Symbol map",
                activeTab === "symbol",
                !symbolDataExists,
                "Add symbol map data to configure styling.",
              )}
              {renderStylingTabButton(
                "choropleth",
                <Square className="w-3 h-3 mr-1.5 transition-transform duration-300 group-hover:translate-y-0.5" />,
                "Choropleth",
                activeTab === "choropleth",
                !(choroplethDataExists || customDataExists), // Enable if choropleth data OR custom map data exists
                "Add choropleth or custom map data to configure styling.",
              )}
            </ToggleGroup>

            {activeTab === "base" && (
              <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                {renderSubPanel(
                  "savedStyles",
                  "Saved styles", // Sentence case
                  <Save className="w-4 h-4" />,
                  <div className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="New style name"
                        value={newStyleName}
                        onChange={(e) => setNewStyleName(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleSaveStyle} disabled={!newStyleName.trim()}>
                        <Save className="w-4 h-4 mr-2" /> Save style
                      </Button>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mt-4">Saved styles</h3>
                    <div className="flex flex-col gap-2">
                      {stylingSettings.base.savedStyles.map((style) => (
                        <Card
                          key={style.id}
                          className="p-2 flex items-center justify-between gap-2 cursor-pointer hover:shadow-md transition-shadow duration-200"
                          onClick={() => handleApplyStyle(style.settings, style.name)}
                        >
                          <div className="flex items-center gap-2 flex-grow">
                            <div
                              className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0 relative"
                              style={{ backgroundColor: style.settings.mapBackgroundColor }}
                            >
                              <div
                                className="absolute inset-0 rounded-full"
                                style={{
                                  border: `${style.settings.nationStrokeWidth}px solid ${style.settings.nationStrokeColor}`,
                                }}
                              />
                            </div>
                            <div className="flex flex-col">
                              <h4 className="font-medium text-sm">{style.name}</h4>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {style.type === "preset" ? "Default style" : "User style"}
                              </span>
                            </div>
                          </div>
                          {style.type === "user" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteStyle(style.id)
                              }}
                              className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 flex-shrink-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </Card>
                      ))}
                    </div>
                  </div>,
                )}

                {renderSubPanel(
                  "background",
                  "Background", // Sentence case
                  <Palette className="w-4 h-4" />,
                  <div className="space-y-2">
                    <Label htmlFor="map-background-color" className="text-sm">
                      Map background color
                    </Label>
                    <ColorInput
                      id="map-background-color"
                      value={stylingSettings.base.mapBackgroundColor}
                      onChange={(value) => updateSetting("base", "mapBackgroundColor", value)}
                    />
                  </div>,
                )}

                {renderSubPanel(
                  "nation",
                  "Nation", // Sentence case
                  <Map className="w-4 h-4" />,
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="nation-fill-color" className="text-sm">
                          Nation fill color
                        </Label>
                        <ColorInput
                          id="nation-fill-color"
                          value={stylingSettings.base.nationFillColor}
                          onChange={(value) => updateSetting("base", "nationFillColor", value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nation-stroke-color" className="text-sm">
                          Nation stroke color
                        </Label>
                        <ColorInput
                          id="nation-stroke-color"
                          value={stylingSettings.base.nationStrokeColor}
                          onChange={(value) => updateSetting("base", "nationStrokeColor", value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nation-stroke-width" className="text-sm">
                        Nation stroke width ({stylingSettings.base.nationStrokeWidth}px)
                      </Label>
                      <Slider
                        id="nation-stroke-width"
                        value={[stylingSettings.base.nationStrokeWidth]}
                        onValueChange={(value) => updateSetting("base", "nationStrokeWidth", value[0])}
                        min={0}
                        max={5}
                        step={0.5}
                      />
                    </div>
                  </div>,
                )}

                {renderSubPanel(
                  "states",
                  subFeatureLabel, // Sentence case
                  <LandPlot className="w-4 h-4" />, // Changed icon
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="default-state-fill-color" className="text-sm">
                          Default {subFeatureLabel.toLowerCase()} fill color
                        </Label>
                        <div className={cn(isChoroplethFillDisabled && "pointer-events-none opacity-50")}>
                          <ColorInput
                            id="default-state-fill-color"
                            value={stylingSettings.base.defaultStateFillColor}
                            onChange={(value) => updateSetting("base", "defaultStateFillColor", value)}
                            disabled={isChoroplethFillDisabled}
                          />
                        </div>
                        {isChoroplethFillDisabled && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Inactive when Choropleth fill is mapped to data.
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="default-state-stroke-color" className="text-sm">
                          Default {subFeatureLabel.toLowerCase()} stroke color
                        </Label>
                        <ColorInput
                          id="default-state-stroke-color"
                          value={stylingSettings.base.defaultStateStrokeColor}
                          onChange={(value) => updateSetting("base", "defaultStateStrokeColor", value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="default-state-stroke-width" className="text-sm">
                        Default {subFeatureLabel.toLowerCase()} stroke width (
                        {stylingSettings.base.defaultStateStrokeWidth}
                        px)
                      </Label>
                      <Slider
                        id="default-state-stroke-width"
                        value={[stylingSettings.base.defaultStateStrokeWidth]}
                        onValueChange={(value) => updateSetting("base", "defaultStateStrokeWidth", value[0])}
                        min={0}
                        max={5}
                        step={0.5}
                      />
                    </div>
                  </div>,
                )}
              </div>
            )}

            {activeTab === "symbol" && (
              <div className="space-y-4 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                {renderSubPanel(
                  "symbols",
                  "Symbols", // Sentence case
                  <Circle className="w-4 h-4" />,
                  <div className="space-y-4">
                    {/* New row for Symbol Type and Shape toggles */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2 flex flex-col">
                        <Label htmlFor="symbol-type" className="text-sm">
                          Symbol type
                        </Label>
                        <ToggleGroup
                          type="single"
                          value={stylingSettings.symbol.symbolType}
                          onValueChange={(value: "symbol" | "spike" | "arrow") => {
                            if (value) {
                              updateSetting("symbol", "symbolType", value)
                            }
                          }}
                          className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white p-1 text-muted-foreground dark:border-gray-700 dark:bg-gray-800 self-start"
                          aria-label="Symbol type"
                        >
                          <ToggleGroupItem
                            value="symbol"
                            aria-label="Symbol"
                            className="px-3 py-1.5 text-xs font-normal hover:bg-gray-100 dark:hover:bg-gray-700 data-[state=on]:bg-secondary data-[state=on]:text-foreground transition-colors duration-200 h-full"
                          >
                            <Circle className="w-3 h-3 mr-1.5" />
                            Symbol
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="spike"
                            aria-label="Spike"
                            className="px-3 py-1.5 text-xs font-normal hover:bg-gray-100 dark:hover:bg-gray-700 data-[state=on]:bg-secondary data-[state=on]:text-foreground transition-colors duration-200 h-full"
                          >
                            <Play className="w-3 h-3 mr-1.5" />
                            Spike
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="arrow"
                            aria-label="Arrow"
                            className="px-3 py-1.5 text-xs font-normal hover:bg-gray-100 dark:hover:bg-gray-700 data-[state=on]:bg-secondary data-[state=on]:text-foreground transition-colors duration-200 h-full"
                          >
                            <ArrowUp className="w-3 h-3 mr-1.5" />
                            Arrow
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>

                      {stylingSettings.symbol.symbolType === "symbol" && (
                        <div className="space-y-2 flex flex-col">
                          <Label htmlFor="symbol-shape" className="text-sm">
                            Shape
                          </Label>
                          <ToggleGroup
                            type="single"
                            value={stylingSettings.symbol.symbolShape}
                            onValueChange={(value: StylingSettings["symbol"]["symbolShape"]) => {
                              if (value) {
                                updateSetting("symbol", "symbolShape", value)
                                if (value === "custom-svg" && stylingSettings.symbol.customSvgPath === undefined) {
                                  updateSetting("symbol", "customSvgPath", "") // Initialize if switching to custom-svg
                                }
                              }
                            }}
                            className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white p-1 text-muted-foreground dark:border-gray-700 dark:bg-gray-800 self-start"
                            aria-label="Symbol shape"
                          >
                            <ToggleGroupItem
                              value="circle"
                              aria-label="Circle"
                              className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white h-full"
                            >
                              <Circle className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="square"
                              aria-label="Square"
                              className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white h-full"
                            >
                              <Square className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="diamond"
                              aria-label="Diamond"
                              className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white h-full"
                            >
                              <Diamond className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="triangle"
                              aria-label="Triangle"
                              className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white h-full"
                            >
                              <Triangle className="h-4 w-4" />
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="triangle-down"
                              aria-label="Upside-down Triangle"
                              className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white h-full"
                            >
                              <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 19L5 7h14z" />
                              </svg>
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="hexagon"
                              aria-label="Hexagon"
                              className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white h-full"
                            >
                              <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                              </svg>
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="map-marker"
                              aria-label="Map Marker"
                              className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white h-full"
                            >
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2ZM7 9C7 6.24 9.24 4 12 4C14.76 4 17 6.24 17 9C17 11.88 14.12 16.19 12 18.88C9.92 16.21 7 11.85 7 9Z" />
                                <path d="M12 11.5C13.3807 11.5 14.5 10.3807 14.5 9C14.5 7.61929 13.3807 6.5C12 6.5 10.6193 6.5 9.5 7.61929 9.5 9C9.5 10.3807 10.6193 11.5 12 11.5Z" />
                              </svg>
                            </ToggleGroupItem>
                            <ToggleGroupItem
                              value="custom-svg"
                              aria-label="Custom SVG"
                              className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white h-full"
                            >
                              <Code className="h-4 w-4" />
                            </ToggleGroupItem>
                          </ToggleGroup>
                        </div>
                      )}
                    </div>
                    {stylingSettings.symbol.symbolType === "symbol" &&
                      stylingSettings.symbol.symbolShape === "custom-svg" && (
                        <div className="space-y-2">
                          <Label htmlFor="custom-svg-path" className="text-sm">
                            Custom SVG Path (d attribute)
                          </Label>
                          <Input
                            id="custom-svg-path"
                            placeholder="M0,0L10,0L5,10Z"
                            value={stylingSettings.symbol.customSvgPath || ""}
                            onChange={(e) => updateSetting("symbol", "customSvgPath", e.target.value)}
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Paste the 'd' attribute value from your SVG path element.
                          </p>
                        </div>
                      )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="symbol-fill-color" className="text-sm">
                          Symbol fill color
                        </Label>
                        <div className={cn(isSymbolFillDisabled && "pointer-events-none opacity-50")}>
                          <ColorInput
                            id="symbol-fill-color"
                            value={stylingSettings.symbol.symbolFillColor}
                            onChange={(value) => updateSetting("symbol", "symbolFillColor", value)}
                            disabled={isSymbolFillDisabled}
                          />
                        </div>
                        {isSymbolFillDisabled && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Inactive when Symbol color is mapped to data.
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="symbol-stroke-color" className="text-sm">
                          Symbol stroke color
                        </Label>
                        <ColorInput
                          id="symbol-stroke-color"
                          value={stylingSettings.symbol.symbolStrokeColor}
                          onChange={(value) => updateSetting("symbol", "symbolStrokeColor", value)}
                        />
                      </div>
                    </div>

                    {/* New grid for size and stroke width */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="symbol-size" className="text-sm">
                          Symbol size ({stylingSettings.symbol.symbolSize}px)
                        </Label>
                        <div className={cn(isSymbolSizeDisabled && "pointer-events-none opacity-50")}>
                          <Slider
                            id="symbol-size"
                            value={[stylingSettings.symbol.symbolSize]}
                            onValueChange={(value) => updateSetting("symbol", "symbolSize", value[0])}
                            min={1}
                            max={50}
                            step={1}
                            disabled={isSymbolSizeDisabled}
                          />
                        </div>
                        {isSymbolSizeDisabled && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Inactive when Symbol size is mapped to data.
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="symbol-stroke-width" className="text-sm">
                          Symbol stroke width ({stylingSettings.symbol.symbolStrokeWidth}px)
                        </Label>
                        <Slider
                          id="symbol-stroke-width"
                          value={[stylingSettings.symbol.symbolStrokeWidth]}
                          onValueChange={(value) => updateSetting("symbol", "symbolStrokeWidth", value[0])}
                          min={0}
                          max={5}
                          step={0.5}
                        />
                      </div>
                    </div>

                    {/* New grid for transparency sliders */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="symbol-fill-transparency" className="text-sm">
                          Fill transparency ({stylingSettings.symbol.symbolFillTransparency ?? 80}%)
                        </Label>
                        <Slider
                          id="symbol-fill-transparency"
                          value={[stylingSettings.symbol.symbolFillTransparency ?? 80]}
                          onValueChange={(value) => updateSetting("symbol", "symbolFillTransparency", value[0])}
                          min={0}
                          max={100}
                          step={1}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="symbol-stroke-transparency" className="text-sm">
                          Stroke transparency ({stylingSettings.symbol.symbolStrokeTransparency ?? 100}%)
                        </Label>
                        <Slider
                          id="symbol-stroke-transparency"
                          value={[stylingSettings.symbol.symbolStrokeTransparency ?? 100]}
                          onValueChange={(value) => updateSetting("symbol", "symbolStrokeTransparency", value[0])}
                          min={0}
                          max={100}
                          step={1}
                        />
                      </div>
                    </div>
                  </div>,
                )}

                {renderSubPanel(
                  "symbolLabels",
                  "Labels", // Sentence case
                  <Type className="w-4 h-4" />,
                  <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
                    <div className="space-y-4">
                      <div className="flex items-end gap-4">
                        <div className="space-y-2 flex-1">
                          <Label htmlFor="symbol-label-font-family" className="text-sm">
                            Font family
                          </Label>
                          <Select
                            value={stylingSettings.symbol.labelFontFamily || "Inter"}
                            onValueChange={(value) => updateSetting("symbol", "labelFontFamily", value)}
                          >
                            <SelectTrigger id="symbol-label-font-family">
                              <SelectValue placeholder="Inter" />
                            </SelectTrigger>
                            <SelectContent>
                              {googleFontFamilies.map((font) => (
                                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                                  {font}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <ToggleGroup
                          type="multiple"
                          value={
                            [
                              stylingSettings.symbol.labelBold && "bold",
                              stylingSettings.symbol.labelItalic && "italic",
                              stylingSettings.symbol.labelUnderline && "underline",
                              stylingSettings.symbol.labelStrikethrough && "strikethrough",
                            ].filter(Boolean) as string[]
                          }
                          onValueChange={(values) => {
                            console.log("Symbol Label ToggleGroup onValueChange - received values:", values)
                            onUpdateStylingSettings({
                              ...stylingSettings,
                              symbol: {
                                ...stylingSettings.symbol,
                                labelBold: values.includes("bold"),
                                labelItalic: values.includes("italic"),
                                labelUnderline: values.includes("underline"),
                                labelStrikethrough: values.includes("strikethrough"),
                              },
                            })
                          }}
                          className="inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white p-1 text-muted-foreground dark:border-gray-700 dark:bg-gray-800"
                        >
                          <ToggleGroupItem
                            value="bold"
                            aria-label="Toggle bold"
                            className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white h-full"
                          >
                            <Bold className="h-4 w-4" />
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="italic"
                            aria-label="Toggle italic"
                            className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white leading-4 leading-3 leading-4 leading-3 h-full"
                          >
                            <Italic className="h-4 w-4" />
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="underline"
                            aria-label="Toggle underline"
                            className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white h-full"
                          >
                            <Underline className="h-4 w-4" />
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="strikethrough"
                            aria-label="Toggle strikethrough"
                            className="p-2 rounded-md transition-all duration-200 data-[state=on]:bg-gray-100 data-[state=on]:text-gray-900 dark:data-[state=on]:bg-gray-700 dark:data-[state=on]:text-white hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white h-full"
                          >
                            <Strikethrough className="h-4 w-4" />
                          </ToggleGroupItem>
                        </ToggleGroup>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="symbol-label-color" className="text-sm">
                            Label color
                          </Label>
                          <ColorInput
                            id="symbol-label-color"
                            value={stylingSettings.symbol.labelColor}
                            onChange={(value) => updateSetting("symbol", "labelColor", value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="symbol-label-outline-color" className="text-sm">
                            Label outline color
                          </Label>
                          <ColorInput
                            id="symbol-label-outline-color"
                            value={stylingSettings.symbol.labelOutlineColor}
                            onChange={(value) => updateSetting("symbol", "labelOutlineColor", value)}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="symbol-label-font-size" className="text-sm">
                            Font size ({stylingSettings.symbol.labelFontSize}px)
                          </Label>
                          <Slider
                            id="symbol-label-font-size"
                            value={[stylingSettings.symbol.labelFontSize]}
                            onValueChange={(value) => updateSetting("symbol", "labelFontSize", value[0])}
                            min={8}
                            max={30}
                            step={1}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="symbol-label-outline-thickness" className="text-sm">
                            Outline thickness ({stylingSettings.symbol.labelOutlineThickness}px)
                          </Label>
                          <Slider
                            id="symbol-label-outline-thickness"
                            value={[stylingSettings.symbol.labelOutlineThickness]}
                            onValueChange={(value) => updateSetting("symbol", "labelOutlineThickness", value[0])}
                            min={0}
                            max={10}
                            step={0.5}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Alignment</Label>
                      <div className="grid grid-cols-3 gap-1 w-fit rounded-md border border-gray-200 bg-white p-1 text-muted-foreground dark:border-gray-700 dark:bg-gray-800">
                        <Button
                          className={cn(
                            "h-8 col-span-3 rounded-md transition-all duration-200",
                            stylingSettings.symbol.labelAlignment === "auto"
                              ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                              : "bg-transparent text-muted-foreground",
                            "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white",
                          )}
                          onClick={() => updateSetting("symbol", "labelAlignment", "auto")}
                        >
                          <Sparkles className="h-4 w-4 mr-2" /> Auto
                        </Button>
                        {[
                          { value: "top-left", icon: ArrowUpLeft },
                          { value: "top-center", icon: ArrowUp },
                          { value: "top-right", icon: ArrowUpRight },
                          { value: "middle-left", icon: ArrowLeft },
                          { value: "center", icon: Minus }, // Using Minus for center
                          { value: "middle-right", icon: ArrowRight },
                          { value: "bottom-left", icon: ArrowDownLeft },
                          { value: "bottom-center", icon: ArrowDown },
                          { value: "bottom-right", icon: ArrowDownRight },
                        ].map((item) => (
                          <Button
                            key={item.value}
                            // Removed size="icon" to allow explicit padding
                            className={cn(
                              "h-8 w-8 p-2 rounded-md transition-all duration-200", // Added p-2
                              stylingSettings.symbol.labelAlignment === item.value
                                ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-white"
                                : "bg-transparent text-muted-foreground",
                              "hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-gray-700 dark:hover:text-white",
                            )}
                            onClick={() => updateSetting("symbol", "labelAlignment", item.value)}
                          >
                            <item.icon className="h-4 w-4" />
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>,
                )}
              </div>
            )}
          </CardContent>
        </div>
      </Card>
    </TooltipProvider>
  )
}
