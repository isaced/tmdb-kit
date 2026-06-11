import { describe, expect, it } from 'vitest'
import { createTMDB, TMDBRequestError, TMDBResponseError, type FetchLike } from '../src'
import { createMockFetch, paged } from './helpers'

describe('TMDBClient', () => {
  it('sends bearer auth and default locale options through resource calls', async () => {
    const mock = createMockFetch({ body: paged([]) })
    const tmdb = createTMDB({
      accessToken: 'read-token',
      defaultLanguage: 'zh-CN',
      defaultRegion: 'CN',
      fetch: mock.fetch,
    })

    const response = await tmdb.movies.popular({ page: 2 })

    expect(response.total_results).toBe(0)
    expect(mock.calls).toHaveLength(1)
    expect(mock.calls[0]?.url.pathname).toBe('/3/movie/popular')
    expect(mock.calls[0]?.url.searchParams.get('language')).toBe('zh-CN')
    expect(mock.calls[0]?.url.searchParams.get('page')).toBe('2')
    expect(mock.calls[0]?.url.searchParams.get('region')).toBe('CN')
    expect((mock.calls[0]?.init.headers as Headers).get('Authorization')).toBe('Bearer read-token')
    expect((mock.calls[0]?.init.headers as Headers).get('Accept')).toBe('application/json')
  })

  it('supports legacy api_key auth without adding an authorization header', async () => {
    const mock = createMockFetch({ body: paged([]) })
    const tmdb = createTMDB({
      apiKey: 'v3-key',
      fetch: mock.fetch,
    })

    await tmdb.search.movies('  Dune  ', {
      includeAdult: false,
      page: 3,
      primaryReleaseYear: 2021,
      region: 'US',
      year: 2021,
    })

    const call = mock.calls[0]

    expect(call?.url.pathname).toBe('/3/search/movie')
    expect(call?.url.searchParams.get('api_key')).toBe('v3-key')
    expect(call?.url.searchParams.get('query')).toBe('Dune')
    expect(call?.url.searchParams.get('include_adult')).toBe('false')
    expect(call?.url.searchParams.get('primary_release_year')).toBe('2021')
    expect(call?.url.searchParams.get('region')).toBe('US')
    expect((call?.init.headers as Headers).has('Authorization')).toBe(false)
  })

  it('keeps a typed request escape hatch for endpoints that are not wrapped yet', async () => {
    const mock = createMockFetch({ body: { ok: true } }, { status: 204 })
    const tmdb = createTMDB({
      accessToken: 'read-token',
      baseUrl: 'https://proxy.example/tmdb/3/',
      fetch: mock.fetch,
      headers: {
        'x-app': 'demo',
      },
    })

    const response = await tmdb.request<{ ok: true }>('/discover/movie', {
      headers: {
        'x-request': 'manual',
      },
      query: {
        sort_by: 'popularity.desc',
        with_genres: [28, 12],
      },
    })
    const emptyResponse = await tmdb.request<undefined>('/noop')

    expect(response.ok).toBe(true)
    expect(mock.calls[0]?.url.toString()).toBe(
      'https://proxy.example/tmdb/3/discover/movie?sort_by=popularity.desc&with_genres=28%2C12',
    )
    expect((mock.calls[0]?.init.headers as Headers).get('x-app')).toBe('demo')
    expect((mock.calls[0]?.init.headers as Headers).get('x-request')).toBe('manual')
    expect(emptyResponse).toBeUndefined()
  })

  it('rejects missing or ambiguous auth configuration', () => {
    expect(() =>
      createTMDB({
        accessToken: '',
        fetch: createMockFetch().fetch,
      }),
    ).toThrow(TMDBRequestError)

    expect(() =>
      createTMDB({
        accessToken: 'token',
        apiKey: 'key',
        fetch: createMockFetch().fetch,
      } as never),
    ).toThrow('Provide exactly one of accessToken or apiKey')
  })

  it('reports a clear error when no fetch implementation exists', () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch')

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: undefined,
    })

    try {
      expect(() => createTMDB({ accessToken: 'token' })).toThrow(
        'No fetch implementation found. Pass options.fetch in this runtime.',
      )
    } finally {
      if (descriptor !== undefined) {
        Object.defineProperty(globalThis, 'fetch', descriptor)
      }
    }
  })

  it('wraps fetch failures in TMDBRequestError', async () => {
    const fetch: FetchLike = async () => {
      throw new Error('offline')
    }
    const tmdb = createTMDB({ accessToken: 'read-token', fetch })

    await expect(tmdb.movies.popular()).rejects.toBeInstanceOf(TMDBRequestError)
    await expect(tmdb.movies.popular()).rejects.toThrow('offline')
  })

  it('exposes TMDB error payloads for non-2xx responses', async () => {
    const mock = createMockFetch({
      body: {
        status_code: 7,
        status_message: 'Invalid API key',
        success: false,
      },
      headers: {
        'x-request-id': 'req-1',
      },
      status: 401,
      statusText: 'Unauthorized',
    })
    const tmdb = createTMDB({ accessToken: 'bad-token', fetch: mock.fetch })
    const error = await tmdb.movies.popular().catch((value: unknown) => value)

    expect(error).toBeInstanceOf(TMDBResponseError)
    expect(error).toMatchObject({
      message: 'Invalid API key',
      requestId: 'req-1',
      status: 401,
      statusCode: 7,
      statusMessage: 'Invalid API key',
    })
  })

  it('falls back to HTTP status text when an error body is not TMDB JSON', async () => {
    const mock = createMockFetch({
      body: 'upstream failed',
      status: 502,
      statusText: 'Bad Gateway',
    })
    const tmdb = createTMDB({ accessToken: 'token', fetch: mock.fetch })
    const error = await tmdb.movies.popular().catch((value: unknown) => value)

    expect(error).toBeInstanceOf(TMDBResponseError)
    expect(error).toMatchObject({
      body: 'upstream failed',
      message: '502 Bad Gateway',
      status: 502,
      statusCode: undefined,
      statusMessage: undefined,
    })
  })
})
