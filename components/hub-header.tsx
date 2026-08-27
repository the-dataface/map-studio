'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { BrandLockup } from '@/components/brand/brand-lockup'

import { hubInsetClass } from './hub-layout'

export function HubHeader() {
  return (
    <header className="sticky top-0 z-50 overflow-visible border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className={hubInsetClass}>
        <div className="flex h-12 items-center justify-between overflow-visible">
          <BrandLockup intervalMs={4000} showWordmark />
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
