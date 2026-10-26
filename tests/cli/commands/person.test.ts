import { runCommand } from 'citty'
import { describe, expect, it } from 'bun:test'
import { personCommand } from '../../../src/cli/commands/person'
import { combinedCreditsResponse, personDetails } from '../fixtures'
import { captureOutput, jsonResponse, mockFetch, useCliTestEnv } from '../helpers'

describe('person command', () => {
  useCliTestEnv()

  it('prints person details', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(personDetails()))
    const output = captureOutput()

    await runCommand(personCommand, {
      rawArgs: ['get', '31', '--lang', 'ja-JP'],
    })

    expect(output.stdout()).toContain('Tom Hanks')
    expect(output.stdout()).toContain('IMDb: https://www.imdb.com/name/nm0000158')
    expect(calls[0]?.pathname.endsWith('/person/31')).toBe(true)
    expect(calls[0]?.searchParams.get('language')).toBe('ja-JP')
  })

  it('prints person details as JSON', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    mockFetch(() => jsonResponse(personDetails()))
    const output = captureOutput()

    await runCommand(personCommand, { rawArgs: ['get', '31', '--json'] })

    expect(JSON.parse(output.stdout()).id).toBe(31)
  })

  it('prints combined credits with a limit', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(combinedCreditsResponse()))
    const output = captureOutput()

    await runCommand(personCommand, {
      rawArgs: ['credits', '31', '--limit', '2'],
    })

    expect(output.stdout()).toContain('Dune: Part Two as Paul Atreides')
    expect(output.stdout()).toContain('Dark as Jonas Kahnwald · 26 eps')
    expect(output.stdout()).not.toContain('Forrest Gump')
    expect(calls[0]?.pathname.endsWith('/person/31/combined_credits')).toBe(true)
  })

  it('prints combined credits as JSON', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    mockFetch(() => jsonResponse(combinedCreditsResponse()))
    const output = captureOutput()

    await runCommand(personCommand, { rawArgs: ['credits', '31', '--json'] })

    expect(JSON.parse(output.stdout()).id).toBe(31)
  })

  it('rejects invalid person IDs', async () => {
    const output = captureOutput()

    await runCommand(personCommand, { rawArgs: ['get', 'abc'] })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('Invalid person ID')
  })
})
