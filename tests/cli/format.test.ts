import { afterEach, describe, expect, it, vi } from 'bun:test'
import { createTMDB, type PersonCombinedCast, type SearchMultiResult } from '../../src'
import {
  printAggregateCredits,
  printCredits,
  printEpisode,
  printEpisodeGroup,
  printEpisodeGroups,
  printGenres,
  printImages,
  printJson,
  printMovie,
  printPerson,
  printPersonCredits,
  printSearchResults,
  printSeason,
  printSeasonImages,
  printTV,
  printVideos,
} from '../../src/cli/format'
import {
  aggregateCreditsResponse,
  combinedCreditsResponse,
  creditsResponse,
  episodeDetails,
  episodeGroupDetails,
  episodeGroupsResponse,
  genresResponse,
  imagesResponse,
  movieDetails,
  personDetails,
  seasonDetails,
  seasonImagesResponse,
  tvDetails,
  videosResponse,
} from './fixtures'
import { captureOutput } from './helpers'

describe('CLI output formatting', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('prints pretty JSON', () => {
    const output = captureOutput()
    printJson({ page: 1, results: [] })

    expect(output.stdout()).toBe('{\n  "page": 1,\n  "results": []\n}\n')
  })

  it('prints an empty search response', () => {
    const output = captureOutput()
    printSearchResults({ page: 1, total_pages: 0, total_results: 0, results: [] }, 'all')

    expect(output.stdout()).toContain('Page 1/0 · 0 results')
    expect(output.stdout()).toContain('No results.')
  })

  it('formats movie, TV, and person search results', () => {
    const output = captureOutput()
    const results = [
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
    ] as SearchMultiResult[]

    printSearchResults({ page: 1, total_pages: 2, total_results: 3, results }, 'all')

    expect(output.stdout()).toContain(' 1. Dune: Part Two (2024)  ★ 8.2  movie  1')
    expect(output.stdout()).toContain(' 2. Dark (2017)  ★ 8.4  tv  2')
    expect(output.stdout()).toContain(' 3. Tom Hardy  person  3')
  })

  it('falls back to the requested type and hides zero scores', () => {
    const output = captureOutput()
    const results = [
      {
        id: 4,
        title: 'Unknown',
        release_date: '',
        vote_average: 0,
      },
    ] as SearchMultiResult[]

    printSearchResults({ page: 1, total_pages: 1, total_results: 1, results }, 'movie')

    expect(output.stdout()).toContain(' 1. Unknown  movie  4')
    expect(output.stdout()).not.toContain('★')
  })

  it('prints detailed movie information and image URLs', () => {
    const output = captureOutput()
    const tmdb = createTMDB({ accessToken: 'token' })

    printMovie(movieDetails(), tmdb)

    expect(output.stdout()).toContain('Dune: Part Two (2024)')
    expect(output.stdout()).toContain('Original title: Dune: Part Two (Original)')
    expect(output.stdout()).toContain('Long live the fighters.')
    expect(output.stdout()).toContain('Released · 166 min · ★ 8.2/10 (5432 votes)')
    expect(output.stdout()).toContain('Genres: Science Fiction, Adventure')
    expect(output.stdout()).toContain('https://www.themoviedb.org/movie/693134')
    expect(output.stdout()).toContain('Poster: https://image.tmdb.org/t/p/w500/poster.jpg')
    expect(output.stdout()).toContain('Backdrop: https://image.tmdb.org/t/p/w780/backdrop.jpg')
    expect(output.stdout()).toContain('Homepage: https://www.dunemovie.com')
    expect(output.stdout()).toContain('Paul Atreides unites with Chani.')
  })

  it('omits optional movie fields when they are empty', () => {
    const output = captureOutput()
    const tmdb = createTMDB({ accessToken: 'token' })

    printMovie(
      movieDetails({
        original_title: 'Dune: Part Two',
        tagline: null,
        status: '',
        runtime: null,
        vote_average: 0,
        genres: [],
        homepage: null,
        overview: '',
        poster_path: null,
        backdrop_path: null,
      }),
      tmdb,
    )

    expect(output.stdout()).not.toContain('Original title:')
    expect(output.stdout()).not.toContain('Poster:')
    expect(output.stdout()).not.toContain('Backdrop:')
    expect(output.stdout()).not.toContain('Homepage:')
    expect(output.stdout()).not.toContain('min')
    expect(output.stdout()).toContain('★ 0.0/10')
  })

  it('prints TV details and seasons', () => {
    const output = captureOutput()
    const tmdb = createTMDB({ accessToken: 'token' })

    printTV(tvDetails(), tmdb)

    expect(output.stdout()).toContain('Game of Thrones (2011)')
    expect(output.stdout()).toContain('Winter is coming.')
    expect(output.stdout()).toContain('Ended · 8 seasons · 73 episodes · ★ 8.4/10 (20000 votes)')
    expect(output.stdout()).toContain('Genres: Drama')
    expect(output.stdout()).toContain('Networks: HBO')
    expect(output.stdout()).toContain('Created by: David Benioff')
    expect(output.stdout()).toContain('https://www.themoviedb.org/tv/1399')
    expect(output.stdout()).toContain('Poster: https://image.tmdb.org/t/p/w500/poster.jpg')
    expect(output.stdout()).toContain('Backdrop: https://image.tmdb.org/t/p/w780/backdrop.jpg')
    expect(output.stdout()).toContain('Homepage: https://www.hbo.com/game-of-thrones')
    expect(output.stdout()).toContain('  1. Season 1 (2011) · 10 episodes')
  })

  it('prints a TV original name when it differs', () => {
    const output = captureOutput()
    const tmdb = createTMDB({ accessToken: 'token' })

    printTV(tvDetails({ original_name: 'Game of Thrones (Original)' }), tmdb)

    expect(output.stdout()).toContain('Original name: Game of Thrones (Original)')
  })

  it('omits optional TV fields when they are empty', () => {
    const output = captureOutput()
    const tmdb = createTMDB({ accessToken: 'token' })

    printTV(
      tvDetails({
        original_name: 'Game of Thrones',
        tagline: null,
        genres: [],
        networks: [],
        created_by: [],
        poster_path: null,
        backdrop_path: null,
        homepage: '',
        overview: '',
        seasons: [],
      }),
      tmdb,
    )

    expect(output.stdout()).not.toContain('Original name:')
    expect(output.stdout()).not.toContain('Genres:')
    expect(output.stdout()).not.toContain('Networks:')
    expect(output.stdout()).not.toContain('Created by:')
    expect(output.stdout()).not.toContain('Poster:')
    expect(output.stdout()).not.toContain('Backdrop:')
    expect(output.stdout()).not.toContain('Homepage:')
    expect(output.stdout()).not.toContain('Seasons:')
  })

  it('prints credits and respects the limit', () => {
    const output = captureOutput()
    printCredits(creditsResponse(), 1)

    expect(output.stdout()).toContain('Cast:')
    expect(output.stdout()).toContain('Timothée Chalamet as Paul Atreides  #1')
    expect(output.stdout()).toContain('Crew:')
    expect(output.stdout()).toContain('Denis Villeneuve — Director (Directing)  #2')
  })

  it('prints an empty credits message', () => {
    const output = captureOutput()
    printCredits(creditsResponse({ cast: [], crew: [] }))

    expect(output.stdout()).toBe('No credits.\n')
  })

  it('prints image URLs for posters, backdrops, and logos', () => {
    const output = captureOutput()
    const tmdb = createTMDB({ accessToken: 'token' })

    printImages(imagesResponse(), tmdb)

    expect(output.stdout()).toContain(
      'Posters:\n  https://image.tmdb.org/t/p/w500/poster.jpg  (1000x1500)',
    )
    expect(output.stdout()).toContain(
      'Backdrops:\n  https://image.tmdb.org/t/p/w780/backdrop.jpg  (1920x1080)',
    )
    expect(output.stdout()).toContain(
      'Logos:\n  https://image.tmdb.org/t/p/w300/logo.png  (500x200)',
    )
  })

  it('prints an empty images message and tolerates missing logos', () => {
    const output = captureOutput()
    const tmdb = createTMDB({ accessToken: 'token' })

    printImages(imagesResponse({ logos: undefined }), tmdb)
    expect(output.stdout()).not.toContain('Logos:')

    const empty = captureOutput()
    printImages(imagesResponse({ posters: [], backdrops: [], logos: [] }), tmdb)
    expect(empty.stdout()).toBe('No images.\n')
  })

  it('prints YouTube and non-YouTube videos', () => {
    const output = captureOutput()
    printVideos(videosResponse())

    expect(output.stdout()).toContain(
      'Trailer: Official Trailer  https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    )
    expect(output.stdout()).toContain('Featurette: Featurette  vimeo-key')
  })

  it('prints an empty videos message', () => {
    const output = captureOutput()
    printVideos(videosResponse({ results: [] }))

    expect(output.stdout()).toBe('No videos.\n')
  })

  it('prints a season and its episodes', () => {
    const output = captureOutput()
    const tmdb = createTMDB({ accessToken: 'token' })

    printSeason(seasonDetails(), tmdb)

    expect(output.stdout()).toContain('Season 1 (2011)')
    expect(output.stdout()).toContain('Episodes: 1 · ★ 8.3/10')
    expect(output.stdout()).toContain('Trouble is brewing')
    expect(output.stdout()).toContain('Poster: https://image.tmdb.org/t/p/w500/season.jpg')
    expect(output.stdout()).toContain('E01  Winter Is Coming 2011-04-17 · 62 min  ★ 7.9  #10')
  })

  it('prints an empty season', () => {
    const output = captureOutput()
    const tmdb = createTMDB({ accessToken: 'token' })

    printSeason(seasonDetails({ episodes: [], overview: '', poster_path: null }), tmdb)

    expect(output.stdout()).toContain('Episodes: 0')
    expect(output.stdout()).not.toContain('E01')
    expect(output.stdout()).not.toContain('Poster:')
  })

  it('prints an episode with air date, still, and overview', () => {
    const output = captureOutput()
    const tmdb = createTMDB({ accessToken: 'token' })

    printEpisode(episodeDetails(), tmdb)

    expect(output.stdout()).toContain('S01E01 · Winter Is Coming')
    expect(output.stdout()).toContain('2011-04-17 · 62 min · ★ 7.9/10 (350 votes)')
    expect(output.stdout()).toContain('TMDB: https://www.themoviedb.org/tv/1399/season/1/episode/1')
    expect(output.stdout()).toContain('Still: https://image.tmdb.org/t/p/w300/still.jpg')
    expect(output.stdout()).toContain('Eddard Stark is...')
  })

  it('omits optional episode fields when they are empty', () => {
    const output = captureOutput()
    const tmdb = createTMDB({ accessToken: 'token' })

    printEpisode(
      episodeDetails({ air_date: null, runtime: null, still_path: null, overview: '' }),
      tmdb,
    )

    expect(output.stdout()).not.toContain('62 min')
    expect(output.stdout()).not.toContain('Still:')
    expect(output.stdout()).not.toContain('Eddard Stark')
    expect(output.stdout()).toContain('★ 7.9/10')
  })

  it('prints aggregate credits with multiple roles and jobs', () => {
    const output = captureOutput()
    printAggregateCredits(aggregateCreditsResponse(), 1)

    expect(output.stdout()).toContain('Cast:')
    expect(output.stdout()).toContain(
      'Emilia Clarke as Daenerys Targaryen (10 eps), Dany (2 eps)  #1223786',
    )
    expect(output.stdout()).toContain('Crew:')
    expect(output.stdout()).toContain(
      'David Benioff — Writer (8 eps), Director (2 eps) (Writing)  #9813',
    )
  })

  it('prints an empty aggregate credits message', () => {
    const output = captureOutput()
    printAggregateCredits(aggregateCreditsResponse({ cast: [], crew: [] }))

    expect(output.stdout()).toBe('No credits.\n')
  })

  it('prints season poster images', () => {
    const output = captureOutput()
    const tmdb = createTMDB({ accessToken: 'token' })

    printSeasonImages(seasonImagesResponse(), tmdb)

    expect(output.stdout()).toContain(
      'Posters:\n  https://image.tmdb.org/t/p/w500/season.jpg  (1000x1500)',
    )

    const empty = captureOutput()
    printSeasonImages(seasonImagesResponse({ posters: [] }), tmdb)
    expect(empty.stdout()).toBe('No images.\n')
  })

  it('prints episode groups and empty results', () => {
    const output = captureOutput()
    printEpisodeGroups(episodeGroupsResponse())

    expect(output.stdout()).toBe('group-1  Story Arc  (1 groups, 10 episodes)\n')

    const empty = captureOutput()
    printEpisodeGroups(episodeGroupsResponse({ results: [] }))
    expect(empty.stdout()).toBe('No episode groups.\n')
  })

  it('prints episode group sections and episodes', () => {
    const output = captureOutput()
    printEpisodeGroup(episodeGroupDetails())

    expect(output.stdout()).toContain('Story Arc')
    expect(output.stdout()).toContain('Alternate ordering')
    expect(output.stdout()).toContain('Season 1')
    expect(output.stdout()).toContain('  1. S01E01 · Winter Is Coming  #63056')
  })

  it('prints an empty episode group message', () => {
    const output = captureOutput()
    printEpisodeGroup(episodeGroupDetails({ description: '', groups: [] }))

    expect(output.stdout()).toBe('Story Arc\n\nNo episodes.\n')
  })

  it('prints person details', () => {
    const output = captureOutput()
    const tmdb = createTMDB({ accessToken: 'token' })

    printPerson(personDetails({ homepage: 'https://tomhanks.com' }), tmdb)

    expect(output.stdout()).toContain('Tom Hanks')
    expect(output.stdout()).toContain('Homepage: https://tomhanks.com')
    expect(output.stdout()).toContain('Acting · Born: 1956-07-09')
    expect(output.stdout()).toContain('From: Concord, California, USA')
    expect(output.stdout()).toContain('https://www.themoviedb.org/person/31')
    expect(output.stdout()).toContain('Profile: https://image.tmdb.org/t/p/h632/profile.jpg')
    expect(output.stdout()).toContain('IMDb: https://www.imdb.com/name/nm0000158')
    expect(output.stdout()).toContain('A prolific actor.')
  })

  it('omits optional person fields when they are empty', () => {
    const output = captureOutput()
    const tmdb = createTMDB({ accessToken: 'token' })

    printPerson(
      personDetails({
        birthday: null,
        deathday: null,
        place_of_birth: null,
        profile_path: null,
        homepage: null,
        imdb_id: null,
        biography: '',
      }),
      tmdb,
    )

    expect(output.stdout()).toContain('Acting')
    expect(output.stdout()).not.toContain('Born:')
    expect(output.stdout()).not.toContain('From:')
    expect(output.stdout()).not.toContain('Profile:')
    expect(output.stdout()).not.toContain('IMDb:')
  })

  it('prints combined cast and crew credits sorted by date', () => {
    const output = captureOutput()
    printPersonCredits(combinedCreditsResponse(), 2)

    expect(output.stdout()).toContain('Cast:')
    expect(output.stdout()).toContain(' 2024  Dune: Part Two as Paul Atreides  (movie, 1)')
    expect(output.stdout()).toContain(' 2017  Dark as Jonas Kahnwald · 26 eps  (tv, 2)')
    expect(output.stdout()).not.toContain('Forrest Gump')
    expect(output.stdout()).toContain('Crew:')
    expect(output.stdout()).toContain(' 2024  Dune: Part Two — Director (Directing)  (movie, 1)')
  })

  it('prints unknown credit dates and empty combined credits', () => {
    const output = captureOutput()
    const credits = combinedCreditsResponse()
    const first = credits.cast[0] as PersonCombinedCast
    credits.cast = [{ ...first, release_date: '' } as PersonCombinedCast]
    credits.crew = []

    printPersonCredits(credits)

    expect(output.stdout()).toContain('----  Dune: Part Two as Paul Atreides')

    const empty = captureOutput()
    printPersonCredits(combinedCreditsResponse({ cast: [], crew: [] }))
    expect(empty.stdout()).toBe('No credits.\n')
  })

  it('prints genres', () => {
    const output = captureOutput()
    printGenres(genresResponse())

    expect(output.stdout()).toBe('28  Action\n35  Comedy\n')
  })

  it('prints an empty genres message', () => {
    const output = captureOutput()
    printGenres(genresResponse({ genres: [] }))

    expect(output.stdout()).toBe('No genres.\n')
  })
})
