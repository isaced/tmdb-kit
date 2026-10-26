import { describe, expect, it } from 'bun:test'
import { createTMDB } from '../../src'
import { accessToken, apiEndpoint, createRealTMDB } from './setup'

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

  it('routes every image URL through a globally-configured transform', async () => {
    const client = createTMDB({
      accessToken,
      ...(apiEndpoint ? { baseUrl: apiEndpoint } : {}),
      images: {
        transform: (url) =>
          url.replace('https://image.tmdb.org/t/p', 'https://img-proxy.example/tmdb'),
      },
    })

    const movie = await client.movies.details(550)
    const url = client.images.url(movie.poster_path, 'w500')

    expect(url).toBeTruthy()
    expect(url!.startsWith('https://img-proxy.example/tmdb/w500/')).toBe(true)
    expect(url!.includes('image.tmdb.org')).toBe(false)
  })

  it('lets a single call override the global transform without mutating it', async () => {
    const client = createTMDB({
      accessToken,
      ...(apiEndpoint ? { baseUrl: apiEndpoint } : {}),
      images: {
        transform: (url) =>
          url.replace('https://image.tmdb.org/t/p', 'https://img-proxy.example/tmdb'),
      },
    })

    const movie = await client.movies.details(550)
    const signed = client.images.url(movie.poster_path, 'w500', {
      transform: (url) => `${url}?signature=abc`,
    })
    expect(signed).toContain('?signature=abc')

    // The global transform must still apply on subsequent calls.
    const global = client.images.url(movie.poster_path, 'w500')
    expect(global!.startsWith('https://img-proxy.example/tmdb/w500/')).toBe(true)
  })
})
