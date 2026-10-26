import type { ArgsDef } from 'citty'
import { CliError } from './errors'

export const jsonArg = {
  json: {
    type: 'boolean',
    description: 'Print the raw TMDB JSON response',
  },
} satisfies ArgsDef

export const commonArgs = {
  ...jsonArg,
  lang: {
    type: 'string',
    description: 'TMDB language code (default: en-US)',
  },
} satisfies ArgsDef

export const SEARCH_TYPES = ['all', 'movie', 'tv', 'person'] as const
export type SearchType = (typeof SEARCH_TYPES)[number]

export function parseSearchType(value: string): SearchType {
  if (!(SEARCH_TYPES as readonly string[]).includes(value)) {
    throw new CliError(
      `Invalid --type "${value}". Expected one of: ${SEARCH_TYPES.join(', ')}.`,
      2,
    )
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
    throw new CliError(
      `Invalid --type "${value}". Expected one of: ${GENRE_TYPES.join(', ')}.`,
      2,
    )
  }
  return value as GenreType
}

export const MOVIE_LIST_CATEGORIES = [
  'popular',
  'top-rated',
  'now-playing',
  'upcoming',
] as const
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

export const TV_LIST_CATEGORIES = [
  'popular',
  'top-rated',
  'airing-today',
  'on-the-air',
] as const
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
