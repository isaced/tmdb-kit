# API reference

Every method returns a `Promise` and accepts an `AbortSignal` through `options.signal`.

## Client

```ts
createTMDB(options: TMDBFactoryOptions): TMDBClient
```

| Option             | Type                      | Default                                             |
| ------------------ | ------------------------- | --------------------------------------------------- |
| `accessToken`      | `string`                  | required unless `apiKey` or `transport` is set      |
| `apiKey`           | `string`                  | required unless `accessToken` or `transport` is set |
| `baseUrl`          | `string`                  | `https://api.themoviedb.org/3`                      |
| `fetch`            | `FetchLike`               | `globalThis.fetch` at request time                  |
| `defaultLanguage`  | `string`                  | TMDB default                                        |
| `defaultRegion`    | `string`                  | TMDB default                                        |
| `imageBaseUrl`     | `string`                  | `https://image.tmdb.org/t/p`                        |
| `images.transform` | `(url: string) => string` | none                                                |
| `headers`          | `HeadersInit`             | none                                                |
| `transport`        | `TMDBTransport`           | built-in HTTP client                                |

Passing both `accessToken` and `apiKey`, or neither without a transport, throws `TMDBRequestError`.

| Member       | Signature                    | Returns          |
| ------------ | ---------------------------- | ---------------- |
| `request`    | `request<T>(path, options?)` | `Promise<T>`     |
| `images.url` | `url(path, size?, options?)` | `string \| null` |

`request()` takes `{ query?, headers?, signal? }` and is the escape hatch for endpoints the SDK does not wrap.

## movies

| Method            | Signature                             | Returns                       |
| ----------------- | ------------------------------------- | ----------------------------- |
| `popular`         | `popular(options?)`                   | `PagedResponse<MovieSummary>` |
| `topRated`        | `topRated(options?)`                  | `PagedResponse<MovieSummary>` |
| `nowPlaying`      | `nowPlaying(options?)`                | `PagedResponse<MovieSummary>` |
| `upcoming`        | `upcoming(options?)`                  | `PagedResponse<MovieSummary>` |
| `details`         | `details<TAppend>(movieId, options?)` | `MovieDetails & TAppend`      |
| `credits`         | `credits(movieId, options?)`          | `CreditsResponse`             |
| `images`          | `images(movieId, options?)`           | `ImagesResponse`              |
| `recommendations` | `recommendations(movieId, options?)`  | `PagedResponse<MovieSummary>` |
| `similar`         | `similar(movieId, options?)`          | `PagedResponse<MovieSummary>` |
| `videos`          | `videos(movieId, options?)`           | `VideosResponse`              |
| `externalIds`     | `externalIds(movieId, options?)`      | `ExternalIds`                 |
| `watchProviders`  | `watchProviders(movieId, options?)`   | `WatchProvidersResponse`      |

The four list methods take `ListOptions`. `details` takes `MovieDetailsOptions` (`appendToResponse`, `language`, `signal`). `images` takes `ImageQueryOptions` (`includeImageLanguage`). `credits` and `videos` take `LanguageOptions`.

## tv

