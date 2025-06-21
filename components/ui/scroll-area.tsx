"use client"

import type React from "react"

import { forwardRef } from "react"
import { cn } from "@/lib/utils"

/**
 * A tiny wrapper that simply adds vertical scrolling.
 */
export const ScrollArea = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} {...props} className={cn("relative w-full h-full overflow-y-auto", className)}>
      {children}
    </div>
  ),
)

ScrollArea.displayName = "ScrollArea"
