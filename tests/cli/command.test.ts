import { renderUsage } from 'citty'
import { describe, expect, it } from 'vitest'
import { mainCommand } from '../../src/cli/command'

describe('main command', () => {
  it('renders the command tree and version', async () => {
    const usage = await renderUsage(mainCommand)

    expect(usage).toContain('tmdb v1.0.0')
    expect(usage).toContain('search')
    expect(usage).toContain('movie')
    expect(usage).toContain('tv')
    expect(usage).toContain('person')
    expect(usage).toContain('trending')
    expect(usage).toContain('genres')
    expect(usage).toContain('config')
  })
})
