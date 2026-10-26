import type {
  AggregateCreditsResponse,
  CollectionDetails,
  CollectionTranslationsResponse,
  CreditsResponse,
  EpisodeDetails,
  EpisodeGroupDetails,
  EpisodeGroupsResponse,
  ExternalIds,
  FindResponse,
  GenresResponse,
  ImageItem,
  ImagesResponse,
  MovieDetails,
  MovieSummary,
  PagedResponse,
  PersonCombinedCreditsResponse,
  PersonDetails,
  SearchMultiResult,
  SeasonImagesResponse,
  TVDetails,
  TVSeasonDetails,
  TVSummary,
  VideosResponse,
  WatchProviderListResponse,
  WatchProvidersResponse,
} from '../../src'

export function pagedResponse<T>(
  results: T[],
  overrides: Partial<PagedResponse<T>> = {},
): PagedResponse<T> {
  return {
    page: 1,
    results,
    total_pages: 1,
    total_results: results.length,
    ...overrides,
  }
}

export function movieSummary(overrides: Partial<MovieSummary> = {}): MovieSummary {
  return {
    adult: false,
    backdrop_path: null,
    genre_ids: [878],
    id: 1,
    original_language: 'en',
    original_title: 'Dune: Part Two',
    overview: 'Paul Atreides unites with Chani.',
    popularity: 100,
    poster_path: '/poster.jpg',
    release_date: '2024-02-27',
    title: 'Dune: Part Two',
    video: false,
    vote_average: 8.2,
    vote_count: 100,
    ...overrides,
  }
}

export function movieDetails(overrides: Partial<MovieDetails> = {}): MovieDetails {
  return {
    id: 693134,
    title: 'Dune: Part Two',
    original_title: 'Dune: Part Two (Original)',
    release_date: '2024-02-27',
    vote_average: 8.2,
    vote_count: 5432,
    overview: 'Paul Atreides unites with Chani.',
    poster_path: '/poster.jpg',
    backdrop_path: '/backdrop.jpg',
    adult: false,
    original_language: 'en',
    popularity: 1234,
    video: false,
    status: 'Released',
    runtime: 166,
    genres: [
      { id: 878, name: 'Science Fiction' },
      { id: 12, name: 'Adventure' },
    ],
    homepage: 'https://www.dunemovie.com',
    tagline: 'Long live the fighters.',
    belongs_to_collection: null,
    budget: 190000000,
    imdb_id: 'tt15239678',
    production_companies: [],
    production_countries: [],
    revenue: 714000000,
    spoken_languages: [],
    ...overrides,
  }
}

export function tvSummary(overrides: Partial<TVSummary> = {}): TVSummary {
  return {
    adult: false,
    backdrop_path: null,
    first_air_date: '2011-04-17',
    genre_ids: [18],
    id: 1399,
    name: 'Game of Thrones',
    origin_country: ['US'],
    original_language: 'en',
    original_name: 'Game of Thrones',
    overview: 'Trouble is brewing in the Seven Kingdoms.',
    popularity: 100,
    poster_path: '/poster.jpg',
    vote_average: 8.4,
    vote_count: 100,
    ...overrides,
  }
}

export function tvDetails(overrides: Partial<TVDetails> = {}): TVDetails {
  return {
    id: 1399,
    name: 'Game of Thrones',
    original_name: 'Game of Thrones',
    overview: 'Trouble is brewing in the Seven Kingdoms.',
    first_air_date: '2011-04-17',
    backdrop_path: '/backdrop.jpg',
    poster_path: '/poster.jpg',
    vote_average: 8.4,
    vote_count: 20000,
    popularity: 100,
    origin_country: ['US'],
    original_language: 'en',
    adult: false,
    created_by: [
      { id: 1, credit_id: 'creator-1', name: 'David Benioff', gender: 2, profile_path: null },
    ],
    episode_run_time: [60],
    genres: [{ id: 18, name: 'Drama' }],
    homepage: 'https://www.hbo.com/game-of-thrones',
    in_production: false,
    languages: ['en'],
    last_air_date: '2019-05-19',
    networks: [{ id: 49, logo_path: null, name: 'HBO', origin_country: 'US' }],
    number_of_episodes: 73,
    number_of_seasons: 8,
    production_companies: [],
    production_countries: [],
    seasons: [
      {
        air_date: '2011-04-17',
        episode_count: 10,
        id: 1,
        name: 'Season 1',
        overview: '',
        poster_path: null,
        season_number: 1,
        vote_average: 8.3,
      },
    ],
    spoken_languages: [],
    status: 'Ended',
    tagline: 'Winter is coming.',
    type: 'Scripted',
    ...overrides,
  }
}

