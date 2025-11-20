'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Search, MousePointer, Move, PenTool } from 'lucide-react'
import { cn } from '@/lib/utils'

export type MapTool = 'inspect' | 'select' | 'move' | 'draw'

interface MapControlBarProps {
  activeTool: MapTool
  onToolChange: (tool: MapTool) => void
}

export const MapControlBar: React.FC<MapControlBarProps> = ({
  activeTool,
  onToolChange,
}) => {
  const tools: Array<{ id: MapTool; icon: React.ReactNode; label: string; shortcut: string }> = [
    {
      id: 'inspect',
      icon: <Search className="h-4 w-4" />,
      label: 'Inspect',
      shortcut: 'I',
    },
    {
      id: 'select',
      icon: <MousePointer className="h-4 w-4" />,
      label: 'Select',
      shortcut: 'V',
    },
    {
      id: 'move',
      icon: <Move className="h-4 w-4" />,
      label: 'Move',
      shortcut: 'M',
    },
    {
      id: 'draw',
      icon: <PenTool className="h-4 w-4" />,
      label: 'Draw',
      shortcut: 'P',
    },
  ]

  return (
    <TooltipProvider>
      <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-40 flex flex-col gap-1 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border border-border rounded-full shadow-xl p-1">
        {tools.map((tool) => (
          <Tooltip key={tool.id}>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onToolChange(tool.id)}
                className={cn(
                  'h-9 w-9 rounded-full transition-colors',
                  activeTool === tool.id
                    ? 'bg-secondary text-foreground'
                    : 'hover:bg-muted'
                )}
                aria-label={`${tool.label} tool (${tool.shortcut})`}
                aria-pressed={activeTool === tool.id}
              >
                {tool.icon}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={8}>
              <div className="flex items-center gap-2">
                <span>{tool.label}</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  {tool.shortcut}
                </kbd>
              </div>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}

