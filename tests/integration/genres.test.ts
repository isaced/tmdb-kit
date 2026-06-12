import { describe, expect, it } from 'vitest'
import { createRealTMDB } from './setup'

describe('Genres API (integration)', () => {
  const tmdb = createRealTMDB()

  it('fetches movie genres', async () => {
    const result = await tmdb.genres.movies()
    expect(Array.isArray(result.genres)).toBe(true)
    expect(result.genres.length).toBeGreaterThan(0)
    const genre = result.genres[0]!
    expect(genre.id).toBeGreaterThan(0)
    expect(genre.name).toBeTruthy()
  })

  it('fetches tv genres', async () => {
    const result = await tmdb.genres.tv()
    expect(Array.isArray(result.genres)).toBe(true)
    expect(result.genres.length).toBeGreaterThan(0)
    const genre = result.genres[0]!
    expect(genre.id).toBeGreaterThan(0)
    expect(genre.name).toBeTruthy()
  })
})
