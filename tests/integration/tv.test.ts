import { describe, expect, it } from 'bun:test'
import { createRealTMDB } from './setup'

describe('TV API (integration)', () => {
  const tmdb = createRealTMDB()

  it('fetches popular tv shows', async () => {
    const result = await tmdb.tv.popular()
    expect(result.page).toBe(1)
    expect(Array.isArray(result.results)).toBe(true)
    expect(result.results.length).toBeGreaterThan(0)
    const show = result.results[0]!
    expect(show.id).toBeGreaterThan(0)
    expect(show.name).toBeTruthy()
  })

  it('fetches top rated tv shows', async () => {
    const result = await tmdb.tv.topRated()
    expect(Array.isArray(result.results)).toBe(true)
    expect(result.results.length).toBeGreaterThan(0)
  })

  it('fetches tv airing today', async () => {
    const result = await tmdb.tv.airingToday()
    expect(Array.isArray(result.results)).toBe(true)
  })

  it('fetches tv on the air', async () => {
    const result = await tmdb.tv.onTheAir()
    expect(Array.isArray(result.results)).toBe(true)
  })

  it('fetches tv details by id', async () => {
    const tv = await tmdb.tv.details(1399) // Game of Thrones
    expect(tv.id).toBe(1399)
    expect(tv.name).toBe('Game of Thrones')
    expect(Array.isArray(tv.seasons)).toBe(true)
    expect(Array.isArray(tv.genres)).toBe(true)
  })

  it('fetches tv credits', async () => {
    const credits = await tmdb.tv.credits(1399)
    expect(credits.id).toBe(1399)
    expect(Array.isArray(credits.cast)).toBe(true)
    expect(Array.isArray(credits.crew)).toBe(true)
  })

  it('fetches tv season details', async () => {
    const season = await tmdb.tv.seasonDetails(1399, 1)
    expect(season.season_number).toBe(1)
    expect(Array.isArray(season.episodes)).toBe(true)
    expect(season.episodes.length).toBeGreaterThan(0)
  })

  it('fetches tv season zero (specials)', async () => {
    const season = await tmdb.tv.seasonDetails(1399, 0)
    expect(season.season_number).toBe(0)
  })

  it('fetches tv episode details', async () => {
    const episode = await tmdb.tv.episodeDetails(1399, 1, 1)
    expect(episode.id).toBeGreaterThan(0)
    expect(episode.name).toBeTruthy()
    expect(episode.season_number).toBe(1)
    expect(episode.episode_number).toBe(1)
  })

  it('fetches aggregate credits', async () => {
    const credits = await tmdb.tv.aggregateCredits(1399)
    expect(credits.id).toBe(1399)
    expect(Array.isArray(credits.cast)).toBe(true)
    expect(Array.isArray(credits.crew)).toBe(true)
  })

  it('fetches season credits', async () => {
    const credits = await tmdb.tv.seasonCredits(1399, 1)
    expect(Array.isArray(credits.cast)).toBe(true)

    const aggregate = await tmdb.tv.seasonAggregateCredits(1399, 1)
    expect(Array.isArray(aggregate.cast)).toBe(true)
  })

  it('fetches season images and videos', async () => {
    const images = await tmdb.tv.seasonImages(1399, 1)
    expect(Array.isArray(images.posters)).toBe(true)

    const videos = await tmdb.tv.seasonVideos(1399, 1)
    expect(Array.isArray(videos.results)).toBe(true)
  })

  it('fetches episode groups', async () => {
    const groups = await tmdb.tv.episodeGroups(1399)
    expect(groups.id).toBe(1399)
    expect(Array.isArray(groups.results)).toBe(true)

    const summary = groups.results[0]
    if (summary) {
      const group = await tmdb.tv.episodeGroup(1399, summary.id)
      expect(group.id).toBe(summary.id)
      expect(Array.isArray(group.groups)).toBe(true)
    }
  })

  it('fetches tv images', async () => {
    const images = await tmdb.tv.images(1399)
    expect(images.id).toBe(1399)
    expect(Array.isArray(images.backdrops)).toBe(true)
    expect(Array.isArray(images.posters)).toBe(true)
  })

  it('fetches tv videos', async () => {
    const videos = await tmdb.tv.videos(1399)
    expect(videos.id).toBe(1399)
    expect(Array.isArray(videos.results)).toBe(true)
  })

  it('fetches tv recommendations', async () => {
    const result = await tmdb.tv.recommendations(1399)
    expect(Array.isArray(result.results)).toBe(true)
  })

  it('fetches tv similar', async () => {
    const result = await tmdb.tv.similar(1399)
    expect(Array.isArray(result.results)).toBe(true)
  })

  it('rejects invalid series ids before a request is made', () => {
    expect(() => tmdb.tv.details(0)).toThrow('seriesId must be a positive integer')
    expect(() => tmdb.tv.credits(-1)).toThrow('seriesId must be a positive integer')
  })
})
