"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { ColorInput } from "@/components/color-input"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Toggle } from "@/components/ui/toggle"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Square,
  Circle,
  Diamond,
  Triangle,
  TriangleIcon as TriangleDown,
  Hexagon,
  MapPin,
  FileBadge,
} from "lucide-react"
import { useMemo, useState } from "react"
import { Button } from "./ui/button"
import { SaveSchemeModal } from "./save-scheme-modal"
import { toast } from "./ui/use-toast"
import { Separator } from "@radix-ui/react-separator"

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
    symbolType: "symbol" | "spike" | "arrow" | "custom-svg"
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
    colorScale: string
    colorPalette: string
    colorMinValue: number
    colorMidValue: number
    colorMaxValue: number
    colorMinColor: string
    colorMidColor: string
    colorMaxColor: string
    categoricalColors: { value: string | number; color: string }[]
    labelTemplate: string
  }
  choropleth: {
    stateColumn: string
    colorBy: string
    colorScale: string
    colorPalette: string
    colorMinValue: number
    colorMidValue: number
    colorMaxValue: number
    colorMinColor: string
    colorMidColor: string
    colorMaxColor: string
    categoricalColors: { value: string | number; color: string }[]
    labelTemplate: string
  }
  custom: {
    stateColumn: string
    colorBy: string
    colorScale: string
    colorPalette: string
    colorMinValue: number
    colorMidValue: number
    colorMaxValue: number
    colorMinColor: string
    colorMidColor: string
    colorMaxColor: string
    categoricalColors: { value: string | number; color: string }[]
    labelTemplate: string
  }
}

