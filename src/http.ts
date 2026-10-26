import { createResponseError, TMDBRequestError } from './errors'
import {
  appendQuery,
  DEFAULT_API_BASE_URL,
  DEFAULT_IMAGE_BASE_URL,
  normalizeBaseUrl,
  type QueryDefaults,
  type QueryParams,
} from './query'
import type { ImageUrlTransform } from './resources/images'
import type { JsonValue, LanguageCode, RegionCode } from './types'

export type { ImageUrlTransform }

/**
 * A minimal fetch-like function signature. Any runtime's native `fetch`
 * or a test double conforming to this shape can be used.
 */
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

/** Internal defaults resolved during client construction. */
export interface TMDBClientDefaults extends QueryDefaults {
  imageBaseUrl: string
}

export interface TMDBImagesOptions {
  /**
   * Default transform applied to every URL produced by the ImagesHelper.
   * Use this to route TMDB image requests through a CDN, image proxy, or
   * to add signed query parameters. Individual calls can still override it
   * via ImagesHelper.url(path, size, { transform }).
   */
  transform?: ImageUrlTransform
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
  /** Image-helper configuration: host overrides and URL transforms. */
  images?: TMDBImagesOptions
  /** Additional headers merged into every request before authentication is applied. */
  headers?: HeadersInit
}

/** Per-request overrides applied when making a single API call. */
export interface TMDBRequestOptions {
  headers?: HeadersInit
  query?: QueryParams
  signal?: AbortSignal
}

/**
 * Transport abstraction for making HTTP requests to the TMDB API.
 *
 * The built-in {@link TMDBHttpClient} implements this interface. You can
 * provide a custom implementation via {@link TMDBFactoryOptions.transport}
 * for testing, caching, or instrumentation.
 */
export interface TMDBTransport {
  readonly defaults: TMDBClientDefaults
  get<T>(path: string, options?: TMDBRequestOptions): Promise<T>
}

/**
 * Built-in HTTP transport that uses the Fetch API.
 *
 * Handles authentication (API key or access token), URL construction,
 * request headers, and response parsing. Use the factory function
 * {@link createTMDB} instead of instantiating this directly.
 */
export class TMDBHttpClient implements TMDBTransport {
  readonly defaults: TMDBClientDefaults
  readonly imageTransform: ImageUrlTransform | undefined

  readonly #apiKey: string | undefined
  readonly #accessToken: string | undefined
  readonly #baseUrl: string
  readonly #fetch: FetchLike | undefined
  readonly #headers: HeadersInit | undefined

  constructor(options: TMDBClientOptions) {
    const accessToken = normalizeSecret('accessToken' in options ? options.accessToken : undefined)
    const apiKey = normalizeSecret('apiKey' in options ? options.apiKey : undefined)

    if (Boolean(accessToken) === Boolean(apiKey)) {
      throw new TMDBRequestError('Provide exactly one of accessToken or apiKey')
    }

    this.#accessToken = accessToken
    this.#apiKey = apiKey
    this.#baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_API_BASE_URL)
    this.#fetch = options.fetch
    this.#headers = options.headers
    this.defaults = {
      imageBaseUrl: normalizeBaseUrl(options.imageBaseUrl ?? DEFAULT_IMAGE_BASE_URL),
      language: options.defaultLanguage,
      region: options.defaultRegion,
    }
    this.imageTransform = options.images?.transform
  }

  async get<T>(path: string, options: TMDBRequestOptions = {}): Promise<T> {
    const url = this.#createUrl(path, options.query ?? {})
    const headers = this.#createHeaders(options.headers)
    const fetchImpl = this.#resolveFetch()

    let response: Response

    try {
      response = await fetchImpl(url, {
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

  #resolveFetch(): FetchLike {
    if (this.#fetch !== undefined) {
      return this.#fetch
    }

    const globalFetch = globalThis.fetch

    if (typeof globalFetch !== 'function') {
      throw new TMDBRequestError(
        'No fetch implementation found. Pass options.fetch in this runtime.',
      )
    }

    return globalFetch.bind(globalThis)
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

/**
 * Read and parse a JSON response body.
 *
 * Returns `undefined` for empty responses. If the body is not valid JSON,
 * the raw text string is returned as-is (TMDB occasionally returns plain
 * text for certain error conditions).
 */
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

/**
 * Normalize a secret value by trimming whitespace and treating empty
 * strings as undefined (not provided).
 */
function normalizeSecret(value: string | undefined): string | undefined {
  const secret = value?.trim()
  return secret === '' ? undefined : secret
}
