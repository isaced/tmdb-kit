import { runCommand } from 'citty'
import { describe, expect, it } from 'bun:test'
import { providersCommand } from '../../../src/cli/commands/providers'
import { watchProviderListResponse, watchProvidersResponse } from '../fixtures'
import { captureOutput, jsonResponse, mockFetch, useCliTestEnv } from '../helpers'

describe('providers command', () => {
  useCliTestEnv()

  it('shows one region for a movie and filters JSON to that region', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(watchProvidersResponse()))
    const output = captureOutput()

    await runCommand(providersCommand, {
      rawArgs: ['movie', '550', '--region', 'us'],
    })

    expect(process.exitCode).toBe(0)
    expect(calls[0]?.pathname).toBe('/3/movie/550/watch/providers')
    expect(output.stdout()).toContain('Watch providers for US')
    expect(output.stdout()).toContain('Netflix')
    expect(output.stdout()).toContain('Source: JustWatch')
  })

  it('filters JSON output to the requested region', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    mockFetch(() => jsonResponse(watchProvidersResponse()))
    const output = captureOutput()

    await runCommand(providersCommand, {
      rawArgs: ['movie', '550', '--region', 'US', '--json'],
    })

    const payload = JSON.parse(output.stdout())
    expect(payload.results.US).toBeDefined()
    expect(payload.results.GB).toBeUndefined()
  })

  it('lists available regions when no region is given', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    mockFetch(() => jsonResponse(watchProvidersResponse()))
    const output = captureOutput()

    await runCommand(providersCommand, { rawArgs: ['tv', '1399'] })

    expect(output.stdout()).toContain('Available regions (2): GB, US')
    expect(output.stdout()).toContain('Use --region <code>')
  })

  it('maps the reference list endpoint with watch_region', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(watchProviderListResponse()))
    const output = captureOutput()

    await runCommand(providersCommand, {
      rawArgs: ['list', 'movie', '--watch-region', 'US'],
    })

    expect(calls[0]?.pathname).toBe('/3/watch/providers/movie')
    expect(calls[0]?.searchParams.get('watch_region')).toBe('US')
    expect(output.stdout()).toContain('8  Netflix')
    expect(output.stdout()).toContain('9  Prime Video')

    process.exitCode = 0
    await runCommand(providersCommand, { rawArgs: ['list', 'tv'] })
    expect(calls[1]?.pathname).toBe('/3/watch/providers/tv')
  })

  it('rejects invalid IDs', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const output = captureOutput()

    await runCommand(providersCommand, { rawArgs: ['movie', 'abc'] })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('Invalid movie ID')
  })
})
