"use client"

import { useRef, useEffect, useState, useCallback } from "react"
import * as d3 from "d3"
import * as topojson from "topojson-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Copy } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

// Define interfaces for props and data structures
interface DataRow {
  [key: string]: string | number
}

interface GeocodedRow extends DataRow {
  latitude?: number
  longitude?: number
  geocoded?: boolean
  source?: string
  processing?: boolean
}

interface ColumnType {
  [key: string]: "text" | "number" | "date" | "coordinate" | "state"
}

interface ColumnFormat {
  [key: string]: string
}

interface DimensionSettings {
  symbol: {
    latitude: string
    longitude: string
    sizeBy: string
    sizeMin: number
    sizeMax: number
    sizeMinValue: number
    sizeMaxValue: number
    colorBy: string
    colorScale: string
    colorPalette: string
    colorMinValue: number
    colorMidValue: number
    colorMaxValue: number
    colorMinColor: string
    colorMidColor: string
    colorMaxColor: string
    categoricalColors: { value: string; color: string }[]
    labelTemplate: string
  }
  choropleth: {
    stateColumn: string
    colorBy: string
    colorScale: string
    colorPalette: string
    colorMinValue: number
    colorMidValue: number
    colorMaxValue: number
    colorMinColor: string
    colorMidColor: string
    colorMaxColor: string
    categoricalColors: { value: string; color: string }[]
    labelTemplate: string
  }
  custom: {
    stateColumn: string
    colorBy: string
    colorScale: string
    colorPalette: string
    colorMinValue: number
    colorMidValue: number
    colorMaxValue: number
    colorMinColor: string
    colorMidColor: string
    colorMaxColor: string
    categoricalColors: { value: string; color: string }[]
    labelTemplate: string
  }
}

interface StylingSettings {
  activeTab: "base" | "symbol" | "choropleth"
  base: {
    mapBackgroundColor: string
    nationFillColor: string
    nationStrokeColor: string
    nationStrokeWidth: number
    defaultStateFillColor: string
    defaultStateStrokeColor: string
    defaultStateStrokeWidth: number
    savedStyles: any[] // Adjust as per your SavedStyle interface
  }
  symbol: {
    symbolType: "symbol" | "spike" | "arrow"
    symbolShape:
      | "circle"
      | "square"
      | "diamond"
      | "triangle"
      | "triangle-down"
      | "hexagon"
      | "map-marker"
      | "custom-svg"
    symbolFillColor: string
    symbolStrokeColor: string
    symbolSize: number
    symbolStrokeWidth: number
    symbolFillTransparency?: number
    symbolStrokeTransparency?: number
    labelFontFamily: string
    labelBold: boolean
    labelItalic: boolean
    labelUnderline: boolean
    labelStrikethrough: boolean
    labelColor: string
    labelOutlineColor: string
    labelFontSize: number
    labelOutlineThickness: number
    labelAlignment:
      | "auto"
      | "top-left"
      | "top-center"
      | "top-right"
      | "middle-left"
      | "center"
      | "middle-right"
      | "bottom-left"
      | "bottom-center"
      | "bottom-right"
    customSvgPath?: string
  }
  choropleth: {
    labelFontFamily: string
    labelBold: boolean
    labelItalic: boolean
    labelUnderline: boolean
    labelStrikethrough: boolean
    labelColor: string
    labelOutlineColor: string
    labelFontSize: number
    labelOutlineThickness: number
  }
}

interface MapPreviewProps {
  symbolData: GeocodedRow[]
  choroplethData: DataRow[]
  symbolColumns: string[]
  choroplethColumns: string[]
  mapType: "symbol" | "choropleth" | "custom"
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
  symbolDataExists: boolean
  choroplethDataExists: boolean
  columnTypes: ColumnType
  columnFormats: ColumnFormat
  customMapData: string
  selectedGeography: "usa" | "world" // New prop
  selectedProjection: "albersUsa" | "mercator" | "equalEarth" // New prop
}

