"use client"

import { TextareaDebugPanel } from "@/components/textarea-debug-panel"

export default function DebugPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Textarea Keyboard Shortcuts Debug</h1>
        <TextareaDebugPanel />
      </div>
    </div>
  )
}
