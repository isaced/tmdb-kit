import { describe, expect, it } from 'vitest'
import { createRealTMDB } from './setup'

describe('Trending API (integration)', () => {
  const tmdb = createRealTMDB()

  it('fetches trending all for day', async () => {
    const result = await tmdb.trending.all('day')
    expect(Array.isArray(result.results)).toBe(true)
    expect(result.results.length).toBeGreaterThan(0)
  })

  it('fetches trending movies for week', async () => {
    const result = await tmdb.trending.movies('week')
    expect(Array.isArray(result.results)).toBe(true)
    expect(result.results.length).toBeGreaterThan(0)
  })

  it('fetches trending tv for day', async () => {
    const result = await tmdb.trending.tv('day')
    expect(Array.isArray(result.results)).toBe(true)
    expect(result.results.length).toBeGreaterThan(0)
  })

  it('fetches trending people for week', async () => {
    const result = await tmdb.trending.people('week')
    expect(Array.isArray(result.results)).toBe(true)
    expect(result.results.length).toBeGreaterThan(0)
  })
})
