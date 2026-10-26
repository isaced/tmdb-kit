import { createTMDB, TMDBClient, type TMDBClientOptions, type TMDBTransport } from '../../src'

// Automatically load .env on Node.js 20.12+ / 21.7+
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env')
  } catch {
    // .env may not exist; user can export vars manually
  }
}

const envAccessToken = process.env.TMDB_ACCESS_TOKEN?.trim()
const envApiKey = process.env.TMDB_API_KEY?.trim()
export const apiEndpoint = process.env.TMDB_API_ENDPOINT?.trim()

if (!envAccessToken && !envApiKey) {
  throw new Error(
    'Missing TMDB credentials. Set TMDB_ACCESS_TOKEN (recommended) or TMDB_API_KEY ' +
      'in the environment or in a .env file before running integration tests.',
  )
}

// Narrowed to plain strings after the guard above. The exports let individual
// suites skip auth-specific cases without re-validating the environment.
export const accessToken = envAccessToken
export const apiKey = envApiKey

type RealTMDBOptions = Partial<Omit<TMDBClientOptions, 'accessToken' | 'apiKey' | 'baseUrl'>> & {
  transport?: TMDBTransport
}

/**
 * Create a client with the integration credentials and optional per-test
 * overrides. Prefers the access token and falls back to the legacy v3 API key.
 */
export function createRealTMDB(options: RealTMDBOptions = {}): TMDBClient {
  const common = {
    ...(apiEndpoint ? { baseUrl: apiEndpoint } : {}),
    ...options,
  }

  return envAccessToken
    ? createTMDB({ accessToken: envAccessToken, ...common })
    : createTMDB({ apiKey: envApiKey as string, ...common })
}
