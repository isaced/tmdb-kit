import { describe, expect, it } from 'bun:test'
import { createTMDB } from '../../src'
import { expectNoQuery, expectPaths } from '../_support/assertions'
import { createFetchMock } from '../_support/fetch'
import { externalIdsResponse } from '../_support/fixtures'

describe('external IDs', () => {
  it('maps every entity endpoint without a language query', async () => {
    const mock = createFetchMock(
      { body: externalIdsResponse },
      { body: { id: 1399, tvdb_id: 121361 } },
      { body: { id: 3624, tvdb_id: 121361 } },
      { body: { id: 63056, imdb_id: null } },
      { body: { id: 31, imdb_id: 'nm0000158' } },
    )
    const tmdb = createTMDB({
      accessToken: 'read-token',
      defaultLanguage: 'en-US',
      fetch: mock.fetch,
    })

    const movie = await tmdb.movies.externalIds(550)
    await tmdb.tv.externalIds(1399)
    await tmdb.tv.seasonExternalIds(1399, 1)
    await tmdb.tv.episodeExternalIds(1399, 1, 1)
    await tmdb.people.externalIds(31)

    expectPaths(mock.calls, [
      '/3/movie/550/external_ids',
      '/3/tv/1399/external_ids',
      '/3/tv/1399/season/1/external_ids',
      '/3/tv/1399/season/1/episode/1/external_ids',
      '/3/person/31/external_ids',
    ])
    for (const call of mock.calls) {
      expectNoQuery(call, 'language')
    }
    expect(movie.imdb_id).toBe('tt0137523')
  })

  it('rejects invalid IDs before fetching', () => {
    const mock = createFetchMock()
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    expect(() => tmdb.movies.externalIds(0)).toThrow('movieId')
    expect(() => tmdb.tv.seasonExternalIds(1399, -1)).toThrow('seasonNumber')
    expect(() => tmdb.tv.episodeExternalIds(1399, 1, -1)).toThrow('episodeNumber')
    expect(() => tmdb.people.externalIds(0)).toThrow('personId')
    expect(mock.calls).toHaveLength(0)
  })
})
