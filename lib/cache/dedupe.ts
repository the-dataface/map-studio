/**
 * Request deduplication utility
 * Prevents duplicate concurrent requests for the same resource
 */

interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
}

const pendingRequests = new Map<string, PendingRequest<unknown>>()
const REQUEST_TIMEOUT = 30000 // 30 seconds

/**
 * Deduplicate concurrent requests
 * If a request for the same key is already pending, return the existing promise
 */
export function dedupeRequest<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
  const existing = pendingRequests.get(key)

  if (existing) {
    // Check if request is stale (older than timeout)
    const age = Date.now() - existing.timestamp
    if (age < REQUEST_TIMEOUT) {
      return existing.promise as Promise<T>
    }
    // Remove stale request
    pendingRequests.delete(key)
  }

  // Create new request
  const promise = requestFn().finally(() => {
    // Clean up after request completes
    pendingRequests.delete(key)
  })

  pendingRequests.set(key, {
    promise,
    timestamp: Date.now(),
  })

  return promise
}

/**
 * Clear all pending requests (useful for cleanup)
 */
export function clearPendingRequests(): void {
  pendingRequests.clear()
}

