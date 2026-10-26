# Command reference

Every command below is read-only. `<id>` is a numeric TMDB ID unless noted otherwise.

## Conventions

| Option                    | Default                         | Notes                                              |
| ------------------------- | ------------------------------- | -------------------------------------------------- |
| `--lang <code>`           | config `language`, then `en-US` | Per-command language override                      |
| `--region <code>`         | config `region`                 | Only movie lists, `similar`, and `recommendations` |
| `--page <n>`              | `1`                             | Positive integer; TMDB caps lists at 500 pages     |
| `--limit <n>`             | `10`                            | Rows per section for credits commands              |
| `--append <list>`         | —                               | Comma-separated `append_to_response` values        |
| `--image-language <list>` | —                               | Comma-separated image language codes               |

All commands also accept the output flags documented in [output.md](output.md).

## Search and discovery

### `tmdb search <query>`

| Option   | Values                         | Default |
| -------- | ------------------------------ | ------- |
| `--type` | `all`, `movie`, `tv`, `person` | `all`   |
| `--year` | four-digit year                | —       |
| `--page` | positive integer               | `1`     |

`--year` is only valid with `--type movie` (release year) or `--type tv` (first-air year); other combinations exit `2`. An empty query exits `2`.

Payload: `{ page, results[], total_pages, total_results }`. Result objects vary by type — `media_type` tells them apart when `--type all`.

### `tmdb trending [type]`

| Option            | Values                         | Default |
| ----------------- | ------------------------------ | ------- |
| positional `type` | `all`, `movie`, `tv`, `person` | `all`   |
| `--window`        | `day`, `week`                  | `week`  |
| `--page`          | positive integer               | `1`     |

Payload: paginated envelope, same shape as search.

### `tmdb genres [type]`

Positional `type` is `movie` (default) or `tv`. Payload: `{ genres: [{ id, name }] }`. Useful for turning a `genre_ids` array into names.

## Movies

| Command                      | Positionals                                                 | Options              | Payload                                        |
| ---------------------------- | ----------------------------------------------------------- | -------------------- | ---------------------------------------------- |
| `movie list [category]`      | `popular` (default), `top-rated`, `now-playing`, `upcoming` | `--page`, `--region` | Paginated envelope                             |
| `movie get <id>`             | movie ID                                                    | `--append`           | Movie details                                  |
| `movie credits <id>`         | movie ID                                                    | `--limit`            | `{ id, cast[], crew[] }`                       |
| `movie images <id>`          | movie ID                                                    | `--image-language`   | `{ id, backdrops[], posters[], logos[] }`      |
| `movie videos <id>`          | movie ID                                                    | —                    | `{ id, results[] }` with `key`, `site`, `type` |
| `movie similar <id>`         | movie ID                                                    | `--page`, `--region` | Paginated envelope                             |
| `movie recommendations <id>` | movie ID                                                    | `--page`, `--region` | Paginated envelope                             |

Movie details include `title`, `original_title`, `overview`, `release_date`, `runtime`, `status`, `vote_average`, `vote_count`, `genres[]`, `production_companies[]`, `spoken_languages[]`, `budget`, `revenue`, `imdb_id`, and `belongs_to_collection`.

Valid `--append` values for movies: `account_states`, `alternative_titles`, `changes`, `credits`, `external_ids`, `images`, `keywords`, `lists`, `recommendations`, `release_dates`, `reviews`, `similar`, `translations`, `videos`, `watch/providers`.

## TV

