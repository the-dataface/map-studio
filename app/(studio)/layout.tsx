import type { ReactNode } from 'react'

import { Header } from '@/components/header'

import { StudioProviders } from './providers'

export default function StudioLayout({ children }: { children: ReactNode }) {
  return (
    <StudioProviders>
      <div className="min-h-screen bg-white transition-colors duration-200 dark:bg-gray-900">
        <Header />
        <main>{children}</main>
      </div>
    </StudioProviders>
  )
}

