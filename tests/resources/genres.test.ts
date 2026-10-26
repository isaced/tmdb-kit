import { describe, it } from 'bun:test'
import { createTMDB } from '../../src'
import { expectPaths, expectRequest } from '../_support/assertions'
import { genresResponse } from '../_support/fixtures'
import { createFetchMock } from '../_support/fetch'

describe('GenresResource', () => {
  it('maps movie and tv genre lists', async () => {
    const mock = createFetchMock({ body: genresResponse }, { body: genresResponse })
    const tmdb = createTMDB({
      accessToken: 'read-token',
      defaultLanguage: 'zh-CN',
      fetch: mock.fetch,
    })

    await tmdb.genres.movies()
    await tmdb.genres.tv({ language: 'de-DE' })

    expectPaths(mock.calls, ['/3/genre/movie/list', '/3/genre/tv/list'])
    expectRequest(mock.calls[0]!, {
      path: '/3/genre/movie/list',
      query: {
        language: 'zh-CN',
      },
    })
    expectRequest(mock.calls[1]!, {
      path: '/3/genre/tv/list',
      query: {
        language: 'de-DE',
      },
    })
  })
})