| Command                                     | Positionals                                                    | Options            | Payload                                                           |
| ------------------------------------------- | -------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------- |
| `tv list [category]`                        | `popular` (default), `top-rated`, `airing-today`, `on-the-air` | `--page`           | Paginated envelope                                                |
| `tv get <id>`                               | show ID                                                        | `--append`         | Show details                                                      |
| `tv credits <id>`                           | show ID                                                        | `--limit`          | `{ id, cast[], crew[] }`                                          |
| `tv images <id>`                            | show ID                                                        | `--image-language` | `{ id, backdrops[], posters[], logos[] }`                         |
| `tv videos <id>`                            | show ID                                                        | —                  | `{ id, results[] }`                                               |
| `tv similar <id>`                           | show ID                                                        | `--page`           | Paginated envelope                                                |
| `tv recommendations <id>`                   | show ID                                                        | `--page`           | Paginated envelope                                                |
| `tv season <id> <season>`                   | show ID, season number                                         | —                  | Season with `episodes[]`                                          |
| `tv episode <id> <season> <episode>`        | show ID, season, episode                                       | `--append`         | Episode details                                                   |
| `tv aggregate-credits <id>`                 | show ID                                                        | `--limit`          | `{ id, cast[], crew[] }` with `roles[]` and `total_episode_count` |
| `tv season-credits <id> <season>`           | show ID, season                                                | `--limit`          | `{ id, cast[], crew[] }`                                          |
| `tv season-aggregate-credits <id> <season>` | show ID, season                                                | `--limit`          | Aggregate credits for the season                                  |
| `tv season-images <id> <season>`            | show ID, season                                                | `--image-language` | `{ id, posters[] }`                                               |
| `tv season-videos <id> <season>`            | show ID, season                                                | —                  | `{ id, results[] }`                                               |
| `tv episode-groups <id>`                    | show ID                                                        | —                  | `{ id, results[] }` of group IDs                                  |
| `tv episode-group <group-id>`               | group ID (string)                                              | —                  | Group with `groups[]` and `episodes[]`                            |

Season `0` means specials; season numbers must be non-negative integers, episode numbers positive integers. Episode groups are the exception to numeric IDs — `<group-id>` is the alphanumeric ID returned by `tv episode-groups`.

Valid `--append` values for TV: `account_states`, `aggregate_credits`, `alternative_titles`, `changes`, `content_ratings`, `credits`, `episode_groups`, `external_ids`, `images`, `keywords`, `recommendations`, `reviews`, `screened_theatrically`, `similar`, `translations`, `videos`, `watch/providers`. Episodes accept `account_states`, `credits`, `external_ids`, `images`, `translations`, `videos`.

## People

| Command               | Positionals | Options   | Payload                                       |
| --------------------- | ----------- | --------- | --------------------------------------------- |
| `person get <id>`     | person ID   | —         | Person details                                |
| `person credits <id>` | person ID   | `--limit` | `{ id, cast[], crew[] }` across movies and TV |

Person details include `name`, `known_for_department`, `biography`, `birthday`, `deathday`, `place_of_birth`, `also_known_as[]`, and `known_for`.

## Credentials and config

| Command                    | Options                    | Effect                                                          |
| -------------------------- | -------------------------- | --------------------------------------------------------------- |
| `auth login`               | `--token-stdin`, `--force` | Validate the credential with a request, then save it            |
| `auth status`              | output flags               | Credential source, masked token, config path, language, region  |
| `auth logout`              | —                          | Remove saved credentials; environment variables stay untouched  |
| `config show`              | output flags               | Config values with secrets masked                               |
| `config path`              | —                          | Print the config file path                                      |
| `config test`              | output flags               | One authenticated request; prints `{ "ok": true }` in JSON mode |
| `config set <key> [value]` | —                          | `token`, `api-key`, `language`, or `region`                     |
| `config unset <key>`       | —                          | Remove one config value                                         |

Credential precedence: `TMDB_ACCESS_TOKEN`, `TMDB_API_KEY`, config `accessToken`, config `apiKey`. `TMDB_BASE_URL` overrides the API base URL for every command.

`config set token` and `config set api-key` read the secret from a prompt and reject a value passed on the command line. In a non-interactive shell, pipe it into `auth login --token-stdin` instead.

Config file location: `$XDG_CONFIG_HOME/tmdb-kit/config.json` on macOS and Linux (falling back to `~/.config/tmdb-kit/config.json`), and `%APPDATA%\tmdb-kit\config.json` on Windows.
