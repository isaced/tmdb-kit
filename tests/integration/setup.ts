import { createTMDB, TMDBClient } from '../../src'

// Automatically load .env on Node.js 20.12+ / 21.7+
if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile('.env')
  } catch {
    // .env may not exist; user can export vars manually
  }
}

export const accessToken = process.env.TMDB_ACCESS_TOKEN?.trim()
export const apiEndpoint = process.env.TMDB_API_ENDPOINT?.trim()

if (!accessToken) {
  throw new Error(
    'Missing TMDB_ACCESS_TOKEN environment variable. ' +
      'Please export it or add it to your .env file before running integration tests.',
  )
}

export function createRealTMDB(): TMDBClient {
  return createTMDB({
    accessToken,
    ...(apiEndpoint ? { baseUrl: apiEndpoint } : {}),
  })
}
