import { describe, expect, it } from 'vitest'
import { createRealTMDB } from './setup'

describe('Images helper (integration)', () => {
  const tmdb = createRealTMDB()

  it('builds image url from a real poster path', async () => {
    const movie = await tmdb.movies.details(550)
    const url = tmdb.images.url(movie.poster_path, 'w500')
    expect(url).toBeTruthy()
    expect(url).toMatch(/^https:\/\//)
    expect(url).toContain('w500')
  })

  it('returns null for nullish paths', () => {
    expect(tmdb.images.url(null)).toBeNull()
    expect(tmdb.images.url(undefined)).toBeNull()
    expect(tmdb.images.url('')).toBeNull()
  })
})
