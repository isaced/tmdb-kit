import { getConfigPath, readConfig, type CliConfig } from './config'

export type CredentialSource = 'environment' | 'config' | 'none'
export type CredentialField = 'accessToken' | 'apiKey'
export type CredentialEnvVar = 'TMDB_ACCESS_TOKEN' | 'TMDB_API_KEY'

export interface ResolvedCredentials {
  accessToken?: string
  apiKey?: string
  config: CliConfig
  configField: CredentialField | null
  envVar: CredentialEnvVar | null
  source: CredentialSource
}

export function resolveCredentials(): ResolvedCredentials {
  const config = readConfig()
  const envAccessToken = process.env.TMDB_ACCESS_TOKEN?.trim()
  const envApiKey = process.env.TMDB_API_KEY?.trim()

  if (envAccessToken) {
    return {
      accessToken: envAccessToken,
      config,
      configField: null,
      envVar: 'TMDB_ACCESS_TOKEN',
      source: 'environment',
    }
  }
  if (envApiKey) {
    return {
      apiKey: envApiKey,
      config,
      configField: null,
      envVar: 'TMDB_API_KEY',
      source: 'environment',
    }
  }
  if (config.accessToken) {
    return {
      accessToken: config.accessToken,
      config,
      configField: 'accessToken',
      envVar: null,
      source: 'config',
    }
  }
  if (config.apiKey) {
    return {
      apiKey: config.apiKey,
      config,
      configField: 'apiKey',
      envVar: null,
      source: 'config',
    }
  }

  return {
    config,
    configField: null,
    envVar: null,
    source: 'none',
  }
}

export function missingCredentialsMessage(): string {
  return [
    'No TMDB credentials found.',
    '',
    'Recommended:',
    '  tmdb auth login',
    '',
    'Or use an environment variable:',
    '  export TMDB_ACCESS_TOKEN=...',
    '  export TMDB_API_KEY=...  (legacy v3 API key)',
    '',
    'Or edit the config file:',
    `  ${getConfigPath()}`,
    '',
    '  {',
    '    "accessToken": "YOUR_TMDB_ACCESS_TOKEN",',
    '    "language": "en-US",',
    '    "region": "US"',
    '  }',
    '',
    'Create a token:',
    '  https://www.themoviedb.org/settings/api',
    '',
    'Use the API Read Access Token, not the legacy API Key.',
  ].join('\n')
}
