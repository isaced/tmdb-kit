import { runCommand } from 'citty'
import { describe, expect, it } from 'bun:test'
import { collectionCommand } from '../../../src/cli/commands/collection'
import { collectionDetails, collectionTranslationsResponse, imagesResponse } from '../fixtures'
import { captureOutput, jsonResponse, mockFetch, useCliTestEnv } from '../helpers'

describe('collection command', () => {
  useCliTestEnv()

  it('prints collection details with a text limit and language', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(collectionDetails()))
    const output = captureOutput()

    await runCommand(collectionCommand, {
      rawArgs: ['get', '10', '--lang', 'de-DE', '--limit', '1'],
    })

    expect(process.exitCode).toBe(0)
    expect(calls[0]?.pathname).toBe('/3/collection/10')
    expect(calls[0]?.searchParams.get('language')).toBe('de-DE')
    expect(output.stdout()).toContain('Star Wars Collection')
    expect(output.stdout()).toContain('Parts (2):')
    expect(output.stdout()).toContain('Star Wars (1977)')
    expect(output.stdout()).toContain('… and 1 more')
  })

  it('maps collection image language filters', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(imagesResponse()))
    captureOutput()

    await runCommand(collectionCommand, {
      rawArgs: ['images', '10', '--image-language', 'en,null'],
    })

    expect(calls[0]?.pathname).toBe('/3/collection/10/images')
    expect(calls[0]?.searchParams.get('include_image_language')).toBe('en,null')
  })

  it('prints translations without a language query', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const { calls } = mockFetch(() => jsonResponse(collectionTranslationsResponse()))
    const output = captureOutput()

    await runCommand(collectionCommand, { rawArgs: ['translations', '10'] })

    expect(calls[0]?.pathname).toBe('/3/collection/10/translations')
    expect(calls[0]?.searchParams.has('language')).toBe(false)
    expect(output.stdout()).toContain('de-DE  German  Star Wars Collection')
  })

  it('rejects invalid collection IDs', async () => {
    process.env.TMDB_ACCESS_TOKEN = 'token'
    const output = captureOutput()

    await runCommand(collectionCommand, { rawArgs: ['get', 'abc'] })

    expect(process.exitCode).toBe(2)
    expect(output.stderr()).toContain('Invalid collection ID')
  })
})
