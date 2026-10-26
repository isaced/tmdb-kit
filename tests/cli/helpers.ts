import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { afterEach, beforeEach, vi } from 'vitest'

const ENV_KEYS = [
  'APPDATA',
  'XDG_CONFIG_HOME',
  'TMDB_ACCESS_TOKEN',
  'TMDB_API_KEY',
  'TMDB_BASE_URL',
] as const

export function useCliTestEnv() {
  let dir = ''
  const saved = new Map<string, string | undefined>()

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      saved.set(key, process.env[key])
    }

    dir = mkdtempSync(join(tmpdir(), 'tmdb-cli-test-'))
    process.env.XDG_CONFIG_HOME = dir
    process.env.APPDATA = dir
    delete process.env.TMDB_ACCESS_TOKEN
    delete process.env.TMDB_API_KEY
    delete process.env.TMDB_BASE_URL
    process.exitCode = 0
  })

  afterEach(() => {
    for (const key of ENV_KEYS) {
      const value = saved.get(key)
      if (value === undefined) {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }

    rmSync(dir, { recursive: true, force: true })
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    process.exitCode = 0
  })

  return {
    dir: () => dir,
    configPath: () => join(dir, 'tmdb', 'config.json'),
  }
}

export function captureOutput() {
  const stdout: string[] = []
  const stderr: string[] = []

  vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: string | Uint8Array) => {
    stdout.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString())
    return true
  }) as typeof process.stdout.write)

  vi.spyOn(process.stderr, 'write').mockImplementation(((chunk: string | Uint8Array) => {
    stderr.push(typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString())
    return true
  }) as typeof process.stderr.write)

  return {
    stdout: () => stdout.join(''),
    stderr: () => stderr.join(''),
  }
}

export async function withStdin(
  input: string,
  task: () => Promise<void>,
): Promise<void> {
  const descriptor = Object.getOwnPropertyDescriptor(process, 'stdin')!
  Object.defineProperty(process, 'stdin', {
    configurable: true,
    value: Readable.from([input]),
  })

  try {
    await task()
  } finally {
    Object.defineProperty(process, 'stdin', descriptor)
  }
}

export async function withTTY(task: () => Promise<void>): Promise<void> {
  const stdin = Readable.from([]) as Readable & { isTTY?: boolean }
  stdin.isTTY = true
  const descriptor = Object.getOwnPropertyDescriptor(process, 'stdin')!
  Object.defineProperty(process, 'stdin', {
    configurable: true,
    value: stdin,
  })

  try {
    await task()
  } finally {
    Object.defineProperty(process, 'stdin', descriptor)
  }
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export function mockFetch(handler: (url: URL) => Response | Promise<Response>) {
  const calls: URL[] = []
  const fetchMock = vi.fn(
    async (input: string | URL | Request, _init?: RequestInit) => {
      const url = new URL(
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url,
      )
      calls.push(url)
      return handler(url)
    },
  )

  vi.stubGlobal('fetch', fetchMock)
  return { calls, fetchMock }
}
