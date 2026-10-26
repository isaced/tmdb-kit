import { describe, expect, it } from 'bun:test'
import { TMDBTimeoutError, withTimeout } from '../../src'

function never(signal: AbortSignal): Promise<never> {
  return new Promise((_, reject) => {
    signal.addEventListener('abort', () => reject(signal.reason), { once: true })
  })
}

describe('withTimeout', () => {
  it('resolves when the task finishes before the deadline', async () => {
    const result = await withTimeout(100, async (signal) => {
      expect(signal).toBeInstanceOf(AbortSignal)
      return 'ok'
    })

    expect(result).toBe('ok')
  })

  it('aborts the task and throws TMDBTimeoutError', async () => {
    const error = await withTimeout(5, never).catch((value: unknown) => value)

    expect(error).toBeInstanceOf(TMDBTimeoutError)
    expect((error as TMDBTimeoutError).timeoutMs).toBe(5)
    expect((error as TMDBTimeoutError).message).toBe('TMDB request timed out after 5ms')
  })

  it('uses a custom timeout message', async () => {
    const error = await withTimeout(5, never, { message: 'slow request' }).catch(
      (value: unknown) => value,
    )

    expect((error as Error).message).toBe('slow request')
  })

  it('propagates a parent abort before the task starts', async () => {
    const controller = new AbortController()
    controller.abort(new Error('stop'))
    let called = false

    const error = await withTimeout(
      100,
      async () => {
        called = true
        return 1
      },
      { signal: controller.signal },
    ).catch((value: unknown) => value)

    expect((error as Error).message).toBe('stop')
    expect(called).toBe(false)
  })

  it('propagates a parent abort while the task runs', async () => {
    const controller = new AbortController()
    const promise = withTimeout(1_000, never, { signal: controller.signal })

    controller.abort(new Error('stop'))

    await expect(promise).rejects.toThrow('stop')
  })

  it('propagates task errors unchanged', async () => {
    const error = new Error('boom')

    await expect(
      withTimeout(100, async () => {
        throw error
      }),
    ).rejects.toBe(error)
  })

  it('rejects invalid timeouts', async () => {
    for (const value of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
      await expect(withTimeout(value, async () => 1)).rejects.toThrow(RangeError)
    }
  })
})
