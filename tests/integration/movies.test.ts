import { describe, expect, it } from 'vitest'
import { createRealTMDB } from './setup'

describe('Movies API (integration)', () => {
  const tmdb = createRealTMDB()

  it('fetches popular movies', async () => {
    const result = await tmdb.movies.popular()
    expect(result.page).toBe(1)
    expect(Array.isArray(result.results)).toBe(true)
    expect(result.results.length).toBeGreaterThan(0)
    const movie = result.results[0]!
    expect(movie.id).toBeGreaterThan(0)
    expect(movie.title).toBeTruthy()
  })

  it('fetches top rated movies', async () => {
    const result = await tmdb.movies.topRated()
    expect(Array.isArray(result.results)).toBe(true)
    expect(result.results.length).toBeGreaterThan(0)
  })

  it('fetches now playing movies', async () => {
    const result = await tmdb.movies.nowPlaying()
    expect(Array.isArray(result.results)).toBe(true)
  })

  it('fetches upcoming movies', async () => {
    const result = await tmdb.movies.upcoming()
    expect(Array.isArray(result.results)).toBe(true)
  })

  it('fetches movie details by id', async () => {
    const movie = await tmdb.movies.details(550) // Fight Club
    expect(movie.id).toBe(550)
    expect(movie.title).toBe('Fight Club')
    expect(typeof movie.overview).toBe('string')
    expect(Array.isArray(movie.genres)).toBe(true)
  })

  it('fetches movie credits', async () => {
    const credits = await tmdb.movies.credits(550)
    expect(credits.id).toBe(550)
    expect(Array.isArray(credits.cast)).toBe(true)
    expect(Array.isArray(credits.crew)).toBe(true)
  })

  it('fetches movie videos', async () => {
    const videos = await tmdb.movies.videos(550)
    expect(videos.id).toBe(550)
    expect(Array.isArray(videos.results)).toBe(true)
  })

  it('fetches movie images', async () => {
    const images = await tmdb.movies.images(550)
    expect(images.id).toBe(550)
    expect(Array.isArray(images.backdrops)).toBe(true)
    expect(Array.isArray(images.posters)).toBe(true)
  })

  it('fetches movie recommendations', async () => {
    const result = await tmdb.movies.recommendations(550)
    expect(Array.isArray(result.results)).toBe(true)
  })

  it('fetches movie similar', async () => {
    const result = await tmdb.movies.similar(550)
    expect(Array.isArray(result.results)).toBe(true)
  })

  it('supports append_to_response', async () => {
    const movie = await tmdb.movies.details(550, {
      appendToResponse: ['credits', 'videos'],
    })
    expect(movie.id).toBe(550)
    expect('credits' in movie).toBe(true)
    expect('videos' in movie).toBe(true)
  })

  it('rejects invalid movie ids before a request is made', () => {
    expect(() => tmdb.movies.details(0)).toThrow('movieId must be a positive integer')
    expect(() => tmdb.movies.credits(-1)).toThrow('movieId must be a positive integer')
    expect(() => tmdb.movies.details(1.2)).toThrow('movieId must be a positive integer')
  })
})
