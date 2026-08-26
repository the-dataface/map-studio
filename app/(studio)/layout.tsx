import type { ReactNode } from 'react'

import { Header } from '@/components/header'
import { StudioChromeProvider } from '@/lib/studio-chrome-context'

import { StudioProviders } from './providers'

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <StudioProviders>
      <StudioChromeProvider>
        <div className="flex h-screen flex-col overflow-hidden bg-background">
          <Header />
          <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
        </div>
      </StudioChromeProvider>
    </StudioProviders>
  )
}

