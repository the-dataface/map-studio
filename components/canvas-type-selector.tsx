'use client'

import type { CanvasType } from '@/app/(studio)/types'
import { CANVAS_TYPE_DESCRIPTIONS, CANVAS_TYPE_LABELS } from '@/app/(studio)/types'
import { cn } from '@/lib/utils'
import { FileImage, Globe, Map } from 'lucide-react'

interface CanvasTypeSelectorProps {
  value: CanvasType
  onChange: (value: CanvasType) => void
  className?: string
}

const CANVAS_ICONS: Record<CanvasType, typeof Map> = {
  print: FileImage,
  interactive: Globe,
  custom: Map,
}

const CANVAS_OPTIONS: CanvasType[] = ['print', 'interactive', 'custom']

export function CanvasTypeSelector({ value, onChange, className }: CanvasTypeSelectorProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {CANVAS_OPTIONS.map((option) => {
        const Icon = CANVAS_ICONS[option]
        const selected = value === option

        return (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              'flex flex-col items-start gap-1 rounded-lg border p-3 text-left transition-colors',
              selected
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border bg-background hover:bg-muted/50',
            )}
          >
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span className="text-sm font-medium">{CANVAS_TYPE_LABELS[option]}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {CANVAS_TYPE_DESCRIPTIONS[option]}
            </span>
          </button>
        )
      })}
    </div>
  )
}
