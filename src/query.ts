import { TMDBRequestError } from './errors'
import type { ImageSize, RegionCode, LanguageCode, TrendingTimeWindow } from './types'

export type QueryPrimitive = string | number | boolean
export type QueryValue = QueryPrimitive | readonly QueryPrimitive[] | null | undefined
export type QueryParams = Record<string, QueryValue>

export interface QueryDefaults {
  language?: LanguageCode
  region?: RegionCode
}

export const DEFAULT_API_BASE_URL = 'https://api.themoviedb.org/3'
export const DEFAULT_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

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

export function withLanguage(
  defaults: QueryDefaults,
  query: QueryParams,
): QueryParams {
  const language = typeof query.language === 'string' ? query.language : defaults.language

  return {
    ...query,
    language,
  }
}

export function withListDefaults(
  defaults: QueryDefaults,
  query: QueryParams,
): QueryParams {
  const region = typeof query.region === 'string' ? query.region : defaults.region

  return {
    ...withLanguage(defaults, query),
    region,
  }
}

export function toCommaList(value: string | readonly string[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined
  }

  return typeof value === 'string' ? value : value.join(',')
}

export function toId(value: number, name: string): string {
  if (!Number.isInteger(value) || value <= 0) {
    throw new TMDBRequestError(`${name} must be a positive integer`)
  }

  return String(value)
}

export function toSearchQuery(value: string): string {
  const query = value.trim()

  if (query.length === 0) {
    throw new TMDBRequestError('search query must not be empty')
  }

  return query
}

export function toTimeWindow(value: TrendingTimeWindow): TrendingTimeWindow {
  if (value !== 'day' && value !== 'week') {
    throw new TMDBRequestError('timeWindow must be either "day" or "week"')
  }

  return value
}

export interface BuildImageUrlOptions {
  baseUrl?: string
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

  return `${baseUrl}/${size}${normalizedPath}`
}

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '')
}
