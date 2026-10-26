import { runCommand } from 'citty'
import { describe, expect, it } from 'bun:test'
import { tvCommand } from '../../../src/cli/commands/tv'
import {
  creditsResponse,
  imagesResponse,
  pagedResponse,
  seasonDetails,
  tvDetails,
  tvSummary,
  videosResponse,
} from '../fixtures'
import { captureOutput, jsonResponse, mockFetch, useCliTestEnv } from '../helpers'

describe('tv command', () => {
  useCliTestEnv()

  it('lists every TV category with pagination', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(pagedResponse([tvSummary()])))
    captureOutput()

    for (const args of [
      ['list'],
      ['list', 'top-rated'],
      ['list', 'airing-today'],
      ['list', 'on-the-air'],
      ['list', 'popular', '--page', '2'],
    ]) {
      await runCommand(tvCommand, { rawArgs: args })
      expect(process.exitCode).toBe(0)
    }

    expect(calls.map((call) => call.pathname)).toEqual([
      '/3/tv/popular',
      '/3/tv/top_rated',
      '/3/tv/airing_today',
      '/3/tv/on_the_air',
      '/3/tv/popular',
    ])
    expect(calls[4]?.searchParams.get('page')).toBe('2')
  })

  it('prints TV details with append and language options', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(tvDetails()))
    const output = captureOutput()

    await runCommand(tvCommand, {
      rawArgs: ['get', '1399', '--append', 'credits,videos', '--lang', 'ja-JP'],
    })

    expect(output.stdout()).toContain('Game of Thrones (2011)')
    expect(output.stdout()).toContain('Seasons:')
    expect(calls[0]?.pathname.endsWith('/tv/1399')).toBe(true)
    expect(calls[0]?.searchParams.get('append_to_response')).toBe('credits,videos')
    expect(calls[0]?.searchParams.get('language')).toBe('ja-JP')
  })

  it('prints TV credits', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(creditsResponse()))
    const output = captureOutput()

    await runCommand(tvCommand, { rawArgs: ['credits', '1399'] })

    expect(output.stdout()).toContain('Timothée Chalamet')
    expect(calls[0]?.pathname.endsWith('/tv/1399/credits')).toBe(true)
  })

  it('prints TV images', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(imagesResponse()))
    const output = captureOutput()

    await runCommand(tvCommand, {
      rawArgs: ['images', '1399', '--image-language', 'en'],
    })

    expect(output.stdout()).toContain('https://image.tmdb.org/t/p/w500/poster.jpg')
    expect(calls[0]?.searchParams.get('include_image_language')).toBe('en')
  })

  it('prints TV videos', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    mockFetch(() => jsonResponse(videosResponse()))
    const output = captureOutput()

    await runCommand(tvCommand, { rawArgs: ['videos', '1399'] })

    expect(output.stdout()).toContain('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  })

  it('lists similar and recommended TV shows', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(pagedResponse([tvSummary()])))
    captureOutput()

    await runCommand(tvCommand, { rawArgs: ['similar', '1399', '--page', '2'] })
    await runCommand(tvCommand, { rawArgs: ['recommendations', '1399'] })

    expect(calls[0]?.pathname.endsWith('/tv/1399/similar')).toBe(true)
    expect(calls[0]?.searchParams.get('page')).toBe('2')
    expect(calls[1]?.pathname.endsWith('/tv/1399/recommendations')).toBe(true)
  })

  it('prints a TV season', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(seasonDetails()))
    const output = captureOutput()

    await runCommand(tvCommand, { rawArgs: ['season', '1399', '1'] })

    expect(output.stdout()).toContain('Winter Is Coming')
    expect(calls[0]?.pathname.endsWith('/tv/1399/season/1')).toBe(true)
  })

  it('rejects invalid season numbers', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const output = captureOutput()

    await runCommand(tvCommand, { rawArgs: ['season', '1399', 'abc'] })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('Invalid season number')
  })

  it('supports JSON output for every nested TV command', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    mockFetch(() => jsonResponse({}))
    captureOutput()

    for (const args of [
      ['list'],
      ['get', '1399'],
      ['credits', '1399'],
      ['images', '1399'],
      ['videos', '1399'],
      ['similar', '1399'],
      ['recommendations', '1399'],
      ['season', '1399', '1'],
    ]) {
      await runCommand(tvCommand, { rawArgs: [...args, '--json'] })
      expect(process.exitCode).toBe(0)
    }
  })
})
