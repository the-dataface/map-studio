/**
 * Cache utility with Vercel KV support and fallback to in-memory cache
 * Gracefully degrades when KV is not configured
 */

interface CacheEntry<T> {
  data: T
  cachedAt: number
}

const inMemoryCache = new Map<string, CacheEntry<unknown>>()

let kvClient: typeof import('@vercel/kv').kv | null = null

/**
 * Lazy load KV client to avoid errors when not configured
 */
async function getKVClient() {
  if (kvClient !== null) {
    return kvClient
  }

  if (isKVConfigured()) {
    try {
      const kvModule = await import('@vercel/kv')
      kvClient = kvModule.kv
      return kvClient
    } catch {
      // Silently fall back to in-memory cache if KV is not available
      // This is expected in development when KV is not configured
      return null
    }
  }

  return null
}

/**
 * Check if Vercel KV is configured
 */
function isKVConfigured(): boolean {
  return !!(
    process.env.KV_REST_API_URL &&
    process.env.KV_REST_API_TOKEN &&
    process.env.KV_REST_API_READ_ONLY_TOKEN
  )
}

/**
 * Get cached value from KV or in-memory fallback
 */
export async function getCached<T>(key: string, ttl: number): Promise<T | null> {
  const kv = await getKVClient()
  if (kv) {
    try {
      const cached = await kv.get<CacheEntry<T>>(key)
      if (!cached) return null

      const age = Date.now() - cached.cachedAt
      if (age > ttl) {
        await kv.del(key)
        return null
      }

      return cached.data
    } catch (error) {
      console.warn('[Cache] KV error, falling back to in-memory:', error)
      // Fall through to in-memory cache
    }
  }

  // In-memory fallback
  const cached = inMemoryCache.get(key) as CacheEntry<T> | undefined
  if (!cached) return null

  const age = Date.now() - cached.cachedAt
  if (age > ttl) {
    inMemoryCache.delete(key)
    return null
  }

  return cached.data
}

/**
 * Set cached value in KV or in-memory fallback
 */
export async function setCached<T>(key: string, data: T, ttl: number): Promise<void> {
  const entry: CacheEntry<T> = {
    data,
    cachedAt: Date.now(),
  }

  const kv = await getKVClient()
  if (kv) {
    try {
      // Convert TTL from milliseconds to seconds for KV
      const ttlSeconds = Math.ceil(ttl / 1000)
      await kv.setex(key, ttlSeconds, entry)
      return
    } catch (error) {
      console.warn('[Cache] KV error, falling back to in-memory:', error)
      // Fall through to in-memory cache
    }
  }

  // In-memory fallback
  inMemoryCache.set(key, entry as CacheEntry<unknown>)
}

/**
 * Delete cached value from KV or in-memory fallback
 */
export async function deleteCached(key: string): Promise<void> {
  const kv = await getKVClient()
  if (kv) {
    try {
      await kv.del(key)
      return
    } catch (error) {
      console.warn('[Cache] KV error, falling back to in-memory:', error)
    }
  }

  inMemoryCache.delete(key)
}

/**
 * Increment a counter in KV or in-memory fallback (for rate limiting)
 */
export async function incrementCounter(key: string, ttl: number): Promise<number> {
  const kv = await getKVClient()
  if (kv) {
    try {
      const count = await kv.incr(key)
      if (count === 1) {
        // Set expiration on first increment
        const ttlSeconds = Math.ceil(ttl / 1000)
        await kv.expire(key, ttlSeconds)
      }
      return count
    } catch (error) {
      console.warn('[Cache] KV error, falling back to in-memory:', error)
      // Fall through to in-memory counter
    }
  }

  // In-memory fallback
  const current = (inMemoryCache.get(key) as CacheEntry<number> | undefined)?.data ?? 0
  const newValue = current + 1
  await setCached(key, newValue, ttl)
  return newValue
}

/**
 * Get counter value
 */
export async function getCounter(key: string): Promise<number> {
  const kv = await getKVClient()
  if (kv) {
    try {
      const value = await kv.get<number>(key)
      return value ?? 0
    } catch (error) {
      console.warn('[Cache] KV error, falling back to in-memory:', error)
    }
  }

  const cached = inMemoryCache.get(key) as CacheEntry<number> | undefined
  return cached?.data ?? 0
}

/**
 * Reset counter
 */
export async function resetCounter(key: string): Promise<void> {
  await deleteCached(key)
}

