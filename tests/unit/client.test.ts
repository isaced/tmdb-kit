import { describe, expect, it, vi } from 'bun:test'
import { createTMDB, TMDBClient, type TMDBRequestOptions, type TMDBTransport } from '../../src'
import { expectRequest } from '../_support/assertions'
import { createFetchMock } from '../_support/fetch'

interface TransportCall {
  path: string
  query?: Record<string, string | undefined>
}

function createTransportMock<T>(responses: Array<T | { body: T } | undefined> = []): {
  calls: TransportCall[]
  transport: TMDBTransport
} {
  const calls: TransportCall[] = []
  const queue = [...responses]

  const get = vi.fn(async (path: string, options?: TMDBRequestOptions) => {
    const queryEntries = options?.query as Record<string, unknown> | undefined
    const query = queryEntries
      ? Object.fromEntries(
          Object.entries(queryEntries).map(([key, value]) => [
            key,
            value === undefined || value === null ? undefined : String(value),
          ]),
        )
      : undefined
    calls.push({ path, query })
    const next = queue.shift() ?? {}
    const body = next && typeof next === 'object' && 'body' in next ? next.body : next
    return body as T
  })

  const transport = {
    defaults: { imageBaseUrl: 'https://image.tmdb.org/t/p' },
    get,
  } as unknown as TMDBTransport

  return { calls, transport }
}

describe('TMDBClient facade', () => {
  it('creates the full resource surface from the factory', () => {
    const tmdb = createTMDB({
      accessToken: 'read-token',
      fetch: createFetchMock().fetch,
    })

    expect(tmdb).toBeInstanceOf(TMDBClient)
    expect(tmdb.configuration).toBeDefined()
    expect(tmdb.genres).toBeDefined()
    expect(tmdb.images).toBeDefined()
    expect(tmdb.movies).toBeDefined()
    expect(tmdb.people).toBeDefined()
    expect(tmdb.search).toBeDefined()
    expect(tmdb.trending).toBeDefined()
    expect(tmdb.tv).toBeDefined()
  })

  it('keeps a typed request escape hatch for endpoints that are not wrapped yet', async () => {
    const mock = createFetchMock({ body: { results: [] } })
    const tmdb = createTMDB({
      accessToken: 'read-token',
      baseUrl: 'https://proxy.example/tmdb/3',
      defaultLanguage: 'en-US',
      fetch: mock.fetch,
    })

    const response = await tmdb.request<{ results: unknown[] }>('/discover/movie', {
      query: {
        language: 'fr-FR',
        sort_by: 'popularity.desc',
      },
    })

    expect(response.results).toEqual([])
    expectRequest(mock.lastCall(), {
      path: '/tmdb/3/discover/movie',
      query: {
        language: 'fr-FR',
        sort_by: 'popularity.desc',
      },
    })
  })

  it('uses the configured image base URL through the images helper', () => {
    const tmdb = createTMDB({
      accessToken: 'read-token',
      fetch: createFetchMock().fetch,
      imageBaseUrl: 'https://images.example/t/p/',
    })

    expect(tmdb.images.url('/profile.png', 'h632')).toBe('https://images.example/t/p/h632/profile.png')
  })

  it('accepts a custom transport and routes every resource through it (no fetch involved)', async () => {
    const { calls, transport } = createTransportMock<unknown>([
      // configuration.details()
      { images: { secure_base_url: 'https://images.example/t/p' } },
      // genres.movies()
      { genres: [{ id: 28, name: 'Action' }] },
      // movies.popular()
      { page: 1, results: [{ id: 550, title: 'Fight Club' }], total_pages: 1, total_results: 1 },
      // request() escape hatch
      { results: [{ id: 27205, name: 'Inception' }] },
    ])

    const tmdb = createTMDB({ accessToken: 'read-token', transport })

    const config = await tmdb.configuration.details()
    const genres = await tmdb.genres.movies()
    const popular = await tmdb.movies.popular()
    const escape = await tmdb.request<{ results: Array<{ id: number; name: string }> }>(
      '/search/multi',
      { query: { query: 'Inception' } },
    )

    expect(config.images.secure_base_url).toBe('https://images.example/t/p')
    expect(genres.genres[0]?.name).toBe('Action')
    expect(popular.results[0]?.title).toBe('Fight Club')
    expect(escape.results[0]?.name).toBe('Inception')

    expect(calls.map((c) => c.path)).toEqual([
      '/configuration',
      '/genre/movie/list',
      '/movie/popular',
      '/search/multi',
    ])
    expect(calls[3]?.query?.query).toBe('Inception')
  })

  it('uses the injected transport defaults (imageBaseUrl) for ImagesHelper', async () => {
    const { transport } = createTransportMock<unknown>()
    const tmdb = createTMDB({ accessToken: 'read-token', transport })

    expect(tmdb.images.url('/poster.jpg', 'w500')).toBe('https://image.tmdb.org/t/p/w500/poster.jpg')
  })

  it('falls back to the built-in HTTP transport when no custom transport is given', async () => {
    const mock = createFetchMock({ body: { ok: true } })
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    // The built-in HTTP transport must still be wired up correctly when the
    // caller does not opt into a custom transport.
    await expect(tmdb.movies.popular()).resolves.toBeDefined()
    expectRequest(mock.lastCall(), { path: '/3/movie/popular' })
  })
})
