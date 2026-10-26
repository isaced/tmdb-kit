# Command reference

Every command below is read-only. `<id>` is a numeric TMDB ID unless noted otherwise.

## Conventions

| Option                    | Default                         | Notes                                                                     |
| ------------------------- | ------------------------------- | ------------------------------------------------------------------------- |
| `--lang <code>`           | config `language`, then `en-US` | Per-command language override                                             |
| `--region <code>`         | config `region`                 | Movie lists, discover, similar, recommendations; filters `providers movie | tv` |
| `--sort-by <value>`       | —                               | Discover sort order                                                       |
| `--with-genres <ids>`     | —                               | Discover genre IDs; comma = AND, pipe = OR                                |
| `--watch-region <code>`   | —                               | Provider region for discover and provider lists                           |
| `--source <value>`        | `imdb_id`                       | External ID source for `find`                                             |
| `--page <n>`              | `1`                             | Positive integer; TMDB caps lists at 500 pages                            |
| `--limit <n>`             | `10`                            | Rows per section for credits commands                                     |
| `--append <list>`         | —                               | Comma-separated `append_to_response` values                               |
| `--image-language <list>` | —                               | Comma-separated image language codes                                      |

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

### `tmdb discover movie|tv [filters]`

| Option                                                                                              | Values                                      | Notes                                                               |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| `--sort-by`                                                                                         | `popularity.desc`, `vote_average.desc`, ... | SDK validates the sort union                                        |
| `--with-genres` / `--without-genres`                                                                | IDs                                         | Comma = AND; pipe = OR                                              |
| `--with-keywords`, `--with-companies`                                                               | IDs                                         | Same comma/pipe rules                                               |
| `--vote-average-gte/lte`, `--vote-count-gte/lte`, `--runtime-gte/lte`                               | numbers                                     | Numeric filters                                                     |
| `--with-watch-providers`, `--watch-region`, `--with-watch-monetization-types`                       | IDs / region / types                        | Streaming filters                                                   |
| `--year`, `--region`                                                                                | year / region                               | Movie: release year and region. TV: `--year` maps to first-air year |
| `--with-people`, `--with-cast`, `--with-crew`, `--with-release-type`                                | IDs                                         | Movie only                                                          |
| `--first-air-date-gte/lte`, `--air-date-gte/lte`, `--with-networks`, `--with-status`, `--with-type` | dates / IDs / codes                         | TV only                                                             |
| `--page`, `--all`, `--max-items`                                                                    | pagination                                  | `--all` requires `--format ndjson`                                  |

Payload: paginated envelope of movie or TV summaries.

### `tmdb find <external-id>`

| Option                   | Values                                                                                                                                                  | Default   |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| positional `external-id` | IMDb ID, TVDB ID, Wikidata ID, or social handle                                                                                                         | —         |
| `--source`               | `imdb_id`, `freebase_mid`, `freebase_id`, `tvdb_id`, `tvrage_id`, `facebook_id`, `twitter_id`, `instagram_id`, `tiktok_id`, `youtube_id`, `wikidata_id` | `imdb_id` |

Payload: `{ movie_results[], tv_results[], person_results[], tv_episode_results[], tv_season_results[] }`. Not paginated; `--all` is rejected. An empty ID exits `2`.

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
| `movie external-ids <id>`    | movie ID                                                    | —                    | `{ id, imdb_id, tvdb_id, ... }`                |

Movie details include `title`, `original_title`, `overview`, `release_date`, `runtime`, `status`, `vote_average`, `vote_count`, `genres[]`, `production_companies[]`, `spoken_languages[]`, `budget`, `revenue`, `imdb_id`, and `belongs_to_collection`.

Valid `--append` values for movies: `account_states`, `alternative_titles`, `changes`, `credits`, `external_ids`, `images`, `keywords`, `lists`, `recommendations`, `release_dates`, `reviews`, `similar`, `translations`, `videos`, `watch/providers`.

## TV

