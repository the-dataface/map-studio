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
}

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const COUNTRY_OPTIONS = [
  { id: "world", label: "World" },
  { id: "united-states", label: "United States" },
]

const PROJECTIONS_BY_COUNTRY: Record<string, { id: string; label: string }[]> = {
  world: [
    { id: "geoMercator", label: "Mercator" },
    { id: "geoEqualEarth", label: "Equal-Earth" },
  ],
  "united-states": [
    { id: "geoAlbersUsa", label: "Albers USA" },
    { id: "geoMercator", label: "Mercator" },
  ],
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function MapSettings({
  isExpanded,
  setIsExpanded,
  selectedCountry,
  setSelectedCountry,
  selectedProjection,
  setSelectedProjection,
  columns,
}: MapSettingsProps) {
  /* ---------------------------------------------------------------- */
  /* Intelligent defaults                                              */
  /* ---------------------------------------------------------------- */
  useEffect(() => {
    const lowerCols = columns.map((c) => c.toLowerCase())

    // Infer USA if a "state" column exists
    if (lowerCols.includes("state")) {
      setSelectedCountry("united-states")
      setSelectedProjection("geoAlbersUsa")
      return
    }
  }, [columns, setSelectedCountry, setSelectedProjection])

  /* ---------------------------------------------------------------- */
  /* Search logic for region list                                      */
  /* ---------------------------------------------------------------- */
  const [search, setSearch] = useState("")
  const visibleCountries = useMemo(() => {
    if (!search.trim()) return COUNTRY_OPTIONS
    const s = search.toLowerCase()
    return COUNTRY_OPTIONS.filter((c) => c.label.toLowerCase().includes(s))
  }, [search])

  /* ---------------------------------------------------------------- */
  /* UI                                                                */
  /* ---------------------------------------------------------------- */
  return (
    <Card className={cn({ "border-muted-foreground/30": !isExpanded })}>
      <CardHeader
        onClick={() => setIsExpanded(!isExpanded)}
        className="cursor-pointer flex items-center justify-between space-y-0"
      >
        <CardTitle className="text-lg font-medium">Map settings</CardTitle>
        <ChevronDown size={18} className={cn("transition-transform", isExpanded ? "rotate-180" : "rotate-0")} />
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Region picker */}
          <div>
            <p className="mb-1 text-sm font-medium">Region</p>
            <Input
              type="search"
              placeholder="Search region …"
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
                {(PROJECTIONS_BY_COUNTRY[selectedCountry] ?? PROJECTIONS_BY_COUNTRY.world).map((p) => (
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
