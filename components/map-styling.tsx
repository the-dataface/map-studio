"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChromeColorPicker } from "@/components/chrome-color-picker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { SaveSchemeModal } from "./save-scheme-modal"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Type } from "lucide-react"

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
  dimensionSettings: any // from parent (e.g., page.tsx)
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
  const [activeTab, setActiveTab] = useState(stylingSettings.activeTab)
  const [showSaveModal, setShowSaveModal] = useState(false)
  const [styleNameToSave, setStyleNameToSave] = useState("")
  const [styleToApply, setStyleToApply] = useState<SavedStyle | null>(null)

  useEffect(() => {
    onUpdateStylingSettings({ ...stylingSettings, activeTab })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  const updateBaseStyling = (key: keyof StylingSettings["base"], value: any) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      base: { ...stylingSettings.base, [key]: value },
    })
  }

  const updateSymbolStyling = (key: keyof StylingSettings["symbol"], value: any) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      symbol: { ...stylingSettings.symbol, [key]: value },
    })
  }

  const updateChoroplethStyling = (key: keyof StylingSettings["choropleth"], value: any) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      choropleth: { ...stylingSettings.choropleth, [key]: value },
    })
  }

  const getGeographyLabel = () => {
    if (selectedGeography === "usa-counties") return "County"
    if (selectedGeography === "usa-states") return "State"
    if (selectedGeography === "canada-provinces") return "Province"
    return "State/Province/County" // Fallback, though this panel should be hidden if not these
  }

  const handleSaveStyle = () => {
    const newStyle: SavedStyle = {
      id: `user-style-${Date.now()}`,
      name: styleNameToSave,
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
    setShowSaveModal(false)
    setStyleNameToSave("")
  }

  const handleDeleteStyle = (id: string) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      base: {
        ...stylingSettings.base,
        savedStyles: stylingSettings.base.savedStyles.filter((style) => style.id !== id),
      },
    })
  }

  const handleApplyStyle = (style: SavedStyle) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      base: {
        ...stylingSettings.base,
        ...style.settings, // Apply the loaded settings
      },
    })
  }

  const showSymbolTab = symbolDataExists || customDataExists
  const showChoroplethTab = choroplethDataExists || customDataExists

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map Styling</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "base" | "symbol" | "choropleth")}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="base">Base</TabsTrigger>
            <TabsTrigger value="symbol" disabled={!showSymbolTab}>
              Symbol
            </TabsTrigger>
            <TabsTrigger value="choropleth" disabled={!showChoroplethTab}>
              Choropleth
            </TabsTrigger>
          </TabsList>
          <TabsContent value="base" className="mt-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="general-styles">
                <AccordionTrigger>General Styles</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="mapBackgroundColor">Map Background Color</Label>
                    <ChromeColorPicker
                      color={stylingSettings.base.mapBackgroundColor}
                      onChange={(color) => updateBaseStyling("mapBackgroundColor", color.hex)}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowSaveModal(true)}>
                      Save Current Style
                    </Button>
                    <SaveSchemeModal
                      isOpen={showSaveModal}
                      onClose={() => setShowSaveModal(false)}
                      onSave={handleSaveStyle}
                      styleName={styleNameToSave}
                      onStyleNameChange={setStyleNameToSave}
                    />
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline">Load Saved Styles</Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2">
                        {stylingSettings.base.savedStyles.length === 0 ? (
                          <p className="text-sm text-gray-500">No saved styles.</p>
                        ) : (
                          <div className="space-y-1">
                            {stylingSettings.base.savedStyles.map((style) => (
                              <div key={style.id} className="flex items-center justify-between group">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="justify-start w-full"
                                  onClick={() => {
                                    handleApplyStyle(style)
                                    // Close popover after applying
                                    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }))
                                  }}
                                >
                                  {style.name} ({style.type})
                                </Button>
                                {style.type === "user" && (
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          This action cannot be undone. This will permanently delete your custom style{" "}
                                          <span className="font-semibold">{style.name}</span>.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDeleteStyle(style.id)}>
                                          Delete
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Nation/Country Styles - ALWAYS VISIBLE */}
              <AccordionItem value="nation-styles">
                <AccordionTrigger>Nation/Country Styles</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="nationFillColor">Nation Fill Color</Label>
                    <ChromeColorPicker
                      color={stylingSettings.base.nationFillColor}
                      onChange={(color) => updateBaseStyling("nationFillColor", color.hex)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nationStrokeColor">Nation Stroke Color</Label>
                    <ChromeColorPicker
                      color={stylingSettings.base.nationStrokeColor}
                      onChange={(color) => updateBaseStyling("nationStrokeColor", color.hex)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nationStrokeWidth">Nation Stroke Width</Label>
                    <Slider
                      id="nationStrokeWidth"
                      min={0}
                      max={5}
                      step={0.1}
                      value={[stylingSettings.base.nationStrokeWidth]}
                      onValueChange={(val) => updateBaseStyling("nationStrokeWidth", val[0])}
                    />
                    <span className="text-sm text-gray-500">
                      {stylingSettings.base.nationStrokeWidth.toFixed(1)} px
                    </span>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* State/Province/County Styles - CONDITIONAL */}
              {(selectedGeography === "usa-states" ||
                selectedGeography === "usa-counties" ||
                selectedGeography === "canada-provinces") && (
                <AccordionItem value="state-province-county-styles">
                  <AccordionTrigger>{getGeographyLabel()} Styles</AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div>
                      <Label htmlFor="defaultStateFillColor">Default {getGeographyLabel()} Fill Color</Label>
                      <ChromeColorPicker
                        color={stylingSettings.base.defaultStateFillColor}
                        onChange={(color) => updateBaseStyling("defaultStateFillColor", color.hex)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="defaultStateStrokeColor">Default {getGeographyLabel()} Stroke Color</Label>
                      <ChromeColorPicker
                        color={stylingSettings.base.defaultStateStrokeColor}
                        onChange={(color) => updateBaseStyling("defaultStateStrokeColor", color.hex)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="defaultStateStrokeWidth">Default {getGeographyLabel()} Stroke Width</Label>
                      <Slider
                        id="defaultStateStrokeWidth"
                        min={0}
                        max={5}
                        step={0.1}
                        value={[stylingSettings.base.defaultStateStrokeWidth]}
                        onValueChange={(val) => updateBaseStyling("defaultStateStrokeWidth", val[0])}
                      />
                      <span className="text-sm text-gray-500">
                        {stylingSettings.base.defaultStateStrokeWidth.toFixed(1)} px
                      </span>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </TabsContent>
          <TabsContent value="symbol" className="mt-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="symbol-type">
                <AccordionTrigger>Symbol Type</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <Select
                    value={stylingSettings.symbol.symbolType}
                    onValueChange={(value: "symbol" | "spike" | "arrow") => updateSymbolStyling("symbolType", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select symbol type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="symbol">Symbol</SelectItem>
                      <SelectItem value="spike">Spike</SelectItem>
                      <SelectItem value="arrow">Arrow</SelectItem>
                    </SelectContent>
                  </Select>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="symbol-shape"
                className={stylingSettings.symbol.symbolType === "symbol" ? "" : "hidden"}
              >
                <AccordionTrigger>Symbol Shape</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <Select
                    value={stylingSettings.symbol.symbolShape}
                    onValueChange={(value: any) => updateSymbolStyling("symbolShape", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select symbol shape" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="circle">Circle</SelectItem>
                      <SelectItem value="square">Square</SelectItem>
                      <SelectItem value="diamond">Diamond</SelectItem>
                      <SelectItem value="triangle">Triangle</SelectItem>
                      <SelectItem value="triangle-down">Triangle Down</SelectItem>
                      <SelectItem value="hexagon">Hexagon</SelectItem>
                      <SelectItem value="map-marker">Map Marker</SelectItem>
                      <SelectItem value="custom-svg">Custom SVG</SelectItem>
                    </SelectContent>
                  </Select>
                  {stylingSettings.symbol.symbolShape === "custom-svg" && (
                    <div className="mt-4">
                      <Label htmlFor="customSvgPath">Custom SVG Path (e.g., M0,0L10,10Z)</Label>
                      <Input
                        id="customSvgPath"
                        value={stylingSettings.symbol.customSvgPath || ""}
                        onChange={(e) => updateSymbolStyling("customSvgPath", e.target.value)}
                        placeholder="Enter SVG path data"
                      />
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="symbol-colors">
                <AccordionTrigger>Symbol Colors</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="symbolFillColor">Symbol Fill Color</Label>
                    <ChromeColorPicker
                      color={stylingSettings.symbol.symbolFillColor}
                      onChange={(color) => updateSymbolStyling("symbolFillColor", color.hex)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="symbolFillTransparency">Symbol Fill Transparency</Label>
                    <Slider
                      id="symbolFillTransparency"
                      min={0}
                      max={1}
                      step={0.01}
                      value={[stylingSettings.symbol.symbolFillTransparency || 1]}
                      onValueChange={(val) => updateSymbolStyling("symbolFillTransparency", val[0])}
                    />
                    <span className="text-sm text-gray-500">
                      {(stylingSettings.symbol.symbolFillTransparency || 1).toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <Label htmlFor="symbolStrokeColor">Symbol Stroke Color</Label>
                    <ChromeColorPicker
                      color={stylingSettings.symbol.symbolStrokeColor}
                      onChange={(color) => updateSymbolStyling("symbolStrokeColor", color.hex)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="symbolStrokeTransparency">Symbol Stroke Transparency</Label>
                    <Slider
                      id="symbolStrokeTransparency"
                      min={0}
                      max={1}
                      step={0.01}
                      value={[stylingSettings.symbol.symbolStrokeTransparency || 1]}
                      onValueChange={(val) => updateSymbolStyling("symbolStrokeTransparency", val[0])}
                    />
                    <span className="text-sm text-gray-500">
                      {(stylingSettings.symbol.symbolStrokeTransparency || 1).toFixed(2)}
                    </span>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="symbol-size">
                <AccordionTrigger>Symbol Size</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="symbolSize">Symbol Size</Label>
                    <Slider
                      id="symbolSize"
                      min={1}
                      max={50}
                      step={1}
                      value={[stylingSettings.symbol.symbolSize]}
                      onValueChange={(val) => updateSymbolStyling("symbolSize", val[0])}
                    />
                    <span className="text-sm text-gray-500">{stylingSettings.symbol.symbolSize} px</span>
                  </div>
                  <div>
                    <Label htmlFor="symbolStrokeWidth">Symbol Stroke Width</Label>
                    <Slider
                      id="symbolStrokeWidth"
                      min={0}
                      max={10}
                      step={0.5}
                      value={[stylingSettings.symbol.symbolStrokeWidth]}
                      onValueChange={(val) => updateSymbolStyling("symbolStrokeWidth", val[0])}
                    />
                    <span className="text-sm text-gray-500">
                      {stylingSettings.symbol.symbolStrokeWidth.toFixed(1)} px
                    </span>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="symbol-labels">
                <AccordionTrigger>Symbol Labels</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="labelFontFamily">Font Family</Label>
                    <Input
                      id="labelFontFamily"
                      value={stylingSettings.symbol.labelFontFamily}
                      onChange={(e) => updateSymbolStyling("labelFontFamily", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="labelFontSize">Font Size</Label>
                    <Slider
                      id="labelFontSize"
                      min={8}
                      max={32}
                      step={1}
                      value={[stylingSettings.symbol.labelFontSize]}
                      onValueChange={(val) => updateSymbolStyling("labelFontSize", val[0])}
                    />
                    <span className="text-sm text-gray-500">{stylingSettings.symbol.labelFontSize} px</span>
                  </div>
                  <div>
                    <Label htmlFor="labelColor">Label Color</Label>
                    <ChromeColorPicker
                      color={stylingSettings.symbol.labelColor}
                      onChange={(color) => updateSymbolStyling("labelColor", color.hex)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="labelOutlineColor">Outline Color</Label>
                    <ChromeColorPicker
                      color={stylingSettings.symbol.labelOutlineColor}
                      onChange={(color) => updateSymbolStyling("labelOutlineColor", color.hex)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="labelOutlineThickness">Outline Thickness</Label>
                    <Slider
                      id="labelOutlineThickness"
                      min={0}
                      max={5}
                      step={0.1}
                      value={[stylingSettings.symbol.labelOutlineThickness]}
                      onValueChange={(val) => updateSymbolStyling("labelOutlineThickness", val[0])}
                    />
                    <span className="text-sm text-gray-500">
                      {stylingSettings.symbol.labelOutlineThickness.toFixed(1)} px
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>Style</Label>
                    <Toggle
                      pressed={stylingSettings.symbol.labelBold}
                      onPressedChange={(pressed) => updateSymbolStyling("labelBold", pressed)}
                      aria-label="Toggle bold"
                    >
                      <Type.Bold className="h-4 w-4" />
                    </Toggle>
                    <Toggle
                      pressed={stylingSettings.symbol.labelItalic}
                      onPressedChange={(pressed) => updateSymbolStyling("labelItalic", pressed)}
                      aria-label="Toggle italic"
                    >
                      <Type.Italic className="h-4 w-4" />
                    </Toggle>
                    <Toggle
                      pressed={stylingSettings.symbol.labelUnderline}
                      onPressedChange={(pressed) => updateSymbolStyling("labelUnderline", pressed)}
                      aria-label="Toggle underline"
                    >
                      <Type.Underline className="h-4 w-4" />
                    </Toggle>
                    <Toggle
                      pressed={stylingSettings.symbol.labelStrikethrough}
                      onPressedChange={(pressed) => updateSymbolStyling("labelStrikethrough", pressed)}
                      aria-label="Toggle strikethrough"
                    >
                      <Type.Strikethrough className="h-4 w-4" />
                    </Toggle>
                  </div>
                  <div>
                    <Label htmlFor="labelAlignment">Label Alignment</Label>
                    <Select
                      value={stylingSettings.symbol.labelAlignment}
                      onValueChange={(value: any) => updateSymbolStyling("labelAlignment", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select alignment" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="top-left">Top Left</SelectItem>
                        <SelectItem value="top-center">Top Center</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="middle-left">Middle Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="middle-right">Middle Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="bottom-center">Bottom Center</SelectItem>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
          <TabsContent value="choropleth" className="mt-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="choropleth-labels">
                <AccordionTrigger>Choropleth Labels</AccordionTrigger>
                <AccordionContent className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="choroplethLabelFontFamily">Font Family</Label>
                    <Input
                      id="choroplethLabelFontFamily"
                      value={stylingSettings.choropleth.labelFontFamily}
                      onChange={(e) => updateChoroplethStyling("labelFontFamily", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="choroplethLabelFontSize">Font Size</Label>
                    <Slider
                      id="choroplethLabelFontSize"
                      min={8}
                      max={32}
                      step={1}
                      value={[stylingSettings.choropleth.labelFontSize]}
                      onValueChange={(val) => updateChoroplethStyling("labelFontSize", val[0])}
                    />
                    <span className="text-sm text-gray-500">{stylingSettings.choropleth.labelFontSize} px</span>
                  </div>
                  <div>
                    <Label htmlFor="choroplethLabelColor">Label Color</Label>
                    <ChromeColorPicker
                      color={stylingSettings.choropleth.labelColor}
                      onChange={(color) => updateChoroplethStyling("labelColor", color.hex)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="choroplethLabelOutlineColor">Outline Color</Label>
                    <ChromeColorPicker
                      color={stylingSettings.choropleth.labelOutlineColor}
                      onChange={(color) => updateChoroplethStyling("labelOutlineColor", color.hex)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="choroplethLabelOutlineThickness">Outline Thickness</Label>
                    <Slider
                      id="choroplethLabelOutlineThickness"
                      min={0}
                      max={5}
                      step={0.1}
                      value={[stylingSettings.choropleth.labelOutlineThickness]}
                      onValueChange={(val) => updateChoroplethStyling("labelOutlineThickness", val[0])}
                    />
                    <span className="text-sm text-gray-500">
                      {stylingSettings.choropleth.labelOutlineThickness.toFixed(1)} px
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label>Style</Label>
                    <Toggle
                      pressed={stylingSettings.choropleth.labelBold}
                      onPressedChange={(pressed) => updateChoroplethStyling("labelBold", pressed)}
                      aria-label="Toggle bold"
                    >
                      <Type.Bold className="h-4 w-4" />
                    </Toggle>
                    <Toggle
                      pressed={stylingSettings.choropleth.labelItalic}
                      onPressedChange={(pressed) => updateChoroplethStyling("labelItalic", pressed)}
                      aria-label="Toggle italic"
                    >
                      <Type.Italic className="h-4 w-4" />
                    </Toggle>
                    <Toggle
                      pressed={stylingSettings.choropleth.labelUnderline}
                      onPressedChange={(pressed) => updateChoroplethStyling("labelUnderline", pressed)}
                      aria-label="Toggle underline"
                    >
                      <Type.Underline className="h-4 w-4" />
                    </Toggle>
                    <Toggle
                      pressed={stylingSettings.choropleth.labelStrikethrough}
                      onPressedChange={(pressed) => updateChoroplethStyling("labelStrikethrough", pressed)}
                      aria-label="Toggle strikethrough"
                    >
                      <Type.Strikethrough className="h-4 w-4" />
                    </Toggle>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// Ensure the necessary Lucide icons are imported and used
import { Trash2 } from "lucide-react"
