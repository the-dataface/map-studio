'use client'

import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Layers,
  MapPin,
  Plus,
  Trash2,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import type {
  DimensionSettings,
  MapLayer,
  ReferenceLayerConfig,
  StylingSettings,
} from '@/app/(studio)/types'
import { REFERENCE_LAYER_CATALOG } from '@/modules/reference-layers/catalog'
import { sortLayers } from '@/modules/layers/selectors'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { studioPanelClass, StudioExpandableHeader } from '@/components/studio-panel'

const DimensionMapping = lazy(() =>
  import('@/components/dimension-mapping').then((mod) => ({ default: mod.DimensionMapping })),
)

interface SetupLayersPanelProps {
  layers: MapLayer[]
  selectedLayerId: string | null
  onSelectLayer: (id: string) => void
  onToggleVisibility: (id: string) => void
  referenceLayers: ReferenceLayerConfig[]
  onToggleReferenceLayer: (id: string, enabled?: boolean) => void
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
  dimensionSettings: DimensionSettings
  onUpdateDimensionSettings: (settings: Pick<DimensionSettings, 'symbol' | 'choropleth'>) => void
  stylingSettings: StylingSettings
  customDataExists: boolean
  selectedGeography: string
}

export function SetupLayersPanel({
  layers,
  selectedLayerId,
  onSelectLayer,
  onToggleVisibility,
  referenceLayers,
  onToggleReferenceLayer,
  isExpanded,
  setIsExpanded,
  dimensionSettings,
  onUpdateDimensionSettings,
  stylingSettings,
  customDataExists,
  selectedGeography,
}: SetupLayersPanelProps) {
  const [contextExpanded, setContextExpanded] = useState(false)
  const [stateColumnDismissed, setStateColumnDismissed] = useState(false)

  useEffect(() => {
    setStateColumnDismissed(false)
  }, [selectedLayerId])
  const sorted = sortLayers(layers)
  const selectedLayer = sorted.find((l) => l.id === selectedLayerId) ?? null
  const hasLayerData =
    selectedLayer &&
    (selectedLayer.data.parsedData.length > 0 || selectedLayer.data.geocodedData.length > 0)

  const enabledContextualLayers = useMemo(
    () =>
      REFERENCE_LAYER_CATALOG.filter((def) => {
        const config = referenceLayers.find((r) => r.id === def.id)
        return config?.enabled ?? false
      }),
    [referenceLayers],
  )

  const availableContextualLayers = useMemo(
    () =>
      REFERENCE_LAYER_CATALOG.filter((def) => {
        const config = referenceLayers.find((r) => r.id === def.id)
        return !(config?.enabled ?? false)
      }),
    [referenceLayers],
  )

  const handleDimensionUpdate = (settings: DimensionSettings) => {
    onUpdateDimensionSettings({
      symbol: settings.symbol,
      choropleth: settings.choropleth,
    })
  }

  return (
    <Card className={cn(studioPanelClass, 'overflow-hidden')}>
      <StudioExpandableHeader
        title="Layers & mapping"
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      />
      <CardContent
        className={cn(
          'studio-panel-expand-body transition-all duration-200',
          isExpanded ? 'px-4 pb-4 pt-3 max-h-none opacity-100' : 'h-0 max-h-0 overflow-hidden pb-0 pt-0 opacity-0',
        )}
      >
        <div className="overflow-hidden border border-border bg-background">
          {sorted.length === 0 && enabledContextualLayers.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">Add layers in the Data tab.</p>
          ) : (
            <ul className="flex flex-col">
              {sorted.map((layer) => {
                const selected = layer.id === selectedLayerId
                const Icon = layer.type === 'points' ? MapPin : BarChart3

                return (
                  <li key={layer.id} className="group">
                    <button
                      type="button"
                      onClick={() => onSelectLayer(layer.id)}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm',
                        selected ? 'bg-primary/10 text-foreground' : 'hover:bg-muted/50',
                      )}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate">{layer.name}</span>
                      <button
                        type="button"
                        className="rounded p-0.5 text-muted-foreground hover:text-foreground"
                        aria-label={layer.visible ? 'Hide layer' : 'Show layer'}
                        onClick={(e) => {
                          e.stopPropagation()
                          onToggleVisibility(layer.id)
                        }}
                      >
                        {layer.visible ? (
                          <Eye className="h-3.5 w-3.5" />
                        ) : (
                          <EyeOff className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </button>
                  </li>
                )
              })}

              {enabledContextualLayers.map((def) => (
                <li key={def.id} className="group">
                  <div className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-muted/50">
                    <Layers className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-muted-foreground">{def.label}</span>
                    <button
                      type="button"
                      className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                      aria-label={`Remove ${def.label}`}
                      onClick={() => onToggleReferenceLayer(def.id, false)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {availableContextualLayers.length > 0 && (
            <div className="border-t border-border">
              <button
                type="button"
                onClick={() => setContextExpanded(!contextExpanded)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted/50"
              >
                <span className="flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                  Add contextual layers
                </span>
                {contextExpanded ? (
                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                )}
              </button>
              {contextExpanded && (
                <div className="flex flex-col gap-2 border-t border-border px-3 py-2">
                  {availableContextualLayers.map((def) => (
                    <label
                      key={def.id}
                      htmlFor={`ctx-${def.id}`}
                      className="flex cursor-pointer items-center gap-2.5 rounded px-1 py-1 hover:bg-muted/40"
                    >
                      <Checkbox
                        id={`ctx-${def.id}`}
                        checked={false}
                        className="shrink-0"
                        onCheckedChange={() => {
                          onToggleReferenceLayer(def.id, true)
                          setContextExpanded(false)
                        }}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-normal leading-tight">{def.label}</span>
                        <span className="block text-xs leading-snug text-muted-foreground">
                          {def.description}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {hasLayerData && selectedLayer && (
          <div className="mt-4">
            <Suspense
              fallback={
                <div className="py-4 text-center text-xs text-muted-foreground">
                  Loading dimension mapping…
                </div>
              }
            >
              <DimensionMapping
                embedded
                layerMode
                mappingOnly
                stateColumnDismissed={stateColumnDismissed}
                onStateColumnDismiss={() => setStateColumnDismissed(true)}
                activeLayerType={selectedLayer.type === 'points' ? 'points' : 'areas'}
                mapType={selectedLayer.type === 'points' ? 'symbol' : 'choropleth'}
                symbolDataExists={selectedLayer.type === 'points'}
                choroplethDataExists={selectedLayer.type === 'areas'}
                customDataExists={customDataExists && selectedLayer.type === 'areas'}
                columnTypes={selectedLayer.columnTypes}
                dimensionSettings={dimensionSettings}
                onUpdateSettings={handleDimensionUpdate}
                columnFormats={selectedLayer.columnFormats}
                symbolParsedData={
                  selectedLayer.type === 'points' ? selectedLayer.data.parsedData : []
                }
                symbolGeocodedData={
                  selectedLayer.type === 'points' ? selectedLayer.data.geocodedData : []
                }
                symbolColumns={
                  selectedLayer.type === 'points' ? selectedLayer.data.columns : []
                }
                choroplethParsedData={
                  selectedLayer.type === 'areas' ? selectedLayer.data.parsedData : []
                }
                choroplethGeocodedData={
                  selectedLayer.type === 'areas' ? selectedLayer.data.geocodedData : []
                }
                choroplethColumns={
                  selectedLayer.type === 'areas' ? selectedLayer.data.columns : []
                }
                selectedGeography={selectedGeography}
                stylingSettings={stylingSettings}
                isExpanded
                setIsExpanded={() => {}}
                variant="panel"
              />
            </Suspense>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
