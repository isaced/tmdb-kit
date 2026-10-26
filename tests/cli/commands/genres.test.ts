import { runCommand } from 'citty'
import { describe, expect, it } from 'vitest'
import { genresCommand } from '../../../src/cli/commands/genres'
import { genresResponse } from '../fixtures'
import { captureOutput, jsonResponse, mockFetch, useCliTestEnv } from '../helpers'

describe('genres command', () => {
  useCliTestEnv()

  it('defaults to movie genres', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(genresResponse()))
    const output = captureOutput()

    await runCommand(genresCommand, { rawArgs: [] })

    expect(output.stdout()).toContain('28  Action')
    expect(calls[0]?.pathname.endsWith('/genre/movie/list')).toBe(true)
  })

  it('supports TV genres and language options', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(genresResponse()))
    captureOutput()

    await runCommand(genresCommand, { rawArgs: ['tv', '--lang', 'ja-JP'] })

    expect(calls[0]?.pathname.endsWith('/genre/tv/list')).toBe(true)
    expect(calls[0]?.searchParams.get('language')).toBe('ja-JP')
  })

  it('prints raw JSON', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    mockFetch(() => jsonResponse(genresResponse()))
    const output = captureOutput()

    await runCommand(genresCommand, { rawArgs: ['--json'] })

    expect(JSON.parse(output.stdout()).genres[0].id).toBe(28)
  })

  it('rejects an unknown genre type', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const output = captureOutput()

    await runCommand(genresCommand, { rawArgs: ['person'] })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('Invalid --type')
  })
})
