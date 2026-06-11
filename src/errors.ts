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
}

export function createResponseError(options: TMDBResponseErrorOptions): TMDBResponseError {
  const body = isErrorResponseBody(options.body) ? options.body : undefined
  const message = body?.status_message ?? `${options.status} ${options.statusText}`.trim()

  return new TMDBResponseError(message, options)
}

function isErrorResponseBody(value: unknown): value is TMDBErrorResponseBody {
  return typeof value === 'object' && value !== null
}
