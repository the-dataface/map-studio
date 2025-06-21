"use client"

import { useState, useCallback } from "react"
import { DataInput } from "@/components/data-input"
import { ColumnDefinition } from "@/components/column-definition"
import { MapPreview } from "@/components/map-preview"
import { Geocoding } from "@/components/geocoding"
import { MapTypeSelection } from "@/components/map-type-selection"
import { MapProjectionSelection } from "@/components/map-projection-selection"

export default function Page() {
  const [data, setData] = useState<string>("")
  const [parsedData, setParsedData] = useState<any[]>([])
  const [columnDefinitions, setColumnDefinitions] = useState<ColumnDefinition[]>([])
  const [activeMapType, setActiveMapType] = useState<string>("symbol")
  const [selectedGeography, setSelectedGeography] = useState<string>("us") // default to US
  const [selectedProjection, setSelectedProjection] = useState<string>("geoAlbersUsa") // default projection
  const [geocodingResults, setGeocodingResults] = useState<any[]>([])
  const [showGeocoding, setShowGeocoding] = useState<boolean>(false)

  const hasAnyData = () => parsedData && parsedData.length > 0

  const getCurrentColumns = useCallback(() => {
    return columnDefinitions.map((c) => c.Header)
  }, [columnDefinitions])

  const getCurrentDisplayData = useCallback(() => {
    if (!hasAnyData()) {
      return []
    }

    return parsedData.map((row) => {
      return getCurrentColumns().map((col) => row[col])
    })
  }, [parsedData, getCurrentColumns])

  return (
    <main className="flex min-h-screen flex-col items-center p-12">
      <DataInput setData={setData} setParsedData={setParsedData} />
      <ColumnDefinition parsedData={parsedData} setColumnDefinitions={setColumnDefinitions} />
      <MapTypeSelection activeMapType={activeMapType} setActiveMapType={setActiveMapType} />
      <MapProjectionSelection
        onGeographyChange={setSelectedGeography}
        onProjectionChange={setSelectedProjection}
        currentGeography={selectedGeography}
        currentProjection={selectedProjection}
        columns={getCurrentColumns()}
        parsedData={getCurrentDisplayData()}
        isDataLoaded={hasAnyData()}
      />
      {showGeocoding && (
        <Geocoding
          parsedData={parsedData}
          columnDefinitions={columnDefinitions}
          setGeocodingResults={setGeocodingResults}
        />
      )}
      <MapPreview
        data={data}
        parsedData={parsedData}
        columnDefinitions={columnDefinitions}
        activeMapType={activeMapType}
        geocodingResults={geocodingResults}
        showGeocoding={showGeocoding}
        selectedGeography={selectedGeography}
        selectedProjection={selectedProjection}
      />
    </main>
  )
}
