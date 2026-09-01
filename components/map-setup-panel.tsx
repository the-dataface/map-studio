'use client'

import { useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { CanvasTypeSelector } from '@/components/canvas-type-selector'
import { CustomBoundaryInput } from '@/components/custom-boundary-input'
import { SetupLayersPanel } from '@/components/setup-layers-panel'
import { BoundaryPicker } from '@/components/boundary-picker'
import type {
  BoundaryConfig,
  CanvasType,
  ColumnFormat,
  ColumnType,
  DimensionSettings,
  GeographyKey,
  MapLayer,
  PrintConfig,
  ProjectionType,
  ReferenceLayerConfig,
  StylingSettings,
} from '@/app/(studio)/types'
import { cn } from '@/lib/utils'
import { studioPanelClass, StudioExpandableHeader } from '@/components/studio-panel'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const geographies: { value: GeographyKey; label: string }[] = [
  { value: 'canada-nation', label: 'Canada' },
  { value: 'canada-provinces', label: 'Canada (provinces)' },
  { value: 'usa-nation', label: 'United States' },
  { value: 'usa-states', label: 'United States (states)' },
  { value: 'usa-counties', label: 'United States (counties)' },
  { value: 'world', label: 'World' },
]

const projections: { value: ProjectionType; label: string }[] = [
  { value: 'albersUsa', label: 'Albers USA' },
  { value: 'albers', label: 'Albers' },
  { value: 'mercator', label: 'Mercator' },
  { value: 'equalEarth', label: 'Equal Earth' },
]

interface MapSetupPanelProps {
  canvasType: CanvasType
  onCanvasTypeChange: (value: CanvasType) => void
  layers: MapLayer[]
  selectedLayerId: string | null
  onSelectLayer: (id: string) => void
  onToggleLayerVisibility: (id: string) => void
  boundaryConfig: BoundaryConfig
  onBoundaryChange: (config: BoundaryConfig) => void
  selectedGeography: GeographyKey
  onGeographyChange: (geography: GeographyKey) => void
  printConfig: PrintConfig
  onPrintConfigChange: (config: PrintConfig) => void
  referenceLayers: ReferenceLayerConfig[]
  onToggleReferenceLayer: (id: string, enabled?: boolean) => void
  dimensionSettings: DimensionSettings
  onUpdateDimensionSettings: (settings: Pick<DimensionSettings, 'symbol' | 'choropleth'>) => void
  columnTypes: ColumnType
  columnFormats: ColumnFormat
  stylingSettings: StylingSettings
  onCustomBoundaryLoad: (svg: string) => void
  onClearCustomBoundary: () => void
  canvasExpanded: boolean
  setCanvasExpanded: (expanded: boolean) => void
  regionExpanded: boolean
  setRegionExpanded: (expanded: boolean) => void
  layersExpanded: boolean
  setLayersExpanded: (expanded: boolean) => void
}

const panelBodyClass = (expanded: boolean) =>
  cn(
    'studio-panel-expand-body px-4 transition-all duration-200',
    expanded ? 'pb-4 pt-3 max-h-none opacity-100' : 'h-0 max-h-0 overflow-hidden pb-0 pt-0 opacity-0',
  )

export function MapSetupPanel({
  canvasType,
  onCanvasTypeChange,
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleLayerVisibility,
  boundaryConfig,
  onBoundaryChange,
  selectedGeography,
  onGeographyChange,
  printConfig,
  onPrintConfigChange,
  referenceLayers,
  onToggleReferenceLayer,
  dimensionSettings,
  onUpdateDimensionSettings,
  stylingSettings,
  onCustomBoundaryLoad,
  onClearCustomBoundary,
  canvasExpanded,
  setCanvasExpanded,
  regionExpanded,
  setRegionExpanded,
  layersExpanded,
  setLayersExpanded,
}: MapSetupPanelProps) {
  const showProjection = canvasType === 'print' || canvasType === 'custom'
  const showRegion = canvasType !== 'custom'
  const customDataExists = canvasType === 'custom'

  useEffect(() => {
    const handler = () => {
      setCanvasExpanded(false)
      setRegionExpanded(false)
      setLayersExpanded(false)
    }
    window.addEventListener('collapse-all-panels', handler)
    return () => window.removeEventListener('collapse-all-panels', handler)
  }, [setCanvasExpanded, setRegionExpanded, setLayersExpanded])

  return (
    <div className="flex flex-col">
      <Card className={cn(studioPanelClass, 'overflow-hidden border-t-0')}>
        <StudioExpandableHeader
          title="Canvas type"
          isExpanded={canvasExpanded}
          onToggle={() => setCanvasExpanded(!canvasExpanded)}
        />
        <CardContent className={panelBodyClass(canvasExpanded)}>
          <CanvasTypeSelector value={canvasType} onChange={onCanvasTypeChange} />
          {canvasType === 'custom' && (
            <CustomBoundaryInput onLoad={onCustomBoundaryLoad} onClear={onClearCustomBoundary} />
          )}
        </CardContent>
      </Card>

      {showRegion && (
        <Card className={cn(studioPanelClass, 'overflow-hidden')}>
          <StudioExpandableHeader
            title={canvasType === 'interactive' ? 'Region' : 'Region & projection'}
            isExpanded={regionExpanded}
            onToggle={() => setRegionExpanded(!regionExpanded)}
          />
          <CardContent className={panelBodyClass(regionExpanded)}>
            <div className="flex flex-col gap-4">
              {canvasType === 'interactive' ? (
                <>
                  <BoundaryPicker
                    boundaryConfig={boundaryConfig}
                    onBoundaryChange={onBoundaryChange}
                    renderTarget="maplibre"
                  />
                  <p className="text-xs text-muted-foreground">
                    Sets the geographic extent and boundary shapes used to join your area-layer data.
                    Choose a set that matches your region column (e.g. US states for a State column).
                  </p>
                </>
              ) : (
                <>
                  <div>
                    <Label className="mb-2 block text-sm font-medium">Region</Label>
                    <Select value={selectedGeography} onValueChange={onGeographyChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select region" />
                      </SelectTrigger>
                      <SelectContent>
                        {geographies.map((geo) => (
                          <SelectItem key={geo.value} value={geo.value}>
                            {geo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {showProjection && (
                    <>
                      <div>
                        <Label className="mb-2 block text-sm font-medium">Projection</Label>
                        <Select
                          value={printConfig.projection}
                          onValueChange={(value) =>
                            onPrintConfigChange({
                              ...printConfig,
                              projection: value as ProjectionType,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {projections.map((proj) => (
                              <SelectItem key={proj.value} value={proj.value}>
                                {proj.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id="clip-to-country"
                          checked={printConfig.clipToCountry}
                          onCheckedChange={(checked) =>
                            onPrintConfigChange({
                              ...printConfig,
                              clipToCountry: checked === true,
                            })
                          }
                        />
                        <Label htmlFor="clip-to-country" className="text-sm font-normal">
                          Clip to country boundaries
                        </Label>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <SetupLayersPanel
        layers={layers}
        selectedLayerId={selectedLayerId}
        onSelectLayer={onSelectLayer}
        onToggleVisibility={onToggleLayerVisibility}
        referenceLayers={referenceLayers}
        onToggleReferenceLayer={onToggleReferenceLayer}
        isExpanded={layersExpanded}
        setIsExpanded={setLayersExpanded}
        dimensionSettings={dimensionSettings}
        onUpdateDimensionSettings={onUpdateDimensionSettings}
        stylingSettings={stylingSettings}
        customDataExists={customDataExists}
        selectedGeography={dimensionSettings.selectedGeography}
      />
    </div>
  )
}
