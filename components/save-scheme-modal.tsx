"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Palette } from "lucide-react"

interface SaveSchemeModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (schemeName: string, colors: string[], type: "linear" | "categorical", hasMidpoint?: boolean) => void
  currentSchemeColors: string[]
  currentSchemeType: "linear" | "categorical" // NEW prop
  currentSchemeHasMidpoint?: boolean // NEW prop
}

export function SaveSchemeModal({
  isOpen,
  onClose,
  onSave,
  currentSchemeColors,
  currentSchemeType,
  currentSchemeHasMidpoint,
}: SaveSchemeModalProps) {
  const [schemeName, setSchemeName] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (isOpen) {
      setSchemeName("") // Reset name when modal opens
      // Focus the input field when the modal opens
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 100) // Small delay to ensure modal is rendered and input is available
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleSave = () => {
    if (schemeName.trim()) {
      onSave(schemeName.trim(), currentSchemeColors, currentSchemeType, currentSchemeHasMidpoint)
      onClose()
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault()
      handleSave()
    } else if (event.key === "Escape") {
      event.preventDefault()
      onClose()
    }
  }

  // Helper function to render color scheme preview (replicated here for self-containment)
  const renderColorSchemePreview = (colors: string[], type: "linear" | "categorical", schemeName?: string) => {
    if (type === "categorical") {
      return (
        <div className="flex h-4 w-full rounded overflow-hidden border border-gray-200 dark:border-gray-600">
          {colors.slice(0, 8).map((color, index) => (
            <div
              key={index}
              className="flex-1 min-w-[2px]"
              style={{ backgroundColor: color }}
              title={`Color ${index + 1}: ${color}`}
            />
          ))}
          {colors.length > 8 && (
            <div className="flex-1 bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-xs text-gray-600 dark:text-gray-300">
              +{colors.length - 8}
            </div>
          )}
        </div>
      )
    } else {
      // Linear gradient for sequential/diverging schemes
      const gradient = `linear-gradient(to right, ${colors.join(", ")})`
      return (
        <div
          className="h-4 w-full rounded border border-gray-200 dark:border-gray-600"
          style={{ background: gradient }}
          title={`${schemeName || "Color scheme"}: ${colors.length} colors`}
        />
      )
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md rounded-xl bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-800 transition-all duration-200 animate-in fade-in-50 zoom-in-95 z-[100000]"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white transition-colors duration-200">
            <Save className="h-5 w-5" /> Save Custom Color Scheme
          </DialogTitle>
          <DialogDescription className="text-left space-y-3 text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200">
            Give your custom {currentSchemeType} color scheme a name to save it for future use.
            <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3">
              <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300 transition-colors duration-200">
                <Palette className="h-4 w-4 mt-0.5 flex-shrink-0 transition-transform duration-200 hover:scale-110" />
                <div>
                  <div className="font-medium">Colors to be saved:</div>
                  {currentSchemeType === "categorical" ? (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {currentSchemeColors.map((color, index) => (
                        <div
                          key={index}
                          className="w-4 h-4 rounded-sm border border-gray-300 dark:border-gray-600"
                          style={{ backgroundColor: color }}
                          title={color}
                        />
                      ))}
                    </div>
                  ) : (
                    <div
                      className="h-6 w-full rounded border border-gray-300 dark:border-gray-600 mt-1"
                      style={{
                        background: `linear-gradient(to right, ${currentSchemeColors[0]}, ${
                          currentSchemeHasMidpoint ? `${currentSchemeColors[1]}, ` : ""
                        }${currentSchemeColors[currentSchemeColors.length - 1]})`,
                      }}
                      title={`Linear scheme: ${currentSchemeColors.length} colors`}
                    />
                  )}
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="schemeName" className="text-right">
              Scheme Name
            </Label>
            <Input
              id="schemeName"
              value={schemeName}
              onChange={(e) => setSchemeName(e.target.value)}
              className="col-span-3"
              ref={inputRef}
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto transition-colors duration-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Cancel{" "}
            <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[1.5rem] rounded-[3px] border border-gray-300 border-b-2 px-1 text-[0.65rem] font-mono text-gray-600 shadow-sm dark:border-gray-600 dark:text-gray-300">
              ESC
            </span>
          </Button>
          <Button
            onClick={handleSave}
            disabled={!schemeName.trim()}
            className="w-full sm:w-auto transition-colors duration-200 hover:bg-blue-700 dark:hover:bg-blue-600"
          >
            Save scheme{" "}
            <span className="ml-1 inline-flex items-center justify-center h-4 min-w-[1.5rem] rounded-[3px] border border-blue-700 border-b-2 px-1 text-[0.65rem] font-sans text-white shadow-sm dark:border-blue-600">
              ⏎
            </span>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
