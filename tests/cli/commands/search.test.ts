import { runCommand } from 'citty'
import { describe, expect, it } from 'vitest'
import { searchCommand } from '../../../src/cli/commands/search'
import { multiSearchResponse } from '../fixtures'
import { captureOutput, jsonResponse, mockFetch, useCliTestEnv } from '../helpers'

describe('search command', () => {
  useCliTestEnv()

  it('searches all media types by default', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(multiSearchResponse))
    const output = captureOutput()

    await runCommand(searchCommand, { rawArgs: ['Dune'] })

    expect(process.exitCode).toBe(0)
    expect(output.stdout()).toContain('Dune: Part Two (2024)')
    expect(calls[0]?.pathname.endsWith('/search/multi')).toBe(true)
    expect(calls[0]?.searchParams.get('query')).toBe('Dune')
    expect(calls[0]?.searchParams.get('page')).toBe('1')
    expect(calls[0]?.searchParams.get('language')).toBe('en-US')
  })

  it('searches movies with a year filter', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() =>
      jsonResponse({
        page: 1,
        total_pages: 1,
        total_results: 1,
        results: [multiSearchResponse.results[0]],
      }),
    )
    captureOutput()

    await runCommand(searchCommand, {
      rawArgs: ['Dune', '--type', 'movie', '--year', '2024'],
    })

    expect(calls[0]?.pathname.endsWith('/search/movie')).toBe(true)
    expect(calls[0]?.searchParams.get('year')).toBe('2024')
  })

  it('searches TV with a first-air year filter', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() =>
      jsonResponse({
        page: 1,
        total_pages: 1,
        total_results: 1,
        results: [multiSearchResponse.results[1]],
      }),
    )
    captureOutput()

    await runCommand(searchCommand, {
      rawArgs: ['Dark', '--type', 'tv', '--year', '2017'],
    })

    expect(calls[0]?.pathname.endsWith('/search/tv')).toBe(true)
    expect(calls[0]?.searchParams.get('first_air_date_year')).toBe('2017')
  })

  it('searches people', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() =>
      jsonResponse({
        page: 1,
        total_pages: 1,
        total_results: 1,
        results: [multiSearchResponse.results[2]],
      }),
    )
    captureOutput()

    await runCommand(searchCommand, {
      rawArgs: ['Tom Hardy', '--type', 'person'],
    })

    expect(calls[0]?.pathname.endsWith('/search/person')).toBe(true)
  })

  it('prints raw JSON when requested', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    mockFetch(() => jsonResponse(multiSearchResponse))
    const output = captureOutput()

    await runCommand(searchCommand, { rawArgs: ['Dune', '--json'] })

    expect(JSON.parse(output.stdout()).results[0].id).toBe(1)
  })

  it('passes page and language options through', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(multiSearchResponse))
    captureOutput()

    await runCommand(searchCommand, {
      rawArgs: ['Dune', '--page', '2', '--lang', 'zh-CN'],
    })

    expect(calls[0]?.searchParams.get('page')).toBe('2')
    expect(calls[0]?.searchParams.get('language')).toBe('zh-CN')
  })

  it('rejects a year filter without a movie or TV type', async () => {
    const output = captureOutput()

    await runCommand(searchCommand, { rawArgs: ['Dune', '--year', '2024'] })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('--year is only supported')
  })

  it('rejects an empty query', async () => {
    const output = captureOutput()

    await runCommand(searchCommand, { rawArgs: ['   '] })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('Search query must not be empty')
  })

  it('rejects an invalid page', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const output = captureOutput()

    await runCommand(searchCommand, { rawArgs: ['Dune', '--page', '0'] })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('Invalid --page')
  })

  it('reports missing credentials', async () => {
    const output = captureOutput()

    await runCommand(searchCommand, { rawArgs: ['Dune'] })

    expect(process.exitCode).toBe(3)
    expect(output.stderr()).toContain('No TMDB credentials found')
  })

  it('maps not-found responses to exit code 4', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    mockFetch(() => jsonResponse({ status_message: 'Not found' }, 404))
    const output = captureOutput()

    await runCommand(searchCommand, { rawArgs: ['Dune'] })

    expect(process.exitCode).toBe(4)
    expect(output.stderr()).toContain('TMDB request failed (404)')
  })
})
