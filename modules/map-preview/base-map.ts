import * as d3 from 'd3'
import * as topojson from 'topojson-client'

import type {
  GeographyKey,
  ProjectionType,
  StylingSettings,
} from '@/app/(studio)/types'
import type { TopoJSONData } from './types'
import { findCountryFeature, getSubnationalLabel } from './geography'
import type { CountryFinder } from './geography'

type SvgSelection = d3.Selection<SVGSVGElement, unknown, null, undefined>

type ToastFn = (options: any) => void

// Helper functions to safely extract features from TopoJSON
const extractFeatures = (data: TopoJSONData, object: any): any[] => {
  const result = topojson.feature(data as any, object)
  if (result && 'features' in result) {
    return (result as any).features
  }
  return Array.isArray(result) ? result : [result]
}

const extractFeature = (data: TopoJSONData, object: any): any => {
  return topojson.feature(data as any, object) as any
}

const extractMesh = (data: TopoJSONData, object: any, filter?: (a: any, b: any) => boolean): any => {
  if (filter) {
    return topojson.mesh(data as any, object, filter)
  }
  return topojson.mesh(data as any, object)
}

interface RenderBaseMapParams {
  svg: SvgSelection
  width: number
  mapHeight: number
  selectedProjection: ProjectionType
  selectedGeography: GeographyKey
  clipToCountry: boolean
  customMapData: string
  geoAtlasData: TopoJSONData | null
  stylingSettings: StylingSettings
  toast: ToastFn
  findCountryFeature: CountryFinder
}

interface RenderBaseMapResult {
  projection: d3.GeoProjection
  path: d3.GeoPath<any, d3.GeoPermissibleObjects>
}

export const renderBaseMap = ({
  svg,
  width,
  mapHeight,
  selectedProjection,
  selectedGeography,
  clipToCountry,
  customMapData,
  geoAtlasData,
  stylingSettings,
  toast,
}: RenderBaseMapParams): RenderBaseMapResult => {
  const projection = createProjection(selectedProjection, width, mapHeight)
  const path = d3.geoPath().projection(projection)

  if (customMapData && customMapData.trim().length > 0) {
    renderCustomMap({ svg, customMapData, stylingSettings, toast })
    return { projection, path }
  }

  if (geoAtlasData) {
    renderTopoMap({
      svg,
      projection,
      path,
      mapHeight,
      width,
      selectedProjection,
      selectedGeography,
      clipToCountry,
      geoAtlasData,
      stylingSettings,
      toast,
      findCountryFeature,
    })
  }

  return { projection, path }
}

const createProjection = (selectedProjection: ProjectionType, width: number, mapHeight: number) => {
  if (selectedProjection === 'albersUsa') {
    return d3.geoAlbersUsa().scale(1300).translate([width / 2, mapHeight / 2])
  }
  if (selectedProjection === 'albers') {
    return d3.geoAlbers().scale(1300).translate([width / 2, mapHeight / 2])
  }
  if (selectedProjection === 'mercator') {
    return d3.geoMercator().scale(150).translate([width / 2, mapHeight / 2])
  }
  if (selectedProjection === 'equalEarth') {
    return d3.geoEqualEarth().scale(150).translate([width / 2, mapHeight / 2])
  }
  return d3.geoAlbersUsa().scale(1300).translate([width / 2, mapHeight / 2])
}

interface RenderCustomMapParams {
  svg: SvgSelection
  customMapData: string
  stylingSettings: StylingSettings
  toast: ToastFn
}

const renderCustomMap = ({ svg, customMapData, stylingSettings, toast }: RenderCustomMapParams) => {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(customMapData, 'image/svg+xml')

    const errorNode = doc.querySelector('parsererror')
    if (errorNode) {
      toast({
        title: 'Custom Map Error',
        description: `SVG parsing error: ${errorNode.textContent}`,
        variant: 'destructive',
        duration: 5000,
      })
      return
    }

    const customMapElement = doc.documentElement
    const importedGroup = d3.select(customMapElement).select('#Map')

    if (!importedGroup.empty()) {
      const node = importedGroup.node()
      if (node && node instanceof Element) {
        const importedMapGroup = document.importNode(node, true)
        svg.node()?.appendChild(importedMapGroup)
      }
    } else {
      const mapGroup = svg.append('g').attr('id', 'Map')
      const mapGroupNode = mapGroup.node()
      if (mapGroupNode) {
        Array.from(customMapElement.children).forEach((child) => {
          const importedChild = document.importNode(child, true)
          mapGroupNode.appendChild(importedChild)
        })
      }
    }

    let nationsGroup = svg.select('#Nations')
    let statesOrCountiesGroup = svg.select('#States')

    if (nationsGroup.empty()) {
      nationsGroup = svg.select('#Countries')
    }
    if (statesOrCountiesGroup.empty()) {
      statesOrCountiesGroup = svg.select('#Counties, #Provinces, #Regions')
    }

    if (!nationsGroup.empty()) {
      nationsGroup
        .selectAll('path')
        .attr('fill', stylingSettings.base.nationFillColor)
        .attr('stroke', stylingSettings.base.nationStrokeColor)
        .attr('stroke-width', stylingSettings.base.nationStrokeWidth)
    }

    if (!statesOrCountiesGroup.empty()) {
      statesOrCountiesGroup
        .selectAll('path')
        .attr('fill', stylingSettings.base.defaultStateFillColor)
        .attr('stroke', stylingSettings.base.defaultStateStrokeColor)
        .attr('stroke-width', stylingSettings.base.defaultStateStrokeWidth)
    }
  } catch (error: any) {
    toast({
      title: 'Custom Map Error',
      description: `Error processing custom map data: ${error.message}`,
      variant: 'destructive',
      duration: 5000,
    })
  }
}

