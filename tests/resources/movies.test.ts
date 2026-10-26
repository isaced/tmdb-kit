import { describe, expect, it } from 'bun:test'
import { createTMDB } from '../../src'
import { expectPaths, expectRequest } from '../_support/assertions'
import {
  creditsResponse,
  imagesResponse,
  movieDetails,
  paged,
  videosResponse,
} from '../_support/fixtures'
import { createFetchMock } from '../_support/fetch'

describe('MoviesResource', () => {
  it('maps movie list endpoints with list defaults', async () => {
    const mock = createFetchMock(
      { body: paged() },
      { body: paged() },
      { body: paged() },
      { body: paged() },
    )
    const tmdb = createTMDB({
      accessToken: 'read-token',
      defaultLanguage: 'zh-CN',
      defaultRegion: 'CN',
      fetch: mock.fetch,
    })

    await tmdb.movies.popular({ page: 2 })
    await tmdb.movies.topRated({ language: 'en-US' })
    await tmdb.movies.nowPlaying({ region: 'US' })
    await tmdb.movies.upcoming()

    expectPaths(mock.calls, [
      '/3/movie/popular',
      '/3/movie/top_rated',
      '/3/movie/now_playing',
      '/3/movie/upcoming',
    ])
    expectRequest(mock.calls[0]!, {
      path: '/3/movie/popular',
      query: {
        language: 'zh-CN',
        page: '2',
        region: 'CN',
      },
    })
    expectRequest(mock.calls[1]!, {
      path: '/3/movie/top_rated',
      query: {
        language: 'en-US',
        region: 'CN',
      },
    })
    expectRequest(mock.calls[2]!, {
      path: '/3/movie/now_playing',
      query: {
        language: 'zh-CN',
        region: 'US',
      },
    })
  })

  it('maps movie details and nested media endpoints', async () => {
    const mock = createFetchMock(
      { body: movieDetails },
      { body: creditsResponse },
      { body: videosResponse },
      { body: imagesResponse },
      { body: paged() },
      { body: paged() },
    )
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    await tmdb.movies.details(550, {
      appendToResponse: ['credits', 'videos'],
      language: 'en-US',
    })
    await tmdb.movies.credits(550)
    await tmdb.movies.videos(550, { language: 'fr-FR' })
    await tmdb.movies.images(550, {
      includeImageLanguage: ['en', 'null'],
    })
    await tmdb.movies.recommendations(550, { page: 2 })
    await tmdb.movies.similar(550, { region: 'US' })

    expectPaths(mock.calls, [
      '/3/movie/550',
      '/3/movie/550/credits',
      '/3/movie/550/videos',
      '/3/movie/550/images',
      '/3/movie/550/recommendations',
      '/3/movie/550/similar',
    ])
    expectRequest(mock.calls[0]!, {
      path: '/3/movie/550',
      query: {
        append_to_response: 'credits,videos',
        language: 'en-US',
      },
    })
    expectRequest(mock.calls[2]!, {
      path: '/3/movie/550/videos',
      query: {
        language: 'fr-FR',
      },
    })
    expectRequest(mock.calls[3]!, {
      path: '/3/movie/550/images',
      query: {
        include_image_language: 'en,null',
      },
    })
    expectRequest(mock.calls[4]!, {
      path: '/3/movie/550/recommendations',
      query: {
        page: '2',
      },
    })
  })

  it('rejects invalid movie ids before a request is made', () => {
    const mock = createFetchMock()
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    expect(() => tmdb.movies.details(0)).toThrow('movieId must be a positive integer')
    expect(() => tmdb.movies.credits(1.2)).toThrow('movieId must be a positive integer')
    expect(mock.calls).toHaveLength(0)
  })
})
