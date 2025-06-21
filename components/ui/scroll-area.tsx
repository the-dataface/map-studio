"use client"

import type React from "react"

import { cn } from "@/lib/utils"

type Props = React.HTMLAttributes<HTMLDivElement>

/**
 * Very small helper that just adds vertical scrolling.
 */
export function ScrollArea({ className, children, ...rest }: Props) {
  return (
    <div {...rest} className={cn("relative w-full h-full overflow-y-auto", className)}>
      {children}
    </div>
  )
}
