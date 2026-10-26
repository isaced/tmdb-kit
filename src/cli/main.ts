import {
  defineCommand,
  renderUsage,
  runMain,
  type ArgsDef,
  type CommandDef,
} from 'citty'
import { CLI_VERSION, mainCommand } from './command'

await runMain(mainCommand, { showUsage: showFullUsage })

async function showFullUsage<T extends ArgsDef = ArgsDef>(
  cmd: CommandDef<T>,
  parent?: CommandDef<T>,
): Promise<void> {
  const path = await findPath(mainCommand, cmd as CommandDef)

  if (!parent || !path) {
    process.stdout.write(`${await renderUsage(cmd)}\n`)
    return
  }

  const parentName = ['tmdb', ...path.slice(0, -1)].join(' ')
  const usageParent = defineCommand({
    meta: { name: parentName, version: CLI_VERSION },
  }) as CommandDef<T>
  process.stdout.write(`${await renderUsage(cmd, usageParent)}\n`)
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
