# Patterns

## Pagination

```ts
import { paginate, paginateItems } from 'tmdb-kit'

for await (const page of paginate((page) => tmdb.movies.popular({ page, region: 'CN' }))) {
  console.log(page.page, page.results.length)
}

for await (const movie of paginateItems((page) => tmdb.movies.popular({ page }))) {
  console.log(movie.title)
}
```

| Option      | Default | Meaning                                               |
| ----------- | ------- | ----------------------------------------------------- |
| `startPage` | `1`     | First page to request                                 |
| `endPage`   | `500`   | Last page to request, inclusive; matches the TMDB cap |
| `signal`    | none    | Cancels before the next request                       |

Iteration stops at `total_pages`, at an empty page, at `endPage`, or when the signal aborts. It yields nothing when `endPage` is lower than `startPage`. The fetcher only receives a page number — forward your own signal inside it:

```ts
const controller = new AbortController()
for await (const page of paginate(
  (page) => tmdb.movies.popular({ page, signal: controller.signal }),
  {
    signal: controller.signal,
  },
)) {
  // ...
}
```

## Retry

```ts
import { retry, withRetry, TMDBHttpClient, createTMDB } from 'tmdb-kit'

const movie = await retry(() => tmdb.movies.details(550), { retries: 3 })

const http = new TMDBHttpClient({ accessToken })
const client = createTMDB({ transport: withRetry(http, { retries: 3 }) })
```

| Option        | Default  | Meaning                                |
| ------------- | -------- | -------------------------------------- |
| `retries`     | `2`      | Attempts after the first               |
| `baseDelayMs` | `250`    | Base for exponential backoff           |
| `factor`      | `2`      | Backoff multiplier                     |
| `maxDelayMs`  | `10000`  | Cap on exponential delay               |
| `jitter`      | `true`   | Full jitter                            |
| `signal`      | none     | Cancels the delay and further attempts |
| `retryOn`     | built-in | Replace the retry predicate            |
| `onRetry`     | none     | Observe each retry via `RetryInfo`     |

Retried: 429, any response carrying `Retry-After` (including 503), 408, 5xx, and network failures. Not retried: other 4xx, validation errors, aborts, timeouts. `Retry-After` values above 60 s are clamped. The client itself never retries — this is opt-in.

## Timeout

```ts
import { withTimeout } from 'tmdb-kit'

const movie = await withTimeout(5_000, (signal) => tmdb.movies.details(550, { signal }))
```

The task must forward the signal; otherwise the request keeps running after the timeout rejects with `TMDBTimeoutError`. `{ signal }` in the options is a parent signal — aborting it cancels the task and preserves the parent's reason.

## Memory cache

```ts
import { createTMDB, TMDBHttpClient, withMemoryCache } from 'tmdb-kit'

const http = new TMDBHttpClient({ accessToken })
const cached = withMemoryCache(http, { ttlMs: 60_000, maxEntries: 200 })
const tmdb = createTMDB({ transport: cached })

cached.clear()
```

Defaults are a 5-minute TTL and 100 entries. The key covers path, query, and headers; only successful responses are stored. Authentication is not part of the key, so use one cache per credential set.

## Custom transport

```ts
import { createTMDB, type TMDBRequestOptions, type TMDBTransport } from 'tmdb-kit'

const stub: TMDBTransport = {
  defaults: { imageBaseUrl: 'https://image.tmdb.org/t/p' },
  // A stub must satisfy whatever the caller expects, so the cast is deliberate.
  get: async <T>(_path: string, _options?: TMDBRequestOptions) =>
    ({ page: 1, results: [], total_pages: 1, total_results: 0 }) as T,
}

const tmdb = createTMDB({ transport: stub })
```

`transport.get(path, options)` serves every resource method and `request()`, so one stub covers the whole surface. When a transport is supplied, credentials are optional — the transport owns authentication. Wrap `TMDBHttpClient` when you want retries, caching, or instrumentation without reimplementing auth.

## Errors

```ts
import {
  TMDBError,
  TMDBRateLimitError,
  TMDBRequestError,
  TMDBResponseError,
  TMDBTimeoutError,
} from 'tmdb-kit'

try {
  await tmdb.movies.popular()
} catch (error) {
  if (error instanceof TMDBRateLimitError) {
    await sleep(error.retryAfter * 1000)
  } else if (error instanceof TMDBResponseError) {
    if (error.isNotFound) return null
    if (error.isUnauthorized || error.isForbidden) throw new Error('check credentials')
    throw error
  } else if (error instanceof TMDBRequestError) {
    // Network failure, missing fetch, or invalid client configuration.
  } else if (error instanceof TMDBTimeoutError) {
    // Thrown by withTimeout(), never by the HTTP layer.
  } else if (error instanceof TMDBError) {
    // Catch-all base class.
  }
}
```

| Class                | Carries                                                                                                                                                                          |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `TMDBError`          | `message`, optional `cause`                                                                                                                                                      |
| `TMDBRequestError`   | Request construction or transport failure                                                                                                                                        |
| `TMDBResponseError`  | `status`, `statusCode`, `statusMessage`, `statusText`, `url`, `body`, `headers`, `requestId`, plus `isUnauthorized`, `isForbidden`, `isNotFound`, `isRateLimit`, `isServerError` |
| `TMDBRateLimitError` | `retryAfter` in seconds; extends `TMDBResponseError`                                                                                                                             |
| `TMDBTimeoutError`   | `timeoutMs`; thrown only by `withTimeout()`                                                                                                                                      |

Check subclasses before `TMDBResponseError`: `TMDBRateLimitError` is a response error too.

## Search narrowing

```ts
import { isMovieSearchResult, isPersonSearchResult, isTVSearchResult } from 'tmdb-kit'

const { results } = await tmdb.search.multi('Inception', { exclude: ['person'] })
const movies = results.filter(isMovieSearchResult)
const tvShows = results.filter(isTVSearchResult)
const people = results.filter(isPersonSearchResult)
```

`exclude` filters client-side because the multi-search endpoint has no media-type parameter. `total_results` stays the unfiltered count; use `results.length` after filtering. Short aliases `isMovie`, `isTV`, and `isPerson` are also exported. Single-type search methods already return narrowed results, so the guards are only needed for `search.multi()`.

## Testing

```ts
import { createTMDB } from 'tmdb-kit'

const tmdb = createTMDB({
  accessToken: 'test',
  fetch: async () =>
    new Response(JSON.stringify({ page: 1, results: [], total_pages: 1, total_results: 0 })),
})
```

`globalThis.fetch` is read lazily on every request, so spies installed after `createTMDB()` are picked up. For deterministic tests, a `transport` stub avoids HTTP entirely and covers every resource.

## Runtime notes

- Uses only `fetch`, `Headers`, `URL`, and `AbortSignal` — no Node built-ins, so Cloudflare Workers, Vercel Edge, Deno, and Bun all work.
- Ships ESM and CJS builds with bundled type declarations; the package is side-effect free and tree-shakeable.
- On Node.js 18+, `fetch` is global. Older runtimes need a polyfill passed through the `fetch` option.
- Base URL, extra headers, and image host are configurable for proxies and test doubles.
