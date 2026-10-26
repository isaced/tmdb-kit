import { describe, expect, it } from 'bun:test'
import { join } from 'node:path'

const entry = join(import.meta.dir, '../../src/cli/main.ts')

async function runCli(...args: string[]) {
  const child = Bun.spawn([process.execPath, entry, ...args], {
    env: { ...process.env, TMDB_ACCESS_TOKEN: '', TMDB_API_KEY: '' },
    stderr: 'pipe',
    stdout: 'pipe',
  })

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
    child.exited,
  ])

  return { exitCode, stderr, stdout }
}

describe('CLI entry point', () => {
  it('prints usage for --help', async () => {
    const result = await runCli('movie', '--help')

    expect(result.exitCode).toBe(0)
    expect(result.stdout.replace(/\u001B\[[0-9;]*m/g, '')).toContain('USAGE tmdb movie')
  })

  it('prints the version', async () => {
    const result = await runCli('--version')

    expect(result.exitCode).toBe(0)
    expect(result.stdout.trim()).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('reports argument errors as JSON when --format json is requested', async () => {
    const result = await runCli('movie', 'get', '--format', 'json')

    expect(result.exitCode).toBe(2)
    expect(result.stdout).toBe('')
    expect(JSON.parse(result.stderr)).toEqual({
      type: 'error',
      kind: 'usage',
      message: 'Missing required positional argument: ID',
      exitCode: 2,
    })
  })

  it('keeps argument errors readable in text mode', async () => {
    const result = await runCli('movie', 'get')

    expect(result.exitCode).toBe(2)
    expect(result.stderr).toBe('Missing required positional argument: ID\n')
  })

  it('reports unknown commands as usage errors', async () => {
    const result = await runCli('movie', 'unknown', '--json')

    expect(result.exitCode).toBe(2)
    expect(JSON.parse(result.stderr)).toMatchObject({ kind: 'usage', exitCode: 2 })
  })
})
