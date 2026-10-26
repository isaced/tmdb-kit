import type { TMDBTransport } from '../http'
import { withLanguage } from '../query'
import type { GenresResponse, LanguageOptions } from '../types'

/**
 * Access TMDB genre lists for movies and TV shows.
 *
 * Obtained via `client.genres`.
 */
export class GenresResource {
  readonly #transport: TMDBTransport

  constructor(transport: TMDBTransport) {
    this.#transport = transport
  }

  movies(options: LanguageOptions = {}): Promise<GenresResponse> {
    return this.#transport.get('/genre/movie/list', {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
      }),
      signal: options.signal,
    })
  }

  tv(options: LanguageOptions = {}): Promise<GenresResponse> {
    return this.#transport.get('/genre/tv/list', {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
      }),
      signal: options.signal,
    })
  }
}
