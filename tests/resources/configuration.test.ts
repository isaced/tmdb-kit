import { describe, it } from 'bun:test'
import { createTMDB } from '../../src'
import { expectPaths } from '../_support/assertions'
import { configurationResponse } from '../_support/fixtures'
import { createFetchMock } from '../_support/fetch'

describe('ConfigurationResource', () => {
  it('maps all configuration endpoints without extra query parameters', async () => {
    const mock = createFetchMock(
      { body: configurationResponse },
      { body: [] },
      { body: [] },
      { body: [] },
      { body: [] },
      { body: [] },
    )
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })

    await tmdb.configuration.details()
    await tmdb.configuration.countries()
    await tmdb.configuration.jobs()
    await tmdb.configuration.languages()
    await tmdb.configuration.primaryTranslations()
    await tmdb.configuration.timezones()

    expectPaths(mock.calls, [
      '/3/configuration',
      '/3/configuration/countries',
      '/3/configuration/jobs',
      '/3/configuration/languages',
      '/3/configuration/primary_translations',
      '/3/configuration/timezones',
    ])
  })
})
