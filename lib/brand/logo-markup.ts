import { shapeGroupTransform } from './geometry'
import {
	LOGO_BLEED,
	LOGO_CANVAS,
	LOGO_FRAME,
	LOGO_HANDLE,
	LOGO_PAD,
	LOGO_SHAPE_INSET,
	LOGO_STROKE,
	type ParsedShape,
} from './types'

/** Raster-safe SVG: handles sit fully inside the canvas (favicon / OG). */
export function logoToSvgString(shape: ParsedShape, color: string): string {
	const origin = LOGO_BLEED
	const inner = shapeGroupTransform(shape.viewBox, LOGO_FRAME, LOGO_SHAPE_INSET)
	const transform = `translate(${origin + LOGO_PAD} ${origin + LOGO_PAD}) ${inner}`
	const paths = shape.paths.map((d) => `<path d="${d}" fill="${color}"/>`).join('')
	const canvas = LOGO_CANVAS
	const h = LOGO_HANDLE
	const pad = LOGO_PAD
	const frame = LOGO_FRAME
	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas} ${canvas}" width="${canvas}" height="${canvas}">
  <g transform="${transform}">${paths}</g>
  <rect x="${origin + pad}" y="${origin + pad}" width="${frame}" height="${frame}" fill="none" stroke="${color}" stroke-width="${LOGO_STROKE}"/>
  <rect x="${origin}" y="${origin}" width="${h}" height="${h}" fill="${color}"/>
  <rect x="${origin + frame}" y="${origin}" width="${h}" height="${h}" fill="${color}"/>
  <rect x="${origin}" y="${origin + frame}" width="${h}" height="${h}" fill="${color}"/>
  <rect x="${origin + frame}" y="${origin + frame}" width="${h}" height="${h}" fill="${color}"/>
</svg>`
}

export function logoDataUri(shape: ParsedShape, color: string): string {
	return `data:image/svg+xml;base64,${Buffer.from(logoToSvgString(shape, color)).toString('base64')}`
}
