'use client'

import Link from 'next/link'
import { Save, Upload, Loader2 } from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { StudioModeTabs } from '@/components/studio-mode-tabs'
import { useStudioChrome } from '@/lib/studio-chrome-context'
import { studioPrimaryButtonClass } from '@/components/studio-panel'
import { cn } from '@/lib/utils'

const iconButtonClass = 'h-8 w-8 p-0 shrink-0'

export function Header() {
  const { chrome } = useStudioChrome()

  return (
    <header
      id="studio-header"
      className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border sticky top-0 z-50">
      <div className="relative w-full px-4 lg:px-6 h-12">
        <TooltipProvider delayDuration={300}>
          <div className="flex h-full items-center gap-3">
            <div className="flex min-w-0 shrink-0 items-center gap-4">
              <Link href="/">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground hover:opacity-80">
                  Map Studio
                </span>
              </Link>
              {chrome?.showModeTabs ? (
                <StudioModeTabs
                  mode={chrome.studioMode}
                  onModeChange={chrome.setStudioMode}
                  designEnabled={chrome.designModeEnabled}
                />
              ) : null}
            </div>

            {chrome?.showProjectControls ? (
              <div className="pointer-events-none absolute inset-x-0 flex justify-center px-36 sm:px-44">
                <input
                  type="text"
                  value={chrome.projectName}
                  onChange={(e) => chrome.setProjectName(e.target.value)}
                  className="pointer-events-auto w-full max-w-md truncate border-none bg-transparent px-2 py-1 text-center font-mono text-xs font-medium outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Project name"
                  aria-label="Project name"
                />
              </div>
            ) : null}

            <div className="ml-auto flex shrink-0 items-center gap-1.5">
              {chrome?.showProjectControls ? (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={iconButtonClass}
                        onClick={chrome.onExport}
                        disabled={chrome.isExporting || chrome.isSaving}
                        aria-label={chrome.isExporting ? 'Exporting project' : 'Export project'}>
                        {chrome.isExporting ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <Upload className="h-4 w-4" aria-hidden />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Export project</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className={cn(studioPrimaryButtonClass, iconButtonClass)}
                        onClick={chrome.onSave}
                        disabled={chrome.isSaving || chrome.isExporting}
                        aria-label={chrome.isSaving ? 'Saving project' : 'Save project'}>
                        {chrome.isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        ) : (
                          <Save className="h-4 w-4" aria-hidden />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">Save project</TooltipContent>
                  </Tooltip>
                </>
              ) : null}
              <ThemeToggle />
            </div>
          </div>
        </TooltipProvider>
      </div>
    </header>
  )
}
