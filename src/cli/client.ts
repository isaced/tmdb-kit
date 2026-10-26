import { createTMDB, type TMDBClient } from '../index'
import { missingCredentialsMessage, resolveCredentials } from './credentials'
import { CliError } from './errors'

export interface ClientOptions {
  language?: string
}

export function createClient(options: ClientOptions = {}): TMDBClient {
  const credentials = resolveCredentials()
  const common = {
    baseUrl: process.env.TMDB_BASE_URL,
    defaultLanguage:
      options.language ?? credentials.config.language ?? 'en-US',
    defaultRegion: credentials.config.region,
  }

  if (credentials.accessToken) {
    return createTMDB({ accessToken: credentials.accessToken, ...common })
  }
  if (credentials.apiKey) {
    return createTMDB({ apiKey: credentials.apiKey, ...common })
  }

  throw new CliError(missingCredentialsMessage(), 3)
}
