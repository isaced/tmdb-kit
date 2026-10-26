import { TMDBRequestError } from './errors'
import type { ImageSize, RegionCode, LanguageCode, TrendingTimeWindow } from './types'

/** Primitives allowed as query parameter values. */
export type QueryPrimitive = string | number | boolean

/** A single query parameter value: primitive, array, or nullish. */
export type QueryValue = QueryPrimitive | readonly QueryPrimitive[] | null | undefined

/** Key-value map of query parameters for API requests. */
export type QueryParams = Record<string, QueryValue>

/** Default query parameters inherited from the client configuration. */
export interface QueryDefaults {
  language?: LanguageCode
  region?: RegionCode
}

export const DEFAULT_API_BASE_URL = 'https://api.themoviedb.org/3'
export const DEFAULT_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

/**
 * Append query parameters to a URL object.
 *
 * - `undefined` and `null` values are skipped.
 * - Arrays are joined with commas (TMDB convention).
 * - All values are converted to strings.
 */
export function appendQuery(url: URL, query: QueryParams): void {
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue
    }

    if (Array.isArray(value)) {
      url.searchParams.set(key, value.map(String).join(','))
      continue
    }

    url.searchParams.set(key, String(value))
  }
}

/**
 * Merge a language query parameter with client defaults.
 *
 * If `query.language` is set it takes precedence; otherwise the client's
 * default language is used.
 */
export function withLanguage(defaults: QueryDefaults, query: QueryParams): QueryParams {
  const language = typeof query.language === 'string' ? query.language : defaults.language

  return {
    ...query,
    language,
  }
}

/**
 * Merge language and region defaults for list endpoints.
 *
 * Combines {@link withLanguage} with region fallback from client defaults.
 */
export function withListDefaults(defaults: QueryDefaults, query: QueryParams): QueryParams {
  const region = typeof query.region === 'string' ? query.region : defaults.region

  return {
    ...withLanguage(defaults, query),
    region,
  }
}

/**
 * Convert a string or string array to a comma-separated list.
 *
 * Returns `undefined` if the input is `undefined` (skips the parameter).
 * TMDB uses comma-separated values for multi-value query parameters.
 */
export function toCommaList(value: string | readonly string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined
  }

  return typeof value === 'string' ? value : value.join(',')
}

/**
 * Validate and convert a numeric ID to a string for use in URL paths.
 *
 * @throws {TMDBRequestError} If `value` is not a positive integer.
 */
export function toId(value: number, name: string): string {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TMDBRequestError(`${name} must be a positive integer`)
  }

  return String(value)
}

/**
 * Validate and trim a search query string.
 *
 * @throws {TMDBRequestError} If the query is empty after trimming.
 */
export function toSearchQuery(value: string): string {
  const query = value.trim()

  if (query.length === 0) {
    throw new TMDBRequestError('search query must not be empty')
  }

  return query
}

/**
 * Validate a trending time window value.
 *
 * @throws {TMDBRequestError} If `value` is not `"day"` or `"week"`.
 */
export function toTimeWindow(value: TrendingTimeWindow): TrendingTimeWindow {
  if (value !== 'day' && value !== 'week') {
    throw new TMDBRequestError('timeWindow must be either "day" or "week"')
  }

  return value
}

export interface BuildImageUrlOptions {
  baseUrl?: string
  /**
   * Transform the resolved TMDB image URL before returning it. Use this to
   * route requests through a CDN, image proxy, or to add signatures.
   */
  transform?: (url: string) => string
}

/**
 * Build a full TMDB image URL from the path returned by API payloads.
 * Returns null for nullish image paths so UI code can branch naturally.
 */
export function buildImageUrl(
  path: string | null | undefined,
  size: ImageSize = 'original',
  options: BuildImageUrlOptions = {},
): string | null {
  if (path === undefined || path === null || path.trim() === '') {
    return null
  }

  const baseUrl = normalizeBaseUrl(options.baseUrl ?? DEFAULT_IMAGE_BASE_URL)
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = `${baseUrl}/${size}${normalizedPath}`

  return options.transform ? options.transform(url) : url
}

/**
 * Strip trailing slashes from a base URL to ensure consistent path joining.
 */
export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}
