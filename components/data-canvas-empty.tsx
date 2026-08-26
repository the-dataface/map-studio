'use client'

import { ArrowRight, Map } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { studioPrimaryButtonClass } from '@/components/studio-panel'
import { cn } from '@/lib/utils'

type DataCanvasEmptyVariant = 'no-data' | 'custom-only'

interface DataCanvasEmptyProps {
  variant: DataCanvasEmptyVariant
  onGoToDesign?: () => void
  className?: string
}

export function DataCanvasEmpty({ variant, onGoToDesign, className }: DataCanvasEmptyProps) {
  if (variant === 'custom-only') {
    return (
      <div
        className={cn(
          'flex flex-1 flex-col items-center justify-center gap-3 p-10 text-center',
          className
        )}>
        <Map className="h-8 w-8 text-muted-foreground/60" aria-hidden />
        <div className="max-w-sm space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-foreground">Custom SVG map</p>
          <p className="text-sm text-muted-foreground">
            Tabular preview isn&apos;t available for custom base maps. Switch to Design to configure dimensions and
            styling.
          </p>
        </div>
        {onGoToDesign ? (
          <Button
            type="button"
            size="sm"
            className={cn('mt-1 h-8 gap-1.5 rounded-none text-xs', studioPrimaryButtonClass)}
            onClick={onGoToDesign}>
            Design
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Button>
        ) : null}
      </div>
    )
  }

  return (
    <div className={cn('flex flex-1 flex-col items-center justify-center p-10 text-center', className)}>
      <p className="max-w-sm text-sm text-muted-foreground">
        Paste or upload a dataset in the sidebar. Your table will appear here for review and column typing.
      </p>
    </div>
  )
}
