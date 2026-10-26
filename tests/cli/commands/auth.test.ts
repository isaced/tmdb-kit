import { existsSync } from 'node:fs'
import { runCommand } from 'citty'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { authCommand } from '../../../src/cli/commands/auth'
import { readConfig, setConfigValue } from '../../../src/cli/config'
import { movieDetails } from '../fixtures'
import {
  captureOutput,
  jsonResponse,
  mockFetch,
  useCliTestEnv,
  withStdin,
  withTTY,
} from '../helpers'

const readlineMocks = vi.hoisted(() => {
  const question = vi.fn(async () => 'tty-token')
  const close = vi.fn()
  const createInterface = vi.fn(() => ({
    question,
    close,
    _writeToOutput: () => {},
  }))
  return { close, createInterface, question }
})

vi.mock('node:readline/promises', () => ({
  createInterface: readlineMocks.createInterface,
}))

describe('auth command', () => {
  const env = useCliTestEnv()

  beforeEach(() => {
    readlineMocks.question.mockReset()
    readlineMocks.question.mockResolvedValue('tty-token')
    readlineMocks.createInterface.mockClear()
    readlineMocks.close.mockClear()
  })

  it('validates and saves a token from stdin with --force', async () => {
    setConfigValue('language', 'zh-CN')
    setConfigValue('apiKey', 'old-key')
    const { calls } = mockFetch(() => jsonResponse(movieDetails()))
    const output = captureOutput()

    await withStdin('new-token\n', async () => {
      await runCommand(authCommand, {
        rawArgs: ['login', '--token-stdin', '--force'],
      })
    })

    expect(process.exitCode).toBe(0)
    expect(calls[0]?.pathname.endsWith('/movie/550')).toBe(true)
    expect(readConfig()).toMatchObject({
      accessToken: 'new-token',
      language: 'zh-CN',
    })
    expect(readConfig().apiKey).toBeUndefined()
    expect(output.stdout()).toContain('Token validated.')
    expect(output.stdout()).toContain(env.configPath())
    expect(output.stdout()).not.toContain('new-token')
  })

  it('rejects an empty token', async () => {
    const output = captureOutput()

    await withStdin('\n', async () => {
      await runCommand(authCommand, {
        rawArgs: ['login', '--token-stdin'],
      })
    })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('Token must not be empty')
  })

  it('explains how to pipe a token without a TTY', async () => {
    const output = captureOutput()

    await runCommand(authCommand, { rawArgs: ['login'] })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('No interactive terminal available')
    expect(output.stderr()).toContain('--token-stdin')
  })

  it('refuses to replace config credentials without --force in non-TTY mode', async () => {
    setConfigValue('accessToken', 'old-token')
    const output = captureOutput()

    await withStdin('new-token\n', async () => {
      await runCommand(authCommand, {
        rawArgs: ['login', '--token-stdin'],
      })
    })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain(
      'Existing credentials found: config (accessToken)',
    )
    expect(output.stderr()).toContain('--force')
    expect(readConfig().accessToken).toBe('old-token')
  })

  it('refuses to save a config token over environment credentials without --force', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'env-token'
    const output = captureOutput()

    await withStdin('new-token\n', async () => {
      await runCommand(authCommand, {
        rawArgs: ['login', '--token-stdin'],
      })
    })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain(
      'Existing credentials found: environment (TMDB_ACCESS_TOKEN)',
    )
    expect(output.stderr()).toContain('--force')
    expect(readConfig().accessToken).toBeUndefined()
  })

  it('treats template placeholders as unconfigured', async () => {
    setConfigValue('accessToken', 'YOUR_TMDB_ACCESS_TOKEN')
    mockFetch(() => jsonResponse(movieDetails()))
    captureOutput()

    await withStdin('new-token\n', async () => {
      await runCommand(authCommand, {
        rawArgs: ['login', '--token-stdin'],
      })
    })

    expect(process.exitCode).toBe(0)
    expect(readConfig().accessToken).toBe('new-token')
  })

  it('prompts for a token when stdin is a TTY', async () => {
    mockFetch(() => jsonResponse(movieDetails()))
    const output = captureOutput()

    await withTTY(async () => {
      await runCommand(authCommand, { rawArgs: ['login'] })
    })

    expect(process.exitCode).toBe(0)
    expect(readlineMocks.question).toHaveBeenCalledWith('TMDB access token: ')
    expect(output.stdout()).toContain(
      'Create a token at https://www.themoviedb.org/settings/api',
    )
    expect(readConfig().accessToken).toBe('tty-token')
  })

  it('keeps config credentials when replacement is declined', async () => {
    setConfigValue('accessToken', 'old-token')
    readlineMocks.question.mockResolvedValueOnce('n')
    const output = captureOutput()

    await withTTY(async () => {
      await runCommand(authCommand, { rawArgs: ['login'] })
    })

    expect(process.exitCode).toBe(0)
    expect(readlineMocks.question).toHaveBeenCalledWith(
      'Replace existing credentials? [y/N] ',
    )
    expect(output.stdout()).toContain(
      'Existing credentials: config (accessToken, ••••oken).',
    )
    expect(output.stdout()).toContain('Kept existing credentials.')
    expect(readConfig().accessToken).toBe('old-token')
  })

  it('replaces config credentials after confirmation', async () => {
    setConfigValue('accessToken', 'old-token')
    readlineMocks.question
      .mockResolvedValueOnce('y')
      .mockResolvedValueOnce('new-token')
    mockFetch(() => jsonResponse(movieDetails()))
    captureOutput()

    await withTTY(async () => {
      await runCommand(authCommand, { rawArgs: ['login'] })
    })

    expect(process.exitCode).toBe(0)
    expect(readConfig().accessToken).toBe('new-token')
  })

  it('keeps environment credentials when saving a config token is declined', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'env-token'
    readlineMocks.question.mockResolvedValueOnce('n')
    const output = captureOutput()

    await withTTY(async () => {
      await runCommand(authCommand, { rawArgs: ['login'] })
    })

    expect(process.exitCode).toBe(0)
    expect(readlineMocks.question).toHaveBeenCalledWith(
      'Save a config token anyway? [y/N] ',
    )
    expect(output.stdout()).toContain(
      'Credentials are currently provided by TMDB_ACCESS_TOKEN',
    )
    expect(output.stdout()).toContain('Kept existing credentials.')
    expect(readConfig().accessToken).toBeUndefined()
  })

  it('does not overwrite config when token validation fails', async () => {
    setConfigValue('accessToken', 'old-token')
    mockFetch(() => jsonResponse({ status_message: 'Invalid token' }, 401))
    const output = captureOutput()

    await withStdin('bad-token\n', async () => {
      await runCommand(authCommand, {
        rawArgs: ['login', '--token-stdin', '--force'],
      })
    })

    expect(process.exitCode).toBe(3)
    expect(readConfig().accessToken).toBe('old-token')
    expect(output.stderr()).toContain('Token validation failed')
    expect(output.stderr()).toContain('Existing config was not changed')
  })

  it('reports non-auth validation failures', async () => {
    setConfigValue('accessToken', 'old-token')
    mockFetch(() => jsonResponse({ status_message: 'Server error' }, 500))
    const output = captureOutput()

    await withStdin('new-token\n', async () => {
      await runCommand(authCommand, {
        rawArgs: ['login', '--token-stdin', '--force'],
      })
    })

    expect(process.exitCode).toBe(1)
    expect(readConfig().accessToken).toBe('old-token')
    expect(output.stderr()).toContain('existing config was not changed')
  })

  it('warns when environment credentials override the saved token', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'env-token'
    mockFetch(() => jsonResponse(movieDetails()))
    const output = captureOutput()

    await withStdin('new-token\n', async () => {
      await runCommand(authCommand, {
        rawArgs: ['login', '--token-stdin', '--force'],
      })
    })

    expect(output.stdout()).toContain(
      'TMDB_ACCESS_TOKEN is set and takes precedence',
    )
    expect(readConfig().accessToken).toBe('new-token')
  })

  it('reports environment credentials and shadowed config values', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'env-token'
    setConfigValue('apiKey', 'config-key')
    const output = captureOutput()

    await runCommand(authCommand, { rawArgs: ['status'] })

    expect(output.stdout()).toContain(
      'Credential source: environment (TMDB_ACCESS_TOKEN)',
    )
    expect(output.stdout()).toContain('Token: ••••oken')
    expect(output.stdout()).toContain('shadowed by environment variables')
  })

  it('reports config credentials in human output', async () => {
    setConfigValue('accessToken', 'config-token')
    const output = captureOutput()

    await runCommand(authCommand, { rawArgs: ['status'] })

    expect(output.stdout()).toContain(
      'Credential source: config (accessToken)',
    )
    expect(output.stdout()).toContain('Token: ••••oken')
  })

  it('prints config credential status as JSON', async () => {
    setConfigValue('accessToken', 'config-token')
    setConfigValue('language', 'zh-CN')
    setConfigValue('region', 'CN')
    const output = captureOutput()

    await runCommand(authCommand, { rawArgs: ['status', '--json'] })

    expect(JSON.parse(output.stdout())).toEqual({
      source: 'config',
      environmentVariable: null,
      configField: 'accessToken',
      token: '••••oken',
      configPath: env.configPath(),
      configExists: true,
      language: 'zh-CN',
      region: 'CN',
    })
  })

  it('reports placeholder-only config as unconfigured', async () => {
    setConfigValue('accessToken', 'YOUR_TMDB_ACCESS_TOKEN')
    const output = captureOutput()

    await runCommand(authCommand, { rawArgs: ['status'] })

    expect(output.stdout()).toContain('Credential source: none')
    expect(output.stdout()).toContain('Run `tmdb auth login`')
  })

  it('removes saved credentials on logout', async () => {
    setConfigValue('accessToken', 'config-token')
    setConfigValue('apiKey', 'config-key')
    setConfigValue('language', 'zh-CN')
    const output = captureOutput()

    await runCommand(authCommand, { rawArgs: ['logout'] })

    expect(readConfig().accessToken).toBeUndefined()
    expect(readConfig().apiKey).toBeUndefined()
    expect(readConfig().language).toBe('zh-CN')
    expect(output.stdout()).toContain('Removed API credentials')
  })

  it('does nothing when logout has no saved credentials', async () => {
    const output = captureOutput()

    await runCommand(authCommand, { rawArgs: ['logout'] })

    expect(output.stdout()).toContain('No saved API credentials found')
    expect(existsSync(env.configPath())).toBe(false)
  })

  it('warns about environment credentials on logout', async () => {
    setConfigValue('accessToken', 'config-token')
    process.env.TMDB_ACCESS_TOKEN = 'env-token'
    const output = captureOutput()

    await runCommand(authCommand, { rawArgs: ['logout'] })

    expect(output.stdout()).toContain('Removed API credentials')
    expect(output.stdout()).toContain(
      'Environment credentials are still set',
    )
    expect(readConfig().accessToken).toBeUndefined()
  })
})
