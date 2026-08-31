'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { RenderTarget } from '@/app/(studio)/types'
import { cn } from '@/lib/utils'

interface RenderTargetToggleProps {
  value: RenderTarget
  onChange: (value: RenderTarget) => void
  className?: string
}

export function RenderTargetToggle({ value, onChange, className }: RenderTargetToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next === 'svg' || next === 'maplibre') {
          onChange(next)
        }
      }}
      className={cn('rounded-md border border-border bg-background p-0.5', className)}
    >
      <ToggleGroupItem
        value="svg"
        className="h-7 px-2.5 text-xs data-[state=on]:bg-secondary"
        aria-label="SVG canvas"
      >
        SVG
      </ToggleGroupItem>
      <ToggleGroupItem
        value="maplibre"
        className="h-7 px-2.5 text-xs data-[state=on]:bg-secondary"
        aria-label="MapLibre canvas"
      >
        MapLibre
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
