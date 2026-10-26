---
name: tmdb-kit-cli
description: Query The Movie Database (TMDB) from the terminal with the tmdb CLI — search movies, TV shows, and people, read details, credits, images, videos, seasons, and episodes, and emit text, JSON, or NDJSON. Use when a task needs movie or TV metadata such as titles, release dates, ratings, cast, or TMDB IDs without writing API code.
license: MIT
compatibility: Requires Node.js 18+ or Bun, and a TMDB API Read Access Token or legacy API key.
metadata:
  homepage: https://github.com/isaced/tmdb-kit
---

# tmdb CLI

`tmdb` is a read-only command-line client for the TMDB API, shipped in the `tmdb-kit` npm package. It never writes to TMDB, so no operation in this skill can modify the account or its data.

## When to use

Use the CLI when the task needs TMDB facts and a shell is available:

- movie or TV metadata — title, overview, release date, runtime, rating, genres, status
- cast and crew, including character names and billing order
- images, posters, and trailer keys for a title
- seasons and episodes, including air dates and episode names
- trending, popular, top-rated, now-playing, and upcoming lists
- mapping a title or person name to a TMDB ID

Do not reach for it when the work belongs in application code — import the `tmdb-kit` package there instead. The CLI is for exploration, one-off lookups, and shell pipelines.

## Setup

Run it without installing:

```bash
npx -y tmdb-kit@latest trending movie --format json
```

Credentials come from `TMDB_ACCESS_TOKEN`, then `TMDB_API_KEY`, then the config file. Check what is in effect before assuming:

```bash
tmdb auth status --format json
tmdb config test --format json      # one authenticated request; changes nothing
```

If no credential is configured and one is available in the environment, save it without an interactive prompt:

```bash
printf '%s' "$TMDB_ACCESS_TOKEN" | tmdb auth login --token-stdin --force
```

Never pass a secret as a positional argument — `config set token` deliberately refuses values on the command line and reads from a prompt instead.

## Command map

`<id>` is always a numeric TMDB ID. Use `search` first when you only have a name.

| Command                                          | Purpose                                                        | Options                                             |
| ------------------------------------------------ | -------------------------------------------------------------- | --------------------------------------------------- |
| `tmdb search <query>`                            | Search all media, or one type                                  | `--type all\|movie\|tv\|person`, `--year`, `--page` |
| `tmdb trending [type]`                           | Trending list, default `all`                                   | `--window day\|week`, `--page`                      |
| `tmdb genres [movie\|tv]`                        | Genre ID to name mapping                                       | —                                                   |
| `tmdb movie list [category]`                     | `popular` (default), `top-rated`, `now-playing`, `upcoming`    | `--page`, `--region`                                |
| `tmdb movie get <id>`                            | Details                                                        | `--append credits,videos`                           |
| `tmdb movie credits <id>`                        | Cast and crew                                                  | `--limit` (default 10)                              |
| `tmdb movie images <id>`                         | Image paths and sizes                                          | `--image-language`                                  |
| `tmdb movie videos <id>`                         | Trailers and clips                                             | —                                                   |
| `tmdb movie similar <id>`                        | Similar movies                                                 | `--page`, `--region`                                |
| `tmdb movie recommendations <id>`                | Recommended movies                                             | `--page`, `--region`                                |
| `tmdb tv list [category]`                        | `popular` (default), `top-rated`, `airing-today`, `on-the-air` | `--page`                                            |
| `tmdb tv get <id>`                               | Details                                                        | `--append credits,videos`                           |
| `tmdb tv credits <id>`                           | Cast and crew                                                  | `--limit`                                           |
| `tmdb tv images <id>`                            | Image paths and sizes                                          | `--image-language`                                  |
| `tmdb tv videos <id>`                            | Trailers and clips                                             | —                                                   |
| `tmdb tv similar <id>`                           | Similar shows                                                  | `--page`                                            |
| `tmdb tv recommendations <id>`                   | Recommended shows                                              | `--page`                                            |
| `tmdb tv season <id> <season>`                   | Season with its episodes                                       | —                                                   |
| `tmdb tv episode <id> <season> <episode>`        | Episode details                                                | `--append`                                          |
| `tmdb tv aggregate-credits <id>`                 | Cast and crew across all seasons                               | `--limit`                                           |
| `tmdb tv season-credits <id> <season>`           | Season cast and crew                                           | `--limit`                                           |
| `tmdb tv season-aggregate-credits <id> <season>` | Aggregate season credits                                       | `--limit`                                           |
| `tmdb tv season-images <id> <season>`            | Season images                                                  | `--image-language`                                  |
| `tmdb tv season-videos <id> <season>`            | Season videos                                                  | —                                                   |
| `tmdb tv episode-groups <id>`                    | Alternate episode orderings                                    | —                                                   |
| `tmdb tv episode-group <group-id>`               | One alternate group (string ID)                                | —                                                   |
| `tmdb person get <id>`                           | Person details                                                 | —                                                   |
| `tmdb person credits <id>`                       | Combined cast and crew credits                                 | `--limit`                                           |

