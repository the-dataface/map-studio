'use client'

import { createContext, useContext, type ReactNode } from 'react'

import type { ParsedShape } from '@/lib/brand/types'

const GeoContext = createContext<ParsedShape | null>(null)

export function GeoProvider({
	initialShape,
	children,
}: {
	initialShape: ParsedShape
	children: ReactNode
}) {
	return <GeoContext.Provider value={initialShape}>{children}</GeoContext.Provider>
}

export function useGeoShape(): ParsedShape | null {
	return useContext(GeoContext)
}
