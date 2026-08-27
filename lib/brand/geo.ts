import { US_REGIONS, WORLD_COUNTRIES } from 'df-state-shapes'
import type { IsoCode, StateCode } from 'df-state-shapes'

import { FALLBACK_SHAPE_ID, type ShapeId } from './types'

const STATE_CODES = new Set(Object.keys(US_REGIONS))
const COUNTRY_CODES = new Set(Object.keys(WORLD_COUNTRIES))

export function isStateCode(code: string): code is StateCode {
	return STATE_CODES.has(code)
}

export function isCountryCode(code: string): code is IsoCode {
	return COUNTRY_CODES.has(code)
}

export function resolveRequestGeo(headerList: { get(name: string): string | null }): ShapeId {
	const country = headerList.get('x-vercel-ip-country')?.trim().toUpperCase()
	const region = headerList.get('x-vercel-ip-country-region')?.trim().toUpperCase()

	if (country === 'US' && region && isStateCode(region) && region !== 'US') {
		return { kind: 'state', code: region }
	}

	if (country && isCountryCode(country)) {
		return { kind: 'country', code: country }
	}

	return FALLBACK_SHAPE_ID
}
