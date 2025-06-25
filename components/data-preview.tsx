"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DataPreviewProps {
  data: any[]
  selectedGeography: string | null
}

const DataPreview: React.FC<DataPreviewProps> = ({ data, selectedGeography }) => {
  const [columnTypes, setColumnTypes] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (data && data.length > 0) {
      const initialColumnTypes: { [key: string]: string } = {}
      Object.keys(data[0]).forEach((key) => {
        initialColumnTypes[key] = "" // Initialize with empty string
      })
      setColumnTypes(initialColumnTypes)
    }
  }, [data])

  const handleColumnTypeChange = (column: string, type: string) => {
    setColumnTypes((prev) => ({ ...prev, [column]: type }))
  }

  if (!data || data.length === 0) {
    return <div>No data to display.</div>
  }

  const columns = Object.keys(data[0])

  return (
    <div className="rounded-md border">
      <Table>
        <TableCaption>A preview of the data.</TableCaption>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>
                {column}
                <Select onValueChange={(value) => handleColumnTypeChange(column, value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select Type">
                      {columnTypes[column] === "state"
                        ? selectedGeography === "canada-provinces"
                          ? "Province"
                          : selectedGeography === "usa-counties"
                            ? "County"
                            : "State" // Default for usa-states
                        : columnTypes[column] || "Text"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="state">State/Province/County</SelectItem>
                  </SelectContent>
                </Select>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, index) => (
            <TableRow key={index}>
              {columns.map((column) => (
                <TableCell key={column}>{row[column]}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default DataPreview
export { DataPreview }
