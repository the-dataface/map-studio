"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

// Debug logging utility
const debugLog = (message: string, data?: any) => {
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    console.log(`[Textarea Debug] ${message}`, data || "")
  }
}

// Cross-browser key detection
const isModifierPressed = (e: KeyboardEvent | React.KeyboardEvent) => {
  // Mac: metaKey (Cmd), Windows/Linux: ctrlKey
  const isMac = typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0
  return isMac ? e.metaKey : e.ctrlKey
}

// Validate textarea element and selection
const validateTextarea = (textarea: HTMLTextAreaElement | null): boolean => {
  if (!textarea) {
    debugLog("❌ Textarea element is null")
    return false
  }

  if (typeof textarea.selectionStart !== "number" || typeof textarea.selectionEnd !== "number") {
    debugLog("❌ Selection properties are not available")
    return false
  }

  if (textarea.selectionStart < 0 || textarea.selectionEnd < 0) {
    debugLog("❌ Invalid selection range", { start: textarea.selectionStart, end: textarea.selectionEnd })
    return false
  }

  debugLog("✅ Textarea validation passed")
  return true
}

// Create synthetic change event
const createSyntheticChangeEvent = (
  originalEvent: React.KeyboardEvent<HTMLTextAreaElement>,
  newValue: string,
): React.ChangeEvent<HTMLTextAreaElement> => {
  try {
    // Create a proper synthetic event
    const syntheticEvent = {
      ...originalEvent,
      type: "change",
      target: {
        ...originalEvent.target,
        value: newValue,
      },
      currentTarget: {
        ...originalEvent.currentTarget,
        value: newValue,
      },
    } as React.ChangeEvent<HTMLTextAreaElement>

    debugLog("✅ Synthetic event created successfully")
    return syntheticEvent
  } catch (error) {
    debugLog("❌ Error creating synthetic event", error)
    throw error
  }
}

