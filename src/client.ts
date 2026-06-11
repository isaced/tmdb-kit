import { TMDBHttpClient, type TMDBClientOptions, type TMDBRequestOptions } from './http'
import { ConfigurationResource } from './resources/configuration'
import { GenresResource } from './resources/genres'
import { ImagesHelper } from './resources/images'
import { MoviesResource } from './resources/movies'
import { PeopleResource } from './resources/people'
import { SearchResource } from './resources/search'
import { TrendingResource } from './resources/trending'
import { TVResource } from './resources/tv'

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

  readonly #http: TMDBHttpClient

  constructor(options: TMDBClientOptions) {
    this.#http = new TMDBHttpClient(options)

    this.configuration = new ConfigurationResource(this.#http)
    this.genres = new GenresResource(this.#http)
    this.images = new ImagesHelper(this.#http)
    this.movies = new MoviesResource(this.#http)
    this.people = new PeopleResource(this.#http)
    this.search = new SearchResource(this.#http)
    this.trending = new TrendingResource(this.#http)
    this.tv = new TVResource(this.#http)
  }

  request<T>(path: string, options?: TMDBRequestOptions): Promise<T> {
    return this.#http.get<T>(path, options)
  }
}

export function createTMDB(options: TMDBClientOptions): TMDBClient {
  return new TMDBClient(options)
}
