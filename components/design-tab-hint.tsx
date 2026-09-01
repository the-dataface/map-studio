'use client'

import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { studioPrimaryButtonClass } from '@/components/studio-panel'
import { cn } from '@/lib/utils'

interface DesignTabHintProps {
  onGoToDesign: () => void
  className?: string
  title?: string
  description?: string
  buttonLabel?: string
  variant?: 'footer' | 'sidebar'
}

export function DesignTabHint({
  onGoToDesign,
  className,
  title = 'Ready to configure?',
  description = 'Open Setup to choose your canvas, region, and column mappings.',
  buttonLabel = 'Setup',
  variant = 'footer',
}: DesignTabHintProps) {
  const isSidebar = variant === 'sidebar'

  if (isSidebar) {
    return (
      <div
        className={cn(
          'studio-sidebar-hint flex items-center justify-between gap-3 border-t border-border bg-background px-4 py-3',
          className,
        )}
        role="status"
        aria-live="polite"
      >
        <p className="min-w-0 text-sm font-medium text-foreground">{title}</p>
        <Button
          type="button"
          size="sm"
          className={cn('h-8 shrink-0 gap-1.5 rounded-none text-xs', studioPrimaryButtonClass)}
          onClick={onGoToDesign}
        >
          {buttonLabel}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'studio-panel-flat flex items-center justify-between gap-4 border-t border-border bg-muted/20 px-4 py-3',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Button
        type="button"
        size="sm"
        className={cn('h-8 shrink-0 gap-1.5 rounded-none text-xs', studioPrimaryButtonClass)}
        onClick={onGoToDesign}
      >
        {buttonLabel}
        <ArrowRight className="h-3.5 w-3.5" aria-hidden />
      </Button>
    </div>
  )
}
