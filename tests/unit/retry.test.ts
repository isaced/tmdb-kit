import { describe, expect, it } from 'bun:test'
import {
  retry,
  TMDBRateLimitError,
  TMDBRequestError,
  TMDBResponseError,
  TMDBTimeoutError,
  withRetry,
  type RetryInfo,
  type TMDBTransport,
} from '../../src'

function rateLimit(retryAfter = 0): TMDBRateLimitError {
  return new TMDBRateLimitError('rate limited', {
    body: { status_message: 'rate limited' },
    headers: new Headers(),
    retryAfter,
    status: 429,
    statusText: 'Too Many Requests',
    url: 'https://api.themoviedb.org/3/movie/550',
  })
}

function serverError(status = 503): TMDBResponseError {
  return new TMDBResponseError('server error', {
    body: {},
    headers: new Headers(),
    status,
    statusText: 'Service Unavailable',
    url: 'https://api.themoviedb.org/3/movie/550',
  })
}

function notFound(): TMDBResponseError {
  return new TMDBResponseError('not found', {
    body: {},
    headers: new Headers(),
    status: 404,
    statusText: 'Not Found',
    url: 'https://api.themoviedb.org/3/movie/99999999',
  })
}

function networkError(): TMDBRequestError {
  return new TMDBRequestError('fetch failed', { cause: new TypeError('fetch failed') })
}

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

