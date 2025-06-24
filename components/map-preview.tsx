import type React from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix for Leaflet marker issue (see: https://github.com/Leaflet/Leaflet/issues/7255)
import icon from "leaflet/dist/images/marker-icon.png"
import iconShadow from "leaflet/dist/images/marker-shadow.png"

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
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
