import { US_REGIONS } from 'df-state-shapes'
import type { StateCode } from 'df-state-shapes'

import type { ShapeId } from './types'

/** Recognizable country silhouettes that still read at 28px. */
const CYCLE_COUNTRIES = [
	'AR',
	'AT',
	'AU',
	'BR',
	'CA',
	'CH',
	'CL',
	'CN',
	'CO',
	'DE',
	'EG',
	'ES',
	'FI',
	'FR',
	'GB',
	'GR',
	'IE',
	'IN',
	'IT',
	'JP',
	'KE',
	'KR',
	'MX',
	'NG',
	'NL',
	'NO',
	'NZ',
	'PE',
	'PH',
	'PL',
	'PT',
	'SE',
	'TH',
	'TR',
	'UA',
	'VN',
	'ZA',
] as const

export const CYCLE_POOL: ShapeId[] = [
	...(Object.keys(US_REGIONS) as StateCode[])
		.filter((code) => code !== 'US')
		.map((code) => ({ kind: 'state' as const, code })),
	...CYCLE_COUNTRIES.map((code) => ({ kind: 'country' as const, code })),
]

export function pickRandomShape(exclude?: ShapeId): ShapeId {
	const pool =
		exclude == null
			? CYCLE_POOL
			: CYCLE_POOL.filter((entry) => !(entry.kind === exclude.kind && entry.code === exclude.code))
	const source = pool.length > 0 ? pool : CYCLE_POOL
	return source[Math.floor(Math.random() * source.length)]
}
