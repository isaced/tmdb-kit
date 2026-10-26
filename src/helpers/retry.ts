import {
  TMDBRateLimitError,
  TMDBRequestError,
  TMDBResponseError,
  TMDBTimeoutError,
} from '../errors'
import type { TMDBRequestOptions, TMDBTransport } from '../http'

export interface RetryInfo {
  /** Zero-based attempt number that failed. */
  attempt: number
  /** Delay before the next attempt, in milliseconds. */
  delayMs: number
  error: unknown
}

export interface RetryOptions {
  /** Retries after the first attempt. Defaults to 2. */
  retries?: number
  /** Base delay for exponential backoff in milliseconds. Defaults to 250. */
  baseDelayMs?: number
  /** Maximum exponential backoff delay in milliseconds. Defaults to 10000. */
  maxDelayMs?: number
  /** Exponential backoff factor. Defaults to 2. */
  factor?: number
  /** Apply full jitter to exponential delays. Defaults to true. */
  jitter?: boolean
  /** Cancels the delay and any further attempts. */
  signal?: AbortSignal
  /** Replaces the default retry predicate. */
  retryOn?: (error: unknown, attempt: number) => boolean
  /** Observes each retry decision without changing it. */
  onRetry?: (info: RetryInfo) => void
}

/** Retry-After values above this ceiling are clamped to keep callers responsive. */
const MAX_RETRY_AFTER_MS = 60_000

/**
 * Retry an async task using TMDB-aware defaults.
 *
 * Retries HTTP 429 using `Retry-After`, retries 5xx responses and network
 * failures with exponential backoff, and never retries other 4xx responses,
 * validation errors, aborts, or timeouts. All TMDB requests are GETs, so the
 * helper is safe for every resource method.
 */
export async function retry<T>(task: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const retries = options.retries ?? 2
  if (!Number.isInteger(retries) || retries < 0) {
    throw new RangeError('retries must be a non-negative integer')
  }

  const retryOn = options.retryOn ?? shouldRetry
  const signal = options.signal

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await task()
    } catch (error) {
      if (signal?.aborted) {
        throw signal.reason
      }
      if (attempt >= retries || !retryOn(error, attempt)) {
        throw error
      }

      const delayMs = retryDelay(error, attempt, options)
      options.onRetry?.({ attempt, delayMs, error })
      await sleep(delayMs, signal)
    }
  }
}

/**
 * Wrap a transport so every request uses {@link retry}.
 *
 * ```ts
 * const http = new TMDBHttpClient({ accessToken })
 * const tmdb = createTMDB({ accessToken, transport: withRetry(http, { retries: 3 }) })
 * ```
 */
export function withRetry(transport: TMDBTransport, options: RetryOptions = {}): TMDBTransport {
  return {
    defaults: transport.defaults,
    get<T>(path: string, requestOptions?: TMDBRequestOptions): Promise<T> {
      return retry(() => transport.get<T>(path, requestOptions), {
        ...options,
        signal: requestOptions?.signal ?? options.signal,
      })
    },
  }
}

function shouldRetry(error: unknown): boolean {
  if (error instanceof TMDBRateLimitError) {
    return true
  }
  if (error instanceof TMDBResponseError) {
    return error.isServerError
  }
  if (error instanceof TMDBTimeoutError) {
    return false
  }
  if (error instanceof TMDBRequestError) {
    if (error.cause === undefined || error.cause instanceof TMDBTimeoutError) {
      return false
    }
    return !isAbortError(error.cause)
  }
  return false
}

function retryDelay(error: unknown, attempt: number, options: RetryOptions): number {
  if (error instanceof TMDBRateLimitError) {
    return Math.min(Math.max(error.retryAfter * 1000, 0), MAX_RETRY_AFTER_MS)
  }

  const baseDelayMs = options.baseDelayMs ?? 250
  const maxDelayMs = options.maxDelayMs ?? 10_000
  const factor = options.factor ?? 2
  const delay = Math.min(maxDelayMs, baseDelayMs * factor ** attempt)

  return options.jitter === false ? delay : Math.random() * delay
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError'
  )
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer)
      signal?.removeEventListener('abort', onAbort)
      reject(signal!.reason)
    }

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)

    signal?.addEventListener('abort', onAbort, { once: true })

    // The signal may have fired before the listener was registered.
    if (signal?.aborted) {
      onAbort()
    }
  })
}
