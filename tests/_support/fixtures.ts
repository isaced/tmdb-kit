import type {
  Configuration,
  CreditsResponse,
  GenresResponse,
  ImagesResponse,
  PagedResponse,
  PersonCombinedCreditsResponse,
  TVSeasonDetails,
  VideosResponse,
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
