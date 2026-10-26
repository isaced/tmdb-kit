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

  it('accepts ndjson and the jsonl alias', () => {
    expect(resolveOutput({ format: 'ndjson' })).toEqual({ compact: false, format: 'ndjson' })
    expect(resolveOutput({ format: 'jsonl' })).toEqual({ compact: false, format: 'ndjson' })
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

  it('rejects contradictory --json and --format ndjson', () => {
    expect(() => resolveOutput({ json: true, format: 'ndjson' })).toThrow(
      '--json cannot be combined with --format ndjson.',
    )
  })

  it('rejects unknown formats', () => {
    expect(() => resolveOutput({ format: 'yaml' })).toThrow(
      'Invalid --format "yaml". Expected one of: text, json, ndjson.',
    )
  })

  it('tracks --compact', () => {
    expect(resolveOutput({ compact: true, json: true })).toEqual({
      compact: true,
      format: 'json',
    })
  })

  it('normalizes --fields', () => {
    expect(resolveOutput({ fields: ' id, id ,title ', format: 'json' }).fields).toEqual([
      'id',
      'title',
    ])
  })

  it('rejects --fields without a JSON format', () => {
    expect(() => resolveOutput({ fields: 'id' })).toThrow(
      '--fields requires --format json or ndjson.',
    )
  })

  it('rejects an empty field list', () => {
    expect(() => resolveOutput({ fields: ' , ', format: 'json' })).toThrow(
      '--fields requires at least one field name.',
    )
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

describe('ndjson output', () => {
  const output = resolveOutput({ format: 'ndjson' })

  function lines(captured: ReturnType<typeof captureOutput>) {
    return captured
      .stdout()
      .trimEnd()
      .split('\n')
      .map((line) => JSON.parse(line))
  }

  it('streams paged responses as meta, items, and summary', () => {
    const captured = captureOutput()
    printResult(
      {
        page: 1,
        results: [
          { id: 1, title: 'A' },
          { id: 2, title: 'B' },
        ],
        total_pages: 3,
        total_results: 6,
      },
      output,
      () => {
        throw new Error('text renderer must not run')
      },
    )

    expect(lines(captured)).toEqual([
      { page: 1, total_pages: 3, total_results: 6, type: 'meta' },
      { type: 'item', index: 0, value: { id: 1, title: 'A' } },
      { type: 'item', index: 1, value: { id: 2, title: 'B' } },
      { type: 'summary', count: 2 },
    ])
  })

  it('emits a single result record for detail responses', () => {
    const captured = captureOutput()
    printResult({ id: 550, title: 'Fight Club' }, output, () => {})

    expect(JSON.parse(captured.stdout())).toEqual({
      type: 'result',
      value: { id: 550, title: 'Fight Club' },
    })
  })

  it('keeps the envelope of non-paged collections in meta', () => {
    const captured = captureOutput()
    printResult({ id: 550, results: [{ id: 'a' }] }, output, () => {})

    const [meta, item, summary] = lines(captured)
    expect(meta).toEqual({ id: 550, type: 'meta' })
    expect(item).toEqual({ type: 'item', index: 0, value: { id: 'a' } })
    expect(summary).toEqual({ type: 'summary', count: 1 })
  })

  it('projects fields on every item', () => {
    const captured = captureOutput()
    printResult(
      {
        page: 1,
        results: [{ id: 1, overview: 'x', title: 'A' }],
        total_pages: 1,
        total_results: 1,
      },
      resolveOutput({ fields: 'id,title', format: 'ndjson' }),
      () => {},
    )

    expect(lines(captured)[1]).toEqual({ type: 'item', index: 0, value: { id: 1, title: 'A' } })
  })

  it('projects fields on a single result', () => {
    const captured = captureOutput()
    printResult(
      { id: 550, overview: 'x', title: 'Fight Club' },
      resolveOutput({ fields: 'title', format: 'ndjson' }),
      () => {},
    )

    expect(JSON.parse(captured.stdout())).toEqual({
      type: 'result',
      value: { title: 'Fight Club' },
    })
  })
})

describe('--fields projection', () => {
  it('projects detail responses in the requested order', () => {
    const captured = captureOutput()
    printResult(
      { id: 550, overview: 'x', title: 'Fight Club' },
      resolveOutput({ fields: 'title,id', format: 'json' }),
      () => {},
    )

    expect(captured.stdout()).toBe('{\n  "title": "Fight Club",\n  "id": 550\n}\n')
  })

  it('projects results and keeps pagination metadata', () => {
    const captured = captureOutput()
    printResult(
      {
        page: 1,
        results: [
          { id: 1, overview: 'x', title: 'A' },
          { id: 2, title: 'B' },
        ],
        total_pages: 1,
        total_results: 2,
      },
      resolveOutput({ fields: 'id,title', format: 'json' }),
      () => {},
    )

    expect(JSON.parse(captured.stdout())).toEqual({
      page: 1,
      results: [
        { id: 1, title: 'A' },
        { id: 2, title: 'B' },
      ],
      total_pages: 1,
      total_results: 2,
    })
  })

  it('omits requested fields that a record does not have', () => {
    const captured = captureOutput()
    printResult(
      { results: [{ id: 1, name: 'TV' }] },
      resolveOutput({ fields: 'id,title', format: 'json' }),
      () => {},
    )

    expect(JSON.parse(captured.stdout())).toEqual({ results: [{ id: 1 }] })
  })

  it('leaves empty collections untouched', () => {
    const captured = captureOutput()
    printResult(
      { page: 1, results: [], total_pages: 0, total_results: 0 },
      resolveOutput({ fields: 'id', format: 'json' }),
      () => {},
    )

    expect(JSON.parse(captured.stdout())).toEqual({
      page: 1,
      results: [],
      total_pages: 0,
      total_results: 0,
    })
  })

  it('rejects fields that match nothing', () => {
    expect(() =>
      printResult({ id: 1 }, resolveOutput({ fields: 'nope', format: 'json' }), () => {}),
    ).toThrow('Unknown --fields value(s): nope. Available: id.')
  })

  it('rejects non-object payloads', () => {
    expect(() =>
      printResult('text', resolveOutput({ fields: 'id', format: 'json' }), () => {}),
    ).toThrow('--fields requires an object response.')
  })

  it('rejects non-object records in a collection', () => {
    expect(() =>
      printResult({ results: ['text'] }, resolveOutput({ fields: 'id', format: 'json' }), () => {}),
    ).toThrow('--fields requires object records.')
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

  it('writes structured errors to stderr in NDJSON mode', async () => {
    const output = captureOutput()
    await runSafely({ format: 'ndjson' }, async () => {
      throw new CliError('bad input', 2)
    })

    expect(output.stdout()).toBe('')
    expect(JSON.parse(output.stderr())).toMatchObject({ kind: 'usage', exitCode: 2 })
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
    expect(output.stderr()).toBe('Invalid --format "yaml". Expected one of: text, json, ndjson.\n')
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
