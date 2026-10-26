import { runCommand } from 'citty'
import { describe, expect, it } from 'vitest'
import { configCommand } from '../../../src/cli/commands/config'
import { readConfig, setConfigValue } from '../../../src/cli/config'
import { movieDetails } from '../fixtures'
import {
  captureOutput,
  jsonResponse,
  mockFetch,
  useCliTestEnv,
  withStdin,
} from '../helpers'

describe('config command', () => {
  const env = useCliTestEnv()

  it('prints the config path', async () => {
    const output = captureOutput()
    await runCommand(configCommand, { rawArgs: ['path'] })

    expect(output.stdout().trim()).toBe(env.configPath())
  })

  it('shows an empty config', async () => {
    const output = captureOutput()
    await runCommand(configCommand, { rawArgs: ['show'] })

    expect(output.stdout()).toContain(`Path: ${env.configPath()}`)
    expect(output.stdout()).toContain('accessToken: (not set)')
    expect(output.stdout()).toContain('apiKey: (not set)')
    expect(output.stdout()).toContain('language: (not set)')
  })

  it('sets and shows language and region values', async () => {
    await runCommand(configCommand, {
      rawArgs: ['set', 'language', 'zh-CN'],
    })
    await runCommand(configCommand, {
      rawArgs: ['set', 'region', 'cn'],
    })

    expect(readConfig()).toMatchObject({ language: 'zh-CN', region: 'CN' })

    const output = captureOutput()
    await runCommand(configCommand, { rawArgs: ['show'] })

    expect(output.stdout()).toContain('language: zh-CN')
    expect(output.stdout()).toContain('region: CN')
  })

  it('shows config as JSON with secrets masked', async () => {
    setConfigValue('accessToken', 'abcdef')
    setConfigValue('apiKey', 'ghijkl')

    const output = captureOutput()
    await runCommand(configCommand, { rawArgs: ['show', '--json'] })

    const view = JSON.parse(output.stdout())
    expect(view.accessToken).toBe('••••cdef')
    expect(view.apiKey).toBe('••••ijkl')
    expect(output.stdout()).not.toContain('abcdef')
    expect(output.stdout()).not.toContain('ghijkl')
  })

  it('labels template placeholders', async () => {
    setConfigValue('accessToken', 'YOUR_TMDB_ACCESS_TOKEN')

    const output = captureOutput()
    await runCommand(configCommand, { rawArgs: ['show'] })

    expect(output.stdout()).toContain('accessToken: (placeholder)')
  })

  it('masks short secrets completely', async () => {
    setConfigValue('accessToken', 'abc')

    const output = captureOutput()
    await runCommand(configCommand, { rawArgs: ['show'] })

    expect(output.stdout()).toContain('accessToken: ••••')
    expect(output.stdout()).not.toContain('accessToken: abc')
  })

  it('sets an access token from stdin without echoing it', async () => {
    await withStdin('secret-token\n', async () => {
      const output = captureOutput()
      await runCommand(configCommand, { rawArgs: ['set', 'token'] })

      expect(readConfig().accessToken).toBe('secret-token')
      expect(output.stdout()).toContain('Saved accessToken')
      expect(output.stdout()).not.toContain('secret-token')
    })
  })

  it('rejects an empty secret', async () => {
    await withStdin('\n', async () => {
      const output = captureOutput()
      await runCommand(configCommand, { rawArgs: ['set', 'token'] })

      expect(process.exitCode).toBe(2)
      expect(output.stderr()).toContain('Secret must not be empty')
    })
  })

  it('sets an API key from stdin', async () => {
    await withStdin('api-key-value\n', async () => {
      captureOutput()
      await runCommand(configCommand, { rawArgs: ['set', 'api-key'] })

      expect(readConfig().apiKey).toBe('api-key-value')
    })
  })

  it('rejects secrets passed as arguments', async () => {
    const output = captureOutput()

    await runCommand(configCommand, { rawArgs: ['set', 'token', 'leak'] })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('Do not pass secrets as command arguments')
  })

  it('requires a value for non-secret keys', async () => {
    const output = captureOutput()

    await runCommand(configCommand, { rawArgs: ['set', 'language'] })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('A value is required for language')
  })

  it('rejects unknown config keys', async () => {
    const output = captureOutput()

    await runCommand(configCommand, { rawArgs: ['set', 'unknown', 'x'] })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('Unknown config key')
  })

  it('unsets a config value', async () => {
    setConfigValue('language', 'zh-CN')
    const output = captureOutput()

    await runCommand(configCommand, { rawArgs: ['unset', 'language'] })

    expect(readConfig().language).toBeUndefined()
    expect(output.stdout()).toContain('Removed language')
  })

  it('tests the TMDB connection with an authenticated request', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(movieDetails()))
    const output = captureOutput()

    await runCommand(configCommand, { rawArgs: ['test'] })

    expect(output.stdout()).toContain('TMDB connection OK')
    expect(output.stdout()).toContain('Credentials are valid.')
    expect(calls[0]?.pathname.endsWith('/movie/550')).toBe(true)
  })

  it('prints the connection test as JSON', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    mockFetch(() => jsonResponse(movieDetails()))
    const output = captureOutput()

    await runCommand(configCommand, { rawArgs: ['test', '--json'] })

    expect(JSON.parse(output.stdout())).toEqual({ ok: true })
  })
})
