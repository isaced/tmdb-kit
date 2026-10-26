import type { TMDBTransport } from '../http'
import { toSearchQuery, withLanguage, withListDefaults, type QueryParams } from '../query'
import type {
  MovieSearchOptions,
  MovieSearchResult,
  MultiSearchOptions,
  PagedResponse,
  PersonSearchResult,
  SearchMultiResult,
  TVSearchOptions,
  TVSearchResult,
} from '../types'

/**
 * Search TMDB for movies, TV shows, people, or all media types.
 *
 * Obtained via `client.search`.
 */
export class SearchResource {
  readonly #transport: TMDBTransport

  constructor(transport: TMDBTransport) {
    this.#transport = transport
  }

  movies(
    query: string,
    options: MovieSearchOptions = {},
  ): Promise<PagedResponse<MovieSearchResult>> {
    return this.#transport.get('/search/movie', {
      query: movieSearchQuery(this.#transport, query, options),
      signal: options.signal,
    })
  }

  tv(query: string, options: TVSearchOptions = {}): Promise<PagedResponse<TVSearchResult>> {
    return this.#transport.get('/search/tv', {
      query: tvSearchQuery(this.#transport, query, options),
      signal: options.signal,
    })
  }

  people(
    query: string,
    options: MultiSearchOptions = {},
  ): Promise<PagedResponse<PersonSearchResult>> {
    return this.#transport.get('/search/person', {
      query: commonSearchQuery(this.#transport, query, options),
      signal: options.signal,
    })
  }

  async multi(
    query: string,
    options: MultiSearchOptions = {},
  ): Promise<PagedResponse<SearchMultiResult>> {
    const response = await this.#transport.get<PagedResponse<SearchMultiResult>>('/search/multi', {
      query: commonSearchQuery(this.#transport, query, options),
      signal: options.signal,
    })

    const excluded = options.exclude
    if (excluded === undefined || excluded.length === 0) {
      return response
    }

    const excludedSet = new Set<string>(excluded)
    return {
      ...response,
      results: response.results.filter((result) => !excludedSet.has(result.media_type)),
    }
  }
}

/** Build query parameters for movie search. */
function movieSearchQuery(
  transport: TMDBTransport,
  query: string,
  options: MovieSearchOptions,
): QueryParams {
  return withListDefaults(transport.defaults, {
    include_adult: options.includeAdult,
    language: options.language,
    page: options.page,
    primary_release_year: options.primaryReleaseYear,
    query: toSearchQuery(query),
    region: options.region,
    year: options.year,
  })
}

/** Build query parameters for TV search. */
function tvSearchQuery(
  transport: TMDBTransport,
  query: string,
  options: TVSearchOptions,
): QueryParams {
  return withLanguage(transport.defaults, {
    first_air_date_year: options.firstAirDateYear,
    include_adult: options.includeAdult,
    language: options.language,
    page: options.page,
    query: toSearchQuery(query),
    year: options.year,
  })
}

/** Build query parameters for person and multi-search. */
function commonSearchQuery(
  transport: TMDBTransport,
  query: string,
  options: MultiSearchOptions,
): QueryParams {
  return withLanguage(transport.defaults, {
    include_adult: options.includeAdult,
    language: options.language,
    page: options.page,
    query: toSearchQuery(query),
  })
}
