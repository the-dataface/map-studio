// @ts-nocheck
"use client"

import { cn } from "@/lib/utils"

/**
 * Simple vertical scroll wrapper — zero generics, zero fancy TS.
 */
export function ScrollArea({ className, children, ...rest }) {
  return (
    <div {...rest} className={cn("relative w-full h-full overflow-y-auto", className)}>
      {children}
    </div>
  )
}
