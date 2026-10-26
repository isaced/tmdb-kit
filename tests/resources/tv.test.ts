import { describe, expect, it } from 'bun:test'
import { createTMDB } from '../../src'
import { expectPaths, expectRequest } from '../_support/assertions'
import {
  aggregateCreditsResponse,
  creditsResponse,
  episodeDetails,
  episodeGroupDetails,
  episodeGroupsResponse,
  imagesResponse,
  paged,
  seasonDetails,
  seasonImagesResponse,
  tvDetails,
  videosResponse,
} from '../_support/fixtures'
import { createFetchMock } from '../_support/fetch'

describe('TVResource', () => {
  it('maps TV list endpoints with language defaults', async () => {
    const mock = createFetchMock(
      { body: paged() },
      { body: paged() },
      { body: paged() },
      { body: paged() },
    )
    const tmdb = createTMDB({
      accessToken: 'read-token',
      defaultLanguage: 'zh-CN',
      fetch: mock.fetch,
    })

    await tmdb.tv.popular()
    await tmdb.tv.topRated({ page: 4 })
    await tmdb.tv.airingToday({ language: 'en-US' })
    await tmdb.tv.onTheAir()

    expectPaths(mock.calls, [
      '/3/tv/popular',
      '/3/tv/top_rated',
      '/3/tv/airing_today',
      '/3/tv/on_the_air',
    ])
    expectRequest(mock.calls[0]!, {
      path: '/3/tv/popular',
      query: {
        language: 'zh-CN',
      },
    })
    expectRequest(mock.calls[1]!, {
      path: '/3/tv/top_rated',
      query: {
        language: 'zh-CN',
        page: '4',
      },
    })
    expectRequest(mock.calls[2]!, {
      path: '/3/tv/airing_today',
      query: {
        language: 'en-US',
      },
    })
  })

  it('maps TV details and nested media endpoints', async () => {
    const mock = createFetchMock(
      { body: tvDetails },
      { body: creditsResponse },
      { body: imagesResponse },
      { body: paged() },
      { body: paged() },
      { body: videosResponse },
    )
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    await tmdb.tv.details(1399, { appendToResponse: 'credits' })
    await tmdb.tv.credits(1399)
    await tmdb.tv.images(1399, { includeImageLanguage: 'en,null' })
    await tmdb.tv.recommendations(1399)
    await tmdb.tv.similar(1399)
    await tmdb.tv.videos(1399, { language: 'en-US' })

    expectPaths(mock.calls, [
      '/3/tv/1399',
      '/3/tv/1399/credits',
      '/3/tv/1399/images',
      '/3/tv/1399/recommendations',
      '/3/tv/1399/similar',
      '/3/tv/1399/videos',
    ])
    expectRequest(mock.calls[0]!, {
      path: '/3/tv/1399',
      query: {
        append_to_response: 'credits',
      },
    })
    expectRequest(mock.calls[2]!, {
      path: '/3/tv/1399/images',
      query: {
        include_image_language: 'en,null',
      },
    })
    expectRequest(mock.calls[5]!, {
      path: '/3/tv/1399/videos',
      query: {
        language: 'en-US',
      },
    })
  })

  it('rejects invalid series ids before a request is made', () => {
    const mock = createFetchMock()
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    expect(() => tmdb.tv.details(0)).toThrow('seriesId must be a positive integer')
    expect(() => tmdb.tv.videos(Number.NaN)).toThrow('seriesId must be a positive integer')
    expect(mock.calls).toHaveLength(0)
  })

  it('maps season details endpoint', async () => {
    const mock = createFetchMock({ body: seasonDetails }, { body: seasonDetails })
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    await tmdb.tv.seasonDetails(1399, 1)
    await tmdb.tv.seasonDetails(1399, 1, { appendToResponse: 'credits', language: 'zh-CN' })

    expectPaths(mock.calls, ['/3/tv/1399/season/1', '/3/tv/1399/season/1'])
    expectRequest(mock.calls[0]!, {
      path: '/3/tv/1399/season/1',
      query: {},
    })
    expectRequest(mock.calls[1]!, {
      path: '/3/tv/1399/season/1',
      query: {
        append_to_response: 'credits',
        language: 'zh-CN',
      },
    })
  })

  it('allows season 0 and rejects invalid season numbers before a request is made', async () => {
    const mock = createFetchMock({ body: seasonDetails })
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    await tmdb.tv.seasonDetails(1399, 0)

    expectPaths(mock.calls, ['/3/tv/1399/season/0'])
    expect(() => tmdb.tv.seasonDetails(1399, -1)).toThrow(
      'seasonNumber must be a non-negative integer',
    )
    expect(() => tmdb.tv.seasonDetails(1399, 1.5)).toThrow(
      'seasonNumber must be a non-negative integer',
    )
    expect(() => tmdb.tv.seasonDetails(1399, Number.NaN)).toThrow(
      'seasonNumber must be a non-negative integer',
    )
    expect(() => tmdb.tv.seasonDetails(0, 1)).toThrow('seriesId must be a positive integer')
    expect(mock.calls).toHaveLength(1)
  })

  it('maps episode, aggregate credit, and episode group endpoints', async () => {
    const mock = createFetchMock(
      { body: episodeDetails },
      { body: aggregateCreditsResponse },
      { body: aggregateCreditsResponse },
      { body: episodeGroupsResponse },
      { body: episodeGroupDetails },
    )
    const tmdb = createTMDB({
      accessToken: 'read-token',
      defaultLanguage: 'zh-CN',
      fetch: mock.fetch,
    })

    await tmdb.tv.episodeDetails(1399, 1, 2, {
      appendToResponse: ['credits', 'images'],
      language: 'en-US',
    })
    await tmdb.tv.aggregateCredits(1399)
    await tmdb.tv.seasonAggregateCredits(1399, 0)
    await tmdb.tv.episodeGroups(1399)
    await tmdb.tv.episodeGroup('abc123')

    expectPaths(mock.calls, [
      '/3/tv/1399/season/1/episode/2',
      '/3/tv/1399/aggregate_credits',
      '/3/tv/1399/season/0/aggregate_credits',
      '/3/tv/1399/episode_groups',
      '/3/tv/episode_group/abc123',
    ])
    expectRequest(mock.calls[0]!, {
      path: '/3/tv/1399/season/1/episode/2',
      query: {
        append_to_response: 'credits,images',
        language: 'en-US',
      },
    })
    expectRequest(mock.calls[2]!, {
      path: '/3/tv/1399/season/0/aggregate_credits',
      query: {
        language: 'zh-CN',
      },
    })
  })

  it('maps season credit, image, and video endpoints', async () => {
    const mock = createFetchMock(
      { body: creditsResponse },
      { body: seasonImagesResponse },
      { body: videosResponse },
      { body: creditsResponse },
      { body: seasonImagesResponse },
    )
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    await tmdb.tv.seasonCredits(1399, 2)
    await tmdb.tv.seasonImages(1399, 2, { includeImageLanguage: ['en', 'null'] })
    await tmdb.tv.seasonVideos(1399, 2)
    await tmdb.tv.seasonCredits(1399, 0)
    await tmdb.tv.seasonImages(1399, 0)

    expectPaths(mock.calls, [
      '/3/tv/1399/season/2/credits',
      '/3/tv/1399/season/2/images',
      '/3/tv/1399/season/2/videos',
      '/3/tv/1399/season/0/credits',
      '/3/tv/1399/season/0/images',
    ])
    expectRequest(mock.calls[1]!, {
      path: '/3/tv/1399/season/2/images',
      query: {
        include_image_language: 'en,null',
      },
    })
  })

  it('rejects invalid episode and group ids before a request is made', () => {
    const mock = createFetchMock()
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    expect(() => tmdb.tv.episodeDetails(1399, 1, 0)).toThrow(
      'episodeNumber must be a positive integer',
    )
    expect(() => tmdb.tv.episodeGroup('')).toThrow('groupId must be a non-empty identifier')
    expect(() => tmdb.tv.episodeGroup('../admin')).toThrow('groupId must be a non-empty identifier')
    expect(() => tmdb.tv.seasonCredits(0, 1)).toThrow('seriesId must be a positive integer')
    expect(mock.calls).toHaveLength(0)
  })
})
