import { describe, expect, it } from 'bun:test'
import { CliError } from '../../src/cli/errors'
import {
  parseCommaList,
  parseExternalId,
  parseExternalSource,
  parseGenreType,
  parseGroupId,
  parseId,
  parseIdFilter,
  parseInteger,
  parseLimit,
  parseMovieListCategory,
  parseMovieSortBy,
  parseNumber,
  parsePage,
  parseSearchType,
  parseSeasonNumber,
  parseTVListCategory,
  parseTVSortBy,
  parseWatchMonetizationTypes,
  parseWindow,
} from '../../src/cli/options'

describe('CLI option parsing', () => {
  it('accepts every supported search type', () => {
    expect(parseSearchType('all')).toBe('all')
    expect(parseSearchType('movie')).toBe('movie')
    expect(parseSearchType('tv')).toBe('tv')
    expect(parseSearchType('person')).toBe('person')
  })

  it('rejects unknown search types with a usage exit code', () => {
    expect.assertions(2)

    try {
      parseSearchType('collection')
    } catch (error) {
      expect(error).toBeInstanceOf(CliError)
      expect((error as CliError).exitCode).toBe(2)
    }
  })

  it('normalizes missing page values to page 1', () => {
    expect(parsePage(undefined)).toBe(1)
    expect(parsePage('')).toBe(1)
    expect(parsePage('3')).toBe(3)
  })

  it('rejects invalid page values', () => {
    for (const value of ['0', '-1', '1.5', 'abc']) {
      expect(() => parsePage(value), value).toThrowError(CliError)
    }
  })

  it('parses positive numeric IDs', () => {
    expect(parseId('693134', 'movie ID')).toBe(693134)
  })

  it('rejects invalid numeric IDs', () => {
    for (const value of ['0', '-1', '1.5', 'abc']) {
      expect(() => parseId(value, 'movie ID'), value).toThrowError(CliError)
    }
  })

  it('parses season numbers including specials', () => {
    expect(parseSeasonNumber('0')).toBe(0)
    expect(parseSeasonNumber('3')).toBe(3)

    for (const value of ['-1', '1.5', 'abc']) {
      expect(() => parseSeasonNumber(value), value).toThrowError(CliError)
    }
  })

  it('parses episode group IDs', () => {
    expect(parseGroupId('group-1')).toBe('group-1')
    expect(parseGroupId(' abc123 ')).toBe('abc123')

    for (const value of ['', '   ', '../admin']) {
      expect(() => parseGroupId(value), value).toThrowError(CliError)
    }
  })

  it('parses limits with a default', () => {
    expect(parseLimit(undefined)).toBe(10)
    expect(parseLimit('')).toBe(10)
    expect(parseLimit('5')).toBe(5)
    expect(parseLimit(undefined, 3)).toBe(3)

    for (const value of ['0', '-1', '1.5', 'abc']) {
      expect(() => parseLimit(value), value).toThrowError(CliError)
    }
  })

  it('parses comma-separated lists', () => {
    expect(parseCommaList(undefined)).toBeUndefined()
    expect(parseCommaList(' , ')).toBeUndefined()
    expect(parseCommaList('en, null , zh')).toEqual(['en', 'null', 'zh'])
  })

  it('parses trending windows', () => {
    expect(parseWindow('day')).toBe('day')
    expect(parseWindow('week')).toBe('week')
    expect(() => parseWindow('month')).toThrowError(CliError)
  })

  it('parses genre list types', () => {
    expect(parseGenreType('movie')).toBe('movie')
    expect(parseGenreType('tv')).toBe('tv')
    expect(() => parseGenreType('person')).toThrowError(CliError)
  })

  it('parses movie list categories', () => {
    for (const value of ['popular', 'top-rated', 'now-playing', 'upcoming'] as const) {
      expect(parseMovieListCategory(value)).toBe(value)
    }
    expect(() => parseMovieListCategory('airing-today')).toThrowError(CliError)
  })

  it('parses TV list categories', () => {
    for (const value of ['popular', 'top-rated', 'airing-today', 'on-the-air'] as const) {
      expect(parseTVListCategory(value)).toBe(value)
    }
    expect(() => parseTVListCategory('upcoming')).toThrowError(CliError)
  })

  it('parses external ID sources and values', () => {
    expect(parseExternalSource('imdb_id')).toBe('imdb_id')
    expect(parseExternalSource('tvdb_id')).toBe('tvdb_id')
    expect(() => parseExternalSource('not-a-source')).toThrowError(CliError)

    expect(parseExternalId(' tt0137523 ')).toBe('tt0137523')
    expect(() => parseExternalId('   ')).toThrowError(CliError)
  })

  it('parses watch monetization types', () => {
    expect(parseWatchMonetizationTypes(undefined)).toBeUndefined()
    expect(parseWatchMonetizationTypes(' , ')).toBeUndefined()
    expect(parseWatchMonetizationTypes('flatrate, rent')).toEqual(['flatrate', 'rent'])
    expect(() => parseWatchMonetizationTypes('flatrate,nope')).toThrowError(CliError)
  })

  it('parses discover sort values', () => {
    expect(parseMovieSortBy(undefined)).toBeUndefined()
    expect(parseMovieSortBy('popularity.desc')).toBe('popularity.desc')
    expect(() => parseMovieSortBy('name.asc')).toThrowError(CliError)

    expect(parseTVSortBy(undefined)).toBeUndefined()
    expect(parseTVSortBy('first_air_date.desc')).toBe('first_air_date.desc')
    expect(() => parseTVSortBy('revenue.desc')).toThrowError(CliError)
  })

  it('parses discover ID filters', () => {
    expect(parseIdFilter(undefined)).toBeUndefined()
    expect(parseIdFilter(' , ')).toBeUndefined()
    expect(parseIdFilter('28')).toBe(28)
    expect(parseIdFilter('28,12')).toEqual([28, 12])
    expect(parseIdFilter('28|12')).toBe('28|12')
    expect(() => parseIdFilter('abc')).toThrowError(CliError)
    expect(() => parseIdFilter('28|abc')).toThrowError(CliError)
    expect(() => parseIdFilter('0')).toThrowError(CliError)
  })

  it('parses numeric filters', () => {
    expect(parseNumber(undefined, '--vote-average-gte')).toBeUndefined()
    expect(parseNumber('7.5', '--vote-average-gte')).toBe(7.5)
    expect(() => parseNumber('abc', '--vote-average-gte')).toThrowError(CliError)

    expect(parseInteger(undefined, '--year')).toBeUndefined()
    expect(parseInteger('2024', '--year')).toBe(2024)
    expect(() => parseInteger('1.5', '--year')).toThrowError(CliError)
  })
})
