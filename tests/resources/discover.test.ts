import { describe, it } from 'bun:test'
import { createTMDB } from '../../src'
import { expectNoQuery, expectRequest } from '../_support/assertions'
import { createFetchMock } from '../_support/fetch'
import { paged } from '../_support/fixtures'

describe('DiscoverResource', () => {
  it('maps movie filters, dotted keys, and list defaults', async () => {
    const mock = createFetchMock({ body: paged() })
    const tmdb = createTMDB({
      accessToken: 'read-token',
      defaultLanguage: 'zh-CN',
      defaultRegion: 'CN',
      fetch: mock.fetch,
    })

    await tmdb.discover.movies({
      sortBy: 'vote_average.desc',
      page: 2,
      includeAdult: true,
      voteAverageGte: 7.5,
      voteAverageLte: 9,
      voteCountGte: 100,
      voteCountLte: 10000,
      runtimeGte: 90,
      runtimeLte: 180,
      withGenres: [28, 12],
      withoutGenres: '35|99',
      withKeywords: 9715,
      withCompanies: [420, 33],
      withOriginCountry: ['US', 'GB'],
      withOriginalLanguage: 'en',
      withWatchProviders: [8, 9],
      watchRegion: 'US',
      withWatchMonetizationTypes: ['flatrate', 'rent'],
      region: 'US',
      year: 2024,
      primaryReleaseYear: 2024,
      primaryReleaseDateGte: '2024-01-01',
      primaryReleaseDateLte: '2024-12-31',
      releaseDateGte: '2024-01-01',
      releaseDateLte: '2024-12-31',
      withPeople: 287,
      withCast: [287, 819],
      withCrew: 525,
      withReleaseType: [2, 3],
    })

    expectRequest(mock.calls[0]!, {
      path: '/3/discover/movie',
      query: {
        language: 'zh-CN',
        region: 'US',
        page: '2',
        sort_by: 'vote_average.desc',
        include_adult: 'true',
        'vote_average.gte': '7.5',
        'vote_average.lte': '9',
        'vote_count.gte': '100',
        'vote_count.lte': '10000',
        'with_runtime.gte': '90',
        'with_runtime.lte': '180',
        with_genres: '28,12',
        without_genres: '35|99',
        with_keywords: '9715',
        with_companies: '420,33',
        with_origin_country: 'US,GB',
        with_original_language: 'en',
        with_watch_providers: '8,9',
        watch_region: 'US',
        with_watch_monetization_types: 'flatrate,rent',
        year: '2024',
        primary_release_year: '2024',
        'primary_release_date.gte': '2024-01-01',
        'primary_release_date.lte': '2024-12-31',
        'release_date.gte': '2024-01-01',
        'release_date.lte': '2024-12-31',
        with_people: '287',
        with_cast: '287,819',
        with_crew: '525',
        with_release_type: '2,3',
      },
    })
  })

  it('inherits the default region and omits unset filters', async () => {
    const mock = createFetchMock({ body: paged() })
    const tmdb = createTMDB({
      accessToken: 'read-token',
      defaultLanguage: 'en-US',
      defaultRegion: 'CN',
      fetch: mock.fetch,
    })

    await tmdb.discover.movies()

    expectRequest(mock.calls[0]!, {
      path: '/3/discover/movie',
      query: { language: 'en-US', region: 'CN' },
    })
    expectNoQuery(
      mock.calls[0]!,
      'sort_by',
      'with_genres',
      'watch_region',
      'include_adult',
      'with_people',
    )
  })

  it('maps TV filters without a region parameter', async () => {
    const mock = createFetchMock({ body: paged() })
    const tmdb = createTMDB({
      accessToken: 'read-token',
      defaultLanguage: 'en-US',
      defaultRegion: 'CN',
      fetch: mock.fetch,
    })

    await tmdb.discover.tv({
      sortBy: 'first_air_date.desc',
      firstAirDateYear: 2020,
      firstAirDateGte: '2020-01-01',
      firstAirDateLte: '2020-12-31',
      airDateGte: '2020-01-01',
      airDateLte: '2020-12-31',
      withNetworks: 49,
      withStatus: 0,
      withType: 4,
    })

    expectRequest(mock.calls[0]!, {
      path: '/3/discover/tv',
      query: {
        language: 'en-US',
        sort_by: 'first_air_date.desc',
        first_air_date_year: '2020',
        'first_air_date.gte': '2020-01-01',
        'first_air_date.lte': '2020-12-31',
        'air_date.gte': '2020-01-01',
        'air_date.lte': '2020-12-31',
        with_networks: '49',
        with_status: '0',
        with_type: '4',
      },
    })
    expectNoQuery(mock.calls[0]!, 'region')
  })

  it('does not inherit defaultRegion as watch_region', async () => {
    const mock = createFetchMock({ body: paged() })
    const tmdb = createTMDB({
      accessToken: 'read-token',
      defaultRegion: 'CN',
      fetch: mock.fetch,
    })

    await tmdb.discover.movies({ withWatchProviders: 8 })

    expectNoQuery(mock.calls[0]!, 'watch_region')
  })
})
