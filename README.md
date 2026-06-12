# tmdb-kit

A tiny, typed, zero-runtime-dependency TMDB SDK for Node.js, Bun, Deno, and edge runtimes.

This package intentionally does not generate code from OpenAPI. It ships a small hand-designed API surface for common TMDB workflows, plus a typed `request<T>()` escape hatch for endpoints that are not wrapped yet.

## Features

- Zero runtime dependencies.
- Built with tsdown and published as ESM + CommonJS.
- Uses only Web standard APIs: `fetch`, `Headers`, `URL`, and `AbortSignal`.
- Works in Node.js 18+, Bun, Deno, Cloudflare Workers, Vercel Edge, and other fetch-compatible runtimes.
- Typed resources for movies, TV, search, trending, people, genres, configuration, credits, videos, and images.
- Injectable `TMDBTransport` for tests, caching, and instrumentation — no need to mock `fetch` or `createTMDB` itself.
- Image URL transforms (CDN / proxy / signed URLs) and search-result type guards.
- High-coverage unit tests with mocked fetch; no real TMDB requests in tests.

## Install

```bash
npm install tmdb-kit
```

## Quick Start

```ts
import { createTMDB } from 'tmdb-kit'

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
const { createTMDB } = require('tmdb-kit')

const tmdb = createTMDB({ accessToken: process.env.TMDB_ACCESS_TOKEN })
```

Deno:

```ts
import { createTMDB } from 'npm:tmdb-kit'

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

## Configuration

The factory accepts a few options beyond authentication:

```ts
import { createTMDB } from 'tmdb-kit'

const tmdb = createTMDB({
  accessToken: 'tmdb-read-access-token',

  // Defaults to https://api.themoviedb.org/3. Useful for tests or proxies.
  baseUrl: 'https://api.themoviedb.org/3',

  // Inject a fetch implementation. The SDK reads `globalThis.fetch` lazily
  // on every request, so test-time mocks (vi.spyOn, etc.) are picked up
  // automatically after the client has been constructed.
  fetch: customFetch,

  // Defaults applied to every request that supports them.
  defaultLanguage: 'en-US',
  defaultRegion: 'US',

  // Custom image host. Defaults to https://image.tmdb.org/t/p.
  imageBaseUrl: 'https://image.tmdb.org/t/p',

  // Image URL transform applied by the ImagesHelper. See "Image URLs".
  images: {
    transform: (url) => url.replace('image.tmdb.org/t/p', 'img-proxy.example/tmdb'),
  },

  // Extra headers merged into every request before authentication.
  headers: { 'X-Client': 'my-app' },
})
```

### Injecting a custom transport

For tests, caching, or instrumentation, you can swap the entire transport
layer instead of mocking `fetch`:

```ts
import { createTMDB, type TMDBTransport } from 'tmdb-kit'

const stub: TMDBTransport = {
  defaults: { imageBaseUrl: 'https://image.tmdb.org/t/p' },
  get: async (path) => ({ results: [] }),
}

const tmdb = createTMDB({ accessToken: 'x', transport: stub })
```

`transport.get()` is called for every resource and for the `request()`
escape hatch, so a single stub covers the whole surface area.
`TMDBTransport` is exported as part of the public API.

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
tmdb.tv.seasonDetails(1399, 1)

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

## Image URLs

`tmdb.images.url(path, size)` builds a fully-qualified image URL. The
helper returns `null` for nullish paths so UI code can branch naturally:

```ts
const posterUrl = tmdb.images.url(movie.poster_path, 'w500')
```

### Routing images through a CDN or proxy

Pass a `transform` callback to rewrite the resolved URL. The most common
use case is pointing TMDB image requests at a self-hosted proxy:

```ts
const tmdb = createTMDB({
  accessToken: 'x',
  images: {
    transform: (url) => url.replace('https://image.tmdb.org/t/p', 'https://img-proxy.example/tmdb'),
  },
})

