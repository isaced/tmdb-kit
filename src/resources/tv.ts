import type { TMDBTransport } from '../http'
import {
  toCommaList,
  toGroupId,
  toId,
  toSeasonNumber,
  withLanguage,
  type QueryParams,
} from '../query'
import type {
  AggregateCreditsResponse,
  CreditsResponse,
  EpisodeDetails,
  EpisodeDetailsOptions,
  EpisodeGroupDetails,
  EpisodeGroupsResponse,
  ImageQueryOptions,
  ImagesResponse,
  LanguageOptions,
  ListOptions,
  PagedResponse,
  SeasonImagesResponse,
  TMDBObject,
  TVDetails,
  TVDetailsOptions,
  TVSeasonDetails,
  TVSeasonDetailsOptions,
  TVSummary,
  VideosResponse,
} from '../types'

/**
 * Access TMDB TV show endpoints (popular, top-rated, details, seasons, etc.).
 *
 * Obtained via `client.tv`.
 */
export class TVResource {
  readonly #transport: TMDBTransport

  constructor(transport: TMDBTransport) {
    this.#transport = transport
  }

  popular(options: Omit<ListOptions, 'region'> = {}): Promise<PagedResponse<TVSummary>> {
    return this.#transport.get('/tv/popular', {
      query: tvListQuery(this.#transport, options),
      signal: options.signal,
    })
  }

  topRated(options: Omit<ListOptions, 'region'> = {}): Promise<PagedResponse<TVSummary>> {
    return this.#transport.get('/tv/top_rated', {
      query: tvListQuery(this.#transport, options),
      signal: options.signal,
    })
  }

  airingToday(options: Omit<ListOptions, 'region'> = {}): Promise<PagedResponse<TVSummary>> {
    return this.#transport.get('/tv/airing_today', {
      query: tvListQuery(this.#transport, options),
      signal: options.signal,
    })
  }

  onTheAir(options: Omit<ListOptions, 'region'> = {}): Promise<PagedResponse<TVSummary>> {
    return this.#transport.get('/tv/on_the_air', {
      query: tvListQuery(this.#transport, options),
      signal: options.signal,
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
      signal: options.signal,
    })
  }

  credits(seriesId: number, options: LanguageOptions = {}): Promise<CreditsResponse> {
    return this.#transport.get(`/tv/${toId(seriesId, 'seriesId')}/credits`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
      }),
      signal: options.signal,
    })
  }

  images(seriesId: number, options: ImageQueryOptions = {}): Promise<ImagesResponse> {
    return this.#transport.get(`/tv/${toId(seriesId, 'seriesId')}/images`, {
      query: withLanguage(this.#transport.defaults, {
        include_image_language: toCommaList(options.includeImageLanguage),
        language: options.language,
      }),
      signal: options.signal,
    })
  }

  recommendations(
    seriesId: number,
    options: Omit<ListOptions, 'region'> = {},
  ): Promise<PagedResponse<TVSummary>> {
    return this.#transport.get(`/tv/${toId(seriesId, 'seriesId')}/recommendations`, {
      query: tvListQuery(this.#transport, options),
      signal: options.signal,
    })
  }

  similar(
    seriesId: number,
    options: Omit<ListOptions, 'region'> = {},
  ): Promise<PagedResponse<TVSummary>> {
    return this.#transport.get(`/tv/${toId(seriesId, 'seriesId')}/similar`, {
      query: tvListQuery(this.#transport, options),
      signal: options.signal,
    })
  }

  videos(seriesId: number, options: LanguageOptions = {}): Promise<VideosResponse> {
    return this.#transport.get(`/tv/${toId(seriesId, 'seriesId')}/videos`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
      }),
      signal: options.signal,
    })
  }

  seasonDetails<TAppend extends TMDBObject = TMDBObject>(
    seriesId: number,
    seasonNumber: number,
    options: TVSeasonDetailsOptions = {},
  ): Promise<TVSeasonDetails & TAppend> {
    return this.#transport.get(
      `/tv/${toId(seriesId, 'seriesId')}/season/${toSeasonNumber(seasonNumber)}`,
      {
        query: withLanguage(this.#transport.defaults, {
          append_to_response: toCommaList(options.appendToResponse),
          language: options.language,
        }),
        signal: options.signal,
      },
    )
  }

  seasonCredits(
    seriesId: number,
    seasonNumber: number,
    options: LanguageOptions = {},
  ): Promise<CreditsResponse> {
    return this.#transport.get(
      `/tv/${toId(seriesId, 'seriesId')}/season/${toSeasonNumber(seasonNumber)}/credits`,
      {
        query: withLanguage(this.#transport.defaults, {
          language: options.language,
        }),
        signal: options.signal,
      },
    )
  }

  seasonAggregateCredits(
    seriesId: number,
    seasonNumber: number,
    options: LanguageOptions = {},
  ): Promise<AggregateCreditsResponse> {
    return this.#transport.get(
      `/tv/${toId(seriesId, 'seriesId')}/season/${toSeasonNumber(seasonNumber)}/aggregate_credits`,
      {
        query: withLanguage(this.#transport.defaults, {
          language: options.language,
        }),
        signal: options.signal,
      },
    )
  }

  seasonImages(
    seriesId: number,
    seasonNumber: number,
    options: ImageQueryOptions = {},
  ): Promise<SeasonImagesResponse> {
    return this.#transport.get(
      `/tv/${toId(seriesId, 'seriesId')}/season/${toSeasonNumber(seasonNumber)}/images`,
      {
        query: withLanguage(this.#transport.defaults, {
          include_image_language: toCommaList(options.includeImageLanguage),
          language: options.language,
        }),
        signal: options.signal,
      },
    )
  }

  seasonVideos(
    seriesId: number,
    seasonNumber: number,
    options: LanguageOptions = {},
  ): Promise<VideosResponse> {
    return this.#transport.get(
      `/tv/${toId(seriesId, 'seriesId')}/season/${toSeasonNumber(seasonNumber)}/videos`,
      {
        query: withLanguage(this.#transport.defaults, {
          language: options.language,
        }),
        signal: options.signal,
      },
    )
  }

  episodeDetails<TAppend extends TMDBObject = TMDBObject>(
    seriesId: number,
    seasonNumber: number,
    episodeNumber: number,
    options: EpisodeDetailsOptions = {},
  ): Promise<EpisodeDetails & TAppend> {
    return this.#transport.get(
      `/tv/${toId(seriesId, 'seriesId')}/season/${toSeasonNumber(seasonNumber)}/episode/${toId(episodeNumber, 'episodeNumber')}`,
      {
        query: withLanguage(this.#transport.defaults, {
          append_to_response: toCommaList(options.appendToResponse),
          language: options.language,
        }),
        signal: options.signal,
      },
    )
  }

  aggregateCredits(
    seriesId: number,
    options: LanguageOptions = {},
  ): Promise<AggregateCreditsResponse> {
    return this.#transport.get(`/tv/${toId(seriesId, 'seriesId')}/aggregate_credits`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
      }),
      signal: options.signal,
    })
  }

  episodeGroups(seriesId: number, options: LanguageOptions = {}): Promise<EpisodeGroupsResponse> {
    return this.#transport.get(`/tv/${toId(seriesId, 'seriesId')}/episode_groups`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
      }),
      signal: options.signal,
    })
  }

  episodeGroup(groupId: string, options: LanguageOptions = {}): Promise<EpisodeGroupDetails> {
    return this.#transport.get(`/tv/episode_group/${toGroupId(groupId)}`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
      }),
      signal: options.signal,
    })
  }
}

/** Build query parameters for TV list endpoints. */
function tvListQuery(transport: TMDBTransport, options: Omit<ListOptions, 'region'>): QueryParams {
  return withLanguage(transport.defaults, {
    language: options.language,
    page: options.page,
  })
}
