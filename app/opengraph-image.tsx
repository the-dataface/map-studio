import { readFile } from 'fs/promises'
import { join } from 'path'

import { ImageResponse } from 'next/og'

import { logoDataUri } from '@/lib/brand/logo-markup'
import { loadShape } from '@/lib/brand/shape-svg'
import { BRAND_INK, BRAND_MUTED, BRAND_PAPER, FALLBACK_SHAPE_ID } from '@/lib/brand/types'

export const runtime = 'nodejs'
export const alt = 'Map Studio — Create data-rich maps without leaving your browser. By DFLabs.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

async function loadFont(relativePath: string) {
	return readFile(join(process.cwd(), 'node_modules/geist/dist/fonts', relativePath))
}

export default async function OpenGraphImage() {
	const shape = loadShape(FALLBACK_SHAPE_ID.kind, FALLBACK_SHAPE_ID.code)
	const src = logoDataUri(shape, BRAND_INK)
	const [geistMonoBold, geistSansRegular, geistSansMedium] = await Promise.all([
		loadFont('geist-mono/GeistMono-Bold.ttf'),
		loadFont('geist-sans/Geist-Regular.ttf'),
		loadFont('geist-sans/Geist-Medium.ttf'),
	])

	return new ImageResponse(
		(
			<div
				style={{
					display: 'flex',
					width: '100%',
					height: '100%',
					alignItems: 'center',
					background: BRAND_PAPER,
					padding: '80px 96px',
					gap: 56,
				}}>
				<div style={{ display: 'flex', width: 280, height: 280 }}>
					<img src={src} width={280} height={280} alt="" />
				</div>
				<div style={{ display: 'flex', flexDirection: 'column', maxWidth: 680 }}>
					<div
						style={{
							display: 'flex',
							fontFamily: 'Geist Mono',
							fontSize: 64,
							fontWeight: 700,
							letterSpacing: '0.22em',
							textTransform: 'uppercase',
							color: BRAND_INK,
							lineHeight: 1,
						}}>
						Map Studio
					</div>
					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							marginTop: 24,
							fontFamily: 'Geist Sans',
							fontSize: 30,
							lineHeight: 1.35,
							fontWeight: 400,
							color: BRAND_INK,
						}}>
						<div style={{ display: 'flex' }}>Create data-rich maps</div>
						<div style={{ display: 'flex' }}>without leaving your browser.</div>
					</div>
					<div
						style={{
							display: 'flex',
							marginTop: 28,
							fontFamily: 'Geist Sans',
							fontSize: 22,
							fontWeight: 500,
							color: BRAND_MUTED,
						}}>
						By DFLabs.
					</div>
				</div>
			</div>
		),
		{
			...size,
			fonts: [
				{ name: 'Geist Mono', data: geistMonoBold, weight: 700, style: 'normal' },
				{ name: 'Geist Sans', data: geistSansRegular, weight: 400, style: 'normal' },
				{ name: 'Geist Sans', data: geistSansMedium, weight: 500, style: 'normal' },
			],
		}
	)
}
