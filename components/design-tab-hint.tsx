'use client'

import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { studioPrimaryButtonClass } from '@/components/studio-panel'
import { cn } from '@/lib/utils'

interface DesignTabHintProps {
  onGoToDesign: () => void
  className?: string
}

export function DesignTabHint({ onGoToDesign, className }: DesignTabHintProps) {
  return (
    <div
      className={cn(
        'studio-panel-flat flex items-center justify-between gap-4 border-t border-border bg-muted/20 px-4 py-3',
        className
      )}
      role="status"
      aria-live="polite">
      <div className="min-w-0 space-y-0.5">
        <p className="text-xs font-medium uppercase tracking-wider text-foreground">Ready to map?</p>
        <p className="text-sm text-muted-foreground">
          Switch to <span className="text-foreground">Design</span> to configure dimensions, colors, and styling.
          Press <kbd className="rounded border border-border bg-background px-1 py-0.5 font-mono text-[10px]">2</kbd>{' '}
          or use the tab in the header.
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        className={cn('h-8 shrink-0 gap-1.5 rounded-none text-xs', studioPrimaryButtonClass)}
        onClick={onGoToDesign}>
        Design
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </div>
  )
}