// Apply formatting with comprehensive error handling
const applyFormatting = (
  textarea: HTMLTextAreaElement,
  tagOpen: string,
  tagClose: string,
  originalEvent: React.KeyboardEvent<HTMLTextAreaElement>,
  onChange?: (event: React.ChangeEvent<HTMLTextAreaElement>) => void,
): boolean => {
  try {
    debugLog("🎯 Starting formatting application", {
      tagOpen,
      tagClose,
      currentValue: textarea.value.substring(0, 50) + "...",
      selectionStart: textarea.selectionStart,
      selectionEnd: textarea.selectionEnd,
    })

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = textarea.value.substring(start, end)
    const currentValue = textarea.value

    debugLog("📝 Selection details", {
      start,
      end,
      selectedText: selectedText || "(no selection)",
      selectedLength: selectedText.length,
    })

    // Calculate new value
    const newValue = currentValue.substring(0, start) + tagOpen + selectedText + tagClose + currentValue.substring(end)

    debugLog("🔄 Calculated new value", {
      oldLength: currentValue.length,
      newLength: newValue.length,
      preview: newValue.substring(
        Math.max(0, start - 10),
        start + tagOpen.length + selectedText.length + tagClose.length + 10,
      ),
    })

    // Calculate cursor position
    let newCursorPos: number
    if (selectedText.length === 0) {
      // No selection: place cursor between tags
      newCursorPos = start + tagOpen.length
      debugLog("📍 Cursor positioning (no selection)", { newCursorPos })
    } else {
      // Text selected: place cursor after closing tag
      newCursorPos = start + tagOpen.length + selectedText.length + tagClose.length
      debugLog("📍 Cursor positioning (with selection)", { newCursorPos })
    }

    // Validate cursor position
    if (newCursorPos < 0 || newCursorPos > newValue.length) {
      debugLog("❌ Invalid cursor position calculated", { newCursorPos, maxLength: newValue.length })
      return false
    }

    // Step 1: Update DOM value directly
    debugLog("🔧 Step 1: Updating DOM value")
    textarea.value = newValue

    // Step 2: Set cursor position
    debugLog("🔧 Step 2: Setting cursor position")
    try {
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      debugLog("✅ Cursor position set successfully")
    } catch (selectionError) {
      debugLog("❌ Error setting cursor position", selectionError)
      // Try alternative approach
      try {
        textarea.selectionStart = newCursorPos
        textarea.selectionEnd = newCursorPos
        debugLog("✅ Cursor position set using fallback method")
      } catch (fallbackError) {
        debugLog("❌ Fallback cursor positioning also failed", fallbackError)
      }
    }

    // Step 3: Trigger onChange event
    debugLog("🔧 Step 3: Triggering onChange event")
    if (onChange) {
      try {
        const syntheticEvent = createSyntheticChangeEvent(originalEvent, newValue)
        onChange(syntheticEvent)
        debugLog("✅ onChange event triggered successfully")
      } catch (changeError) {
        debugLog("❌ Error triggering onChange", changeError)
        return false
      }
    } else {
      debugLog("⚠️ No onChange handler provided")
    }

    // Step 4: Verify final state
    debugLog("🔧 Step 4: Verifying final state")
    setTimeout(() => {
      if (textarea.value === newValue) {
        debugLog("✅ Final verification: Value matches expected")
      } else {
        debugLog("❌ Final verification: Value mismatch", {
          expected: newValue.substring(0, 50) + "...",
          actual: textarea.value.substring(0, 50) + "...",
        })
      }

      if (textarea.selectionStart === newCursorPos && textarea.selectionEnd === newCursorPos) {
        debugLog("✅ Final verification: Cursor position correct")
      } else {
        debugLog("❌ Final verification: Cursor position incorrect", {
          expected: newCursorPos,
          actualStart: textarea.selectionStart,
          actualEnd: textarea.selectionEnd,
        })
      }
    }, 0)

    debugLog("🎉 Formatting application completed successfully")
    return true
  } catch (error) {
    debugLog("💥 Critical error in applyFormatting", error)
    return false
  }
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  // Debug component mount/unmount
  React.useEffect(() => {
    debugLog("🚀 Textarea component mounted")
    return () => {
      debugLog("🔚 Textarea component unmounted")
    }
  }, [])

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      debugLog("⌨️ KeyDown event triggered", {
        key: e.key,
        metaKey: e.metaKey,
        ctrlKey: e.ctrlKey,
        altKey: e.altKey,
        shiftKey: e.shiftKey,
        platform: typeof navigator !== "undefined" ? navigator.platform : "unknown",
      })

      // Check if this is a formatting shortcut
      if (!isModifierPressed(e)) {
        debugLog("⏭️ No modifier key pressed, skipping")
        return
      }

      let tagOpen = ""
      let tagClose = ""

      if (e.key === "b" || e.key === "B") {
        tagOpen = "<b>"
        tagClose = "</b>"
        debugLog("🔤 Bold formatting detected")
      } else if (e.key === "i" || e.key === "I") {
        tagOpen = "<i>"
        tagClose = "</i>"
        debugLog("🔤 Italic formatting detected")
      } else {
        debugLog("⏭️ Not a formatting shortcut, skipping")
        return
      }

      debugLog("🛑 Preventing default browser behavior")
      e.preventDefault()
      e.stopPropagation()

      // Get textarea element
      let textarea: HTMLTextAreaElement | null = null

      if (ref && typeof ref !== "function" && ref.current) {
        textarea = ref.current
        debugLog("✅ Textarea obtained from ref")
      } else if (e.currentTarget instanceof HTMLTextAreaElement) {
        textarea = e.currentTarget
        debugLog("✅ Textarea obtained from currentTarget")
      } else if (e.target instanceof HTMLTextAreaElement) {
        textarea = e.target as HTMLTextAreaElement
        debugLog("✅ Textarea obtained from target")
      }

      if (!validateTextarea(textarea)) {
        debugLog("❌ Textarea validation failed, aborting")
        return
      }

      // Apply formatting
      const success = applyFormatting(textarea!, tagOpen, tagClose, e, props.onChange)

      if (success) {
        debugLog("🎉 Keyboard shortcut handled successfully")
      } else {
        debugLog("💥 Keyboard shortcut handling failed")
      }

      // Call original onKeyDown if provided
      if (props.onKeyDown) {
        debugLog("🔄 Calling original onKeyDown handler")
        try {
          props.onKeyDown(e)
        } catch (error) {
          debugLog("❌ Error in original onKeyDown handler", error)
        }
      }
    },
    [ref, props.onChange, props.onKeyDown],
  )

  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono font-mono font-mono font-mono",
        className,
      )}
      ref={ref}
      onKeyDown={handleKeyDown}
      {...props}
    />
  )
})

Textarea.displayName = "Textarea"

export { Textarea }