tmdb.images.url('/abc.jpg', 'w500')
// → 'https://img-proxy.example/tmdb/w500/abc.jpg'
```

You can also pass a one-off transform per call — useful for adding
signed query parameters for selected sizes:

```ts
tmdb.images.url('/abc.jpg', 'original', {
  transform: (url) => `${url}?signature=...`,
})
```

The transform is never invoked for nullish paths, so `null` results stay
`null`.

`buildImageUrl(path, size, options)` is exported directly for callers
that want to build URLs without a `TMDBClient` instance.

## Search

`search.multi()` returns a union of movie / TV / person results. Filter
out media types you do not want and narrow the result type with the
provided type guards:

```ts
import {
  createTMDB,
  isMovieSearchResult,
  isTVSearchResult,
  isPersonSearchResult,
} from 'tmdb-kit'

const { results } = await tmdb.search.multi('Inception', {
  exclude: ['person'],
})

const movies = results.filter(isMovieSearchResult) // MovieMultiResult[]
const tvShows = results.filter(isTVSearchResult) // TVMultiResult[]
const people = results.filter(isPersonSearchResult) // PersonMultiResult[]
```

- `exclude` performs client-side filtering — the TMDB multi-search
  endpoint has no server-side media_type filter. `total_results` reflects
  the unfiltered payload; the filtered count is just `results.length`.
- Short-name aliases `isMovie` / `isTV` / `isPerson` are also exported
  for callers that prefer them.
- The single-resource search methods (`search.movies`, `search.tv`,
  `search.people`) already return the narrowed result type, so the
  guards are only useful for `search.multi()` payloads.

## Image Sizes

The `ImageSize` type is intentionally permissive — TMDB has added new
sizes in the past (e.g. `h632` for profile) without notice, and the SDK
keeps the `(string & {})` escape hatch so any future size keeps
working at runtime. If you need the canonical set of documented sizes,
the SDK ships them as readonly constants:

```ts
import {
  KNOWN_BACKDROP_SIZES,
  KNOWN_LOGO_SIZES,
  KNOWN_POSTER_SIZES,
  KNOWN_PROFILE_SIZES,
  KNOWN_STILL_SIZES,
  KNOWN_IMAGE_SIZES,
  isKnownBackdropSize,
  isKnownImageSize,
  // …plus one helper per type
} from 'tmdb-kit'

// Iterate to build a size picker
for (const size of KNOWN_POSTER_SIZES) {
  console.log(size) // 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original'
}

// Validate user-supplied sizes at runtime
if (!isKnownPosterSize(userInput)) {
  throw new Error(`Unknown TMDB poster size: ${userInput}`)
}
```

`KnownBackdropSize` / `KnownPosterSize` / `KnownLogoSize` /
`KnownProfileSize` / `KnownStillSize` / `KnownImageSize` are the
matching TS literal-union types for callers that want strict typing
without giving up forward-compatibility.

## Errors

```ts
import { TMDBRateLimitError, TMDBResponseError } from 'tmdb-kit'

try {
  await tmdb.movies.popular()
} catch (error) {
  if (error instanceof TMDBRateLimitError) {
    // 429 — TMDB asked the caller to back off. The SDK does NOT retry
    // automatically; back off for `retryAfter` seconds (or use your own
    // policy) and try again.
    console.log('rate limited; retry in', error.retryAfter, 's')
  } else if (error instanceof TMDBResponseError) {
    console.log(error.status, error.statusCode, error.statusMessage)
  }
}
```

`TMDBResponseError` exposes convenience getters for the most common
status codes:

| Getter | Status |
| --- | --- |
| `isUnauthorized` | 401 |
| `isForbidden` | 403 |
| `isNotFound` | 404 |
| `isRateLimit` | 429 |
| `isServerError` | 5xx |

All errors are also instances of the base class `TMDBError`; use that
when you want a single catch-all.

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
