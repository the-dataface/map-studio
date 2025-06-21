import type React from "react"

interface MapPreviewProps {
  selectedGeography?: "world" | "usa"
  selectedProjection?: "mercator" | "albersUsa" | "equalEarth"
}

const MapPreview: React.FC<MapPreviewProps> = ({ selectedGeography, selectedProjection }) => {
  return (
    <div>
      {/* Map preview will be rendered here */}
      <p>Map Preview Component</p>
      {selectedGeography && <p>Selected Geography: {selectedGeography}</p>}
      {selectedProjection && <p>Selected Projection: {selectedProjection}</p>}
    </div>
  )
}

export default MapPreview

export { MapPreview }
