import type { ArgsDef } from 'citty'
import type {
  DiscoverIdFilter,
  DiscoverMovieSortBy,
  DiscoverTVSortBy,
  ExternalIdSource,
  WatchMonetizationType,
} from '../index'
import { CliError } from './errors'

export const jsonArg = {
  json: {
    type: 'boolean',
    description: 'Alias for --format json',
  },
} satisfies ArgsDef

export const formatArg = {
  format: {
    type: 'string',
    description: 'Output format: text, json, or ndjson (default: text)',
  },
  compact: {
    type: 'boolean',
    description: 'Print JSON on a single line',
  },
  fields: {
    type: 'string',
    description: 'Comma-separated top-level fields to keep in JSON output',
  },
} satisfies ArgsDef

export const outputArgs = {
  ...jsonArg,
  ...formatArg,
} satisfies ArgsDef

/** Extra flags for commands that return a paginated list. */
export const paginationArgs = {
  all: {
    type: 'boolean',
    description: 'Fetch every page instead of one (requires --format ndjson)',
  },
  'max-items': {
    type: 'string',
    description: 'Stop after this many items (requires --format ndjson)',
  },
} satisfies ArgsDef

export const commonArgs = {
  ...outputArgs,
  lang: {
    type: 'string',
    description: 'TMDB language code (default: en-US)',
  },
} satisfies ArgsDef

export const SEARCH_TYPES = ['all', 'movie', 'tv', 'person'] as const
export type SearchType = (typeof SEARCH_TYPES)[number]

export function parseSearchType(value: string): SearchType {
  if (!(SEARCH_TYPES as readonly string[]).includes(value)) {
    throw new CliError(`Invalid --type "${value}". Expected one of: ${SEARCH_TYPES.join(', ')}.`, 2)
  }
  return value as SearchType
}

export function parsePage(value: string | undefined): number {
  if (value === undefined || value === '') {
    return 1
  }

  const page = Number(value)
  if (!Number.isInteger(page) || page < 1) {
    throw new CliError('Invalid --page value: expected a positive integer.', 2)
  }
  return page
}

export function parseId(value: string, label: string): number {
  const id = Number(value)
  if (!Number.isInteger(id) || id <= 0) {
    throw new CliError(`Invalid ${label}: expected a positive integer.`, 2)
  }
  return id
}

export function parseSeasonNumber(value: string): number {
  const season = Number(value)
  if (!Number.isInteger(season) || season < 0) {
    throw new CliError('Invalid season number: expected a non-negative integer.', 2)
  }
  return season
}

export function parseGroupId(value: string): string {
  const groupId = value.trim()
  if (!/^[A-Za-z0-9_-]+$/.test(groupId)) {
    throw new CliError('Invalid group ID: expected a non-empty identifier.', 2)
  }
  return groupId
}

export function parseLimit(value: string | undefined, fallback = 10): number {
  if (value === undefined || value === '') {
    return fallback
  }

  const limit = Number(value)
  if (!Number.isInteger(limit) || limit < 1) {
    throw new CliError('Invalid --limit value: expected a positive integer.', 2)
  }
  return limit
}

export function parseCommaList(value: string | undefined): string[] | undefined {
  if (value === undefined) {
    return undefined
  }

  const values = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
  return values.length > 0 ? values : undefined
}

export const TRENDING_WINDOWS = ['day', 'week'] as const
export type TrendingWindow = (typeof TRENDING_WINDOWS)[number]

export function parseWindow(value: string): TrendingWindow {
  if (!(TRENDING_WINDOWS as readonly string[]).includes(value)) {
    throw new CliError(
      `Invalid --window "${value}". Expected one of: ${TRENDING_WINDOWS.join(', ')}.`,
      2,
    )
  }
  return value as TrendingWindow
}

export const GENRE_TYPES = ['movie', 'tv'] as const
export type GenreType = (typeof GENRE_TYPES)[number]

export function parseGenreType(value: string): GenreType {
  if (!(GENRE_TYPES as readonly string[]).includes(value)) {
    throw new CliError(`Invalid --type "${value}". Expected one of: ${GENRE_TYPES.join(', ')}.`, 2)
  }
  return value as GenreType
}

export const MOVIE_LIST_CATEGORIES = ['popular', 'top-rated', 'now-playing', 'upcoming'] as const
export type MovieListCategory = (typeof MOVIE_LIST_CATEGORIES)[number]

export function parseMovieListCategory(value: string): MovieListCategory {
  if (!(MOVIE_LIST_CATEGORIES as readonly string[]).includes(value)) {
    throw new CliError(
      `Invalid movie list category "${value}". Expected one of: ${MOVIE_LIST_CATEGORIES.join(', ')}.`,
      2,
    )
  }
  return value as MovieListCategory
}

export const TV_LIST_CATEGORIES = ['popular', 'top-rated', 'airing-today', 'on-the-air'] as const
export type TVListCategory = (typeof TV_LIST_CATEGORIES)[number]

