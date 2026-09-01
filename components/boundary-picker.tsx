'use client'

import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { BoundaryConfig } from '@/app/(studio)/types'
import { BOUNDARY_PRESETS, findPresetForConfig } from '@/modules/boundaries/catalog'
import { isSvgCompatibleBoundary } from '@/modules/boundaries/compatibility'
import type { RenderTarget } from '@/app/(studio)/types'

interface BoundaryPickerProps {
  boundaryConfig: BoundaryConfig
  onBoundaryChange: (config: BoundaryConfig) => void
  renderTarget: RenderTarget
}

export function BoundaryPicker({
  boundaryConfig,
  onBoundaryChange,
  renderTarget,
}: BoundaryPickerProps) {
  const activePreset = findPresetForConfig(boundaryConfig)
  const activeId = activePreset?.id ?? BOUNDARY_PRESETS[2].id

  return (
    <div className="flex flex-col gap-3">
      <div>
        <Label className="mb-2 block">Boundary set</Label>
        <ScrollArea className="h-[200px] w-full rounded-md border p-2">
          <ToggleGroup
            type="single"
            value={activeId}
            onValueChange={(presetId) => {
              const preset = BOUNDARY_PRESETS.find((item) => item.id === presetId)
              if (!preset) return
              onBoundaryChange({
                ...preset.config,
                joinColumn: boundaryConfig.joinColumn,
              })
            }}
            orientation="vertical"
            className="flex w-full flex-col items-stretch"
          >
            {BOUNDARY_PRESETS.map((preset) => (
              <ToggleGroupItem
                key={preset.id}
                value={preset.id}
                className="h-auto min-h-9 w-full justify-start whitespace-normal px-3 py-2 text-left text-sm"
              >
                {preset.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </ScrollArea>
      </div>

      {renderTarget === 'svg' && !isSvgCompatibleBoundary(boundaryConfig) ? (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          This boundary set requires the MapLibre canvas. Switch render target in the map preview.
        </p>
      ) : null}
    </div>
  )
}
