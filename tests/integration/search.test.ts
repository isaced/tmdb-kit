import { describe, expect, it } from 'vitest'
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

  it('rejects empty queries before a request is made', () => {
    expect(() => tmdb.search.movies('   ')).toThrow('search query must not be empty')
    expect(() => tmdb.search.tv('')).toThrow('search query must not be empty')
    expect(() => tmdb.search.multi('\n\t')).toThrow('search query must not be empty')
  })
})
