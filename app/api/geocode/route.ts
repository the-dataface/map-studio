import { NextRequest, NextResponse } from 'next/server'

import { getCached, setCached, incrementCounter, getCounter } from '@/lib/cache/kv'
import { dedupeRequest } from '@/lib/cache/dedupe'
import { recordAPIMetric, recordRateLimit } from '@/lib/monitoring/metrics'

interface GeocodeRequest {
  address: string
  city?: string
  state?: string
}

interface GeocodeResponse {
  lat: number
  lng: number
  source: 'cache' | 'api'
  cached?: boolean
}

interface NominatimResult {
  lat: string
  lon: string
  display_name: string
}

const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 10 // Max 10 requests per minute per IP
const CACHE_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days

function getRateLimitKey(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  return `rate_limit:${ip}`
}

async function checkRateLimit(key: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now()
  const count = await getCounter(key)

  if (count === 0) {
    // First request in window
    await incrementCounter(key, RATE_LIMIT_WINDOW)
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1, resetAt: now + RATE_LIMIT_WINDOW }
  }

  if (count >= RATE_LIMIT_MAX_REQUESTS) {
    // Rate limit exceeded - calculate reset time
    const resetAt = now + RATE_LIMIT_WINDOW
    return { allowed: false, remaining: 0, resetAt }
  }

  // Increment counter
  await incrementCounter(key, RATE_LIMIT_WINDOW)
  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - count - 1, resetAt: now + RATE_LIMIT_WINDOW }
}

function getCacheKey(address: string, city?: string, state?: string): string {
  const parts = [address.toLowerCase().trim()]
  if (city) parts.push(city.toLowerCase().trim())
  if (state) parts.push(state.toLowerCase().trim())
  return `geocode:${parts.join(',')}`
}

async function geocodeWithNominatim(address: string): Promise<{ lat: number; lng: number }> {
  const encodedAddress = encodeURIComponent(address)
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&addressdetails=1`

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'MapStudio/1.0 (https://mapstudio.app)',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    })

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as NominatimResult[]

    if (!data || !Array.isArray(data) || data.length === 0) {
      throw new Error(`No geocoding results found for "${address}"`)
    }

    const result = data[0]
    const lat = Number.parseFloat(result.lat)
    const lng = Number.parseFloat(result.lon)

    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      throw new Error(`Invalid coordinates returned: lat=${result.lat}, lon=${result.lon}`)
    }

    return { lat, lng }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Geocoding request timed out for "${address}"`)
    }
    throw error
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request)
    const rateLimit = await checkRateLimit(rateLimitKey)

    if (!rateLimit.allowed) {
      recordRateLimit('/api/geocode')
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Please try again after ${new Date(rateLimit.resetAt).toISOString()}`,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': new Date(rateLimit.resetAt).toISOString(),
            'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
            'X-Response-Time': String(Date.now() - startTime),
          },
        }
      )
    }

    // Parse request body
    const body = (await request.json()) as GeocodeRequest
    const { address, city, state } = body

    if (!address || typeof address !== 'string' || address.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid request: address is required' }, { status: 400 })
    }

    // Check cache first
    const cacheKey = getCacheKey(address, city, state)
    const cached = await getCached<{ lat: number; lng: number }>(cacheKey, CACHE_TTL)

    if (cached) {
      const duration = Date.now() - startTime
      recordAPIMetric('/api/geocode', duration, true)
      return NextResponse.json(
        {
          lat: cached.lat,
          lng: cached.lng,
          source: 'cache',
          cached: true,
        } as GeocodeResponse,
        {
          headers: {
            'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-Cache': 'HIT',
            'X-Response-Time': String(duration),
          },
        }
      )
    }

    // Build full address string
    const fullAddress = [address, city, state].filter(Boolean).join(', ')

    // Use request deduplication to prevent duplicate concurrent requests
    const coordinates = await dedupeRequest(cacheKey, () => geocodeWithNominatim(fullAddress))

    // Cache the result
    await setCached(cacheKey, coordinates, CACHE_TTL)

    const duration = Date.now() - startTime
    recordAPIMetric('/api/geocode', duration, false)

    return NextResponse.json(
      {
        lat: coordinates.lat,
        lng: coordinates.lng,
        source: 'api',
        cached: false,
      } as GeocodeResponse,
      {
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMIT_MAX_REQUESTS),
          'X-RateLimit-Remaining': String(rateLimit.remaining),
          'X-Cache': 'MISS',
          'X-Response-Time': String(duration),
        },
      }
    )
  } catch (error) {
    console.error('Geocoding error:', error)
    const duration = Date.now() - startTime
    recordAPIMetric('/api/geocode', duration, false, error as Error)
    return NextResponse.json(
      {
        error: 'Geocoding failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      {
        status: 500,
        headers: {
          'X-Response-Time': String(duration),
        },
      }
    )
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'geocode-proxy',
    cacheBackend: process.env.KV_REST_API_URL ? 'vercel-kv' : 'in-memory',
    rateLimitWindow: RATE_LIMIT_WINDOW,
    rateLimitMaxRequests: RATE_LIMIT_MAX_REQUESTS,
  })
}