describe('retry', () => {
  it('retries rate limits and honors Retry-After', async () => {
    let calls = 0
    const retries: RetryInfo[] = []

    const result = await retry(
      async () => {
        calls += 1
        if (calls === 1) {
          throw rateLimit(0.01)
        }
        return 'ok'
      },
      { retries: 1, onRetry: (info) => retries.push(info) },
    )

    expect(result).toBe('ok')
    expect(calls).toBe(2)
    expect(retries).toHaveLength(1)
    expect(retries[0]!.attempt).toBe(0)
    expect(retries[0]!.delayMs).toBe(10)
    expect(retries[0]!.error).toBeInstanceOf(TMDBRateLimitError)
  })

  it('uses deterministic exponential backoff for 5xx responses', async () => {
    let calls = 0
    const delays: number[] = []

    const result = await retry(
      async () => {
        calls += 1
        if (calls < 3) {
          throw serverError()
        }
        return 'ok'
      },
      {
        baseDelayMs: 10,
        factor: 2,
        jitter: false,
        onRetry: (info) => delays.push(info.delayMs),
        retries: 2,
      },
    )

    expect(result).toBe('ok')
    expect(calls).toBe(3)
    expect(delays).toEqual([10, 20])
  })

  it('retries network failures', async () => {
    let calls = 0

    const result = await retry(
      async () => {
        calls += 1
        if (calls === 1) {
          throw networkError()
        }
        return 'ok'
      },
      { baseDelayMs: 0, retries: 1 },
    )

    expect(result).toBe('ok')
    expect(calls).toBe(2)
  })

  it('does not retry other 4xx responses', async () => {
    let calls = 0
    const error = notFound()

    await expect(
      retry(
        async () => {
          calls += 1
          throw error
        },
        { baseDelayMs: 0, retries: 3 },
      ),
    ).rejects.toBe(error)

    expect(calls).toBe(1)
  })

  it('does not retry validation errors without a cause', async () => {
    let calls = 0
    const error = new TMDBRequestError('movieId must be a positive integer')

    await expect(
      retry(
        async () => {
          calls += 1
          throw error
        },
        { baseDelayMs: 0, retries: 3 },
      ),
    ).rejects.toBe(error)

    expect(calls).toBe(1)
  })

  it('does not retry abort errors', async () => {
    let calls = 0
    const error = new TMDBRequestError('aborted', {
      cause: new DOMException('Aborted', 'AbortError'),
    })

    await expect(
      retry(
        async () => {
          calls += 1
          throw error
        },
        { baseDelayMs: 0, retries: 3 },
      ),
    ).rejects.toBe(error)

    expect(calls).toBe(1)
  })

  it('does not retry timeouts, directly or wrapped by the HTTP client', async () => {
    let calls = 0
    const direct = new TMDBTimeoutError(100)
    const wrapped = new TMDBRequestError('timed out', { cause: new TMDBTimeoutError(100) })

    await expect(
      retry(
        async () => {
          calls += 1
          throw direct
        },
        { baseDelayMs: 0, retries: 3 },
      ),
    ).rejects.toBe(direct)

    await expect(
      retry(
        async () => {
          calls += 1
          throw wrapped
        },
        { baseDelayMs: 0, retries: 3 },
      ),
    ).rejects.toBe(wrapped)

    expect(calls).toBe(2)
  })

  it('stops after the configured number of retries', async () => {
    let calls = 0
    const error = serverError()

    await expect(
      retry(
        async () => {
          calls += 1
          throw error
        },
        { baseDelayMs: 0, jitter: false, retries: 2 },
      ),
    ).rejects.toBe(error)

    expect(calls).toBe(3)
  })

  it('lets retryOn override the default predicate', async () => {
    let calls = 0
    const error = notFound()

    const result = await retry(
      async () => {
        calls += 1
        if (calls === 1) {
          throw error
        }
        return 'ok'
      },
      { baseDelayMs: 0, retries: 1, retryOn: () => true },
    )

    expect(result).toBe('ok')
    expect(calls).toBe(2)
  })

  it('stops immediately when the signal is already aborted', async () => {
    const controller = new AbortController()
    const promise = retry(
      async () => {
        throw serverError()
      },
      { retries: 2, signal: controller.signal },
    )

    controller.abort(new Error('stop'))

    await expect(promise).rejects.toThrow('stop')
  })

  it('aborts while waiting between attempts', async () => {
    const controller = new AbortController()
    let calls = 0
    const promise = retry(
      async () => {
        calls += 1
        throw serverError()
      },
      { baseDelayMs: 1_000, jitter: false, retries: 3, signal: controller.signal },
    )

    await Bun.sleep(5)
    controller.abort(new Error('stop'))

    await expect(promise).rejects.toThrow('stop')
    expect(calls).toBe(1)
  })

  it('does not retry unknown errors', async () => {
    let calls = 0
    const error = new Error('boom')

    await expect(
      retry(
        async () => {
          calls += 1
          throw error
        },
        { baseDelayMs: 0, retries: 3 },
      ),
    ).rejects.toBe(error)

    expect(calls).toBe(1)
  })

  it('stops when the signal is aborted from onRetry', async () => {
    const controller = new AbortController()
    let calls = 0

    await expect(
      retry(
        async () => {
          calls += 1
          throw serverError()
        },
        {
          baseDelayMs: 1_000,
          jitter: false,
          onRetry: () => controller.abort(new Error('stop')),
          retries: 2,
          signal: controller.signal,
        },
      ),
    ).rejects.toThrow('stop')

    expect(calls).toBe(1)
  })

  it('rejects invalid retry counts', async () => {
    await expect(retry(async () => 1, { retries: -1 })).rejects.toThrow(RangeError)
    await expect(retry(async () => 1, { retries: 1.5 })).rejects.toThrow(RangeError)
  })
})

describe('withRetry', () => {
  it('forwards defaults and retries transport calls', async () => {
    let calls = 0
    const transport: TMDBTransport = {
      defaults: { imageBaseUrl: 'https://image.tmdb.org/t/p' },
      async get<T>(path: string): Promise<T> {
        calls += 1
        if (calls === 1) {
          throw networkError()
        }
        return { path } as T
      },
    }

    const wrapped = withRetry(transport, { baseDelayMs: 0, retries: 1 })
    expect(wrapped.defaults).toBe(transport.defaults)

    const result = await wrapped.get<{ path: string }>('/movie/550')
    expect(result.path).toBe('/movie/550')
    expect(calls).toBe(2)
  })

  it('uses the per-request signal for backoff cancellation', async () => {
    const controller = new AbortController()
    const { transport } = createTransport(() => {
      throw serverError()
    })
    const wrapped = withRetry(transport, { baseDelayMs: 1_000, jitter: false, retries: 3 })

    const promise = wrapped.get('/movie/550', { signal: controller.signal })
    await Bun.sleep(5)
    controller.abort(new Error('stop'))

    await expect(promise).rejects.toThrow('stop')
  })
})
