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
}

