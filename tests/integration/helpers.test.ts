import { describe, expect, it } from 'bun:test'
import {
  createTMDB,
  paginate,
  TMDBTimeoutError,
  withMemoryCache,
  withRetry,
  withTimeout,
  type MovieSummary,
  type PagedResponse,
} from '../../src'
import { createRealTMDB, createRealTransport } from './setup'

describe('optional helpers against the live TMDB API (integration)', () => {
  it('wraps the real transport with retry and cache', async () => {
    const tmdb = createTMDB({
      transport: withMemoryCache(withRetry(createRealTransport(), { retries: 1 })),
    })

    const first = await tmdb.movies.details(550)
    const second = await tmdb.movies.details(550)

    expect(first.id).toBe(550)
    expect(first.title).toBe('Fight Club')
    // The second call is served from the memory cache.
    expect(second).toBe(first)
  }, 20_000)

  it('converts a real request abort into TMDBTimeoutError', async () => {
    const tmdb = createRealTMDB()

    const error = await withTimeout(1, (signal) => tmdb.movies.details(550, { signal })).catch(
      (value: unknown) => value,
    )

    expect(error).toBeInstanceOf(TMDBTimeoutError)
    expect((error as TMDBTimeoutError).timeoutMs).toBe(1)
  }, 20_000)

  it('iterates two real pages of popular movies', async () => {
    const tmdb = createRealTMDB()
    const pages: Array<PagedResponse<MovieSummary>> = []

    for await (const response of paginate(
      (pageNumber) => tmdb.movies.popular({ page: pageNumber }),
      { endPage: 2 },
    )) {
      pages.push(response)
    }

    expect(pages.map((response) => response.page)).toEqual([1, 2])
    expect(pages.every((response) => response.results.length > 0)).toBe(true)
    expect(pages[0]!.total_pages).toBeGreaterThanOrEqual(2)
  }, 20_000)
})
