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
  ArrowDown,
} from 'lucide-react'

// Helper to get modifier key display (⌘ for Mac, Ctrl for others)
const getModifierKey = () => {
  if (typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
    return '⌘'
  }
  return 'Ctrl'
}

interface FloatingToolbarProps {
  visible: boolean
  onReset: () => void
  onSave: () => void
  onExport: () => void
  onExportSVG: () => void
  onCopy: () => void
  onUndo: () => void
  onRedo: () => void
  onCollapseAll: () => void
  onJumpToMap: () => void
  canUndo: boolean
  canRedo: boolean
  canCollapse: boolean
  isSaving?: boolean
  isExporting?: boolean
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  visible,
  onReset,
  onSave,
  onExport,
  onExportSVG,
  onCopy,
  onUndo,
  onRedo,
  onCollapseAll,
  onJumpToMap,
  canUndo,
  canRedo,
  canCollapse,
  isSaving = false,
  isExporting = false,
}) => {
  if (!visible) return null

  return (
    <TooltipProvider>
      <div className="fixed bottom-8 left-1/2 z-50 -translate-x-1/2 flex items-center gap-1 bg-background border border-border rounded-full shadow-xl p-1 animate-in fade-in duration-300">
        {/* Reset Section */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onReset}
              className="h-9 w-9 rounded-full hover:bg-destructive/10 hover:text-destructive"
              aria-label="Reset map"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Reset</p>
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="h-6 w-px bg-border mx-1" />

        {/* Save/Export/Copy Section */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onSave}
              disabled={isSaving}
              className="h-9 w-9 rounded-full"
              aria-label="Save project"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="flex items-center gap-1">
              {isSaving ? 'Saving...' : 'Save project'}
              {!isSaving && (
                <>
                  {' '}
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-600 opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
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
              className="h-9 w-9 rounded-full"
              aria-label="Export project"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isExporting ? 'Exporting...' : 'Export project'}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onExportSVG}
              className="h-9 w-9 rounded-full"
              aria-label="Download map as SVG"
            >
              <FileImage className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="flex items-center gap-1">
              Download map as SVG{' '}
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-600 opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
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
              className="h-9 w-9 rounded-full"
              aria-label="Copy map as SVG"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy map</p>
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="h-6 w-px bg-border mx-1" />

        {/* Undo/Redo Section */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
              className="h-9 w-9 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="flex items-center gap-1">
              {canUndo ? 'Undo' : 'Nothing to undo'}
              {canUndo && (
                <>
                  {' '}
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-600 opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    {getModifierKey()} Z
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
              onClick={onRedo}
              disabled={!canRedo}
              className="h-9 w-9 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Redo"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="flex items-center gap-1">
              {canRedo ? 'Redo' : 'Nothing to redo'}
              {canRedo && (
                <>
                  {' '}
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-gray-200 bg-gray-100 px-1.5 font-mono text-[10px] font-medium text-gray-600 opacity-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                    {getModifierKey()} Y
                  </kbd>
                </>
              )}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div className="h-6 w-px bg-border mx-1" />

        {/* Navigation Section */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onCollapseAll}
              disabled={!canCollapse}
              className="h-9 w-9 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Collapse all panels"
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{canCollapse ? 'Collapse all' : 'No panels to collapse'}</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={onJumpToMap}
              className="h-9 w-9 rounded-full"
              aria-label="Jump to map preview"
            >
              <ArrowDown className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Jump to map</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

