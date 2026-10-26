import { describe, expect, it } from 'bun:test'
import { createTMDB } from '../../src'
import { createFetchMock } from '../_support/fetch'

describe('AbortSignal forwarding', () => {
  it('passes the signal to every resource request', async () => {
    const mock = createFetchMock()
    const tmdb = createTMDB({ accessToken: 'read-token', fetch: mock.fetch })
    const controller = new AbortController()
    const signal = controller.signal

    // Movies
    await tmdb.movies.popular({ signal })
    await tmdb.movies.topRated({ signal })
    await tmdb.movies.nowPlaying({ signal })
    await tmdb.movies.upcoming({ signal })
    await tmdb.movies.details(550, { signal })
    await tmdb.movies.credits(550, { signal })
    await tmdb.movies.images(550, { signal })
    await tmdb.movies.recommendations(550, { signal })
    await tmdb.movies.similar(550, { signal })
    await tmdb.movies.videos(550, { signal })
    await tmdb.movies.externalIds(550, { signal })
    await tmdb.movies.watchProviders(550, { signal })

    // TV
    await tmdb.tv.popular({ signal })
    await tmdb.tv.topRated({ signal })
    await tmdb.tv.airingToday({ signal })
    await tmdb.tv.onTheAir({ signal })
    await tmdb.tv.details(1399, { signal })
    await tmdb.tv.credits(1399, { signal })
    await tmdb.tv.images(1399, { signal })
    await tmdb.tv.recommendations(1399, { signal })
    await tmdb.tv.similar(1399, { signal })
    await tmdb.tv.videos(1399, { signal })
    await tmdb.tv.seasonDetails(1399, 1, { signal })
    await tmdb.tv.seasonCredits(1399, 1, { signal })
    await tmdb.tv.seasonAggregateCredits(1399, 1, { signal })
    await tmdb.tv.seasonImages(1399, 1, { signal })
    await tmdb.tv.seasonVideos(1399, 1, { signal })
    await tmdb.tv.episodeDetails(1399, 1, 1, { signal })
    await tmdb.tv.aggregateCredits(1399, { signal })
    await tmdb.tv.episodeGroups(1399, { signal })
    await tmdb.tv.episodeGroup('group-1', { signal })
    await tmdb.tv.externalIds(1399, { signal })
    await tmdb.tv.seasonExternalIds(1399, 1, { signal })
    await tmdb.tv.episodeExternalIds(1399, 1, 1, { signal })
    await tmdb.tv.watchProviders(1399, { signal })

    // People
    await tmdb.people.popular({ signal })
    await tmdb.people.details(31, { signal })
    await tmdb.people.combinedCredits(31, { signal })
    await tmdb.people.externalIds(31, { signal })

    // Search
    await tmdb.search.movies('Inception', { signal })
    await tmdb.search.tv('Breaking Bad', { signal })
    await tmdb.search.people('Tom Hanks', { signal })
    await tmdb.search.multi('Star Wars', { signal })

    // Trending
    await tmdb.trending.all('day', { signal })
    await tmdb.trending.movies('week', { signal })
    await tmdb.trending.tv('day', { signal })
    await tmdb.trending.people('week', { signal })

    // Genres
    await tmdb.genres.movies({ signal })
    await tmdb.genres.tv({ signal })

    // Configuration
    await tmdb.configuration.details({ signal })
    await tmdb.configuration.countries({ signal })
    await tmdb.configuration.jobs({ signal })
    await tmdb.configuration.languages({ signal })
    await tmdb.configuration.primaryTranslations({ signal })
    await tmdb.configuration.timezones({ signal })

    // Discover
    await tmdb.discover.movies({ signal })
    await tmdb.discover.tv({ signal })

    // Find
    await tmdb.find.byExternalId('tt0137523', { source: 'imdb_id', signal })

    // Collections
    await tmdb.collections.details(10, { signal })
    await tmdb.collections.images(10, { signal })
    await tmdb.collections.translations(10, { signal })

    // Watch provider reference lists
    await tmdb.watchProviders.movies({ signal })
    await tmdb.watchProviders.tv({ signal })

    expect(mock.calls).toHaveLength(63)
    for (const call of mock.calls) {
      expect(call.signal).toBe(signal)
    }
  })
})
