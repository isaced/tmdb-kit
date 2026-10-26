import {
  TMDBHttpClient,
  type TMDBClientOptions,
  type TMDBRequestOptions,
  type TMDBTransport,
} from './http'
import { ConfigurationResource } from './resources/configuration'
import { GenresResource } from './resources/genres'
import { ImagesHelper } from './resources/images'
import { MoviesResource } from './resources/movies'
import { PeopleResource } from './resources/people'
import { SearchResource } from './resources/search'
import { TrendingResource } from './resources/trending'
import { TVResource } from './resources/tv'

/**
 * Options accepted by {@link createTMDB} and the {@link TMDBClient} constructor.
 *
 * Extends {@link TMDBClientOptions} with an optional {@link TMDBTransport} so
 * callers can plug in a custom transport (typically for tests, caching, or
 * instrumentation) without having to mock `fetch` or the factory itself.
 */
export type TMDBFactoryOptions = TMDBClientOptions & {
  transport?: TMDBTransport
}

/**
 * Main SDK entry point.
 *
 * Resource properties are intentionally small and explicit. The SDK focuses on
 * common TMDB workflows first, while request<T>() keeps uncommon endpoints easy
 * to call without waiting for a generated surface area.
 */
export class TMDBClient {
  readonly configuration: ConfigurationResource
  readonly genres: GenresResource
  readonly images: ImagesHelper
  readonly movies: MoviesResource
  readonly people: PeopleResource
  readonly search: SearchResource
  readonly trending: TrendingResource
  readonly tv: TVResource

  readonly #transport: TMDBTransport

  constructor(options: TMDBFactoryOptions) {
    const { transport, images, ...httpOptions } = options
    // When the caller supplies a custom transport we still want to honor the
    // global images.transform option; otherwise read it back from the HTTP
    // client after it has been constructed.
    const fallbackTransform = images?.transform
    const builtInClient =
      transport === undefined ? new TMDBHttpClient({ ...httpOptions, images }) : undefined
    this.#transport = builtInClient ?? (transport as TMDBTransport)

    this.configuration = new ConfigurationResource(this.#transport)
    this.genres = new GenresResource(this.#transport)
    this.images = new ImagesHelper(
      this.#transport,
      builtInClient ? builtInClient.imageTransform : fallbackTransform,
    )
    this.movies = new MoviesResource(this.#transport)
    this.people = new PeopleResource(this.#transport)
    this.search = new SearchResource(this.#transport)
    this.trending = new TrendingResource(this.#transport)
    this.tv = new TVResource(this.#transport)
  }

  /**
   * Make a raw GET request to any TMDB endpoint.
   *
   * This is an escape hatch for endpoints not covered by the typed resource
   * helpers. The `path` should be relative to the API base URL (e.g.
   * `/movie/{id}/credits`). Response is parsed as JSON and cast to `T`.
   *
   * @param path - API path relative to the base URL (e.g. `/movie/123`)
   * @param options - Optional request-level overrides (headers, query, signal)
   * @returns Parsed JSON response typed as `T`
   */
  request<T>(path: string, options?: TMDBRequestOptions): Promise<T> {
    return this.#transport.get<T>(path, options)
  }
}

/**
 * Create a new {@link TMDBClient} instance.
 *
 * @example
 * ```ts
 * const tmdb = createTMDB({ accessToken: 'YOUR_TOKEN' })
 * const { results } = await tmdb.search.movies('Inception')
 * ```
 *
 * @param options - Authentication and configuration options
 * @returns A configured TMDBClient ready to make API calls
 */
export function createTMDB(options: TMDBFactoryOptions): TMDBClient {
  return new TMDBClient(options)
}
