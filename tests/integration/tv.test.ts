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
    expect(episode.episode_type).toBeTruthy()
    expect(Array.isArray(episode.crew)).toBe(true)
    expect(Array.isArray(episode.guest_stars)).toBe(true)
  })

  it('supports append_to_response on episode details', async () => {
    const episode = await tmdb.tv.episodeDetails(1399, 1, 1, {
      appendToResponse: ['credits', 'images', 'videos'],
    })

    expect(episode.credits).toBeDefined()
    expect(episode.images).toBeDefined()
    expect(episode.videos).toBeDefined()
  })

  it('fetches aggregate credits with roles and jobs', async () => {
    const credits = await tmdb.tv.aggregateCredits(1399)
    expect(credits.id).toBe(1399)
    expect(credits.cast.length).toBeGreaterThan(0)
    expect(credits.cast[0]!.roles.length).toBeGreaterThan(0)
    expect(credits.cast[0]!.roles[0]!.episode_count).toBeGreaterThan(0)
    expect(credits.crew.length).toBeGreaterThan(0)
    expect(credits.crew[0]!.jobs.length).toBeGreaterThan(0)
  })

  it('fetches season credits', async () => {
    const credits = await tmdb.tv.seasonCredits(1399, 1)
    expect(credits.cast.length).toBeGreaterThan(0)
    expect(credits.cast[0]!.character).toBeTruthy()

    const aggregate = await tmdb.tv.seasonAggregateCredits(1399, 1)
    expect(aggregate.cast.length).toBeGreaterThan(0)
    expect(aggregate.cast[0]!.roles.length).toBeGreaterThan(0)
  })

  it('fetches season images and videos', async () => {
    const images = await tmdb.tv.seasonImages(1399, 1)
    expect(images.id).toBeGreaterThan(0)
    expect(images.posters.length).toBeGreaterThan(0)

    const videos = await tmdb.tv.seasonVideos(1399, 1)
    expect(videos.id).toBeGreaterThan(0)
    expect(videos.results.length).toBeGreaterThan(0)
  })

  it('fetches specials across the season endpoints', async () => {
    const [credits, images, videos] = await Promise.all([
      tmdb.tv.seasonCredits(1399, 0),
      tmdb.tv.seasonImages(1399, 0),
      tmdb.tv.seasonVideos(1399, 0),
    ])

    expect(Array.isArray(credits.cast)).toBe(true)
    expect(Array.isArray(images.posters)).toBe(true)
    expect(Array.isArray(videos.results)).toBe(true)
  })

  it('fetches episode groups and their details', async () => {
    const groups = await tmdb.tv.episodeGroups(1399)
    expect(groups.id).toBe(1399)
    expect(groups.results.length).toBeGreaterThan(0)

    const summary = groups.results[0]!
    expect(summary.id).toBeTruthy()
    expect(summary.episode_count).toBeGreaterThan(0)
    expect(summary.network?.id).toBeGreaterThan(0)

    const group = await tmdb.tv.episodeGroup(summary.id)
    expect(group.id).toBe(summary.id)
    expect(group.groups.length).toBeGreaterThan(0)
    expect(group.groups[0]!.episodes.length).toBeGreaterThan(0)
    expect(typeof group.groups[0]!.locked).toBe('boolean')
    expect(group.groups[0]!.episodes[0]!.episode_type).toBeTruthy()
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
