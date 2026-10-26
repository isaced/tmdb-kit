import type { TMDBTransport } from '../http'
import { toCommaList, withLanguage, withListDefaults, type QueryParams } from '../query'
import type {
  DiscoverCommonOptions,
  DiscoverIdFilter,
  DiscoverMovieOptions,
  DiscoverTVOptions,
  MovieSummary,
  PagedResponse,
  TVSummary,
} from '../types'

/**
 * Access TMDB discover endpoints.
 *
 * Obtained via `client.discover`. The typed options cover the common
 * filters; unmodeled filters can still be sent through `client.request()`.
 */
export class DiscoverResource {
  readonly #transport: TMDBTransport

  constructor(transport: TMDBTransport) {
    this.#transport = transport
  }

  movies(options: DiscoverMovieOptions = {}): Promise<PagedResponse<MovieSummary>> {
    return this.#transport.get('/discover/movie', {
      query: discoverMovieQuery(this.#transport, options),
      signal: options.signal,
    })
  }

  tv(options: DiscoverTVOptions = {}): Promise<PagedResponse<TVSummary>> {
    return this.#transport.get('/discover/tv', {
      query: discoverTVQuery(this.#transport, options),
      signal: options.signal,
    })
  }
}

/** Build query parameters shared by movie and TV discover. */
function discoverCommonQuery(options: DiscoverCommonOptions): QueryParams {
  return {
    include_adult: options.includeAdult,
    'vote_average.gte': options.voteAverageGte,
    'vote_average.lte': options.voteAverageLte,
    'vote_count.gte': options.voteCountGte,
    'vote_count.lte': options.voteCountLte,
    'with_runtime.gte': options.runtimeGte,
    'with_runtime.lte': options.runtimeLte,
    with_genres: toDiscoverFilter(options.withGenres),
    without_genres: toDiscoverFilter(options.withoutGenres),
    with_keywords: toDiscoverFilter(options.withKeywords),
    with_companies: toDiscoverFilter(options.withCompanies),
    with_origin_country: toCommaList(options.withOriginCountry),
    with_original_language: options.withOriginalLanguage,
    with_watch_providers: toDiscoverFilter(options.withWatchProviders),
    watch_region: options.watchRegion,
    with_watch_monetization_types: toCommaList(options.withWatchMonetizationTypes),
  }
}

/** Build query parameters for movie discover. */
function discoverMovieQuery(transport: TMDBTransport, options: DiscoverMovieOptions): QueryParams {
  return withListDefaults(transport.defaults, {
    ...discoverCommonQuery(options),
    language: options.language,
    page: options.page,
    region: options.region,
    sort_by: options.sortBy,
    year: options.year,
    primary_release_year: options.primaryReleaseYear,
    'primary_release_date.gte': options.primaryReleaseDateGte,
    'primary_release_date.lte': options.primaryReleaseDateLte,
    'release_date.gte': options.releaseDateGte,
    'release_date.lte': options.releaseDateLte,
    with_people: toDiscoverFilter(options.withPeople),
    with_cast: toDiscoverFilter(options.withCast),
    with_crew: toDiscoverFilter(options.withCrew),
    with_release_type: toDiscoverFilter(options.withReleaseType),
  })
}

/** Build query parameters for TV discover. */
function discoverTVQuery(transport: TMDBTransport, options: DiscoverTVOptions): QueryParams {
  return withLanguage(transport.defaults, {
    ...discoverCommonQuery(options),
    language: options.language,
    page: options.page,
    sort_by: options.sortBy,
    'air_date.gte': options.airDateGte,
    'air_date.lte': options.airDateLte,
    'first_air_date.gte': options.firstAirDateGte,
    'first_air_date.lte': options.firstAirDateLte,
    first_air_date_year: options.firstAirDateYear,
    with_networks: toDiscoverFilter(options.withNetworks),
    with_status: options.withStatus,
    with_type: options.withType,
  })
}

/**
 * Convert a discover filter value to TMDB's query format.
 *
 * Arrays become comma-separated values (AND). A raw string is passed
 * through unchanged so callers can use TMDB's pipe syntax (OR).
 */
function toDiscoverFilter(value: DiscoverIdFilter | undefined): string | undefined {
  if (value === undefined) {
    return undefined
  }

  if (Array.isArray(value)) {
    return value.join(',')
  }

  return String(value)
}