export function personDetails(overrides: Partial<PersonDetails> = {}): PersonDetails {
  return {
    adult: false,
    gender: 2,
    id: 31,
    known_for_department: 'Acting',
    name: 'Tom Hanks',
    original_name: 'Tom Hanks',
    popularity: 100,
    profile_path: '/profile.jpg',
    also_known_as: [],
    biography: 'A prolific actor.',
    birthday: '1956-07-09',
    deathday: null,
    homepage: null,
    imdb_id: 'nm0000158',
    place_of_birth: 'Concord, California, USA',
    ...overrides,
  }
}

export function creditsResponse(overrides: Partial<CreditsResponse> = {}): CreditsResponse {
  return {
    id: 1,
    cast: [
      {
        adult: false,
        cast_id: 1,
        character: 'Paul Atreides',
        credit_id: 'cast-1',
        gender: 2,
        id: 1,
        known_for_department: 'Acting',
        name: 'Timothée Chalamet',
        order: 0,
        original_name: 'Timothée Chalamet',
        popularity: 100,
        profile_path: '/profile.jpg',
      },
    ],
    crew: [
      {
        adult: false,
        credit_id: 'crew-1',
        department: 'Directing',
        gender: 2,
        id: 2,
        job: 'Director',
        known_for_department: 'Directing',
        name: 'Denis Villeneuve',
        original_name: 'Denis Villeneuve',
        popularity: 100,
        profile_path: null,
      },
    ],
    ...overrides,
  }
}

export function imagesResponse(overrides: Partial<ImagesResponse> = {}): ImagesResponse {
  return {
    id: 1,
    posters: [image('/poster.jpg', 1000, 1500)],
    backdrops: [image('/backdrop.jpg', 1920, 1080)],
    logos: [image('/logo.png', 500, 200)],
    ...overrides,
  }
}

export function videosResponse(overrides: Partial<VideosResponse> = {}): VideosResponse {
  return {
    id: 1,
    results: [
      {
        id: 'video-1',
        iso_3166_1: 'US',
        iso_639_1: 'en',
        key: 'dQw4w9WgXcQ',
        name: 'Official Trailer',
        official: true,
        published_at: '2024-01-01T00:00:00.000Z',
        site: 'YouTube',
        size: 1080,
        type: 'Trailer',
      },
      {
        id: 'video-2',
        iso_3166_1: 'US',
        iso_639_1: 'en',
        key: 'vimeo-key',
        name: 'Featurette',
        official: false,
        published_at: '2024-01-02T00:00:00.000Z',
        site: 'Vimeo',
        size: 1080,
        type: 'Featurette',
      },
    ],
    ...overrides,
  }
}

export function seasonDetails(overrides: Partial<TVSeasonDetails> = {}): TVSeasonDetails {
  return {
    _id: 'season-1',
    air_date: '2011-04-17',
    episodes: [
      {
        air_date: '2011-04-17',
        crew: [],
        episode_number: 1,
        episode_type: 'standard',
        guest_stars: [],
        id: 10,
        name: 'Winter Is Coming',
        overview: 'Eddard Stark is...',
        production_code: '101',
        runtime: 62,
        season_number: 1,
        show_id: 1399,
        still_path: '/still.jpg',
        vote_average: 7.9,
        vote_count: 350,
      },
    ],
    id: 1,
    name: 'Season 1',
    overview: 'Trouble is brewing in the Seven Kingdoms.',
    poster_path: '/season.jpg',
    season_number: 1,
    vote_average: 8.3,
    ...overrides,
  }
}

export function episodeDetails(overrides: Partial<EpisodeDetails> = {}): EpisodeDetails {
  return {
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
    still_path: '/still.jpg',
    vote_average: 7.9,
    vote_count: 350,
    ...overrides,
  }
}

