import type {
  AggregateCreditsResponse,
  CollectionDetails,
  CollectionTranslationsResponse,
  Configuration,
  CreditsResponse,
  EpisodeDetails,
  EpisodeGroupDetails,
  EpisodeGroupsResponse,
  ExternalIds,
  FindResponse,
  GenresResponse,
  ImagesResponse,
  MovieSummary,
  PagedResponse,
  PersonCombinedCreditsResponse,
  SeasonImagesResponse,
  TVSeasonDetails,
  VideosResponse,
  WatchProviderListResponse,
  WatchProvidersResponse,
} from '../../src'

export function paged<T>(results: T[] = []): PagedResponse<T> {
  return {
    page: 1,
    results,
    total_pages: 1,
    total_results: results.length,
  }
}

export const movieDetails = {
  id: 550,
  title: 'Fight Club',
}

export const tvDetails = {
  id: 1399,
  name: 'Game of Thrones',
}

export const personDetails = {
  id: 31,
  name: 'Tom Hanks',
}

export const combinedCreditsResponse: PersonCombinedCreditsResponse = {
  cast: [],
  crew: [],
  id: 31,
}

export const creditsResponse: CreditsResponse = {
  cast: [],
  crew: [],
  id: 550,
}

export const videosResponse: VideosResponse = {
  id: 550,
  results: [],
}

export const imagesResponse: ImagesResponse = {
  backdrops: [],
  id: 550,
  posters: [],
}

export const genresResponse: GenresResponse = {
  genres: [],
}

export const configurationResponse: Configuration = {
  change_keys: [],
  images: {
    backdrop_sizes: [],
    base_url: 'http://image.tmdb.org/t/p/',
    logo_sizes: [],
    poster_sizes: [],
    profile_sizes: [],
    secure_base_url: 'https://image.tmdb.org/t/p/',
    still_sizes: [],
  },
}

export const seasonDetails: TVSeasonDetails = {
  _id: '5256c89f19c2956ff6046d47',
  air_date: '2011-04-17',
  episodes: [
    {
      air_date: '2011-04-17',
      crew: [],
      episode_number: 1,
      episode_type: 'standard',
      guest_stars: [],
      id: 63056,
      name: 'Winter Is Coming',
      overview: 'Eddard Stark is...',
      production_code: '101',
      runtime: 62,
      season_number: 1,
      show_id: 1399,
      still_path: '/xY0qPqYrmC8alSSsBG8A5N4G1B.jpg',
      vote_average: 7.9,
      vote_count: 350,
    },
  ],
  id: 3624,
  name: 'Season 1',
  overview: 'Trouble is brewing in the Seven Kingdoms of Westeros.',
  poster_path: '/kMTkQkQnFmHmBYyBz5dTFaXGkZg.jpg',
  season_number: 1,
  vote_average: 8.3,
}

export const episodeDetails: EpisodeDetails = seasonDetails.episodes[0]!

export const aggregateCreditsResponse: AggregateCreditsResponse = {
  cast: [],
  crew: [],
  id: 1399,
}

export const seasonImagesResponse: SeasonImagesResponse = {
  id: 3624,
  posters: [],
}

export const episodeGroupsResponse: EpisodeGroupsResponse = {
  id: 1399,
  results: [],
}

export const episodeGroupDetails: EpisodeGroupDetails = {
  description: '',
  episode_count: 0,
  group_count: 0,
  groups: [],
  id: 'group-1',
  name: 'Episode Group',
  network: null,
  type: 1,
}

const movieSummaryBase: MovieSummary = {
  adult: false,
  backdrop_path: null,
  genre_ids: [18],
  id: 550,
  original_language: 'en',
  original_title: 'Fight Club',
  overview: '',
  popularity: 1,
  poster_path: null,
  release_date: '1999-10-15',
  title: 'Fight Club',
  video: false,
  vote_average: 8.4,
  vote_count: 100,
}

export const externalIdsResponse: ExternalIds = {
  id: 550,
  imdb_id: 'tt0137523',
  tvdb_id: null,
}

export const findResponse: FindResponse = {
  movie_results: [{ ...movieSummaryBase, media_type: 'movie' }],
  person_results: [],
  tv_episode_results: [],
  tv_results: [],
  tv_season_results: [],
}

export const watchProvidersResponse: WatchProvidersResponse = {
  id: 550,
  results: {
    US: {
      link: 'https://www.themoviedb.org/movie/550/watch?locale=US',
      flatrate: [
        {
          display_priority: 0,
          logo_path: '/netflix.jpg',
          provider_id: 8,
          provider_name: 'Netflix',
        },
      ],
      rent: [
        {
          display_priority: 1,
          logo_path: null,
          provider_id: 2,
          provider_name: 'Apple TV',
        },
      ],
    },
  },
}

export const watchProviderListResponse: WatchProviderListResponse = {
  results: [
    {
      display_priority: 0,
      display_priorities: { US: 0, GB: 1 },
      logo_path: '/netflix.jpg',
      provider_id: 8,
      provider_name: 'Netflix',
    },
  ],
}

export const collectionDetails: CollectionDetails = {
  backdrop_path: '/collection-backdrop.jpg',
  id: 10,
  name: 'Star Wars Collection',
  original_language: 'en',
  original_name: 'Star Wars Collection',
  overview: 'The Star Wars saga.',
  parts: [
    {
      ...movieSummaryBase,
      id: 11,
      media_type: 'movie',
      original_title: 'Star Wars',
      release_date: '1977-05-25',
      title: 'Star Wars',
    },
  ],
  poster_path: '/collection-poster.jpg',
}

export const collectionTranslationsResponse: CollectionTranslationsResponse = {
  id: 10,
  translations: [
    {
      data: {
        homepage: '',
        overview: 'Die Star-Wars-Saga.',
        title: 'Star Wars Collection',
      },
      english_name: 'German',
      iso_3166_1: 'DE',
      iso_639_1: 'de',
      name: 'Deutsch',
    },
  ],
}
