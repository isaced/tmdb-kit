import { describe, expect, it } from 'bun:test'
import { createTMDB } from '../../src'
import { createFetchMock } from '../_support/fetch'

describe('ImagesHelper', () => {
  it('uses the client image base URL override', () => {
    const tmdb = createTMDB({
      accessToken: 'read-token',
      fetch: createFetchMock().fetch,
      imageBaseUrl: 'https://images.example/t/p/',
    })

    expect(tmdb.images.url('/poster.jpg', 'w500')).toBe('https://images.example/t/p/w500/poster.jpg')
    expect(tmdb.images.url(null, 'w500')).toBeNull()
  })

  it('routes every URL through a globally-configured transform (CDN / image proxy use case)', () => {
    const tmdb = createTMDB({
      accessToken: 'read-token',
      fetch: createFetchMock().fetch,
      images: {
        transform: (url) => url.replace('https://image.tmdb.org/t/p', 'https://img-proxy.example/tmdb'),
      },
    })

    expect(tmdb.images.url('/poster.jpg', 'w500')).toBe('https://img-proxy.example/tmdb/w500/poster.jpg')
    expect(tmdb.images.url('/still.jpg', 'w300')).toBe('https://img-proxy.example/tmdb/w300/still.jpg')
  })

  it('lets a single call override the global transform without mutating it', () => {
    const tmdb = createTMDB({
      accessToken: 'read-token',
      fetch: createFetchMock().fetch,
      images: {
        transform: (url) => url.replace('https://image.tmdb.org/t/p', 'https://img-proxy.example/tmdb'),
      },
    })

    expect(
      tmdb.images.url('/poster.jpg', 'w500', {
        transform: (url) => `${url}?signed=abc`,
      }),
    ).toBe('https://image.tmdb.org/t/p/w500/poster.jpg?signed=abc')

    // Global transform is unaffected by the per-call override.
    expect(tmdb.images.url('/poster.jpg', 'w500')).toBe('https://img-proxy.example/tmdb/w500/poster.jpg')
  })

  it('keeps the original behaviour when no transform is configured', () => {
    const tmdb = createTMDB({
      accessToken: 'read-token',
      fetch: createFetchMock().fetch,
    })

    expect(tmdb.images.url('/poster.jpg', 'w500')).toBe('https://image.tmdb.org/t/p/w500/poster.jpg')
  })
})