export function aggregateCreditsResponse(
  overrides: Partial<AggregateCreditsResponse> = {},
): AggregateCreditsResponse {
  return {
    id: 1399,
    cast: [
      {
        adult: false,
        gender: 1,
        id: 1223786,
        known_for_department: 'Acting',
        name: 'Emilia Clarke',
        order: 0,
        original_name: 'Emilia Clarke',
        popularity: 100,
        profile_path: '/emilia.jpg',
        roles: [
          { credit_id: 'role-1', character: 'Daenerys Targaryen', episode_count: 10 },
          { credit_id: 'role-2', character: 'Dany', episode_count: 2 },
        ],
        total_episode_count: 12,
      },
    ],
    crew: [
      {
        adult: false,
        department: 'Writing',
        gender: 2,
        id: 9813,
        jobs: [
          { credit_id: 'job-1', job: 'Writer', episode_count: 8 },
          { credit_id: 'job-2', job: 'Director', episode_count: 2 },
        ],
        known_for_department: 'Writing',
        name: 'David Benioff',
        original_name: 'David Benioff',
        popularity: 50,
        profile_path: null,
        total_episode_count: 10,
      },
    ],
    ...overrides,
  }
}

export function seasonImagesResponse(
  overrides: Partial<SeasonImagesResponse> = {},
): SeasonImagesResponse {
  return {
    id: 3624,
    posters: [image('/season.jpg', 1000, 1500)],
    ...overrides,
  }
}

export function episodeGroupsResponse(
  overrides: Partial<EpisodeGroupsResponse> = {},
): EpisodeGroupsResponse {
  return {
    id: 1399,
    results: [
      {
        description: 'Alternate ordering',
        episode_count: 10,
        group_count: 1,
        id: 'group-1',
        name: 'Story Arc',
        network: null,
        type: 4,
      },
    ],
    ...overrides,
  }
}

export function episodeGroupDetails(
  overrides: Partial<EpisodeGroupDetails> = {},
): EpisodeGroupDetails {
  return {
    description: 'Alternate ordering',
    episode_count: 1,
    group_count: 1,
    groups: [
      {
        id: 'section-1',
        name: 'Season 1',
        order: 1,
        locked: true,
        episodes: [
          {
            air_date: '2011-04-17',
            episode_number: 1,
            episode_type: 'standard',
            id: 63056,
            name: 'Winter Is Coming',
            order: 1,
            overview: 'Eddard Stark is...',
            production_code: '101',
            runtime: 62,
            season_number: 1,
            show_id: 1399,
            still_path: '/still.jpg',
            vote_average: 7.9,
            vote_count: 350,
          },
        ],
      },
    ],
    id: 'group-1',
    name: 'Story Arc',
    network: null,
    type: 4,
    ...overrides,
  }
}

export function combinedCreditsResponse(
  overrides: Partial<PersonCombinedCreditsResponse> = {},
): PersonCombinedCreditsResponse {
  return {
    id: 31,
    cast: [
      {
        ...movieBase(1, 'Dune: Part Two', '2024-02-27'),
        character: 'Paul Atreides',
        credit_id: 'cast-1',
        media_type: 'movie',
      },
      {
        ...tvBase(2, 'Dark', '2017-12-01'),
        character: 'Jonas Kahnwald',
        credit_id: 'cast-2',
        episode_count: 26,
        media_type: 'tv',
      },
      {
        ...movieBase(3, 'Forrest Gump', '1994-07-06'),
        character: 'Forrest Gump',
        credit_id: 'cast-3',
        media_type: 'movie',
      },
    ],
    crew: [
      {
        ...movieBase(1, 'Dune: Part Two', '2024-02-27'),
        credit_id: 'crew-1',
        department: 'Directing',
        job: 'Director',
        media_type: 'movie',
      },
      {
        ...tvBase(2, 'Dark', '2017-12-01'),
        credit_id: 'crew-2',
        department: 'Writing',
        job: 'Writer',
        media_type: 'tv',
      },
    ],
    ...overrides,
  }
}

export function genresResponse(overrides: Partial<GenresResponse> = {}): GenresResponse {
  return {
    genres: [
      { id: 28, name: 'Action' },
      { id: 35, name: 'Comedy' },
    ],
    ...overrides,
  }
}

