import { describe, expect, it } from 'vitest'
import { createRealTMDB } from './setup'

describe('Configuration API (integration)', () => {
  const tmdb = createRealTMDB()

  it('returns configuration details with image sizes', async () => {
    const config = await tmdb.configuration.details()
    expect(config.images).toBeDefined()
    expect(config.images.base_url).toBeTruthy()
    expect(config.images.secure_base_url).toBeTruthy()
    expect(Array.isArray(config.images.backdrop_sizes)).toBe(true)
    expect(Array.isArray(config.images.poster_sizes)).toBe(true)
    expect(Array.isArray(config.images.profile_sizes)).toBe(true)
    expect(Array.isArray(config.images.still_sizes)).toBe(true)
    expect(Array.isArray(config.images.logo_sizes)).toBe(true)
    expect(Array.isArray(config.change_keys)).toBe(true)
  })

  it('returns countries list', async () => {
    const countries = await tmdb.configuration.countries()
    expect(Array.isArray(countries)).toBe(true)
    expect(countries.length).toBeGreaterThan(0)
    const first = countries[0]!
    expect(first.iso_3166_1).toBeTruthy()
    expect(first.english_name).toBeTruthy()
    expect(first.native_name).toBeTruthy()
  })

  it('returns languages list', async () => {
    const languages = await tmdb.configuration.languages()
    expect(Array.isArray(languages)).toBe(true)
    expect(languages.length).toBeGreaterThan(0)
    const first = languages[0]!
    expect(first.iso_639_1).toBeTruthy()
    expect(first.english_name).toBeTruthy()
  })

  it('returns jobs list', async () => {
    const jobs = await tmdb.configuration.jobs()
    expect(Array.isArray(jobs)).toBe(true)
    expect(jobs.length).toBeGreaterThan(0)
    const first = jobs[0]!
    expect(first.department).toBeTruthy()
    expect(Array.isArray(first.jobs)).toBe(true)
  })

  it('returns primary translations list', async () => {
    const translations = await tmdb.configuration.primaryTranslations()
    expect(Array.isArray(translations)).toBe(true)
    expect(translations.length).toBeGreaterThan(0)
  })

  it('returns timezones list', async () => {
    const timezones = await tmdb.configuration.timezones()
    expect(Array.isArray(timezones)).toBe(true)
    expect(timezones.length).toBeGreaterThan(0)
    const first = timezones[0]!
    expect(first.iso_3166_1).toBeTruthy()
    expect(Array.isArray(first.zones)).toBe(true)
  })
})
