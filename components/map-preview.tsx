'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

import type {
  ColumnFormat,
  ColumnType,
  DataRow,
  DimensionSettings,
  GeocodedRow,
  GeographyKey,
  MapType,
  ProjectionType,
  StylingSettings,
} from '@/app/(studio)/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Download, Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import { formatLegendValue, renderLabelPreview } from '@/modules/data-ingest/formatting'
import { useGeoAtlasData } from '@/modules/map-preview/use-geo-atlas'
import { renderBaseMap } from '@/modules/map-preview/base-map'
import { renderSymbols } from '@/modules/map-preview/symbols'
import { applyChoroplethColors } from '@/modules/map-preview/choropleth'
import { renderSymbolLabels, renderChoroplethLabels } from '@/modules/map-preview/labels'
import { estimateLegendHeight, renderLegends } from '@/modules/map-preview/legends'
import {
  getNumericValue,
  getUniqueValues,
  getSymbolPathData,
} from '@/modules/map-preview/helpers'
import {
  normalizeGeoIdentifier,
  extractCandidateFromSVGId,
  findCountryFeature,
  getSubnationalLabel,
} from '@/modules/map-preview/geography'
import { generateMapDescription, generateMapSummary } from '@/lib/accessibility/map-description'

type DataRecord = DataRow | GeocodedRow

export interface MapPreviewProps {
  symbolData: DataRecord[]
  choroplethData: DataRecord[]
  mapType: MapType
  dimensionSettings: DimensionSettings
  stylingSettings: StylingSettings
  symbolDataExists: boolean
  choroplethDataExists: boolean
  columnTypes: ColumnType
  columnFormats: ColumnFormat
  customMapData: string
  selectedGeography: GeographyKey
  selectedProjection: ProjectionType
  clipToCountry: boolean
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
}

const MAP_WIDTH = 975
const MAP_HEIGHT = 610

