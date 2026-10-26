import { describe, expect, it } from 'bun:test'
import { runCommand } from 'citty'
import { movieCommand } from '../../src/cli/commands/movie'
import { movieDetails } from './fixtures'
import { captureOutput, jsonResponse, mockFetch, useCliTestEnv } from './helpers'

describe('command output', () => {
  useCliTestEnv()

  it('prints the same bytes for --json and --format json', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'test-token'
    mockFetch(() => jsonResponse(movieDetails()))

    const output = captureOutput()
    await runCommand(movieCommand, { rawArgs: ['get', '693134', '--json'] })
    const alias = output.stdout()

    await runCommand(movieCommand, { rawArgs: ['get', '693134', '--format', 'json'] })
    const format = output.stdout().slice(alias.length)

    expect(alias).toBe(`${JSON.stringify(movieDetails(), null, 2)}\n`)
    expect(format).toBe(alias)
  })

  it('prints compact JSON on a single line', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'test-token'
    mockFetch(() => jsonResponse(movieDetails()))

    const output = captureOutput()
    await runCommand(movieCommand, { rawArgs: ['get', '693134', '--format', 'json', '--compact'] })

    expect(output.stdout()).toBe(`${JSON.stringify(movieDetails())}\n`)
  })

  it('keeps the text summary by default', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'test-token'
    mockFetch(() => jsonResponse(movieDetails()))

    const output = captureOutput()
    await runCommand(movieCommand, { rawArgs: ['get', '693134'] })

    expect(output.stdout()).toContain('Dune: Part Two (2024)')
    expect(output.stdout()).toContain('https://www.themoviedb.org/movie/693134')
  })

  it('writes JSON errors to stderr and keeps stdout empty', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'test-token'
    mockFetch(() =>
      jsonResponse({ status_message: 'The resource you requested could not be found.' }, 404),
    )

    const output = captureOutput()
    await runCommand(movieCommand, { rawArgs: ['get', '999999', '--format', 'json'] })

    expect(output.stdout()).toBe('')
    expect(JSON.parse(output.stderr())).toEqual({
      type: 'error',
      kind: 'not_found',
      message: 'TMDB request failed (404): The resource you requested could not be found.',
      exitCode: 4,
      status: 404,
    })
    expect(process.exitCode).toBe(4)
  })

  it('reports usage errors as JSON before any request', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'test-token'
    const { calls } = mockFetch(() => jsonResponse(movieDetails()))

    const output = captureOutput()
    await runCommand(movieCommand, { rawArgs: ['get', 'nope', '--format', 'json'] })

    expect(calls).toHaveLength(0)
    expect(JSON.parse(output.stderr())).toMatchObject({ kind: 'usage', exitCode: 2 })
    expect(process.exitCode).toBe(2)
  })
})
