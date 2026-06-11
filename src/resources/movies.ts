import type { TMDBTransport } from '../http'
import { toCommaList, toId, withLanguage, withListDefaults, type QueryParams } from '../query'
import type {
  CreditsResponse,
  ImageQueryOptions,
  ImagesResponse,
  ListOptions,
  MovieDetails,
  MovieDetailsOptions,
  MovieSummary,
  PagedResponse,
  TMDBObject,
  VideosResponse,
} from '../types'

export class MoviesResource {
  readonly #transport: TMDBTransport

  constructor(transport: TMDBTransport) {
    this.#transport = transport
  }

  popular(options: ListOptions = {}): Promise<PagedResponse<MovieSummary>> {
    return this.#transport.get('/movie/popular', {
      query: movieListQuery(this.#transport, options),
    })
  }

  topRated(options: ListOptions = {}): Promise<PagedResponse<MovieSummary>> {
    return this.#transport.get('/movie/top_rated', {
      query: movieListQuery(this.#transport, options),
    })
  }

  nowPlaying(options: ListOptions = {}): Promise<PagedResponse<MovieSummary>> {
    return this.#transport.get('/movie/now_playing', {
      query: movieListQuery(this.#transport, options),
    })
  }

  upcoming(options: ListOptions = {}): Promise<PagedResponse<MovieSummary>> {
    return this.#transport.get('/movie/upcoming', {
      query: movieListQuery(this.#transport, options),
    })
  }

  details<TAppend extends TMDBObject = TMDBObject>(
    movieId: number,
    options: MovieDetailsOptions = {},
  ): Promise<MovieDetails & TAppend> {
    return this.#transport.get(`/movie/${toId(movieId, 'movieId')}`, {
      query: withLanguage(this.#transport.defaults, {
        append_to_response: toCommaList(options.appendToResponse),
        language: options.language,
      }),
    })
  }

  credits(movieId: number, options: Pick<ListOptions, 'language'> = {}): Promise<CreditsResponse> {
    return this.#transport.get(`/movie/${toId(movieId, 'movieId')}/credits`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
      }),
    })
  }

  images(movieId: number, options: ImageQueryOptions = {}): Promise<ImagesResponse> {
    return this.#transport.get(`/movie/${toId(movieId, 'movieId')}/images`, {
      query: withLanguage(this.#transport.defaults, {
        include_image_language: toCommaList(options.includeImageLanguage),
        language: options.language,
      }),
    })
  }

  recommendations(movieId: number, options: ListOptions = {}): Promise<PagedResponse<MovieSummary>> {
    return this.#transport.get(`/movie/${toId(movieId, 'movieId')}/recommendations`, {
      query: movieListQuery(this.#transport, options),
    })
  }

  similar(movieId: number, options: ListOptions = {}): Promise<PagedResponse<MovieSummary>> {
    return this.#transport.get(`/movie/${toId(movieId, 'movieId')}/similar`, {
      query: movieListQuery(this.#transport, options),
    })
  }

  videos(movieId: number, options: Pick<ListOptions, 'language'> = {}): Promise<VideosResponse> {
    return this.#transport.get(`/movie/${toId(movieId, 'movieId')}/videos`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
      }),
    })
  }
}

function movieListQuery(transport: TMDBTransport, options: ListOptions): QueryParams {
  return withListDefaults(transport.defaults, {
    language: options.language,
    page: options.page,
    region: options.region,
  })
}
