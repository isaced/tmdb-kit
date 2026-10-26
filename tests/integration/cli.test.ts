import { afterAll, describe, expect, it } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { accessToken, apiEndpoint } from './setup'

// The CLI resolves credentials from the environment and its config file.
// Run every subprocess from an empty sandbox so a developer's real config
// and .env files cannot change the assertions.
const sandbox = mkdtempSync(join(tmpdir(), 'tmdb-cli-integration-'))
const projectRoot = join(import.meta.dir, '../..')
const cliEntry = join(projectRoot, 'src/cli/main.ts')

afterAll(() => {
  rmSync(sandbox, { recursive: true, force: true })
})

interface CliResult {
  code: number
  stderr: string
  stdout: string
}

async function runCli(
  args: string[],
  overrides: Record<string, string | undefined> = {},
): Promise<CliResult> {
  const env: Record<string, string> = {}
  const merged = {
    ...process.env,
    APPDATA: sandbox,
    TMDB_ACCESS_TOKEN: accessToken,
    XDG_CONFIG_HOME: sandbox,
    ...(apiEndpoint ? { TMDB_BASE_URL: apiEndpoint } : {}),
    ...overrides,
  }

  for (const [key, value] of Object.entries(merged)) {
    if (value !== undefined) {
      env[key] = value
    }
  }

  const child = Bun.spawn([process.execPath, cliEntry, ...args], {
    cwd: sandbox,
    env,
    stderr: 'pipe',
    stdout: 'pipe',
  })

  const [stdout, stderr, code] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ])

  return { code, stderr, stdout }
}

function parseJson<T>(result: CliResult): T {
  if (result.code !== 0) {
    throw new Error(`CLI exited with code ${result.code}: ${result.stderr || result.stdout}`)
  }
  return JSON.parse(result.stdout) as T
}

describe('CLI against the live TMDB API (integration)', () => {
  it('movie get prints JSON for a real movie', async () => {
    const movie = parseJson<{ id: number; title: string }>(
      await runCli(['movie', 'get', '550', '--json']),
    )

    expect(movie.id).toBe(550)
    expect(movie.title).toBe('Fight Club')
  }, 20_000)

  it('search forwards the type and year filters', async () => {
    const response = parseJson<{ page: number; results: Array<{ id: number }> }>(
      await runCli(['search', 'Inception', '--type', 'movie', '--year', '2010', '--json']),
    )

    expect(response.page).toBe(1)
    expect(response.results[0]!.id).toBe(27205)
  }, 20_000)

  it('tv season prints the episode list', async () => {
    const season = parseJson<{ episodes: unknown[]; season_number: number }>(
      await runCli(['tv', 'season', '1399', '1', '--json']),
    )

    expect(season.season_number).toBe(1)
    expect(season.episodes.length).toBeGreaterThan(0)
  }, 20_000)

  it('trending returns a page of results', async () => {
    const response = parseJson<{ results: unknown[] }>(
      await runCli(['trending', 'movie', '--window', 'week', '--json']),
    )

    expect(response.results.length).toBeGreaterThan(0)
  }, 20_000)

  it('genres returns the TV genre list', async () => {
    const response = parseJson<{ genres: Array<{ id: number; name: string }> }>(
      await runCli(['genres', 'tv', '--json']),
    )

    expect(response.genres.length).toBeGreaterThan(0)
    expect(response.genres[0]!.name).toBeTruthy()
  }, 20_000)

  it('config test validates the environment credential', async () => {
    const response = parseJson<{ ok: boolean }>(await runCli(['config', 'test', '--json']))

    expect(response.ok).toBe(true)
  }, 20_000)

  it('auth status reports the environment credential source', async () => {
    const status = parseJson<{ environmentVariable: string; source: string }>(
      await runCli(['auth', 'status', '--json']),
    )

    expect(status.source).toBe('environment')
    expect(status.environmentVariable).toBe('TMDB_ACCESS_TOKEN')
  }, 20_000)

  it('exits with code 3 when no credentials are available', async () => {
    const result = await runCli(['movie', 'get', '550', '--json'], {
      TMDB_ACCESS_TOKEN: undefined,
      TMDB_API_KEY: undefined,
    })

    expect(result.code).toBe(3)
    expect(result.stderr).toContain('No TMDB credentials found')
  }, 20_000)
})
