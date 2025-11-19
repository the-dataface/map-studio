import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'

import type { GeographyKey } from '@/app/(studio)/types'

import type { TopoJSONData } from './types'

interface UseGeoAtlasOptions {
  selectedGeography: GeographyKey
  notify: (options: { title?: string; description?: string; variant?: string; duration?: number; icon?: unknown }) => void
}

const CANADA_OBJECT_NORMALISERS = [/prov/i, /adm1/i, /can_adm1/i, /canada_provinces/i, /admin1/i]

const CANADA_NATION_NORMALISERS = [/nation/i, /country/i, /canada/i, /can/i]

function normaliseCanadaObjects(data: TopoJSONData): TopoJSONData {
  // Mutate the objects directly like the main branch does
  const objects = data.objects ?? {}
  
  // Detect a candidate for provinces (adm1)
  const provincesKey = Object.keys(objects).find((k) => 
    CANADA_OBJECT_NORMALISERS.some((regex) => regex.test(k))
  ) ?? null

  // Detect a candidate for the national outline
  const nationKey = Object.keys(objects).find((k) => 
    CANADA_NATION_NORMALISERS.some((regex) => regex.test(k))
  ) ?? null

  // Only alias when we actually find something (matching main branch behavior)
  if (provincesKey && !objects.provinces) {
    objects.provinces = objects[provincesKey]
  }
  if (nationKey && !objects.nation) {
    objects.nation = objects[nationKey]
  }

  data.objects = objects
  return data
}

async function fetchTopoJSONFromAPI(geography: GeographyKey): Promise<TopoJSONData> {
  const response = await fetch(`/api/topojson?geography=${encodeURIComponent(geography)}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch TopoJSON: ${response.statusText}`)
  }

  const result = await response.json()
  let data = result.data as TopoJSONData

  // Normalize Canada objects if needed (matching main branch behavior)
  if (geography === 'canada-provinces' || geography === 'canada-nation') {
    data = normaliseCanadaObjects(data)
  }

  return data
}

// Cache version to invalidate old cached data when data sources change
// Increment this when data sources change to force React Query to fetch fresh data
const TOPOJSON_CACHE_VERSION = 'v3'

export function useGeoAtlasData({ selectedGeography, notify }: UseGeoAtlasOptions) {
  const {
    data: geoAtlasData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['topojson', TOPOJSON_CACHE_VERSION, selectedGeography],
    queryFn: () => fetchTopoJSONFromAPI(selectedGeography),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000),
  })

  // Show error notification if query fails (only once per error)
  useEffect(() => {
    if (error) {
      const errorMessage = error instanceof Error ? error.message : "Couldn't load map data. Please retry or check your connection."
      notify({
        title: 'Map data error',
        description: errorMessage,
        variant: 'destructive',
        duration: 4000,
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [error]) // Only depend on error, not notify (notify is stable from useToast)

  return { geoAtlasData: geoAtlasData ?? null, isLoading }
}
