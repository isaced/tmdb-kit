# tmdb-kit

[![npm version](https://img.shields.io/npm/v/tmdb-kit)](https://www.npmjs.com/package/tmdb-kit)
[![CI](https://img.shields.io/github/actions/workflow/status/isaced/tmdb-kit/ci.yml?branch=main)](https://github.com/isaced/tmdb-kit/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/tmdb-kit)](https://github.com/isaced/tmdb-kit/blob/main/LICENSE)
[![node](https://img.shields.io/badge/node-%3E%3D18-brightgreen)](https://nodejs.org)
[![coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)](https://github.com/isaced/tmdb-kit/actions/workflows/ci.yml)

A minimal, fully typed SDK and read-only command-line interface (CLI) for The Movie Database (TMDB). Zero runtime dependencies. Built for Node.js, Bun, and edge runtimes.

`tmdb-kit` covers common TMDB workflows: movies, TV shows, search, trending, people, genres, and images. Use it as a library, or run the bundled `tmdb` command in your terminal.

## Contents

- [Features](#features)
- [Install](#install)
- [SDK](#sdk)
  - [Create a client](#create-a-client)
  - [Authentication](#authentication)
  - [Configuration](#configuration)
  - [Custom transport](#custom-transport)
  - [Cancellation](#cancellation)
  - [Supported resources](#supported-resources)
  - [Image URLs](#image-urls)
  - [Search](#search)
  - [Image sizes](#image-sizes)
  - [Errors](#errors)
  - [Optional helpers](#optional-helpers)
- [CLI](#cli)
  - [Credentials and config](#credentials-and-config)
  - [Commands](#commands)
  - [Common options](#common-options)
  - [Output and exit codes](#output-and-exit-codes)
  - [Examples](#examples)
- [Development](#development)
- [References](#references)

## Features

- **Zero dependencies**: nothing to audit, nothing to conflict.
- **Universal runtime**: uses only `fetch`, `Headers`, `URL`, and `AbortSignal`. Works on Node.js 18+, Bun, Cloudflare Workers, Vercel Edge, and any fetch-compatible environment.
- **SDK and CLI**: typed resource methods for your app, plus `tmdb` and `tmdb-kit` binaries for terminal use.
- **Strict TypeScript**: full type safety with autocomplete for request options, response shapes, image sizes, and error handling.
- **ESM output**: modern module output with bundled type declarations.
- **Typed resources**: first-class methods for movies, TV, search, trending, people, genres, configuration, and images.
- **Injectable transport**: swap the HTTP layer for tests, caching, or instrumentation without mocking `fetch`.
- **Optional helpers**: async pagination, `Retry-After`-aware retries, `AbortSignal` timeouts, and an LRU memory cache — all opt-in and tree-shakeable.
- **Image helpers**: build content delivery network (CDN), proxy, or signed URLs with per-request transform overrides.
- **Search type guards**: narrow `search.multi()` results to movies, TV, or people with runtime-checked helpers.
- **Tested**: unit and resource tests mock `fetch`; an optional live integration suite validates real API behavior, including the helpers.

## Install

Install the SDK with npm:

```bash
npm install tmdb-kit
```

Install the CLI globally:

```bash
npm install --global tmdb-kit
```

The CLI is available as `tmdb`.

## SDK

Create a client, authenticate, and call typed resource methods. The client uses the Fetch API and has no runtime dependencies.

### Create a client

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

### Authentication

The SDK targets the TMDB v3 API at `api.themoviedb.org/3`. Two authentication methods are supported.

An API Read Access Token is recommended and works with both v3 and v4:

```ts
createTMDB({ accessToken: 'your_access_token_here' })
```

A legacy v3 API key is sent as an `api_key` query parameter:

```ts
createTMDB({ apiKey: 'your_api_key_here' })
```

Pass exactly one of `accessToken` or `apiKey`. The client throws when both or neither are set. When you supply a `transport`, credentials are optional because the transport owns authentication.

### Configuration

`createTMDB` accepts these options:

| Option             | Default                                             | Description                                                                                |
| ------------------ | --------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `accessToken`      | required unless `apiKey` or `transport` is set      | API Read Access Token, sent as a Bearer header.                                            |
| `apiKey`           | required unless `accessToken` or `transport` is set | Legacy v3 API key, sent as `api_key`.                                                      |
| `baseUrl`          | `https://api.themoviedb.org/3`                      | API base URL. Useful for proxies and tests.                                                |
| `fetch`            | `globalThis.fetch` at request time                  | Custom fetch implementation.                                                               |
| `defaultLanguage`  | TMDB default                                        | Language for endpoints that accept `language`.                                             |
| `defaultRegion`    | TMDB default                                        | Region for movie lists and search endpoints that accept `region`.                          |
| `imageBaseUrl`     | `https://image.tmdb.org/t/p`                        | Image host used by `tmdb.images`.                                                          |
| `images.transform` | none                                                | Default URL transform for `tmdb.images.url()`.                                             |
| `headers`          | none                                                | Extra headers merged into every request before authentication.                             |
| `transport`        | built-in HTTP client                                | Custom transport; credentials are not required. See [Custom transport](#custom-transport). |

A typical client:

```ts
const tmdb = createTMDB({
  accessToken: 'your_access_token_here',
  defaultLanguage: 'en-US',
  defaultRegion: 'US',
  headers: { 'X-Client': 'my-app' },
  images: {
    transform: (url) => url.replace('image.tmdb.org/t/p', 'img-proxy.example/tmdb'),
  },
})
```

The SDK reads `globalThis.fetch` lazily on every request. Spies on `globalThis.fetch` are picked up after the client has been constructed.

### Custom transport

For tests, caching, or instrumentation, swap the entire transport layer instead of mocking `fetch`:

```ts
import { createTMDB, type TMDBTransport } from 'tmdb-kit'

const stub: TMDBTransport = {
  defaults: { imageBaseUrl: 'https://image.tmdb.org/t/p' },
  get: async (path, _options) => ({ results: [] }),
}

const tmdb = createTMDB({ transport: stub })
```

`transport.get()` runs for every resource and for `request()`, so a single stub covers the whole surface. `TMDBTransport` is part of the public API. The built-in `TMDBHttpClient` is exported too, so you can wrap it instead of reimplementing authentication.

### Cancellation

Every resource method accepts an `AbortSignal` through its options. Pass the same signal to cancel one or more requests:

```ts
const controller = new AbortController()
const promise = tmdb.movies.popular({ signal: controller.signal })

controller.abort()
await promise // rejects with an AbortError
```

`client.request()` accepts the same `signal`. The SDK does not impose a timeout by default; use the optional `withTimeout()` helper (see [Optional helpers](#optional-helpers)) or your runtime's `AbortSignal.timeout()` when you need one.

### Supported resources

| Resource             | Methods                                                                                                                                                                                                                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tmdb.movies`        | `popular()`, `topRated()`, `nowPlaying()`, `upcoming()`, `details()`, `credits()`, `images()`, `recommendations()`, `similar()`, `videos()`                                                                                                                                                                                       |
| `tmdb.tv`            | `popular()`, `topRated()`, `airingToday()`, `onTheAir()`, `details()`, `credits()`, `images()`, `recommendations()`, `similar()`, `videos()`, `seasonDetails()`, `seasonCredits()`, `seasonAggregateCredits()`, `seasonImages()`, `seasonVideos()`, `episodeDetails()`, `aggregateCredits()`, `episodeGroups()`, `episodeGroup()` |
| `tmdb.search`        | `movies()`, `tv()`, `people()`, `multi()`                                                                                                                                                                                                                                                                                         |
| `tmdb.trending`      | `all()`, `movies()`, `tv()`, `people()`                                                                                                                                                                                                                                                                                           |
| `tmdb.people`        | `popular()`, `details()`, `combinedCredits()`                                                                                                                                                                                                                                                                                     |
| `tmdb.genres`        | `movies()`, `tv()`                                                                                                                                                                                                                                                                                                                |
| `tmdb.configuration` | `details()`, `countries()`, `jobs()`, `languages()`, `primaryTranslations()`, `timezones()`                                                                                                                                                                                                                                       |
| `tmdb.images`        | `url()`                                                                                                                                                                                                                                                                                                                           |

For an endpoint that is not wrapped yet, use the `request()` escape hatch:

```ts
const response = await tmdb.request<{ results: unknown[] }>('/discover/movie', {
  query: {
    sort_by: 'popularity.desc',
    with_genres: [28, 12],
  },
})
```

### Image URLs

`tmdb.images.url(path, size)` builds a fully qualified image URL. It returns `null` for nullish paths so UI code can branch naturally:

```ts
const posterUrl = tmdb.images.url(movie.poster_path, 'w500')
```

Pass a `transform` callback to route images through a CDN or proxy:

```ts
const tmdb = createTMDB({
  accessToken: 'your_access_token_here',
  images: {
    transform: (url) => url.replace('https://image.tmdb.org/t/p', 'https://img-proxy.example/tmdb'),
  },
})

tmdb.images.url('/abc.jpg', 'w500')
// 'https://img-proxy.example/tmdb/w500/abc.jpg'
```

Pass a one-off transform per call to add signed query parameters:

```ts
tmdb.images.url('/abc.jpg', 'original', {
  transform: (url) => `${url}?signature=...`,
})
```

The transform is never invoked for nullish paths, so `null` results stay `null`. `buildImageUrl(path, size, options)` is exported for callers that build URLs without a `TMDBClient` instance.

### Search

`search.multi()` returns a union of movie, TV, and person results. Filter media types and narrow the result type with the provided type guards:

```ts
import { createTMDB, isMovieSearchResult, isTVSearchResult, isPersonSearchResult } from 'tmdb-kit'

const { results } = await tmdb.search.multi('Inception', {
  exclude: ['person'],
})

const movies = results.filter(isMovieSearchResult) // MovieMultiResult[]
const tvShows = results.filter(isTVSearchResult) // TVMultiResult[]
const people = results.filter(isPersonSearchResult) // PersonMultiResult[]
```

`exclude` performs client-side filtering because the TMDB multi-search endpoint has no server-side media type filter. `total_results` reflects the unfiltered payload, and the filtered count is `results.length`.

The short-name aliases `isMovie`, `isTV`, and `isPerson` are also exported. The single-resource search methods already return narrowed types, so the guards matter only for `search.multi()`.

### Image sizes

The `ImageSize` type is intentionally permissive. TMDB has added sizes without notice, such as `h632` for profiles, so the SDK keeps the `(string & {})` escape hatch for forward compatibility. The SDK also ships the documented sizes as readonly constants:

```ts
import { KNOWN_POSTER_SIZES, isKnownPosterSize } from 'tmdb-kit'

for (const size of KNOWN_POSTER_SIZES) {
  console.log(size) // 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original'
}

if (!isKnownPosterSize(userInput)) {
  throw new Error(`Unknown TMDB poster size: ${userInput}`)
}
```

The SDK also exports `KNOWN_BACKDROP_SIZES`, `KNOWN_LOGO_SIZES`, `KNOWN_PROFILE_SIZES`, `KNOWN_STILL_SIZES`, `KNOWN_IMAGE_SIZES`, and a matching type guard for each list. The literal-union types are `KnownBackdropSize`, `KnownPosterSize`, `KnownLogoSize`, `KnownProfileSize`, `KnownStillSize`, and `KnownImageSize`.

### Errors

```ts
import { TMDBRateLimitError, TMDBRequestError, TMDBResponseError, TMDBTimeoutError } from 'tmdb-kit'

try {
  await tmdb.movies.popular()
} catch (error) {
  if (error instanceof TMDBRateLimitError) {
    // 429: TMDB asked the caller to back off. The SDK does not retry by
    // default; use retry() or withRetry() if you want automatic backoff.
    console.log('rate limited; retry in', error.retryAfter, 's')
  } else if (error instanceof TMDBResponseError) {
    console.log(error.status, error.statusCode, error.statusMessage)
  } else if (error instanceof TMDBRequestError) {
    // Network failure, missing fetch, or invalid client configuration.
    console.log('request error:', error.message)
  } else if (error instanceof TMDBTimeoutError) {
    // Thrown by withTimeout(), not by the HTTP layer.
    console.log('timed out after', error.timeoutMs, 'ms')
  }
}
```

`TMDBResponseError` exposes convenience getters for common status codes:

| Getter           | Status |
| ---------------- | ------ |
| `isUnauthorized` | 401    |
| `isForbidden`    | 403    |
| `isNotFound`     | 404    |
| `isRateLimit`    | 429    |
| `isServerError`  | 5xx    |

All errors extend `TMDBError`, which you can use as a single catch-all. `TMDBTimeoutError` is thrown by `withTimeout()` and exposes `timeoutMs`; the HTTP layer never throws it directly.

### Optional helpers

These helpers are opt-in and never change the default client behavior. They are exported from the package root and tree-shake out of ESM bundles when unused.

**Pagination**

```ts
import { paginate, paginateItems } from 'tmdb-kit'

for await (const page of paginate((page) => tmdb.movies.popular({ page, region: 'CN' }))) {
  console.log(page.page, page.results.length)
}

// Or iterate items directly.
for await (const movie of paginateItems((page) => tmdb.movies.popular({ page }))) {
  console.log(movie.title)
}
```

`startPage` defaults to 1. `paginate` stops at `total_pages`, an empty page, `endPage` (default 500), or an aborted signal. `endPage` is the last page number to request, so it yields nothing when it is lower than `startPage`.

**Retry**

```ts
import { createTMDB, retry, TMDBHttpClient, withRetry } from 'tmdb-kit'

// Wrap one call.
const movie = await retry(() => tmdb.movies.details(550), { retries: 3 })

// Or wrap the transport once. The transport owns authentication, so the
// factory does not need credentials.
const http = new TMDBHttpClient({ accessToken: 'your_access_token_here' })
const retrying = createTMDB({ transport: withRetry(http, { retries: 3 }) })
```

Retries 429 and any response that carries `Retry-After` (including 503), retries 408, 5xx and network failures with exponential backoff, and leaves other errors untouched. Defaults are 2 retries, a 250 ms base delay, factor 2, full jitter, and a 60 s cap on `Retry-After`; use `retryOn` to replace the predicate and `onRetry` to observe delays. A wrapper-level `signal` and a per-request `signal` are combined, so aborting either cancels the call. The SDK itself still never retries by default.

**Timeout**

```ts
import { withTimeout } from 'tmdb-kit'

const movie = await withTimeout(5_000, (signal) => tmdb.movies.details(550, { signal }))
```

Timeouts reject with `TMDBTimeoutError`. The task must forward the signal to the SDK. Pass a parent `signal` in the options to cancel it externally; the parent's reason is preserved.

**Memory cache**

```ts
import { createTMDB, TMDBHttpClient, withMemoryCache } from 'tmdb-kit'

const http = new TMDBHttpClient({ accessToken: 'your_access_token_here' })
const cached = createTMDB({
  transport: withMemoryCache(http, { ttlMs: 60_000, maxEntries: 200 }),
})
```

Defaults are a 5-minute TTL and 100 entries. The cache key includes the path, query, and headers, only successful responses are stored, and `clear()` invalidates every entry. Use one cache instance per client or credential: authentication is not part of the key.

## CLI

The `tmdb` command is a read-only client for the same TMDB API. It reads credentials from the environment or a config file, prints human-readable summaries by default, and accepts `--format json` (or its `--json` alias) for raw TMDB payloads and `--format ndjson` for line-oriented output.

The CLI runs on Node.js 18+ and Bun.

### Credentials and config

The CLI checks credentials in this order:

1. `TMDB_ACCESS_TOKEN`
2. `TMDB_API_KEY` (legacy v3 API key)
3. `accessToken` in the config file
4. `apiKey` in the config file

Environment variables take precedence over the config file. `TMDB_BASE_URL` overrides the API base URL for every command.

The config file lives at:

- Windows: `%APPDATA%\tmdb-kit\config.json`
- macOS and Linux: `$XDG_CONFIG_HOME/tmdb-kit/config.json`, or `~/.config/tmdb-kit/config.json` when `XDG_CONFIG_HOME` is unset

On Unix, the directory is created with mode `0700` and the file with mode `0600`.

Set up credentials with the auth commands:

```bash
tmdb auth login                    # prompt, validate, and save a credential
tmdb auth login --force            # replace existing credentials
printf '%s' "$TMDB_ACCESS_TOKEN" | tmdb auth login --token-stdin --force
tmdb auth status                   # source, masked token, and config path
tmdb auth logout                   # remove saved credentials
tmdb config test                   # verify credentials with a TMDB request
```

`auth login` validates the credential with a TMDB request before saving it. `config test` performs the same check without changing the config. Use `--force` to replace existing credentials, or to save a config token while an environment variable is set and stdin is not a TTY.

Manage defaults with `config`:

```bash
tmdb config set language zh-CN
tmdb config set region CN
tmdb config set token              # prompts; secrets are not accepted as arguments
tmdb config unset language
tmdb config show                   # masked values and config path
tmdb config path
```

Config keys are `token` or `accessToken`, `api-key` or `apiKey`, `language`, and `region`. Secrets entered with `config set token` or `config set api-key` are read from a prompt, never from the command line. `auth status` and `config show` mask stored secrets.

Use `--lang` to override the config language for a single command. `auth logout` removes saved credentials but leaves environment variables in place.

### Commands

Every API command accepts `--lang`, `--format`, `--fields`, and `--compact`. Commands that return a paginated list also accept `--all` and `--max-items` with `--format ndjson`. Run `tmdb <command> --help` for the full option list.

| Command                                          | Description                                                                       | Command options              |
| ------------------------------------------------ | --------------------------------------------------------------------------------- | ---------------------------- |
| `tmdb search <query>`                            | Search all media, movies, TV, or people.                                          | `--type`, `--year`, `--page` |
| `tmdb movie list [category]`                     | List movies. Default `popular`; also `top-rated`, `now-playing`, `upcoming`.      | `--page`, `--region`         |
| `tmdb movie get <id>`                            | Movie details.                                                                    | `--append`                   |
| `tmdb movie credits <id>`                        | Movie cast and crew.                                                              | `--limit`                    |
| `tmdb movie images <id>`                         | Movie image URLs.                                                                 | `--image-language`           |
| `tmdb movie videos <id>`                         | Movie videos and trailers.                                                        | none                         |
| `tmdb movie similar <id>`                        | Similar movies.                                                                   | `--page`, `--region`         |
| `tmdb movie recommendations <id>`                | Recommended movies.                                                               | `--page`, `--region`         |
| `tmdb tv list [category]`                        | List TV shows. Default `popular`; also `top-rated`, `airing-today`, `on-the-air`. | `--page`                     |
| `tmdb tv get <id>`                               | TV show details.                                                                  | `--append`                   |
| `tmdb tv credits <id>`                           | TV cast and crew.                                                                 | `--limit`                    |
| `tmdb tv images <id>`                            | TV image URLs.                                                                    | `--image-language`           |
| `tmdb tv videos <id>`                            | TV videos and trailers.                                                           | none                         |
| `tmdb tv similar <id>`                           | Similar TV shows.                                                                 | `--page`                     |
| `tmdb tv recommendations <id>`                   | Recommended TV shows.                                                             | `--page`                     |
| `tmdb tv season <id> <season>`                   | TV season and episodes. Use `0` for specials.                                     | none                         |
| `tmdb tv episode <id> <season> <episode>`        | TV episode details. Use `0` for specials.                                         | `--append`                   |
| `tmdb tv aggregate-credits <id>`                 | Aggregate cast and crew credits for a show.                                       | `--limit`                    |
| `tmdb tv season-credits <id> <season>`           | Season cast and crew credits.                                                     | `--limit`                    |
| `tmdb tv season-aggregate-credits <id> <season>` | Aggregate season cast and crew credits.                                           | `--limit`                    |
| `tmdb tv season-images <id> <season>`            | Season image URLs.                                                                | `--image-language`           |
| `tmdb tv season-videos <id> <season>`            | Season videos and trailers.                                                       | none                         |
| `tmdb tv episode-groups <id>`                    | Alternate episode groups for a show.                                              | none                         |
| `tmdb tv episode-group <group-id>`               | Episodes in an alternate group.                                                   | none                         |
| `tmdb person get <id>`                           | Person details.                                                                   | none                         |
| `tmdb person credits <id>`                       | Combined cast and crew credits.                                                   | `--limit`                    |
| `tmdb trending [type]`                           | Trending media. Default `all`; also `movie`, `tv`, `person`.                      | `--window`, `--page`         |
| `tmdb genres [type]`                             | Genres. Default `movie`; also `tv`.                                               | none                         |

Credential and config commands:

| Command                         | Description                                            | Command options                     |
| ------------------------------- | ------------------------------------------------------ | ----------------------------------- |
| `tmdb auth login`               | Validate and save credentials.                         | `--token-stdin`, `--force`          |
| `tmdb auth status`              | Show credential source, masked token, and config path. | `--format`, `--fields`, `--compact` |
| `tmdb auth logout`              | Remove saved credentials.                              | none                                |
| `tmdb config show`              | Show config values with secrets masked.                | `--format`, `--fields`, `--compact` |
| `tmdb config path`              | Print the config file path.                            | none                                |
| `tmdb config test`              | Verify credentials with an authenticated request.      | `--format`, `--fields`, `--compact` |
| `tmdb config set <key> [value]` | Set `token`, `api-key`, `language`, or `region`.       | none                                |
| `tmdb config unset <key>`       | Remove a config value.                                 | none                                |

### Common options

| Option                          | Description                                                                         |
| ------------------------------- | ----------------------------------------------------------------------------------- |
| `--format <text\|json\|ndjson>` | Output format. `json` prints the raw response, `ndjson` prints one record per line. |
| `--fields <list>`               | Comma-separated top-level fields to keep. Requires `--format json` or `ndjson`.     |
| `--json`                        | Alias for `--format json`.                                                          |
| `--compact`                     | Print JSON on a single line instead of pretty-printing it.                          |
| `--all`                         | Follow pagination to the last page. List commands only; requires `ndjson`.          |
| `--max-items <number>`          | Stop after this many items. List commands only; requires `ndjson`.                  |
| `--lang <code>`                 | Language for this command. Defaults to config `language`, then `en-US`.             |
| `--page <number>`               | Page number. Defaults to `1`.                                                       |
| `--region <code>`               | Region for movie lists, similar, and recommendations. Defaults to config `region`.  |
| `--limit <number>`              | Maximum rows for credits. Defaults to `10`.                                         |
| `--append <list>`               | Comma-separated `append_to_response` values, such as `credits,videos`.              |
| `--image-language <list>`       | Comma-separated image language codes.                                               |
| `--year <year>`                 | Movie release year or TV first-air year. Only with `--type movie` or `--type tv`.   |
| `--type <value>`                | Media selector for `search`: `all`, `movie`, `tv`, or `person`.                     |
| `--window <day\|week>`          | Trending window. Defaults to `week`.                                                |

`--version` prints the CLI version.

### Output and exit codes

The default output is a compact summary for reading in a terminal. Use `--format json` for scripts; `--json` is a shorter alias:

```bash
tmdb movie get 550 --format json | jq '.title, .release_date'
tmdb movie get 550 --json | jq '.title'
tmdb movie get 550 --format json --compact   # single line, for line-oriented tools
```

`--compact` only affects `json` output and is ignored for `text`. Combining `--json` with an explicit `--format text` or `--format ndjson` is a usage error.

#### NDJSON

`--format ndjson` (alias `jsonl`) prints one JSON object per line. Responses with a `results` array stream as three record kinds:

<!-- prettier-ignore -->
```json
{"type":"meta","page":1,"total_pages":5,"total_results":100}
{"type":"item","index":0,"value":{"id":550,"title":"Fight Club"}}
{"type":"summary","count":20,"pages":1}
```

`meta` is the response envelope without `results`, `index` is zero-based, and `summary` closes the stream with the item count and pages read. Every other response emits a single record:

<!-- prettier-ignore -->
```json
{"type":"result","value":{"id":550,"title":"Fight Club"}}
```

Because the stream is line-oriented, a missing `summary` line means the command failed; the reason is still on stderr as a single `{"type":"error",...}` record.

#### Pagination

List commands (`search`, `trending`, `movie list/similar/recommendations`, and `tv list/similar/recommendations`) accept `--all` to follow pagination from `--page` to the last page, and `--max-items` to stop early:

```bash
tmdb trending movie --format ndjson --all --max-items 100
```

`--max-items` caps the number of `item` records with or without `--all`. Both flags require `--format ndjson`, and `--all` may issue many requests: TMDB caps lists at 500 pages and the command stops at that limit.

#### Selecting fields

`--fields` keeps only the listed top-level fields. For detail commands it projects the response; for list commands it projects each entry in `results` while keeping the envelope:

```bash
tmdb movie get 550 --format json --fields id,title,release_date
tmdb movie list --format ndjson --fields id,title | jq -c 'select(.type == "item")'
```

Fields that a record does not have are omitted. If none of the requested fields exist, the command exits `2` and lists the available names. Nested paths are not supported, and `--fields` requires `--format json` or `--format ndjson`.

When JSON output is active, errors go to stderr as one JSON object and stdout stays empty, so a pipeline never receives a partial payload:

<!-- prettier-ignore -->
```json
{"type":"error","kind":"not_found","message":"TMDB request failed (404): ...","exitCode":4,"status":404}
```

| Field        | Meaning                                                                      |
| ------------ | ---------------------------------------------------------------------------- |
| `type`       | Always `error`.                                                              |
| `kind`       | `usage`, `auth`, `not_found`, `rate_limit`, `network`, `api`, or `internal`. |
| `message`    | Human-readable description.                                                  |
| `exitCode`   | Process exit code, matching the table below.                                 |
| `status`     | HTTP status, when the failure came from a TMDB response.                     |
| `requestId`  | TMDB `x-request-id`, when the response included one.                         |
| `retryAfter` | Seconds to wait before retrying, for rate limit errors.                      |

Exit codes:

| Code | Meaning                                                        |
| ---- | -------------------------------------------------------------- |
| `0`  | Success.                                                       |
| `1`  | Unexpected error, network failure, or non-auth TMDB response.  |
| `2`  | Invalid command usage or input.                                |
| `3`  | Missing or rejected credentials, or a config read/write error. |
| `4`  | TMDB returned `404 Not Found`.                                 |
| `5`  | TMDB rate limit (`429 Too Many Requests`).                     |

### Examples

```bash
# Search movies released in 2010
tmdb search "Inception" --type movie --year 2010

# Movie details with credits and videos
tmdb movie get 550 --append credits,videos

# Trending movies today, raw JSON
tmdb trending movie --window day --json | jq '.results[].title'

# Season 1 episodes for a TV show
tmdb tv season 1399 1 --json | jq '.episodes[].name'

# Episode details (season 0 = specials)
tmdb tv episode 1399 1 1

# Alternate episode groups
tmdb tv episode-groups 1399

# Save defaults for later commands
tmdb config set language zh-CN
tmdb config set region CN
```

## Development

Requires [Bun](https://bun.sh) 1.4.4+. The published package still runs on Node.js 18+.

```bash
bun install
bun run format
bun run typecheck
bun run test:coverage
bun run build
```

Run the integration suite with a real token. It exercises every SDK resource, the optional helpers, and the CLI against the live API:

```bash
TMDB_ACCESS_TOKEN=your_access_token_here bun run test:integration
```

Set `TMDB_API_ENDPOINT` to run the SDK suites against a compatible mirror. The `Integration` GitHub workflow runs the same suite nightly, on manual dispatch, and on pull requests that touch the SDK, CLI, or integration tests. Add a `TMDB_ACCESS_TOKEN` repository secret to enable it, and an optional `TMDB_API_KEY` secret to also cover legacy v3 key auth; fork and Dependabot pull requests skip the live job because repository secrets are not available to them.

Build and run the CLI from source:

```bash
bun run build:cli
bun dist/cli.js --help
```

## References

- [TMDB authentication](https://developer.themoviedb.org/docs/authentication-application)
- [TMDB API reference](https://developer.themoviedb.org/reference/intro/getting-started)
- [Bun bundler docs](https://bun.com/docs/bundler)
