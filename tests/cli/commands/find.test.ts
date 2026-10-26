import { runCommand } from 'citty'
import { describe, expect, it } from 'bun:test'
import { findCommand } from '../../../src/cli/commands/find'
import { findResponse } from '../fixtures'
import { captureOutput, jsonResponse, mockFetch, useCliTestEnv } from '../helpers'

describe('find command', () => {
  useCliTestEnv()

  it('defaults to imdb_id and prints grouped results', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(findResponse()))
    const output = captureOutput()

    await runCommand(findCommand, { rawArgs: ['tt0137523'] })

    expect(process.exitCode).toBe(0)
    expect(calls[0]?.pathname).toBe('/3/find/tt0137523')
    expect(calls[0]?.searchParams.get('external_source')).toBe('imdb_id')
    expect(output.stdout()).toContain('Movies:')
    expect(output.stdout()).toContain('Fight Club')
  })

  it('supports another source and a language override', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(findResponse()))
    captureOutput()

    await runCommand(findCommand, {
      rawArgs: ['121361', '--source', 'tvdb_id', '--lang', 'de-DE'],
    })

    expect(calls[0]?.searchParams.get('external_source')).toBe('tvdb_id')
    expect(calls[0]?.searchParams.get('language')).toBe('de-DE')
  })

  it('prints raw JSON and rejects an empty external ID', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    mockFetch(() => jsonResponse(findResponse()))
    const output = captureOutput()

    await runCommand(findCommand, { rawArgs: ['tt0137523', '--json'] })
    expect(JSON.parse(output.stdout()).movie_results).toHaveLength(1)

    process.exitCode = 0
    await runCommand(findCommand, { rawArgs: ['   '] })
    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('External ID must not be empty')
  })
})
