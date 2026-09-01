'use client'

import { lazy, Suspense, useState } from 'react'
import type {
  CanvasType,
  ColumnType,
  DimensionSettings,
  MapLayer,
  MapLibreConfig,
  StylingSettings,
} from '@/app/(studio)/types'
import { BASEMAP_STYLES } from '@/modules/map-render/maplibre/basemap-styles'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { sortLayers } from '@/modules/layers/selectors'
import { StudioInspectorBlock } from '@/components/studio-panel'

const MapStyling = lazy(() =>
  import('@/components/map-styling').then((mod) => ({ default: mod.MapStyling })),
)

const DimensionMapping = lazy(() =>
  import('@/components/dimension-mapping').then((mod) => ({ default: mod.DimensionMapping })),
)

type InspectorScope =
  | 'base'
  | 'symbol'
  | 'symbol-labels'
  | 'symbol-text'
  | 'choropleth-labels'

interface LayerStylingInspectorProps {
  layers: MapLayer[]
  stylingSettings: StylingSettings
  onUpdateStylingSettings: (settings: StylingSettings) => void
  dimensionSettings: DimensionSettings
  onUpdateDimensionSettings: (settings: Pick<DimensionSettings, 'symbol' | 'choropleth'>) => void
  columnTypes: ColumnType
  columnFormats: Record<string, string>
  symbolParsedData: import('@/app/(studio)/types').DataRow[]
  symbolGeocodedData: import('@/app/(studio)/types').GeocodedRow[]
  symbolColumns: string[]
  choroplethParsedData: import('@/app/(studio)/types').DataRow[]
  choroplethGeocodedData: import('@/app/(studio)/types').GeocodedRow[]
  choroplethColumns: string[]
  selectedGeography: string
  customDataExists: boolean
  canvasType?: CanvasType
  maplibreConfig?: MapLibreConfig
  onMaplibreConfigChange?: (config: MapLibreConfig) => void
}

function LayerStylingSection({
  title,
  stylingSettings,
  onUpdateStylingSettings,
  dimensionSettings,
  layer,
  customDataExists,
  inspectorScope,
  defaultExpanded = true,
}: {
  title: string
  stylingSettings: StylingSettings
  onUpdateStylingSettings: (settings: StylingSettings) => void
  dimensionSettings: DimensionSettings
  layer: MapLayer
  customDataExists: boolean
  inspectorScope: InspectorScope
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded)
  const isPoints = layer.type === 'points'

  return (
    <StudioInspectorBlock
      title={title}
      isExpanded={expanded}
      onToggle={() => setExpanded(!expanded)}
    >
      <Suspense fallback={<div className="p-4 text-xs text-muted-foreground">Loading…</div>}>
        <MapStyling
          stylingSettings={{
            ...stylingSettings,
            activeTab: isPoints ? 'symbol' : 'choropleth',
            symbol: isPoints
              ? { ...stylingSettings.symbol, ...(layer.styling as typeof stylingSettings.symbol) }
              : stylingSettings.symbol,
            choropleth: !isPoints
              ? { ...stylingSettings.choropleth, ...(layer.styling as typeof stylingSettings.choropleth) }
              : stylingSettings.choropleth,
          }}
          onUpdateStylingSettings={onUpdateStylingSettings}
          dimensionSettings={dimensionSettings}
          symbolDataExists={isPoints}
          choroplethDataExists={!isPoints}
          customDataExists={!isPoints && customDataExists}
          isExpanded
          setIsExpanded={() => {}}
          variant="inspector"
          inspectorScope={inspectorScope}
        />
      </Suspense>
    </StudioInspectorBlock>
  )
}

