'use client'

import type React from 'react'
import { useMemo } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { checkContrast, suggestAccessibleColors } from '@/lib/accessibility/color-contrast'
import {
  resolveContrastBackgrounds,
  worstContrastBackground,
  type ContrastUseCase,
} from '@/lib/accessibility/contrast-context'
import type { DimensionSettings, StylingSettings } from '@/app/(studio)/types'
import { cn } from '@/lib/utils'

interface ColorContrastCheckerProps {
  foreground: string
  /** Single background — used when contrastUseCase is not set */
  background?: string
  /** Evaluate against multiple contextual backgrounds (worst case wins) */
  contrastUseCase?: ContrastUseCase
  stylingSettings?: StylingSettings
  dimensionSettings?: DimensionSettings
  isLargeText?: boolean
  showSuggestions?: boolean
  className?: string
  onColorSelect?: (color: string) => void
}

export function ColorContrastChecker({
  foreground,
  background,
  contrastUseCase,
  stylingSettings,
  dimensionSettings,
  isLargeText = false,
  showSuggestions = true,
  className,
  onColorSelect,
}: ColorContrastCheckerProps) {
  const evaluation = useMemo(() => {
    if (!foreground) return null

    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (!hexRegex.test(foreground)) return null

    let evalBackground = background || '#faf8f5'

    if (contrastUseCase && stylingSettings) {
      const candidates = resolveContrastBackgrounds(contrastUseCase, stylingSettings, dimensionSettings)
      const worst = worstContrastBackground(foreground, candidates)
      if (worst) evalBackground = worst.background
    }

    if (!evalBackground || !hexRegex.test(evalBackground)) return null

    const result = checkContrast(foreground, evalBackground, 'AA', isLargeText ? 'large' : 'small')
    return { ...result, evalBackground }
  }, [foreground, background, contrastUseCase, stylingSettings, dimensionSettings, isLargeText])

  const suggestedColors = useMemo(() => {
    if (!evaluation || evaluation.meets || !showSuggestions || !onColorSelect) return []
    return suggestAccessibleColors(foreground, evaluation.evalBackground, 5)
  }, [evaluation, foreground, showSuggestions, onColorSelect])

  if (!evaluation) return null

  const { meets, ratio, evalBackground } = evaluation

  return (
    <div className={cn('mt-2', className)}>
      {meets ? (
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle2 className="h-4 w-4 text-green-700 dark:text-green-400 shrink-0" aria-hidden="true" />
          <span className="font-mono text-[11px] font-medium">{ratio.toFixed(2)}:1</span>
          <span className="text-muted-foreground">vs</span>
          <div
            className="w-4 h-4 border border-border shrink-0"
            style={{ backgroundColor: evalBackground }}
            title={`Worst-case background: ${evalBackground}`}
          />
          {contrastUseCase && (
            <span className="text-muted-foreground text-[10px]">worst case</span>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle className="h-4 w-4 text-amber-700 dark:text-amber-400 shrink-0" aria-hidden="true" />
            <span className="font-mono text-[11px] font-medium">{ratio.toFixed(2)}:1</span>
            <span className="text-muted-foreground">vs</span>
            <div
              className="w-4 h-4 border border-border shrink-0"
              style={{ backgroundColor: evalBackground }}
              title={`Worst-case background: ${evalBackground}`}
            />
            {contrastUseCase && (
              <span className="text-muted-foreground text-[10px]">worst case</span>
            )}
          </div>
          {suggestedColors.length > 0 && (
            <div className="space-y-1 pl-6">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Try</span>
                <TooltipProvider>
                  <div className="flex items-center gap-1">
                    {suggestedColors.map((color, idx) => (
                      <Tooltip key={`${color}-${idx}`}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => onColorSelect?.(color)}
                            className="w-4 h-4 border border-border hover:border-foreground/40 focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                            style={{ backgroundColor: color }}
                            aria-label={`Suggested color: ${color}`}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-mono text-xs">{color}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              </div>
              <p className="text-[10px] text-muted-foreground">
                Needs {isLargeText ? '3.0' : '4.5'}:1 against map fills, not just the canvas background.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
