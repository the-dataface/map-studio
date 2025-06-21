// @ts-nocheck
"use client"

/**
 * Minimal vertical‐scroll wrapper.
 *  – purely JavaScript (no TS generics)
 *  – only adds overflow-y styling
 */
import { cn } from "@/lib/utils"

export function ScrollArea({ className, children, ...rest }) {
  return (
    <div {...rest} className={cn("relative w-full h-full overflow-y-auto", className)}>
      {children}
    </div>
  )
}
