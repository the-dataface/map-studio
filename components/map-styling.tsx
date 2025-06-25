"use client"

import type React from "react"
import { useState } from "react"

interface MapStylingProps {
  onBaseMapChange: (baseMap: string) => void
  onProjectionChange: (projection: string) => void
  currentBaseMap: string
  currentProjection: string
}

const MapStyling: React.FC<MapStylingProps> = ({
  onBaseMapChange,
  onProjectionChange,
  currentBaseMap,
  currentProjection,
}) => {
  const [baseMap, setBaseMap] = useState(currentBaseMap)
  const [projection, setProjection] = useState(currentProjection)

  const handleBaseMapChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newBaseMap = event.target.value
    setBaseMap(newBaseMap)
    onBaseMapChange(newBaseMap)
  }

  const handleProjectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newProjection = event.target.value
    setProjection(newProjection)
    onProjectionChange(newProjection)
  }

  return (
    <div className="map-styling">
      <h3>Base Map Styling</h3>

      <div className="base-map-selector">
        <label htmlFor="baseMap">Base Map:</label>
        <select id="baseMap" value={baseMap} onChange={handleBaseMapChange}>
          <option value="streets">Streets</option>
          <option value="satellite">Satellite</option>
          <option value="dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>

      <div className="projection-selector">
        <label htmlFor="projection">Projection:</label>
        <select id="projection" value={projection} onChange={handleProjectionChange}>
          <option value="mercator">Mercator</option>
          <option value="albers">Albers</option>
          <option value="naturalEarth">Natural Earth</option>
        </select>
      </div>
    </div>
  )
}

export default MapStyling
