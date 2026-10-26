import type { TMDBTransport } from '../http'
import { toExternalId, withLanguage } from '../query'
import type { FindOptions, FindResponse } from '../types'

/**
 * Reverse external-ID lookup.
 *
 * Obtained via `client.find`.
 */
export class FindResource {
  readonly #transport: TMDBTransport

  constructor(transport: TMDBTransport) {
    this.#transport = transport
  }

  /**
   * Find TMDB movies, TV shows, people, episodes, and seasons by an
   * external ID such as an IMDb or TVDB ID.
   *
   * TMDB always returns all five result arrays; check the one you need.
   */
  byExternalId(externalId: string, options: FindOptions): Promise<FindResponse> {
    return this.#transport.get(`/find/${toExternalId(externalId)}`, {
      query: withLanguage(this.#transport.defaults, {
        external_source: options.source,
        language: options.language,
      }),
      signal: options.signal,
    })
  }
}
