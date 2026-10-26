import type { TMDBRequestOptions, TMDBTransport } from '../http'
import type { QueryParams } from '../query'

export interface MemoryCacheOptions {
  /** Entry lifetime in milliseconds. Defaults to 300000 (5 minutes). */
  ttlMs?: number
  /** Maximum number of cached responses. Defaults to 100. */
  maxEntries?: number
}

export type MemoryCacheTransport<T extends TMDBTransport = TMDBTransport> = T & {
  /** Remove every cached response. */
  clear(): void
}

interface CacheEntry {
  expiresAt: number
  value: unknown
}

/**
 * Wrap a transport with a small in-memory LRU cache.
 *
 * Only successful responses are cached. The key includes the path, sorted
 * query parameters, and sorted headers, so language, region, and header
 * variants never collide. Signals are intentionally excluded from the key.
 * Use one cache per client or credential: authentication is not part of the
 * key.
 *
 * ```ts
 * const http = new TMDBHttpClient({ accessToken })
 * const tmdb = createTMDB({
 *   transport: withMemoryCache(http, { ttlMs: 60_000, maxEntries: 200 }),
 * })
 * ```
 */
export function withMemoryCache<T extends TMDBTransport>(
  transport: T,
  options: MemoryCacheOptions = {},
): MemoryCacheTransport<T> {
  const ttlMs = options.ttlMs ?? 5 * 60_000
  const maxEntries = options.maxEntries ?? 100

  if (!Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new RangeError('ttlMs must be a positive number')
  }
  if (!Number.isInteger(maxEntries) || maxEntries < 1) {
    throw new RangeError('maxEntries must be a positive integer')
  }

  const entries = new Map<string, CacheEntry>()

  return {
    ...transport,
    async get<U>(path: string, requestOptions: TMDBRequestOptions = {}): Promise<U> {
      const key = cacheKey(path, requestOptions)
      const cached = entries.get(key)

      if (cached !== undefined) {
        if (cached.expiresAt > Date.now()) {
          // Refresh the LRU position.
          entries.delete(key)
          entries.set(key, cached)
          return cached.value as U
        }
        entries.delete(key)
      }

      const value = await transport.get<U>(path, requestOptions)
      entries.set(key, { expiresAt: Date.now() + ttlMs, value })
      evictOverflow(entries, maxEntries)
      return value
    },
    clear() {
      entries.clear()
    },
  }
}

function cacheKey(path: string, options: TMDBRequestOptions): string {
  return `${path}?${serializeQuery(options.query)}|${serializeHeaders(options.headers)}`
}

function serializeQuery(query: QueryParams | undefined): string {
  if (query === undefined) {
    return ''
  }

  return Object.entries(query)
    .filter(([, value]) => value !== undefined && value !== null)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([key, value]) =>
        `${key}=${Array.isArray(value) ? value.map(String).join(',') : String(value)}`,
    )
    .join('&')
}

function serializeHeaders(headers: HeadersInit | undefined): string {
  if (headers === undefined) {
    return ''
  }

  return [...new Headers(headers)]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}:${value}`)
    .join('|')
}

function evictOverflow(entries: Map<string, CacheEntry>, maxEntries: number): void {
  while (entries.size > maxEntries) {
    // The loop condition guarantees at least one key.
    entries.delete(entries.keys().next().value as string)
  }
}
