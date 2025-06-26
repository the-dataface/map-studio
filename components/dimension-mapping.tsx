"use client"

import type React from "react"
import styled from "styled-components"

const Container = styled.div`
  margin-bottom: 20px;
`

const Label = styled.label`
  display: block;
  margin-bottom: 5px;
`

const Select = styled.select`
  width: 100%;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
`

interface DimensionMappingProps {
  dataHeaders: string[]
  selectedGeography: string
  onStateColumnChange: (column: string) => void
  onValueColumnChange: (column: string) => void
  stateColumn: string
  valueColumn: string
}

const DimensionMapping: React.FC<DimensionMappingProps> = ({
  dataHeaders,
  selectedGeography,
  onStateColumnChange,
  onValueColumnChange,
  stateColumn,
  valueColumn,
}) => {
  const getGeographyLabel = () => {
    if (selectedGeography === "usa-counties") return "County"
    if (selectedGeography === "usa-states") return "State"
    if (selectedGeography === "canada-provinces") return "Province"
    return "State/Province/County"
  }

  return (
    <Container>
      <h3>Choropleth Settings</h3>
      <Container>
        <Label htmlFor="stateColumn">{getGeographyLabel()} Column</Label>
        <Select id="stateColumn" value={stateColumn} onChange={(e) => onStateColumnChange(e.target.value)}>
          <option value="">Select a column</option>
          {dataHeaders.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </Select>
      </Container>
      <Container>
        <Label htmlFor="valueColumn">Value Column</Label>
        <Select id="valueColumn" value={valueColumn} onChange={(e) => onValueColumnChange(e.target.value)}>
          <option value="">Select a column</option>
          {dataHeaders.map((header) => (
            <option key={header} value={header}>
              {header}
            </option>
          ))}
        </Select>
      </Container>
    </Container>
  )
}

export default DimensionMapping
export { DimensionMapping }
