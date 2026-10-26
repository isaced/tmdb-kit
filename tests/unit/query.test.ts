import { describe, expect, it } from 'bun:test'
import { TMDBRequestError } from '../../src'
import {
  appendQuery,
  buildImageUrl,
  normalizeBaseUrl,
  toCommaList,
  toEpisodeNumber,
  toExternalId,
  toGroupId,
  toId,
  toSearchQuery,
  toSeasonNumber,
  toTimeWindow,
  withLanguage,
  withListDefaults,
} from '../../src/query'

describe('query utilities', () => {
  it('serializes primitives and arrays while dropping nullish values', () => {
    const url = new URL('https://api.example.test/search')

    appendQuery(url, {
      empty: null,
      include_adult: false,
      page: 2,
      query: 'Dune',
      skip: undefined,
      with_genres: [28, 12],
    })

    expect(url.searchParams.get('query')).toBe('Dune')
    expect(url.searchParams.get('page')).toBe('2')
    expect(url.searchParams.get('include_adult')).toBe('false')
    expect(url.searchParams.get('with_genres')).toBe('28,12')
    expect(url.searchParams.has('empty')).toBe(false)
    expect(url.searchParams.has('skip')).toBe(false)
  })

  it('applies language and region defaults without overwriting explicit values', () => {
    expect(withLanguage({ language: 'zh-CN' }, { page: 1 })).toEqual({
      language: 'zh-CN',
      page: 1,
    })
    expect(withLanguage({ language: 'zh-CN' }, { language: 'en-US' })).toEqual({
      language: 'en-US',
    })
    expect(withListDefaults({ language: 'zh-CN', region: 'CN' }, { page: 3 })).toEqual({
      language: 'zh-CN',
      page: 3,
      region: 'CN',
    })
    expect(withListDefaults({ language: 'zh-CN', region: 'CN' }, { region: 'US' })).toEqual({
      language: 'zh-CN',
      region: 'US',
    })
  })

  it('formats comma lists for TMDB append/include parameters', () => {
    expect(toCommaList(undefined)).toBeUndefined()
    expect(toCommaList('credits,videos')).toBe('credits,videos')
    expect(toCommaList(['credits', 'videos'])).toBe('credits,videos')
  })

  it('validates path ids at the SDK boundary', () => {
    expect(toId(550, 'movieId')).toBe('550')
    expect(() => toId(0, 'movieId')).toThrow(TMDBRequestError)
    expect(() => toId(1.5, 'movieId')).toThrow('movieId must be a positive integer')
  })

  it('validates season numbers and group ids for TV paths', () => {
    expect(toSeasonNumber(0)).toBe('0')
    expect(toSeasonNumber(3)).toBe('3')

    for (const value of [-1, 1.5, Number.NaN]) {
      expect(() => toSeasonNumber(value), String(value)).toThrow(
        'seasonNumber must be a non-negative integer',
      )
    }

    expect(toGroupId('abc123')).toBe('abc123')
    expect(toGroupId(' group-1 ')).toBe('group-1')

    for (const value of ['', '   ', '../admin', 'a/b']) {
      expect(() => toGroupId(value), value).toThrow('groupId must be a non-empty identifier')
    }
  })

  it('validates and encodes external IDs and episode numbers', () => {
    expect(toExternalId(' tt0137523 ')).toBe('tt0137523')
    expect(toExternalId('a/b?c#d')).toBe('a%2Fb%3Fc%23d')
    expect(() => toExternalId('   ')).toThrow('externalId must not be empty')

    expect(toEpisodeNumber(0)).toBe('0')
    expect(toEpisodeNumber(3)).toBe('3')

    for (const value of [-1, 1.5, Number.NaN]) {
      expect(() => toEpisodeNumber(value), String(value)).toThrow(
        'episodeNumber must be a non-negative integer',
      )
    }
  })

  it('normalizes search queries and trending windows', () => {
    expect(toSearchQuery('  Dune  ')).toBe('Dune')
    expect(() => toSearchQuery('   ')).toThrow('search query must not be empty')
    expect(toTimeWindow('day')).toBe('day')
    expect(toTimeWindow('week')).toBe('week')
    expect(() => toTimeWindow('month' as never)).toThrow(
      'timeWindow must be either "day" or "week"',
    )
  })

  it('builds image URLs without forcing callers to branch on null paths', () => {
    expect(normalizeBaseUrl('https://images.example/t/p///')).toBe('https://images.example/t/p')
    expect(buildImageUrl('/poster.jpg', 'w500')).toBe('https://image.tmdb.org/t/p/w500/poster.jpg')
    expect(buildImageUrl('poster.jpg')).toBe('https://image.tmdb.org/t/p/original/poster.jpg')
    expect(buildImageUrl('/profile.png', 'h632', { baseUrl: 'https://images.example/t/p/' })).toBe(
      'https://images.example/t/p/h632/profile.png',
    )
    expect(buildImageUrl(null, 'w342')).toBeNull()
    expect(buildImageUrl(undefined, 'w342')).toBeNull()
    expect(buildImageUrl('   ', 'w342')).toBeNull()
  })

  it('runs buildImageUrl through a transform callback so callers can route via proxies or CDNs', () => {
    const proxy = (url: string) =>
      url.replace('https://image.tmdb.org/t/p', 'https://img-proxy.example/tmdb')

    expect(buildImageUrl('/poster.jpg', 'w500', { transform: proxy })).toBe(
      'https://img-proxy.example/tmdb/w500/poster.jpg',
    )

    // Transform must not run for nullish inputs — the contract is still "return null".
    expect(buildImageUrl(null, 'w500', { transform: proxy })).toBeNull()

    // Transform must be invoked with the fully-resolved URL (size + path included).
    const observed: string[] = []
    buildImageUrl('/x.jpg', 'original', {
      transform: (url) => {
        observed.push(url)
        return url
      },
    })
    expect(observed).toEqual(['https://image.tmdb.org/t/p/original/x.jpg'])
  })
})
