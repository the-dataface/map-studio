// TopoJSONData represents a TopoJSON topology structure
// We use a loose type here since topojson-client types don't export all needed types
export interface TopoJSONData {
  type: 'Topology'
  objects: {
    nation?: any
    states?: any
    countries?: any
    counties?: any
    provinces?: any
    land?: any
    [key: string]: any
  }
  arcs: any[]
}

export interface FetchTopoJSONOptions {
  urls: string[]
  expectedObjects?: string[]
}
