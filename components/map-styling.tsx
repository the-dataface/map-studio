"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { SimpleColorPicker } from "./simple-color-picker"
import type { StylingSettings } from "@/app/page" // Assuming StylingSettings is exported from app/page.tsx
import type { DimensionsSettings } from "@/app/page" // Assuming DimensionsSettings is exported from app/page.tsx

interface MapStylingProps {
  stylingSettings: StylingSettings
  onUpdateStylingSettings: (newSettings: StylingSettings) => void
  dimensionSettings: DimensionsSettings // Corrected type name if needed
  symbolDataExists: boolean
  choroplethDataExists: boolean
  customDataExists: boolean
  selectedGeography: "usa-states" | "usa-counties" | "usa-nation" | "canada-provinces" | "canada-nation" | "world" // Add selectedGeography prop
}

export function MapStyling({
  stylingSettings,
  onUpdateStylingSettings,
  dimensionSettings,
  symbolDataExists,
  choroplethDataExists,
  customDataExists,
  selectedGeography, // Destructure selectedGeography
}: MapStylingProps) {
  const handleBaseSettingChange = (key: keyof StylingSettings["base"], value: any) => {
    const newBaseSettings = { ...stylingSettings.base, [key]: value }
    onUpdateStylingSettings({
      ...stylingSettings,
      base: newBaseSettings,
    })
  }

  const handleSymbolSettingChange = (key: keyof StylingSettings["symbol"], value: any) => {
    const newSymbolSettings = { ...stylingSettings.symbol, [key]: value }
    onUpdateStylingSettings({
      ...stylingSettings,
      symbol: newSymbolSettings,
    })
  }

  const handleChoroplethSettingChange = (key: keyof StylingSettings["choropleth"], value: any) => {
    const newChoroplethSettings = {
      ...stylingSettings.choropleth,
      [key]: value,
    }
    onUpdateStylingSettings({
      ...stylingSettings,
      choropleth: newChoroplethSettings,
    })
  }

  const handleTabChange = (value: "base" | "symbol" | "choropleth") => {
    onUpdateStylingSettings({ ...stylingSettings, activeTab: value })
  }

  const getGeographyPluralLabel = (geography: string) => {
    if (geography === "usa-counties") {
      return "Counties"
    }
    if (geography === "canada-provinces") {
      return "Provinces"
    }
    return "States"
  }

  const currentGeographyPluralLabel = getGeographyPluralLabel(selectedGeography)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Map Styling</CardTitle>
        <CardDescription>Customize the appearance of your map.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={stylingSettings.activeTab} onValueChange={(value) => handleTabChange(value as any)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="base">Base</TabsTrigger>
            <TabsTrigger value="symbol" disabled={!symbolDataExists && !customDataExists}>
              Symbol
            </TabsTrigger>
            <TabsTrigger value="choropleth" disabled={!choroplethDataExists && !customDataExists}>
              Choropleth
            </TabsTrigger>
          </TabsList>
          <TabContent value="base" className={cn(stylingSettings.activeTab !== "base" && "hidden")}>
            <div className="space-y-6 pt-4">
              <div className="grid gap-4">
                <h3 className="font-semibold text-lg">Base Map Elements</h3>
                {/* Map Background Color */}
                <div className="grid gap-2">
                  <Label htmlFor="map-background-color">Map Background Color</Label>
                  <SimpleColorPicker
                    id="map-background-color"
                    color={stylingSettings.base.mapBackgroundColor}
                    onChange={(color) => handleBaseSettingChange("mapBackgroundColor", color)}
                  />
                </div>
                {/* Nation Styling */}
                <h4 className="font-medium text-md pt-2">Nation Styling</h4>
                <p className="text-sm text-gray-500">Applies to all nation boundaries.</p>
                <div className="grid gap-2">
                  <Label htmlFor="nation-fill-color">Nation Fill Color</Label>
                  <SimpleColorPicker
                    id="nation-fill-color"
                    color={stylingSettings.base.nationFillColor}
                    onChange={(color) => handleBaseSettingChange("nationFillColor", color)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nation-stroke-color">Nation Stroke Color</Label>
                  <SimpleColorPicker
                    id="nation-stroke-color"
                    color={stylingSettings.base.nationStrokeColor}
                    onChange={(color) => handleBaseSettingChange("nationStrokeColor", color)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="nation-stroke-width">Nation Stroke Width</Label>
                  <Slider
                    id="nation-stroke-width"
                    min={0}
                    max={5}
                    step={0.1}
                    value={[stylingSettings.base.nationStrokeWidth]}
                    onValueChange={([value]) => handleBaseSettingChange("nationStrokeWidth", value)}
                  />
                </div>

                {/* State/Province/County Styling */}
                <h4 className="font-medium text-md pt-2">{currentGeographyPluralLabel} Styling</h4>
                <p className="text-sm text-gray-500">
                  Applies to individual {currentGeographyPluralLabel.toLowerCase()} boundaries when not
                  choropleth-colored.
                </p>
                <div className="grid gap-2">
                  <Label htmlFor="default-state-fill-color">
                    Default {currentGeographyPluralLabel.slice(0, -1)} Fill Color
                  </Label>
                  <SimpleColorPicker
                    id="default-state-fill-color"
                    color={stylingSettings.base.defaultStateFillColor}
                    onChange={(color) => handleBaseSettingChange("defaultStateFillColor", color)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="default-state-stroke-color">
                    Default {currentGeographyPluralLabel.slice(0, -1)} Stroke Color
                  </Label>
                  <SimpleColorPicker
                    id="default-state-stroke-color"
                    color={stylingSettings.base.defaultStateStrokeColor}
                    onChange={(color) => handleBaseSettingChange("defaultStateStrokeColor", color)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="default-state-stroke-width">
                    Default {currentGeographyPluralLabel.slice(0, -1)} Stroke Width
                  </Label>
                  <Slider
                    id="default-state-stroke-width"
                    min={0}
                    max={5}
                    step={0.1}
                    value={[stylingSettings.base.defaultStateStrokeWidth]}
                    onValueChange={([value]) => handleBaseSettingChange("defaultStateStrokeWidth", value)}
                  />
                </div>

                {/* ... rest of base settings ... */}
              </div>
              {/* ... rest of MapStyling component ... */}
            </div>
          </TabContent>
          <TabContent value="symbol" className={cn(stylingSettings.activeTab !== "symbol" && "hidden")}>
            <div className="space-y-6 pt-4">
              <div className="grid gap-4">
                <h3 className="font-semibold text-lg">Symbol Styling</h3>
                {/* Symbol Radius */}
                <div className="grid gap-2">
                  <Label htmlFor="symbol-radius">Symbol Radius</Label>
                  <Slider
                    id="symbol-radius"
                    min={1}
                    max={20}
                    step={0.5}
                    value={[stylingSettings.symbol.symbolRadius]}
                    onValueChange={([value]) => handleSymbolSettingChange("symbolRadius", value)}
                  />
                </div>
                {/* Symbol Fill Color */}
                <div className="grid gap-2">
                  <Label htmlFor="symbol-fill-color">Symbol Fill Color</Label>
                  <SimpleColorPicker
                    id="symbol-fill-color"
                    color={stylingSettings.symbol.symbolFillColor}
                    onChange={(color) => handleSymbolSettingChange("symbolFillColor", color)}
                  />
                </div>
                {/* Symbol Stroke Color */}
                <div className="grid gap-2">
                  <Label htmlFor="symbol-stroke-color">Symbol Stroke Color</Label>
                  <SimpleColorPicker
                    id="symbol-stroke-color"
                    color={stylingSettings.symbol.symbolStrokeColor}
                    onChange={(color) => handleSymbolSettingChange("symbolStrokeColor", color)}
                  />
                </div>
                {/* Symbol Stroke Width */}
                <div className="grid gap-2">
                  <Label htmlFor="symbol-stroke-width">Symbol Stroke Width</Label>
                  <Slider
                    id="symbol-stroke-width"
                    min={0}
                    max={5}
                    step={0.1}
                    value={[stylingSettings.symbol.symbolStrokeWidth]}
                    onValueChange={([value]) => handleSymbolSettingChange("symbolStrokeWidth", value)}
                  />
                </div>
              </div>
            </div>
          </TabContent>
          <TabContent value="choropleth" className={cn(stylingSettings.activeTab !== "choropleth" && "hidden")}>
            <div className="space-y-6 pt-4">
              <div className="grid gap-4">
                <h3 className="font-semibold text-lg">Choropleth Styling</h3>
                {/* Choropleth Color Scheme */}
                <div className="grid gap-2">
                  <Label htmlFor="choropleth-color-scheme">Choropleth Color Scheme</Label>
                  {/*  Replace with a proper color scheme selector component */}
                  <select
                    id="choropleth-color-scheme"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={stylingSettings.choropleth.choroplethColorScheme}
                    onChange={(e) => handleChoroplethSettingChange("choroplethColorScheme", e.target.value)}
                  >
                    <option value="viridis">Viridis</option>
                    <option value="magma">Magma</option>
                    <option value="inferno">Inferno</option>
                    <option value="plasma">Plasma</option>
                    <option value="cividis">Cividis</option>
                  </select>
                </div>
                {/* Choropleth Missing Color */}
                <div className="grid gap-2">
                  <Label htmlFor="choropleth-missing-color">Choropleth Missing Color</Label>
                  <SimpleColorPicker
                    id="choropleth-missing-color"
                    color={stylingSettings.choropleth.choroplethMissingColor}
                    onChange={(color) => handleChoroplethSettingChange("choroplethMissingColor", color)}
                  />
                </div>
              </div>
            </div>
          </TabContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