export function MapPreview({
	symbolData,
	choroplethData,
	mapType,
	dimensionSettings,
	stylingSettings,
	symbolDataExists,
	choroplethDataExists,
	columnTypes,
	columnFormats,
	customMapData,
  selectedGeography,
  selectedProjection,
  clipToCountry,
	isExpanded,
	setIsExpanded,
}: MapPreviewProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()
  const { geoAtlasData, isLoading } = useGeoAtlasData({
    selectedGeography,
    notify: (options) => {
      toast(options as Parameters<typeof toast>[0])
    },
  })

	useEffect(() => {
    if (!svgRef.current || !mapContainerRef.current || !geoAtlasData) {
      return
    }

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

		// Determine what should be rendered
		const shouldRenderSymbols =
			symbolDataExists &&
			dimensionSettings?.symbol?.latitude &&
			dimensionSettings?.symbol?.longitude &&
			symbolData.length > 0 &&
      !customMapData

		const shouldRenderChoropleth =
			choroplethDataExists &&
			dimensionSettings?.choropleth?.stateColumn &&
			dimensionSettings?.choropleth?.colorBy &&
      choroplethData.length > 0

    // Calculate legend flags
		const shouldShowSymbolSizeLegend =
			shouldRenderSymbols &&
			dimensionSettings.symbol.sizeBy &&
      dimensionSettings.symbol.sizeMinValue !== dimensionSettings.symbol.sizeMaxValue

    const shouldShowSymbolColorLegend = shouldRenderSymbols && dimensionSettings.symbol.colorBy
    const shouldShowChoroplethColorLegend = shouldRenderChoropleth && dimensionSettings.choropleth.colorBy

    const legendHeight = estimateLegendHeight({
      showSymbolSizeLegend: !!shouldShowSymbolSizeLegend,
      showSymbolColorLegend: !!shouldShowSymbolColorLegend,
      showChoroplethColorLegend: !!shouldShowChoroplethColorLegend,
    })

    const totalHeight = MAP_HEIGHT + legendHeight

    // Set container background
    if (mapContainerRef.current) {
      mapContainerRef.current.style.backgroundColor = stylingSettings.base.mapBackgroundColor
    }

    // Configure SVG
    svg
      .attr('viewBox', `0 0 ${MAP_WIDTH} ${totalHeight}`)
			.attr('width', '100%')
			.attr('height', '100%')
      .attr('style', 'max-width: 100%; height: auto;')

    // Render base map (custom SVG or TopoJSON)
    const { projection, path } = renderBaseMap({
      svg,
      width: MAP_WIDTH,
      mapHeight: MAP_HEIGHT,
      selectedProjection,
      selectedGeography,
      clipToCountry,
      customMapData,
      geoAtlasData,
      stylingSettings,
      toast,
      findCountryFeature,
    })

    let symbolSizeScale: d3.ScaleLinear<number, number, never> | null = null
    let symbolColorScale: ((value: unknown) => string) | null = null
    let choroplethColorScale: ((value: unknown) => string) | null = null

    // Render symbols if applicable
		if (shouldRenderSymbols) {
      const symbolResult = renderSymbols({
        svg,
        projection,
        symbolData,
        dimensionSettings,
        stylingSettings,
        getNumericValue,
        getUniqueValues,
        getSymbolPathData,
      })
      symbolSizeScale = symbolResult.sizeScale
      symbolColorScale = symbolResult.colorScale as ((value: unknown) => string) | null

      // Render symbol labels
      renderSymbolLabels({
        svg,
        projection,
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        symbolData: symbolResult.validSymbolData,
        dimensionSettings,
        stylingSettings,
							columnTypes,
							columnFormats,
        selectedGeography,
        sizeScale: symbolSizeScale,
        renderLabelPreview,
        getSymbolPathData,
      })
    }

    // Apply choropleth colors if applicable
    if (shouldRenderChoropleth) {
      const choroplethScaleResult = applyChoroplethColors({
        svg,
        choroplethData,
        dimensionSettings,
        stylingSettings,
								columnTypes,
								columnFormats,
        selectedGeography,
        customMapData,
        normalizeGeoIdentifier,
        extractCandidateFromSVGId,
        getNumericValue,
        getUniqueValues,
      })
      if (choroplethScaleResult) {
        // Check if it's a categorical scale (function) or linear scale (d3 scale)
        const isCategorical = 'domain' in choroplethScaleResult === false
        if (isCategorical && typeof choroplethScaleResult === 'function') {
          // Categorical scale
          choroplethColorScale = choroplethScaleResult as (value: unknown) => string
						} else {
          // Linear scale - wrap it
          const linearScale = choroplethScaleResult as d3.ScaleLinear<number, string, never>
          choroplethColorScale = ((value: unknown) => {
            const numValue = typeof value === 'number' ? value : Number(value)
            if (!Number.isNaN(numValue)) {
              return linearScale(numValue)
            }
            return String(value)
          }) as (value: unknown) => string
        }
						} else {
        choroplethColorScale = null
      }

      // Render choropleth labels
      renderChoroplethLabels({
        svg,
        path,
        projection,
        choroplethData,
        dimensionSettings,
        stylingSettings,
						columnTypes,
						columnFormats,
        selectedGeography,
        mapType,
        geoAtlasData,
        customMapData,
        normalizeGeoIdentifier,
        extractCandidateFromSVGId,
        getSubnationalLabel,
        renderLabelPreview,
        findCountryFeature,
      })
    }

    // Render legends
    renderLegends({
      svg,
      width: MAP_WIDTH,
      mapHeight: MAP_HEIGHT,
      showSymbolSizeLegend: !!shouldShowSymbolSizeLegend,
      showSymbolColorLegend: !!shouldShowSymbolColorLegend,
      showChoroplethColorLegend: !!shouldShowChoroplethColorLegend,
		dimensionSettings,
		stylingSettings,
		columnTypes,
		columnFormats,
		selectedGeography,
      symbolData: shouldRenderSymbols ? symbolData : [],
      choroplethData: shouldRenderChoropleth ? choroplethData : [],
      symbolColorScale,
      choroplethColorScale,
      getUniqueValues,
      formatLegendValue,
      getSymbolPathData,
    })
	}, [
		geoAtlasData,
		symbolData,
		choroplethData,
		mapType,
		dimensionSettings,
		stylingSettings,
		symbolDataExists,
		choroplethDataExists,
		columnTypes,
		columnFormats,
    customMapData,
		selectedGeography,
		selectedProjection,
    clipToCountry,
		toast,
  ])

	useEffect(() => {
    const handler = () => setIsExpanded(false)
    window.addEventListener('collapse-all-panels', handler)
    return () => window.removeEventListener('collapse-all-panels', handler)
  }, [setIsExpanded])

	const handleDownloadSVG = () => {
    if (!svgRef.current) return

    try {
      const svgElement = svgRef.current
      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(svgElement)

      const blob = new Blob([svgString], { type: 'image/svg+xml' })
      const url = URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = 'map.svg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)

			toast({
				icon: <Download className="h-4 w-4" />,
				description: 'SVG downloaded successfully.',
				duration: 3000,
      })
		} catch (error) {
      console.error('Error downloading SVG:', error)
			toast({
				title: 'Download failed',
				description: 'Failed to download SVG file',
				variant: 'destructive',
				duration: 3000,
      })
		}
  }

	const handleCopySVG = async () => {
    if (!svgRef.current) return

    try {
      const svgElement = svgRef.current
      const serializer = new XMLSerializer()
      const svgString = serializer.serializeToString(svgElement)

      await navigator.clipboard.writeText(svgString)

			toast({
				icon: <Copy className="h-4 w-4" />,
				description: 'SVG copied to clipboard.',
				duration: 3000,
      })
		} catch (error) {
      console.error('Error copying SVG:', error)
			toast({
				title: 'Copy failed',
				description: 'Failed to copy SVG to clipboard',
				variant: 'destructive',
				duration: 3000,
      })
		}
  }

	// Generate accessible map description
	const mapDescription = generateMapDescription({
		mapType,
		geography: selectedGeography,
		symbolDataCount: symbolData.length,
		choroplethDataCount: choroplethData.length,
		hasSymbolSizeMapping: !!dimensionSettings.symbol.sizeBy,
		hasSymbolColorMapping: !!dimensionSettings.symbol.colorBy,
		hasChoroplethColorMapping: !!dimensionSettings.choropleth.colorBy,
		symbolSizeColumn: dimensionSettings.symbol.sizeBy,
		symbolColorColumn: dimensionSettings.symbol.colorBy,
		choroplethColorColumn: dimensionSettings.choropleth.colorBy,
	})

	const mapSummary = generateMapSummary({
		mapType,
		geography: selectedGeography,
		symbolDataCount: symbolData.length,
		choroplethDataCount: choroplethData.length,
		hasSymbolSizeMapping: !!dimensionSettings.symbol.sizeBy,
		hasSymbolColorMapping: !!dimensionSettings.symbol.colorBy,
		hasChoroplethColorMapping: !!dimensionSettings.choropleth.colorBy,
	})

	const mapId = `map-preview-${selectedGeography}`

	if (isLoading) {
		return (
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Map Preview</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center h-64" role="status" aria-live="polite">
						<div className="text-muted-foreground">Loading map data...</div>
					</div>
				</CardContent>
			</Card>
    )
	}

	return (
		<Card className="shadow-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 transition-all duration-300 ease-in-out overflow-hidden">
			<CardHeader
				className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ease-in-out py-4 px-6 rounded-t-xl relative"
				onClick={() => setIsExpanded(!isExpanded)}
				onKeyDown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') {
						e.preventDefault()
						setIsExpanded(!isExpanded)
					}
				}}
				role="button"
				tabIndex={0}
				aria-expanded={isExpanded}
				aria-controls={mapId}>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
            <CardTitle className="text-gray-900 dark:text-white transition-colors duration-200">
              Map preview
            </CardTitle>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							className={cn(
								'flex items-center gap-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700',
								'group'
							)}
							onClick={(e) => {
                e.stopPropagation()
                handleCopySVG()
							}}
							aria-label="Copy SVG to clipboard for use in Figma">
							<Copy className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
							<span className="sr-only">Copy to Figma</span>
							<span aria-hidden="true">Copy to Figma</span>
						</Button>
						<Button
							variant="outline"
							size="sm"
							className={cn(
								'flex items-center gap-2 transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700',
								'group'
							)}
							onClick={(e) => {
                e.stopPropagation()
                handleDownloadSVG()
							}}
							aria-label="Download map as SVG file">
							<Download className="h-3 w-3 transition-transform duration-300 group-hover:translate-y-1" aria-hidden="true" />
							<span className="sr-only">Download SVG</span>
							<span aria-hidden="true">Download SVG</span>
						</Button>
						{isExpanded ? (
							<ChevronUp className="h-4 w-4" aria-hidden="true" />
						) : (
							<ChevronDown className="h-4 w-4" aria-hidden="true" />
						)}
					</div>
				</div>
			</CardHeader>
      <CardContent
        className={cn('transition-all duration-200', isExpanded ? 'pb-6 pt-2' : 'pb-0 h-0 overflow-hidden')}
				id={mapId}
				aria-hidden={!isExpanded}>
				<div
					ref={mapContainerRef}
					className="w-full border rounded-lg overflow-hidden"
					style={{
						backgroundColor: stylingSettings.base.mapBackgroundColor,
					}}>
					<svg
						ref={svgRef}
						className="w-full h-full"
						role="img"
						aria-label={mapSummary}
						aria-describedby={`${mapId}-description`}
					/>
					<div id={`${mapId}-description`} className="sr-only">
						{mapDescription}
					</div>
				</div>
			</CardContent>
		</Card>
  )
}
