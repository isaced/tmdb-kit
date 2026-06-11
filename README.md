# tmdb-sdk

A tiny, typed, zero-runtime-dependency TMDB SDK for Node.js, Bun, Deno, and edge runtimes.

This package intentionally does not generate code from OpenAPI. It ships a small hand-designed API surface for common TMDB workflows, plus a typed `request<T>()` escape hatch for endpoints that are not wrapped yet.

## Features

- Zero runtime dependencies.
- Built with tsdown and published as ESM + CommonJS.
- Uses only Web standard APIs: `fetch`, `Headers`, `URL`, and `AbortSignal`.
- Works in Node.js 18+, Bun, Deno, Cloudflare Workers, Vercel Edge, and other fetch-compatible runtimes.
- Typed resources for movies, TV, search, trending, people, genres, configuration, credits, videos, and images.
- High-coverage unit tests with mocked fetch; no real TMDB requests in tests.

## Install

```bash
npm install tmdb-sdk
```

## Quick Start

```ts
import { createTMDB } from 'tmdb-sdk'

const tmdb = createTMDB({
  accessToken: process.env.TMDB_ACCESS_TOKEN!,
  defaultLanguage: 'en-US',
})

const popular = await tmdb.movies.popular({ page: 1 })
const movie = await tmdb.movies.details(popular.results[0]!.id, {
  appendToResponse: ['credits', 'videos'],
})

const posterUrl = tmdb.images.url(movie.poster_path, 'w500')
```

CommonJS:

```js
const { createTMDB } = require('tmdb-sdk')

const tmdb = createTMDB({ accessToken: process.env.TMDB_ACCESS_TOKEN })
```

Deno:

```ts
import { createTMDB } from 'npm:tmdb-sdk'

const tmdb = createTMDB({ accessToken: Deno.env.get('TMDB_ACCESS_TOKEN')! })
```

## Authentication

The recommended option is TMDB's API Read Access Token:

```ts
createTMDB({ accessToken: 'tmdb-read-access-token' })
```

The legacy v3 `api_key` query parameter is also supported:

```ts
createTMDB({ apiKey: 'tmdb-v3-api-key' })
```

Exactly one of `accessToken` or `apiKey` is required.

## Supported Resources

```ts
tmdb.movies.popular()
tmdb.movies.topRated()
tmdb.movies.nowPlaying()
tmdb.movies.upcoming()
tmdb.movies.details(550, { appendToResponse: ['credits', 'videos'] })
tmdb.movies.credits(550)
tmdb.movies.images(550)
tmdb.movies.recommendations(550)
tmdb.movies.similar(550)
tmdb.movies.videos(550)

tmdb.tv.popular()
tmdb.tv.topRated()
tmdb.tv.airingToday()
tmdb.tv.onTheAir()
tmdb.tv.details(1399)
tmdb.tv.credits(1399)
tmdb.tv.images(1399)
tmdb.tv.recommendations(1399)
tmdb.tv.similar(1399)
tmdb.tv.videos(1399)

tmdb.search.movies('Dune')
tmdb.search.tv('Dark')
tmdb.search.people('Sofia Coppola')
tmdb.search.multi('Tom Hardy')

tmdb.trending.all('week')
tmdb.trending.movies('day')
tmdb.trending.tv('day')
tmdb.trending.people('week')

tmdb.people.popular()
tmdb.people.details(31)

tmdb.genres.movies()
tmdb.genres.tv()

tmdb.configuration.details()
tmdb.configuration.countries()
tmdb.configuration.jobs()
tmdb.configuration.languages()
tmdb.configuration.primaryTranslations()
tmdb.configuration.timezones()
```

For an endpoint that is not wrapped yet:

```ts
const response = await tmdb.request<{ results: unknown[] }>('/discover/movie', {
  query: {
    sort_by: 'popularity.desc',
    with_genres: [28, 12],
  },
})
```

## Errors

```ts
import { TMDBResponseError } from 'tmdb-sdk'

try {
  await tmdb.movies.popular()
} catch (error) {
  if (error instanceof TMDBResponseError) {
    console.log(error.status, error.statusCode, error.statusMessage)
  }
}
```

## Development

```bash
npm install
npm run typecheck
npm run test:coverage
npm run build
```

## References

- [TMDB authentication](https://developer.themoviedb.org/docs/authentication-application)
- [TMDB API reference](https://developer.themoviedb.org/reference/intro/getting-started)
- [tsdown output formats](https://tsdown.dev/options/output-format)
