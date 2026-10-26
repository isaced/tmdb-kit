import { describe, expect, it } from 'bun:test'
import {
  createTMDB,
  isMovie,
  isMovieSearchResult,
  isPerson,
  isPersonSearchResult,
  isTV,
  isTVSearchResult,
} from '../../src'
import { expectPaths, expectRequest } from '../_support/assertions'
import { paged } from '../_support/fixtures'
import { createFetchMock } from '../_support/fetch'

describe('SearchResource', () => {
  it('maps movie search options to TMDB query parameters', async () => {
    const mock = createFetchMock({ body: paged() })
    const tmdb = createTMDB({
      accessToken: 'read-token',
      defaultLanguage: 'zh-CN',
      defaultRegion: 'CN',
      fetch: mock.fetch,
    })

    await tmdb.search.movies('  Dune  ', {
      includeAdult: false,
      page: 3,
      primaryReleaseYear: 2021,
      region: 'US',
      year: 2021,
    })

    expectRequest(mock.lastCall(), {
      path: '/3/search/movie',
      query: {
        include_adult: 'false',
        language: 'zh-CN',
        page: '3',
        primary_release_year: '2021',
        query: 'Dune',
        region: 'US',
        year: '2021',
      },
    })
  })

  it('maps tv, people, and multi search endpoints', async () => {
    const mock = createFetchMock({ body: paged() }, { body: paged() }, { body: paged() })
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    await tmdb.search.tv('Dark', {
      firstAirDateYear: 2017,
      includeAdult: true,
      page: 2,
      year: 2017,
    })
    await tmdb.search.people('Sofia Coppola', { includeAdult: false })
    await tmdb.search.multi('Tom Hardy')

    expectPaths(mock.calls, ['/3/search/tv', '/3/search/person', '/3/search/multi'])
    expectRequest(mock.calls[0]!, {
      path: '/3/search/tv',
      query: {
        first_air_date_year: '2017',
        include_adult: 'true',
        page: '2',
        query: 'Dark',
        year: '2017',
      },
    })
    expectRequest(mock.calls[1]!, {
      path: '/3/search/person',
      query: {
        include_adult: 'false',
        query: 'Sofia Coppola',
      },
    })
    expectRequest(mock.calls[2]!, {
      path: '/3/search/multi',
      query: {
        query: 'Tom Hardy',
      },
    })
  })

  it('rejects empty queries before a request is made', async () => {
    const mock = createFetchMock()
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    expect(() => tmdb.search.movies('   ')).toThrow('search query must not be empty')
    await expect(tmdb.search.multi('\n\t')).rejects.toThrow('search query must not be empty')
    expect(mock.calls).toHaveLength(0)
  })

  it('filters out excluded media types from search.multi() results', async () => {
    const mock = createFetchMock({
      body: {
        page: 1,
        results: [
          { id: 1, media_type: 'movie', title: 'Inception' },
          { id: 2, media_type: 'tv', name: 'Dark' },
          { id: 3, media_type: 'person', name: 'Tom Hardy' },
          { id: 4, media_type: 'movie', title: 'Dune' },
        ],
        total_pages: 1,
        total_results: 4,
      },
    })
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    // Only one request is made regardless of the exclude option.
    const filtered = await tmdb.search.multi('Inception', { exclude: ['person'] })

    expect(mock.calls).toHaveLength(1)
    expect(mock.lastCall().url.pathname).toBe('/3/search/multi')
    expect(filtered.results.map((r) => r.media_type)).toEqual(['movie', 'tv', 'movie'])
    expect(filtered.total_results).toBe(4)
  })

  it('keeps search.multi() total_results aligned with the unfiltered payload', async () => {
    // The exclude option is client-side; the reported totals are not
    // adjusted. Callers can still compute their own filtered count via
    // `results.length` if they need it.
    const mock = createFetchMock({
      body: {
        page: 1,
        results: [
          { id: 1, media_type: 'person', name: 'Tom Hardy' },
          { id: 2, media_type: 'person', name: 'Tom Holland' },
        ],
        total_pages: 1,
        total_results: 2,
      },
    })
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    const filtered = await tmdb.search.multi('Tom', { exclude: ['person'] })

    expect(filtered.results).toEqual([])
    expect(filtered.total_results).toBe(2)
  })

  it('passes through search.multi() results unchanged when exclude is empty or omitted', async () => {
    const mock = createFetchMock(
      {
        body: {
          page: 1,
          results: [
            { id: 1, media_type: 'person', name: 'Tom Hardy' },
            { id: 2, media_type: 'movie', title: 'Mad Max' },
          ],
          total_pages: 1,
          total_results: 2,
        },
      },
      {
        body: {
          page: 1,
          results: [
            { id: 1, media_type: 'person', name: 'Tom Hardy' },
            { id: 2, media_type: 'movie', title: 'Mad Max' },
          ],
          total_pages: 1,
          total_results: 2,
        },
      },
    )
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    const omitted = await tmdb.search.multi('Tom')
    const empty = await tmdb.search.multi('Tom', { exclude: [] })

    expect(omitted.results).toHaveLength(2)
    expect(empty.results).toHaveLength(2)
  })
})

