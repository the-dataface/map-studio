"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"

interface MapProjectionSelectionProps {
  geography: "usa" | "world"
  projection: "albersUsa" | "mercator" | "equalEarth"
  onGeographyChange: (geography: "usa" | "world") => void
  onProjectionChange: (projection: "albersUsa" | "mercator" | "equalEarth") => void
  columns: string[]
  sampleRows: (string | number)[][]
}

const geographies = [
  { value: "usa", label: "United States" },
  { value: "world", label: "World" },
  // Add more countries/regions here as TopoJSON data becomes available
  // { value: "canada", label: "Canada" },
  // { value: "mexico", label: "Mexico" },
]

const projections = [
  { value: "albersUsa", label: "Albers USA" },
  { value: "mercator", label: "Mercator" },
  { value: "equalEarth", label: "Equal Earth" },
]

export function MapProjectionSelection({
  geography,
  projection,
  onGeographyChange,
  onProjectionChange,
  columns,
  sampleRows,
}: MapProjectionSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { toast } = useToast()

  const filteredGeographies = geographies.filter((g) => g.label.toLowerCase().includes(searchQuery.toLowerCase()))

  const inferGeographyAndProjection = useCallback(() => {
    let inferredGeo: "usa" | "world" = "usa"
    let inferredProj: "albersUsa" | "mercator" | "equalEarth" = "albersUsa"
    let suggestionMade = false

    // Check columns for country/state names
    const lowerCaseColumns = columns.map((col) => col.toLowerCase())
    const hasCountryColumn = lowerCaseColumns.some((col) => col.includes("country") || col.includes("nation"))
    const hasStateColumn = lowerCaseColumns.some((col) => col.includes("state") || col.includes("province"))
    const hasLatLon =
      lowerCaseColumns.some((col) => col.includes("lat")) && lowerCaseColumns.some((col) => col.includes("lon"))

    // Check sample data for common country/state names
    const sampleDataString = JSON.stringify(sampleRows).toLowerCase()
    const containsUsStates =
      sampleDataString.includes("california") ||
      sampleDataString.includes("texas") ||
      sampleDataString.includes("new york") ||
      sampleDataString.includes("florida")
    const containsWorldCountries =
      sampleDataString.includes("canada") ||
      sampleDataString.includes("china") ||
      sampleDataString.includes("india") ||
      sampleDataString.includes("brazil")

    if (hasCountryColumn || containsWorldCountries) {
      inferredGeo = "world"
      inferredProj = "equalEarth" // Equal Earth is good for world maps
      suggestionMade = true
    } else if (hasStateColumn || containsUsStates) {
      inferredGeo = "usa"
      inferredProj = "albersUsa" // Albers USA is standard for US
      suggestionMade = true
    } else if (hasLatLon) {
      // If only lat/lon, world map with Mercator is a reasonable default
      inferredGeo = "world"
      inferredProj = "mercator"
      suggestionMade = true
    }

    if (suggestionMade && (inferredGeo !== geography || inferredProj !== projection)) {
      onGeographyChange(inferredGeo)
      onProjectionChange(inferredProj)
      toast({
        title: "Map Settings Suggested",
        description: `Based on your data, we've suggested "${geographies.find((g) => g.value === inferredGeo)?.label}" geography and "${projections.find((p) => p.value === inferredProj)?.label}" projection.`,
        duration: 3000,
      })
    }
  }, [columns, sampleRows, geography, projection, onGeographyChange, onProjectionChange, toast])

  useEffect(() => {
    inferGeographyAndProjection()
  }, [inferGeographyAndProjection])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Map & Projection</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Geography Selection */}
        <div>
          <Label htmlFor="geography-search" className="mb-2 block">
            Select Geography
          </Label>
          <Input
            id="geography-search"
            placeholder="Search geographies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-3"
          />
          <ScrollArea className="h-[200px] w-full rounded-md border p-4">
            <ToggleGroup
              type="single"
              value={geography}
              onValueChange={(value: "usa" | "world") => {
                if (value) onGeographyChange(value)
              }}
              orientation="vertical"
              className="flex flex-col items-start"
            >
              {filteredGeographies.map((g) => (
                <ToggleGroupItem
                  key={g.value}
                  value={g.value}
                  aria-label={`Select ${g.label}`}
                  className="w-full justify-start"
                >
                  {g.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <p className="text-sm text-muted-foreground mt-2">
              Note: Only US and World maps are fully supported with data.
            </p>
          </ScrollArea>
        </div>

        {/* Projection Selection */}
        <div>
          <Label htmlFor="projection-select" className="mb-2 block">
            Select Projection
          </Label>
          <Select
            value={projection}
            onValueChange={(value: "albersUsa" | "mercator" | "equalEarth") => {
              if (value) onProjectionChange(value)
            }}
          >
            <SelectTrigger id="projection-select">
              <SelectValue placeholder="Select a projection" />
            </SelectTrigger>
            <SelectContent>
              {projections.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
