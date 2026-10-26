import { renderUsage } from 'citty'
import { describe, expect, it } from 'bun:test'
import pkg from '../../package.json' with { type: 'json' }
import { mainCommand } from '../../src/cli/command'
import { AUTHENTICATION_HELP } from '../../src/cli/help'

describe('main command', () => {
  it('renders the command tree and version', async () => {
    const usage = await renderUsage(mainCommand)

    expect(usage).toContain(`tmdb v${pkg.version}`)
    expect(usage).toContain('search')
    expect(usage).toContain('discover')
    expect(usage).toContain('find')
    expect(usage).toContain('movie')
    expect(usage).toContain('tv')
    expect(usage).toContain('person')
    expect(usage).toContain('collection')
    expect(usage).toContain('providers')
    expect(usage).toContain('trending')
    expect(usage).toContain('genres')
    expect(usage).toContain('auth')
    expect(usage).toContain('config')
  })

  it('documents authentication in root help', () => {
    expect(AUTHENTICATION_HELP).toContain('tmdb auth login')
    expect(AUTHENTICATION_HELP).toContain('tmdb auth status')
    expect(AUTHENTICATION_HELP).toContain('TMDB_ACCESS_TOKEN')
    expect(AUTHENTICATION_HELP).toContain('tmdb config path')
  })
})