describe('search type guards', () => {
  // Minimal fixtures — the guards only read `media_type`. Cast to the union
  // so TS does not require every MovieSummary / TVSummary / PersonSummary
  // field. The runtime behavior is what we are asserting here.
  const movie = {
    id: 1,
    media_type: 'movie' as const,
    title: 'Inception',
  } as unknown as Parameters<typeof isMovieSearchResult>[0]
  const tv = { id: 2, media_type: 'tv' as const, name: 'Dark' } as unknown as Parameters<
    typeof isTVSearchResult
  >[0]
  const person = {
    id: 3,
    media_type: 'person' as const,
    name: 'Tom Hardy',
  } as unknown as Parameters<typeof isPersonSearchResult>[0]

  // The short-name guards (isMovie/isTV/isPerson) accept the same
  // SearchMultiResult union as the long-name variants, so the same
  // fixtures apply.
  const asMulti = (value: unknown) => value as Parameters<typeof isMovie>[0]

  it('narrows a multi-search payload to a movie', () => {
    const results = [movie, tv, person]
    const narrowed = results.filter(isMovieSearchResult)

    // Type assertion: every narrowed entry is MovieMultiResult.
    expect(narrowed.map((r) => r.title)).toEqual(['Inception'])
  })

  it('narrows a multi-search payload to TV and person entries', () => {
    const results = [movie, tv, person]
    expect(results.filter(isTVSearchResult).map((r) => r.name)).toEqual(['Dark'])
    expect(results.filter(isPersonSearchResult).map((r) => r.name)).toEqual(['Tom Hardy'])
  })

  it('short-name guards (isMovie / isTV / isPerson) accept the same union', () => {
    const results = [asMulti(movie), asMulti(tv), asMulti(person)]
    expect(results.filter(isMovie).map((r) => r.title)).toEqual(['Inception'])
    expect(results.filter(isTV).map((r) => r.name)).toEqual(['Dark'])
    expect(results.filter(isPerson).map((r) => r.name)).toEqual(['Tom Hardy'])
  })

  it('guards return false for non-matching media types and malformed inputs', () => {
    expect(isMovieSearchResult(asMulti(tv))).toBe(false)
    expect(isTVSearchResult(asMulti(movie))).toBe(false)
    expect(isPersonSearchResult(asMulti(movie))).toBe(false)
    expect(isMovieSearchResult(null)).toBe(false)
    expect(isTVSearchResult(undefined)).toBe(false)
    expect(isPersonSearchResult('person')).toBe(false)
    expect(isPersonSearchResult({})).toBe(false)
  })
})
