import { describe, expect, it } from 'bun:test'
import { withMemoryCache, type TMDBTransport } from '../../src'

function createTransport(handler: (path: string) => unknown): {
  calls: string[]
  transport: TMDBTransport
} {
  const calls: string[] = []
  const transport: TMDBTransport = {
    defaults: { imageBaseUrl: 'https://image.tmdb.org/t/p' },
    async get<T>(path: string): Promise<T> {
      calls.push(path)
      return (await handler(path)) as T
    },
  }

  return { calls, transport }
}

describe('withMemoryCache', () => {
  it('caches successful responses', async () => {
    let value = 1
    const { calls, transport } = createTransport(() => value)
    const cached = withMemoryCache(transport, { ttlMs: 60_000 })

    expect(await cached.get('/movie/550')).toBe(1)
    value = 2
    expect(await cached.get('/movie/550')).toBe(1)
    expect(calls).toHaveLength(1)
  })

  it('separates query and header variants', async () => {
    const { calls, transport } = createTransport(() => 'x')
    const cached = withMemoryCache(transport, { ttlMs: 60_000 })

    await cached.get('/movie/popular', { query: { page: 1, language: 'en-US' } })
    // Same parameters in a different insertion order share a key.
    await cached.get('/movie/popular', { query: { language: 'en-US', page: 1 } })
    await cached.get('/movie/popular', { query: { page: 2, language: 'en-US' } })
    await cached.get('/movie/popular', { query: { page: 1, language: 'zh-CN' } })
    await cached.get('/movie/popular', {
      headers: { 'X-Other': '2', 'X-Test': '1' },
      query: { page: 1, language: 'en-US' },
    })

    expect(calls).toHaveLength(4)
  })

  it('normalizes array, null, and undefined query values', async () => {
    const { calls, transport } = createTransport(() => 'x')
    const cached = withMemoryCache(transport, { ttlMs: 60_000 })

    await cached.get('/search/multi', { query: { include: ['movie', 'tv'], page: null } })
    await cached.get('/search/multi', { query: { include: ['movie', 'tv'], page: undefined } })
    await cached.get('/search/multi', { headers: new Headers({ 'X-Test': '1' }) })

    expect(calls).toHaveLength(2)
  })

  it('expires entries after the TTL', async () => {
    const { calls, transport } = createTransport(() => 'x')
    const cached = withMemoryCache(transport, { ttlMs: 1 })

    await cached.get('/configuration')
    await Bun.sleep(5)
    await cached.get('/configuration')

    expect(calls).toHaveLength(2)
  })

  it('does not cache failures', async () => {
    let fail = true
    const { calls, transport } = createTransport(() => {
      if (fail) {
        throw new Error('boom')
      }
      return 'ok'
    })
    const cached = withMemoryCache(transport, { ttlMs: 60_000 })

    await expect(cached.get('/configuration')).rejects.toThrow('boom')
    fail = false
    expect(await cached.get('/configuration')).toBe('ok')
    expect(calls).toHaveLength(2)
  })

  it('evicts the least recently used entry', async () => {
    const { calls, transport } = createTransport(() => 'x')
    const cached = withMemoryCache(transport, { maxEntries: 2, ttlMs: 60_000 })

    await cached.get('/a')
    await cached.get('/b')
    await cached.get('/a') // touch a
    await cached.get('/c') // evicts b
    await cached.get('/a') // hit
    await cached.get('/b') // miss

    expect(calls).toEqual(['/a', '/b', '/c', '/b'])
  })

  it('clears every entry', async () => {
    const { calls, transport } = createTransport(() => 'x')
    const cached = withMemoryCache(transport, { ttlMs: 60_000 })

    await cached.get('/a')
    cached.clear()
    await cached.get('/a')

    expect(calls).toHaveLength(2)
  })

  it('forwards transport defaults', () => {
    const { transport } = createTransport(() => 'x')
    const cached = withMemoryCache(transport)

    expect(cached.defaults).toBe(transport.defaults)
  })

  it('preserves extra transport members', () => {
    const { transport } = createTransport(() => 'x')
    const withStats = Object.assign(transport, { stats: () => 7 })
    const cached = withMemoryCache(withStats)

    expect(cached.stats()).toBe(7)
    expect(cached.defaults).toBe(transport.defaults)
  })

  it('rejects invalid options', () => {
    const { transport } = createTransport(() => 'x')

    expect(() => withMemoryCache(transport, { ttlMs: 0 })).toThrow(RangeError)
    expect(() => withMemoryCache(transport, { ttlMs: Number.NaN })).toThrow(RangeError)
    expect(() => withMemoryCache(transport, { maxEntries: 0 })).toThrow(RangeError)
    expect(() => withMemoryCache(transport, { maxEntries: 1.5 })).toThrow(RangeError)
  })
})
