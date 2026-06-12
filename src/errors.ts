import type { JsonValue } from './types'

export interface TMDBErrorResponseBody {
  success?: boolean
  status_code?: number
  status_message?: string
}

export interface TMDBResponseErrorOptions {
  body: JsonValue | undefined
  headers: Headers
  status: number
  statusText: string
  url: string
}

/** Base class for all SDK-originated errors. */
export class TMDBError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'TMDBError'
  }
}

/** Thrown before a request is sent or when fetch itself rejects. */
export class TMDBRequestError extends TMDBError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'TMDBRequestError'
  }
}

/** Thrown when TMDB returns a non-2xx response. */
export class TMDBResponseError extends TMDBError {
  readonly body: JsonValue | undefined
  readonly headers: Headers
  readonly requestId: string | null
  readonly status: number
  readonly statusCode: number | undefined
  readonly statusMessage: string | undefined
  readonly statusText: string
  readonly url: string

  constructor(message: string, options: TMDBResponseErrorOptions) {
    super(message)
    this.name = 'TMDBResponseError'
    this.body = options.body
    this.headers = options.headers
    this.requestId = options.headers.get('x-request-id')
    this.status = options.status
    this.statusText = options.statusText
    this.url = options.url

    const body = isErrorResponseBody(options.body) ? options.body : undefined
    this.statusCode = body?.status_code
    this.statusMessage = body?.status_message
  }

  /** True when TMDB has asked the caller to back off (HTTP 429). */
  get isRateLimit(): boolean {
    return this.status === 429
  }

  /** True when the resource was not found (HTTP 404). */
  get isNotFound(): boolean {
    return this.status === 404
  }

  /** True when the request was rejected as unauthenticated (HTTP 401). */
  get isUnauthorized(): boolean {
    return this.status === 401
  }

  /** True when the request was rejected as forbidden (HTTP 403). */
  get isForbidden(): boolean {
    return this.status === 403
  }

  /** True when the upstream returned a 5xx server error. */
  get isServerError(): boolean {
    return this.status >= 500 && this.status < 600
  }
}

export interface TMDBRateLimitErrorOptions extends TMDBResponseErrorOptions {
  /** Seconds to wait before retrying. Parsed from the `Retry-After` header. */
  retryAfter: number
}

/**
 * Thrown when TMDB returns HTTP 429.
 *
 * The SDK does NOT retry automatically — that decision is left to the
 * caller, since retry policies vary widely. Inspect `retryAfter` to
 * implement your own backoff.
 */
export class TMDBRateLimitError extends TMDBResponseError {
  readonly retryAfter: number

  constructor(message: string, options: TMDBRateLimitErrorOptions) {
    super(message, options)
    this.name = 'TMDBRateLimitError'
    this.retryAfter = options.retryAfter
  }
}

export function createResponseError(
  options: TMDBResponseErrorOptions,
): TMDBResponseError {
  const body = isErrorResponseBody(options.body) ? options.body : undefined
  const message = body?.status_message ?? `${options.status} ${options.statusText}`.trim()

  if (options.status === 429) {
    return new TMDBRateLimitError(message, {
      ...options,
      retryAfter: parseRetryAfter(options.headers.get('retry-after')),
    })
  }

  return new TMDBResponseError(message, options)
}

/**
 * Parse the `Retry-After` header into seconds. Accepts both delta-seconds
 * (e.g. "5") and HTTP-date forms (e.g. "Wed, 21 Oct 2026 07:28:00 GMT").
 * Falls back to 1 second when the header is missing or unparseable.
 */
export function parseRetryAfter(value: string | null | undefined): number {
  if (value === null || value === undefined) {
    return 1
  }

  const trimmed = value.trim()
  if (trimmed === '') {
    return 1
  }

  const seconds = Number(trimmed)
  if (Number.isFinite(seconds) && seconds >= 0) {
    return seconds
  }

  const date = Date.parse(trimmed)
  if (Number.isFinite(date)) {
    const deltaMs = date - Date.now()
    return Math.max(1, Math.ceil(deltaMs / 1000))
  }

  return 1
}

function isErrorResponseBody(value: unknown): value is TMDBErrorResponseBody {
  return typeof value === 'object' && value !== null
}
