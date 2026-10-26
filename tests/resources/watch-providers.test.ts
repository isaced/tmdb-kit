import { describe, expect, it } from 'bun:test'
import { createTMDB } from '../../src'
import { expectNoQuery, expectPaths, expectRequest } from '../_support/assertions'
import { createFetchMock } from '../_support/fetch'
import { watchProviderListResponse, watchProvidersResponse } from '../_support/fixtures'

describe('watch providers', () => {
  it('maps per-title endpoints without query parameters', async () => {
    const mock = createFetchMock(
      { body: watchProvidersResponse },
      { body: { id: 1399, results: {} } },
    )
    const tmdb = createTMDB({
      accessToken: 'read-token',
      defaultLanguage: 'en-US',
      defaultRegion: 'CN',
      fetch: mock.fetch,
    })

    const movie = await tmdb.movies.watchProviders(550)
    await tmdb.tv.watchProviders(1399)

    expectPaths(mock.calls, ['/3/movie/550/watch/providers', '/3/tv/1399/watch/providers'])
    for (const call of mock.calls) {
      expectNoQuery(call, 'language', 'watch_region')
    }
    expect(movie.results.US?.flatrate?.[0]?.provider_name).toBe('Netflix')
  })

  it('maps reference lists with watch_region and language', async () => {
    const mock = createFetchMock(
      { body: watchProviderListResponse },
      { body: watchProviderListResponse },
    )
    const tmdb = createTMDB({
      accessToken: 'read-token',
      defaultLanguage: 'en-US',
      fetch: mock.fetch,
    })

    await tmdb.watchProviders.movies({ watchRegion: 'US' })
    await tmdb.watchProviders.tv({ watchRegion: 'GB', language: 'fr-FR' })

    expectRequest(mock.calls[0]!, {
      path: '/3/watch/providers/movie',
      query: { language: 'en-US', watch_region: 'US' },
    })
    expectRequest(mock.calls[1]!, {
      path: '/3/watch/providers/tv',
      query: { language: 'fr-FR', watch_region: 'GB' },
    })
  })

  it('does not inherit defaultRegion as watch_region', async () => {
    const mock = createFetchMock({ body: watchProviderListResponse })
    const tmdb = createTMDB({
      accessToken: 'read-token',
      defaultRegion: 'CN',
      fetch: mock.fetch,
    })

    await tmdb.watchProviders.movies()

    expectNoQuery(mock.calls[0]!, 'watch_region')
  })
})
