import { runCommand } from 'citty'
import { describe, expect, it } from 'bun:test'
import { discoverCommand } from '../../../src/cli/commands/discover'
import { movieSummary, pagedResponse, tvSummary } from '../fixtures'
import { captureOutput, jsonResponse, mockFetch, useCliTestEnv } from '../helpers'

describe('discover command', () => {
  useCliTestEnv()

  it('maps movie filters to TMDB query parameters', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(pagedResponse([movieSummary()])))
    captureOutput()

    await runCommand(discoverCommand, {
      rawArgs: [
        'movie',
        '--with-genres',
        '28,12',
        '--without-genres',
        '35|99',
        '--with-keywords',
        '9715',
        '--with-companies',
        '420,33',
        '--with-origin-country',
        'US,GB',
        '--with-original-language',
        'en',
        '--vote-average-gte',
        '7.5',
        '--vote-average-lte',
        '9',
        '--vote-count-gte',
        '100',
        '--runtime-gte',
        '90',
        '--with-watch-providers',
        '8,9',
        '--watch-region',
        'US',
        '--with-watch-monetization-types',
        'flatrate,rent',
        '--sort-by',
        'vote_average.desc',
        '--year',
        '2024',
        '--primary-release-year',
        '2024',
        '--primary-release-date-gte',
        '2024-01-01',
        '--release-date-lte',
        '2024-12-31',
        '--with-people',
        '287',
        '--with-cast',
        '287,819',
        '--with-crew',
        '525',
        '--with-release-type',
        '2,3',
        '--region',
        'US',
        '--include-adult',
      ],
    })

    expect(process.exitCode).toBe(0)
    expect(calls[0]?.pathname).toBe('/3/discover/movie')

    const params = calls[0]!.searchParams
    expect(params.get('with_genres')).toBe('28,12')
    expect(params.get('without_genres')).toBe('35|99')
    expect(params.get('with_keywords')).toBe('9715')
    expect(params.get('with_companies')).toBe('420,33')
    expect(params.get('with_origin_country')).toBe('US,GB')
    expect(params.get('with_original_language')).toBe('en')
    expect(params.get('vote_average.gte')).toBe('7.5')
    expect(params.get('vote_average.lte')).toBe('9')
    expect(params.get('vote_count.gte')).toBe('100')
    expect(params.get('with_runtime.gte')).toBe('90')
    expect(params.get('with_watch_providers')).toBe('8,9')
    expect(params.get('watch_region')).toBe('US')
    expect(params.get('with_watch_monetization_types')).toBe('flatrate,rent')
    expect(params.get('sort_by')).toBe('vote_average.desc')
    expect(params.get('year')).toBe('2024')
    expect(params.get('primary_release_year')).toBe('2024')
    expect(params.get('primary_release_date.gte')).toBe('2024-01-01')
    expect(params.get('release_date.lte')).toBe('2024-12-31')
    expect(params.get('with_people')).toBe('287')
    expect(params.get('with_cast')).toBe('287,819')
    expect(params.get('with_crew')).toBe('525')
    expect(params.get('with_release_type')).toBe('2,3')
    expect(params.get('region')).toBe('US')
    expect(params.get('include_adult')).toBe('true')
  })

  it('maps TV filters without a region parameter', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(pagedResponse([tvSummary()])))
    const output = captureOutput()

    await runCommand(discoverCommand, {
      rawArgs: [
        'tv',
        '--year',
        '2020',
        '--with-networks',
        '49',
        '--with-status',
        '0',
        '--with-type',
        '4',
        '--first-air-date-gte',
        '2020-01-01',
        '--air-date-lte',
        '2020-12-31',
        '--sort-by',
        'first_air_date.desc',
      ],
    })

    expect(process.exitCode).toBe(0)
    expect(calls[0]?.pathname).toBe('/3/discover/tv')
    expect(calls[0]?.searchParams.get('first_air_date_year')).toBe('2020')
    expect(calls[0]?.searchParams.get('with_networks')).toBe('49')
    expect(calls[0]?.searchParams.get('with_status')).toBe('0')
    expect(calls[0]?.searchParams.get('with_type')).toBe('4')
    expect(calls[0]?.searchParams.get('first_air_date.gte')).toBe('2020-01-01')
    expect(calls[0]?.searchParams.get('air_date.lte')).toBe('2020-12-31')
    expect(calls[0]?.searchParams.has('region')).toBe(false)
    expect(output.stdout()).toContain('Page 1/1 · 1 results')
  })

  it('rejects invalid sort values before making a request', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(pagedResponse([])))
    const output = captureOutput()

    await runCommand(discoverCommand, {
      rawArgs: ['movie', '--sort-by', 'not-a-sort'],
    })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('Invalid --sort-by')
    expect(calls).toHaveLength(0)
  })

  it('requires ndjson for --all and prints raw JSON with --json', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    mockFetch(() => jsonResponse(pagedResponse([movieSummary()])))
    const output = captureOutput()

    await runCommand(discoverCommand, { rawArgs: ['movie', '--all'] })
    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('--all requires --format ndjson')

    process.exitCode = 0
    await runCommand(discoverCommand, { rawArgs: ['movie', '--json'] })
    expect(process.exitCode).toBe(0)
    expect(JSON.parse(output.stdout()).results).toHaveLength(1)
  })
})