export function MapPreview({
  symbolData,
  choroplethData,
  symbolColumns,
  choroplethColumns,
  mapType,
  dimensionSettings,
  stylingSettings,
  symbolDataExists,
  choroplethDataExists,
  columnTypes,
  columnFormats,
  customMapData,
  selectedGeography, // Destructure new prop
  selectedProjection, // Destructure new prop
}: MapPreviewProps) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [geoAtlasData, setGeoAtlasData] = useState<any>(null) // Renamed from usData
  const { toast } = useToast()

  const width = 960
  const height = 600

  // Load TopoJSON data based on selectedGeography
  useEffect(() => {
    const loadGeoData = async () => {
      try {
        let dataUrl = ""
        if (selectedGeography === "usa") {
          dataUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"
        } else if (selectedGeography === "world") {
          dataUrl = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json"
        }

        if (dataUrl) {
          const response = await fetch(dataUrl)
          const us = await response.json()
          setGeoAtlasData(us)
        } else {
          setGeoAtlasData(null)
        }
      } catch (error) {
        console.error("Error loading geo data:", error)
        setGeoAtlasData(null)
      }
    }
    loadGeoData()
  }, [selectedGeography]) // Re-run when selectedGeography changes

  const renderMap = useCallback(() => {
    const svg = d3.select(svgRef.current)
    svg.selectAll("*").remove() // Clear previous render

    // Apply map background color
    svg.style("background-color", stylingSettings.base.mapBackgroundColor)

    let projection: d3.GeoProjection
    if (selectedProjection === "albersUsa") {
      projection = d3.geoAlbersUsa().fitSize([width, height], { type: "Sphere" })
    } else if (selectedProjection === "mercator") {
      projection = d3.geoMercator().fitSize([width, height], { type: "Sphere" })
    } else if (selectedProjection === "equalEarth") {
      projection = d3.geoEqualEarth().fitSize([width, height], { type: "Sphere" })
    } else {
      // Fallback
      projection = d3.geoAlbersUsa().fitSize([width, height], { type: "Sphere" })
    }

    const path = d3.geoPath().projection(projection)

    // Render custom SVG if provided
    if (mapType === "custom" && customMapData) {
      svg.html(customMapData)
      // If custom SVG is loaded, we might need to adjust its viewbox or scale
      // This is a basic approach; more complex custom SVG handling might be needed
      const customSvgElement = svg.select("svg")
      if (!customSvgElement.empty()) {
        customSvgElement.attr("width", width).attr("height", height).attr("viewBox", `0 0 ${width} ${height}`)
      }
      // For custom maps, we might still want to render labels or symbols on top
      // based on choroplethData or symbolData if they exist.
    } else if (geoAtlasData) {
      // Render standard US or World map
      let geoFeatures: any[] = []
      let nationFeature: any = null

      if (selectedGeography === "usa") {
        geoFeatures = topojson.feature(geoAtlasData, geoAtlasData.objects.states).features
        nationFeature = topojson.mesh(geoAtlasData, geoAtlasData.objects.nation)
      } else if (selectedGeography === "world") {
        geoFeatures = topojson.feature(geoAtlasData, geoAtlasData.objects.countries).features
        nationFeature = topojson.mesh(geoAtlasData, geoAtlasData.objects.countries, (a: any, b: any) => a !== b)
      }

      // Choropleth logic
      const choroplethMapData = mapType === "choropleth" ? choroplethData : []
      const choroplethDimension = dimensionSettings.choropleth
      const choroplethColorByColumn = choroplethDimension.colorBy
      const choroplethStateColumn = choroplethDimension.stateColumn

      const choroplethValueMap = new Map<string, number | string>()
      if (choroplethColorByColumn && choroplethStateColumn) {
        choroplethMapData.forEach((d) => {
          const stateName = String(d[choroplethStateColumn])
          const value = d[choroplethColorByColumn]
          if (value !== undefined && value !== null) {
            choroplethValueMap.set(stateName, value)
          }
        })
      }

      let choroplethColorScale: d3.ScaleSequential<string> | d3.ScaleOrdinal<string, string> | null = null
      if (choroplethColorByColumn && choroplethStateColumn) {
        const values = Array.from(choroplethValueMap.values()).filter((v) => typeof v === "number") as number[]
        if (choroplethDimension.colorScale === "linear" && values.length > 0) {
          const minVal = choroplethDimension.colorMinValue
          const maxVal = choroplethDimension.colorMaxValue
          choroplethColorScale = d3
            .scaleLinear<string>()
            .domain([minVal, maxVal])
            .range([choroplethDimension.colorMinColor, choroplethDimension.colorMaxColor])
            .clamp(true)
        } else if (choroplethDimension.colorScale === "categorical") {
          const domain = choroplethDimension.categoricalColors.map((c) => c.value)
          const range = choroplethDimension.categoricalColors.map((c) => c.color)
          choroplethColorScale = d3.scaleOrdinal<string, string>().domain(domain).range(range)
        }
      }

      // Draw states/countries
      svg
        .append("g")
        .attr("class", "states")
        .selectAll("path")
        .data(geoFeatures)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("fill", (d: any) => {
          const stateName = selectedGeography === "usa" ? d.properties.name : d.properties.name
          const value = choroplethValueMap.get(stateName)
          if (choroplethColorScale && value !== undefined) {
            return choroplethColorScale(value as any) // Cast to any because scale can take number or string
          }
          return stylingSettings.base.defaultStateFillColor
        })
        .attr("stroke", stylingSettings.base.defaultStateStrokeColor)
        .attr("stroke-width", stylingSettings.base.defaultStateStrokeWidth)

      // Draw nation border
      svg
        .append("path")
        .datum(nationFeature)
        .attr("class", "nation-border")
        .attr("d", path)
        .attr("fill", stylingSettings.base.nationFillColor)
        .attr("stroke", stylingSettings.base.nationStrokeColor)
        .attr("stroke-width", stylingSettings.base.nationStrokeWidth)

      // Render choropleth labels
      if (mapType === "choropleth" && choroplethDimension.labelTemplate) {
        svg
          .append("g")
          .attr("class", "choropleth-labels")
          .selectAll("text")
          .data(geoFeatures)
          .enter()
          .append("text")
          .attr("transform", (d: any) => `translate(${path.centroid(d)})`)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "central")
          .attr("font-family", stylingSettings.choropleth.labelFontFamily)
          .attr("font-size", `${stylingSettings.choropleth.labelFontSize}px`)
          .attr("fill", stylingSettings.choropleth.labelColor)
          .attr("stroke", stylingSettings.choropleth.labelOutlineColor)
          .attr("stroke-width", stylingSettings.choropleth.labelOutlineThickness)
          .style("font-weight", stylingSettings.choropleth.labelBold ? "bold" : "normal")
          .style("font-style", stylingSettings.choropleth.labelItalic ? "italic" : "normal")
          .style("text-decoration", () => {
            const decoration = []
            if (stylingSettings.choropleth.labelUnderline) decoration.push("underline")
            if (stylingSettings.choropleth.labelStrikethrough) decoration.push("line-through")
            return decoration.join(" ") || "none"
          })
          .html((d: any) => {
            const stateName = selectedGeography === "usa" ? d.properties.name : d.properties.name
            const dataRow = choroplethData.find((row) => String(row[choroplethDimension.stateColumn]) === stateName)
            if (!dataRow) return ""

            let label = choroplethDimension.labelTemplate
            choroplethColumns.forEach((col) => {
              const regex = new RegExp(`\\{\\{${col}\\}\\}`, "g")
              label = label.replace(regex, String(dataRow[col] || ""))
            })
            return label
          })
      }
    }

    // Symbol map logic (rendered on top of base map or custom SVG)
    if (mapType === "symbol" || (mapType === "custom" && symbolDataExists)) {
      const symbolDimension = dimensionSettings.symbol
      const latColumn = symbolDimension.latitude
      const lonColumn = symbolDimension.longitude
      const sizeByColumn = symbolDimension.sizeBy
      const colorByColumn = symbolDimension.colorBy

      // Filter out data points without valid lat/lon
      const validSymbolData = symbolData.filter(
        (d) =>
          typeof d[latColumn] === "number" &&
          typeof d[lonColumn] === "number" &&
          !isNaN(d[latColumn] as number) &&
          !isNaN(d[lonColumn] as number),
      )

      // Size scale
      let sizeScale: d3.ScaleLinear<number, number> | null = null
      if (sizeByColumn) {
        const values = validSymbolData.map((d) => d[sizeByColumn]).filter((v) => typeof v === "number") as number[]
        if (values.length > 0) {
          const minVal = symbolDimension.sizeMinValue
          const maxVal = symbolDimension.sizeMaxValue
          sizeScale = d3
            .scaleLinear()
            .domain([minVal, maxVal])
            .range([symbolDimension.sizeMin, symbolDimension.sizeMax])
            .clamp(true)
        }
      }

      // Color scale for symbols
      let symbolColorScale: d3.ScaleSequential<string> | d3.ScaleOrdinal<string, string> | null = null
      if (colorByColumn) {
        const values = validSymbolData.map((d) => d[colorByColumn]).filter((v) => typeof v === "number") as number[]
        if (symbolDimension.colorScale === "linear" && values.length > 0) {
          const minVal = symbolDimension.colorMinValue
          const maxVal = symbolDimension.colorMaxValue
          symbolColorScale = d3
            .scaleLinear<string>()
            .domain([minVal, maxVal])
            .range([symbolDimension.colorMinColor, symbolDimension.colorMaxColor])
            .clamp(true)
        } else if (symbolDimension.colorScale === "categorical") {
          const domain = symbolDimension.categoricalColors.map((c) => c.value)
          const range = symbolDimension.categoricalColors.map((c) => c.color)
          symbolColorScale = d3.scaleOrdinal<string, string>().domain(domain).range(range)
        }
      }

      const symbolGroup = svg.append("g").attr("class", "symbols")

      validSymbolData.forEach((d) => {
        const coords: [number, number] = [d[lonColumn] as number, d[latColumn] as number]
        const projectedCoords = projection(coords)

        if (projectedCoords) {
          const x = projectedCoords[0]
          const y = projectedCoords[1]

          let currentSize = symbolDimension.symbolSize
          if (sizeByColumn && sizeScale) {
            const value = d[sizeByColumn]
            if (typeof value === "number") {
              currentSize = sizeScale(value)
            }
          }

          let currentFillColor = stylingSettings.symbol.symbolFillColor
          if (colorByColumn && symbolColorScale) {
            const value = d[colorByColumn]
            if (value !== undefined && value !== null) {
              currentFillColor = symbolColorScale(value as any) // Cast to any
            }
          }

          const fillOpacity = stylingSettings.symbol.symbolFillTransparency ?? 1
          const strokeOpacity = stylingSettings.symbol.symbolStrokeTransparency ?? 1

          // Draw symbol shape
          let symbolElement: d3.Selection<
            SVGPathElement | SVGCircleElement | SVGRectElement | SVGPolygonElement,
            unknown,
            HTMLElement,
            any
          > | null = null

          switch (stylingSettings.symbol.symbolShape) {
            case "circle":
              symbolElement = symbolGroup
                .append("circle")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", currentSize / 2)
              break
            case "square":
              symbolElement = symbolGroup
                .append("rect")
                .attr("x", x - currentSize / 2)
                .attr("y", y - currentSize / 2)
                .attr("width", currentSize)
                .attr("height", currentSize)
              break
            case "diamond":
              symbolElement = symbolGroup
                .append("path")
                .attr(
                  "d",
                  d3
                    .symbol()
                    .type(d3.symbolDiamond)
                    .size(currentSize * currentSize) as any,
                )
                .attr("transform", `translate(${x},${y})`)
              break
            case "triangle":
              symbolElement = symbolGroup
                .append("path")
                .attr(
                  "d",
                  d3
                    .symbol()
                    .type(d3.symbolTriangle)
                    .size(currentSize * currentSize) as any,
                )
                .attr("transform", `translate(${x},${y})`)
              break
            case "triangle-down":
              symbolElement = symbolGroup
                .append("path")
                .attr(
                  "d",
                  d3
                    .symbol()
                    .type(d3.symbolTriangle)
                    .size(currentSize * currentSize) as any,
                )
                .attr("transform", `translate(${x},${y}) rotate(180)`)
              break
            case "hexagon":
              symbolElement = symbolGroup
                .append("path")
                .attr(
                  "d",
                  d3
                    .symbol()
                    .type(d3.symbolHexagon)
                    .size(currentSize * currentSize) as any,
                )
                .attr("transform", `translate(${x},${y})`)
              break
            case "map-marker":
              // A simple map marker path
              const markerPath = `M${x},${y} C${x + currentSize / 4},${y - currentSize / 2} ${x + currentSize / 2},${y - currentSize} ${x},${y - currentSize} C${x - currentSize / 2},${y - currentSize} ${x - currentSize / 4},${y - currentSize / 2} ${x},${y} Z M${x},${y - currentSize / 2} m-${currentSize / 8},0 a${currentSize / 8},${currentSize / 8} 0 1,0 ${currentSize / 4},0 a${currentSize / 8},${currentSize / 8} 0 1,0 -${currentSize / 4},0 Z`
              symbolElement = symbolGroup.append("path").attr("d", markerPath)
              break
            case "custom-svg":
              if (stylingSettings.symbol.customSvgPath) {
                // Append custom SVG path directly
                symbolElement = symbolGroup
                  .append("path")
                  .attr("d", stylingSettings.symbol.customSvgPath)
                  .attr("transform", `translate(${x},${y}) scale(${currentSize / 24})`) // Scale to fit
              }
              break
            default:
              // Fallback to circle
              symbolElement = symbolGroup
                .append("circle")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", currentSize / 2)
              break
          }

          if (symbolElement) {
            symbolElement
              .attr("fill", currentFillColor)
              .attr("fill-opacity", fillOpacity)
              .attr("stroke", stylingSettings.symbol.symbolStrokeColor)
              .attr("stroke-width", stylingSettings.symbol.symbolStrokeWidth)
              .attr("stroke-opacity", strokeOpacity)
          }

          // Render symbol labels
          if (symbolDimension.labelTemplate) {
            let label = symbolDimension.labelTemplate
            symbolColumns.forEach((col) => {
              const regex = new RegExp(`\\{\\{${col}\\}\\}`, "g")
              label = label.replace(regex, String(d[col] || ""))
            })

            let labelX = x
            let labelY = y
            const labelOffset = currentSize / 2 + 2 // Offset from symbol edge

            // Adjust label position based on alignment
            switch (stylingSettings.symbol.labelAlignment) {
              case "top-left":
                labelX -= labelOffset
                labelY -= labelOffset
                break
              case "top-center":
                labelY -= labelOffset
                break
              case "top-right":
                labelX += labelOffset
                labelY -= labelOffset
                break
              case "middle-left":
                labelX -= labelOffset
                break
              case "middle-right":
                labelX += labelOffset
                break
              case "bottom-left":
                labelX -= labelOffset
                labelY += labelOffset
                break
              case "bottom-center":
                labelY += labelOffset
                break
              case "bottom-right":
                labelX += labelOffset
                labelY += labelOffset
                break
              case "center":
              case "auto": // Auto defaults to center for now
              default:
                // No offset, centered on symbol
                break
            }

            symbolGroup
              .append("text")
              .attr("x", labelX)
              .attr("y", labelY)
              .attr("text-anchor", () => {
                switch (stylingSettings.symbol.labelAlignment) {
                  case "top-left":
                  case "middle-left":
                  case "bottom-left":
                    return "end"
                  case "top-right":
                  case "middle-right":
                  case "bottom-right":
                    return "start"
                  case "top-center":
                  case "bottom-center":
                  case "center":
                  case "auto":
                  default:
                    return "middle"
                }
              })
              .attr("dominant-baseline", () => {
                switch (stylingSettings.symbol.labelAlignment) {
                  case "top-left":
                  case "top-center":
                  case "top-right":
                    return "alphabetic" // Aligns to bottom of text
                  case "bottom-left":
                  case "bottom-center":
                  case "bottom-right":
                    return "hanging" // Aligns to top of text
                  case "middle-left":
                  case "center":
                  case "middle-right":
                  case "auto":
                  default:
                    return "central"
                }
              })
              .attr("font-family", stylingSettings.symbol.labelFontFamily)
              .attr("font-size", `${stylingSettings.symbol.labelFontSize}px`)
              .attr("fill", stylingSettings.symbol.labelColor)
              .attr("stroke", stylingSettings.symbol.labelOutlineColor)
              .attr("stroke-width", stylingSettings.symbol.labelOutlineThickness)
              .style("font-weight", stylingSettings.symbol.labelBold ? "bold" : "normal")
              .style("font-style", stylingSettings.symbol.labelItalic ? "italic" : "normal")
              .style("text-decoration", () => {
                const decoration = []
                if (stylingSettings.symbol.labelUnderline) decoration.push("underline")
                if (stylingSettings.symbol.labelStrikethrough) decoration.push("line-through")
                return decoration.join(" ") || "none"
              })
              .html(label)
          }
        }
      })
    }

    // Render legends
    const legendGroup = svg
      .append("g")
      .attr("class", "legends")
      .attr("transform", `translate(${width - 150}, 20)`)

    let currentLegendY = 0

    // Symbol Size Legend
    if (mapType === "symbol" && dimensionSettings.symbol.sizeBy) {
      const sizeByColumn = dimensionSettings.symbol.sizeBy
      const values = symbolData.map((d) => d[sizeByColumn]).filter((v) => typeof v === "number") as number[]
      if (values.length > 0) {
        const minVal = dimensionSettings.symbol.sizeMinValue
        const maxVal = dimensionSettings.symbol.sizeMaxValue
        const sizeScale = d3
          .scaleLinear()
          .domain([minVal, maxVal])
          .range([dimensionSettings.symbol.sizeMin, dimensionSettings.symbol.sizeMax])
          .clamp(true)

        const legendSizes = [minVal, (minVal + maxVal) / 2, maxVal]
        const legendRadii = legendSizes.map((d) => sizeScale(d) / 2)

        const sizeLegend = legendGroup.append("g").attr("transform", `translate(0, ${currentLegendY})`)
        sizeLegend.append("text").attr("x", 0).attr("y", 0).attr("dy", "0.35em").text("Size by:")

        legendSizes.forEach((val, i) => {
          const r = legendRadii[i]
          sizeLegend
            .append("circle")
            .attr("cx", 10 + r)
            .attr("cy", 20 + r)
            .attr("r", r)
            .attr("fill", stylingSettings.symbol.symbolFillColor)
            .attr("stroke", stylingSettings.symbol.symbolStrokeColor)
            .attr("stroke-width", stylingSettings.symbol.symbolStrokeWidth)

          sizeLegend
            .append("text")
            .attr("x", 10 + 2 * r + 5)
            .attr("y", 20 + r)
            .attr("dy", "0.35em")
            .text(val.toFixed(0))
        })
        currentLegendY += 20 + 2 * Math.max(...legendRadii) + 10
      }
    }

    // Symbol Color Legend
    if (mapType === "symbol" && dimensionSettings.symbol.colorBy) {
      const colorByColumn = dimensionSettings.symbol.colorBy
      const symbolDimension = dimensionSettings.symbol

      const colorLegend = legendGroup.append("g").attr("transform", `translate(0, ${currentLegendY})`)
      colorLegend.append("text").attr("x", 0).attr("y", 0).attr("dy", "0.35em").text("Color by:")

      if (symbolDimension.colorScale === "linear") {
        const gradientId = `symbol-color-gradient-${Math.random().toString(36).substring(7)}`
        const linearGradient = svg
          .append("defs")
          .append("linearGradient")
          .attr("id", gradientId)
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "100%")
          .attr("y2", "0%")

        linearGradient.append("stop").attr("offset", "0%").attr("stop-color", symbolDimension.colorMinColor)
        linearGradient.append("stop").attr("offset", "100%").attr("stop-color", symbolDimension.colorMaxColor)

        colorLegend
          .append("rect")
          .attr("x", 0)
          .attr("y", 15)
          .attr("width", 100)
          .attr("height", 10)
          .style("fill", `url(#${gradientId})`)

        colorLegend
          .append("text")
          .attr("x", 0)
          .attr("y", 30)
          .attr("dy", "0.35em")
          .text(symbolDimension.colorMinValue.toFixed(0))
        colorLegend
          .append("text")
          .attr("x", 100)
          .attr("y", 30)
          .attr("dy", "0.35em")
          .attr("text-anchor", "end")
          .text(symbolDimension.colorMaxValue.toFixed(0))

        currentLegendY += 40
      } else if (symbolDimension.colorScale === "categorical") {
        symbolDimension.categoricalColors.forEach((cat, i) => {
          colorLegend
            .append("rect")
            .attr("x", 0)
            .attr("y", 15 + i * 20)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", cat.color)
          colorLegend
            .append("text")
            .attr("x", 15)
            .attr("y", 15 + i * 20)
            .attr("dy", "0.7em")
            .text(cat.value)
        })
        currentLegendY += 15 + symbolDimension.categoricalColors.length * 20
      }
    }

    // Choropleth Color Legend
    if (mapType === "choropleth" && dimensionSettings.choropleth.colorBy) {
      const choroplethDimension = dimensionSettings.choropleth

      const colorLegend = legendGroup.append("g").attr("transform", `translate(0, ${currentLegendY})`)
      colorLegend.append("text").attr("x", 0).attr("y", 0).attr("dy", "0.35em").text("Color by:")

      if (choroplethDimension.colorScale === "linear") {
        const gradientId = `choropleth-color-gradient-${Math.random().toString(36).substring(7)}`
        const linearGradient = svg
          .append("defs")
          .append("linearGradient")
          .attr("id", gradientId)
          .attr("x1", "0%")
          .attr("y1", "0%")
          .attr("x2", "100%")
          .attr("y2", "0%")

        linearGradient.append("stop").attr("offset", "0%").attr("stop-color", choroplethDimension.colorMinColor)
        linearGradient.append("stop").attr("offset", "100%").attr("stop-color", choroplethDimension.colorMaxColor)

        colorLegend
          .append("rect")
          .attr("x", 0)
          .attr("y", 15)
          .attr("width", 100)
          .attr("height", 10)
          .style("fill", `url(#${gradientId})`)

        colorLegend
          .append("text")
          .attr("x", 0)
          .attr("y", 30)
          .attr("dy", "0.35em")
          .text(choroplethDimension.colorMinValue.toFixed(0))
        colorLegend
          .append("text")
          .attr("x", 100)
          .attr("y", 30)
          .attr("dy", "0.35em")
          .attr("text-anchor", "end")
          .text(choroplethDimension.colorMaxValue.toFixed(0))

        currentLegendY += 40
      } else if (choroplethDimension.colorScale === "categorical") {
        choroplethDimension.categoricalColors.forEach((cat, i) => {
          colorLegend
            .append("rect")
            .attr("x", 0)
            .attr("y", 15 + i * 20)
            .attr("width", 10)
            .attr("height", 10)
            .attr("fill", cat.color)
          colorLegend
            .append("text")
            .attr("x", 15)
            .attr("y", 15 + i * 20)
            .attr("dy", "0.7em")
            .text(cat.value)
        })
        currentLegendY += 15 + choroplethDimension.categoricalColors.length * 20
      }
    }
  }, [
    symbolData,
    choroplethData,
    symbolColumns,
    choroplethColumns,
    mapType,
    dimensionSettings,
    stylingSettings,
    geoAtlasData,
    selectedGeography,
    selectedProjection,
  ])

  useEffect(() => {
    renderMap()
  }, [renderMap])

  const downloadSvg = () => {
    const svgElement = svgRef.current
    if (svgElement) {
      const svgString = new XMLSerializer().serializeToString(svgElement)
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "map.svg"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast({
        title: "SVG Downloaded",
        description: "Your map SVG has been downloaded successfully.",
      })
    }
  }

  const copySvgCode = () => {
    const svgElement = svgRef.current
    if (svgElement) {
      const svgString = new XMLSerializer().serializeToString(svgElement)
      navigator.clipboard
        .writeText(svgString)
        .then(() => {
          toast({
            title: "SVG Copied",
            description: "Map SVG code copied to clipboard.",
          })
        })
        .catch((err) => {
          console.error("Failed to copy SVG: ", err)
          toast({
            title: "Copy Failed",
            description: "Could not copy SVG code to clipboard.",
            variant: "destructive",
          })
        })
    }
  }

  const hasDataToDisplay =
    (mapType === "symbol" && symbolDataExists) ||
    (mapType === "choropleth" && choroplethDataExists) ||
    (mapType === "custom" && customMapData)

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Map Preview</CardTitle>
        <div className="flex space-x-2">
          <Button onClick={downloadSvg} disabled={!hasDataToDisplay} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download SVG
          </Button>
          <Button onClick={copySvgCode} disabled={!hasDataToDisplay} variant="outline">
            <Copy className="mr-2 h-4 w-4" />
            Copy SVG Code
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-hidden rounded-lg border">
          {hasDataToDisplay ? (
            <svg ref={svgRef} width={width} height={height} viewBox={`0 0 ${width} ${height}`}></svg>
          ) : (
            <div className="flex h-[600px] items-center justify-center text-gray-500 dark:text-gray-400">
              No data loaded or map type selected. Please load data and configure dimensions.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
