"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox" // Import Checkbox
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip" // Import Tooltip components

interface MapProjectionSelectionProps {
  geography: "usa-states" | "usa-counties" | "usa-nation" | "canada-provinces" | "canada-nation" | "world"
  projection: "albersUsa" | "mercator" | "equalEarth" | "albers" // Added "albers"
  onGeographyChange: (
    geography: "usa-states" | "usa-counties" | "usa-nation" | "canada-provinces" | "canada-nation" | "world",
  ) => void
  onProjectionChange: (projection: "albersUsa" | "mercator" | "equalEarth" | "albers") => void // Added "albers"
  columns: string[]
  sampleRows: (string | number)[][]
  clipToCountry: boolean // New prop
  onClipToCountryChange: (clip: boolean) => void // New prop
}

const geographies = [
  { value: "canada-nation", label: "Canada" },
  { value: "canada-provinces", label: "Canada (provinces)" },
  { value: "usa-nation", label: "United States" },
  { value: "usa-states", label: "United States (states)" },
  { value: "usa-counties", label: "United States (counties)" },
  { value: "world", label: "World" },
]

const projections = [
  { value: "albersUsa", label: "Albers USA" },
  { value: "albers", label: "Albers" }, // Added Albers
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
  clipToCountry, // Destructure new prop
  onClipToCountryChange, // Destructure new prop
}: MapProjectionSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isExpanded, setIsExpanded] = useState(true)

  const filteredGeographies = geographies.filter((g) => g.label.toLowerCase().includes(searchQuery.toLowerCase()))

  // Determine if Albers projections should be enabled
  const isUSGeography = geography === "usa-states" || geography === "usa-counties" || geography === "usa-nation"

  // Determine if clipping should be enabled
  const isSingleCountryGeography = geography === "usa-nation" || geography === "canada-nation" || geography === "world"
  const isProjectionClippable = projection !== "albersUsa" // Albers USA is already clipped

  const isClipCheckboxDisabled = !isSingleCountryGeography || !isProjectionClippable

  const clipTooltipContent = isClipCheckboxDisabled
    ? "Clipping is only available for single-country geographies (USA, Canada, World) and non-Albers USA projections."
    : "Clip the map to the boundaries of the selected country."

  return (
    <Card className="shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden">
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out py-5 px-6 rounded-t-xl relative"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-gray-900 dark:text-white transition-colors duration-200">
              Geography and projection
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("transition-all duration-200", isExpanded ? "pb-6 pt-2" : "pb-0 h-0 overflow-hidden")}>
        <div className="flex items-center gap-2">
          <div className="flex-grow">
            <Label htmlFor="geography-search" className="mb-2 block">
              Select geography
            </Label>
            <ScrollArea className="h-[200px] w-full rounded-md border p-2">
              <ToggleGroup
                type="single"
                value={geography}
                onValueChange={(
                  value: "usa-states" | "usa-counties" | "usa-nation" | "canada-provinces" | "canada-nation" | "world",
                ) => {
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
          <div className="flex-grow">
            <Label htmlFor="projection-select" className="mb-2 block">
              Select projection
            </Label>
            <ScrollArea className="h-[200px] w-full rounded-md border p-2">
              <ToggleGroup
                type="single"
                value={projection}
                onValueChange={(value: "albersUsa" | "mercator" | "equalEarth" | "albers") => {
                  if (value) onProjectionChange(value)
                }}
                orientation="vertical"
                className="flex flex-col items-start"
              >
                {projections.map((p) => (
                  <ToggleGroupItem
                    key={p.value}
                    value={p.value}
                    aria-label={`Select ${p.label}`}
                    className="w-full justify-start"
                    disabled={(p.value === "albersUsa" || p.value === "albers") && !isUSGeography}
                  >
                    {p.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </ScrollArea>
          </div>
        </div>
        {/* Clip to Country Checkbox with Tooltip */}
        {/*
        <div className="flex items-center space-x-2 mt-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Checkbox
                    id="clip-to-country"
                    checked={clipToCountry}
                    onCheckedChange={onClipToCountryChange}
                    disabled={isClipCheckboxDisabled}
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{clipTooltipContent}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Label htmlFor="clip-to-country">Clip map to selected country</Label>
        </div>
        */}
      </CardContent>
    </Card>
  )
}
