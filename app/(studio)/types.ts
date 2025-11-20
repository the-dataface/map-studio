export type MapType = "symbol" | "choropleth" | "custom"

export type GeographyKey =
  | "usa-states"
  | "usa-counties"
  | "usa-nation"
  | "canada-provinces"
  | "canada-nation"
  | "world"

export type ProjectionType = "albersUsa" | "mercator" | "equalEarth" | "albers"

export interface DataRow {
  [key: string]: string | number | boolean | undefined
}

export interface GeocodedRow extends DataRow {
  latitude?: number
  longitude?: number
  geocoded?: boolean
  source?: string
  processing?: boolean
}

export interface DataState {
  rawData: string
  parsedData: DataRow[]
  geocodedData: GeocodedRow[]
  columns: string[]
  customMapData: string
}

export interface ColumnType {
  [key: string]: "text" | "number" | "date" | "coordinate" | "state" | "country"
}

export interface ColumnFormat {
  [key: string]: string
}

export interface SavedStyle {
  id: string
  name: string
  type: "preset" | "user"
  settings: {
    mapBackgroundColor: string
    nationFillColor: string
    nationStrokeColor: string
    nationStrokeWidth: number
    defaultStateFillColor: string
    defaultStateStrokeColor: string
    defaultStateStrokeWidth: number
  }
}

export type ColorScaleType = "linear" | "categorical"

export interface CategoricalColor {
  value: string
  color: string
}

export interface SymbolDimensionSettings {
  latitude: string
  longitude: string
  sizeBy: string
  sizeMin: number
  sizeMax: number
  sizeMinValue: number
  sizeMaxValue: number
  colorBy: string
  colorScale: ColorScaleType
  colorPalette: string
  colorMinValue: number
  colorMidValue: number
  colorMaxValue: number
  colorMinColor: string
  colorMidColor: string
  colorMaxColor: string
  categoricalColors: CategoricalColor[]
  labelTemplate: string
}

export interface ChoroplethDimensionSettings {
  stateColumn: string
  colorBy: string
  colorScale: ColorScaleType
  colorPalette: string
  colorMinValue: number
  colorMidValue: number
  colorMaxValue: number
  colorMinColor: string
  colorMidColor: string
  colorMaxColor: string
  categoricalColors: CategoricalColor[]
  labelTemplate: string
}

export interface DimensionSettings {
  symbol: SymbolDimensionSettings
  choropleth: ChoroplethDimensionSettings
  custom: ChoroplethDimensionSettings
  selectedGeography: GeographyKey
}

export interface IndividualLabelOverride {
  id: string // Unique identifier: "symbol-{index}" or "choropleth-{featureId}"
  x?: number // Override x position (SVG coordinates)
  y?: number // Override y position (SVG coordinates)
  fontFamily?: string
  fontStyle?: 'normal' | 'italic'
  fontWeight?: 'normal' | 'bold'
  fontSize?: number
  textAnchor?: 'start' | 'middle' | 'end'
  dominantBaseline?: 'baseline' | 'middle' | 'hanging'
  fill?: string
  stroke?: string
  strokeWidth?: number
  textDecoration?: string // For underline/strikethrough: 'underline', 'line-through', 'underline line-through', or ''
}

export interface PathPoint {
  x: number
  y: number
  type: 'line' | 'curve' // 'line' for straight segments, 'curve' for bezier curves
  controlPoint1?: { x: number; y: number } // For curves: first control point
  controlPoint2?: { x: number; y: number } // For curves: second control point (for cubic bezier)
}

export type PathMarkerType = 'none' | 'line-arrow' | 'triangle-arrow' | 'open-circle' | 'closed-circle' | 'square' | 'round'

export interface DrawnPath {
  id: string // Unique identifier: "path-{timestamp}-{index}"
  points: PathPoint[] // Array of points that make up the path
  stroke?: string // Stroke color
  strokeWidth?: number // Stroke width
  strokeDasharray?: string // For dashed lines (e.g., "5,5")
  strokeLinecap?: 'butt' | 'round' | 'square' // Line cap style
  strokeLinejoin?: 'miter' | 'round' | 'bevel' // Line join style
  fill?: string // Fill color (usually 'none' for paths)
  opacity?: number // Overall opacity
  strokeOutline?: string // Outline/stroke behind the main stroke
  strokeOutlineWidth?: number // Width of the outline stroke
  startMarker?: PathMarkerType // Marker at the start of the path
  endMarker?: PathMarkerType // Marker at the end of the path
  borderRadius?: number // Border radius for rounded corners (0 = sharp)
}

export interface StylingSettings {
  activeTab: "base" | "symbol" | "choropleth"
  base: {
    mapBackgroundColor: string
    nationFillColor: string
    nationStrokeColor: string
    nationStrokeWidth: number
    defaultStateFillColor: string
    defaultStateStrokeColor: string
    defaultStateStrokeWidth: number
    savedStyles: SavedStyle[]
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
  individualLabelOverrides?: Record<string, IndividualLabelOverride>
  drawnPaths?: DrawnPath[] // Array of user-drawn paths
  defaultPathStyles?: {
    stroke: string
    strokeWidth: number
    strokeDasharray?: string
    strokeLinecap?: 'butt' | 'round' | 'square'
    strokeLinejoin?: 'miter' | 'round' | 'bevel'
    fill?: string
    opacity?: number
  }
}

