# Output contract

The CLI has one output contract shared by every command. Pick the format by how the result will be consumed.

| Consumer                               | Use                               |
| -------------------------------------- | --------------------------------- |
| A human reading a terminal             | default text output               |
| `jq`, a script, or another tool        | `--format json` (`--json`)        |
| Streaming, or a list of unknown length | `--format ndjson` (alias `jsonl`) |

## Text

The default. Human-readable summaries with truncation and formatting. It is not a stable interface: field names, ordering, and truncation can change between versions. Never parse it.

## JSON

`--format json` prints the raw TMDB response as one pretty-printed JSON document, byte-identical to what `--json` produces. `--compact` switches to a single line, which is what you want for line-oriented tools:

```bash
tmdb movie get 550 --format json --compact
```

`--compact` is ignored for text output.

## NDJSON

`--format ndjson` prints one JSON object per line. Each line is a complete record with a `type` discriminator.

For a response with a `results` array:

```json
{"type":"meta","page":1,"total_pages":5,"total_results":100}
{"type":"item","index":0,"value":{"id":550,"title":"Fight Club"}}
{"type":"item","index":1,"value":{"id":680,"title":"Pulp Fiction"}}
{"type":"summary","count":20,"pages":1}
```

- `meta` is the response envelope with `results` removed, taken from the first page only.
- `index` is zero-based and continuous across pages.
- `summary` closes the stream with the number of items written and the number of pages read.

For every other response, one record:

```json
{ "type": "result", "value": { "id": 550, "title": "Fight Club" } }
```

Ordering is guaranteed: `meta` first, `summary` last. A stream without `summary` was cut short by a failure — the reason is a single `error` record on stderr.

## Selecting fields

`--fields id,title` keeps only the listed top-level keys. It requires `--format json` or `--format ndjson`; with text output it exits `2`.

- Detail responses are projected directly.
- List responses keep the envelope and project each entry in `results`.
- In NDJSON, only `item` and `result` records are projected; `meta` and `summary` keep their own fields.
- Missing fields are omitted from the record rather than emitted as `null`.
- If none of the requested fields exist, the command exits `2` and prints the available top-level names, which is a quick way to discover a payload shape.
- Nested paths are not supported. Request the parent object and index it in `jq`.

```bash
tmdb movie get 550 --format json --fields id,title,release_date
tmdb trending movie --format ndjson --fields id,title | jq -c 'select(.type=="item")'
```

## Pagination

Eight commands return paginated lists: `search`, `trending`, `movie list`, `movie similar`, `movie recommendations`, `tv list`, `tv similar`, `tv recommendations`.

| Flag              | Behavior                                      |
| ----------------- | --------------------------------------------- |
| `--page <n>`      | Start page; defaults to `1`                   |
| `--all`           | Continue from the start page to the last page |
| `--max-items <n>` | Stop after `n` items, with or without `--all` |

Both `--all` and `--max-items` require `--format ndjson`, and both are rejected on commands that do not paginate. The failure is a usage error (`2`) raised before any request is sent.

```bash
tmdb movie list top-rated --format ndjson --all --max-items 100
```

Notes:

- `--all` can issue many requests. TMDB caps lists at 500 pages; the CLI stops at that limit even if `total_pages` is larger.
- `--max-items` caps `item` records, not pages — the final page may be read and only partially emitted.
- `summary.pages` counts pages actually fetched, including the start page.
- A `--page` beyond the last page returns an empty `results` array with `summary.count` of `0`; that is not an error.
- Each page request can fail independently. If page 3 fails, earlier `item` records are already on stdout and no `summary` is written.

## Errors

When JSON output is active, a failure writes exactly one JSON object to stderr and leaves stdout empty, so a pipeline never receives a partial payload:

```json
{
  "type": "error",
  "kind": "not_found",
  "message": "TMDB request failed (404): ...",
  "exitCode": 4,
  "status": 404
}
```

| Field        | Meaning                                                                     |
| ------------ | --------------------------------------------------------------------------- |
| `type`       | Always `error`                                                              |
| `kind`       | `usage`, `auth`, `not_found`, `rate_limit`, `network`, `api`, or `internal` |
| `message`    | Human-readable description; do not parse it                                 |
| `exitCode`   | Process exit code, matching the table below                                 |
| `status`     | HTTP status, when the failure came from a TMDB response                     |
| `requestId`  | TMDB `x-request-id`, when the response carried one                          |
| `retryAfter` | Seconds to wait before retrying, for rate limit errors                      |

| Code | Meaning                                                   | `kind`                       |
| ---- | --------------------------------------------------------- | ---------------------------- |
| `0`  | Success                                                   | —                            |
| `1`  | Unexpected error, network failure, non-auth TMDB response | `network`, `api`, `internal` |
| `2`  | Invalid usage or input                                    | `usage`                      |
| `3`  | Missing or rejected credentials, config read/write error  | `auth`                       |
| `4`  | TMDB returned 404                                         | `not_found`                  |
| `5`  | TMDB rate limit (429)                                     | `rate_limit`                 |

Branch on the exit code or `kind`. Text mode writes the same information as plain text to stderr.

Usage errors — unknown flags, invalid IDs, `--fields` without JSON, `--all` on a non-list command — are detected before any network request, so they are safe to probe with.

## Recipes

```bash
# Stream ids and titles as TSV
tmdb trending movie --format ndjson --fields id,title \
  | jq -r 'select(.type=="item") | [.value.id, .value.title] | @tsv'

# Collect a whole list into an array, capped at 200
tmdb movie list top-rated --format ndjson --all --max-items 200 \
  | jq -s '[.[] | select(.type=="item") | .value]'

# Read a nested field
tmdb movie credits 550 --format json | jq -r '.cast[:5][].name'

# Retry once on a rate limit, honoring retryAfter
out=$(tmdb search "Dune" --format json 2>/tmp/err) || {
  wait=$(jq -r '.retryAfter // 1' /tmp/err)
  sleep "$wait"
  out=$(tmdb search "Dune" --format json)
}
```
