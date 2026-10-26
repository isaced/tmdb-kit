import type { PagedResponse } from '../index'
import { CliError, errorMessage, exitCodeFor, toErrorRecord } from './errors'
import { printJson } from './format'

/** Output formats supported by every API command. */
export const OUTPUT_FORMATS = ['text', 'json', 'ndjson'] as const
export type OutputFormat = (typeof OUTPUT_FORMATS)[number]

/** TMDB refuses page numbers above 500. */
const MAX_PAGE = 500

const FORMAT_ALIASES: Record<string, OutputFormat> = { jsonl: 'ndjson' }

/** Raw `--format`, `--json`, `--compact`, `--fields`, and `--all` arguments. */
export interface OutputArgs {
  'max-items'?: string
  all?: boolean
  compact?: boolean
  fields?: string
  format?: string
  json?: boolean
}

/** Resolved output settings for a single command invocation. */
export interface OutputContext {
  readonly all?: boolean
  readonly compact: boolean
  readonly fields?: readonly string[]
  readonly format: OutputFormat
  readonly maxItems?: number
}

/** Capabilities that affect which output flags are valid. */
export interface OutputOptions {
  /** Whether the command can follow pagination with `--all` / `--max-items`. */
  paginated?: boolean
}

/** One line of `--format ndjson` output. */
export type NdjsonRecord =
  | ({ type: 'meta' } & Record<string, unknown>)
  | { type: 'item'; index: number; value: unknown }
  | { type: 'summary'; count: number; pages: number }
  | { type: 'result'; value: unknown }

/** A paginated command's data source for {@link printPaged}. */
export interface PagedOutputOptions<T> {
  fetchPage: (page: number) => Promise<PagedResponse<T>>
  output: OutputContext
  renderText: (response: PagedResponse<T>) => void
  startPage: number
}

/**
 * Resolve `--format` / `--json` / `--compact` / `--fields` / `--all` into a context.
 *
 * `--json` is an alias for `--format json`. Combining it with any other
 * explicit format is contradictory and rejected as a usage error.
 */
export function resolveOutput(args: OutputArgs, options: OutputOptions = {}): OutputContext {
  const explicitFormat = args.format !== undefined && args.format.trim() !== ''
  const format = parseFormat(args.format)
  const fields = parseFields(args.fields)
  const all = args.all === true
  const maxItems = parseMaxItems(args['max-items'])

  if (args.json && explicitFormat && format !== 'json') {
    throw new CliError(`--json cannot be combined with --format ${format}.`, 2)
  }

  const resolvedFormat = args.json ? 'json' : format

  if (fields && resolvedFormat === 'text') {
    throw new CliError('--fields requires --format json or ndjson.', 2)
  }

  if (all || maxItems !== undefined) {
    if (resolvedFormat !== 'ndjson') {
      throw new CliError(`${all ? '--all' : '--max-items'} requires --format ndjson.`, 2)
    }
    if (options.paginated !== true) {
      throw new CliError(`${all ? '--all' : '--max-items'} is only supported by list commands.`, 2)
    }
  }

  return {
    ...(all ? { all: true } : {}),
    compact: args.compact === true,
    ...(fields ? { fields } : {}),
    format: resolvedFormat,
    ...(maxItems !== undefined ? { maxItems } : {}),
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
 * Print a paginated response.
 *
 * Text and JSON output read a single page. NDJSON streams `meta`, one
 * `item` per result, and a closing `summary`; with `--all` it keeps
 * requesting pages until TMDB runs out or `--max-items` is reached.
 */
export async function printPaged<T>({
  fetchPage,
  output,
  renderText,
  startPage,
}: PagedOutputOptions<T>): Promise<void> {
  let response = await fetchPage(startPage)

  if (output.format === 'text') {
    renderText(response)
    return
  }

  if (output.format === 'json') {
    printJson(output.fields ? projectPayload(response, output.fields) : response, output.compact)
    return
  }

  const maxItems = output.maxItems ?? Number.POSITIVE_INFINITY
  let page = startPage
  let pages = 0
  let count = 0

  writeNdjson({ ...envelopeOf(response), type: 'meta' })

  while (true) {
    pages += 1

    for (const item of response.results) {
      if (count >= maxItems) {
        break
      }

      writeNdjson({
        type: 'item',
        index: count,
        value: output.fields ? projectRecord(item, output.fields, count === 0) : item,
      })
      count += 1
    }

    if (!output.all || count >= maxItems || response.results.length === 0) {
      break
    }
    if (page >= Math.min(response.total_pages, MAX_PAGE)) {
      break
    }

    page += 1
    response = await fetchPage(page)
  }

  writeNdjson({ type: 'summary', count, pages })
}

/**
 * Run a command body, resolving the output context first so usage errors
 * honour the requested format as well.
 */
export async function runSafely(
  args: OutputArgs,
  task: (output: OutputContext) => Promise<void>,
  options: OutputOptions = {},
): Promise<void> {
  let output: OutputContext | undefined

  try {
    output = resolveOutput(args, options)
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
  const wantsJson =
    args.json === true || format === 'json' || format === 'jsonl' || format === 'ndjson'

  return {
    compact: args.compact === true,
    format: wantsJson ? 'json' : 'text',
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

function parseMaxItems(value: string | undefined): number | undefined {
  if (value === undefined) {
    return undefined
  }

  const maxItems = Number(value)
  if (!Number.isInteger(maxItems) || maxItems < 1) {
    throw new CliError('Invalid --max-items value: expected a positive integer.', 2)
  }

  return maxItems
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

    writeNdjson({ type: 'summary', count: results.length, pages: 1 })
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

function envelopeOf(response: PagedResponse<unknown>): Record<string, unknown> {
  const envelope: Record<string, unknown> = { ...response }
  delete envelope.results
  return envelope
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
