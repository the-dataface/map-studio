"use client"

import type React from "react"

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface DataPreviewProps {
  data: any[]
  columnTypes: Record<string, string>
  setColumnTypes: (columnTypes: Record<string, string>) => void
  selectedGeography: string | null
}

const DataPreview: React.FC<DataPreviewProps> = ({ data, columnTypes, setColumnTypes, selectedGeography }) => {
  const columns = useMemo<ColumnDef<any>[]>(
    () =>
      Object.keys(data[0] || {}).map((column) => ({
        accessorKey: column,
        header: column,
      })),
    [data],
  )

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleColumnTypeChange = (column: string, type: string) => {
    setColumnTypes((prev) => ({ ...prev, [column]: type }))
  }

  const columnTypeOptions = ["string", "number", "state", "date"]

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const column = header.column.id
                return (
                  <TableHead key={header.id}>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold">
                        {columnTypes[column] === "state"
                          ? selectedGeography === "usa-counties"
                            ? "County"
                            : selectedGeography === "canada-provinces" || selectedGeography === "canada-nation" // Even for nation, if a state-like column is inferred, label as Province
                              ? "Province"
                              : "State/Province" // Default for generic state or USA states
                          : column}
                      </span>
                      {/* Add type dropdown for columns */}
                      <Select onValueChange={(type) => handleColumnTypeChange(column, type)}>
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Column Type" defaultValue={columnTypes[column]} />
                        </SelectTrigger>
                        <SelectContent>
                          {columnTypeOptions.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
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
