import {
  TMDBRateLimitError,
  TMDBRequestError,
  TMDBResponseError,
} from '../index'

export class CliError extends Error {
  readonly exitCode: number

  constructor(message: string, exitCode = 1) {
    super(message)
    this.name = 'CliError'
    this.exitCode = exitCode
  }
}

export function exitCodeFor(error: unknown): number {
  if (error instanceof CliError) {
    return error.exitCode
  }
  if (error instanceof TMDBRateLimitError) {
    return 5
  }
  if (error instanceof TMDBResponseError) {
    if (error.status === 401 || error.status === 403) return 3
    if (error.status === 404) return 4
    if (error.status === 429) return 5
  }
  return 1
}

export function errorMessage(error: unknown): string {
  if (error instanceof CliError) {
    return error.message
  }
  if (error instanceof TMDBRateLimitError) {
    return `TMDB rate limit exceeded. Retry after ${error.retryAfter} seconds.`
  }
  if (error instanceof TMDBResponseError) {
    return `TMDB request failed (${error.status}): ${error.message}`
  }
  if (error instanceof TMDBRequestError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }
  return String(error)
}

export async function runSafely(task: () => Promise<void>): Promise<void> {
  try {
    await task()
  } catch (error) {
    process.stderr.write(`${errorMessage(error)}\n`)
    process.exitCode = exitCodeFor(error)
  }
}
