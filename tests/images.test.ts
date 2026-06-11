import { describe, expect, it } from 'vitest'
import { buildImageUrl, createTMDB } from '../src'
import { createMockFetch } from './helpers'

describe('image helpers', () => {
  it('builds TMDB image URLs from API paths', () => {
    expect(buildImageUrl('/poster.jpg', 'w500')).toBe('https://image.tmdb.org/t/p/w500/poster.jpg')
    expect(buildImageUrl('poster.jpg', 'original')).toBe('https://image.tmdb.org/t/p/original/poster.jpg')
    expect(buildImageUrl(null, 'w342')).toBeNull()
    expect(buildImageUrl('   ', 'w342')).toBeNull()
  })

  it('uses the client image base URL override', () => {
    const tmdb = createTMDB({
      accessToken: 'token',
      fetch: createMockFetch().fetch,
      imageBaseUrl: 'https://images.example/t/p/',
    })

    expect(tmdb.images.url('/profile.png', 'h632')).toBe('https://images.example/t/p/h632/profile.png')
  })
})
