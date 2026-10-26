import { describe, expect, it } from 'bun:test'
import { createTMDB } from '../../src'
import { expectPaths, expectRequest } from '../_support/assertions'
import { paged } from '../_support/fixtures'
import { createFetchMock } from '../_support/fetch'

describe('TrendingResource', () => {
  it('maps all trending media endpoints and defaults to day', async () => {
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

    await tmdb.trending.all('week', { language: 'en-US', page: 3 })
    await tmdb.trending.movies()
    await tmdb.trending.tv('day')
    await tmdb.trending.people('week')

    expectPaths(mock.calls, [
      '/3/trending/all/week',
      '/3/trending/movie/day',
      '/3/trending/tv/day',
      '/3/trending/person/week',
    ])
    expectRequest(mock.calls[0]!, {
      path: '/3/trending/all/week',
      query: {
        language: 'en-US',
        page: '3',
      },
    })
    expectRequest(mock.calls[1]!, {
      path: '/3/trending/movie/day',
      query: {
        language: 'zh-CN',
      },
    })
  })

  it('rejects invalid time windows before a request is made', () => {
    const mock = createFetchMock()
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    expect(() => tmdb.trending.all('month' as never)).toThrow(
      'timeWindow must be either "day" or "week"',
    )
    expect(mock.calls).toHaveLength(0)
  })
})
