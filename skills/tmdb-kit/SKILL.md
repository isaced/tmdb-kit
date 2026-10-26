---
name: tmdb-kit
description: Call The Movie Database (TMDB) API from TypeScript or JavaScript with the tmdb-kit SDK — typed movie, TV, person, search, trending, genre, and image requests with zero runtime dependencies. Use when writing application, server, or edge-runtime code that needs TMDB data and typed responses.
license: MIT
compatibility: Requires Node.js 18+, Bun, Deno, or any runtime providing fetch, Headers, URL, and AbortSignal.
metadata:
  homepage: https://github.com/isaced/tmdb-kit
---

# tmdb-kit SDK

`tmdb-kit` is a typed, zero-dependency client for the TMDB v3 API. It ships ESM and CJS builds with bundled declarations, uses only web-standard globals, and is read-only: every method is a GET.

## When to use

Use the SDK when TMDB data belongs in code:

- an app, server, worker, or build script fetching titles, credits, seasons, or images
- typed access to TMDB responses, including `append_to_response` blocks
- edge or serverless runtimes where a Node-only HTTP client would not load
- tests that need to stub the network without mocking `fetch`

Do not use it for one-off terminal lookups — the `tmdb-kit-cli` skill wraps the same API as the `tmdb` command. Do not use it to write to TMDB; the client only reads.

## Install and create a client

```bash
npm install tmdb-kit
```

```ts
import { createTMDB } from 'tmdb-kit'

const tmdb = createTMDB({
  accessToken: process.env.TMDB_ACCESS_TOKEN!, // or apiKey for the legacy v3 key
  defaultLanguage: 'en-US',
  defaultRegion: 'US',
})
```

Pass exactly one of `accessToken` or `apiKey`. Passing both, or neither without a `transport`, throws `TMDBRequestError`. A custom `transport` owns authentication, so credentials become optional.

| Option                             | Purpose                                                          |
| ---------------------------------- | ---------------------------------------------------------------- |
| `baseUrl`                          | Defaults to `https://api.themoviedb.org/3`; override for proxies |
| `fetch`                            | Custom fetch implementation; `globalThis.fetch` is read lazily   |
| `defaultLanguage`, `defaultRegion` | Applied to requests that accept them                             |
| `imageBaseUrl`, `images.transform` | Image host and URL rewriting                                     |
| `headers`                          | Merged into every request before authentication                  |
| `transport`                        | Replace the HTTP layer entirely                                  |

## Resources

| Resource             | Methods                                                                                                                                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tmdb.movies`        | `popular`, `topRated`, `nowPlaying`, `upcoming`, `details`, `credits`, `images`, `recommendations`, `similar`, `videos`                                                                                                                                                                     |
| `tmdb.tv`            | `popular`, `topRated`, `airingToday`, `onTheAir`, `details`, `credits`, `images`, `recommendations`, `similar`, `videos`, `seasonDetails`, `seasonCredits`, `seasonAggregateCredits`, `seasonImages`, `seasonVideos`, `episodeDetails`, `aggregateCredits`, `episodeGroups`, `episodeGroup` |
| `tmdb.search`        | `movies`, `tv`, `people`, `multi`                                                                                                                                                                                                                                                           |
| `tmdb.trending`      | `all`, `movies`, `tv`, `people`                                                                                                                                                                                                                                                             |
| `tmdb.people`        | `popular`, `details`, `combinedCredits`                                                                                                                                                                                                                                                     |
| `tmdb.genres`        | `movies`, `tv`                                                                                                                                                                                                                                                                              |
| `tmdb.configuration` | `details`, `countries`, `jobs`, `languages`, `primaryTranslations`, `timezones`                                                                                                                                                                                                             |
| `tmdb.images`        | `url`                                                                                                                                                                                                                                                                                       |

Signatures, option types, and response shapes: [references/api.md](references/api.md). Pagination, retry, timeout, cache, transport, and error handling: [references/patterns.md](references/patterns.md).

## Core patterns

### Details with appended data

```ts
import type { CreditsResponse, VideosResponse } from 'tmdb-kit'

const movie = await tmdb.movies.details<{ credits: CreditsResponse; videos: VideosResponse }>(550, {
  appendToResponse: ['credits', 'videos'],
})

movie.credits.cast[0]?.name
```

The generic is what types the appended keys. Without it, the return is `MovieDetails & TMDBObject` and appended blocks are untyped.

### Lists and pagination

```ts
import { paginateItems } from 'tmdb-kit'

for await (const movie of paginateItems((page) => tmdb.movies.popular({ page }))) {
  console.log(movie.title)
}
```

`paginate` yields pages, `paginateItems` yields individual results. Both stop at `total_pages`, an empty page, `endPage` (default `500`, the TMDB cap), or an aborted signal.

### Search

```ts
import { isMovieSearchResult } from 'tmdb-kit'

const { results } = await tmdb.search.multi('Inception', { exclude: ['person'] })
const movies = results.filter(isMovieSearchResult)
```

`exclude` filters client-side; `total_results` stays unfiltered.

### Image URLs

```ts
const poster = tmdb.images.url(movie.poster_path, 'w500') // string | null
```

Returns `null` for nullish paths, so UI code can branch without a guard. `buildImageUrl(path, size, options)` is the standalone version.

### Errors

```ts
import { TMDBRateLimitError, TMDBResponseError } from 'tmdb-kit'

try {
  await tmdb.movies.popular()
} catch (error) {
  if (error instanceof TMDBRateLimitError) {
    await sleep(error.retryAfter * 1000)
  } else if (error instanceof TMDBResponseError && error.isNotFound) {
    return null
  }
  throw error
}
```

Check `TMDBRateLimitError` before `TMDBResponseError` — it is a subclass.

### Retry, timeout, cache

```ts
import { TMDBHttpClient, createTMDB, retry, withMemoryCache, withTimeout } from 'tmdb-kit'

const movie = await retry(() => tmdb.movies.details(550), { retries: 3 })

const guarded = await withTimeout(5_000, (signal) => tmdb.movies.details(550, { signal }))

const http = new TMDBHttpClient({ accessToken: process.env.TMDB_ACCESS_TOKEN! })
const cached = createTMDB({ transport: withMemoryCache(http, { ttlMs: 60_000 }) })
```

All three are opt-in and never change default behavior.

### Endpoints without a method

```ts
const response = await tmdb.request<{ results: unknown[] }>('/discover/movie', {
  query: { sort_by: 'popularity.desc', with_genres: [28, 12] },
})
```

## Rules

- Never log or commit a token. Read it from the environment at call time.
- The client never retries on its own. Wrap calls in `retry()` or wrap the transport in `withRetry()` when you want backoff.
- `withTimeout()` only cancels if the task forwards the signal it receives. A task that ignores it keeps running after the rejection.
- `trending` defaults to `'day'` in the SDK, while the CLI defaults to `week`. Pass the window explicitly when the difference matters.
- Every method accepts `signal` through its options. Combine that with `withTimeout` rather than `Promise.race`.
- The cache key excludes credentials. Use one cache instance per client or token.
- `paginate` defaults `endPage` to `500` because TMDB refuses pages beyond that. Raise it only against a proxy with a different cap.
- `search.multi` results are a union; narrow with `isMovieSearchResult`, `isTVSearchResult`, or `isPersonSearchResult` before reading type-specific fields.
- `appendToResponse` accepts a single value or an array, and the typed return only reflects what you pass to the generic.
- No Node built-ins are used, so the same code runs on Node 18+, Bun, Deno, Cloudflare Workers, and Vercel Edge.