| Method                   | Signature                                                                  | Returns                     |
| ------------------------ | -------------------------------------------------------------------------- | --------------------------- |
| `popular`                | `popular(options?)`                                                        | `PagedResponse<TVSummary>`  |
| `topRated`               | `topRated(options?)`                                                       | `PagedResponse<TVSummary>`  |
| `airingToday`            | `airingToday(options?)`                                                    | `PagedResponse<TVSummary>`  |
| `onTheAir`               | `onTheAir(options?)`                                                       | `PagedResponse<TVSummary>`  |
| `details`                | `details<TAppend>(seriesId, options?)`                                     | `TVDetails & TAppend`       |
| `credits`                | `credits(seriesId, options?)`                                              | `CreditsResponse`           |
| `images`                 | `images(seriesId, options?)`                                               | `ImagesResponse`            |
| `recommendations`        | `recommendations(seriesId, options?)`                                      | `PagedResponse<TVSummary>`  |
| `similar`                | `similar(seriesId, options?)`                                              | `PagedResponse<TVSummary>`  |
| `videos`                 | `videos(seriesId, options?)`                                               | `VideosResponse`            |
| `seasonDetails`          | `seasonDetails<TAppend>(seriesId, seasonNumber, options?)`                 | `TVSeasonDetails & TAppend` |
| `seasonCredits`          | `seasonCredits(seriesId, seasonNumber, options?)`                          | `CreditsResponse`           |
| `seasonAggregateCredits` | `seasonAggregateCredits(seriesId, seasonNumber, options?)`                 | `AggregateCreditsResponse`  |
| `seasonImages`           | `seasonImages(seriesId, seasonNumber, options?)`                           | `SeasonImagesResponse`      |
| `seasonVideos`           | `seasonVideos(seriesId, seasonNumber, options?)`                           | `VideosResponse`            |
| `episodeDetails`         | `episodeDetails<TAppend>(seriesId, seasonNumber, episodeNumber, options?)` | `EpisodeDetails & TAppend`  |
| `aggregateCredits`       | `aggregateCredits(seriesId, options?)`                                     | `AggregateCreditsResponse`  |
| `episodeGroups`          | `episodeGroups(seriesId, options?)`                                        | `EpisodeGroupsResponse`     |
| `episodeGroup`           | `episodeGroup(groupId, options?)`                                          | `EpisodeGroupDetails`       |
| `externalIds`            | `externalIds(seriesId, options?)`                                          | `ExternalIds`               |
| `seasonExternalIds`      | `seasonExternalIds(seriesId, seasonNumber, options?)`                      | `ExternalIds`               |
| `episodeExternalIds`     | `episodeExternalIds(seriesId, seasonNumber, episodeNumber, options?)`      | `ExternalIds`               |
| `watchProviders`         | `watchProviders(seriesId, options?)`                                       | `WatchProvidersResponse`    |

TV list methods take `Omit<ListOptions, 'region'>` — the TV endpoints do not accept a region. `episodeGroup` takes the alphanumeric group ID as a `string`.

## search

| Method   | Signature                 | Returns                             |
| -------- | ------------------------- | ----------------------------------- |
| `movies` | `movies(query, options?)` | `PagedResponse<MovieSearchResult>`  |
| `tv`     | `tv(query, options?)`     | `PagedResponse<TVSearchResult>`     |
| `people` | `people(query, options?)` | `PagedResponse<PersonSearchResult>` |
| `multi`  | `multi(query, options?)`  | `PagedResponse<SearchMultiResult>`  |

`MovieSearchOptions` adds `year`, `primaryReleaseYear`, `includeAdult`. `TVSearchOptions` adds `firstAirDateYear`, `year`, `includeAdult`. `MultiSearchOptions` adds `includeAdult` and `exclude`.

## trending

| Method   | Signature                       | Returns                                                    |
| -------- | ------------------------------- | ---------------------------------------------------------- |
| `all`    | `all(timeWindow?, options?)`    | `PagedResponse<TrendingResult>`                            |
| `movies` | `movies(timeWindow?, options?)` | `PagedResponse<MovieSummary & { media_type?: 'movie' }>`   |
| `tv`     | `tv(timeWindow?, options?)`     | `PagedResponse<TVSummary & { media_type?: 'tv' }>`         |
| `people` | `people(timeWindow?, options?)` | `PagedResponse<PersonSummary & { media_type?: 'person' }>` |

`timeWindow` is `'day' | 'week'` and defaults to `'day'` in the SDK. Options are `{ language?, page?, signal? }`.

## people

| Method            | Signature                             | Returns                         |
| ----------------- | ------------------------------------- | ------------------------------- |
| `popular`         | `popular(options?)`                   | `PagedResponse<PersonSummary>`  |
| `details`         | `details(personId, options?)`         | `PersonDetails`                 |
| `combinedCredits` | `combinedCredits(personId, options?)` | `PersonCombinedCreditsResponse` |
| `externalIds`     | `externalIds(personId, options?)`     | `ExternalIds`                   |

## discover

