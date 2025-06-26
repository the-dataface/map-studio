import type React from "react"

interface DataPreviewProps {
  data: any[]
  columns: string[]
  mapType: string
  selectedGeography: string
  dimensionSettings: any
}

const DataPreview: React.FC<DataPreviewProps> = ({ data, columns, mapType, selectedGeography, dimensionSettings }) => {
  const getGeographyLabel = () => {
    if (selectedGeography === "usa-counties") return "County"
    if (selectedGeography === "usa-states") return "State"
    if (selectedGeography === "canada-provinces") return "Province"
    return "Geography"
  }

  const TableHead = ({ children }: { children: React.ReactNode }) => (
    <th style={{ padding: "8px", border: "1px solid #ddd" }}>{children}</th>
  )

  const TableRow = ({ children }: { children: React.ReactNode }) => (
    <tr style={{ "&:nth-child(even)": { backgroundColor: "#f2f2f2" } }}>{children}</tr>
  )

  const TableCell = ({ children }: { children: React.ReactNode }) => (
    <td style={{ padding: "8px", border: "1px solid #ddd" }}>{children}</td>
  )

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            {columns.map((column) => (
              <TableHead key={column}>
                {mapType === "choropleth" && dimensionSettings.choropleth.stateColumn === column
                  ? getGeographyLabel()
                  : column}
              </TableHead>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={column}>{row[column]}</TableCell>
              ))}
            </TableRow>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DataPreview
