import type { Metadata } from 'next'
import Link from 'next/link'

// Server component - fully SSR for SEO and performance
// All content is server-rendered, ensuring optimal SEO and fast initial page load
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

export default function LandingPage() {
  // This is a server component - all content is server-rendered for optimal SEO and performance
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-4xl flex-col items-start justify-center gap-6 px-6 py-16">
      <div>
        <span className="rounded-full bg-muted px-3 py-1 text-xs uppercase tracking-wide text-muted-foreground">
          Map Studio Preview
        </span>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Create data-rich maps without leaving your browser.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Import your dataset, geocode locations, style choropleths or symbol maps, and export production-ready visuals in
          minutes. Built for editorial teams and designers who care about quality and speed.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary/90"
        >
          Launch Studio
        </Link>
        <Link
          href="/docs"
          className="inline-flex h-11 items-center rounded-md border border-input px-5 text-sm font-medium text-foreground transition hover:bg-muted"
        >
          View Documentation
        </Link>
      </div>
    </section>
  )
}

