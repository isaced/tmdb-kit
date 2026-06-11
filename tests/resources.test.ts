import { describe, expect, it } from 'vitest'
import { createTMDB, TMDBRequestError } from '../src'
import { createMockFetch, paged } from './helpers'

describe('resource methods', () => {
  it('maps movie endpoints and append/image options', async () => {
    const mock = createMockFetch(
      { body: { id: 550 } },
      { body: { cast: [], crew: [], id: 550 } },
      { body: { id: 550, results: [] } },
      { body: { backdrops: [], id: 550, posters: [] } },
      { body: paged([]) },
      { body: paged([]) },
      { body: paged([]) },
      { body: paged([]) },
      { body: paged([]) },
    )
    const tmdb = createTMDB({ accessToken: 'token', fetch: mock.fetch })

    await tmdb.movies.details(550, {
      appendToResponse: ['credits', 'videos'],
      language: 'en-US',
    })
    await tmdb.movies.credits(550)
    await tmdb.movies.videos(550, { language: 'fr-FR' })
    await tmdb.movies.images(550, {
      includeImageLanguage: ['en', 'null'],
    })
    await tmdb.movies.recommendations(550, { page: 2 })
    await tmdb.movies.similar(550, { region: 'US' })
    await tmdb.movies.topRated()
    await tmdb.movies.nowPlaying()
    await tmdb.movies.upcoming()

    expect(mock.calls.map((call) => call.url.pathname)).toEqual([
      '/3/movie/550',
      '/3/movie/550/credits',
      '/3/movie/550/videos',
      '/3/movie/550/images',
      '/3/movie/550/recommendations',
      '/3/movie/550/similar',
      '/3/movie/top_rated',
      '/3/movie/now_playing',
      '/3/movie/upcoming',
    ])
    expect(mock.calls[0]?.url.searchParams.get('append_to_response')).toBe('credits,videos')
    expect(mock.calls[0]?.url.searchParams.get('language')).toBe('en-US')
    expect(mock.calls[2]?.url.searchParams.get('language')).toBe('fr-FR')
    expect(mock.calls[3]?.url.searchParams.get('include_image_language')).toBe('en,null')
    expect(mock.calls[4]?.url.searchParams.get('page')).toBe('2')
    expect(mock.calls[5]?.url.searchParams.get('region')).toBe('US')
  })

  it('maps tv endpoints with the same resource shape as movies', async () => {
    const mock = createMockFetch(
      { body: paged([]) },
      { body: paged([]) },
      { body: paged([]) },
      { body: paged([]) },
      { body: { id: 1399 } },
      { body: { cast: [], crew: [], id: 1399 } },
      { body: { backdrops: [], id: 1399, posters: [] } },
      { body: paged([]) },
      { body: paged([]) },
      { body: { id: 1399, results: [] } },
    )
    const tmdb = createTMDB({
      accessToken: 'token',
      defaultLanguage: 'zh-CN',
      fetch: mock.fetch,
    })

    await tmdb.tv.popular()
    await tmdb.tv.topRated({ page: 4 })
    await tmdb.tv.airingToday()
    await tmdb.tv.onTheAir()
    await tmdb.tv.details(1399, { appendToResponse: 'credits' })
    await tmdb.tv.credits(1399)
    await tmdb.tv.images(1399, { includeImageLanguage: 'en,null' })
    await tmdb.tv.recommendations(1399)
    await tmdb.tv.similar(1399)
    await tmdb.tv.videos(1399, { language: 'en-US' })

    expect(mock.calls.map((call) => call.url.pathname)).toEqual([
      '/3/tv/popular',
      '/3/tv/top_rated',
      '/3/tv/airing_today',
      '/3/tv/on_the_air',
      '/3/tv/1399',
      '/3/tv/1399/credits',
      '/3/tv/1399/images',
      '/3/tv/1399/recommendations',
      '/3/tv/1399/similar',
      '/3/tv/1399/videos',
    ])
    expect(mock.calls[0]?.url.searchParams.get('language')).toBe('zh-CN')
    expect(mock.calls[1]?.url.searchParams.get('page')).toBe('4')
    expect(mock.calls[4]?.url.searchParams.get('append_to_response')).toBe('credits')
    expect(mock.calls[9]?.url.searchParams.get('language')).toBe('en-US')
  })

  it('maps search endpoints and keeps search query validation close to the call', async () => {
    const mock = createMockFetch(
      { body: paged([]) },
      { body: paged([]) },
      { body: paged([]) },
    )
    const tmdb = createTMDB({ accessToken: 'token', fetch: mock.fetch })

    await tmdb.search.tv('Dark', {
      firstAirDateYear: 2017,
      includeAdult: true,
      page: 2,
      year: 2017,
    })
    await tmdb.search.multi('Tom Hardy', { includeAdult: false })
    await tmdb.search.people('Sofia Coppola')

    expect(mock.calls.map((call) => call.url.pathname)).toEqual([
      '/3/search/tv',
      '/3/search/multi',
      '/3/search/person',
    ])
    expect(mock.calls[0]?.url.searchParams.get('first_air_date_year')).toBe('2017')
    expect(mock.calls[0]?.url.searchParams.get('include_adult')).toBe('true')
    expect(mock.calls[0]?.url.searchParams.get('page')).toBe('2')
    expect(mock.calls[1]?.url.searchParams.get('query')).toBe('Tom Hardy')
    expect(mock.calls[1]?.url.searchParams.get('include_adult')).toBe('false')
    expect(() => tmdb.search.multi('  ')).toThrow(TMDBRequestError)
  })

  it('maps trending, people, genres, and configuration endpoints', async () => {
    const mock = createMockFetch(
      { body: paged([]) },
      { body: paged([]) },
      { body: paged([]) },
      { body: paged([]) },
      { body: paged([]) },
      { body: { id: 31 } },
      { body: { genres: [] } },
      { body: { genres: [] } },
      { body: { change_keys: [], images: { secure_base_url: '', base_url: '', backdrop_sizes: [], logo_sizes: [], poster_sizes: [], profile_sizes: [], still_sizes: [] } } },
      { body: [] },
      { body: [] },
      { body: [] },
      { body: [] },
      { body: [] },
    )
    const tmdb = createTMDB({ accessToken: 'token', fetch: mock.fetch })

    await tmdb.trending.all('week', { language: 'en-US' })
    await tmdb.trending.movies()
    await tmdb.trending.tv('day')
    await tmdb.trending.people('week')
    await tmdb.people.popular({ page: 5 })
    await tmdb.people.details(31, { language: 'ja-JP' })
    await tmdb.genres.movies()
    await tmdb.genres.tv({ language: 'de-DE' })
    await tmdb.configuration.details()
    await tmdb.configuration.countries()
    await tmdb.configuration.jobs()
    await tmdb.configuration.languages()
    await tmdb.configuration.primaryTranslations()
    await tmdb.configuration.timezones()

    expect(mock.calls.map((call) => call.url.pathname)).toEqual([
      '/3/trending/all/week',
      '/3/trending/movie/day',
      '/3/trending/tv/day',
      '/3/trending/person/week',
      '/3/person/popular',
      '/3/person/31',
      '/3/genre/movie/list',
      '/3/genre/tv/list',
      '/3/configuration',
      '/3/configuration/countries',
      '/3/configuration/jobs',
      '/3/configuration/languages',
      '/3/configuration/primary_translations',
      '/3/configuration/timezones',
    ])
    expect(mock.calls[0]?.url.searchParams.get('language')).toBe('en-US')
    expect(mock.calls[4]?.url.searchParams.get('page')).toBe('5')
    expect(mock.calls[5]?.url.searchParams.get('language')).toBe('ja-JP')
    expect(mock.calls[7]?.url.searchParams.get('language')).toBe('de-DE')
    expect(() => tmdb.trending.all('month' as never)).toThrow(TMDBRequestError)
    expect(() => tmdb.people.details(0)).toThrow('personId must be a positive integer')
  })
})
