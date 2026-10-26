import { TMDBRateLimitError, TMDBRequestError, TMDBResponseError, TMDBTimeoutError } from '../index'

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
    if (error.status === 401 || error.status === 403) {
      return [
        `TMDB rejected the credentials (HTTP ${error.status}): ${error.message}`,
        'Run `tmdb auth login` to replace the token, or check `tmdb config show`.',
      ].join('\n')
    }
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

/** Machine-readable error categories reported by `--format json`. */
export type ErrorKind =
  'usage' | 'auth' | 'not_found' | 'rate_limit' | 'network' | 'api' | 'internal'

/** Structured error record written to stderr when `--format json` is active. */
export interface ErrorRecord {
  type: 'error'
  kind: ErrorKind
  message: string
  exitCode: number
  status?: number
  requestId?: string
  retryAfter?: number
}

const EXIT_CODE_KINDS: Partial<Record<number, ErrorKind>> = {
  2: 'usage',
  3: 'auth',
  4: 'not_found',
  5: 'rate_limit',
}

export function errorKind(error: unknown): ErrorKind {
  if (error instanceof CliError) {
    return EXIT_CODE_KINDS[error.exitCode] ?? 'internal'
  }
  if (error instanceof TMDBRateLimitError) {
    return 'rate_limit'
  }
  if (error instanceof TMDBResponseError) {
    if (error.status === 401 || error.status === 403) return 'auth'
    if (error.status === 404) return 'not_found'
    if (error.status === 429) return 'rate_limit'
    return 'api'
  }
  if (error instanceof TMDBRequestError || error instanceof TMDBTimeoutError) {
    return 'network'
  }
  return 'internal'
}

export function toErrorRecord(error: unknown): ErrorRecord {
  const record: ErrorRecord = {
    type: 'error',
    kind: errorKind(error),
    message: errorMessage(error),
    exitCode: exitCodeFor(error),
  }

  if (error instanceof TMDBResponseError) {
    record.status = error.status
    if (error.requestId !== null) {
      record.requestId = error.requestId
    }
  }
  if (error instanceof TMDBRateLimitError) {
    record.retryAfter = error.retryAfter
  }

  return record
}