| Method   | Signature          | Returns                       |
| -------- | ------------------ | ----------------------------- |
| `movies` | `movies(options?)` | `PagedResponse<MovieSummary>` |
| `tv`     | `tv(options?)`     | `PagedResponse<TVSummary>`    |

`DiscoverMovieOptions` and `DiscoverTVOptions` accept `page`, `language`, `sortBy`, `includeAdult`, `voteAverageGte/Lte`, `voteCountGte/Lte`, `runtimeGte/Lte`, `withGenres`, `withoutGenres`, `withKeywords`, `withCompanies`, `withOriginCountry`, `withOriginalLanguage`, `withWatchProviders`, `watchRegion`, and `withWatchMonetizationTypes`. Movie adds `region`, `year`, `primaryReleaseYear`, `primaryReleaseDateGte/Lte`, `releaseDateGte/Lte`, `withPeople`, `withCast`, `withCrew`, and `withReleaseType`. TV adds `firstAirDateYear`, `firstAirDateGte/Lte`, `airDateGte/Lte`, `withNetworks`, `withStatus`, and `withType`.

`DiscoverIdFilter` is `number | string | readonly (number | string)[]`. Arrays are comma-joined (AND); a string such as `"28|12"` preserves TMDB's pipe syntax (OR). `watchRegion` is never inherited from `defaultRegion`; `region` on movie discover is. Unmodeled filters go through `request()`.

## find

| Method         | Signature                                                  | Returns        |
| -------------- | ---------------------------------------------------------- | -------------- |
| `byExternalId` | `byExternalId(externalId, { source, language?, signal? })` | `FindResponse` |

`source` is one of `imdb_id`, `freebase_mid`, `freebase_id`, `tvdb_id`, `tvrage_id`, `facebook_id`, `twitter_id`, `instagram_id`, `tiktok_id`, `youtube_id`, or `wikidata_id`. The external ID is trimmed and URL-encoded. `FindResponse` always contains `movie_results`, `tv_results`, `person_results`, `tv_episode_results`, and `tv_season_results`.

## collections

| Method         | Signature                              | Returns                          |
| -------------- | -------------------------------------- | -------------------------------- |
| `details`      | `details(collectionId, options?)`      | `CollectionDetails`              |
| `images`       | `images(collectionId, options?)`       | `ImagesResponse`                 |
| `translations` | `translations(collectionId, options?)` | `CollectionTranslationsResponse` |

`details` takes `LanguageOptions`, `images` takes `ImageQueryOptions`, and `translations` takes `RequestOptions` only. `CollectionDetails.parts` is not paginated.

## watch providers

| Method                  | Signature                            | Returns                     |
| ----------------------- | ------------------------------------ | --------------------------- |
| `movies.watchProviders` | `watchProviders(movieId, options?)`  | `WatchProvidersResponse`    |
| `tv.watchProviders`     | `watchProviders(seriesId, options?)` | `WatchProvidersResponse`    |
| `watchProviders.movies` | `movies(options?)`                   | `WatchProviderListResponse` |
| `watchProviders.tv`     | `tv(options?)`                       | `WatchProviderListResponse` |

Per-title responses are keyed by ISO 3166-1 region: `results: Record<string, WatchProviderRegion>`, where each entry has `link` and optional `flatrate`, `free`, `ads`, `rent`, and `buy` arrays. The reference lists resolve provider IDs to names and logos and accept `watchRegion` and `language`. Provider data is provided by JustWatch; attribute it when displayed.

## genres, configuration, images

| Method                              | Signature                       | Returns           |
| ----------------------------------- | ------------------------------- | ----------------- |
| `genres.movies`                     | `movies(options?)`              | `GenresResponse`  |
| `genres.tv`                         | `tv(options?)`                  | `GenresResponse`  |
| `configuration.details`             | `details(options?)`             | `Configuration`   |
| `configuration.countries`           | `countries(options?)`           | `Country[]`       |
| `configuration.jobs`                | `jobs(options?)`                | `JobDepartment[]` |
| `configuration.languages`           | `languages(options?)`           | `Language[]`      |
| `configuration.primaryTranslations` | `primaryTranslations(options?)` | `string[]`        |
| `configuration.timezones`           | `timezones(options?)`           | `Timezone[]`      |
| `images.url`                        | `url(path, size?, options?)`    | `string \| null`  |

