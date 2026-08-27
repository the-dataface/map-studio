import { ImageResponse } from 'next/og'
import { headers } from 'next/headers'

import { resolveRequestGeo } from '@/lib/brand/geo'
import { logoDataUri } from '@/lib/brand/logo-markup'
import { loadShape } from '@/lib/brand/shape-svg'
import { BRAND_INK, BRAND_PAPER } from '@/lib/brand/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
	const geo = resolveRequestGeo(headers())
	const shape = loadShape(geo.kind, geo.code)
	const src = logoDataUri(shape, BRAND_INK)

	return new ImageResponse(
		(
			<div
				style={{
					display: 'flex',
					width: '100%',
					height: '100%',
					alignItems: 'center',
					justifyContent: 'center',
					background: BRAND_PAPER,
				}}>
				<img src={src} width={148} height={148} alt="" />
			</div>
		),
		{
			...size,
			headers: {
				'Cache-Control': 'private, max-age=3600',
			},
		}
	)
}
