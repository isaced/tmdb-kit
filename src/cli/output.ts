import { CliError, errorMessage, exitCodeFor, toErrorRecord } from './errors'
import { printJson } from './format'

/** Output formats supported by every API command. */
export const OUTPUT_FORMATS = ['text', 'json'] as const
export type OutputFormat = (typeof OUTPUT_FORMATS)[number]

/** Raw `--format`, `--json`, and `--compact` arguments. */
export interface OutputArgs {
  compact?: boolean
  format?: string
  json?: boolean
}

/** Resolved output settings for a single command invocation. */
export interface OutputContext {
  readonly compact: boolean
  readonly format: OutputFormat
}

/**
 * Resolve `--format` / `--json` / `--compact` into a context.
 *
 * `--json` is an alias for `--format json`. Combining it with an explicit
 * `--format text` is contradictory and rejected as a usage error.
 */
export function resolveOutput(args: OutputArgs): OutputContext {
  const explicitFormat = args.format !== undefined && args.format.trim() !== ''
  const format = parseFormat(args.format)

  if (args.json && explicitFormat && format === 'text') {
    throw new CliError('--json cannot be combined with --format text.', 2)
  }

  return {
    compact: args.compact === true,
    format: args.json ? 'json' : format,
  }
}

/** Print a command result as JSON or delegate to its text renderer. */
export function printResult(value: unknown, output: OutputContext, renderText: () => void): void {
  if (output.format === 'json') {
    printJson(value, output.compact)
    return
  }

  renderText()
}

/**
 * Run a command body, resolving the output context first so usage errors
 * honour `--format json` as well.
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
  if (output.format === 'json') {
    process.stderr.write(`${JSON.stringify(toErrorRecord(error))}\n`)
    return
  }

  process.stderr.write(`${errorMessage(error)}\n`)
}

/**
 * Best-effort context when `resolveOutput` itself failed. An invalid
 * `--format` value cannot be honoured, so it falls back to text.
 */
function fallbackOutput(args: OutputArgs): OutputContext {
  const format = args.format?.trim().toLowerCase()
  return {
    compact: args.compact === true,
    format: args.json || format === 'json' ? 'json' : 'text',
  }
}

function parseFormat(value: string | undefined): OutputFormat {
  if (value === undefined || value === '') {
    return 'text'
  }

  const format = value.trim().toLowerCase()
  if (!(OUTPUT_FORMATS as readonly string[]).includes(format)) {
    throw new CliError(
      `Invalid --format "${value}". Expected one of: ${OUTPUT_FORMATS.join(', ')}.`,
      2,
    )
  }

  return format as OutputFormat
}
