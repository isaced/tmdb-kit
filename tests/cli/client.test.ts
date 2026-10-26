import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import { describe, expect, it } from 'vitest'
import { TMDBClient } from '../../src'
import { createClient } from '../../src/cli/client'
import { CliError } from '../../src/cli/errors'
import { jsonResponse, mockFetch, useCliTestEnv } from './helpers'

describe('CLI client', () => {
  const env = useCliTestEnv()

  it('requires exactly one credential source', () => {
    expect.assertions(3)

    try {
      createClient()
    } catch (error) {
      expect(error).toBeInstanceOf(CliError)
      expect((error as CliError).exitCode).toBe(3)
      expect((error as CliError).message).toContain('No TMDB credentials found')
    }
  })

  it('uses an access token from the environment', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'env-token'
    const { calls, fetchMock } = mockFetch(() => jsonResponse({}))
    const client = createClient()

    expect(client).toBeInstanceOf(TMDBClient)
    await client.movies.details(1)

    expect(calls[0]?.pathname.endsWith('/movie/1')).toBe(true)
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer env-token')
  })

  it('uses an API key from the environment', async () => {
    process.env.TMDB_API_KEY = 'env-key'
    const { calls, fetchMock } = mockFetch(() => jsonResponse({}))
    const client = createClient()

    await client.movies.details(1)

    expect(calls[0]?.searchParams.get('api_key')).toBe('env-key')
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
    expect(new Headers(init?.headers).get('authorization')).toBeNull()
  })

  it('falls back to credentials in the config file', async () => {
    writeConfig({ accessToken: 'config-token' })
    const { fetchMock } = mockFetch(() => jsonResponse({}))
    const client = createClient()

    await client.movies.details(1)

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer config-token')
  })

  it('prefers environment credentials over the config file', async () => {
    writeConfig({ apiKey: 'config-key' })
    process.env.TMDB_ACCESS_TOKEN = 'env-token'
    const { calls, fetchMock } = mockFetch(() => jsonResponse({}))
    const client = createClient()

    await client.movies.details(1)

    expect(calls[0]?.searchParams.get('api_key')).toBeNull()
    const init = fetchMock.mock.calls[0]?.[1] as RequestInit | undefined
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer env-token')
  })

  it('applies config language and region defaults', async () => {
    writeConfig({ accessToken: 'token', language: 'zh-CN', region: 'CN' })
    const { calls } = mockFetch(() => jsonResponse({ page: 1, results: [] }))
    const client = createClient()

    await client.movies.nowPlaying()

    expect(calls[0]?.searchParams.get('language')).toBe('zh-CN')
    expect(calls[0]?.searchParams.get('region')).toBe('CN')
  })

  it('lets the command language override the config language', async () => {
    writeConfig({ accessToken: 'token', language: 'zh-CN' })
    const { calls } = mockFetch(() => jsonResponse({}))
    const client = createClient({ language: 'ja-JP' })

    await client.movies.details(1)

    expect(calls[0]?.searchParams.get('language')).toBe('ja-JP')
  })

  it('uses TMDB_BASE_URL for test or proxy endpoints', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    process.env.TMDB_BASE_URL = 'http://127.0.0.1:4321'
    const { calls } = mockFetch(() => jsonResponse({}))
    const client = createClient()

    await client.movies.details(1)

    expect(calls[0]?.origin).toBe('http://127.0.0.1:4321')
  })

  function writeConfig(value: unknown): void {
    const path = env.configPath()
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, JSON.stringify(value))
  }
})
