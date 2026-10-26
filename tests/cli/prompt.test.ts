import { Readable } from 'node:stream'
import { afterEach, describe, expect, it, vi } from 'bun:test'
import { confirm, readSecret } from '../../src/cli/prompt'

interface QuestionContext {
  _writeToOutput: (value: string) => void
}

const question = vi.fn(async function (this: QuestionContext, prompt: string) {
  this._writeToOutput(prompt)
  return ' hidden-token '
})
const close = vi.fn()
const createInterface = vi.fn(() => ({
  question,
  close,
  _writeToOutput: (_value: string) => {},
}))
const mocks = { close, createInterface, question }

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

describe('confirm prompt', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  it('accepts affirmative answers', async () => {
    mocks.question.mockResolvedValueOnce(' YES ')
    await expect(confirm('Continue? ')).resolves.toBe(true)

    mocks.question.mockResolvedValueOnce('y')
    await expect(confirm('Continue? ')).resolves.toBe(true)
  })

  it('rejects any other answer', async () => {
    mocks.question.mockResolvedValueOnce('nope')

    await expect(confirm('Continue? ')).resolves.toBe(false)
    expect(mocks.close).toHaveBeenCalled()
  })
})
