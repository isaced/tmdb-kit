import { describe, expect, it } from 'bun:test'
import { setConfigValue } from '../../src/cli/config'
import { missingCredentialsMessage, resolveCredentials } from '../../src/cli/credentials'
import { useCliTestEnv } from './helpers'

describe('credential resolution', () => {
  const env = useCliTestEnv()

  it('returns none when nothing is configured', () => {
    const credentials = resolveCredentials()

    expect(credentials.source).toBe('none')
    expect(credentials.accessToken).toBeUndefined()
    expect(credentials.apiKey).toBeUndefined()
    expect(credentials.envVar).toBeNull()
    expect(credentials.configField).toBeNull()
  })

  it('uses a trimmed TMDB_ACCESS_TOKEN first', () => {
    process.env.TMDB_ACCESS_TOKEN = '  env-token  '
    const credentials = resolveCredentials()

    expect(credentials.source).toBe('environment')
    expect(credentials.envVar).toBe('TMDB_ACCESS_TOKEN')
    expect(credentials.accessToken).toBe('env-token')
  })

  it('uses TMDB_API_KEY from the environment', () => {
    process.env.TMDB_API_KEY = 'env-key'
    const credentials = resolveCredentials()

    expect(credentials.source).toBe('environment')
    expect(credentials.envVar).toBe('TMDB_API_KEY')
    expect(credentials.apiKey).toBe('env-key')
  })

  it('falls back to accessToken from the config file', () => {
    setConfigValue('accessToken', 'config-token')
    const credentials = resolveCredentials()

    expect(credentials.source).toBe('config')
    expect(credentials.configField).toBe('accessToken')
    expect(credentials.accessToken).toBe('config-token')
  })

  it('falls back to apiKey from the config file', () => {
    setConfigValue('apiKey', 'config-key')
    const credentials = resolveCredentials()

    expect(credentials.source).toBe('config')
    expect(credentials.configField).toBe('apiKey')
    expect(credentials.apiKey).toBe('config-key')
  })

  it('prefers complete environment credentials over config credentials', () => {
    setConfigValue('apiKey', 'config-key')
    process.env.TMDB_ACCESS_TOKEN = 'env-token'
    const credentials = resolveCredentials()

    expect(credentials.source).toBe('environment')
    expect(credentials.envVar).toBe('TMDB_ACCESS_TOKEN')
    expect(credentials.accessToken).toBe('env-token')
    expect(credentials.apiKey).toBeUndefined()
  })

  it('ignores template placeholders in the config file', () => {
    setConfigValue('accessToken', 'YOUR_TMDB_ACCESS_TOKEN')
    setConfigValue('apiKey', 'YOUR_TMDB_API_KEY')

    expect(resolveCredentials().source).toBe('none')
  })

  it('ignores placeholder environment values', () => {
    process.env.TMDB_ACCESS_TOKEN = 'YOUR_TMDB_ACCESS_TOKEN'
    process.env.TMDB_API_KEY = 'YOUR_TMDB_API_KEY'

    expect(resolveCredentials().source).toBe('none')
  })

  it('falls through a placeholder config token to a real apiKey', () => {
    setConfigValue('accessToken', 'YOUR_TMDB_ACCESS_TOKEN')
    setConfigValue('apiKey', 'config-key')

    expect(resolveCredentials()).toMatchObject({
      source: 'config',
      configField: 'apiKey',
      apiKey: 'config-key',
    })
  })

  it('falls through a placeholder environment token to config credentials', () => {
    process.env.TMDB_ACCESS_TOKEN = 'YOUR_TMDB_ACCESS_TOKEN'
    setConfigValue('accessToken', 'config-token')

    expect(resolveCredentials()).toMatchObject({
      source: 'config',
      accessToken: 'config-token',
    })
  })

  it('describes how to configure missing credentials', () => {
    const message = missingCredentialsMessage()

    expect(message).toContain('tmdb auth login')
    expect(message).toContain(env.configPath())
    expect(message).toContain('"accessToken"')
    expect(message).toContain('API Read Access Token')
  })
})
