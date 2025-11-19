import { useMutation } from '@tanstack/react-query'

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

interface GeocodeError {
  error: string
  message: string
}

async function geocodeAddress(request: GeocodeRequest): Promise<GeocodeResponse> {
  const response = await fetch('/api/geocode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    if (response.status === 429) {
      const error = (await response.json()) as GeocodeError
      throw new Error(error.message || 'Rate limit exceeded. Please try again later.')
    }
    const error = (await response.json()) as GeocodeError
    throw new Error(error.message || `Geocoding failed: ${response.statusText}`)
  }

  return response.json() as Promise<GeocodeResponse>
}

export function useGeocode() {
  return useMutation({
    mutationFn: geocodeAddress,
    retry: (failureCount, error) => {
      // Don't retry on rate limit errors
      if (error instanceof Error && error.message.includes('Rate limit')) {
        return false
      }
      // Retry up to 2 times for other errors
      return failureCount < 2
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 5000), // Exponential backoff
  })
}

