import {
  existsSync,
  mkdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it, vi } from 'bun:test'
import {
  getConfigPath,
  readConfig,
  setConfigValue,
  unsetConfigValue,
} from '../../src/cli/config'
import { CliError } from '../../src/cli/errors'
import { mockPlatform, useCliTestEnv } from './helpers'

describe('CLI config', () => {
  const env = useCliTestEnv()

  it('uses XDG_CONFIG_HOME outside Windows', () => {
    mockPlatform('darwin')
    process.env.XDG_CONFIG_HOME = '/tmp/tmdb-xdg'

    expect(getConfigPath()).toBe(join('/tmp/tmdb-xdg', 'tmdb', 'config.json'))
  })

  it('falls back to the home directory when XDG_CONFIG_HOME is unset', () => {
    mockPlatform('darwin')
    delete process.env.XDG_CONFIG_HOME

    expect(getConfigPath()).toBe(join(homedir(), '.config', 'tmdb', 'config.json'))
  })

  it('uses APPDATA on Windows', () => {
    mockPlatform('win32')
    process.env.APPDATA = '/tmp/tmdb-appdata'

    expect(getConfigPath()).toBe(join('/tmp/tmdb-appdata', 'tmdb', 'config.json'))
  })

  it('falls back to the home directory when APPDATA is unset', () => {
    mockPlatform('win32')
    delete process.env.APPDATA

    expect(getConfigPath()).toBe(join(homedir(), 'tmdb', 'config.json'))
  })

  it('returns an empty config when the file does not exist', () => {
    expect(readConfig()).toEqual({})
  })

  it('reads a valid config file', () => {
    writeConfig({ accessToken: 'token', language: 'zh-CN' })

    expect(readConfig()).toEqual({ accessToken: 'token', language: 'zh-CN' })
  })

  it('rejects invalid JSON', () => {
    writeConfig('{')

    expect(() => readConfig()).toThrowError(CliError)
  })

  it('rejects non-object JSON', () => {
    writeConfig([])

    expect(() => readConfig()).toThrowError(CliError)
  })

  it('rejects non-string config fields', () => {
    writeConfig({ accessToken: 123 })

    expect(() => readConfig()).toThrowError(CliError)
  })

  it('reports read failures', () => {
    mkdirSync(env.configPath(), { recursive: true })

    expect(() => readConfig()).toThrowError(/Failed to read config file/)
  })

  it('writes and preserves config values with secure permissions', () => {
    setConfigValue('accessToken', 'token')
    setConfigValue('language', 'zh-CN')

    expect(readConfig()).toMatchObject({
      accessToken: 'token',
      language: 'zh-CN',
    })

    if (process.platform !== 'win32') {
      expect(statSync(env.configPath()).mode & 0o777).toBe(0o600)
      expect(statSync(dirname(env.configPath())).mode & 0o777).toBe(0o700)
    }
  })

  it('removes config values while preserving the rest', () => {
    setConfigValue('accessToken', 'token')
    setConfigValue('region', 'CN')

    unsetConfigValue('accessToken')

    expect(readConfig()).toMatchObject({ region: 'CN' })
    expect(readConfig().accessToken).toBeUndefined()
  })

  it('reports write failures and removes the temp file', () => {
    if (process.platform === 'win32') {
      return
    }

    vi.spyOn(Date, 'now').mockReturnValue(123)
    const path = env.configPath()
    const tempPath = `${path}.${process.pid}.123.tmp`
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(tempPath, '', { mode: 0o400 })

    try {
      expect(() => setConfigValue('language', 'zh-CN')).toThrowError(
        /Failed to write config file/,
      )
      expect(existsSync(tempPath)).toBe(false)
    } finally {
      if (existsSync(tempPath)) {
        unlinkSync(tempPath)
      }
    }
  })

  function writeConfig(value: unknown): void {
    const path = env.configPath()
    mkdirSync(dirname(path), { recursive: true })
    writeFileSync(path, typeof value === 'string' ? value : JSON.stringify(value))
  }
})
