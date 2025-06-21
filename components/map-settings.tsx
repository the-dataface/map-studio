"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

interface MapSettingsProps {
  isExpanded: boolean
  setIsExpanded: (v: boolean) => void
  selectedCountry: string
  setSelectedCountry: (v: string) => void
  selectedProjection: string
  setSelectedProjection: (v: string) => void
  columns: string[]
  parsedData: Array<Record<string, any>>
}

type CountryOption = { id: string; label: string }

/**
 * A small searchable list of available regions.
 * Currently ships with just “World” and “United States” but can be expanded.
 */
const COUNTRY_OPTIONS: CountryOption[] = [
  { id: "world", label: "World" },
  { id: "united-states", label: "United States" },
]

// Projection choices keyed by country code.
const PROJECTION_OPTIONS = {
  // Default / world
  default: [
    { id: "geoMercator", label: "Mercator" },
    { id: "geoEqualEarth", label: "Equal-Earth" },
  ],
  // United-States-specific
  "united-states": [
    { id: "geoAlbersUsa", label: "Albers USA" },
    { id: "geoMercator", label: "Mercator" },
  ],
} as const

export function MapSettings({
  isExpanded,
  setIsExpanded,
  selectedCountry,
  setSelectedCountry,
  selectedProjection,
  setSelectedProjection,
  columns,
  parsedData,
}: MapSettingsProps) {
  /* ------------------------------------------------------------------ */
  /* Intelligent default detection ­                                     */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    // If the user hasn’t touched anything, try to infer a sensible default.
    // 1.  If there’s a column literally called “state”, or the first few values
    //     look like U.S. state abbreviations, switch to the U.S. map.
    const userHasChosen = selectedCountry !== "united-states" && selectedCountry !== "world"
    if (userHasChosen) return

    const lowerCols = columns.map((c) => c.toLowerCase())
    if (lowerCols.includes("state")) {
      setSelectedCountry("united-states")
      setSelectedProjection("geoAlbersUsa")
      return
    }

    // Simple heuristic: two-letter uppercase strings seen in first 100 rows
    const firstRows = parsedData.slice(0, 100)
    const maybeState = firstRows.some((row) =>
      Object.values(row).some((val) => typeof val === "string" && /^[A-Z]{2}$/.test(val as string)),
    )
    if (maybeState) {
      setSelectedCountry("united-states")
      setSelectedProjection("geoAlbersUsa")
    }
  }, [columns, parsedData, selectedCountry, setSelectedCountry, setSelectedProjection])

  /* ------------------------------------------------------------------ */
  /* Search / filtering for the country list                             */
  /* ------------------------------------------------------------------ */
  const [search, setSearch] = useState("")
  const visibleCountries = useMemo(() => {
    if (!search.trim()) return COUNTRY_OPTIONS
    const s = search.toLowerCase()
    return COUNTRY_OPTIONS.filter((c) => c.label.toLowerCase().includes(s))
  }, [search])

  /* ------------------------------------------------------------------ */
  /* UI                                                                  */
  /* ------------------------------------------------------------------ */
  return (
    <Card className={cn({ "border-muted-foreground/30": !isExpanded })}>
      <CardHeader
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer flex flex-row items-center justify-between space-y-0"
      >
        <CardTitle className="text-lg font-medium">Map settings</CardTitle>
        <ChevronDown className={cn("transition-transform", isExpanded ? "rotate-180" : "rotate-0")} size={18} />
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Country / region picker */}
          <div>
            <p className="mb-1 text-sm font-medium">Region</p>
            <Input
              type="search"
              placeholder="Search region…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="mb-2"
            />

            <ScrollArea className="h-40 rounded-md border">
              <ToggleGroup
                type="single"
                value={selectedCountry}
                onValueChange={(v) => v && setSelectedCountry(v)}
                className="flex flex-col gap-1 p-2"
              >
                {visibleCountries.map((c) => (
                  <ToggleGroupItem key={c.id} value={c.id} className="justify-start">
                    {c.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </ScrollArea>
          </div>

          {/* Projection picker */}
          <div>
            <p className="mb-1 text-sm font-medium">Projection</p>
            <Select value={selectedProjection} onValueChange={(v) => setSelectedProjection(v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(PROJECTION_OPTIONS[selectedCountry] || PROJECTION_OPTIONS.default).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
