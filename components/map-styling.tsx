"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import ColorInput from "@/components/color-input"
import { ChromePicker } from "react-color"
import { Checkbox } from "@/components/ui/checkbox" // Assuming this component exists or is imported from shadcn/ui
import type { SavedStyle } from "@/app/page" // Assuming SavedStyle is exported from app/page.tsx
import { SaveSchemeModal } from "@/components/save-scheme-modal"
import { Textarea } from "@/components/ui/textarea"

// Interfaces imported from app/page.tsx or defined here if not exported
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
    categoricalColors: string[]
    labelTemplate: string
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
    categoricalColors: string[]
    labelTemplate: string
  }
  custom: {
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
    categoricalColors: string[]
    labelTemplate: string
  }
}

interface MapStylingProps {
  stylingSettings: StylingSettings
  onUpdateStylingSettings: (settings: StylingSettings) => void
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
  selectedGeography,
}: MapStylingProps) {
  const { toast } = useToast()
  const [displayColorPicker, setDisplayColorPicker] = useState<string | null>(null) // State to control which color picker is open
  const [activeColor, setActiveColor] = useState<string>("#000000") // State to hold the color being edited
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [styleToDelete, setStyleToDelete] = useState<string | null>(null)
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false)

  const handleUpdateBaseSetting = (key: keyof StylingSettings["base"], value: any) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      base: {
        ...stylingSettings.base,
        [key]: value,
      },
    })
  }

  const handleUpdateSymbolSetting = (key: keyof StylingSettings["symbol"], value: any) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      symbol: {
        ...stylingSettings.symbol,
        [key]: value,
      },
    })
  }

  const handleUpdateChoroplethSetting = (key: keyof StylingSettings["choropleth"], value: any) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      choropleth: {
        ...stylingSettings.choropleth,
        [key]: value,
      },
    })
  }

  const handleTabChange = (value: string) => {
    onUpdateStylingSettings({
      ...stylingSettings,
      activeTab: value as "base" | "symbol" | "choropleth",
    })
  }

  const handleColorClick = (colorName: string, currentColor: string) => {
    setDisplayColorPicker(colorName)
    setActiveColor(currentColor)
  }

  const handleColorClose = () => {
    setDisplayColorPicker(null)
  }

  const handleColorChange = (color: any, colorName: string) => {
    const hex = color.hex
    switch (stylingSettings.activeTab) {
      case "base":
        handleUpdateBaseSetting(colorName as keyof StylingSettings["base"], hex)
        break
      case "symbol":
        handleUpdateSymbolSetting(colorName as keyof StylingSettings["symbol"], hex)
        break
      case "choropleth":
        handleUpdateChoroplethSetting(colorName as keyof StylingSettings["choropleth"], hex)
        break
    }
    setActiveColor(hex)
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
    const updatedStyles = [...stylingSettings.base.savedStyles, newStyle]
    handleUpdateBaseSetting("savedStyles", updatedStyles)
    toast({
      title: "Style Saved!",
      description: `"${styleName}" has been saved as a custom style.`,
    })
    setIsSaveModalOpen(false)
  }

  const handleApplyStyle = (styleId: string) => {
    const styleToApply = stylingSettings.base.savedStyles.find((s) => s.id === styleId)
    if (styleToApply) {
      onUpdateStylingSettings({
        ...stylingSettings,
        base: {
          ...stylingSettings.base,
          ...styleToApply.settings,
        },
      })
      toast({
        title: "Style Applied!",
        description: `"${styleToApply.name}" style has been applied.`,
      })
    }
  }

  const handleDeleteStyleClick = (styleId: string) => {
    setStyleToDelete(styleId)
    setIsConfirmDeleteOpen(true)
  }

  const handleDeleteStyle = () => {
    if (styleToDelete) {
      const updatedStyles = stylingSettings.base.savedStyles.filter((s) => s.id !== styleToDelete)
      handleUpdateBaseSetting("savedStyles", updatedStyles)
      toast({
        title: "Style Deleted!",
        description: "The selected style has been removed.",
        variant: "destructive",
      })
      setStyleToDelete(null)
      setIsConfirmDeleteOpen(false)
    }
  }

  const showSymbolStyling = symbolDataExists && dimensionSettings.symbol.latitude && dimensionSettings.symbol.longitude
  const showChoroplethStyling =
    (choroplethDataExists && dimensionSettings.choropleth.stateColumn) ||
    (customDataExists && dimensionSettings.custom.stateColumn)

  // Determine if the state/province styling panel should be shown
  const showStateProvinceStyling =
    selectedGeography === "usa-states" ||
    selectedGeography === "usa-counties" ||
    selectedGeography === "canada-provinces"

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Map Styling</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={stylingSettings.activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="base">Base Map</TabsTrigger>
            <TabsTrigger value="symbol" disabled={!showSymbolStyling}>
              Symbols
            </TabsTrigger>
            <TabsTrigger value="choropleth" disabled={!showChoroplethStyling}>
              Choropleth
            </TabsTrigger>
          </TabsList>

          <TabsContent value="base" className="space-y-6 pt-4">
            {/* Saved Styles Section */}
            <div className="space-y-4 rounded-md border p-4">
              <h3 className="text-lg font-semibold">Saved Styles</h3>
              <div className="grid grid-cols-2 gap-4">
                {stylingSettings.base.savedStyles.map((style) => (
                  <div key={style.id} className="flex items-center justify-between rounded-md border p-2">
                    <span className="text-sm font-medium">{style.name}</span>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleApplyStyle(style.id)}>
                        Apply
                      </Button>
                      {style.type === "user" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteStyleClick(style.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <Button className="w-full" onClick={() => setIsSaveModalOpen(true)}>
                Save Current Style
              </Button>
            </div>

            {/* Nation/Country Styling Section */}
            <div className="space-y-4 rounded-md border p-4">
              <h3 className="text-lg font-semibold">Nation/Country Styles</h3>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="mapBackgroundColor">Map Background</Label>
                <ColorInput
                  id="mapBackgroundColor"
                  color={stylingSettings.base.mapBackgroundColor}
                  onClick={() => handleColorClick("mapBackgroundColor", stylingSettings.base.mapBackgroundColor)}
                />
                <Label htmlFor="nationFillColor">Nation Fill</Label>
                <ColorInput
                  id="nationFillColor"
                  color={stylingSettings.base.nationFillColor}
                  onClick={() => handleColorClick("nationFillColor", stylingSettings.base.nationFillColor)}
                />
                <Label htmlFor="nationStrokeColor">Nation Stroke</Label>
                <ColorInput
                  id="nationStrokeColor"
                  color={stylingSettings.base.nationStrokeColor}
                  onClick={() => handleColorClick("nationStrokeColor", stylingSettings.base.nationStrokeColor)}
                />
                <Label htmlFor="nationStrokeWidth">Nation Stroke Width</Label>
                <Slider
                  id="nationStrokeWidth"
                  min={0}
                  max={5}
                  step={0.1}
                  value={[stylingSettings.base.nationStrokeWidth]}
                  onValueChange={(val) => handleUpdateBaseSetting("nationStrokeWidth", val[0])}
                />
              </div>
            </div>

            {/* State/Province/County Styling Section - Conditionally rendered */}
            {showStateProvinceStyling && (
              <div className="space-y-4 rounded-md border p-4">
                <h3 className="text-lg font-semibold">State/Province/County Styles</h3>
                <div className="grid grid-cols-2 items-center gap-4">
                  <Label htmlFor="defaultStateFillColor">Default Fill</Label>
                  <ColorInput
                    id="defaultStateFillColor"
                    color={stylingSettings.base.defaultStateFillColor}
                    onClick={() =>
                      handleColorClick("defaultStateFillColor", stylingSettings.base.defaultStateFillColor)
                    }
                  />
                  <Label htmlFor="defaultStateStrokeColor">Default Stroke</Label>
                  <ColorInput
                    id="defaultStateStrokeColor"
                    color={stylingSettings.base.defaultStateStrokeColor}
                    onClick={() =>
                      handleColorClick("defaultStateStrokeColor", stylingSettings.base.defaultStateStrokeColor)
                    }
                  />
                  <Label htmlFor="defaultStateStrokeWidth">Default Stroke Width</Label>
                  <Slider
                    id="defaultStateStrokeWidth"
                    min={0}
                    max={5}
                    step={0.1}
                    value={[stylingSettings.base.defaultStateStrokeWidth]}
                    onValueChange={(val) => handleUpdateBaseSetting("defaultStateStrokeWidth", val[0])}
                  />
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="symbol" className="space-y-6 pt-4">
            <div className="space-y-4 rounded-md border p-4">
              <h3 className="text-lg font-semibold">Symbol Appearance</h3>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="symbolType">Symbol Type</Label>
                <Select
                  value={stylingSettings.symbol.symbolType}
                  onValueChange={(val) =>
                    handleUpdateSymbolSetting("symbolType", val as StylingSettings["symbol"]["symbolType"])
                  }
                >
                  <SelectTrigger id="symbolType">
                    <SelectValue placeholder="Select symbol type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="symbol">Basic Symbol</SelectItem>
                    <SelectItem value="spike">Spike</SelectItem>
                    <SelectItem value="arrow">Arrow</SelectItem>
                  </SelectContent>
                </Select>
                {stylingSettings.symbol.symbolType === "symbol" && (
                  <>
                    <Label htmlFor="symbolShape">Symbol Shape</Label>
                    <Select
                      value={stylingSettings.symbol.symbolShape}
                      onValueChange={(val) =>
                        handleUpdateSymbolSetting("symbolShape", val as StylingSettings["symbol"]["symbolShape"])
                      }
                    >
                      <SelectTrigger id="symbolShape">
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
                  </>
                )}
                {stylingSettings.symbol.symbolType === "symbol" &&
                  stylingSettings.symbol.symbolShape === "custom-svg" && (
                    <>
                      <Label htmlFor="customSvgPath">Custom SVG Path</Label>
                      <Textarea
                        id="customSvgPath"
                        value={stylingSettings.symbol.customSvgPath || ""}
                        onChange={(e) => handleUpdateSymbolSetting("customSvgPath", e.target.value)}
                        placeholder="Enter SVG path data (e.g., M50 0L100 100L0 100Z)"
                        className="col-span-2 min-h-[80px]"
                      />
                    </>
                  )}
                <Label htmlFor="symbolFillColor">Fill Color</Label>
                <ColorInput
                  id="symbolFillColor"
                  color={stylingSettings.symbol.symbolFillColor}
                  onClick={() => handleColorClick("symbolFillColor", stylingSettings.symbol.symbolFillColor)}
                />
                <Label htmlFor="symbolFillTransparency">Fill Transparency</Label>
                <Slider
                  id="symbolFillTransparency"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[stylingSettings.symbol.symbolFillTransparency || 1]}
                  onValueChange={(val) => handleUpdateSymbolSetting("symbolFillTransparency", val[0])}
                />
                <Label htmlFor="symbolStrokeColor">Stroke Color</Label>
                <ColorInput
                  id="symbolStrokeColor"
                  color={stylingSettings.symbol.symbolStrokeColor}
                  onClick={() => handleColorClick("symbolStrokeColor", stylingSettings.symbol.symbolStrokeColor)}
                />
                <Label htmlFor="symbolStrokeTransparency">Stroke Transparency</Label>
                <Slider
                  id="symbolStrokeTransparency"
                  min={0}
                  max={1}
                  step={0.01}
                  value={[stylingSettings.symbol.symbolStrokeTransparency || 1]}
                  onValueChange={(val) => handleUpdateSymbolSetting("symbolStrokeTransparency", val[0])}
                />
                <Label htmlFor="symbolSize">Default Size</Label>
                <Slider
                  id="symbolSize"
                  min={1}
                  max={50}
                  step={1}
                  value={[stylingSettings.symbol.symbolSize]}
                  onValueChange={(val) => handleUpdateSymbolSetting("symbolSize", val[0])}
                />
                <Label htmlFor="symbolStrokeWidth">Stroke Width</Label>
                <Slider
                  id="symbolStrokeWidth"
                  min={0}
                  max={5}
                  step={0.1}
                  value={[stylingSettings.symbol.symbolStrokeWidth]}
                  onValueChange={(val) => handleUpdateSymbolSetting("symbolStrokeWidth", val[0])}
                />
              </div>
            </div>

            <div className="space-y-4 rounded-md border p-4">
              <h3 className="text-lg font-semibold">Symbol Label Styling</h3>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="labelFontFamily">Font Family</Label>
                <Input
                  id="labelFontFamily"
                  value={stylingSettings.symbol.labelFontFamily}
                  onChange={(e) => handleUpdateSymbolSetting("labelFontFamily", e.target.value)}
                />
                <Label htmlFor="labelFontSize">Font Size</Label>
                <Slider
                  id="labelFontSize"
                  min={8}
                  max={32}
                  step={1}
                  value={[stylingSettings.symbol.labelFontSize]}
                  onValueChange={(val) => handleUpdateSymbolSetting("labelFontSize", val[0])}
                />
                <Label htmlFor="labelColor">Font Color</Label>
                <ColorInput
                  id="labelColor"
                  color={stylingSettings.symbol.labelColor}
                  onClick={() => handleColorClick("labelColor", stylingSettings.symbol.labelColor)}
                />
                <Label htmlFor="labelOutlineColor">Outline Color</Label>
                <ColorInput
                  id="labelOutlineColor"
                  color={stylingSettings.symbol.labelOutlineColor}
                  onClick={() => handleColorClick("labelOutlineColor", stylingSettings.symbol.labelOutlineColor)}
                />
                <Label htmlFor="labelOutlineThickness">Outline Thickness</Label>
                <Slider
                  id="labelOutlineThickness"
                  min={0}
                  max={5}
                  step={0.1}
                  value={[stylingSettings.symbol.labelOutlineThickness]}
                  onValueChange={(val) => handleUpdateSymbolSetting("labelOutlineThickness", val[0])}
                />
                <Label htmlFor="labelAlignment">Alignment</Label>
                <Select
                  value={stylingSettings.symbol.labelAlignment}
                  onValueChange={(val) =>
                    handleUpdateSymbolSetting("labelAlignment", val as StylingSettings["symbol"]["labelAlignment"])
                  }
                >
                  <SelectTrigger id="labelAlignment">
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
                <div className="col-span-2 flex justify-start space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="labelBold"
                      checked={stylingSettings.symbol.labelBold}
                      onCheckedChange={(checked) => handleUpdateSymbolSetting("labelBold", checked)}
                    />
                    <Label htmlFor="labelBold">Bold</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="labelItalic"
                      checked={stylingSettings.symbol.labelItalic}
                      onCheckedChange={(checked) => handleUpdateSymbolSetting("labelItalic", checked)}
                    />
                    <Label htmlFor="labelItalic">Italic</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="labelUnderline"
                      checked={stylingSettings.symbol.labelUnderline}
                      onCheckedChange={(checked) => handleUpdateSymbolSetting("labelUnderline", checked)}
                    />
                    <Label htmlFor="labelUnderline">Underline</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="labelStrikethrough"
                      checked={stylingSettings.symbol.labelStrikethrough}
                      onCheckedChange={(checked) => handleUpdateSymbolSetting("labelStrikethrough", checked)}
                    />
                    <Label htmlFor="labelStrikethrough">Strikethrough</Label>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="choropleth" className="space-y-6 pt-4">
            <div className="space-y-4 rounded-md border p-4">
              <h3 className="text-lg font-semibold">Choropleth Label Styling</h3>
              <div className="grid grid-cols-2 items-center gap-4">
                <Label htmlFor="choroplethLabelFontFamily">Font Family</Label>
                <Input
                  id="choroplethLabelFontFamily"
                  value={stylingSettings.choropleth.labelFontFamily}
                  onChange={(e) => handleUpdateChoroplethSetting("labelFontFamily", e.target.value)}
                />
                <Label htmlFor="choroplethLabelFontSize">Font Size</Label>
                <Slider
                  id="choroplethLabelFontSize"
                  min={8}
                  max={32}
                  step={1}
                  value={[stylingSettings.choropleth.labelFontSize]}
                  onValueChange={(val) => handleUpdateChoroplethSetting("labelFontSize", val[0])}
                />
                <Label htmlFor="choroplethLabelColor">Font Color</Label>
                <ColorInput
                  id="choroplethLabelColor"
                  color={stylingSettings.choropleth.labelColor}
                  onClick={() => handleColorClick("labelColor", stylingSettings.choropleth.labelColor)}
                />
                <Label htmlFor="choroplethLabelOutlineColor">Outline Color</Label>
                <ColorInput
                  id="choroplethLabelOutlineColor"
                  color={stylingSettings.choropleth.labelOutlineColor}
                  onClick={() => handleColorClick("labelOutlineColor", stylingSettings.choropleth.labelOutlineColor)}
                />
                <Label htmlFor="choroplethLabelOutlineThickness">Outline Thickness</Label>
                <Slider
                  id="choroplethLabelOutlineThickness"
                  min={0}
                  max={5}
                  step={0.1}
                  value={[stylingSettings.choropleth.labelOutlineThickness]}
                  onValueChange={(val) => handleUpdateChoroplethSetting("labelOutlineThickness", val[0])}
                />
                <div className="col-span-2 flex justify-start space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="choroplethLabelBold"
                      checked={stylingSettings.choropleth.labelBold}
                      onCheckedChange={(checked) => handleUpdateChoroplethSetting("labelBold", checked)}
                    />
                    <Label htmlFor="choroplethLabelBold">Bold</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="choroplethLabelItalic"
                      checked={stylingSettings.choropleth.labelItalic}
                      onCheckedChange={(checked) => handleUpdateChoroplethSetting("labelItalic", checked)}
                    />
                    <Label htmlFor="choroplethLabelItalic">Italic</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="choroplethLabelUnderline"
                      checked={stylingSettings.choropleth.labelUnderline}
                      onCheckedChange={(checked) => handleUpdateChoroplethSetting("labelUnderline", checked)}
                    />
                    <Label htmlFor="choroplethLabelUnderline">Underline</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="choroplethLabelStrikethrough"
                      checked={stylingSettings.choropleth.labelStrikethrough}
                      onCheckedChange={(checked) => handleUpdateChoroplethSetting("labelStrikethrough", checked)}
                    />
                    <Label htmlFor="choroplethLabelStrikethrough">Strikethrough</Label>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {displayColorPicker && (
          <div style={{ position: "absolute", zIndex: 2 }}>
            <div
              style={{ position: "fixed", top: "0px", right: "0px", bottom: "0px", left: "0px" }}
              onClick={handleColorClose}
            />
            <ChromePicker color={activeColor} onChange={(color) => handleColorChange(color, displayColorPicker)} />
          </div>
        )}

        <AlertDialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this custom style? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteStyle}>Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <SaveSchemeModal
          isOpen={isSaveModalOpen}
          onClose={() => setIsSaveModalOpen(false)}
          onSave={handleSaveStyle}
          existingNames={stylingSettings.base.savedStyles.map((s) => s.name)}
        />
      </CardContent>
    </Card>
  )
}
