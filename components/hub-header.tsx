'use client'

import Link from 'next/link'

import { ThemeToggle } from '@/components/theme-toggle'

import { hubInsetClass } from './hub-layout'

export function HubHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className={hubInsetClass}>
        <div className="flex h-12 items-center justify-between">
          <Link href="/">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground hover:opacity-80">
              Map Studio
            </span>
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
