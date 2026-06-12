import { describe, expect, it } from 'vitest'
import { createRealTMDB } from './setup'

describe('People API (integration)', () => {
  const tmdb = createRealTMDB()

  it('fetches popular people', async () => {
    const result = await tmdb.people.popular()
    expect(result.page).toBe(1)
    expect(Array.isArray(result.results)).toBe(true)
    expect(result.results.length).toBeGreaterThan(0)
    const person = result.results[0]!
    expect(person.id).toBeGreaterThan(0)
    expect(person.name).toBeTruthy()
  })

  it('fetches person details by id', async () => {
    const person = await tmdb.people.details(31) // Tom Hanks
    expect(person.id).toBe(31)
    expect(person.name).toBe('Tom Hanks')
    expect(typeof person.biography).toBe('string')
  })

  it('rejects invalid person ids before a request is made', () => {
    expect(() => tmdb.people.details(0)).toThrow('personId must be a positive integer')
    expect(() => tmdb.people.details(-5)).toThrow('personId must be a positive integer')
  })
})
