import type React from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Use Leaflet’s CDN copies so we get real HTTP URLs
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

L.Marker.prototype.options.icon = DefaultIcon

interface MapPreviewProps {
  latitude: number
  longitude: number
  zoom?: number
}

const MapPreview: React.FC<MapPreviewProps> = ({ latitude, longitude, zoom = 13 }) => {
  const position: [number, number] = [latitude, longitude]

  return (
    <MapContainer center={position} zoom={zoom} style={{ height: "300px", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position}>
        <Popup>
          A pretty CSS3 popup. <br /> Easily customizable.
        </Popup>
      </Marker>
    </MapContainer>
  )
}

// Allow both `import MapPreview` and `import { MapPreview }`
export default MapPreview

// Provide a named export for compatibility with `import { MapPreview }`
export { MapPreview }
