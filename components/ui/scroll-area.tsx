"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Very small wrapper that provides vertical scrolling.
 * Replace with a full-featured solution (e.g. Radix ScrollArea)
 * if you need more advanced behaviour.
 */
export const ScrollArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(function ScrollArea(
  { className, style, ...props },
  ref,
) {
  return <div ref={ref} style={{ overflowY: "auto", ...style }} className={cn("w-full h-full", className)} {...props} />
})