interface RenderTopoMapParams {
  svg: SvgSelection
  projection: d3.GeoProjection
  path: d3.GeoPath<any, d3.GeoPermissibleObjects>
  mapHeight: number
  width: number
  selectedProjection: ProjectionType
  selectedGeography: GeographyKey
  clipToCountry: boolean
  geoAtlasData: TopoJSONData
  stylingSettings: StylingSettings
  toast: ToastFn
  findCountryFeature: CountryFinder
}

const renderTopoMap = ({
  svg,
  projection,
  path,
  mapHeight,
  width,
  selectedProjection,
  selectedGeography,
  clipToCountry,
  geoAtlasData,
  stylingSettings,
  toast,
}: RenderTopoMapParams) => {
  const mapGroup = svg.append('g').attr('id', 'Map')
  const nationsGroup = mapGroup.append('g').attr('id', 'Nations')
  const statesOrCountiesGroup = mapGroup.append('g').attr('id', 'StatesOrCounties')

  let geoFeatures: any[] = []
  let nationMesh: any = null
  let countryFeatureForClipping: any = null

  const { objects } = geoAtlasData

  if (!objects) {
    toast({
      title: 'Invalid TopoJSON',
      description: 'The downloaded map file is missing required data.',
      variant: 'destructive',
    })
    return
  }

  if (selectedGeography === 'usa-states') {
    if (!objects.nation || !objects.states) {
      toast({
        title: 'Map data error',
        description: 'US states map data is incomplete.',
        variant: 'destructive',
        duration: 4000,
      })
      return
    }
    nationMesh = extractMesh(geoAtlasData, objects.nation)
    countryFeatureForClipping = extractFeature(geoAtlasData, objects.nation)
    geoFeatures = extractFeatures(geoAtlasData, objects.states)
  } else if (selectedGeography === 'usa-counties') {
    if (!objects.nation || !objects.counties) {
      toast({
        title: 'Map data error',
        description: 'US counties map data is incomplete.',
        variant: 'destructive',
        duration: 4000,
      })
      return
    }
    nationMesh = extractMesh(geoAtlasData, objects.nation)
    countryFeatureForClipping = extractFeature(geoAtlasData, objects.nation)
    geoFeatures = extractFeatures(geoAtlasData, objects.counties)
  } else if (selectedGeography === 'canada-provinces') {
    // Canada Provinces: use canada-specific atlas (matching main branch)
    if (objects.provinces) {
      // Has provinces - render them with nation outline
      const nationSource = objects.nation || objects.countries
      if (nationSource) {
        nationMesh = extractMesh(geoAtlasData, nationSource)
        countryFeatureForClipping = extractFeature(geoAtlasData, nationSource)
      }
      geoFeatures = extractFeatures(geoAtlasData, objects.provinces)
    } else if (objects.admin1) {
      // Extract admin1 features and filter for Canada
      const allAdmin1Features = extractFeatures(geoAtlasData, objects.admin1)
      geoFeatures = allAdmin1Features.filter((feature: any) => {
        const props = feature.properties ?? {}
        const countryCode = props.iso_a2 || props.adm0_a3 || props.admin
        const countryName = props.adm0_name || props.admin
        return (
          countryCode === 'CA' ||
          countryCode === 'CAN' ||
          countryName === 'Canada' ||
          String(feature.id).includes('CAN') ||
          String(feature.id).includes('canada')
        )
      })
      
      // Get Canada country boundary for clipping
      if (objects.countries) {
        const allCountries = extractFeatures(geoAtlasData, objects.countries)
        countryFeatureForClipping = findCountryFeature(allCountries, ['Canada', 'CAN', 124])
        if (countryFeatureForClipping) {
          nationMesh = extractMesh(geoAtlasData, countryFeatureForClipping)
        }
      }
      
      if (geoFeatures.length === 0) {
        toast({
          title: 'Map data warning',
          description: 'Could not find Canadian provinces in the map data. Showing country boundary only.',
          variant: 'destructive',
          duration: 5000,
        })
        // Fall back to country boundary
        const allCountries = extractFeatures(geoAtlasData, objects.countries)
        countryFeatureForClipping = findCountryFeature(allCountries, ['Canada', 'CAN', 124])
        if (countryFeatureForClipping) {
          nationMesh = extractMesh(geoAtlasData, countryFeatureForClipping)
        }
      }
    } else if (objects.countries) {
      const allCountries = extractFeatures(geoAtlasData, objects.countries)
      countryFeatureForClipping = findCountryFeature(allCountries, ['Canada', 'CAN', 124])
      if (countryFeatureForClipping) {
        nationMesh = extractMesh(geoAtlasData, countryFeatureForClipping)
        // Show warning that provinces are not available
        toast({
          title: 'Map data warning',
          description: 'Province-level data is not available. Showing country boundary only.',
          variant: 'destructive',
          duration: 5000,
        })
      }
    } else {
      toast({
        title: 'Map data error',
        description: 'Canada map data is incomplete. Please try a different geography or check your connection.',
        variant: 'destructive',
        duration: 5000,
      })
      return
    }
  } else if (selectedGeography === 'usa-nation' || selectedGeography === 'canada-nation') {
    if (objects.countries) {
      const allCountries = extractFeatures(geoAtlasData, objects.countries)
      const targetCountryName = selectedGeography === 'usa-nation' ? 'United States' : 'Canada'
      const specificCountryFeature = findCountryFeature(allCountries, [
        targetCountryName,
        targetCountryName === 'United States' ? 'USA' : 'CAN',
        targetCountryName === 'United States' ? 840 : 124,
      ])
      if (specificCountryFeature) {
        nationMesh = extractMesh(geoAtlasData, specificCountryFeature)
        countryFeatureForClipping = specificCountryFeature
        geoFeatures = [specificCountryFeature]
      } else {
        nationMesh = extractMesh(geoAtlasData, objects.countries)
        geoFeatures = extractFeatures(geoAtlasData, objects.countries)
      }
    }
  } else if (selectedGeography === 'world') {
    const countriesSource = objects.countries || objects.land
    if (!countriesSource) {
      toast({
        title: 'Map data error',
        description: 'The world map data is incomplete.',
        variant: 'destructive',
        duration: 4000,
      })
      return
    }
    nationMesh = extractMesh(geoAtlasData, countriesSource, (a: any, b: any) => a !== b)
    countryFeatureForClipping = extractFeature(geoAtlasData, countriesSource)
    geoFeatures = extractFeatures(geoAtlasData, countriesSource)
  }

  if (clipToCountry && countryFeatureForClipping && selectedProjection !== 'albersUsa') {
    const clipPathId = 'clip-path-country'
    const defs = svg.append('defs')
    defs.append('clipPath').attr('id', clipPathId).append('path').attr('d', path(countryFeatureForClipping))
    mapGroup.attr('clip-path', `url(#${clipPathId})`)
    projection.fitSize([width, mapHeight], countryFeatureForClipping)
    path.projection(projection)
  } else if (geoFeatures.length > 0 && selectedProjection !== 'albersUsa') {
    const featureCollection = { type: 'FeatureCollection', features: geoFeatures }
    projection.fitSize([width, mapHeight], featureCollection as any)
    path.projection(projection)
  } else {
    mapGroup.attr('clip-path', null)
  }

  if (nationMesh) {
    nationsGroup
      .append('path')
      .attr('id', getNationId(selectedGeography))
      .attr('fill', stylingSettings.base.nationFillColor)
      .attr('stroke', stylingSettings.base.nationStrokeColor)
      .attr('stroke-width', stylingSettings.base.nationStrokeWidth)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', path(nationMesh))
  }

  statesOrCountiesGroup
    .selectAll('path')
    .data(geoFeatures)
    .join('path')
    .attr('id', (feature: any) => {
      const identifier = feature.properties?.postal || feature.properties?.name || feature.id
      const prefix = getSubnationalLabel(selectedGeography, false)
      return `${prefix}-${identifier || ''}`
    })
    .attr('fill', (d: any) =>
      selectedGeography === 'world' || selectedGeography === 'usa-nation' || selectedGeography === 'canada-nation'
        ? stylingSettings.base.nationFillColor
        : stylingSettings.base.defaultStateFillColor,
    )
    .attr('stroke', (d: any) =>
      selectedGeography === 'world' || selectedGeography === 'usa-nation' || selectedGeography === 'canada-nation'
        ? stylingSettings.base.nationStrokeColor
        : stylingSettings.base.defaultStateStrokeColor,
    )
    .attr('stroke-width', (d: any) =>
      selectedGeography === 'world' || selectedGeography === 'usa-nation' || selectedGeography === 'canada-nation'
        ? stylingSettings.base.nationStrokeWidth
        : stylingSettings.base.defaultStateStrokeWidth,
    )
    .attr('stroke-linejoin', 'round')
    .attr('stroke-linecap', 'round')
    .attr('d', path as any)
}

const getNationId = (selectedGeography: GeographyKey) => {
  if (selectedGeography === 'usa-nation') return 'Country-US'
  if (selectedGeography === 'canada-nation') return 'Country-CA'
  return 'World-Outline'
}
