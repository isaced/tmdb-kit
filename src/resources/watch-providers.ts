import type { TMDBTransport } from '../http'
import { withLanguage, type QueryParams } from '../query'
import type { WatchProviderListOptions, WatchProviderListResponse } from '../types'

/**
 * Access TMDB's watch provider reference lists.
 *
 * Obtained via `client.watchProviders`. Use these lists to resolve the
 * provider IDs returned by `movies.watchProviders()` and
 * `tv.watchProviders()` to names and logos.
 */
export class WatchProvidersResource {
  readonly #transport: TMDBTransport

  constructor(transport: TMDBTransport) {
    this.#transport = transport
  }

  movies(options: WatchProviderListOptions = {}): Promise<WatchProviderListResponse> {
    return this.#transport.get('/watch/providers/movie', {
      query: watchProviderListQuery(this.#transport, options),
      signal: options.signal,
    })
  }

  tv(options: WatchProviderListOptions = {}): Promise<WatchProviderListResponse> {
    return this.#transport.get('/watch/providers/tv', {
      query: watchProviderListQuery(this.#transport, options),
      signal: options.signal,
    })
  }
}

/** Build query parameters for watch provider reference lists. */
function watchProviderListQuery(
  transport: TMDBTransport,
  options: WatchProviderListOptions,
): QueryParams {
  return withLanguage(transport.defaults, {
    language: options.language,
    watch_region: options.watchRegion,
  })
}
