'use client'

import type { ReactNode } from 'react'
import React from 'react'
import ReactDOM from 'react-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

interface StudioProvidersProps {
  children: ReactNode
}

export function StudioProviders({ children }: StudioProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days (formerly cacheTime)
            retry: 2,
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  // Initialize Axe accessibility checks in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      // Dynamically import Axe only in development to avoid including it in production bundle
      import('@axe-core/react').then((axe) => {
        // Axe will automatically run accessibility checks and log violations to console
        // Delay of 1000ms ensures React has finished rendering
        axe.default(React, ReactDOM, 1000)
      }).catch(() => {
        // Silently fail if Axe can't be loaded (e.g., in test environment or SSR)
      })
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        {children}
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  )
}

