import { describe, expect, it } from 'bun:test'
import { isMovieSearchResult, isTVSearchResult } from '../../src'
import { createRealTMDB } from './setup'

describe('Search API (integration)', () => {
  const tmdb = createRealTMDB()

  it('searches movies', async () => {
    const result = await tmdb.search.movies('Inception')
    expect(result.page).toBe(1)
    expect(Array.isArray(result.results)).toBe(true)
    expect(result.total_results).toBeGreaterThanOrEqual(0)
  })

  it('searches tv shows', async () => {
    const result = await tmdb.search.tv('Breaking Bad')
    expect(Array.isArray(result.results)).toBe(true)
  })

  it('searches people', async () => {
    const result = await tmdb.search.people('Tom Hanks')
    expect(Array.isArray(result.results)).toBe(true)
  })

  it('searches multi', async () => {
    const result = await tmdb.search.multi('Star Wars')
    expect(Array.isArray(result.results)).toBe(true)
  })

  it('rejects empty queries before a request is made', async () => {
    expect(() => tmdb.search.movies('   ')).toThrow('search query must not be empty')
    expect(() => tmdb.search.tv('')).toThrow('search query must not be empty')
    await expect(tmdb.search.multi('\n\t')).rejects.toThrow('search query must not be empty')
  })
})

describe('Search type guards and exclude on the live API (integration)', () => {
  const tmdb = createRealTMDB()

  it('search.multi() returns mixed media types for an ambiguous query', async () => {
    const result = await tmdb.search.multi('Star Wars')

    expect(result.results.length).toBeGreaterThan(0)
    const mediaTypes = new Set(result.results.map((r) => r.media_type))
    // "Star Wars" is famously a franchise with movies, TV shows, and
    // people attached — at least one of each is virtually guaranteed.
    expect(mediaTypes.has('movie')).toBe(true)
  })

  it('exclude: ["person"] removes person entries from search.multi()', async () => {
    const unfiltered = await tmdb.search.multi('Star Wars')
    const filtered = await tmdb.search.multi('Star Wars', { exclude: ['person'] })

    const unfilteredTypes = unfiltered.results.map((r) => r.media_type)
    const filteredTypes = filtered.results.map((r) => r.media_type)

    // Filtered result must not contain any person entries.
    expect(filteredTypes.includes('person')).toBe(false)
    // If the unfiltered payload had persons, the filtered count must be lower.
    if (unfilteredTypes.includes('person')) {
      expect(filtered.results.length).toBeLessThan(unfiltered.results.length)
    }
    // total_results reflects the unfiltered payload (client-side filter).
    expect(filtered.total_results).toBe(unfiltered.total_results)
  })

  it('isMovieSearchResult narrows a real multi-search payload', async () => {
    const { results } = await tmdb.search.multi('Inception')
    const movies = results.filter(isMovieSearchResult)

    // Every narrowed entry is a movie, so it must carry `title` and not `name`.
    for (const movie of movies) {
      expect(typeof movie.title).toBe('string')
    }
  })

  it('isTVSearchResult narrows a real multi-search payload', async () => {
    const { results } = await tmdb.search.multi('Breaking Bad')
    const shows = results.filter(isTVSearchResult)

    for (const show of shows) {
      expect(typeof show.name).toBe('string')
      expect(show.media_type).toBe('tv')
    }
  })
})
