import type { Metadata } from 'next'

import { HomePageClient } from '@/components/home-page-client'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: 'Map Studio - Create Data-Rich Maps Without Leaving Your Browser',
  description:
    'Import your dataset, geocode locations, style choropleths or symbol maps, and export production-ready visuals in minutes. Built for editorial teams and designers who care about quality and speed.',
  keywords: ['map', 'data visualization', 'choropleth', 'geocoding', 'cartography', 'data mapping'],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Map Studio - Create Data-Rich Maps',
    description: 'Create beautiful, data-rich maps without leaving your browser.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Map Studio - Create Data-Rich Maps',
    description: 'Create beautiful, data-rich maps without leaving your browser.',
  },
}

export default function HomePage() {
  return <HomePageClient />
}
