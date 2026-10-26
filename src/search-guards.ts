import type {
  MovieMultiResult,
  MovieSearchResult,
  PersonMultiResult,
  PersonSearchResult,
  SearchMultiResult,
  TVMultiResult,
  TVSearchResult,
} from './types'

/**
 * Type guard that narrows a `search.multi()` result to a movie entry.
 *
 * The `media_type` field is required on every `/search/multi` payload by
 * TMDB, so this check is safe at runtime and produces a strictly typed
 * MovieSummary on the narrowed branch.
 */
export function isMovieSearchResult(result: SearchMultiResult): result is MovieMultiResult
export function isMovieSearchResult(result: unknown): result is MovieMultiResult
export function isMovieSearchResult(result: unknown): result is MovieMultiResult {
  return isObjectWithMediaType(result, 'movie')
}

/** Type guard that narrows a `search.multi()` result to a TV entry. */
export function isTVSearchResult(result: SearchMultiResult): result is TVMultiResult
export function isTVSearchResult(result: unknown): result is TVMultiResult
export function isTVSearchResult(result: unknown): result is TVMultiResult {
  return isObjectWithMediaType(result, 'tv')
}

/** Type guard that narrows a `search.multi()` result to a person entry. */
export function isPersonSearchResult(result: SearchMultiResult): result is PersonMultiResult
export function isPersonSearchResult(result: unknown): result is PersonMultiResult
export function isPersonSearchResult(result: unknown): result is PersonMultiResult {
  return isObjectWithMediaType(result, 'person')
}

/**
 * Convenience alias: `isMovieSearchResult` works on a `search.movies()`
 * result (which already has the narrow type but is also tagged with
 * `media_type?: 'movie'`), as well as on multi-search results.
 */
export function isMovie(result: MovieSearchResult | SearchMultiResult): result is MovieMultiResult
export function isMovie(result: SearchMultiResult): result is MovieMultiResult
export function isMovie(result: unknown): result is MovieMultiResult
export function isMovie(result: unknown): result is MovieMultiResult {
  return isObjectWithMediaType(result, 'movie')
}

/** Type guard that narrows a search result to a TV entry. */
export function isTV(result: TVSearchResult | SearchMultiResult): result is TVMultiResult
export function isTV(result: SearchMultiResult): result is TVMultiResult
export function isTV(result: unknown): result is TVMultiResult
export function isTV(result: unknown): result is TVMultiResult {
  return isObjectWithMediaType(result, 'tv')
}

/** Type guard that narrows a search result to a person entry. */
export function isPerson(
  result: PersonSearchResult | SearchMultiResult,
): result is PersonMultiResult
export function isPerson(result: SearchMultiResult): result is PersonMultiResult
export function isPerson(result: unknown): result is PersonMultiResult
export function isPerson(result: unknown): result is PersonMultiResult {
  return isObjectWithMediaType(result, 'person')
}

/** Internal helper: check if a value is an object with a matching `media_type` field. */
function isObjectWithMediaType(value: unknown, mediaType: 'movie' | 'tv' | 'person'): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    'media_type' in value &&
    (value as { media_type: unknown }).media_type === mediaType
  )
}