| Command                                           | Positionals                                                    | Options            | Payload                                                           |
| ------------------------------------------------- | -------------------------------------------------------------- | ------------------ | ----------------------------------------------------------------- |
| `tv list [category]`                              | `popular` (default), `top-rated`, `airing-today`, `on-the-air` | `--page`           | Paginated envelope                                                |
| `tv get <id>`                                     | show ID                                                        | `--append`         | Show details                                                      |
| `tv credits <id>`                                 | show ID                                                        | `--limit`          | `{ id, cast[], crew[] }`                                          |
| `tv images <id>`                                  | show ID                                                        | `--image-language` | `{ id, backdrops[], posters[], logos[] }`                         |
| `tv videos <id>`                                  | show ID                                                        | —                  | `{ id, results[] }`                                               |
| `tv similar <id>`                                 | show ID                                                        | `--page`           | Paginated envelope                                                |
| `tv recommendations <id>`                         | show ID                                                        | `--page`           | Paginated envelope                                                |
| `tv season <id> <season>`                         | show ID, season number                                         | —                  | Season with `episodes[]`                                          |
| `tv episode <id> <season> <episode>`              | show ID, season, episode                                       | `--append`         | Episode details                                                   |
| `tv aggregate-credits <id>`                       | show ID                                                        | `--limit`          | `{ id, cast[], crew[] }` with `roles[]` and `total_episode_count` |
| `tv season-credits <id> <season>`                 | show ID, season                                                | `--limit`          | `{ id, cast[], crew[] }`                                          |
| `tv season-aggregate-credits <id> <season>`       | show ID, season                                                | `--limit`          | Aggregate credits for the season                                  |
| `tv season-images <id> <season>`                  | show ID, season                                                | `--image-language` | `{ id, posters[] }`                                               |
| `tv season-videos <id> <season>`                  | show ID, season                                                | —                  | `{ id, results[] }`                                               |
| `tv episode-groups <id>`                          | show ID                                                        | —                  | `{ id, results[] }` of group IDs                                  |
| `tv episode-group <group-id>`                     | group ID (string)                                              | —                  | Group with `groups[]` and `episodes[]`                            |
| `tv external-ids <id>`                            | show ID                                                        | —                  | `{ id, imdb_id, tvdb_id, ... }`                                   |
| `tv season-external-ids <id> <season>`            | show ID, season                                                | —                  | `{ id, tvdb_id, ... }`                                            |
| `tv episode-external-ids <id> <season> <episode>` | show ID, season, episode                                       | —                  | `{ id, imdb_id, ... }`                                            |

Season `0` means specials; season numbers must be non-negative integers, episode numbers positive integers. Episode groups are the exception to numeric IDs — `<group-id>` is the alphanumeric ID returned by `tv episode-groups`.

Valid `--append` values for TV: `account_states`, `aggregate_credits`, `alternative_titles`, `changes`, `content_ratings`, `credits`, `episode_groups`, `external_ids`, `images`, `keywords`, `recommendations`, `reviews`, `screened_theatrically`, `similar`, `translations`, `videos`, `watch/providers`. Episodes accept `account_states`, `credits`, `external_ids`, `images`, `translations`, `videos`.

## People

| Command                    | Positionals | Options   | Payload                                       |
| -------------------------- | ----------- | --------- | --------------------------------------------- |
| `person get <id>`          | person ID   | —         | Person details                                |
| `person credits <id>`      | person ID   | `--limit` | `{ id, cast[], crew[] }` across movies and TV |
| `person external-ids <id>` | person ID   | —         | `{ id, imdb_id, ... }`                        |

Person details include `name`, `known_for_department`, `biography`, `birthday`, `deathday`, `place_of_birth`, `also_known_as[]`, and `known_for`.

## Collections and watch providers

| Command                        | Positionals   | Options            | Payload                                              |
| ------------------------------ | ------------- | ------------------ | ---------------------------------------------------- |
| `collection get <id>`          | collection ID | `--limit`          | Collection details with `parts[]`                    |
| `collection images <id>`       | collection ID | `--image-language` | `{ id, backdrops[], posters[], logos[] }`            |
| `collection translations <id>` | collection ID | —                  | `{ id, translations[] }`                             |
| `providers movie <id>`         | movie ID      | `--region`         | `{ id, results: { US: { link, flatrate[], ... } } }` |
| `providers tv <id>`            | show ID       | `--region`         | Same region-keyed shape                              |
| `providers list movie`         | —             | `--watch-region`   | `{ results: [{ provider_id, provider_name, ... }] }` |
| `providers list tv`            | —             | `--watch-region`   | `{ results: [...] }`                                 |

`collection parts` is not paginated; `--limit` only trims text output. `providers movie|tv --region` filters both text and JSON to that region; without it, text lists available regions and JSON returns the full map. Provider data is provided by JustWatch; attribute it when displayed.

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
