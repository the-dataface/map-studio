import { cn } from '@/lib/utils'

/** Shared horizontal inset — header, hero, and project rows align to this */
export const hubInsetClass = 'mx-auto w-full max-w-6xl px-4 lg:px-6'

/** Full-bleed row shell — border spans the viewport; pair with hubInsetClass on inner content */
export const hubFullBleedRowClass = 'w-full border-b border-border transition-colors hover:bg-muted/30'

export function hubRowInnerClass(className?: string) {
  return cn(hubInsetClass, 'flex gap-4 py-4', className)
}
