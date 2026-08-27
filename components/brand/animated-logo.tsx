'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { useGeoShape } from '@/components/brand/geo-provider'
import { pickRandomShape } from '@/lib/brand/cycle-pool'
import { LogoFrame, LogoShapeGroup } from '@/lib/brand/logo-svg'
import { LOGO_FRAME, LOGO_PAD } from '@/lib/brand/types'
import type { ParsedShape, ShapeId } from '@/lib/brand/types'

const shapeCache = new Map<string, ParsedShape>()

function cacheKey(id: ShapeId): string {
	return `${id.kind}:${id.code}`
}

async function fetchShape(id: ShapeId): Promise<ParsedShape> {
	const key = cacheKey(id)
	const cached = shapeCache.get(key)
	if (cached) return cached

	const response = await fetch(`/api/brand/shape?kind=${id.kind}&code=${encodeURIComponent(id.code)}`)
	if (!response.ok) {
		throw new Error(`Failed to load shape ${key}`)
	}
	const shape = (await response.json()) as ParsedShape
	shapeCache.set(key, shape)
	return shape
}

function usePrefersReducedMotion(): boolean {
	const [reduced, setReduced] = useState(false)

	useEffect(() => {
		const media = window.matchMedia('(prefers-reduced-motion: reduce)')
		setReduced(media.matches)
		const onChange = () => setReduced(media.matches)
		media.addEventListener('change', onChange)
		return () => media.removeEventListener('change', onChange)
	}, [])

	return reduced
}

export function AnimatedLogo({ intervalMs, size = 32 }: { intervalMs: number; size?: number }) {
	const initialShape = useGeoShape()
	const reducedMotion = usePrefersReducedMotion()
	const [front, setFront] = useState<ParsedShape | null>(initialShape)
	const [back, setBack] = useState<ParsedShape | null>(null)
	const [frontVisible, setFrontVisible] = useState(true)
	const frontRef = useRef(front)
	const backRef = useRef(back)
	const frontVisibleRef = useRef(frontVisible)
	const nextRef = useRef<ParsedShape | null>(null)
	const inflight = useRef(false)

	frontRef.current = front
	backRef.current = back
	frontVisibleRef.current = frontVisible

	useEffect(() => {
		if (!initialShape) return
		shapeCache.set(cacheKey(initialShape), initialShape)
		setFront((current) => current ?? initialShape)
	}, [initialShape])

	const prepareNext = useCallback(async (current: ParsedShape) => {
		if (nextRef.current) return nextRef.current
		const loaded = await fetchShape(pickRandomShape(current))
		nextRef.current = loaded
		return loaded
	}, [])

	useEffect(() => {
		if (reducedMotion || !front) return
		void prepareNext(front).catch((error) => console.error(error))
	}, [front, prepareNext, reducedMotion])

	const cycle = useCallback(async () => {
		if (inflight.current) return
		const current = frontVisibleRef.current ? frontRef.current : backRef.current
		if (!current) return

		inflight.current = true
		try {
			const nextShape = await prepareNext(current)
			nextRef.current = null
			if (frontVisibleRef.current) {
				setBack(nextShape)
				requestAnimationFrame(() => {
					requestAnimationFrame(() => setFrontVisible(false))
				})
			} else {
				setFront(nextShape)
				requestAnimationFrame(() => {
					requestAnimationFrame(() => setFrontVisible(true))
				})
			}
			void prepareNext(nextShape).catch((error) => console.error(error))
		} catch (error) {
			console.error(error)
		} finally {
			inflight.current = false
		}
	}, [prepareNext])

	useEffect(() => {
		if (reducedMotion || intervalMs <= 0) return
		const timer = window.setInterval(() => {
			void cycle()
		}, intervalMs)
		return () => window.clearInterval(timer)
	}, [cycle, intervalMs, reducedMotion])

	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			viewBox={`0 0 ${LOGO_FRAME} ${LOGO_FRAME}`}
			width={size}
			height={size}
			className="overflow-visible text-foreground"
			overflow="visible"
			aria-hidden="true"
			focusable="false">
			{front ? (
				<LogoShapeGroup
					shape={front}
					opacity={frontVisible ? 1 : 0}
					animateOpacity
					inset={-LOGO_PAD}
				/>
			) : null}
			{back ? (
				<LogoShapeGroup
					shape={back}
					opacity={frontVisible ? 0 : 1}
					animateOpacity
					inset={-LOGO_PAD}
				/>
			) : null}
			<LogoFrame inset={-LOGO_PAD} />
		</svg>
	)
}
