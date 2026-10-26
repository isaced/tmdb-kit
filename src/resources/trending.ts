import type { TMDBTransport } from '../http'
import { toTimeWindow, withLanguage } from '../query'
import type {
  ListOptions,
  MovieSummary,
  PagedResponse,
  PersonSummary,
  TrendingResult,
  TrendingTimeWindow,
  TVSummary,
} from '../types'

type TrendingOptions = Omit<ListOptions, 'region'>

/**
 * Access TMDB trending content (movies, TV, people) for day/week windows.
 *
 * Obtained via `client.trending`.
 */
export class TrendingResource {
  readonly #transport: TMDBTransport

  constructor(transport: TMDBTransport) {
    this.#transport = transport
  }

  all(
    timeWindow: TrendingTimeWindow = 'day',
    options: TrendingOptions = {},
  ): Promise<PagedResponse<TrendingResult>> {
    return this.#transport.get(`/trending/all/${toTimeWindow(timeWindow)}`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
        page: options.page,
      }),
      signal: options.signal,
    })
  }

  movies(
    timeWindow: TrendingTimeWindow = 'day',
    options: TrendingOptions = {},
  ): Promise<PagedResponse<MovieSummary & { media_type?: 'movie' }>> {
    return this.#transport.get(`/trending/movie/${toTimeWindow(timeWindow)}`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
        page: options.page,
      }),
      signal: options.signal,
    })
  }

  tv(
    timeWindow: TrendingTimeWindow = 'day',
    options: TrendingOptions = {},
  ): Promise<PagedResponse<TVSummary & { media_type?: 'tv' }>> {
    return this.#transport.get(`/trending/tv/${toTimeWindow(timeWindow)}`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
        page: options.page,
      }),
      signal: options.signal,
    })
  }

  people(
    timeWindow: TrendingTimeWindow = 'day',
    options: TrendingOptions = {},
  ): Promise<PagedResponse<PersonSummary & { media_type?: 'person' }>> {
    return this.#transport.get(`/trending/person/${toTimeWindow(timeWindow)}`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
        page: options.page,
      }),
      signal: options.signal,
    })
  }
}