`images.url` defaults `size` to `'original'` and accepts `{ transform }` per call. It returns `null` for `null` or `undefined` paths and never runs the transform on them. `buildImageUrl(path, size, options)` is the standalone equivalent.

## Shared option types

| Type                       | Fields                                          |
| -------------------------- | ----------------------------------------------- |
| `RequestOptions`           | `signal?`                                       |
| `LanguageOptions`          | `signal?`, `language?`                          |
| `ListOptions`              | `signal?`, `language?`, `page?`, `region?`      |
| `MovieDetailsOptions`      | `signal?`, `language?`, `appendToResponse?`     |
| `TVDetailsOptions`         | `signal?`, `language?`, `appendToResponse?`     |
| `TVSeasonDetailsOptions`   | `signal?`, `language?`, `appendToResponse?`     |
| `EpisodeDetailsOptions`    | `signal?`, `language?`, `appendToResponse?`     |
| `ImageQueryOptions`        | `signal?`, `language?`, `includeImageLanguage?` |
| `FindOptions`              | `signal?`, `language?`, `source`                |
| `WatchProviderListOptions` | `signal?`, `language?`, `watchRegion?`          |
| `TMDBRequestOptions`       | `query?`, `headers?`, `signal?`                 |

`appendToResponse` accepts one value or an array. `includeImageLanguage` accepts a string or an array of strings.

## Response shapes

| Type                             | Shape                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------- |
| `PagedResponse<T>`               | `{ page, results: T[], total_pages, total_results }`                                   |
| `CreditsResponse`                | `{ id, cast: CreditCastMember[], crew: CreditCrewMember[] }`                           |
| `AggregateCreditsResponse`       | `{ id, cast: AggregateCastMember[], crew: AggregateCrewMember[] }`                     |
| `VideosResponse`                 | `{ id, results: Video[] }`                                                             |
| `ImagesResponse`                 | `{ id, backdrops: ImageItem[], posters: ImageItem[], logos: ImageItem[] }`             |
| `SeasonImagesResponse`           | `{ id, posters: ImageItem[] }`                                                         |
| `GenresResponse`                 | `{ genres: Genre[] }`                                                                  |
| `PersonCombinedCreditsResponse`  | `{ id, cast: PersonCombinedCast[], crew: PersonCombinedCrew[] }`                       |
| `EpisodeGroupsResponse`          | `{ id, results: EpisodeGroupSummary[] }`                                               |
| `ExternalIds`                    | `{ id, imdb_id?, tvdb_id?, wikidata_id?, ... }`                                        |
| `FindResponse`                   | `{ movie_results, tv_results, person_results, tv_episode_results, tv_season_results }` |
| `WatchProvidersResponse`         | `{ id, results: Record<region, WatchProviderRegion> }`                                 |
| `WatchProviderListResponse`      | `{ results: WatchProviderListItem[] }`                                                 |
| `CollectionDetails`              | `{ id, name, overview, parts: CollectionPart[], ... }`                                 |
| `CollectionTranslationsResponse` | `{ id, translations: CollectionTranslation[] }`                                        |

## Image sizes

Each size family has a readonly constant array and a type guard:

| Family    | Constant               | Guard                 |
| --------- | ---------------------- | --------------------- |
| Posters   | `KNOWN_POSTER_SIZES`   | `isKnownPosterSize`   |
| Backdrops | `KNOWN_BACKDROP_SIZES` | `isKnownBackdropSize` |
| Logos     | `KNOWN_LOGO_SIZES`     | `isKnownLogoSize`     |
| Profiles  | `KNOWN_PROFILE_SIZES`  | `isKnownProfileSize`  |
| Stills    | `KNOWN_STILL_SIZES`    | `isKnownStillSize`    |
| All       | `KNOWN_IMAGE_SIZES`    | `isKnownImageSize`    |

`ImageSize` keeps a `(string & {})` escape hatch so newly added TMDB sizes still compile.
