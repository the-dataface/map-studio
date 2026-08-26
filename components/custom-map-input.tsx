'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { HelpCircle, AlertCircle, CheckCircle, Trash2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { DataRow } from '@/app/(studio)/types'
import { toast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { ensurePathsClosedAndFormatSVG, validateCustomSVG } from '@/modules/data-ingest/svg'
import { cn } from '@/lib/utils'
import {
  studioPanelClass,
  studioPrimaryButtonClass,
  studioHeaderIconButtonClass,
  StudioExpandableHeader,
} from '@/components/studio-panel'

interface CustomMapInputProps {
  onDataLoad: (
    mapType: 'custom',
    parsedData: DataRow[],
    columns: string[],
    rawData: string,
    customMapData: string
  ) => void
  isExpanded: boolean
  setIsExpanded: (expanded: boolean) => void
  onClearData: (mapType: 'custom') => void
}

export function CustomMapInput({ onDataLoad, isExpanded, setIsExpanded, onClearData }: CustomMapInputProps) {
  const [customSVG, setCustomSVG] = useState('')
  const [showHelpModal, setShowHelpModal] = useState(false)

  useEffect(() => {
    const handler = () => setIsExpanded(false)
    window.addEventListener('collapse-all-panels', handler)
    return () => window.removeEventListener('collapse-all-panels', handler)
  }, [setIsExpanded])

  const handleLoadMap = () => {
    const validationResult = validateCustomSVG(customSVG)
    if (!validationResult.isValid) {
      toast({
        description: validationResult.message,
        variant: 'destructive',
        duration: 5000,
        icon: <AlertCircle className="h-5 w-5" />,
      })
      return
    }

    if (!customSVG.trim()) return

    const { formattedSvg, closedPathCount } = ensurePathsClosedAndFormatSVG(customSVG)
    onDataLoad('custom', [], [], '', formattedSvg)

    let toastDescription = 'Custom map loaded successfully.'
    if (closedPathCount > 0) {
      toastDescription += ` ${closedPathCount} path${closedPathCount > 1 ? 's' : ''} automatically closed.`
    }

    toast({
      description: toastDescription,
      variant: 'success',
      icon: <CheckCircle className="h-5 w-5" />,
    })
  }

  return (
    <TooltipProvider>
    <Card className={cn(studioPanelClass, 'overflow-hidden')}>
      <StudioExpandableHeader
        title="Custom map"
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      />

      <div
        className={cn(
          'studio-panel-expand-body transition-all duration-300 ease-in-out overflow-hidden',
          isExpanded ? 'max-h-none opacity-100' : 'max-h-0 opacity-0'
        )}>
        <CardContent className="space-y-4 px-4 pb-4 pt-2">
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor="custom-svg-input" className="text-sm font-medium text-foreground">
                Paste SVG code
              </label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setCustomSVG('')
                      onClearData('custom')
                    }}
                    disabled={!customSVG.trim()}
                    className={cn(
                      studioHeaderIconButtonClass,
                      'hover:!bg-destructive/10 hover:!text-destructive hover:!border-destructive/30 disabled:hover:!bg-transparent'
                    )}
                    aria-label="Clear code">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Clear code</TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              id="custom-svg-input"
              placeholder="Paste your SVG code here..."
              value={customSVG}
              onChange={(e) => setCustomSVG(e.target.value)}
              className="min-h-[120px] font-mono text-sm"
            />
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center text-xs text-muted-foreground">
              <span>Paste SVG code for custom map visualization.</span>
              <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
                <DialogTrigger asChild>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 px-1 text-xs text-primary hover:text-primary/80"
                    onClick={() => setShowHelpModal(true)}>
                    <HelpCircle className="mr-1 h-3 w-3" />
                    Help
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Custom Map SVG Structure</DialogTitle>
                    <DialogDescription>
                      For the custom map to work correctly, your SVG should follow a specific structure:
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-2 text-sm text-muted-foreground">
                    <p>
                      Your SVG should contain a main <code className="font-mono">{'<g id="Map">'}</code> group with{' '}
                      <code className="font-mono">Nations</code> and <code className="font-mono">States</code> groups.
                      State paths should use IDs like <code className="font-mono">State-CA</code>.
                    </p>
                    <p>
                      Ensure all path data (<code className="font-mono">d</code> attribute) is valid and closed.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Button
              onClick={handleLoadMap}
              disabled={!customSVG.trim()}
              className={cn('w-full sm:w-auto', studioPrimaryButtonClass)}>
              Load map
            </Button>
          </div>
        </CardContent>
      </div>
    </Card>
    </TooltipProvider>
  )
}
