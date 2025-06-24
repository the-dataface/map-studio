"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDown, ChevronUp } from "lucide-react"

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
  const [isExpanded, setIsExpanded] = useState(true)

  const filteredGeographies = geographies.filter((g) => g.label.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <Card className="shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden">
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out py-4 px-6 rounded-t-xl relative"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-gray-900 dark:text-white transition-colors duration-200">Map and projection</CardTitle>
          </div>
          <div className="flex items-center gap-2">            
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </CardHeader>
      <CardContent className={cn("transition-all duration-200", isExpanded ? "pb-6" : "pb-0 h-0 overflow-hidden")}>
        <div>
              <Label htmlFor="geography-search" className="mb-2 block">
                Select geography
              </Label>
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
                Select projection
              </Label>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                <ToggleGroup
                  type="single"
                  value={projection}
                  onValueChange={(value: "albersUsa" | "mercator" | "equalEarth") => {
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
                    >
                      {p.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </ScrollArea>
            </div>
      </CardContent>
    </Card>
  )
}
