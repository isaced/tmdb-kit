import { createResponseError, TMDBRequestError } from './errors'
import {
  appendQuery,
  DEFAULT_API_BASE_URL,
  DEFAULT_IMAGE_BASE_URL,
  normalizeBaseUrl,
  type QueryDefaults,
  type QueryParams,
} from './query'
import type { JsonValue, LanguageCode, RegionCode } from './types'

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>

export interface TMDBAccessTokenAuth {
  /** TMDB API Read Access Token. Sent as an Authorization Bearer header. */
  accessToken: string
  apiKey?: never
}

export interface TMDBApiKeyAuth {
  /** Legacy v3 API key. Sent as api_key query parameter. */
  apiKey: string
  accessToken?: never
}

export type TMDBAuth = TMDBAccessTokenAuth | TMDBApiKeyAuth

export interface TMDBClientDefaults extends QueryDefaults {
  imageBaseUrl: string
}

export type TMDBClientOptions = TMDBAuth & {
  /** Defaults to https://api.themoviedb.org/3. Useful for tests or proxies. */
  baseUrl?: string
  /** Inject a fetch implementation for tests, custom runtimes, or instrumentation. */
  fetch?: FetchLike
  /** Default language for endpoints that accept a language query parameter. */
  defaultLanguage?: LanguageCode
  /** Default region for movie list/search endpoints that accept a region query parameter. */
  defaultRegion?: RegionCode
  /** Custom image host. Defaults to https://image.tmdb.org/t/p. */
  imageBaseUrl?: string
  /** Additional headers merged into every request before authentication is applied. */
  headers?: HeadersInit
}

export interface TMDBRequestOptions {
  headers?: HeadersInit
  query?: QueryParams
  signal?: AbortSignal
}

export interface TMDBTransport {
  readonly defaults: TMDBClientDefaults
  get<T>(path: string, options?: TMDBRequestOptions): Promise<T>
}

export class TMDBHttpClient implements TMDBTransport {
  readonly defaults: TMDBClientDefaults

  readonly #apiKey: string | undefined
  readonly #accessToken: string | undefined
  readonly #baseUrl: string
  readonly #fetch: FetchLike
  readonly #headers: HeadersInit | undefined

  constructor(options: TMDBClientOptions) {
    const accessToken = normalizeSecret('accessToken' in options ? options.accessToken : undefined)
    const apiKey = normalizeSecret('apiKey' in options ? options.apiKey : undefined)

    if (Boolean(accessToken) === Boolean(apiKey)) {
      throw new TMDBRequestError('Provide exactly one of accessToken or apiKey')
    }

    const fetchImpl = options.fetch ?? globalThis.fetch?.bind(globalThis)

    if (typeof fetchImpl !== 'function') {
      throw new TMDBRequestError('No fetch implementation found. Pass options.fetch in this runtime.')
    }

    this.#accessToken = accessToken
    this.#apiKey = apiKey
    this.#baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_API_BASE_URL)
    this.#fetch = fetchImpl
    this.#headers = options.headers
    this.defaults = {
      imageBaseUrl: normalizeBaseUrl(options.imageBaseUrl ?? DEFAULT_IMAGE_BASE_URL),
      language: options.defaultLanguage,
      region: options.defaultRegion,
    }
  }

  async get<T>(path: string, options: TMDBRequestOptions = {}): Promise<T> {
    const url = this.#createUrl(path, options.query ?? {})
    const headers = this.#createHeaders(options.headers)

    let response: Response

    try {
      response = await this.#fetch(url, {
        headers,
        method: 'GET',
        signal: options.signal,
      })
    } catch (error) {
      throw new TMDBRequestError(`TMDB request failed: ${String(error)}`, { cause: error })
    }

    const body = await readJson(response)

    if (!response.ok) {
      throw createResponseError({
        body,
        headers: response.headers,
        status: response.status,
        statusText: response.statusText,
        url,
      })
    }

    return body as T
  }

  #createHeaders(headersInit: HeadersInit | undefined): Headers {
    const headers = new Headers(this.#headers)
    const requestHeaders = new Headers(headersInit)

    headers.set('Accept', 'application/json')

    for (const [key, value] of requestHeaders) {
      headers.set(key, value)
    }

    if (this.#accessToken !== undefined) {
      headers.set('Authorization', `Bearer ${this.#accessToken}`)
    }

    return headers
  }

  #createUrl(path: string, query: QueryParams): string {
    const relativePath = path.replace(/^\/+/, '')
    const url = new URL(relativePath, `${this.#baseUrl}/`)

    appendQuery(url, {
      ...query,
      api_key: this.#apiKey,
    })

    return url.toString()
  }
}

async function readJson(response: Response): Promise<JsonValue | undefined> {
  const text = await response.text()

  if (text.length === 0) {
    return undefined
  }

  try {
    return JSON.parse(text) as JsonValue
  } catch {
    return text
  }
}

function normalizeSecret(value: string | undefined): string | undefined {
  const secret = value?.trim()
  return secret === '' ? undefined : secret
}
