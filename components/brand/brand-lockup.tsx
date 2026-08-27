'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'

import { AnimatedLogo } from '@/components/brand/animated-logo'

const wordmarkClass =
	'font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-foreground'

export function BrandDivider() {
	return (
		<span className="h-full w-px shrink-0 bg-border" aria-hidden="true" />
	)
}

export function BrandLockup({
	intervalMs,
	showWordmark,
	afterDivider,
}: {
	intervalMs: number
	showWordmark?: boolean
	afterDivider?: ReactNode
}) {
	const mark = <AnimatedLogo intervalMs={intervalMs} />

	if (showWordmark) {
		return (
			<Link
				href="/"
				className="flex h-12 items-center gap-3 overflow-visible hover:opacity-80"
				aria-label="Map Studio home">
				{mark}
				<BrandDivider />
				<span className={wordmarkClass}>Map Studio</span>
			</Link>
		)
	}

	return (
		<div className="flex h-12 min-w-0 shrink-0 items-center gap-3 overflow-visible">
			<Link href="/" className="flex items-center overflow-visible hover:opacity-80" aria-label="Map Studio home">
				{mark}
			</Link>
			<BrandDivider />
			{afterDivider}
		</div>
	)
}
