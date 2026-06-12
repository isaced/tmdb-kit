import { describe, expect, it } from 'vitest'
import { createRealTMDB } from './setup'

describe('Client request() escape hatch (integration)', () => {
  const tmdb = createRealTMDB()

  it('can call arbitrary endpoints', async () => {
    const result = await tmdb.request<{ id: number; title: string }>('movie/550')
    expect(result.id).toBe(550)
    expect(result.title).toBe('Fight Club')
  })

  it('can query collections', async () => {
    const result = await tmdb.request('collection/10') // Star Wars Collection
    expect(result).toBeDefined()
    expect(result.id).toBe(10)
  })
})
