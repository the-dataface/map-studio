"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { Input } from "./ui/input"
import type { ColumnType, DataRow, GeocodedRow } from "@/app/page" // Import ColumnType and DataRow

interface DimensionMappingProps {
  mapType: "symbol" | "choropleth" | "custom"
  symbolDataExists: boolean
  choroplethDataExists: boolean
  customDataExists: boolean
  columnTypes: ColumnType
  dimensionSettings: any
  onUpdateSettings: (newSettings: any) => void
  columnFormats: { [key: string]: string }
  // Data props for inferring value range for scales
  symbolParsedData: DataRow[]
  symbolGeocodedData: GeocodedRow[]
  symbolColumns: string[]
  choroplethParsedData: DataRow[]
  choroplethGeocodedData: GeocodedRow[]
  choroplethColumns: string[]
  selectedGeography: "usa-states" | "usa-counties" | "usa-nation" | "canada-provinces" | "canada-nation" | "world" // Add selectedGeography prop
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
  selectedGeography, // Destructure selectedGeography
}: DimensionMappingProps) {
  const handleSymbolSettingChange = (key: string, value: any) => {
    const newSettings = {
      ...dimensionSettings,
      symbol: {
        ...dimensionSettings.symbol,
        [key]: value,
      },
    }
    onUpdateSettings(newSettings)
  }

  const handleChoroplethSettingChange = (key: string, value: any) => {
    const newSettings = {
      ...dimensionSettings,
      choropleth: {
        ...dimensionSettings.choropleth,
        [key]: value,
      },
    }
    onUpdateSettings(newSettings)
  }

  const handleCustomSettingChange = (key: string, value: any) => {
    const newSettings = {
      ...dimensionSettings,
      custom: {
        ...dimensionSettings.custom,
        [key]: value,
      },
    }
    onUpdateSettings(newSettings)
  }

  const getSymbolColumns = () => {
    return symbolColumns
  }

  const getChoroplethColumns = () => {
    return choroplethColumns
  }

  const getGeographyLabel = (geography: string) => {
    if (geography === "usa-counties") {
      return "County"
    }
    if (geography === "canada-provinces") {
      return "Province"
    }
    return "State"
  }

  const currentGeographyLabel = getGeographyLabel(selectedGeography)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dimension Mapping</CardTitle>
        <CardDescription>Assign data columns to visual properties of the map.</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={mapType} className="space-y-4">
          <TabsList>
            <TabsTrigger value="symbol" disabled={!symbolDataExists}>
              Symbol Map
            </TabsTrigger>
            <TabsTrigger value="choropleth" disabled={!choroplethDataExists}>
              Choropleth Map
            </TabsTrigger>
            <TabsTrigger value="custom" disabled={!customDataExists}>
              Custom Map
            </TabsTrigger>
          </TabsList>
          <TabContent value="symbol" className={cn(mapType !== "symbol" && "hidden")}>
            <div className="grid gap-4">
              {/* Latitude column */}
              <div className="grid gap-2">
                <Label htmlFor="symbol-latitude-column">Latitude Column</Label>
                <Select
                  value={dimensionSettings.symbol.latitudeColumn}
                  onValueChange={(value) => handleSymbolSettingChange("latitudeColumn", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a latitude column" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSymbolColumns().length === 0 ? (
                      <SelectItem value="" disabled>
                        No columns available
                      </SelectItem>
                    ) : (
                      getSymbolColumns().map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Longitude column */}
              <div className="grid gap-2">
                <Label htmlFor="symbol-longitude-column">Longitude Column</Label>
                <Select
                  value={dimensionSettings.symbol.longitudeColumn}
                  onValueChange={(value) => handleSymbolSettingChange("longitudeColumn", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a longitude column" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSymbolColumns().length === 0 ? (
                      <SelectItem value="" disabled>
                        No columns available
                      </SelectItem>
                    ) : (
                      getSymbolColumns().map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Value column */}
              <div className="grid gap-2">
                <Label htmlFor="symbol-value-column">Value Column</Label>
                <Select
                  value={dimensionSettings.symbol.valueColumn}
                  onValueChange={(value) => handleSymbolSettingChange("valueColumn", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a value column" />
                  </SelectTrigger>
                  <SelectContent>
                    {getSymbolColumns().length === 0 ? (
                      <SelectItem value="" disabled>
                        No columns available
                      </SelectItem>
                    ) : (
                      getSymbolColumns().map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Radius settings */}
              <div className="grid gap-2">
                <Label>Radius Settings</Label>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="symbol-min-radius">Min Radius</Label>
                  <Input
                    type="number"
                    id="symbol-min-radius"
                    value={dimensionSettings.symbol.minRadius}
                    onChange={(e) => handleSymbolSettingChange("minRadius", Number.parseInt(e.target.value))}
                  />
                  <Label htmlFor="symbol-max-radius">Max Radius</Label>
                  <Input
                    type="number"
                    id="symbol-max-radius"
                    value={dimensionSettings.symbol.maxRadius}
                    onChange={(e) => handleSymbolSettingChange("maxRadius", Number.parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Color settings */}
              <div className="grid gap-2">
                <Label>Color Settings</Label>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="symbol-min-color">Min Color</Label>
                  <Input
                    type="color"
                    id="symbol-min-color"
                    value={dimensionSettings.symbol.minColor}
                    onChange={(e) => handleSymbolSettingChange("minColor", e.target.value)}
                  />
                  <Label htmlFor="symbol-max-color">Max Color</Label>
                  <Input
                    type="color"
                    id="symbol-max-color"
                    value={dimensionSettings.symbol.maxColor}
                    onChange={(e) => handleSymbolSettingChange("maxColor", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </TabContent>

          <TabContent value="choropleth" className={cn(mapType !== "choropleth" && "hidden")}>
            <div className="grid gap-4">
              {/* State/Province/County column */}
              <div className="grid gap-2">
                <Label htmlFor="choropleth-state-column">
                  {currentGeographyLabel} Column
                  <span className="ml-1 text-xs text-gray-500">(e.g., FIPS, State Name, Province Name)</span>
                </Label>
                <Select
                  value={dimensionSettings.choropleth.stateColumn}
                  onValueChange={(value) => handleChoroplethSettingChange("stateColumn", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Select a ${currentGeographyLabel} column`} />
                  </SelectTrigger>
                  <SelectContent>
                    {getChoroplethColumns().length === 0 ? (
                      <SelectItem value="" disabled>
                        No columns available
                      </SelectItem>
                    ) : (
                      getChoroplethColumns().map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              {/* Value column */}
              <div className="grid gap-2">
                <Label htmlFor="choropleth-value-column">Value Column</Label>
                <Select
                  value={dimensionSettings.choropleth.valueColumn}
                  onValueChange={(value) => handleChoroplethSettingChange("valueColumn", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a value column" />
                  </SelectTrigger>
                  <SelectContent>
                    {getChoroplethColumns().length === 0 ? (
                      <SelectItem value="" disabled>
                        No columns available
                      </SelectItem>
                    ) : (
                      getChoroplethColumns().map((col) => (
                        <SelectItem key={col} value={col}>
                          {col}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* Color settings */}
              <div className="grid gap-2">
                <Label>Color Settings</Label>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="choropleth-min-color">Min Color</Label>
                  <Input
                    type="color"
                    id="choropleth-min-color"
                    value={dimensionSettings.choropleth.minColor}
                    onChange={(e) => handleChoroplethSettingChange("minColor", e.target.value)}
                  />
                  <Label htmlFor="choropleth-max-color">Max Color</Label>
                  <Input
                    type="color"
                    id="choropleth-max-color"
                    value={dimensionSettings.choropleth.maxColor}
                    onChange={(e) => handleChoroplethSettingChange("maxColor", e.target.value)}
                  />
                </div>
              </div>
            </div>
          </TabContent>

          <TabContent value="custom" className={cn(mapType !== "custom" && "hidden")}>
            {/* ... existing Custom Map Mapping ... */}
            <div className="grid gap-2">
              <Label htmlFor="custom-state-column">
                {currentGeographyLabel} Column{" "}
                <span className="ml-1 text-xs text-gray-500">(e.g., FIPS, State Name, Province Name)</span>
              </Label>
              <Select
                value={dimensionSettings.custom.stateColumn}
                onValueChange={(value) => handleCustomSettingChange("stateColumn", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={`Select a ${currentGeographyLabel} column`} />
                </SelectTrigger>
                <SelectContent>
                  {getChoroplethColumns().length === 0 ? (
                    <SelectItem value="" disabled>
                      No columns available
                    </SelectItem>
                  ) : (
                    getChoroplethColumns().map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            {/* Value column */}
            <div className="grid gap-2">
              <Label htmlFor="custom-value-column">Value Column</Label>
              <Select
                value={dimensionSettings.custom.valueColumn}
                onValueChange={(value) => handleCustomSettingChange("valueColumn", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a value column" />
                </SelectTrigger>
                <SelectContent>
                  {getChoroplethColumns().length === 0 ? (
                    <SelectItem value="" disabled>
                      No columns available
                    </SelectItem>
                  ) : (
                    getChoroplethColumns().map((col) => (
                      <SelectItem key={col} value={col}>
                        {col}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Color settings */}
            <div className="grid gap-2">
              <Label>Color Settings</Label>
              <div className="flex items-center space-x-2">
                <Label htmlFor="custom-min-color">Min Color</Label>
                <Input
                  type="color"
                  id="custom-min-color"
                  value={dimensionSettings.custom.minColor}
                  onChange={(e) => handleCustomSettingChange("minColor", e.target.value)}
                />
                <Label htmlFor="custom-max-color">Max Color</Label>
                <Input
                  type="color"
                  id="custom-max-color"
                  value={dimensionSettings.custom.maxColor}
                  onChange={(e) => handleCustomSettingChange("maxColor", e.target.value)}
                />
              </div>
            </div>
          </TabContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
