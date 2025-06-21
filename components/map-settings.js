"use client"

// Map settings panel (pure JS – no TS features whatsoever)
import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import ScrollArea from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { ChevronDown } from "lucide-react"

/* ------------------------------------------------------------------ */
/* Static data                                                         */
/* ------------------------------------------------------------------ */

const COUNTRY_OPTIONS = [
  { id: "world", label: "World" },
  { id: "united-states", label: "United States" },
]

const PROJECTIONS_BY_COUNTRY = {
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

export default function MapSettings(props) {
  const {
    isExpanded,
    setIsExpanded,
    selectedCountry,
    setSelectedCountry,
    selectedProjection,
    setSelectedProjection,
    columns = [],
  } = props

  /* Infer USA if the data has a “state” column */
  useEffect(() => {
    if (columns.some((c) => c.toLowerCase() === "state")) {
      setSelectedCountry("united-states")
      setSelectedProjection("geoAlbersUsa")
    }
  }, [columns, setSelectedCountry, setSelectedProjection])

  /* Search/filter list */
  const [search, setSearch] = useState("")
  const visible = useMemo(() => {
    if (!search.trim()) return COUNTRY_OPTIONS
    const q = search.toLowerCase()
    return COUNTRY_OPTIONS.filter((c) => c.label.toLowerCase().includes(q))
  }, [search])

  /* UI */
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
                {visible.map((c) => (
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
            <Select value={selectedProjection} onValueChange={setSelectedProjection}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(PROJECTIONS_BY_COUNTRY[selectedCountry] || PROJECTIONS_BY_COUNTRY.world).map((p) => (
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