Season `0` means specials. `--append` takes a comma-separated list of TMDB `append_to_response` values, for example `credits,videos,images`.

Every API command also accepts `--lang`, `--format`, `--fields`, and `--compact`. List commands add `--all` and `--max-items`. Full details: [references/commands.md](references/commands.md).

## Output contract

Default output is a text summary for humans. It is not a stable interface — parse JSON or NDJSON instead.

| Flag                           | Effect                                                            |
| ------------------------------ | ----------------------------------------------------------------- |
| `--format json`                | Raw TMDB response on one pretty-printed JSON document             |
| `--json`                       | Alias for `--format json`                                         |
| `--format ndjson` (or `jsonl`) | One JSON record per line, streamed                                |
| `--fields id,title`            | Keep only those top-level fields; requires json or ndjson         |
| `--compact`                    | Single-line JSON instead of pretty-printed                        |
| `--all`                        | Follow pagination to the last page; ndjson and list commands only |
| `--max-items <n>`              | Stop after `n` items; ndjson and list commands only               |

List commands are `search`, `trending`, `movie list`, `movie similar`, `movie recommendations`, `tv list`, `tv similar`, and `tv recommendations`.

In NDJSON, a list response becomes `meta`, then one `item` per result, then `summary`:

```json
{"type":"meta","page":1,"total_pages":5,"total_results":100}
{"type":"item","index":0,"value":{"id":550,"title":"Fight Club"}}
{"type":"summary","count":20,"pages":1}
```

A detail response becomes a single `{"type":"result","value":…}` record. A missing `summary` means the command failed — the reason is on stderr. Record shapes and projection rules: [references/output.md](references/output.md).

## Recipes

```bash
# Resolve a title to a TMDB ID, then fetch details by ID
tmdb search "Dune" --type movie --format json | jq -r '.results[0].id'
tmdb movie get 438631 --format json | jq '{title, release_date, runtime, vote_average}'

# Top-billed cast
tmdb movie credits 550 --format json --fields cast | jq -r '.cast[:5][].name'

# Stream list items as TSV, capped
tmdb trending movie --format ndjson --fields id,title --max-items 20 \
  | jq -r 'select(.type=="item") | [.value.id, .value.title] | @tsv'

# Every page of a list, stopping at 100 items
tmdb movie list top-rated --format ndjson --all --max-items 100 \
  | jq -r 'select(.type=="item") | .value.title'

# Episode names for one season
tmdb tv season 1399 1 --format json | jq -r '.episodes[] | "(.episode_number) (.name)"'

# Localized results
tmdb movie get 550 --lang zh-CN --format json | jq -r '.title'
```

## Errors and exit codes

With JSON output active, failures print one JSON object to stderr and leave stdout empty:

```json
{
  "type": "error",
  "kind": "not_found",
  "message": "TMDB request failed (404): ...",
  "exitCode": 4,
  "status": 404
}
```

| Code | Meaning                                                                            |
| ---- | ---------------------------------------------------------------------------------- |
| `0`  | Success                                                                            |
| `1`  | Unexpected error, network failure, or non-auth TMDB response                       |
| `2`  | Invalid usage or input — bad flag, bad ID, unknown field, wrong format combination |
| `3`  | Missing or rejected credentials, or a config read/write error                      |
| `4`  | TMDB returned 404                                                                  |
| `5`  | TMDB rate limit (429); `retryAfter` holds the seconds to wait                      |

Branch on the exit code or `kind`, never on the message text. `kind` is one of `usage`, `auth`, `not_found`, `rate_limit`, `network`, `api`, `internal`.

## Rules

- Always pass `--format json` or `--format ndjson` when the output will be parsed.
- Use IDs for follow-up calls. Names are ambiguous and `search` ordering can change.
- `--fields` works only on top-level keys. Nested paths such as `credits.cast` are rejected; ask for `credits` and index in `jq`.
- If none of the requested fields exist, the command exits `2` and lists the available names — useful for discovering a payload shape.
- `--all` can issue many requests. Prefer `--max-items` unless the whole list is genuinely needed; TMDB caps lists at 500 pages and the CLI stops there.
- `--page` beyond the last page returns an empty `results` array, not an error.
- Check credentials with `tmdb config test` before blaming a query for an auth failure.
- `tmdb` with no arguments prints usage and exits `1`; `tmdb <command> --help` prints options for that command.
