"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
// Removed useToast import as it's no longer needed here

interface MapProjectionSelectionProps {
  geography: "usa" | "world"
  projection: "albersUsa" | "mercator" | "equalEarth"
  onGeographyChange: (geography: "usa" | "world") => void
  onProjectionChange: (projection: "albersUsa" | "mercator" | "equalEarth") => void
  columns: string[]
  sampleRows: (string | number)[][]
  // Removed hasMadeInitialSuggestion and setHasMadeInitialSuggestion props
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
  columns, // Still passed, but not used for inference in this component
  sampleRows, // Still passed, but not used for inference in this component
}: MapProjectionSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("")
  // Removed useToast hook

  const filteredGeographies = geographies.filter((g) => g.label.toLowerCase().includes(searchQuery.toLowerCase()))

  // Removed inferGeographyAndProjection useCallback and its useEffect
  // The inference logic is now handled in app/page.tsx

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