interface MapStylingProps {
  stylingSettings: StylingSettings
  onUpdateStylingSettings: (newSettings: StylingSettings) => void
  dimensionSettings: DimensionSettings
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
  selectedGeography, // New prop
}: MapStylingProps) {
  const [activeTab, setActiveTab] = useState<"base" | "symbol" | "choropleth">(stylingSettings.activeTab)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)

  const currentSettings = stylingSettings[activeTab]
  const updateSetting = (key: string, value: any) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      [activeTab]: {
        ...currentSettings,
        [key]: value,
      },
      activeTab: activeTab, // Ensure activeTab is persisted
    })
  }

  const updateBaseSetting = (key: string, value: any) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      base: {
        ...stylingSettings.base,
        [key]: value,
      },
    })
  }

  const handleApplyPreset = (preset: SavedStyle) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      base: {
        ...stylingSettings.base,
        ...preset.settings,
      },
    })
    toast({
      title: "Preset Applied",
      description: `Applied ${preset.name} style.`,
    })
  }

  const handleSaveStyle = (styleName: string) => {
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
    setIsSaveModalOpen(false)
    toast({
      title: "Style Saved",
      description: `"${styleName}" has been saved as a custom style.`,
    })
  }

  const handleDeleteStyle = (id: string) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      base: {
        ...stylingSettings.base,
        savedStyles: stylingSettings.base.savedStyles.filter((s) => s.id !== id),
      },
    })
    toast({
      title: "Style Deleted",
      description: "The custom style has been removed.",
    })
  }

  // Determine the label for the "States" subpanel
  const stateSubpanelLabel = useMemo(() => {
    if (selectedGeography === "usa-counties") {
      return "Counties"
    }
    if (selectedGeography === "canada-provinces") {
      return "Provinces"
    }
    return "States"
  }, [selectedGeography])

  const showSymbolTab = symbolDataExists || dimensionSettings.symbol.latitude || dimensionSettings.symbol.longitude
  const showChoroplethTab = choroplethDataExists || dimensionSettings.choropleth.stateColumn
  const showCustomTab = customDataExists || dimensionSettings.custom.stateColumn

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Map Styling</CardTitle>
        <CardDescription>Customize the visual appearance of your map elements.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="base">Base Map</TabsTrigger>
            <TabsTrigger value="symbol" disabled={!showSymbolTab}>
              Symbol Layer{" "}
              {showSymbolTab && (
                <Badge className="ml-2" variant="secondary">
                  Active
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="choropleth" disabled={!(showChoroplethTab || showCustomTab)}>
              Choropleth Layer{" "}
              {(showChoroplethTab || showCustomTab) && (
                <Badge className="ml-2" variant="secondary">
                  Active
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="base" className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold">General</h3>
            <div className="space-y-2">
              <Label htmlFor="mapBackgroundColor">Map Background Color</Label>
              <ColorInput
                color={stylingSettings.base.mapBackgroundColor}
                onChange={(color) => updateBaseSetting("mapBackgroundColor", color)}
              />
            </div>

            <Separator className="my-4 h-px bg-gray-200 dark:bg-gray-700" />

            <h3 className="text-lg font-semibold">Nation Styling</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nationFillColor">Fill Color</Label>
                <ColorInput
                  color={stylingSettings.base.nationFillColor}
                  onChange={(color) => updateBaseSetting("nationFillColor", color)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationStrokeColor">Stroke Color</Label>
                <ColorInput
                  color={stylingSettings.base.nationStrokeColor}
                  onChange={(color) => updateBaseSetting("nationStrokeColor", color)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationStrokeWidth">Stroke Width (px)</Label>
                <Input
                  id="nationStrokeWidth"
                  type="number"
                  value={stylingSettings.base.nationStrokeWidth}
                  onChange={(e) => updateBaseSetting("nationStrokeWidth", Number(e.target.value))}
                  min={0}
                  step={0.1}
                />
              </div>
            </div>

            <Separator className="my-4 h-px bg-gray-200 dark:bg-gray-700" />

            {/* Always show state/province/county styling based on geography type */}
            <h3 className="text-lg font-semibold">{stateSubpanelLabel} Styling</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="defaultStateFillColor">Default Fill Color</Label>
                <ColorInput
                  color={stylingSettings.base.defaultStateFillColor}
                  onChange={(color) => updateBaseSetting("defaultStateFillColor", color)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultStateStrokeColor">Default Stroke Color</Label>
                <ColorInput
                  color={stylingSettings.base.defaultStateStrokeColor}
                  onChange={(color) => updateBaseSetting("defaultStateStrokeColor", color)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="defaultStateStrokeWidth">Default Stroke Width (px)</Label>
                <Input
                  id="defaultStateStrokeWidth"
                  type="number"
                  value={stylingSettings.base.defaultStateStrokeWidth}
                  onChange={(e) => updateBaseSetting("defaultStateStrokeWidth", Number(e.target.value))}
                  min={0}
                  step={0.1}
                />
              </div>
            </div>

            <Separator className="my-4 h-px bg-gray-200 dark:bg-gray-700" />

            <h3 className="text-lg font-semibold">Saved Styles</h3>
            <div className="space-y-2">
              <Button onClick={() => setIsSaveModalOpen(true)}>Save Current Style</Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {stylingSettings.base.savedStyles.map((style) => (
                <div key={style.id} className="flex items-center justify-between rounded-md border p-2">
                  <span>
                    {style.name} {style.type === "preset" && <Badge variant="outline">Preset</Badge>}
                  </span>
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm" onClick={() => handleApplyPreset(style)}>
                      Apply
                    </Button>
                    {style.type === "user" && (
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteStyle(style.id)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="symbol" className="space-y-4 pt-4">
            {!showSymbolTab && (
              <p className="text-gray-500 dark:text-gray-400">
                Load symbol data or set latitude/longitude in Dimension Mapping to enable Symbol Layer styling.
              </p>
            )}
            {showSymbolTab && (
              <>
                <h3 className="text-lg font-semibold">Symbol Appearance</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="symbolType">Symbol Type</Label>
                    <Select
                      value={currentSettings.symbolType}
                      onValueChange={(value) => updateSetting("symbolType", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select symbol type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="symbol">Basic Symbol</SelectItem>
                        <SelectItem value="spike">Spike</SelectItem>
                        <SelectItem value="arrow">Arrow</SelectItem>
                        <SelectItem value="custom-svg">Custom SVG</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {currentSettings.symbolType === "basic-symbol" && (
                    <div className="space-y-2">
                      <Label htmlFor="symbolShape">Symbol Shape</Label>
                      <ToggleGroup
                        type="single"
                        value={currentSettings.symbolShape}
                        onValueChange={(value) => value && updateSetting("symbolShape", value)}
                        className="grid grid-cols-4 w-full"
                      >
                        <ToggleGroupItem value="circle" aria-label="Circle">
                          <Circle className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="square" aria-label="Square">
                          <Square className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="diamond" aria-label="Diamond">
                          <Diamond className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="triangle" aria-label="Triangle Up">
                          <Triangle className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="triangle-down" aria-label="Triangle Down">
                          <TriangleDown className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="hexagon" aria-label="Hexagon">
                          <Hexagon className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="map-marker" aria-label="Map Marker">
                          <MapPin className="h-4 w-4" />
                        </ToggleGroupItem>
                        <ToggleGroupItem value="custom-svg" aria-label="Custom SVG">
                          <FileBadge className="h-4 w-4" />
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  )}
                  {currentSettings.symbolType === "custom-svg" && (
                    <div className="col-span-full space-y-2">
                      <Label htmlFor="customSvgPath">Custom SVG Path (d attribute)</Label>
                      <Input
                        id="customSvgPath"
                        placeholder="M10 0 L20 20 L0 20 Z"
                        value={currentSettings.customSvgPath || ""}
                        onChange={(e) => updateSetting("customSvgPath", e.target.value)}
                      />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Enter the 'd' attribute value for your SVG path.
                      </p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="symbolFillColor">Fill Color</Label>
                    <ColorInput
                      color={currentSettings.symbolFillColor}
                      onChange={(color) => updateSetting("symbolFillColor", color)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symbolFillTransparency">Fill Transparency</Label>
                    <Slider
                      id="symbolFillTransparency"
                      min={0}
                      max={1}
                      step={0.01}
                      value={[currentSettings.symbolFillTransparency ?? 1]}
                      onValueChange={(value) => updateSetting("symbolFillTransparency", value[0])}
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {(currentSettings.symbolFillTransparency ?? 1).toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symbolStrokeColor">Stroke Color</Label>
                    <ColorInput
                      color={currentSettings.symbolStrokeColor}
                      onChange={(color) => updateSetting("symbolStrokeColor", color)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symbolStrokeTransparency">Stroke Transparency</Label>
                    <Slider
                      id="symbolStrokeTransparency"
                      min={0}
                      max={1}
                      step={0.01}
                      value={[currentSettings.symbolStrokeTransparency ?? 1]}
                      onValueChange={(value) => updateSetting("symbolStrokeTransparency", value[0])}
                    />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {(currentSettings.symbolStrokeTransparency ?? 1).toFixed(2)}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symbolStrokeWidth">Stroke Width (px)</Label>
                    <Input
                      id="symbolStrokeWidth"
                      type="number"
                      value={currentSettings.symbolStrokeWidth}
                      onChange={(e) => updateSetting("symbolStrokeWidth", Number(e.target.value))}
                      min={0}
                      step={0.1}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="symbolSize">Default Size (px)</Label>
                    <Input
                      id="symbolSize"
                      type="number"
                      value={currentSettings.symbolSize}
                      onChange={(e) => updateSetting("symbolSize", Number(e.target.value))}
                      min={1}
                    />
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="choropleth" className="space-y-4 pt-4">
            {!(showChoroplethTab || showCustomTab) && (
              <p className="text-gray-500 dark:text-gray-400">
                Load choropleth data or a custom SVG map to enable Choropleth Layer styling.
              </p>
            )}
            {(showChoroplethTab || showCustomTab) && (
              <>
                <h3 className="text-lg font-semibold">Labels</h3>
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
              </>
            )}
          </TabsContent>
        </Tabs>

        <SaveSchemeModal isOpen={isSaveModalOpen} onOpenChange={setIsSaveModalOpen} onSave={handleSaveStyle} />
      </CardContent>
    </Card>
  )
}
