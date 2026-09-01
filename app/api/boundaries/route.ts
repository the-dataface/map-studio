import { NextRequest, NextResponse } from 'next/server'

import type { GeographyKey } from '@/app/(studio)/types'
import { getCached, setCached } from '@/lib/cache/kv'
import { dedupeRequest } from '@/lib/cache/dedupe'
import { recordAPIMetric } from '@/lib/monitoring/metrics'
import { topoJsonToBoundaryGeoJson } from '@/modules/boundaries/topojson-to-geojson'
import type { BoundariesResponse } from '@/modules/boundaries/types'
import type { TopoJSONData } from '@/modules/map-preview/types'

const GEOGRAPHY_URLS: Record<GeographyKey, { urls: string[]; expectedObjects: string[] }> = {
  'usa-states': {
    urls: [
      'https://unpkg.com/us-atlas@3/states-10m.json',
      'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json',
    ],
    expectedObjects: ['nation', 'states'],
  },
  'usa-counties': {
    urls: [
      'https://unpkg.com/us-atlas@3/counties-10m.json',
      'https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json',
    ],
    expectedObjects: ['nation', 'counties'],
  },
  'usa-nation': {
    urls: [
      'https://unpkg.com/us-atlas@3/nation-10m.json',
      'https://cdn.jsdelivr.net/npm/us-atlas@3/nation-10m.json',
    ],
    expectedObjects: ['nation'],
  },
  'canada-provinces': {
    urls: [
      'https://gist.githubusercontent.com/Brideau/2391df60938462571ca9/raw/f5a1f3b47ff671eaf2fb7e7b798bacfc6962606a/canadaprovtopo.json',
      'https://raw.githubusercontent.com/deldersveld/topojson/master/countries/canada/canada-provinces.json',
    ],
    expectedObjects: [],
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

const CACHE_TTL = 24 * 60 * 60 * 1000

async function fetchTopoJSON(urls: string[]): Promise<{ data: TopoJSONData; source: string }> {
  const errors: Error[] = []

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'MapStudio/1.0 (https://mapstudio.app)' },
        signal: AbortSignal.timeout(30000),
      })

      if (!res.ok) {
        errors.push(new Error(`HTTP ${res.status} from ${url}`))
        continue
      }

      const data = (await res.json()) as TopoJSONData
      if (data?.objects) {
        return { data, source: url }
      }
      errors.push(new Error(`Invalid TopoJSON from ${url}`))
    } catch (error) {
      errors.push(error instanceof Error ? error : new Error(String(error)))
    }
  }

  throw new Error(errors.map((error) => error.message).join('; '))
}

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const searchParams = request.nextUrl.searchParams
    const geography = searchParams.get('geography') as GeographyKey | null
    const region = searchParams.get('region') ?? undefined

    if (!geography || !GEOGRAPHY_URLS[geography]) {
      return NextResponse.json({ error: 'Invalid geography parameter' }, { status: 400 })
    }

    const cacheKey = `boundaries:${geography}:${region ?? 'all'}`
    const cached = await getCached<BoundariesResponse['data']>(cacheKey, CACHE_TTL)

    if (cached) {
      const duration = Date.now() - startTime
      recordAPIMetric('/api/boundaries', duration, true)
      return NextResponse.json(
        {
          data: cached,
          geographyKey: geography,
          source: 'cache',
          cached: true,
        } satisfies BoundariesResponse,
        {
          headers: {
            'X-Cache': 'HIT',
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          },
        },
      )
    }

    const config = GEOGRAPHY_URLS[geography]
    const topoCacheKey = `topojson-fetch:${geography}`
    const { data, source } = await dedupeRequest(topoCacheKey, () =>
      fetchTopoJSON(config.urls),
    )

    const geoJson = topoJsonToBoundaryGeoJson(data, geography, region)
    await setCached(cacheKey, geoJson, CACHE_TTL)

    const duration = Date.now() - startTime
    recordAPIMetric('/api/boundaries', duration, false)

    return NextResponse.json(
      {
        data: geoJson,
        geographyKey: geography,
        source,
        cached: false,
      } satisfies BoundariesResponse,
      {
        headers: {
          'X-Cache': 'MISS',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        },
      },
    )
  } catch (error) {
    const duration = Date.now() - startTime
    recordAPIMetric('/api/boundaries', duration, false, error as Error)
    return NextResponse.json(
      {
        error: 'Failed to fetch boundary data',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
