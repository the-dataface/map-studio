'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  RotateCcw,
  Save,
  Download,
  FileImage,
  Copy,
  Undo2,
  Redo2,
  Loader2,
  Minimize2,
  Palette,
} from 'lucide-react'
import { studioHeaderIconButtonClass } from '@/components/studio-panel'
import type { StudioMode } from '@/lib/studio-chrome-context'
import { cn } from '@/lib/utils'

const getModifierKey = () => {
  if (typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
    return '⌘'
  }
  return 'Ctrl'
}

interface FloatingToolbarProps {
  visible: boolean
  studioMode: StudioMode
  placement?: 'fixed-corner' | 'map-canvas'
  onReset: () => void
  onSave: () => void
  onExport: () => void
  onExportSVG: () => void
  onCopy: () => void
  onUndo: () => void
  onRedo: () => void
  onCollapseAll: () => void
  onJumpToMap: () => void
  showJumpToMap?: boolean
  canUndo: boolean
  canRedo: boolean
  canCollapse: boolean
  isSaving?: boolean
  isExporting?: boolean
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  visible,
  studioMode,
  placement = 'fixed-corner',
  onReset,
  onSave,
  onExport,
  onExportSVG,
  onCopy,
  onUndo,
  onRedo,
  onCollapseAll,
  onJumpToMap,
  showJumpToMap = true,
  canUndo,
  canRedo,
  canCollapse,
  isSaving = false,
  isExporting = false,
}) => {
  if (!visible) return null

  const isDataMode = studioMode === 'data'
  const isMapCanvas = placement === 'map-canvas'

  return (
    <TooltipProvider>
      <div
        className={cn(
          'z-40 flex items-center gap-0.5 border border-border bg-background/95 p-1 shadow-sm backdrop-blur-sm animate-in fade-in duration-300 rounded-none',
          isMapCanvas
            ? 'absolute bottom-4 left-1/2 -translate-x-1/2'
            : cn(
                'fixed',
                isDataMode ? 'bottom-24 right-4' : 'bottom-4 right-4'
              )
        )}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onReset}
              className={cn(studioHeaderIconButtonClass, 'border-0 hover:!bg-destructive/10 hover:!text-destructive')}
              aria-label="Reset map">
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Reset</p>
          </TooltipContent>
        </Tooltip>

        <div className="mx-0.5 h-5 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSave}
              disabled={isSaving}
              className={cn(studioHeaderIconButtonClass, 'border-0')}
              aria-label="Save project">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="flex items-center gap-1">
              {isSaving ? 'Saving...' : 'Save project'}
              {!isSaving && (
                <>
                  {' '}
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px]">
                    {getModifierKey()} S
                  </kbd>
                </>
              )}
            </p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onExport}
              disabled={isExporting}
              className={cn(studioHeaderIconButtonClass, 'border-0')}
              aria-label="Export project">
              {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{isExporting ? 'Exporting...' : 'Export project'}</p>
          </TooltipContent>
        </Tooltip>

        {!isDataMode ? (
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onExportSVG}
                  className={cn(studioHeaderIconButtonClass, 'border-0')}
                  aria-label="Download map as SVG">
                  <FileImage className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="flex items-center gap-1">
                  Download SVG{' '}
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center rounded border border-border bg-muted px-1.5 font-mono text-[10px]">
                    {getModifierKey()} E
                  </kbd>
                </p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onCopy}
                  className={cn(studioHeaderIconButtonClass, 'border-0')}
                  aria-label="Copy map as SVG">
                  <Copy className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Copy map</p>
              </TooltipContent>
            </Tooltip>
          </>
        ) : null}

        <div className="mx-0.5 h-5 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
              className={cn(studioHeaderIconButtonClass, 'border-0 disabled:opacity-50')}
              aria-label="Undo">
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{canUndo ? 'Undo' : 'Nothing to undo'}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
              className={cn(studioHeaderIconButtonClass, 'border-0 disabled:opacity-50')}
              aria-label="Redo">
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{canRedo ? 'Redo' : 'Nothing to redo'}</p>
          </TooltipContent>
        </Tooltip>

        <div className="mx-0.5 h-5 w-px bg-border" />

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCollapseAll}
              disabled={!canCollapse}
              className={cn(studioHeaderIconButtonClass, 'border-0 disabled:opacity-50')}
              aria-label="Collapse all panels">
              <Minimize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{canCollapse ? 'Collapse all' : 'No panels to collapse'}</p>
          </TooltipContent>
        </Tooltip>

        {showJumpToMap ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={onJumpToMap}
                className={cn(studioHeaderIconButtonClass, 'border-0')}
                aria-label="Switch to design mode">
                <Palette className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Design mode</p>
            </TooltipContent>
          </Tooltip>
        ) : null}
      </div>
    </TooltipProvider>
  )
}
