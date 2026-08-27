'use client'

import Link from 'next/link'
import { FolderOpen, Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { studioOutlineButtonClass, studioPrimaryButtonClass } from '@/components/studio-panel'
import { cn } from '@/lib/utils'

import { hubInsetClass } from './hub-layout'

interface HubHeroProps {
  onNewMap: () => void
  onOpenFromFile: () => void
}

export function HubHero({ onNewMap, onOpenFromFile }: HubHeroProps) {
  return (
    <section className="border-b border-border py-14">
      <div className={hubInsetClass}>
        <h1 className="max-w-xl text-2xl font-medium tracking-tight leading-snug text-foreground">
          Create data-rich maps without leaving your browser.
        </h1>
        <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground">
          Import a dataset, geocode locations, style choropleths or symbol maps, and export production-ready SVG in
          minutes. By{' '}
          <Link
            href="https://labs.thedataface.com"
            className="text-foreground underline-offset-4 hover:underline"
            target="_blank"
            rel="noopener noreferrer">
            DFLabs
          </Link>
          .
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            className={cn('h-8 gap-1.5 px-3 text-xs', studioPrimaryButtonClass)}
            onClick={onNewMap}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
            New map
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={cn('h-8 gap-1.5 px-3 text-xs', studioOutlineButtonClass)}
            onClick={onOpenFromFile}>
            <FolderOpen className="h-3.5 w-3.5" aria-hidden />
            Open project
          </Button>
        </div>
      </div>
    </section>
  )
}
