import type React from "react"
import { Label, Select } from "~/components/ui"

interface DimensionMappingProps {
  selectedGeography: "usa-states" | "usa-counties" | "usa-nation" | "canada-provinces" | "canada-nation" | "world"
  geoTermLabel: string
}

const DimensionMapping: React.FC<DimensionMappingProps> = ({ selectedGeography, geoTermLabel }) => {
  return (
    <div>
      {selectedGeography === "usa-states" && (
        <div>
          <Label htmlFor="choropleth-state-column" className="text-sm">
            {geoTermLabel} Column
          </Label>
          <Select id="choropleth-state-column">
            <option value="">Select a column</option>
            <option value="state_name">State Name</option>
            {/* Add more options based on your data */}
          </Select>
        </div>
      )}

      {selectedGeography === "usa-counties" && (
        <div>
          <Label htmlFor="choropleth-county-column">County Column</Label>
          <Select id="choropleth-county-column">
            <option value="">Select a column</option>
            <option value="county_name">County Name</option>
            {/* Add more options based on your data */}
          </Select>
        </div>
      )}

      {selectedGeography === "usa-nation" && (
        <div>
          <Label htmlFor="choropleth-nation-column">Nation Column</Label>
          <Select id="choropleth-nation-column">
            <option value="">Select a column</option>
            <option value="nation_name">Nation Name</option>
            {/* Add more options based on your data */}
          </Select>
        </div>
      )}

      {selectedGeography === "canada-provinces" && (
        <div>
          <Label htmlFor="choropleth-province-column">Province Column</Label>
          <Select id="choropleth-province-column">
            <option value="">Select a column</option>
            <option value="province_name">Province Name</option>
            {/* Add more options based on your data */}
          </Select>
        </div>
      )}

      {selectedGeography === "canada-nation" && (
        <div>
          <Label htmlFor="choropleth-nation-column">Nation Column</Label>
          <Select id="choropleth-nation-column">
            <option value="">Select a column</option>
            <option value="nation_name">Nation Name</option>
            {/* Add more options based on your data */}
          </Select>
        </div>
      )}

      {selectedGeography === "world" && (
        <div>
          <Label htmlFor="choropleth-country-column">Country Column</Label>
          <Select id="choropleth-country-column">
            <option value="">Select a column</option>
            <option value="country_name">Country Name</option>
            {/* Add more options based on your data */}
          </Select>
        </div>
      )}
    </div>
  )
}

export default DimensionMapping
