import { NextRequest, NextResponse } from 'next/server'

import { tryLoadShape } from '@/lib/brand/shape-svg'
import type { ShapeKind } from '@/lib/brand/types'

export const runtime = 'nodejs'

function isShapeKind(value: string | null): value is ShapeKind {
	return value === 'state' || value === 'country'
}

export async function GET(request: NextRequest) {
	const kind = request.nextUrl.searchParams.get('kind')
	const code = request.nextUrl.searchParams.get('code')

	if (!isShapeKind(kind) || !code) {
		return NextResponse.json({ error: 'kind and code are required' }, { status: 400 })
	}

	try {
		const shape = tryLoadShape(kind, code)
		if (!shape) {
			return NextResponse.json({ error: 'Shape not found' }, { status: 404 })
		}
		return NextResponse.json(shape, {
			headers: {
				'Cache-Control': 'public, max-age=31536000, immutable',
			},
		})
	} catch (error) {
		console.error('Failed to load brand shape', error)
		return NextResponse.json({ error: 'Shape not found' }, { status: 404 })
	}
}
