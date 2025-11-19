import type { ReactNode } from 'react'

// Server component layout for marketing pages - ensures SSR for all marketing routes
// Note: Metadata is exported from individual pages, not route group layouts
export default function MarketingLayout({ children }: { children: ReactNode }) {
  // Server-rendered layout - no client-side JavaScript needed for marketing pages
  return <div className="min-h-screen bg-background">{children}</div>
}

