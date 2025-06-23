"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ChevronDownIcon } from "lucide-react"

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
  const [isCollapsed, setIsCollapsed] = useState(false)

  const filteredGeographies = geographies.filter((g) => g.label.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <Card className="w-full rounded-xl">
      {" "}
      {/* Added rounded-xl to the Card */}
      <Collapsible open={!isCollapsed} onOpenChange={setIsCollapsed}>
        <CollapsibleTrigger className="w-full flex justify-between items-center px-6 py-5 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out rounded-t-xl">
          <div className="text-2xl font-semibold text-gray-900 dark:text-white">Map and projection</div>{" "}
          {/* Reverted text size and weight */}
          <ChevronDownIcon
            className={`h-4 w-4 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${isCollapsed ? "" : "rotate-180"}`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="p-6 pt-0">
            {" "}
            {/* Reverted CardContent padding to standard */}
            {/* Geography Selection */}
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
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
