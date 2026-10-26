import {
  chmodSync,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { CliError } from './errors'

export interface CliConfig {
  accessToken?: string
  apiKey?: string
  language?: string
  region?: string
}

export type ConfigField = keyof CliConfig

export function getConfigPath(): string {
  if (process.platform === 'win32') {
    return join(process.env.APPDATA ?? homedir(), 'tmdb', 'config.json')
  }

  const configHome = process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config')
  return join(configHome, 'tmdb', 'config.json')
}

export function readConfig(): CliConfig {
  const path = getConfigPath()

  let raw: string
  try {
    raw = readFileSync(path, 'utf8')
  } catch (error) {
    if (isNotFound(error)) {
      return {}
    }
    throw new CliError(`Failed to read config file at ${path}: ${messageOf(error)}`, 3)
  }

  try {
    const parsed: unknown = JSON.parse(raw)
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('expected a JSON object')
    }

    const record = parsed as Record<string, unknown>
    return {
      accessToken: readStringField(record, 'accessToken'),
      apiKey: readStringField(record, 'apiKey'),
      language: readStringField(record, 'language'),
      region: readStringField(record, 'region'),
    }
  } catch (error) {
    throw new CliError(`Invalid config file at ${path}: ${messageOf(error)}`, 3)
  }
}

export function setConfigValue(field: ConfigField, value: string): void {
  writeConfig({ ...readConfig(), [field]: value })
}

export function unsetConfigValue(field: ConfigField): void {
  const config = readConfig()
  delete config[field]
  writeConfig(config)
}

export function writeConfig(config: CliConfig): void {
  const path = getConfigPath()
  const directory = dirname(path)
  const tempPath = `${path}.${process.pid}.${Date.now()}.tmp`

  try {
    mkdirSync(directory, { recursive: true, mode: 0o700 })
    if (process.platform !== 'win32') {
      chmodSync(directory, 0o700)
    }

    writeFileSync(tempPath, `${JSON.stringify(config, null, 2)}\n`, {
      mode: 0o600,
    })
    if (process.platform !== 'win32') {
      chmodSync(tempPath, 0o600)
    }

    renameSync(tempPath, path)
    if (process.platform !== 'win32') {
      chmodSync(path, 0o600)
    }
  } catch (error) {
    if (existsSync(tempPath)) {
      unlinkSync(tempPath)
    }
    throw new CliError(`Failed to write config file at ${path}: ${messageOf(error)}`, 3)
  }
}

function readStringField(
  record: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = record[key]
  if (value === undefined) {
    return undefined
  }
  if (typeof value !== 'string') {
    throw new Error(`${key} must be a string`)
  }
  return value
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ENOENT'
  )
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
