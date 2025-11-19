'use client'

import type React from 'react'
import { useMemo } from 'react'
import { AlertTriangle, CheckCircle2, Eye } from 'lucide-react'
import { checkCategoricalColorScheme, getColorBlindnessTypeName } from '@/lib/accessibility/color-blindness'
import { cn } from '@/lib/utils'

interface CategoricalColorCheckerProps {
  colors: string[]
  className?: string
}

export function CategoricalColorChecker({ colors, className }: CategoricalColorCheckerProps) {
  const checkResult = useMemo(() => {
    if (!colors || colors.length < 2) {
      return null
    }

    // Filter out invalid colors
    const validColors = colors.filter((color) => {
      const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
      return color && hexRegex.test(color)
    })

    if (validColors.length < 2) {
      return null
    }

    return checkCategoricalColorScheme(validColors)
  }, [colors])

  if (!checkResult) {
    return null
  }

  const { issues, allDistinguishable } = checkResult

  if (allDistinguishable) {
    return (
      <div className={cn('mt-2', className)}>
        <div className="flex items-start gap-2 rounded-md px-2 py-1.5 text-xs bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200">
          <CheckCircle2 className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
          <div className="flex-1">
            <div className="font-medium">Color-blind accessible</div>
            <div className="mt-0.5 opacity-90">
              All colors are distinguishable for users with color vision deficiencies.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('mt-2 space-y-2', className)}>
      <div className="flex items-start gap-2 rounded-md px-2 py-1.5 text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200">
        <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
        <div className="flex-1">
          <div className="font-medium">Color-blind accessibility issues</div>
          <div className="mt-0.5 opacity-90">
            Some color pairs may be difficult to distinguish for users with color vision deficiencies.
          </div>
        </div>
      </div>

      <div className="space-y-1.5">
        {issues.map((issue, idx) => (
          <div
            key={`${issue.color1Index}-${issue.color2Index}-${idx}`}
            className="flex items-start gap-2 rounded-md px-2 py-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200">
            <Eye className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <div className="font-medium">
                Colors {issue.color1Index + 1} and {issue.color2Index + 1} are similar
              </div>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <div
                    className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: issue.color1 }}
                    title={issue.color1}
                  />
                  <span className="font-mono text-xs">{issue.color1}</span>
                </div>
                <span className="text-gray-500 dark:text-gray-400">vs</span>
                <div className="flex items-center gap-1">
                  <div
                    className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"
                    style={{ backgroundColor: issue.color2 }}
                    title={issue.color2}
                  />
                  <span className="font-mono text-xs">{issue.color2}</span>
                </div>
              </div>
              <div className="mt-1 text-xs opacity-90">
                Affected by:{' '}
                {issue.colorBlindnessTypes.map(getColorBlindnessTypeName).join(', ')}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

