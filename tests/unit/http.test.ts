import { describe, expect, it } from 'vitest'
import { TMDBRateLimitError, TMDBRequestError, TMDBResponseError, type FetchLike } from '../../src'
import { TMDBHttpClient } from '../../src/http'
import { expectNoQuery, expectRequest } from '../_support/assertions'
import { createFetchMock, emptyResponse, textResponse } from '../_support/fetch'

describe('TMDBHttpClient', () => {
  it('authenticates with an access token and normalizes the default base URL', async () => {
    const mock = createFetchMock({ body: { ok: true } })
    const http = new TMDBHttpClient({
      accessToken: ' read-token ',
      fetch: mock.fetch,
    })

    const response = await http.get<{ ok: boolean }>('/movie/popular')

    expect(response.ok).toBe(true)
    expectRequest(mock.lastCall(), {
      headers: {
        accept: 'application/json',
        authorization: 'Bearer read-token',
      },
      path: '/3/movie/popular',
    })
    expectNoQuery(mock.lastCall(), 'api_key')
  })

  it('authenticates with a v3 api key query parameter', async () => {
    const mock = createFetchMock({ body: { ok: true } })
    const http = new TMDBHttpClient({
      apiKey: ' v3-key ',
      fetch: mock.fetch,
    })

    await http.get('/search/movie', {
      query: {
        query: 'Dune',
      },
    })

    expectRequest(mock.lastCall(), {
      headers: {
        authorization: null,
      },
      path: '/3/search/movie',
      query: {
        api_key: 'v3-key',
        query: 'Dune',
      },
    })
  })

  it('merges request headers after client headers while preserving bearer auth precedence', async () => {
    const mock = createFetchMock({ body: { ok: true } })
    const http = new TMDBHttpClient({
      accessToken: 'read-token',
      baseUrl: 'https://proxy.example/tmdb/3///',
      fetch: mock.fetch,
      headers: {
        accept: 'application/problem+json',
        authorization: 'Bearer stale-token',
        'x-client': 'default',
      },
    })

    await http.get('discover/movie', {
      headers: {
        accept: 'application/vnd.tmdb+json',
        authorization: 'Bearer request-token',
        'x-client': 'request',
      },
      query: {
        with_genres: [28, 12],
      },
    })

    expectRequest(mock.lastCall(), {
      headers: {
        accept: 'application/vnd.tmdb+json',
        authorization: 'Bearer read-token',
        'x-client': 'request',
      },
      path: '/tmdb/3/discover/movie',
      query: {
        with_genres: '28,12',
      },
    })
  })

  it('passes AbortSignal through to fetch', async () => {
    const mock = createFetchMock({ body: { ok: true } })
    const http = new TMDBHttpClient({
      accessToken: 'read-token',
      fetch: mock.fetch,
    })
    const controller = new AbortController()

    await http.get('/movie/popular', {
      signal: controller.signal,
    })

    expect(mock.lastCall().signal).toBe(controller.signal)
  })

  it('parses JSON, empty, and non-JSON successful responses', async () => {
    const mock = createFetchMock({ body: { ok: true } }, emptyResponse(), textResponse('not json'))
    const http = new TMDBHttpClient({
      accessToken: 'read-token',
      fetch: mock.fetch,
    })

    await expect(http.get('/json')).resolves.toEqual({ ok: true })
    await expect(http.get('/empty')).resolves.toBeUndefined()
    await expect(http.get('/text')).resolves.toBe('not json')
  })

  it('validates auth configuration before any request is sent', () => {
    expect(() =>
      new TMDBHttpClient({
        accessToken: '',
        fetch: createFetchMock().fetch,
      }),
    ).toThrow('Provide exactly one of accessToken or apiKey')

    expect(() =>
      new TMDBHttpClient({
        accessToken: 'token',
        apiKey: 'key',
        fetch: createFetchMock().fetch,
      } as never),
    ).toThrow('Provide exactly one of accessToken or apiKey')
  })

  it('resolves global fetch lazily so it picks up runtime replacements (e.g. test mocks, polyfills)', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch')
    const stubFetch: FetchLike = async () =>
      new Response(JSON.stringify({ ok: true }), { status: 200 })

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: stubFetch,
    })

    try {
      // Construct BEFORE the mock is installed. The SDK must defer fetch
      // resolution until a request is actually made.
      const http = new TMDBHttpClient({ accessToken: 'token' })

      const response = await http.get<{ ok: boolean }>('/movie/popular')
      expect(response.ok).toBe(true)
    } finally {
      if (descriptor !== undefined) {
        Object.defineProperty(globalThis, 'fetch', descriptor)
      }
    }
  })

  it('reports a clear error when fetch is unavailable at request time', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'fetch')

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: undefined,
    })

    try {
      // Construction must NOT throw — we no longer validate fetch up front.
      const http = new TMDBHttpClient({ accessToken: 'token' })
      const error = await http.get('/movie/popular').catch((value: unknown) => value)

      expect(error).toBeInstanceOf(TMDBRequestError)
      expect((error as Error).message).toBe(
        'No fetch implementation found. Pass options.fetch in this runtime.',
      )
    } finally {
      if (descriptor !== undefined) {
        Object.defineProperty(globalThis, 'fetch', descriptor)
      }
    }
  })

  it('wraps rejected fetch calls with request context', async () => {
    const fetch: FetchLike = async () => {
      throw new Error('offline')
    }
    const http = new TMDBHttpClient({
      accessToken: 'read-token',
      fetch,
    })
    const error = await http.get('/movie/popular').catch((value: unknown) => value)

    expect(error).toBeInstanceOf(TMDBRequestError)
    expect(error).toMatchObject({
      cause: expect.any(Error),
      message: 'TMDB request failed: Error: offline',
    })
  })

  it('preserves TMDB error payload fields on non-2xx responses', async () => {
    const mock = createFetchMock({
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
    const http = new TMDBHttpClient({
      accessToken: 'bad-token',
      fetch: mock.fetch,
    })
    const error = await http.get('/movie/popular').catch((value: unknown) => value)

    expect(error).toBeInstanceOf(TMDBResponseError)
    expect(error).toMatchObject({
      message: 'Invalid API key',
      requestId: 'req-1',
      status: 401,
      statusCode: 7,
      statusMessage: 'Invalid API key',
      url: 'https://api.themoviedb.org/3/movie/popular',
    })
  })

  it('falls back to HTTP status text for non-TMDB error bodies', async () => {
    const mock = createFetchMock(textResponse('upstream failed', {
      status: 502,
      statusText: 'Bad Gateway',
    }))
    const http = new TMDBHttpClient({
      accessToken: 'read-token',
      fetch: mock.fetch,
    })
    const error = await http.get('/movie/popular').catch((value: unknown) => value)

    expect(error).toBeInstanceOf(TMDBResponseError)
    expect(error).toMatchObject({
      body: 'upstream failed',
      message: '502 Bad Gateway',
      status: 502,
      statusCode: undefined,
      statusMessage: undefined,
    })
  })

  it('surfaces 429 responses as TMDBRateLimitError with the parsed Retry-After value', async () => {
    const mock = createFetchMock({
      body: { status_message: 'Too many requests', status_code: 25 },
      headers: { 'retry-after': '7' },
      status: 429,
      statusText: 'Too Many Requests',
    })
    const http = new TMDBHttpClient({ accessToken: 'read-token', fetch: mock.fetch })

    const error = (await http.get('/movie/popular').catch((value: unknown) => value)) as TMDBResponseError

    expect(error).toBeInstanceOf(TMDBRateLimitError)
    expect(error).toBeInstanceOf(TMDBResponseError)
    expect(error.isRateLimit).toBe(true)
    expect(error.message).toBe('Too many requests')
    expect(error.status).toBe(429)
    expect(error.statusCode).toBe(25)
    if (error instanceof TMDBRateLimitError) {
      expect(error.retryAfter).toBe(7)
    }
  })
})
