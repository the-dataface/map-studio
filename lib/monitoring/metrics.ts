/**
 * Simple metrics collection utility
 * Tracks API usage, cache performance, and errors
 */

interface MetricEvent {
  type: 'api_request' | 'cache_hit' | 'cache_miss' | 'error' | 'rate_limit'
  endpoint: string
  timestamp: number
  duration?: number
  metadata?: Record<string, unknown>
}

class MetricsCollector {
  private events: MetricEvent[] = []
  private readonly maxEvents = 1000 // Keep last 1000 events

  record(event: Omit<MetricEvent, 'timestamp'>): void {
    this.events.push({
      ...event,
      timestamp: Date.now(),
    })

    // Trim if we exceed max events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }
  }

  getStats(endpoint?: string): {
    totalRequests: number
    cacheHitRate: number
    averageResponseTime: number
    errorRate: number
    rateLimitHits: number
  } {
    const filtered = endpoint
      ? this.events.filter((e) => e.endpoint === endpoint)
      : this.events

    const requests = filtered.filter((e) => e.type === 'api_request')
    const hits = filtered.filter((e) => e.type === 'cache_hit')
    const misses = filtered.filter((e) => e.type === 'cache_miss')
    const errors = filtered.filter((e) => e.type === 'error')
    const rateLimits = filtered.filter((e) => e.type === 'rate_limit')

    const totalCacheOps = hits.length + misses.length
    const cacheHitRate = totalCacheOps > 0 ? hits.length / totalCacheOps : 0

    const requestsWithDuration = requests.filter((r) => r.duration !== undefined)
    const averageResponseTime =
      requestsWithDuration.length > 0
        ? requestsWithDuration.reduce((sum, r) => sum + (r.duration ?? 0), 0) / requestsWithDuration.length
        : 0

    const errorRate = requests.length > 0 ? errors.length / requests.length : 0

    return {
      totalRequests: requests.length,
      cacheHitRate,
      averageResponseTime,
      errorRate,
      rateLimitHits: rateLimits.length,
    }
  }

  getRecentEvents(limit = 50): MetricEvent[] {
    return this.events.slice(-limit)
  }

  clear(): void {
    this.events = []
  }
}

// Singleton instance
export const metrics = new MetricsCollector()

/**
 * Helper to record API request metrics
 */
export function recordAPIMetric(
  endpoint: string,
  duration: number,
  cacheHit: boolean,
  error?: Error
): void {
  if (error) {
    metrics.record({
      type: 'error',
      endpoint,
      duration,
      metadata: { message: error.message },
    })
  } else {
    metrics.record({
      type: 'api_request',
      endpoint,
      duration,
    })

    metrics.record({
      type: cacheHit ? 'cache_hit' : 'cache_miss',
      endpoint,
      duration,
    })
  }
}

/**
 * Helper to record rate limit hits
 */
export function recordRateLimit(endpoint: string): void {
  metrics.record({
    type: 'rate_limit',
    endpoint,
  })
}

