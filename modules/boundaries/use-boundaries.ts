import { useQuery } from '@tanstack/react-query'

import type { GeographyKey } from '@/app/(studio)/types'

import type { BoundariesResponse } from './types'

interface UseBoundariesOptions {
  geographyKey: GeographyKey | null
  region?: string
  enabled?: boolean
}

async function fetchBoundaries(geographyKey: GeographyKey, region?: string) {
  const params = new URLSearchParams({ geography: geographyKey })
  if (region) {
    params.set('region', region)
  }

  const response = await fetch(`/api/boundaries?${params.toString()}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch boundaries: ${response.statusText}`)
  }

  return (await response.json()) as BoundariesResponse
}

export function useBoundaries({ geographyKey, region, enabled = true }: UseBoundariesOptions) {
  return useQuery({
    queryKey: ['boundaries', geographyKey, region ?? 'all'],
    queryFn: () => fetchBoundaries(geographyKey!, region),
    enabled: enabled && Boolean(geographyKey),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 7 * 24 * 60 * 60 * 1000,
    retry: 2,
  })
}
