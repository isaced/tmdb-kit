import { defineCommand, renderUsage, runCommand, type CommandDef, type Resolvable } from 'citty'
import { CLI_VERSION, mainCommand } from './command'
import { CliError, toErrorRecord } from './errors'
import { AUTHENTICATION_HELP } from './help'
import { resolveOutput, type OutputArgs, type OutputContext } from './output'

const rawArgs = process.argv.slice(2)

if (rawArgs.length === 0) {
  await showFullUsage(mainCommand)
  process.exitCode = 1
} else if (rawArgs.some((arg) => arg === '--help' || arg === '-h')) {
  await showFullUsage(await resolveCommand(rawArgs))
} else if (isVersionRequest(rawArgs)) {
  process.stdout.write(`${CLI_VERSION}\n`)
} else {
  try {
    await runCommand(mainCommand, { rawArgs })
  } catch (error) {
    reportUsageError(error, rawArgs)
  }
}

/**
 * Report an argument-parsing failure from citty.
 *
 * citty throws before a command's `run` executes, so these errors never reach
 * `runSafely`. Resolve the requested format from the raw arguments to keep
 * the JSON error contract intact.
 */
function reportUsageError(error: unknown, args: string[]): void {
  const output = outputFromArgs(args)
  const message = stripAnsi(error instanceof Error ? error.message : String(error))
  const usageError = new CliError(message, 2)

  if (output.format === 'json') {
    process.stderr.write(`${JSON.stringify(toErrorRecord(usageError))}\n`)
  } else {
    process.stderr.write(`${message}\n`)
  }

  process.exitCode = 2
}

function outputFromArgs(args: string[]): OutputContext {
  const outputArgs: OutputArgs = {}

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]
    if (arg === '--json') {
      outputArgs.json = true
    } else if (arg === '--compact') {
      outputArgs.compact = true
    } else if (arg === '--format') {
      outputArgs.format = args[index + 1]
      index += 1
    } else if (arg.startsWith('--format=')) {
      outputArgs.format = arg.slice('--format='.length)
    }
  }

  try {
    return resolveOutput(outputArgs)
  } catch {
    return { compact: false, format: 'text' }
  }
}

function isVersionRequest(args: string[]): boolean {
  return args.length === 1 && (args[0] === '--version' || args[0] === '-v')
}

/** citty colors its argument errors; JSON and plain text should not carry ANSI codes. */
function stripAnsi(value: string): string {
  return value.replace(/\u001B\[[0-9;]*m/g, '')
}

/** Find the command targeted by `--help` by walking leading subcommand names. */
async function resolveCommand(args: string[]): Promise<CommandDef> {
  let command: CommandDef = mainCommand

  for (const arg of args) {
    if (arg.startsWith('-')) {
      continue
    }

    const subCommands = (await resolveValue(command.subCommands)) as
      Record<string, Resolvable<CommandDef>> | undefined
    const next = subCommands?.[arg]
    if (next === undefined) {
      break
    }

    command = (await resolveValue(next)) as CommandDef
  }

  return command
}

async function showFullUsage(command: CommandDef): Promise<void> {
  const path = await findPath(mainCommand, command)

  if (!path || path.length === 0) {
    const usage = await renderUsage(command)
    const authentication = command === mainCommand ? `\n\n${AUTHENTICATION_HELP}` : ''
    process.stdout.write(`${usage}${authentication}\n`)
    return
  }

  const parentName = ['tmdb', ...path.slice(0, -1)].join(' ')
  const parent = defineCommand({
    meta: { name: parentName, version: CLI_VERSION },
  }) as CommandDef

  process.stdout.write(`${await renderUsage(command, parent)}\n`)
}

async function findPath(
  root: CommandDef,
  target: CommandDef,
  path: string[] = [],
): Promise<string[] | undefined> {
  if (root === target) {
    return path
  }

  const subCommands = await resolveValue(root.subCommands)
  if (!subCommands) {
    return undefined
  }

  for (const [name, subCommand] of Object.entries(subCommands)) {
    const resolved = await resolveValue(subCommand)
    if (!resolved) {
      continue
    }

    const found = await findPath(resolved, target, [...path, name])
    if (found) {
      return found
    }
  }

  return undefined
}

async function resolveValue<T>(
  value: T | Promise<T> | (() => T | Promise<T>) | undefined,
): Promise<T | undefined> {
  if (value === undefined) {
    return undefined
  }
  if (typeof value === 'function') {
    return await (value as () => T | Promise<T>)()
  }
  return await value
}
