import { describe, expect, it } from 'bun:test'
import { createTMDB } from '../../src'
import { expectRequest } from '../_support/assertions'
import { createFetchMock } from '../_support/fetch'
import { findResponse } from '../_support/fixtures'

describe('FindResource', () => {
  it('maps the external source and language', async () => {
    const mock = createFetchMock({ body: findResponse })
    const tmdb = createTMDB({
      accessToken: 'read-token',
      defaultLanguage: 'en-US',
      fetch: mock.fetch,
    })

    const response = await tmdb.find.byExternalId('tt0137523', {
      source: 'imdb_id',
      language: 'de-DE',
    })

    expectRequest(mock.calls[0]!, {
      path: '/3/find/tt0137523',
      query: { external_source: 'imdb_id', language: 'de-DE' },
    })
    expect(response.movie_results).toHaveLength(1)
    expect(response.movie_results[0]!.media_type).toBe('movie')
  })

  it('encodes path characters in the external ID', async () => {
    const mock = createFetchMock({ body: findResponse })
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    await tmdb.find.byExternalId('a/b?c#d', { source: 'imdb_id' })

    expect(mock.calls[0]!.url.pathname).toBe('/3/find/a%2Fb%3Fc%23d')
  })

  it('rejects an empty external ID', () => {
    const mock = createFetchMock()
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    expect(() => tmdb.find.byExternalId('   ', { source: 'imdb_id' })).toThrow('externalId')
    expect(mock.calls).toHaveLength(0)
  })
})
