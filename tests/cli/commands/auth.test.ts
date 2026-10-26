import { existsSync } from 'node:fs'
import { runCommand } from 'citty'
import { beforeEach, describe, expect, it, vi } from 'bun:test'
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

const ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJzY29wZXMiOlsiYXBpX3JlYWQiXX0.test-signature'
const OTHER_ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJzY29wZXMiOlsiYXBpX3JlYWQiXX0.other-signature'
const API_KEY = '0123456789abcdef0123456789abcdef'

const question = vi.fn(async () => 'tty-token')
const close = vi.fn()
const createInterface = vi.fn(() => ({
  question,
  close,
  _writeToOutput: () => {},
}))
const readlineMocks = { close, createInterface, question }

vi.mock('node:readline/promises', () => ({
  createInterface: readlineMocks.createInterface,
}))

describe('auth command', () => {
  const env = useCliTestEnv()

  beforeEach(() => {
    readlineMocks.question.mockReset()
    readlineMocks.question.mockResolvedValue(ACCESS_TOKEN)
    readlineMocks.createInterface.mockClear()
    readlineMocks.close.mockClear()
  })

  it('validates and saves an access token from stdin with --force', async () => {
    setConfigValue('language', 'zh-CN')
    setConfigValue('apiKey', API_KEY)
    const { calls } = mockFetch(() => jsonResponse(movieDetails()))
    const output = captureOutput()

    await withStdin(`${ACCESS_TOKEN}\n`, async () => {
      await runCommand(authCommand, {
        rawArgs: ['login', '--token-stdin', '--force'],
      })
    })

    expect(process.exitCode).toBe(0)
    expect(calls[0]?.pathname.endsWith('/movie/550')).toBe(true)
    expect(readConfig()).toMatchObject({
      accessToken: ACCESS_TOKEN,
      language: 'zh-CN',
    })
    expect(readConfig().apiKey).toBeUndefined()
    expect(output.stdout()).toContain('Credential validated.')
    expect(output.stdout()).toContain('Saved accessToken')
    expect(output.stdout()).toContain(env.configPath())
    expect(output.stdout()).not.toContain(ACCESS_TOKEN)
  })

  it('detects and saves a legacy API key', async () => {
    mockFetch(() => jsonResponse(movieDetails()))
    const output = captureOutput()

    await withStdin(`${API_KEY}\n`, async () => {
      await runCommand(authCommand, {
        rawArgs: ['login', '--token-stdin'],
      })
    })

    expect(process.exitCode).toBe(0)
    expect(readConfig().apiKey).toBe(API_KEY)
    expect(readConfig().accessToken).toBeUndefined()
    expect(output.stdout()).toContain('Saved apiKey')
    expect(output.stdout()).toContain('legacy v3 method')
    expect(output.stdout()).not.toContain(API_KEY)
  })

  it('rejects an empty credential', async () => {
    const output = captureOutput()

    await withStdin('\n', async () => {
      await runCommand(authCommand, {
        rawArgs: ['login', '--token-stdin'],
      })
    })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('Credential must not be empty')
  })

  it('rejects an unrecognized credential format before making a request', async () => {
    const output = captureOutput()

    await withStdin('not-a-credential\n', async () => {
      await runCommand(authCommand, {
        rawArgs: ['login', '--token-stdin'],
      })
    })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('Unrecognized TMDB credential format')
    expect(readConfig().accessToken).toBeUndefined()
    expect(readConfig().apiKey).toBeUndefined()
  })

  it('explains how to pipe a credential without a TTY', async () => {
    const output = captureOutput()

    await runCommand(authCommand, { rawArgs: ['login'] })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('No interactive terminal available')
    expect(output.stderr()).toContain('--token-stdin')
  })

  it('refuses to replace config credentials without --force in non-TTY mode', async () => {
    setConfigValue('accessToken', ACCESS_TOKEN)
    const output = captureOutput()

    await withStdin(`${OTHER_ACCESS_TOKEN}\n`, async () => {
      await runCommand(authCommand, {
        rawArgs: ['login', '--token-stdin'],
      })
    })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain(
      'Existing credentials found: config (accessToken)',
    )
    expect(output.stderr()).toContain('--force')
    expect(readConfig().accessToken).toBe(ACCESS_TOKEN)
  })

  it('refuses to save a config credential over environment credentials without --force', async () => {
    process.env.TMDB_ACCESS_TOKEN = ACCESS_TOKEN
    const output = captureOutput()

    await withStdin(`${OTHER_ACCESS_TOKEN}\n`, async () => {
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

    await withStdin(`${ACCESS_TOKEN}\n`, async () => {
      await runCommand(authCommand, {
        rawArgs: ['login', '--token-stdin'],
      })
    })

    expect(process.exitCode).toBe(0)
    expect(readConfig().accessToken).toBe(ACCESS_TOKEN)
  })

  it('prompts for a credential when stdin is a TTY', async () => {
    mockFetch(() => jsonResponse(movieDetails()))
    const output = captureOutput()

    await withTTY(async () => {
      await runCommand(authCommand, { rawArgs: ['login'] })
    })

    expect(process.exitCode).toBe(0)
    expect(readlineMocks.question).toHaveBeenCalledWith('TMDB credential: ')
    expect(output.stdout()).toContain(
      'Create credentials at https://www.themoviedb.org/settings/api',
    )
    expect(output.stdout()).toContain(
      'API Read Access Token (recommended) or API Key are accepted.',
    )
    expect(readConfig().accessToken).toBe(ACCESS_TOKEN)
  })

  it('keeps config credentials when replacement is declined', async () => {
    setConfigValue('accessToken', ACCESS_TOKEN)
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
      'Existing credentials: config (accessToken, ••••ture).',
    )
    expect(output.stdout()).toContain('Kept existing credentials.')
    expect(readConfig().accessToken).toBe(ACCESS_TOKEN)
  })

  it('replaces config credentials after confirmation', async () => {
    setConfigValue('accessToken', ACCESS_TOKEN)
    readlineMocks.question
      .mockResolvedValueOnce('y')
      .mockResolvedValueOnce(OTHER_ACCESS_TOKEN)
    mockFetch(() => jsonResponse(movieDetails()))
    captureOutput()

    await withTTY(async () => {
      await runCommand(authCommand, { rawArgs: ['login'] })
    })

    expect(process.exitCode).toBe(0)
    expect(readConfig().accessToken).toBe(OTHER_ACCESS_TOKEN)
  })

  it('keeps environment credentials when saving a config credential is declined', async () => {
    process.env.TMDB_ACCESS_TOKEN = ACCESS_TOKEN
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

  it('does not overwrite config when credential validation fails', async () => {
    setConfigValue('accessToken', ACCESS_TOKEN)
    mockFetch(() => jsonResponse({ status_message: 'Invalid token' }, 401))
    const output = captureOutput()

    await withStdin(`${OTHER_ACCESS_TOKEN}\n`, async () => {
      await runCommand(authCommand, {
        rawArgs: ['login', '--token-stdin', '--force'],
      })
    })

    expect(process.exitCode).toBe(3)
    expect(readConfig().accessToken).toBe(ACCESS_TOKEN)
    expect(output.stderr()).toContain('Credential validation failed')
    expect(output.stderr()).toContain('Existing config was not changed')
  })

  it('reports non-auth validation failures', async () => {
    setConfigValue('accessToken', ACCESS_TOKEN)
    mockFetch(() => jsonResponse({ status_message: 'Server error' }, 500))
    const output = captureOutput()

    await withStdin(`${OTHER_ACCESS_TOKEN}\n`, async () => {
      await runCommand(authCommand, {
        rawArgs: ['login', '--token-stdin', '--force'],
      })
    })

    expect(process.exitCode).toBe(1)
    expect(readConfig().accessToken).toBe(ACCESS_TOKEN)
    expect(output.stderr()).toContain('existing config was not changed')
  })

  it('warns when environment credentials override the saved credential', async () => {
    process.env.TMDB_ACCESS_TOKEN = ACCESS_TOKEN
    mockFetch(() => jsonResponse(movieDetails()))
    const output = captureOutput()

    await withStdin(`${OTHER_ACCESS_TOKEN}\n`, async () => {
      await runCommand(authCommand, {
        rawArgs: ['login', '--token-stdin', '--force'],
      })
    })

    expect(output.stdout()).toContain(
      'TMDB_ACCESS_TOKEN is set and takes precedence',
    )
    expect(readConfig().accessToken).toBe(OTHER_ACCESS_TOKEN)
  })

  it('reports environment credentials and shadowed config values', async () => {
    process.env.TMDB_ACCESS_TOKEN = ACCESS_TOKEN
    setConfigValue('apiKey', API_KEY)
    const output = captureOutput()

    await runCommand(authCommand, { rawArgs: ['status'] })

    expect(output.stdout()).toContain(
      'Credential source: environment (TMDB_ACCESS_TOKEN)',
    )
    expect(output.stdout()).toContain('Token: ••••ture')
    expect(output.stdout()).toContain('shadowed by environment variables')
  })

  it('reports config credentials in human output', async () => {
    setConfigValue('accessToken', ACCESS_TOKEN)
    const output = captureOutput()

    await runCommand(authCommand, { rawArgs: ['status'] })

    expect(output.stdout()).toContain(
      'Credential source: config (accessToken)',
    )
    expect(output.stdout()).toContain('Token: ••••ture')
  })

  it('prints config credential status as JSON', async () => {
    setConfigValue('accessToken', ACCESS_TOKEN)
    setConfigValue('language', 'zh-CN')
    setConfigValue('region', 'CN')
    const output = captureOutput()

    await runCommand(authCommand, { rawArgs: ['status', '--json'] })

    expect(JSON.parse(output.stdout())).toEqual({
      source: 'config',
      environmentVariable: null,
      configField: 'accessToken',
      token: '••••ture',
      configPath: env.configPath(),
      configExists: true,
      language: 'zh-CN',
      region: 'CN',
    })
  })

  it('reports API key config credentials as JSON', async () => {
    setConfigValue('apiKey', API_KEY)
    const output = captureOutput()

    await runCommand(authCommand, { rawArgs: ['status', '--json'] })

    expect(JSON.parse(output.stdout())).toMatchObject({
      source: 'config',
      configField: 'apiKey',
      token: '••••cdef',
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
    setConfigValue('accessToken', ACCESS_TOKEN)
    setConfigValue('apiKey', API_KEY)
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
    setConfigValue('accessToken', ACCESS_TOKEN)
    process.env.TMDB_ACCESS_TOKEN = ACCESS_TOKEN
    const output = captureOutput()

    await runCommand(authCommand, { rawArgs: ['logout'] })

    expect(output.stdout()).toContain('Removed API credentials')
    expect(output.stdout()).toContain(
      'Environment credentials are still set',
    )
    expect(readConfig().accessToken).toBeUndefined()
  })
})
