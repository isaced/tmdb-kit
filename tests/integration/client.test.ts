import { describe, expect, it } from 'bun:test'
import { createTMDB, TMDBResponseError, type TMDBTransport } from '../../src'
import { apiEndpoint, createRealTMDB } from './setup'

describe('Client request() escape hatch (integration)', () => {
  const tmdb = createRealTMDB()

  it('can call arbitrary endpoints', async () => {
    const result = await tmdb.request<{ id: number; title: string }>('movie/550')
    expect(result.id).toBe(550)
    expect(result.title).toBe('Fight Club')
  })

  it('can query collections', async () => {
    const result = await tmdb.request<{ id: number }>('collection/10') // Star Wars Collection
    expect(result).toBeDefined()
    expect(result.id).toBe(10)
  })

  it('forwards request options through the escape hatch', async () => {
    const result = await tmdb.request<{ id: number; credits?: unknown }>('movie/550', {
      query: { append_to_response: 'credits' },
    })

    expect(result.id).toBe(550)
    expect(result.credits).toBeDefined()
  })
})

describe('Client configuration on the live API (integration)', () => {
  it('honors defaultLanguage when the caller does not pass one', async () => {
    const tmdb = createRealTMDB({ defaultLanguage: 'zh-CN' })

    const movie = await tmdb.movies.details(550)
    expect(movie.id).toBe(550)
    // Fight Club's Simplified Chinese title. Without the default language
    // reaching TMDB, this would fall back to the original English title.
    expect(movie.title).toBe('搏击俱乐部')
  })

  it('accepts a custom transport and routes every resource through it on the live API', async () => {
    // The custom transport is the only way to make every resource call
    // observable from a single place. On the live API this also proves
    // the transport abstraction does not leak to the wire format.
    const seen: string[] = []

    const transport: TMDBTransport = {
      defaults: { imageBaseUrl: 'https://image.tmdb.org/t/p' },
      get: async <T>(path: string): Promise<T> => {
        seen.push(path)
        // Delegate to the real client to actually hit TMDB.
        const delegate = createRealTMDB()
        return delegate.request<T>(path)
      },
    }

    const tmdb = createRealTMDB({ transport })

    await tmdb.configuration.details()
    await tmdb.movies.popular()
    await tmdb.tv.popular()

    expect(seen).toEqual(['/configuration', '/movie/popular', '/tv/popular'])
  })
})

describe('Error paths on the live API (integration)', () => {
  it('exposes isNotFound for missing movies and includes the original URL', async () => {
    const tmdb = createRealTMDB()
    const error = await tmdb.movies.details(99999999).catch((value: unknown) => value)

    expect(error).toBeInstanceOf(TMDBResponseError)
    if (!(error instanceof TMDBResponseError)) return

    expect(error.isNotFound).toBe(true)
    expect(error.status).toBe(404)
    expect(error.url).toContain('/movie/99999999')
  })

  it('exposes isUnauthorized for an invalid access token (against api.themoviedb.org)', async () => {
    // This test pins the SDK behavior against the canonical TMDB host —
    // it cannot use the optional TMDB_API_ENDPOINT proxy override, since
    // some self-hosted mirrors will silently fall through to cached data
    // for unknown tokens and that would not exercise the 401 path.
    if (apiEndpoint) {
      // eslint-disable-next-line no-console
      console.warn(
        'Skipping: TMDB_API_ENDPOINT is set; the 401 contract test requires the canonical host',
      )
      return
    }

    const tmdb = createTMDB({ accessToken: 'definitely-not-a-real-token' })

    const error = await tmdb.movies.popular().catch((value: unknown) => value)

    expect(error).toBeInstanceOf(TMDBResponseError)
    if (!(error instanceof TMDBResponseError)) return

    expect(error.isUnauthorized).toBe(true)
    expect(error.status).toBe(401)
    // The body should be the TMDB-shaped error object.
    expect(error.body).toBeTypeOf('object')
  })
})
