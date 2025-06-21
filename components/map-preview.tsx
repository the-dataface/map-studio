// components/map-preview.tsx

import type React from "react"

interface MapPreviewProps {
  selectedGeography?: string
  selectedProjection?: string
}

const MapPreview: React.FC<MapPreviewProps> = () => {
  return (
    <div>
      {/* Placeholder for map preview */}
      <p>Map Preview Component</p>
    </div>
  )
}

export default MapPreview
