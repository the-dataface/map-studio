'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Search, MousePointer, Move, PenTool, Hand } from 'lucide-react'
import { studioHeaderIconButtonClass } from '@/components/studio-panel'
import { cn } from '@/lib/utils'

export type MapTool = 'inspect' | 'select' | 'move' | 'draw'

interface MapControlBarProps {
  activeTool: MapTool
  onToolChange: (tool: MapTool) => void
  tools?: MapTool[]
}

const TOOL_CONFIG: Record<MapTool, { icon: React.ReactNode; label: string; shortcut: string }> = {
  inspect: {
    icon: <Search className="h-4 w-4" />,
    label: 'Inspect',
    shortcut: 'I',
  },
  select: {
    icon: <MousePointer className="h-4 w-4" />,
    label: 'Select',
    shortcut: 'V',
  },
  move: {
    icon: <Hand className="h-4 w-4" />,
    label: 'Pan',
    shortcut: 'P',
  },
  draw: {
    icon: <PenTool className="h-4 w-4" />,
    label: 'Draw',
    shortcut: 'D',
  },
}

export const MapControlBar: React.FC<MapControlBarProps> = ({
  activeTool,
  onToolChange,
  tools = ['inspect', 'select', 'move', 'draw'],
}) => {
  return (
    <TooltipProvider>
      <div className="absolute right-3 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-0.5 border border-border bg-background/95 p-1 shadow-sm backdrop-blur-sm">
        {tools.map((toolId) => {
          const tool = TOOL_CONFIG[toolId]
          return (
            <Tooltip key={toolId}>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onToolChange(toolId)}
                  className={cn(
                    studioHeaderIconButtonClass,
                    'h-8 w-8 border-0',
                    activeTool === toolId && 'bg-muted/60 text-foreground',
                  )}
                  aria-label={`${tool.label} tool (${tool.shortcut})`}
                  aria-pressed={activeTool === toolId}
                >
                  {tool.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left" sideOffset={8}>
                <div className="flex items-center gap-2">
                  <span>{tool.label}</span>
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    {tool.shortcut}
                  </kbd>
                </div>
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
