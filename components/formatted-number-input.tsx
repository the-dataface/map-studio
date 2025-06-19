"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { RefreshCcw } from "lucide-react"

interface FormattedNumberInputProps {
  value: number | null // Canonical value from parent, let's call it propValue internally
  onChange: (value: number | null) => void
  format: string
  className?: string
  onReset?: () => void
  resetDisabled?: boolean
}

// Helper function to parse compact numbers
const parseCompactNumber = (value: string): number | null => {
  const match = value.match(/^(\d+(\.\d+)?)([KMB])$/i)
  if (!match) return null

  let num = Number.parseFloat(match[1])
  const suffix = match[3].toUpperCase()

  switch (suffix) {
    case "K":
      num *= 1_000
      break
    case "M":
      num *= 1_000_000
      break
    case "B":
      num *= 1_000_000_000
      break
  }
  return num
}

// Format a number value based on the selected format
const formatNumber = (value: number | null, format: string): string => {
  if (value === null || value === undefined) return ""

  const num = value

  switch (format) {
    case "raw":
      return num.toString()
    case "comma":
      return num.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 20 })
    case "compact":
      if (Math.abs(num) >= 1e9) return (num / 1e9).toFixed(1) + "B"
      if (Math.abs(num) >= 1e6) return (num / 1e6).toFixed(1) + "M"
      if (Math.abs(num) >= 1e3) return (num / 1e3).toFixed(1) + "K"
      return num.toString()
    case "currency":
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(num)
    case "percent":
      return (num * 100).toFixed(0) + "%"
    case "0-decimals":
      return Math.round(num).toLocaleString("en-US")
    case "1-decimal":
      return num.toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    case "2-decimals":
      return num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    default:
      return num.toString()
  }
}

// Parse input string to number
const parseInputValue = (inputValue: string): number | null => {
  if (inputValue.trim() === "") return null

  const compactNum = parseCompactNumber(inputValue)
  if (compactNum !== null) return compactNum

  const cleanedValue = inputValue.replace(/[,$%]/g, "")
  const parsedNum = Number.parseFloat(cleanedValue)

  return isNaN(parsedNum) ? null : parsedNum
}

export function FormattedNumberInput({
  value: propValue, // Use alias for clarity
  onChange,
  format,
  className,
  onReset,
  resetDisabled = true,
}: FormattedNumberInputProps) {
  const [displayValue, setDisplayValue] = useState<string>("")
  const [internalParsedValue, setInternalParsedValue] = useState<number | null>(propValue)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Initialize and sync with propValue when not focused or when propValue fundamentally changes
  useEffect(() => {
    if (!isFocused) {
      // If not focused, always reflect the propValue, formatted.
      setDisplayValue(formatNumber(propValue, format))
      setInternalParsedValue(propValue)
    } else {
      // If focused, only update if propValue is truly different from our internal understanding.
      // This handles external resets while focused.
      if (propValue !== internalParsedValue) {
        setInternalParsedValue(propValue)
        // Show the raw version of the new propValue as the user is actively editing.
        setDisplayValue(propValue !== null ? propValue.toString() : "")
      }
    }
  }, [propValue, format, isFocused]) // Removed internalParsedValue from deps to avoid self-triggering loops with its own setter

  // Effect for initial mount to set displayValue correctly
  useEffect(() => {
    setDisplayValue(formatNumber(propValue, format))
    setInternalParsedValue(propValue)
  }, []) // Empty dependency array means it runs once on mount

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentInputText = e.target.value
    setDisplayValue(currentInputText) // Crucial: Immediately update display to show typed character

    const parsed = parseInputValue(currentInputText)
    setInternalParsedValue(parsed) // Update internal understanding
    onChange(parsed) // Notify parent
  }

  const handleFocus = () => {
    setIsFocused(true)
    // When focused, convert the current internal (parsed) value to its raw string for editing.
    // This ensures that if the field was previously e.g. "1.00M", it becomes "1000000" for editing.
    setDisplayValue(internalParsedValue !== null ? internalParsedValue.toString() : "")
  }

  const handleBlur = () => {
    setIsFocused(false)
    // On blur, the useEffect listening to [propValue, format, isFocused]
    // will trigger because isFocused changed. It will then format propValue.
    // This means propValue (updated by parent via onChange) is the source of truth for formatting.
    // If there's a desire to parse and format the *current text field content* before relying on propValue,
    // that logic would go here, but it can be complex if propValue updates are asynchronous.
    // For now, relying on the effect is simpler and defers to parent's state.
    // To be absolutely sure, we can force a format based on the latest internalParsedValue:
    setDisplayValue(formatNumber(internalParsedValue, format))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      inputRef.current?.blur()
    }
  }

  return (
    <TooltipProvider>
      <div className={cn("relative", className)}>
        <Input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(onReset ? "pr-8" : "")}
        />
        {onReset && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (onReset) {
                    onReset() // Parent will change propValue. The useEffect will handle UI update.
                  }
                }}
                disabled={resetDisabled}
                className="absolute right-0 top-0 h-full w-8 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:text-gray-700 dark:hover:text-gray-300"
              >
                <RefreshCcw className="h-3 w-3" />
                <span className="sr-only">Reset to data value</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              className="bg-black text-white border-black px-3 py-2 rounded-md shadow-lg text-xs font-medium z-50"
              sideOffset={8}
            >
              <p>Reset to data value</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
}
