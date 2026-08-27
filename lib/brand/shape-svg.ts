import { readFileSync } from 'fs'
import { join } from 'path'

import { getCountryShape, getStateShape } from 'df-state-shapes'

import { isCountryCode, isStateCode } from './geo'
import { FALLBACK_SHAPE_ID, type ParsedShape, type ShapeKind } from './types'

const cache = new Map<string, ParsedShape>()

function packageAssetPath(relativePath: string): string {
	return join(process.cwd(), 'node_modules/df-state-shapes', relativePath)
}

function parseShapeSvg(svg: string): { viewBox: string; paths: string[] } {
	const viewBox = svg.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 128 128'
	const paths: string[] = []
	const pathRe = /<path\b[^>]*\bd="([^"]+)"/gi
	let match: RegExpExecArray | null
	while ((match = pathRe.exec(svg))) {
		paths.push(match[1])
	}
	return { viewBox, paths }
}

function resolveAsset(kind: ShapeKind, code: string): { name: string; path: string } | null {
	try {
		if (kind === 'state') {
			if (!isStateCode(code)) return null
			const shape = getStateShape(code, { variant: 'theme' })
			return { name: shape.name, path: shape.path }
		}
		if (!isCountryCode(code)) return null
		const shape = getCountryShape(code, { variant: 'theme' })
		return { name: shape.name, path: shape.path }
	} catch {
		return null
	}
}

export function tryLoadShape(kind: ShapeKind, code: string): ParsedShape | null {
	const normalized = code.trim().toUpperCase()
	const cacheKey = `${kind}:${normalized}`
	const cached = cache.get(cacheKey)
	if (cached) return cached

	const resolved = resolveAsset(kind, normalized)
	if (!resolved) return null

	try {
		const svg = readFileSync(packageAssetPath(resolved.path), 'utf8')
		const parsed = parseShapeSvg(svg)
		if (parsed.paths.length === 0) return null
		const shape: ParsedShape = {
			kind,
			code: normalized,
			name: resolved.name,
			viewBox: parsed.viewBox,
			paths: parsed.paths,
		}
		cache.set(cacheKey, shape)
		return shape
	} catch {
		return null
	}
}

export function loadShape(kind: ShapeKind, code: string): ParsedShape {
	const shape = tryLoadShape(kind, code)
	if (shape) return shape
	if (kind === FALLBACK_SHAPE_ID.kind && code.trim().toUpperCase() === FALLBACK_SHAPE_ID.code) {
		throw new Error('Failed to load fallback US outline shape')
	}
	const fallback = tryLoadShape(FALLBACK_SHAPE_ID.kind, FALLBACK_SHAPE_ID.code)
	if (!fallback) throw new Error('Failed to load fallback US outline shape')
	return fallback
}
