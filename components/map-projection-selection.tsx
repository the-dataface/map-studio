"use client"

import { useMemo, useState, useEffect } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface Props {
  geography: "world" | "usa"
  projection: "mercator" | "albersUsa" | "equalEarth"
  onGeographyChange: (g: Props["geography"]) => void
  onProjectionChange: (p: Props["projection"]) => void
  columns: string[]
  sampleRows: (string | number)[][]
}

/**
 * Very small helper to guess geography/projection from column names / data.
 */
function guessSettings(columns: string[], rows: (string | number)[][]) {
  const colNames = columns.map((c) => c.toLowerCase())
  if (colNames.some((c) => c.includes("state") || c.includes("fips"))) {
    return { g: "usa" as const, p: "albersUsa" as const }
  }
  if (colNames.some((c) => c.includes("country"))) {
    return { g: "world" as const, p: "mercator" as const }
  }
  // Fallback
  return { g: "usa" as const, p: "albersUsa" as const }
}

export function MapProjectionSelection({
  geography,
  projection,
  onGeographyChange,
  onProjectionChange,
  columns,
  sampleRows,
}: Props) {
  /* ------------------------------------------------------------
   *  Intelligent suggestion on first load
   * ---------------------------------------------------------- */
  useEffect(() => {
    const { g, p } = guessSettings(columns, sampleRows)
    onGeographyChange(g)
    onProjectionChange(p)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // run once

  /* ------------------------  search ------------------------- */
  const [search, setSearch] = useState("")
  const geoOptions = useMemo(() => {
    const all = [
      { id: "usa", label: "United States" },
      { id: "world", label: "World" },
    ] as const
    return all.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
  }, [search])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{"Map & Projection"}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Geography selector ------------------------------------------------ */}
        <div>
          <p className="mb-2 text-sm font-medium">Geography</p>
          <Input placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="mb-2" />
          <div className="max-h-48 overflow-y-auto pr-1">
            <ToggleGroup
              type="single"
              value={geography}
              onValueChange={(val) => {
                if (val) onGeographyChange(val as Props["geography"])
              }}
              className="flex flex-col gap-1"
            >
              {geoOptions.map((o) => (
                <ToggleGroupItem key={o.id} value={o.id} className="justify-start">
                  {o.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        {/* Projection selector --------------------------------------------- */}
        <div>
          <p className="mb-2 text-sm font-medium">Projection</p>
          <ToggleGroup
            type="single"
            value={projection}
            onValueChange={(val) => {
              if (val) onProjectionChange(val as Props["projection"])
            }}
            className="flex flex-col gap-1"
          >
            <ToggleGroupItem value="mercator" className="justify-start">
              Mercator
            </ToggleGroupItem>
            <ToggleGroupItem value="albersUsa" className="justify-start">
              Albers USA
            </ToggleGroupItem>
            <ToggleGroupItem value="equalEarth" className="justify-start">
              Equal Earth
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </CardContent>
    </Card>
  )
}
