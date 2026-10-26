import { TMDBTimeoutError } from '../errors'

export interface TimeoutOptions {
  /** Parent signal. Aborting it cancels the task with the same reason. */
  signal?: AbortSignal
  /** Custom message for the TMDBTimeoutError. */
  message?: string
}

/**
 * Run a task with an AbortSignal-backed timeout.
 *
 * The task must forward the provided signal to the SDK for cancellation to
 * take effect. Timeouts are reported as {@link TMDBTimeoutError}; aborts from
 * the parent signal keep the parent's reason.
 *
 * ```ts
 * const movie = await withTimeout(5_000, (signal) =>
 *   tmdb.movies.details(550, { signal }),
 * )
 * ```
 */
export async function withTimeout<T>(
  timeoutMs: number,
  task: (signal: AbortSignal) => Promise<T>,
  options: TimeoutOptions = {},
): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new RangeError('timeoutMs must be a positive number')
  }

  const parent = options.signal
  const controller = new AbortController()
  const timeoutError = new TMDBTimeoutError(timeoutMs, options.message)
  const onAbort = () => controller.abort(parent!.reason)

  // Register first, then check, so an abort cannot slip through the gap.
  parent?.addEventListener('abort', onAbort, { once: true })
  if (parent?.aborted) {
    parent.removeEventListener('abort', onAbort)
    throw parent.reason
  }

  const timer = setTimeout(() => controller.abort(timeoutError), timeoutMs)

  try {
    return await task(controller.signal)
  } catch (error) {
    if (controller.signal.reason === timeoutError) {
      throw timeoutError
    }
    if (parent?.aborted) {
      throw parent.reason
    }
    throw error
  } finally {
    clearTimeout(timer)
    parent?.removeEventListener('abort', onAbort)
  }
}
