"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function TooltipTest() {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="p-4 border border-gray-300 rounded-lg bg-gray-50 dark:bg-gray-800 m-4">
        <h3 className="text-sm font-medium mb-2">Tooltip Test Area</h3>

        {/* Test 1: Simple text tooltip */}
        <div className="mb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-blue-600 cursor-help underline decoration-dotted">
                Hover me for tooltip (Test 1)
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>This is a simple tooltip test</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Test 2: Button tooltip */}
        <div className="mb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                Button with tooltip (Test 2)
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>This is a button tooltip test</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Test 3: Div tooltip */}
        <div className="mb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-block p-2 bg-yellow-200 dark:bg-yellow-800 rounded cursor-pointer">
                Div with tooltip (Test 3)
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>This is a div tooltip test</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Test 4: With custom styling */}
        <div className="mb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-red-600 cursor-help font-bold">Custom styled tooltip (Test 4)</span>
            </TooltipTrigger>
            <TooltipContent className="bg-red-900 text-white border-red-700">
              <p>This is a custom styled tooltip</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  )
}
