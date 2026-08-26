'use client'

import { Map, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { studioPrimaryButtonClass } from '@/components/studio-panel'
import { cn } from '@/lib/utils'

interface HubEmptyStateProps {
  onNewMap?: () => void
}

export function HubEmptyState({ onNewMap }: HubEmptyStateProps) {
  return (
    <div className="py-16 text-center" role="status">
      <Map className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" aria-hidden />
      <p className="text-sm text-muted-foreground">No saved projects yet.</p>
      <p className="mt-1 font-mono text-[11px] text-muted-foreground">Create your first map to get started.</p>
      {onNewMap ? (
        <Button
          type="button"
          size="sm"
          className={cn('mt-4 h-8 gap-1.5 px-3 text-xs', studioPrimaryButtonClass)}
          onClick={onNewMap}>
          <Plus className="h-3.5 w-3.5" aria-hidden />
          New map
        </Button>
      ) : null}
    </div>
  )
}
