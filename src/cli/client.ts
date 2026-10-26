import { createTMDB, type TMDBClient } from '../index'
import { getConfigPath, readConfig } from './config'
import { CliError } from './errors'

export interface ClientOptions {
  language?: string
}

export function createClient(options: ClientOptions = {}): TMDBClient {
  const config = readConfig()
  const accessToken = process.env.TMDB_ACCESS_TOKEN?.trim() || config.accessToken
  const apiKey = process.env.TMDB_API_KEY?.trim() || config.apiKey
  const common = {
    baseUrl: process.env.TMDB_BASE_URL,
    defaultLanguage: options.language ?? config.language ?? 'en-US',
    defaultRegion: config.region,
  }

  if (accessToken) {
    return createTMDB({ accessToken, ...common })
  }
  if (apiKey) {
    return createTMDB({ apiKey, ...common })
  }

  throw new CliError(
    [
      'No TMDB credentials found.',
      '',
      'Set TMDB_ACCESS_TOKEN (recommended) or TMDB_API_KEY,',
      `or add them to ${getConfigPath()}.`,
      'Get a token: https://www.themoviedb.org/settings/api',
    ].join('\n'),
    3,
  )
}
