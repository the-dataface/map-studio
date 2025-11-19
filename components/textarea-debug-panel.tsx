"use client"

import React, { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

export function TextareaDebugPanel() {
  const [value, setValue] = useState(
    "Test your keyboard shortcuts here!\n\nSelect some text and try:\n• Cmd+B (or Ctrl+B) for bold\n• Cmd+I (or Ctrl+I) for italic",
  )
  const [logs, setLogs] = useState<string[]>([])
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Capture console logs for debugging
  React.useEffect(() => {
    const originalLog = console.log
    console.log = (...args) => {
      const message = args.join(" ")
      if (message.includes("[Textarea Debug]")) {
        setLogs((prev) => [...prev.slice(-19), `${new Date().toLocaleTimeString()}: ${message}`])
      }
      originalLog.apply(console, args)
    }

    return () => {
      console.log = originalLog
    }
  }, [])

  const clearLogs = () => {
    setLogs([])
  }

  const testScenarios = [
    {
      name: "Test Bold with Selection",
      action: () => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(0, 4) // Select "Test"
          // Simulate Cmd+B
          const event = new KeyboardEvent("keydown", {
            key: "b",
            metaKey: true,
            bubbles: true,
          })
          textareaRef.current.dispatchEvent(event)
        }
      },
    },
    {
      name: "Test Italic No Selection",
      action: () => {
        if (textareaRef.current) {
          textareaRef.current.focus()
          textareaRef.current.setSelectionRange(10, 10) // Position cursor
          // Simulate Cmd+I
          const event = new KeyboardEvent("keydown", {
            key: "i",
            metaKey: true,
            bubbles: true,
          })
          textareaRef.current.dispatchEvent(event)
        }
      },
    },
  ]

  const browserInfo = {
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Unknown",
    platform: typeof navigator !== "undefined" ? navigator.platform : "Unknown",
    isMac: typeof navigator !== "undefined" && navigator.platform.toUpperCase().indexOf("MAC") >= 0,
  }

  return (
    <div className="space-y-4 p-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🐛 Textarea Debug Panel
            <Badge variant="outline">Development Only</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Browser Info */}
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium mb-2">Browser Environment</h4>
            <div className="text-xs space-y-1">
              <div>
                <strong>Platform:</strong> {browserInfo.platform}
              </div>
              <div>
                <strong>Is Mac:</strong> {browserInfo.isMac ? "Yes" : "No"}
              </div>
              <div>
                <strong>Expected Modifier:</strong> {browserInfo.isMac ? "Cmd (metaKey)" : "Ctrl (ctrlKey)"}
              </div>
            </div>
          </div>

          {/* Test Textarea */}
          <div>
            <label htmlFor="test-textarea" className="block text-sm font-medium mb-2">Test Textarea</label>
            <Textarea
              id="test-textarea"
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Type here and test keyboard shortcuts..."
              rows={6}
            />
          </div>

          {/* Quick Test Buttons */}
          <div className="flex gap-2 flex-wrap">
            {testScenarios.map((scenario, index) => (
              <Button key={index} variant="outline" size="sm" onClick={scenario.action}>
                {scenario.name}
              </Button>
            ))}
            <Button variant="outline" size="sm" onClick={() => setValue("")}>
              Clear Text
            </Button>
          </div>

          {/* Debug Logs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Debug Logs</h4>
              <Button variant="outline" size="sm" onClick={clearLogs}>
                Clear Logs
              </Button>
            </div>
            <div className="bg-black text-green-400 p-3 rounded-lg font-mono text-xs max-h-60 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="text-gray-500">No logs yet. Try using keyboard shortcuts...</div>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Manual Test Instructions */}
          <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-medium mb-2">Manual Testing Instructions</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Focus on the textarea above</li>
              <li>
                Select some text and press <kbd>{browserInfo.isMac ? "Cmd" : "Ctrl"}</kbd> + <kbd>B</kbd>
              </li>
              <li>
                Place cursor without selection and press <kbd>{browserInfo.isMac ? "Cmd" : "Ctrl"}</kbd> + <kbd>I</kbd>
              </li>
              <li>Check the debug logs below for detailed information</li>
              <li>Verify that tags are inserted correctly and cursor is positioned properly</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
