import { describe, expect, it } from 'vitest'
import { CliError } from '../../src/cli/errors'
import {
  parseCommaList,
  parseGenreType,
  parseId,
  parseLimit,
  parseMovieListCategory,
  parsePage,
  parseSearchType,
  parseSeasonNumber,
  parseTVListCategory,
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
    for (const value of ['popular', 'top-rated', 'now-playing', 'upcoming']) {
      expect(parseMovieListCategory(value)).toBe(value)
    }
    expect(() => parseMovieListCategory('airing-today')).toThrowError(CliError)
  })

  it('parses TV list categories', () => {
    for (const value of ['popular', 'top-rated', 'airing-today', 'on-the-air']) {
      expect(parseTVListCategory(value)).toBe(value)
    }
    expect(() => parseTVListCategory('upcoming')).toThrowError(CliError)
  })
})
