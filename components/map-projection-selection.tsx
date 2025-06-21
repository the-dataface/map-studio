"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown, ChevronUp } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DataRow } from "@/app/page"
import { toast } from "@/components/ui/use-toast"

interface MapProjectionSelectionProps {
  onGeographyChange: (geography: string) => void
  onProjectionChange: (projection: string) => void
  currentGeography: string
  currentProjection: string
  columns: string[]
  parsedData: DataRow[]
  isDataLoaded: boolean
}

const geographies = [
  { id: "world", name: "World", flag: "🌍" },
  { id: "us", name: "United States", flag: "🇺🇸" },
  { id: "ca", name: "Canada", flag: "🇨🇦" },
  { id: "mx", name: "Mexico", flag: "🇲🇽" },
  { id: "gb", name: "United Kingdom", flag: "🇬🇧" },
  { id: "fr", name: "France", flag: "🇫🇷" },
  { id: "de", name: "Germany", flag: "🇩🇪" },
  { id: "jp", name: "Japan", flag: "🇯🇵" },
  { id: "cn", name: "China", flag: "🇨🇳" },
  { id: "in", name: "India", flag: "🇮🇳" },
  { id: "au", name: "Australia", flag: "🇦🇺" },
  { id: "br", name: "Brazil", flag: "🇧🇷" },
]

const projections = [
  { id: "geoAlbersUsa", name: "Albers USA (Recommended for US)", for: ["us"] },
  {
    id: "geoMercator",
    name: "Mercator (Good for World, Rectangular)",
    for: ["world", "ca", "mx", "gb", "fr", "de", "jp", "cn", "in", "au", "br"],
  },
  {
    id: "geoNaturalEarth1",
    name: "Natural Earth I (Good for World, Oval)",
    for: ["world", "ca", "mx", "gb", "fr", "de", "jp", "cn", "in", "au", "br"],
  },
  {
    id: "geoEqualEarth",
    name: "Equal Earth (Good for World, Oval)",
    for: ["world", "ca", "mx", "gb", "fr", "de", "jp", "cn", "in", "au", "br"],
  },
]

// Simple state abbreviation map for detection
const usStateAbbrs = new Set([
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
])

