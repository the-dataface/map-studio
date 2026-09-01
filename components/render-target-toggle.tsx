'use client'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import type { CanvasType } from '@/app/(studio)/types'
import { CANVAS_TYPE_LABELS } from '@/app/(studio)/types'
import { cn } from '@/lib/utils'

interface CanvasTypeToggleProps {
  value: CanvasType
  onChange: (value: CanvasType) => void
  className?: string
  /** Limit options (e.g. hide custom when not supported) */
  options?: CanvasType[]
}

export function CanvasTypeToggle({
  value,
  onChange,
  className,
  options = ['print', 'interactive'],
}: CanvasTypeToggleProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(next) => {
        if (next === 'print' || next === 'interactive' || next === 'custom') {
          onChange(next)
        }
      }}
      className={cn('rounded-md border border-border bg-background p-0.5', className)}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option}
          value={option}
          className="h-7 px-2.5 text-xs data-[state=on]:bg-secondary"
          aria-label={CANVAS_TYPE_LABELS[option]}
        >
          {CANVAS_TYPE_LABELS[option]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/** @deprecated Use CanvasTypeToggle — kept for imports during migration */
export function RenderTargetToggle({
  value,
  onChange,
  className,
}: {
  value: 'svg' | 'maplibre'
  onChange: (value: 'svg' | 'maplibre') => void
  className?: string
}) {
  const canvasValue: CanvasType = value === 'maplibre' ? 'interactive' : 'print'
  return (
    <CanvasTypeToggle
      value={canvasValue}
      onChange={(canvas) => onChange(canvas === 'interactive' ? 'maplibre' : 'svg')}
      className={className}
    />
  )
}
