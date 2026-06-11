import type { TMDBTransport } from '../http'
import { toCommaList, toId, withLanguage, type QueryParams } from '../query'
import type {
  CreditsResponse,
  ImageQueryOptions,
  ImagesResponse,
  LanguageOptions,
  ListOptions,
  PagedResponse,
  TMDBObject,
  TVDetails,
  TVDetailsOptions,
  TVSummary,
  VideosResponse,
} from '../types'

export class TVResource {
  readonly #transport: TMDBTransport

  constructor(transport: TMDBTransport) {
    this.#transport = transport
  }

  popular(options: Omit<ListOptions, 'region'> = {}): Promise<PagedResponse<TVSummary>> {
    return this.#transport.get('/tv/popular', {
      query: tvListQuery(this.#transport, options),
    })
  }

  topRated(options: Omit<ListOptions, 'region'> = {}): Promise<PagedResponse<TVSummary>> {
    return this.#transport.get('/tv/top_rated', {
      query: tvListQuery(this.#transport, options),
    })
  }

  airingToday(options: Omit<ListOptions, 'region'> = {}): Promise<PagedResponse<TVSummary>> {
    return this.#transport.get('/tv/airing_today', {
      query: tvListQuery(this.#transport, options),
    })
  }

  onTheAir(options: Omit<ListOptions, 'region'> = {}): Promise<PagedResponse<TVSummary>> {
    return this.#transport.get('/tv/on_the_air', {
      query: tvListQuery(this.#transport, options),
    })
  }

  details<TAppend extends TMDBObject = TMDBObject>(
    seriesId: number,
    options: TVDetailsOptions = {},
  ): Promise<TVDetails & TAppend> {
    return this.#transport.get(`/tv/${toId(seriesId, 'seriesId')}`, {
      query: withLanguage(this.#transport.defaults, {
        append_to_response: toCommaList(options.appendToResponse),
        language: options.language,
      }),
    })
  }

  credits(seriesId: number, options: LanguageOptions = {}): Promise<CreditsResponse> {
    return this.#transport.get(`/tv/${toId(seriesId, 'seriesId')}/credits`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
      }),
    })
  }

  images(seriesId: number, options: ImageQueryOptions = {}): Promise<ImagesResponse> {
    return this.#transport.get(`/tv/${toId(seriesId, 'seriesId')}/images`, {
      query: withLanguage(this.#transport.defaults, {
        include_image_language: toCommaList(options.includeImageLanguage),
        language: options.language,
      }),
    })
  }

  recommendations(seriesId: number, options: Omit<ListOptions, 'region'> = {}): Promise<PagedResponse<TVSummary>> {
    return this.#transport.get(`/tv/${toId(seriesId, 'seriesId')}/recommendations`, {
      query: tvListQuery(this.#transport, options),
    })
  }

  similar(seriesId: number, options: Omit<ListOptions, 'region'> = {}): Promise<PagedResponse<TVSummary>> {
    return this.#transport.get(`/tv/${toId(seriesId, 'seriesId')}/similar`, {
      query: tvListQuery(this.#transport, options),
    })
  }

  videos(seriesId: number, options: LanguageOptions = {}): Promise<VideosResponse> {
    return this.#transport.get(`/tv/${toId(seriesId, 'seriesId')}/videos`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
      }),
    })
  }
}

function tvListQuery(
  transport: TMDBTransport,
  options: Omit<ListOptions, 'region'>,
): QueryParams {
  return withLanguage(transport.defaults, {
    language: options.language,
    page: options.page,
  })
}
