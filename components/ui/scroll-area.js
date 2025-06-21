// Simple vertical scroll wrapper (pure JS – no TypeScript, no generics)
import { cn } from "@/lib/utils"

export default function ScrollArea({ className = "", children, ...rest }) {
  return (
    <div {...rest} className={cn("relative w-full h-full overflow-y-auto", className)}>
      {children}
    </div>
  )
}
