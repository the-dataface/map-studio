'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { HelpCircle, AlertCircle, CheckCircle, Trash2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
import { studioPrimaryButtonClass, studioHeaderIconButtonClass } from '@/components/studio-panel'

interface CustomBoundaryInputProps {
  onLoad: (svg: string) => void
  onClear: () => void
}

/** Inline custom boundary upload — no nested card chrome. */
export function CustomBoundaryInput({ onLoad, onClear }: CustomBoundaryInputProps) {
  const [customSVG, setCustomSVG] = useState('')
  const [showHelpModal, setShowHelpModal] = useState(false)

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
    onLoad(formattedSvg)

    let toastDescription = 'Custom boundaries loaded.'
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
      <div className="mt-4 space-y-3 border-t border-border pt-4">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="custom-svg-input" className="text-sm font-medium">
            Paste SVG boundaries
          </label>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  setCustomSVG('')
                  onClear()
                }}
                disabled={!customSVG.trim()}
                className={cn(
                  studioHeaderIconButtonClass,
                  'hover:!bg-destructive/10 hover:!text-destructive',
                )}
                aria-label="Clear code"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Clear</TooltipContent>
          </Tooltip>
        </div>
        <Textarea
          id="custom-svg-input"
          placeholder="Paste your SVG code here…"
          value={customSVG}
          onChange={(e) => setCustomSVG(e.target.value)}
          className="min-h-[100px] font-mono text-sm"
        />
        <div className="flex items-center justify-between gap-2">
          <Dialog open={showHelpModal} onOpenChange={setShowHelpModal}>
            <DialogTrigger asChild>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                <HelpCircle className="mr-1 h-3 w-3" />
                SVG structure help
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Custom boundary SVG</DialogTitle>
                <DialogDescription>
                  Include a <code className="font-mono">&lt;g id=&quot;Map&quot;&gt;</code> group with state paths
                  using IDs like <code className="font-mono">State-CA</code>.
                </DialogDescription>
              </DialogHeader>
            </DialogContent>
          </Dialog>
          <Button
            onClick={handleLoadMap}
            disabled={!customSVG.trim()}
            size="sm"
            className={studioPrimaryButtonClass}
          >
            Load boundaries
          </Button>
        </div>
      </div>
    </TooltipProvider>
  )
}