export function parseTVListCategory(value: string): TVListCategory {
  if (!(TV_LIST_CATEGORIES as readonly string[]).includes(value)) {
    throw new CliError(
      `Invalid TV list category "${value}". Expected one of: ${TV_LIST_CATEGORIES.join(', ')}.`,
      2,
    )
  }
  return value as TVListCategory
}

export const EXTERNAL_ID_SOURCES = [
  'imdb_id',
  'freebase_mid',
  'freebase_id',
  'tvdb_id',
  'tvrage_id',
  'facebook_id',
  'twitter_id',
  'instagram_id',
  'tiktok_id',
  'youtube_id',
  'wikidata_id',
] as const satisfies readonly ExternalIdSource[]

export function parseExternalSource(value: string): ExternalIdSource {
  if (!(EXTERNAL_ID_SOURCES as readonly string[]).includes(value)) {
    throw new CliError(
      `Invalid --source "${value}". Expected one of: ${EXTERNAL_ID_SOURCES.join(', ')}.`,
      2,
    )
  }
  return value as ExternalIdSource
}

export function parseExternalId(value: string): string {
  const externalId = value.trim()
  if (externalId.length === 0) {
    throw new CliError('External ID must not be empty.', 2)
  }
  return externalId
}

export const WATCH_MONETIZATION_TYPES = [
  'flatrate',
  'free',
  'ads',
  'rent',
  'buy',
] as const satisfies readonly WatchMonetizationType[]

export function parseWatchMonetizationTypes(
  value: string | undefined,
): WatchMonetizationType[] | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined
  }

  const values = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (values.length === 0) {
    return undefined
  }

  for (const item of values) {
    if (!(WATCH_MONETIZATION_TYPES as readonly string[]).includes(item)) {
      throw new CliError(
        `Invalid --with-watch-monetization-types "${item}". Expected one of: ${WATCH_MONETIZATION_TYPES.join(', ')}.`,
        2,
      )
    }
  }

  return values as WatchMonetizationType[]
}

export const MOVIE_SORT_BY = [
  'popularity.asc',
  'popularity.desc',
  'revenue.asc',
  'revenue.desc',
  'primary_release_date.asc',
  'primary_release_date.desc',
  'original_title.asc',
  'original_title.desc',
  'title.asc',
  'title.desc',
  'vote_average.asc',
  'vote_average.desc',
  'vote_count.asc',
  'vote_count.desc',
] as const satisfies readonly DiscoverMovieSortBy[]

export function parseMovieSortBy(value: string | undefined): DiscoverMovieSortBy | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined
  }
  if (!(MOVIE_SORT_BY as readonly string[]).includes(value)) {
    throw new CliError(
      `Invalid --sort-by "${value}". Expected one of: ${MOVIE_SORT_BY.join(', ')}.`,
      2,
    )
  }
  return value as DiscoverMovieSortBy
}

export const TV_SORT_BY = [
  'first_air_date.asc',
  'first_air_date.desc',
  'name.asc',
  'name.desc',
  'original_name.asc',
  'original_name.desc',
  'popularity.asc',
  'popularity.desc',
  'vote_average.asc',
  'vote_average.desc',
  'vote_count.asc',
  'vote_count.desc',
] as const satisfies readonly DiscoverTVSortBy[]

export function parseTVSortBy(value: string | undefined): DiscoverTVSortBy | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined
  }
  if (!(TV_SORT_BY as readonly string[]).includes(value)) {
    throw new CliError(
      `Invalid --sort-by "${value}". Expected one of: ${TV_SORT_BY.join(', ')}.`,
      2,
    )
  }
  return value as DiscoverTVSortBy
}

/**
 * Parse a discover ID filter.
 *
 * Comma-separated values become an array (TMDB treats commas as AND).
 * Pipe-separated values are validated and returned as a raw string so
 * TMDB's OR syntax is preserved.
 */
export function parseIdFilter(value: string | undefined): DiscoverIdFilter | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined
  }

  const trimmed = value.trim()

  if (trimmed.includes('|')) {
    const tokens = trimmed.split('|').map((item) => item.trim())
    if (tokens.some((item) => !/^\d+$/.test(item))) {
      throw new CliError(
        `Invalid filter value "${value}": expected numeric IDs separated by commas or pipes.`,
        2,
      )
    }
    return tokens.join('|')
  }

  const tokens = trimmed
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  const ids = tokens.map((item) => {
    const id = Number(item)
    if (!Number.isInteger(id) || id < 1) {
      throw new CliError(
        `Invalid filter value "${value}": expected positive integers separated by commas.`,
        2,
      )
    }
    return id
  })

  if (ids.length === 0) {
    return undefined
  }

  return ids.length === 1 ? ids[0] : ids
}

export function parseNumber(value: string | undefined, label: string): number | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined
  }
  const number = Number(value)
  if (!Number.isFinite(number)) {
    throw new CliError(`Invalid ${label} value: expected a number.`, 2)
  }
  return number
}

export function parseInteger(value: string | undefined, label: string): number | undefined {
  if (value === undefined || value.trim() === '') {
    return undefined
  }
  const number = Number(value)
  if (!Number.isInteger(number)) {
    throw new CliError(`Invalid ${label} value: expected an integer.`, 2)
  }
  return number
}
