import { CliError, errorMessage, exitCodeFor, toErrorRecord } from './errors'
import { printJson } from './format'

/** Output formats supported by every API command. */
export const OUTPUT_FORMATS = ['text', 'json', 'ndjson'] as const
export type OutputFormat = (typeof OUTPUT_FORMATS)[number]

const FORMAT_ALIASES: Record<string, OutputFormat> = { jsonl: 'ndjson' }

/** Raw `--format`, `--json`, `--compact`, and `--fields` arguments. */
export interface OutputArgs {
  compact?: boolean
  fields?: string
  format?: string
  json?: boolean
}

/** Resolved output settings for a single command invocation. */
export interface OutputContext {
  readonly compact: boolean
  readonly fields?: readonly string[]
  readonly format: OutputFormat
}

/** One line of `--format ndjson` output. */
export type NdjsonRecord =
  | ({ type: 'meta' } & Record<string, unknown>)
  | { type: 'item'; index: number; value: unknown }
  | { type: 'summary'; count: number }
  | { type: 'result'; value: unknown }

/**
 * Resolve `--format` / `--json` / `--compact` / `--fields` into a context.
 *
 * `--json` is an alias for `--format json`. Combining it with any other
 * explicit format is contradictory and rejected as a usage error.
 */
export function resolveOutput(args: OutputArgs): OutputContext {
  const explicitFormat = args.format !== undefined && args.format.trim() !== ''
  const format = parseFormat(args.format)
  const fields = parseFields(args.fields)

  if (args.json && explicitFormat && format !== 'json') {
    throw new CliError(`--json cannot be combined with --format ${format}.`, 2)
  }

  const resolvedFormat = args.json ? 'json' : format

  if (fields && resolvedFormat === 'text') {
    throw new CliError('--fields requires --format json or ndjson.', 2)
  }

  return {
    compact: args.compact === true,
    ...(fields ? { fields } : {}),
    format: resolvedFormat,
  }
}

/** Print a command result as JSON, NDJSON, or delegate to its text renderer. */
export function printResult(value: unknown, output: OutputContext, renderText: () => void): void {
  if (output.format === 'text') {
    renderText()
    return
  }

  if (output.format === 'json') {
    printJson(output.fields ? projectPayload(value, output.fields) : value, output.compact)
    return
  }

  printNdjson(value, output)
}

/**
 * Run a command body, resolving the output context first so usage errors
 * honour the requested format as well.
 */
export async function runSafely(
  args: OutputArgs,
  task: (output: OutputContext) => Promise<void>,
): Promise<void> {
  let output: OutputContext | undefined

  try {
    output = resolveOutput(args)
    await task(output)
  } catch (error) {
    writeError(error, output ?? fallbackOutput(args))
    process.exitCode = exitCodeFor(error)
  }
}

function writeError(error: unknown, output: OutputContext): void {
  if (output.format === 'text') {
    process.stderr.write(`${errorMessage(error)}\n`)
    return
  }

  process.stderr.write(`${JSON.stringify(toErrorRecord(error))}\n`)
}

/**
 * Best-effort context when `resolveOutput` itself failed. An invalid
 * `--format` value cannot be honoured, so it falls back to text.
 */
function fallbackOutput(args: OutputArgs): OutputContext {
  const format = args.format?.trim().toLowerCase()
  return {
    compact: args.compact === true,
    format: args.json || format === 'json' || format === 'jsonl' ? 'json' : 'text',
  }
}

function parseFormat(value: string | undefined): OutputFormat {
  if (value === undefined || value === '') {
    return 'text'
  }

  const requested = value.trim().toLowerCase()
  const format = FORMAT_ALIASES[requested] ?? requested

  if (!(OUTPUT_FORMATS as readonly string[]).includes(format)) {
    throw new CliError(
      `Invalid --format "${value}". Expected one of: ${OUTPUT_FORMATS.join(', ')}.`,
      2,
    )
  }

  return format as OutputFormat
}

function parseFields(value: string | undefined): string[] | undefined {
  if (value === undefined) {
    return undefined
  }

  const fields = [
    ...new Set(
      value
        .split(',')
        .map((field) => field.trim())
        .filter(Boolean),
    ),
  ]
  if (fields.length === 0) {
    throw new CliError('--fields requires at least one field name.', 2)
  }

  return fields
}

function printNdjson(value: unknown, output: OutputContext): void {
  if (isRecord(value) && Array.isArray(value.results)) {
    const { results, ...envelope } = value

    writeNdjson({ ...envelope, type: 'meta' })

    results.forEach((item, index) => {
      writeNdjson({
        type: 'item',
        index,
        value: output.fields ? projectRecord(item, output.fields, index === 0) : item,
      })
    })

    writeNdjson({ type: 'summary', count: results.length })
    return
  }

  writeNdjson({
    type: 'result',
    value: output.fields ? projectRecord(value, output.fields, true) : value,
  })
}

function writeNdjson(record: NdjsonRecord): void {
  process.stdout.write(`${JSON.stringify(record)}\n`)
}

/**
 * Apply `--fields` to a JSON payload.
 *
 * List responses keep their envelope and project each `results` entry, so
 * pagination metadata survives the projection.
 */
function projectPayload(value: unknown, fields: readonly string[]): unknown {
  if (!isRecord(value)) {
    throw new CliError('--fields requires an object response.', 2)
  }

  if (Array.isArray(value.results)) {
    return {
      ...value,
      results: value.results.map((item, index) => projectRecord(item, fields, index === 0)),
    }
  }

  return projectRecord(value, fields, true)
}

function projectRecord(
  record: unknown,
  fields: readonly string[],
  validate: boolean,
): Record<string, unknown> {
  if (!isRecord(record)) {
    throw new CliError('--fields requires object records.', 2)
  }

  const projected: Record<string, unknown> = {}
  for (const field of fields) {
    if (Object.hasOwn(record, field)) {
      projected[field] = record[field]
    }
  }

  if (validate && Object.keys(projected).length === 0) {
    throw new CliError(
      `Unknown --fields value(s): ${fields.join(', ')}. Available: ${Object.keys(record).sort().join(', ')}.`,
      2,
    )
  }

  return projected
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