export const multiSearchResponse = {
  page: 1,
  total_pages: 2,
  total_results: 3,
  results: [
    {
      id: 1,
      title: 'Dune: Part Two',
      release_date: '2024-02-27',
      vote_average: 8.2,
      media_type: 'movie',
    },
    {
      id: 2,
      name: 'Dark',
      first_air_date: '2017-12-01',
      vote_average: 8.4,
      media_type: 'tv',
    },
    {
      id: 3,
      name: 'Tom Hardy',
      media_type: 'person',
    },
  ] as SearchMultiResult[],
}

export function externalIds(overrides: Partial<ExternalIds> = {}): ExternalIds {
  return {
    id: 550,
    imdb_id: 'tt0137523',
    tvdb_id: null,
    ...overrides,
  }
}

export function findResponse(overrides: Partial<FindResponse> = {}): FindResponse {
  return {
    movie_results: [
      {
        ...movieSummary({ id: 550, title: 'Fight Club' }),
        media_type: 'movie' as const,
      },
    ],
    person_results: [],
    tv_episode_results: [],
    tv_results: [],
    tv_season_results: [],
    ...overrides,
  }
}

export function watchProvidersResponse(
  overrides: Partial<WatchProvidersResponse> = {},
): WatchProvidersResponse {
  return {
    id: 550,
    results: {
      GB: {
        link: 'https://www.themoviedb.org/movie/550/watch?locale=GB',
        flatrate: [
          {
            display_priority: 0,
            logo_path: '/netflix.jpg',
            provider_id: 8,
            provider_name: 'Netflix',
          },
        ],
      },
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
    ...overrides,
  }
}

export function watchProviderListResponse(
  overrides: Partial<WatchProviderListResponse> = {},
): WatchProviderListResponse {
  return {
    results: [
      {
        display_priority: 0,
        display_priorities: { GB: 1, US: 0 },
        logo_path: '/netflix.jpg',
        provider_id: 8,
        provider_name: 'Netflix',
      },
      {
        display_priority: 1,
        display_priorities: { GB: 0, US: 1 },
        logo_path: '/prime.jpg',
        provider_id: 9,
        provider_name: 'Prime Video',
      },
    ],
    ...overrides,
  }
}

export function collectionDetails(overrides: Partial<CollectionDetails> = {}): CollectionDetails {
  return {
    backdrop_path: '/collection-backdrop.jpg',
    id: 10,
    name: 'Star Wars Collection',
    original_language: 'en',
    original_name: 'Star Wars Collection',
    overview: 'The Star Wars saga.',
    parts: [
      movieSummary({
        id: 11,
        original_title: 'Star Wars',
        release_date: '1977-05-25',
        title: 'Star Wars',
      }),
      movieSummary({
        id: 12,
        original_title: 'The Empire Strikes Back',
        release_date: '1980-05-21',
        title: 'The Empire Strikes Back',
      }),
    ],
    poster_path: '/collection-poster.jpg',
    ...overrides,
  }
}

export function collectionTranslationsResponse(
  overrides: Partial<CollectionTranslationsResponse> = {},
): CollectionTranslationsResponse {
  return {
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
    ...overrides,
  }
}

function image(filePath: string, width: number, height: number): ImageItem {
  return {
    aspect_ratio: width / height,
    file_path: filePath,
    height,
    iso_639_1: 'en',
    vote_average: 1,
    vote_count: 2,
    width,
  }
}

function movieBase(id: number, title: string, date: string): MovieSummary {
  return {
    adult: false,
    backdrop_path: null,
    genre_ids: [],
    id,
    original_language: 'en',
    original_title: title,
    overview: '',
    popularity: 1,
    poster_path: null,
    release_date: date,
    title,
    video: false,
    vote_average: 8,
    vote_count: 10,
  }
}

function tvBase(id: number, name: string, date: string): TVSummary {
  return {
    adult: false,
    backdrop_path: null,
    first_air_date: date,
    genre_ids: [18],
    id,
    name,
    origin_country: ['US'],
    original_language: 'en',
    original_name: name,
    overview: '',
    popularity: 1,
    poster_path: null,
    vote_average: 8,
    vote_count: 10,
  }
}
