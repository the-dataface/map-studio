'use client'

import type React from 'react'
import { useMemo } from 'react'
import { AlertCircle, CheckCircle2 } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip'
import { checkContrast, suggestAccessibleColors } from '@/lib/accessibility/color-contrast'
import { cn } from '@/lib/utils'

interface ColorContrastCheckerProps {
  foreground: string
  background: string
  isLargeText?: boolean
  showSuggestions?: boolean
  className?: string
  onColorSelect?: (color: string) => void // Callback when a suggested color is clicked
}

export function ColorContrastChecker({
  foreground,
  background,
  isLargeText = false,
  showSuggestions = true,
  className,
  onColorSelect,
}: ColorContrastCheckerProps) {
  const contrastResult = useMemo(() => {
    if (!foreground || !background || foreground === '' || background === '') {
      return null
    }

    // Validate hex colors
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    if (!hexRegex.test(foreground) || !hexRegex.test(background)) {
      return null
    }

    return checkContrast(foreground, background, 'AA', isLargeText ? 'large' : 'small')
  }, [foreground, background, isLargeText])

  const suggestedColors = useMemo(() => {
    if (!contrastResult || contrastResult.meets || !showSuggestions || !onColorSelect) {
      return []
    }
    return suggestAccessibleColors(foreground, background, 5)
  }, [contrastResult, foreground, background, showSuggestions, onColorSelect])

  if (!contrastResult) {
    return null
  }

  const { meets, ratio } = contrastResult

  return (
    <div className={cn('mt-2', className)}>
      {meets ? (
        // Success state: Icon + ratio + vs + background color circle
        <div className="flex items-center gap-2 text-xs">
          <CheckCircle2 className="h-7 w-7 text-green-600 dark:text-green-400 flex-shrink-0" aria-hidden="true" />
          <span className="font-bold text-gray-900 dark:text-white">{ratio.toFixed(2)}</span>
          <span className="text-gray-500 dark:text-gray-400">vs</span>
          <div
            className="w-7 h-7 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"
            style={{ backgroundColor: background }}
            title={`Background: ${background}`}
            aria-label={`Background color: ${background}`}
          />
        </div>
      ) : (
        // Warning state: Icon + ratio + vs + background color circle + suggestions
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle className="h-7 w-7 text-amber-600 dark:text-amber-400 flex-shrink-0" aria-hidden="true" />
            <span className="font-bold text-gray-900 dark:text-white">{ratio.toFixed(2)}</span>
            <span className="text-gray-500 dark:text-gray-400">vs</span>
            <div
              className="w-7 h-7 rounded-full border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"
              style={{ backgroundColor: background }}
              title={`Background: ${background}`}
              aria-label={`Background color: ${background}`}
            />
          </div>
          {suggestedColors.length > 0 && (
            <div className="space-y-1.5 pl-9">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-gray-600 dark:text-gray-400">Try:</span>
                <TooltipProvider>
                  <div className="flex items-center gap-1.5">
                    {suggestedColors.map((color, idx) => (
                      <Tooltip key={`${color}-${idx}`}>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => onColorSelect?.(color)}
                            className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors cursor-pointer"
                            style={{ backgroundColor: color }}
                            aria-label={`Suggested color: ${color}`}>
                            <span className="sr-only">{color}</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="font-mono text-xs">{color}</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                </TooltipProvider>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                We suggest a minimum contrast of {isLargeText ? '3.0' : '4.5'} vs{' '}
                <span className="inline-flex items-center gap-1">
                  <span
                    className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600 inline-block"
                    style={{ backgroundColor: background }}
                    aria-hidden="true"
                  />
                  <span className="font-mono">{background}</span>
                </span>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
