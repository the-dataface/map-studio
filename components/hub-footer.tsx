'use client'

import Link from 'next/link'

import { hubInsetClass } from './hub-layout'

const externalLinkClass = 'underline-offset-4 hover:underline'

export function HubFooter() {
  return (
    <footer className="mt-auto border-t border-border py-8">
      <div className={hubInsetClass}>
        <p className="font-mono text-[11px] text-muted-foreground">
          © 2026 The DataFace · Built with 🌎 by{' '}
          <Link
            href="https://samvickars.com"
            className={externalLinkClass}
            target="_blank"
            rel="noopener noreferrer">
            Sam
          </Link>{' '}
          and{' '}
          <Link
            href="https://thedataface.com"
            className={externalLinkClass}
            target="_blank"
            rel="noopener noreferrer">
            The DataFace team
          </Link>
          .
        </p>
      </div>
    </footer>
  )
}
