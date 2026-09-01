'use client'

import { BarChart3, Eye, EyeOff, MapPin, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LayerType, MapLayer } from '@/app/(studio)/types'
import { cn } from '@/lib/utils'

interface LayerListProps {
  layers: MapLayer[]
  selectedLayerId: string | null
  onSelectLayer: (id: string) => void
  onAddLayer: (type: LayerType) => void
  onRemoveLayer: (id: string) => void
  onToggleVisibility: (id: string) => void
  className?: string
}

function LayerIcon({ type }: { type: LayerType }) {
  return type === 'points' ? (
    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
  ) : (
    <BarChart3 className="h-3.5 w-3.5 shrink-0" aria-hidden />
  )
}

export function LayerList({
  layers,
  selectedLayerId,
  onSelectLayer,
  onAddLayer,
  onRemoveLayer,
  onToggleVisibility,
  className,
}: LayerListProps) {
  const sorted = [...layers].sort((a, b) => a.order - b.order)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground">Layers</span>
        <div className="flex gap-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onAddLayer('points')}
          >
            <Plus className="mr-1 h-3 w-3" />
            Points
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => onAddLayer('areas')}
          >
            <Plus className="mr-1 h-3 w-3" />
            Areas
          </Button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <p className="text-xs text-muted-foreground">Upload data to create your first layer.</p>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((layer) => {
            const selected = layer.id === selectedLayerId
            const hasData =
              layer.data.parsedData.length > 0 || layer.data.geocodedData.length > 0

            return (
              <div
                key={layer.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectLayer(layer.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    onSelectLayer(layer.id)
                  }
                }}
                className={cn(
                  'flex min-w-[140px] shrink-0 items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition-colors',
                  selected
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-background hover:bg-muted/50',
                )}
              >
                <LayerIcon type={layer.type} />
                <span className="flex-1 truncate font-medium">
                  {layer.name}
                  {!hasData && (
                    <span className="ml-1 font-normal text-muted-foreground">(empty)</span>
                  )}
                </span>
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
                {layers.length > 1 && (
                  <button
                    type="button"
                    className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                    aria-label={`Remove ${layer.name}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveLayer(layer.id)
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
