import { NextRequest, NextResponse } from 'next/server'

import type { GeographyKey } from '@/app/(studio)/types'
import type { TopoJSONData } from '@/modules/map-preview/types'
import { getCached, setCached, deleteCached } from '@/lib/cache/kv'
import { dedupeRequest } from '@/lib/cache/dedupe'
import { recordAPIMetric } from '@/lib/monitoring/metrics'

interface TopoJSONResponse {
  data: TopoJSONData
  source: string
  cached?: boolean
}

// URL mappings for each geography type
const GEOGRAPHY_URLS: Record<GeographyKey, { urls: string[]; expectedObjects: string[] }> = {
  'usa-states': {
    urls: [
      'https://unpkg.com/us-atlas@3/states-10m.json',
      'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json',
      'https://raw.githubusercontent.com/topojson/us-atlas/master/states-10m.json',
    ],
    expectedObjects: ['nation', 'states'],
  },
  'usa-counties': {
    urls: [
      'https://unpkg.com/us-atlas@3/counties-10m.json',
      'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json',
      'https://raw.githubusercontent.com/topojson/us-atlas/master/counties-10m.json',
    ],
    expectedObjects: ['nation', 'counties'],
  },
  'usa-nation': {
    urls: [
      'https://unpkg.com/us-atlas@3/nation-10m.json',
      'https://cdn.jsdelivr.net/npm/us-atlas@3/nation-10m.json',
      'https://raw.githubusercontent.com/topojson/us-atlas/master/nation-10m.json',
    ],
    expectedObjects: ['nation'],
  },
  'canada-provinces': {
    urls: [
      // Original working sources from main branch
      'https://gist.githubusercontent.com/Brideau/2391df60938462571ca9/raw/f5a1f3b47ff671eaf2fb7e7b798bacfc6962606a/canadaprovtopo.json',
      'https://raw.githubusercontent.com/deldersveld/topojson/master/countries/canada/canada-provinces.json',
      'https://cdn.jsdelivr.net/gh/deldersveld/topojson@master/countries/canada/canada-provinces.json',
    ],
    expectedObjects: [], // Accept any objects, normalize after fetching (matching main branch)
  },
  'canada-nation': {
    urls: [
      'https://unpkg.com/world-atlas@2/countries-50m.json',
      'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json',
    ],
    expectedObjects: ['countries'],
  },
  world: {
    urls: [
      'https://unpkg.com/world-atlas@2/countries-50m.json',
      'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-50m.json',
    ],
    expectedObjects: ['countries'],
  },
}

const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

async function fetchTopoJSON(urls: string[], expectedObjects: string[]): Promise<{ data: TopoJSONData; source: string }> {
  const errors: Error[] = []
  
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'MapStudio/1.0 (https://mapstudio.app)',
        },
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(30000), // 30 seconds
      })

      if (!res.ok) {
        errors.push(new Error(`HTTP ${res.status} from ${url}`))
        continue
      }

      const data = (await res.json()) as TopoJSONData
      
      if (!data || typeof data !== 'object') {
        errors.push(new Error(`Invalid JSON response from ${url}`))
        continue
      }
      
      const objects = data.objects as Record<string, unknown> | undefined
      
      // Check if we have any expected objects, or if objects exist at all
      const hasExpectedObjects =
        expectedObjects.length === 0 ||
        expectedObjects.some((key) => {
          const object = objects?.[key]
          return object && typeof object === 'object' && Object.keys(object).length > 0
        }) ||
        (objects && Object.keys(objects).length > 0) // Fallback: accept if any objects exist

      if (hasExpectedObjects) {
        return { data, source: url }
      }
      
      errors.push(new Error(`Missing expected objects: ${expectedObjects.join(', ')}. Found: ${objects ? Object.keys(objects).join(', ') : 'none'}`))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      errors.push(new Error(`Failed to fetch from ${url}: ${errorMessage}`))
    }
  }

  const errorMessages = errors.map((e) => e.message).join('; ')
  throw new Error(`Failed to fetch TopoJSON from all sources. Errors: ${errorMessages}`)
}

// Mark route as dynamic
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const searchParams = request.nextUrl.searchParams
    const geography = searchParams.get('geography') as GeographyKey | null

    if (!geography || !GEOGRAPHY_URLS[geography]) {
      return NextResponse.json({ error: 'Invalid geography parameter' }, { status: 400 })
    }

    const cacheKey = `topojson:${geography}`

    // For Canada provinces, always bypass cache to ensure we get the correct data source
    // TODO: Remove this bypass once all old cached data has been cleared
    if (geography === 'canada-provinces') {
      const cached = await getCached<TopoJSONData>(cacheKey, CACHE_TTL)
      if (cached) {
        const objects = cached.objects as Record<string, unknown> | undefined
        const objectKeys = objects ? Object.keys(objects) : []
        const hasValidData = objectKeys.includes('canadaprov') || objectKeys.includes('provinces')
        
        if (!hasValidData) {
          // Delete stale cache
          await deleteCached(cacheKey)
        } else {
          // Cache is valid, return it
          const duration = Date.now() - startTime
          recordAPIMetric('/api/topojson', duration, true)
          return NextResponse.json(
            {
              data: cached,
              source: 'cache',
              cached: true,
            } as TopoJSONResponse,
            {
              headers: {
                'X-Cache': 'HIT',
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
                'X-Response-Time': String(duration),
              },
            }
          )
        }
      }
    } else {
      // For other geographies, check cache normally
      const cached = await getCached<TopoJSONData>(cacheKey, CACHE_TTL)
      if (cached) {
        const duration = Date.now() - startTime
        recordAPIMetric('/api/topojson', duration, true)
        return NextResponse.json(
          {
            data: cached,
            source: 'cache',
            cached: true,
          } as TopoJSONResponse,
          {
            headers: {
              'X-Cache': 'HIT',
              'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
              'X-Response-Time': String(duration),
            },
          }
        )
      }
    }

    // Fetch from CDN with deduplication
    const config = GEOGRAPHY_URLS[geography]
    const result = await dedupeRequest(cacheKey, () => fetchTopoJSON(config.urls, config.expectedObjects))

    // Cache the result
    await setCached(cacheKey, result.data, CACHE_TTL)

    const duration = Date.now() - startTime
    recordAPIMetric('/api/topojson', duration, false)

    return NextResponse.json(
      {
        data: result.data,
        source: result.source,
        cached: false,
      } as TopoJSONResponse,
      {
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'X-Response-Time': String(duration),
        },
      }
    )
  } catch (error) {
    console.error('TopoJSON API error:', error)
    const duration = Date.now() - startTime
    recordAPIMetric('/api/topojson', duration, false, error as Error)
    return NextResponse.json(
      {
        error: 'Failed to fetch TopoJSON data',
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
