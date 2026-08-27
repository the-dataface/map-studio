export type ShapeKind = 'state' | 'country'

export interface ShapeId {
	kind: ShapeKind
	code: string
}

export interface ParsedShape extends ShapeId {
	name: string
	viewBox: string
	paths: string[]
}

export const FALLBACK_SHAPE_ID: ShapeId = { kind: 'state', code: 'US' }

/** Warm paper + ink matching `--background` / `--foreground` */
export const BRAND_PAPER = '#faf8f5'
export const BRAND_INK = '#2c2521'
export const BRAND_MUTED = '#7a6e66'

/** Thin square, in user units. Handles are centered on its vertices. */
export const LOGO_FRAME = 32
export const LOGO_HANDLE = 4
export const LOGO_STROKE = 1.15
export const LOGO_SHAPE_INSET = 7
export const LOGO_PAD = LOGO_HANDLE / 2
/** Extra canvas around overflowing handles so they aren't clipped at the edge. */
export const LOGO_BLEED = 1
export const LOGO_CANVAS = LOGO_FRAME + LOGO_HANDLE + LOGO_BLEED * 2
