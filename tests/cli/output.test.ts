import { beforeEach, describe, expect, it } from 'bun:test'
import { CliError } from '../../src/cli/errors'
import { printResult, resolveOutput, runSafely } from '../../src/cli/output'
import { captureOutput } from './helpers'

describe('output context', () => {
  it('defaults to text output', () => {
    expect(resolveOutput({})).toEqual({ compact: false, format: 'text' })
  })

  it('accepts --format json regardless of case and padding', () => {
    expect(resolveOutput({ format: 'json' })).toEqual({ compact: false, format: 'json' })
    expect(resolveOutput({ format: ' JSON ' })).toEqual({ compact: false, format: 'json' })
  })

  it('treats --json as an alias for --format json', () => {
    expect(resolveOutput({ json: true })).toEqual({ compact: false, format: 'json' })
    expect(resolveOutput({ json: true, format: 'json' })).toEqual({
      compact: false,
      format: 'json',
    })
  })

  it('rejects contradictory --json and --format text', () => {
    expect(() => resolveOutput({ json: true, format: 'text' })).toThrow(
      '--json cannot be combined with --format text.',
    )

    try {
      resolveOutput({ json: true, format: 'text' })
    } catch (error) {
      expect(error).toBeInstanceOf(CliError)
      expect((error as CliError).exitCode).toBe(2)
    }
  })

  it('rejects unknown formats', () => {
    expect(() => resolveOutput({ format: 'yaml' })).toThrow(
      'Invalid --format "yaml". Expected one of: text, json.',
    )
  })

  it('tracks --compact', () => {
    expect(resolveOutput({ compact: true, json: true })).toEqual({
      compact: true,
      format: 'json',
    })
  })
})

describe('printResult', () => {
  it('delegates to the text renderer by default', () => {
    const output = captureOutput()
    printResult({ id: 550 }, resolveOutput({}), () => {
      process.stdout.write('Fight Club\n')
    })

    expect(output.stdout()).toBe('Fight Club\n')
  })

  it('pretty-prints JSON for --format json', () => {
    const output = captureOutput()
    printResult({ id: 550 }, resolveOutput({ format: 'json' }), () => {
      process.stdout.write('Fight Club\n')
    })

    expect(output.stdout()).toBe('{\n  "id": 550\n}\n')
  })

  it('prints a single line for --compact', () => {
    const output = captureOutput()
    printResult(
      { id: 550, title: 'Fight Club' },
      resolveOutput({ compact: true, json: true }),
      () => {},
    )

    expect(output.stdout()).toBe('{"id":550,"title":"Fight Club"}\n')
  })
})

describe('runSafely', () => {
  beforeEach(() => {
    process.exitCode = 0
  })

  it('passes the resolved context to the task', async () => {
    let received: unknown
    await runSafely({ format: 'json' }, async (output) => {
      received = output
    })

    expect(received).toEqual({ compact: false, format: 'json' })
  })

  it('writes structured errors to stderr in JSON mode', async () => {
    const output = captureOutput()
    await runSafely({ format: 'json' }, async () => {
      throw new CliError('bad input', 2)
    })

    expect(output.stdout()).toBe('')
    expect(output.stderr()).toBe(
      '{"type":"error","kind":"usage","message":"bad input","exitCode":2}\n',
    )
    expect(process.exitCode).toBe(2)
  })

  it('keeps text errors for the default format', async () => {
    const output = captureOutput()
    await runSafely({}, async () => {
      throw new CliError('bad input', 2)
    })

    expect(output.stderr()).toBe('bad input\n')
  })

  it('reports an invalid --format as a text usage error', async () => {
    const output = captureOutput()
    await runSafely({ format: 'yaml' }, async () => {})

    expect(output.stdout()).toBe('')
    expect(output.stderr()).toBe('Invalid --format "yaml". Expected one of: text, json.\n')
    expect(process.exitCode).toBe(2)
  })

  it('keeps JSON errors when --json conflicts with --format text', async () => {
    const output = captureOutput()
    await runSafely({ format: 'text', json: true }, async () => {})

    expect(JSON.parse(output.stderr())).toMatchObject({ kind: 'usage', exitCode: 2 })
  })

  it('leaves the exit code untouched on success', async () => {
    const output = captureOutput()
    await runSafely({}, async () => {})

    expect(output.stdout()).toBe('')
    expect(output.stderr()).toBe('')
    expect(process.exitCode).toBe(0)
  })
})
