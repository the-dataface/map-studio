"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Lightweight vertical ScrollArea.
 * Keeps the API surface tiny to avoid type-annotation issues in the playground.
 */
export const ScrollArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function ScrollArea(
  { className, children, ...props },
  ref,
) {
  return (
    <div ref={ref} {...props} className={cn("relative w-full h-full overflow-y-auto", className)}>
      {children}
    </div>
  )
})

ScrollArea.displayName = "ScrollArea"