export function MapProjectionSelection({
  onGeographyChange,
  onProjectionChange,
  currentGeography,
  currentProjection,
  columns,
  parsedData,
  isDataLoaded,
}: MapProjectionSelectionProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  // Intelligent suggestion logic
  useEffect(() => {
    if (!isDataLoaded || parsedData.length === 0 || columns.length === 0) {
      return
    }

    let detectedGeography: string | null = null
    const countryCounts: { [key: string]: number } = {}
    let usStateFoundCount = 0

    // Prioritize 'country' column detection
    const countryColumn = columns.find((col) => col.toLowerCase() === "country" || col.toLowerCase() === "nation")
    if (countryColumn) {
      parsedData.forEach((row) => {
        const value = String(row[countryColumn]).toLowerCase().trim()
        if (value) {
          if (value.includes("united states") || value === "usa" || value === "us") {
            countryCounts["us"] = (countryCounts["us"] || 0) + 1
          } else if (value.includes("canada") || value === "ca") {
            countryCounts["ca"] = (countryCounts["ca"] || 0) + 1
          } else if (value.includes("mexico") || value === "mx") {
            countryCounts["mx"] = (countryCounts["mx"] || 0) + 1
          } else {
            countryCounts["other"] = (countryCounts["other"] || 0) + 1
          }
        }
      })

      const totalCountries = Object.values(countryCounts).reduce((sum, count) => sum + count, 0)
      const threshold = 0.7 // If one country dominates by this percentage

      let dominantCountry = null
      for (const geoId of ["us", "ca", "mx"]) {
        if (countryCounts[geoId] && countryCounts[geoId] / totalCountries >= threshold) {
          dominantCountry = geoId
          break
        }
      }

      if (dominantCountry) {
        detectedGeography = dominantCountry
      } else if (countryCounts["other"] > 0 || Object.keys(countryCounts).length > 1) {
        detectedGeography = "world" // If diverse or non-specific countries
      }
    }

    // If no clear country, check for 'state' or 'province' columns
    if (!detectedGeography) {
      const stateColumn = columns.find(
        (col) =>
          col.toLowerCase() === "state" || col.toLowerCase() === "province" || col.toLowerCase() === "state_abbr",
      )
      if (stateColumn) {
        parsedData.forEach((row) => {
          const value = String(row[stateColumn]).toUpperCase().trim()
          if (usStateAbbrs.has(value)) {
            usStateFoundCount++
          }
        })
        if (usStateFoundCount > parsedData.length * 0.5) {
          // If more than half are US states
          detectedGeography = "us"
        }
      }
    }

    // Default to US if nothing else detected and data is present, or if it's the only strong signal
    if (!detectedGeography && parsedData.length > 0) {
      detectedGeography = "us"
    }

    if (detectedGeography && detectedGeography !== currentGeography) {
      onGeographyChange(detectedGeography)

      // Suggest appropriate projection
      const compatibleProjections = projections.filter((proj) => proj.for.includes(detectedGeography))
      const suggestedProjection =
        compatibleProjections.find((p) => p.id === "geoAlbersUsa") || compatibleProjections[0]?.id || "geoMercator"

      if (suggestedProjection && suggestedProjection !== currentProjection) {
        onProjectionChange(suggestedProjection)
      }

      toast({
        description: `Suggested map geography: ${geographies.find((g) => g.id === detectedGeography)?.name || detectedGeography}.`,
        variant: "info",
        duration: 3000,
      })
    }
  }, [isDataLoaded, parsedData, columns, currentGeography, onGeographyChange, onProjectionChange, currentProjection])

  const filteredGeographies = useMemo(() => {
    return geographies.filter((geo) => geo.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [searchTerm])

  const availableProjections = useMemo(() => {
    return projections.filter((proj) => proj.for.includes(currentGeography))
  }, [currentGeography])

  return (
    <Card className="shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden">
      <CardHeader
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out py-5 px-6 rounded-t-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-gray-900 dark:text-white transition-colors duration-200">
              Map & Projection
            </CardTitle>
          </div>
          <div className="transform transition-transform duration-200 ease-in-out">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
            )}
          </div>
        </div>
      </CardHeader>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
        } overflow-hidden`}
      >
        <CardContent className="space-y-6 px-6 pb-6 pt-2">
          {/* Projection Selection */}
          <div className="space-y-2">
            <label htmlFor="projection-select" className="text-sm font-medium text-gray-900 dark:text-white">
              Select Map Projection
            </label>
            <Select onValueChange={onProjectionChange} value={currentProjection}>
              <SelectTrigger id="projection-select" className="w-full">
                <SelectValue placeholder="Select a projection" />
              </SelectTrigger>
              <SelectContent>
                {availableProjections.map((proj) => (
                  <SelectItem key={proj.id} value={proj.id}>
                    {proj.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Geography Selection */}
          <div className="space-y-2">
            <label htmlFor="geography-search" className="text-sm font-medium text-gray-900 dark:text-white">
              Select Map Geography
            </label>
            <Input
              id="geography-search"
              placeholder="Search countries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
            <div className="max-h-[200px] overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-md p-1 space-y-1">
              {filteredGeographies.length > 0 ? (
                filteredGeographies.map((geo) => (
                  <Button
                    key={geo.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-sm px-3 py-2",
                      currentGeography === geo.id && "bg-gray-100 dark:bg-gray-700 font-semibold",
                    )}
                    onClick={() => {
                      onGeographyChange(geo.id)
                      const compatibleProjections = projections.filter((proj) => proj.for.includes(geo.id))
                      const suggestedProjection =
                        compatibleProjections.find((p) => p.id === "geoAlbersUsa") ||
                        compatibleProjections[0]?.id ||
                        "geoMercator"
                      onProjectionChange(suggestedProjection)
                    }}
                  >
                    <span className="mr-2">{geo.flag}</span> {geo.name}
                  </Button>
                ))
              ) : (
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                  No matching geographies found.
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Note: Only US and World maps are fully supported. Other selections are for future expansions and may not
              render correctly without additional TopoJSON data.
            </p>
          </div>
        </CardContent>
      </div>
    </Card>
  )
}
