import { runCommand } from 'citty'
import { describe, expect, it } from 'bun:test'
import { trendingCommand } from '../../../src/cli/commands/trending'
import { multiSearchResponse } from '../fixtures'
import { captureOutput, jsonResponse, mockFetch, useCliTestEnv } from '../helpers'

describe('trending command', () => {
  useCliTestEnv()

  it('defaults to all media over the week window', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(multiSearchResponse))
    const output = captureOutput()

    await runCommand(trendingCommand, { rawArgs: [] })

    expect(process.exitCode).toBe(0)
    expect(output.stdout()).toContain('Dune: Part Two (2024)')
    expect(calls[0]?.pathname.endsWith('/trending/all/week')).toBe(true)
  })

  it('supports media type, window, page, and language options', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(multiSearchResponse))
    captureOutput()

    await runCommand(trendingCommand, {
      rawArgs: ['movie', '--window', 'day', '--page', '2', '--lang', 'zh-CN'],
    })

    expect(calls[0]?.pathname.endsWith('/trending/movie/day')).toBe(true)
    expect(calls[0]?.searchParams.get('page')).toBe('2')
    expect(calls[0]?.searchParams.get('language')).toBe('zh-CN')
  })

  it('supports TV and person trending', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(multiSearchResponse))
    captureOutput()

    await runCommand(trendingCommand, { rawArgs: ['tv', '--window', 'week'] })
    await runCommand(trendingCommand, { rawArgs: ['person', '--window', 'day'] })

    expect(calls[0]?.pathname.endsWith('/trending/tv/week')).toBe(true)
    expect(calls[1]?.pathname.endsWith('/trending/person/day')).toBe(true)
  })

  it('prints raw JSON', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    mockFetch(() => jsonResponse(multiSearchResponse))
    const output = captureOutput()

    await runCommand(trendingCommand, { rawArgs: ['--json'] })

    expect(JSON.parse(output.stdout()).results[0].id).toBe(1)
  })

  it('rejects an unknown media type', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const output = captureOutput()

    await runCommand(trendingCommand, { rawArgs: ['collection'] })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('Invalid --type')
  })

  it('rejects an invalid page', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const output = captureOutput()

    await runCommand(trendingCommand, { rawArgs: ['movie', '--page', '0'] })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('Invalid --page')
  })
})
