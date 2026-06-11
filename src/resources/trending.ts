import type { TMDBTransport } from '../http'
import { toTimeWindow, withLanguage } from '../query'
import type {
  LanguageOptions,
  MovieSummary,
  PagedResponse,
  PersonSummary,
  TrendingResult,
  TrendingTimeWindow,
  TVSummary,
} from '../types'

export class TrendingResource {
  readonly #transport: TMDBTransport

  constructor(transport: TMDBTransport) {
    this.#transport = transport
  }

  all(
    timeWindow: TrendingTimeWindow = 'day',
    options: LanguageOptions = {},
  ): Promise<PagedResponse<TrendingResult>> {
    return this.#transport.get(`/trending/all/${toTimeWindow(timeWindow)}`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
      }),
    })
  }

  movies(
    timeWindow: TrendingTimeWindow = 'day',
    options: LanguageOptions = {},
  ): Promise<PagedResponse<MovieSummary & { media_type?: 'movie' }>> {
    return this.#transport.get(`/trending/movie/${toTimeWindow(timeWindow)}`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
      }),
    })
  }

  tv(
    timeWindow: TrendingTimeWindow = 'day',
    options: LanguageOptions = {},
  ): Promise<PagedResponse<TVSummary & { media_type?: 'tv' }>> {
    return this.#transport.get(`/trending/tv/${toTimeWindow(timeWindow)}`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
      }),
    })
  }

  people(
    timeWindow: TrendingTimeWindow = 'day',
    options: LanguageOptions = {},
  ): Promise<PagedResponse<PersonSummary & { media_type?: 'person' }>> {
    return this.#transport.get(`/trending/person/${toTimeWindow(timeWindow)}`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
      }),
    })
  }
}
