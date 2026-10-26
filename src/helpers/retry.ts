import {
  parseRetryAfter,
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
 * Retries 429 and any response that carries `Retry-After`, retries 408 and
 * 5xx responses plus network failures with exponential backoff, and never
 * retries other 4xx responses, validation errors, aborts, or timeouts. All
 * TMDB requests are GETs, so the helper is safe for every resource method.
 */
export async function retry<T>(task: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const retries = options.retries ?? 2
  if (!Number.isInteger(retries) || retries < 0) {
    throw new RangeError('retries must be a non-negative integer')
  }

  const retryOn = options.retryOn ?? shouldRetry
  const signal = options.signal

  if (signal?.aborted) {
    throw signal.reason
  }

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
 * const tmdb = createTMDB({ transport: withRetry(http, { retries: 3 }) })
 * ```
 */
export function withRetry<T extends TMDBTransport>(transport: T, options: RetryOptions = {}): T {
  return {
    ...transport,
    get<U>(path: string, requestOptions?: TMDBRequestOptions): Promise<U> {
      const { cleanup, signal } = combineSignals(options.signal, requestOptions?.signal)
      const effectiveOptions = signal === undefined ? requestOptions : { ...requestOptions, signal }

      return retry(() => transport.get<U>(path, effectiveOptions), {
        ...options,
        signal,
      }).finally(cleanup)
    },
  }
}

function shouldRetry(error: unknown): boolean {
  if (error instanceof TMDBRateLimitError) {
    return true
  }
  if (error instanceof TMDBResponseError) {
    return error.isServerError || error.status === 408
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
  const retryAfter = retryAfterMs(error)
  if (retryAfter !== undefined) {
    return Math.min(Math.max(retryAfter, 0), MAX_RETRY_AFTER_MS)
  }

  if (error instanceof TMDBRateLimitError) {
    return Math.min(Math.max(error.retryAfter * 1000, 0), MAX_RETRY_AFTER_MS)
  }

  const baseDelayMs = options.baseDelayMs ?? 250
  const maxDelayMs = options.maxDelayMs ?? 10_000
  const factor = options.factor ?? 2
  const delay = Math.min(maxDelayMs, baseDelayMs * factor ** attempt)

  return options.jitter === false ? delay : Math.random() * delay
}

function retryAfterMs(error: unknown): number | undefined {
  if (!(error instanceof TMDBResponseError)) {
    return undefined
  }

  const header = error.headers.get('retry-after')
  if (header === null || header.trim() === '') {
    return undefined
  }

  return parseRetryAfter(header) * 1000
}

/**
 * Combine a wrapper-level signal with a per-request signal.
 *
 * `AbortSignal.any()` requires Node 20.3+, while the package supports Node 18,
 * so the fallback keeps both signals wired to one controller. The cleanup
 * function detaches the listeners once the request settles.
 */
function combineSignals(
  first: AbortSignal | undefined,
  second: AbortSignal | undefined,
): { cleanup: () => void; signal: AbortSignal | undefined } {
  if (first === undefined || second === undefined || first === second) {
    return { cleanup: noop, signal: first ?? second }
  }

  const controller = new AbortController()
  const onAbort = () => controller.abort((first.aborted ? first : second).reason)

  first.addEventListener('abort', onAbort, { once: true })
  second.addEventListener('abort', onAbort, { once: true })

  // Either signal may have aborted between the guard above and registration.
  if (first.aborted || second.aborted) {
    onAbort()
  }

  return {
    cleanup() {
      first.removeEventListener('abort', onAbort)
      second.removeEventListener('abort', onAbort)
    },
    signal: controller.signal,
  }
}

function noop(): void {}

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
