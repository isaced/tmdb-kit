import { describe, expect, it } from 'vitest'
import {
  TMDBError,
  TMDBRateLimitError,
  TMDBRequestError,
  TMDBResponseError,
} from '../../src'
import { createResponseError, parseRetryAfter, type TMDBResponseErrorOptions } from '../../src/errors'

function makeError(overrides: Partial<TMDBResponseErrorOptions>): TMDBResponseError {
  return createResponseError({
    body: undefined,
    headers: new Headers(),
    status: 500,
    statusText: 'Internal Server Error',
    url: 'https://api.themoviedb.org/3/movie/550',
    ...overrides,
  })
}

describe('TMDBError hierarchy', () => {
  it('exposes the three top-level error classes with stable names', () => {
    expect(new TMDBError('x').name).toBe('TMDBError')
    expect(new TMDBRequestError('x').name).toBe('TMDBRequestError')
    expect(makeError({ status: 404, statusText: 'Not Found' })).toBeInstanceOf(TMDBError)
  })
})

describe('TMDBResponseError convenience getters', () => {
  it('flags the canonical status codes correctly', () => {
    const cases: Array<[number, keyof TMDBResponseError, boolean]> = [
      [401, 'isUnauthorized', true],
      [403, 'isForbidden', true],
      [404, 'isNotFound', true],
      [429, 'isRateLimit', true],
      [500, 'isServerError', true],
      [502, 'isServerError', true],
      [599, 'isServerError', true],
      [200, 'isServerError', false],
      [400, 'isNotFound', false],
      [429, 'isNotFound', false],
      [401, 'isRateLimit', false],
      [600, 'isServerError', false],
    ]

    for (const [status, getter, expected] of cases) {
      const error = makeError({ status, statusText: 'x' })
      expect(error[getter], `${getter} for status ${status}`).toBe(expected)
    }
  })

  it('preserves TMDB error payload fields on the response error', () => {
    const error = makeError({
      body: {
        status_code: 7,
        status_message: 'Invalid API key',
        success: false,
      },
      headers: new Headers({ 'x-request-id': 'req-1' }),
      status: 401,
      statusText: 'Unauthorized',
    })

    expect(error).toBeInstanceOf(TMDBResponseError)
    expect(error.message).toBe('Invalid API key')
    expect(error.requestId).toBe('req-1')
    expect(error.status).toBe(401)
    expect(error.statusCode).toBe(7)
    expect(error.statusMessage).toBe('Invalid API key')
    expect(error.statusText).toBe('Unauthorized')
  })

  it('falls back to HTTP status text when the body is not a TMDB error payload', () => {
    const error = makeError({
      body: 'upstream failed',
      status: 502,
      statusText: 'Bad Gateway',
    })

    expect(error.message).toBe('502 Bad Gateway')
    expect(error.statusCode).toBeUndefined()
    expect(error.statusMessage).toBeUndefined()
  })
})

describe('TMDBRateLimitError', () => {
  it('is thrown for HTTP 429 with a numeric Retry-After header', () => {
    const error = createResponseError({
      body: { status_message: 'Too many requests' },
      headers: new Headers({ 'retry-after': '12' }),
      status: 429,
      statusText: 'Too Many Requests',
      url: 'https://api.themoviedb.org/3/movie/popular',
    })

    expect(error).toBeInstanceOf(TMDBRateLimitError)
    expect(error).toBeInstanceOf(TMDBResponseError)
    expect(error).toBeInstanceOf(TMDBError)
    expect(error.isRateLimit).toBe(true)
    if (error instanceof TMDBRateLimitError) {
      expect(error.retryAfter).toBe(12)
    }
    expect(error.message).toBe('Too many requests')
  })

  it('falls back to 1 second when Retry-After is missing', () => {
    const error = createResponseError({
      body: undefined,
      headers: new Headers(),
      status: 429,
      statusText: 'Too Many Requests',
      url: 'https://api.themoviedb.org/3/movie/popular',
    })

    expect(error).toBeInstanceOf(TMDBRateLimitError)
    if (error instanceof TMDBRateLimitError) {
      expect(error.retryAfter).toBe(1)
    }
  })

  it('parses HTTP-date Retry-After values into a positive number of seconds', () => {
    // Pick a date 30 seconds in the future. Allow +/- 2s slack to absorb
    // sub-second clock drift during the test run.
    const future = new Date(Date.now() + 30_000)
    const error = createResponseError({
      body: undefined,
      headers: new Headers({ 'retry-after': future.toUTCString() }),
      status: 429,
      statusText: 'Too Many Requests',
      url: 'https://api.themoviedb.org/3/movie/popular',
    })

    expect(error).toBeInstanceOf(TMDBRateLimitError)
    if (error instanceof TMDBRateLimitError) {
      expect(error.retryAfter).toBeGreaterThanOrEqual(28)
      expect(error.retryAfter).toBeLessThanOrEqual(32)
    }
  })

  it('does NOT auto-retry — the SDK leaves retry policy to the caller', async () => {
    let calls = 0
    const fetch = async () => {
      calls += 1
      return new Response('rate limited', {
        headers: { 'retry-after': '5' },
        status: 429,
        statusText: 'Too Many Requests',
      })
    }

    const { TMDBHttpClient } = await import('../../src/http')
    const http = new TMDBHttpClient({ accessToken: 'x', fetch })

    await expect(http.get('/movie/popular')).rejects.toBeInstanceOf(TMDBRateLimitError)
    expect(calls).toBe(1)
  })
})

describe('parseRetryAfter', () => {
  it('parses delta-seconds, HTTP-date, and falls back gracefully', () => {
    expect(parseRetryAfter('0')).toBe(0)
    expect(parseRetryAfter('42')).toBe(42)
    expect(parseRetryAfter(null)).toBe(1)
    expect(parseRetryAfter(undefined)).toBe(1)
    expect(parseRetryAfter('')).toBe(1)
    expect(parseRetryAfter('not a date')).toBe(1)
  })

  it('clamps a past HTTP-date to at least 1 second', () => {
    const past = new Date(Date.now() - 60_000)
    expect(parseRetryAfter(past.toUTCString())).toBe(1)
  })
})
