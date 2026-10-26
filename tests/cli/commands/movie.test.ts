import { runCommand } from 'citty'
import { describe, expect, it } from 'bun:test'
import { movieCommand } from '../../../src/cli/commands/movie'
import {
  creditsResponse,
  externalIds,
  imagesResponse,
  movieDetails,
  movieSummary,
  pagedResponse,
  videosResponse,
} from '../fixtures'
import { captureOutput, jsonResponse, mockFetch, useCliTestEnv } from '../helpers'

describe('movie command', () => {
  useCliTestEnv()

  it('prints movie details', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(movieDetails()))
    const output = captureOutput()

    await runCommand(movieCommand, { rawArgs: ['get', '693134'] })

    expect(process.exitCode).toBe(0)
    expect(output.stdout()).toContain('Dune: Part Two (2024)')
    expect(output.stdout()).toContain('Poster: https://image.tmdb.org/t/p/w500/poster.jpg')
    expect(calls[0]?.pathname.endsWith('/movie/693134')).toBe(true)
    expect(calls[0]?.searchParams.get('language')).toBe('en-US')
  })

  it('prints raw JSON when requested', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    mockFetch(() => jsonResponse(movieDetails()))
    const output = captureOutput()

    await runCommand(movieCommand, { rawArgs: ['get', '693134', '--json'] })

    expect(JSON.parse(output.stdout()).id).toBe(693134)
  })

  it('passes append_to_response through', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(movieDetails()))
    captureOutput()

    await runCommand(movieCommand, {
      rawArgs: ['get', '693134', '--append', 'credits,videos', '--lang', 'zh-CN'],
    })

    expect(calls[0]?.searchParams.get('append_to_response')).toBe('credits,videos')
    expect(calls[0]?.searchParams.get('language')).toBe('zh-CN')
  })

  it('rejects invalid movie IDs', async () => {
    const output = captureOutput()

    await runCommand(movieCommand, { rawArgs: ['get', 'abc'] })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('Invalid movie ID')
  })

  it('maps not-found responses to exit code 4', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    mockFetch(() => jsonResponse({ status_message: 'Not found' }, 404))
    const output = captureOutput()

    await runCommand(movieCommand, { rawArgs: ['get', '404'] })

    expect(process.exitCode).toBe(4)
    expect(output.stderr()).toContain('TMDB request failed (404)')
  })

  it('lists every movie category with page and region options', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(pagedResponse([movieSummary()])))
    captureOutput()

    for (const args of [
      ['list'],
      ['list', 'top-rated'],
      ['list', 'now-playing'],
      ['list', 'upcoming'],
      ['list', 'popular', '--page', '2', '--region', 'CN'],
    ]) {
      await runCommand(movieCommand, { rawArgs: args })
      expect(process.exitCode).toBe(0)
    }

    expect(calls.map((call) => call.pathname)).toEqual([
      '/3/movie/popular',
      '/3/movie/top_rated',
      '/3/movie/now_playing',
      '/3/movie/upcoming',
      '/3/movie/popular',
    ])
    expect(calls[4]?.searchParams.get('page')).toBe('2')
    expect(calls[4]?.searchParams.get('region')).toBe('CN')
  })

  it('prints movie credits', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(creditsResponse()))
    const output = captureOutput()

    await runCommand(movieCommand, {
      rawArgs: ['credits', '1', '--limit', '1'],
    })

    expect(output.stdout()).toContain('Timothée Chalamet as Paul Atreides')
    expect(output.stdout()).toContain('Denis Villeneuve — Director')
    expect(calls[0]?.pathname.endsWith('/movie/1/credits')).toBe(true)
  })

  it('prints movie image URLs with image language filters', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(imagesResponse()))
    const output = captureOutput()

    await runCommand(movieCommand, {
      rawArgs: ['images', '1', '--image-language', 'en,null'],
    })

    expect(output.stdout()).toContain('https://image.tmdb.org/t/p/w500/poster.jpg')
    expect(output.stdout()).toContain('https://image.tmdb.org/t/p/w780/backdrop.jpg')
    expect(calls[0]?.searchParams.get('include_image_language')).toBe('en,null')
  })

  it('prints movie videos', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    mockFetch(() => jsonResponse(videosResponse()))
    const output = captureOutput()

    await runCommand(movieCommand, { rawArgs: ['videos', '1'] })

    expect(output.stdout()).toContain('https://www.youtube.com/watch?v=dQw4w9WgXcQ')
  })

  it('lists similar and recommended movies', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(pagedResponse([movieSummary()])))
    captureOutput()

    await runCommand(movieCommand, {
      rawArgs: ['similar', '1', '--page', '2', '--region', 'US'],
    })
    await runCommand(movieCommand, {
      rawArgs: ['recommendations', '1'],
    })

    expect(calls[0]?.pathname.endsWith('/movie/1/similar')).toBe(true)
    expect(calls[0]?.searchParams.get('page')).toBe('2')
    expect(calls[0]?.searchParams.get('region')).toBe('US')
    expect(calls[1]?.pathname.endsWith('/movie/1/recommendations')).toBe(true)
  })

  it('supports JSON output for every nested movie command', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    mockFetch(() => jsonResponse({}))
    captureOutput()

    for (const args of [
      ['list'],
      ['credits', '1'],
      ['images', '1'],
      ['videos', '1'],
      ['similar', '1'],
      ['recommendations', '1'],
    ]) {
      await runCommand(movieCommand, { rawArgs: [...args, '--json'] })
      expect(process.exitCode).toBe(0)
    }
  })

  it('prints movie external IDs without a language query', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(externalIds()))
    const output = captureOutput()

    await runCommand(movieCommand, { rawArgs: ['external-ids', '550'] })

    expect(process.exitCode).toBe(0)
    expect(calls[0]?.pathname).toBe('/3/movie/550/external_ids')
    expect(calls[0]?.searchParams.has('language')).toBe(false)
    expect(output.stdout()).toContain('IMDb: tt0137523')
  })
})
