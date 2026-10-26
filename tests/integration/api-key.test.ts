import { describe, expect, it } from 'bun:test'
import { createTMDB, TMDBResponseError } from '../../src'
import { apiEndpoint, apiKey } from './setup'

// The access-token suite is the default path. Legacy v3 API key coverage only
// runs when TMDB_API_KEY is configured.
const itWithApiKey = apiKey ? it : it.skip

describe('Legacy API key auth (integration)', () => {
  itWithApiKey('authenticates with the api_key query parameter', async () => {
    const tmdb = createTMDB({
      apiKey: apiKey!,
      ...(apiEndpoint ? { baseUrl: apiEndpoint } : {}),
    })

    const movie = await tmdb.movies.details(550)
    expect(movie.id).toBe(550)
    expect(movie.title).toBe('Fight Club')
  })

  itWithApiKey('exposes isUnauthorized for an invalid API key', async () => {
    // Some self-hosted mirrors fall through to cached data for unknown keys,
    // so the 401 contract is only meaningful against the canonical host.
    if (apiEndpoint) {
      // eslint-disable-next-line no-console
      console.warn(
        'Skipping: TMDB_API_ENDPOINT is set; the 401 contract test requires the canonical host',
      )
      return
    }

    const tmdb = createTMDB({ apiKey: 'definitely-not-a-real-key' })
    const error = await tmdb.movies.popular().catch((value: unknown) => value)

    expect(error).toBeInstanceOf(TMDBResponseError)
    if (!(error instanceof TMDBResponseError)) return

    expect(error.isUnauthorized).toBe(true)
    expect(error.status).toBe(401)
  })
})
