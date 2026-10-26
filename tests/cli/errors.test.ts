import { afterEach, beforeEach, describe, expect, it, vi } from 'bun:test'
import { TMDBRequestError, TMDBResponseError } from '../../src'
import { createResponseError } from '../../src/errors'
import {
  CliError,
  errorMessage,
  exitCodeFor,
  runSafely,
} from '../../src/cli/errors'
import { captureOutput } from './helpers'

function responseError(status: number, retryAfter?: string) {
  const headers = new Headers()
  if (retryAfter) {
    headers.set('retry-after', retryAfter)
  }

  return createResponseError({
    body: { status_message: `status ${status}` },
    headers,
    status,
    statusText: 'Error',
    url: 'https://api.themoviedb.org/3/movie/1',
  })
}

describe('CLI errors', () => {
  beforeEach(() => {
    process.exitCode = 0
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.exitCode = 0
  })

  it('maps errors to exit codes', () => {
    expect(exitCodeFor(new CliError('x', 4))).toBe(4)
    expect(exitCodeFor(responseError(401))).toBe(3)
    expect(exitCodeFor(responseError(403))).toBe(3)
    expect(exitCodeFor(responseError(404))).toBe(4)
    expect(exitCodeFor(responseError(429))).toBe(5)
    expect(
      exitCodeFor(
        new TMDBResponseError('rate limited', {
          body: undefined,
          headers: new Headers(),
          status: 429,
          statusText: 'Too Many Requests',
          url: 'https://api.themoviedb.org/3/movie/1',
        }),
      ),
    ).toBe(5)
    expect(exitCodeFor(responseError(500))).toBe(1)
    expect(exitCodeFor(new TMDBRequestError('network'))).toBe(1)
    expect(exitCodeFor(new Error('unexpected'))).toBe(1)
  })

  it('formats CLI and request errors', () => {
    expect(errorMessage(new CliError('bad usage', 2))).toBe('bad usage')
    expect(errorMessage(new TMDBRequestError('network down'))).toBe('network down')
    expect(errorMessage(new Error('boom'))).toBe('boom')
    expect(errorMessage('plain')).toBe('plain')
  })

  it('formats TMDB response and rate limit errors', () => {
    expect(errorMessage(responseError(404))).toContain('TMDB request failed (404)')
    expect(errorMessage(responseError(401))).toContain(
      'TMDB rejected the credentials (HTTP 401)',
    )
    expect(errorMessage(responseError(401))).toContain('tmdb auth login')
    expect(errorMessage(responseError(403))).toContain('tmdb auth login')
    expect(errorMessage(responseError(429, '7'))).toBe(
      'TMDB rate limit exceeded. Retry after 7 seconds.',
    )
  })

  it('runs a successful task without changing the exit code', async () => {
    const output = captureOutput()
    await runSafely(async () => {})

    expect(output.stdout()).toBe('')
    expect(output.stderr()).toBe('')
    expect(process.exitCode).toBe(0)
  })

  it('reports task errors and sets the exit code', async () => {
    const output = captureOutput()
    await runSafely(async () => {
      throw new CliError('missing credentials', 3)
    })

    expect(output.stderr()).toBe('missing credentials\n')
    expect(process.exitCode).toBe(3)
  })
})