export function LayerStylingInspector({
  layers,
  stylingSettings,
  onUpdateStylingSettings,
  dimensionSettings,
  onUpdateDimensionSettings,
  columnTypes,
  columnFormats,
  symbolParsedData,
  symbolGeocodedData,
  symbolColumns,
  choroplethParsedData,
  choroplethGeocodedData,
  choroplethColumns,
  selectedGeography,
  customDataExists,
  canvasType,
  maplibreConfig,
  onMaplibreConfigChange,
}: LayerStylingInspectorProps) {
  const [baseExpanded, setBaseExpanded] = useState(true)

  const sortedLayers = sortLayers(layers).filter(
    (l) => l.data.parsedData.length > 0 || l.data.geocodedData.length > 0,
  )

  const hasPointsLayers = sortedLayers.some((l) => l.type === 'points')
  const hasAreasLayers = sortedLayers.some((l) => l.type === 'areas')

  const handleDimensionUpdate = (settings: DimensionSettings) => {
    onUpdateDimensionSettings({
      symbol: settings.symbol,
      choropleth: settings.choropleth,
    })
  }

  return (
    <div className="flex flex-col">
      <StudioInspectorBlock
        title="Base map"
        isExpanded={baseExpanded}
        onToggle={() => setBaseExpanded(!baseExpanded)}
      >
        {canvasType === 'interactive' && maplibreConfig && onMaplibreConfigChange && (
          <div className="px-4 pb-3 pt-1">
            <Label className="mb-2 block text-sm font-medium">Basemap style</Label>
            <Select
              value={maplibreConfig.basemapStyleId}
              onValueChange={(value) =>
                onMaplibreConfigChange({ ...maplibreConfig, basemapStyleId: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BASEMAP_STYLES.map((style) => (
                  <SelectItem key={style.id} value={style.id}>
                    {style.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <Suspense fallback={<div className="p-4 text-xs text-muted-foreground">Loading…</div>}>
          <MapStyling
            stylingSettings={{ ...stylingSettings, activeTab: 'base' }}
            onUpdateStylingSettings={onUpdateStylingSettings}
            dimensionSettings={dimensionSettings}
            symbolDataExists={false}
            choroplethDataExists={false}
            customDataExists={false}
            isExpanded
            setIsExpanded={() => {}}
            variant="inspector"
            inspectorScope="base"
          />
        </Suspense>
      </StudioInspectorBlock>

      {hasPointsLayers && dimensionSettings.symbol.colorBy ? (
        <StudioInspectorBlock title="Symbol color scheme" isExpanded>
          <Suspense fallback={<div className="p-4 text-xs text-muted-foreground">Loading…</div>}>
            <DimensionMapping
              embedded
              colorSchemeOnly
              layerMode
              activeLayerType="points"
              mapType="symbol"
              symbolDataExists
              choroplethDataExists={false}
              customDataExists={false}
              columnTypes={columnTypes}
              dimensionSettings={dimensionSettings}
              onUpdateSettings={handleDimensionUpdate}
              columnFormats={columnFormats}
              symbolParsedData={symbolParsedData}
              symbolGeocodedData={symbolGeocodedData}
              symbolColumns={symbolColumns}
              choroplethParsedData={[]}
              choroplethGeocodedData={[]}
              choroplethColumns={[]}
              selectedGeography={selectedGeography}
              stylingSettings={stylingSettings}
              isExpanded
              setIsExpanded={() => {}}
              variant="inspector"
            />
          </Suspense>
        </StudioInspectorBlock>
      ) : null}

      {hasAreasLayers && dimensionSettings.choropleth.colorBy ? (
        <StudioInspectorBlock title="Fill color scheme" isExpanded>
          <Suspense fallback={<div className="p-4 text-xs text-muted-foreground">Loading…</div>}>
            <DimensionMapping
              embedded
              colorSchemeOnly
              layerMode
              activeLayerType="areas"
              mapType="choropleth"
              symbolDataExists={false}
              choroplethDataExists
              customDataExists={customDataExists}
              columnTypes={columnTypes}
              dimensionSettings={dimensionSettings}
              onUpdateSettings={handleDimensionUpdate}
              columnFormats={columnFormats}
              symbolParsedData={[]}
              symbolGeocodedData={[]}
              symbolColumns={[]}
              choroplethParsedData={choroplethParsedData}
              choroplethGeocodedData={choroplethGeocodedData}
              choroplethColumns={choroplethColumns}
              selectedGeography={selectedGeography}
              stylingSettings={stylingSettings}
              isExpanded
              setIsExpanded={() => {}}
              variant="inspector"
            />
          </Suspense>
        </StudioInspectorBlock>
      ) : null}

      {sortedLayers.map((layer) => {
        if (layer.type === 'points') {
          return (
            <div key={layer.id}>
              <LayerStylingSection
                title={`${layer.name} · Symbols`}
                layer={layer}
                stylingSettings={stylingSettings}
                onUpdateStylingSettings={onUpdateStylingSettings}
                dimensionSettings={dimensionSettings}
                customDataExists={customDataExists}
                inspectorScope="symbol"
                defaultExpanded
              />
              <LayerStylingSection
                title={`${layer.name} · Labels`}
                layer={layer}
                stylingSettings={stylingSettings}
                onUpdateStylingSettings={onUpdateStylingSettings}
                dimensionSettings={dimensionSettings}
                customDataExists={customDataExists}
                inspectorScope="symbol-labels"
              />
              <LayerStylingSection
                title={`${layer.name} · Symbol text`}
                layer={layer}
                stylingSettings={stylingSettings}
                onUpdateStylingSettings={onUpdateStylingSettings}
                dimensionSettings={dimensionSettings}
                customDataExists={customDataExists}
                inspectorScope="symbol-text"
              />
            </div>
          )
        }

        return (
          <LayerStylingSection
            key={layer.id}
            title={`${layer.name} · Labels`}
            layer={layer}
            stylingSettings={stylingSettings}
            onUpdateStylingSettings={onUpdateStylingSettings}
            dimensionSettings={dimensionSettings}
            customDataExists={customDataExists}
            inspectorScope="choropleth-labels"
            defaultExpanded
          />
        )
      })}
    </div>
  )
}
