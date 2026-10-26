import { Readable } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readSecret } from '../../src/cli/prompt'

const mocks = vi.hoisted(() => {
  const question = vi.fn(async () => ' hidden-token ')
  const close = vi.fn()
  const createInterface = vi.fn(() => ({
    question,
    close,
    _writeToOutput: () => {},
  }))
  return { close, createInterface, question }
})

vi.mock('node:readline/promises', () => ({
  createInterface: mocks.createInterface,
}))

describe('secret prompt', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('reads a secret from stdin when not a TTY', async () => {
    const descriptor = Object.getOwnPropertyDescriptor(process, 'stdin')!
    Object.defineProperty(process, 'stdin', {
      configurable: true,
      value: Readable.from(['secret-token\n']),
    })

    try {
      await expect(readSecret('Token: ')).resolves.toBe('secret-token')
      expect(mocks.createInterface).not.toHaveBeenCalled()
    } finally {
      Object.defineProperty(process, 'stdin', descriptor)
    }
  })

  it('prompts without echoing when stdin is a TTY', async () => {
    const stdin = Readable.from([]) as Readable & { isTTY?: boolean }
    stdin.isTTY = true
    const descriptor = Object.getOwnPropertyDescriptor(process, 'stdin')!

    Object.defineProperty(process, 'stdin', {
      configurable: true,
      value: stdin,
    })
    const output = vi.spyOn(process.stdout, 'write').mockReturnValue(true)

    try {
      await expect(readSecret('Token: ')).resolves.toBe('hidden-token')
      expect(mocks.question).toHaveBeenCalledWith('Token: ')
      expect(mocks.close).toHaveBeenCalled()
      expect(output).toHaveBeenCalledWith('\n')
    } finally {
      Object.defineProperty(process, 'stdin', descriptor)
    }
  })
})
