import { describe, expect, it } from 'bun:test'
import { createTMDB } from '../../src'
import { expectNoQuery, expectPaths, expectRequest } from '../_support/assertions'
import { createFetchMock } from '../_support/fetch'
import {
  collectionDetails,
  collectionTranslationsResponse,
  imagesResponse,
} from '../_support/fixtures'

describe('CollectionsResource', () => {
  it('maps details, images, and translations', async () => {
    const mock = createFetchMock(
      { body: collectionDetails },
      { body: imagesResponse },
      { body: collectionTranslationsResponse },
    )
    const tmdb = createTMDB({
      accessToken: 'read-token',
      defaultLanguage: 'en-US',
      fetch: mock.fetch,
    })

    const details = await tmdb.collections.details(10, { language: 'de-DE' })
    await tmdb.collections.images(10, {
      includeImageLanguage: ['en', 'null'],
      language: 'de-DE',
    })
    await tmdb.collections.translations(10)

    expectPaths(mock.calls, [
      '/3/collection/10',
      '/3/collection/10/images',
      '/3/collection/10/translations',
    ])
    expectRequest(mock.calls[0]!, {
      path: '/3/collection/10',
      query: { language: 'de-DE' },
    })
    expectRequest(mock.calls[1]!, {
      path: '/3/collection/10/images',
      query: { language: 'de-DE', include_image_language: 'en,null' },
    })
    expectNoQuery(mock.calls[2]!, 'language')
    expect(details.parts).toHaveLength(1)
  })

  it('rejects invalid collection IDs before fetching', () => {
    const mock = createFetchMock()
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    expect(() => tmdb.collections.details(0)).toThrow('collectionId')
    expect(() => tmdb.collections.images(-1)).toThrow('collectionId')
    expect(() => tmdb.collections.translations(1.5)).toThrow('collectionId')
    expect(mock.calls).toHaveLength(0)
  })
})
