/** Primitive JSON values returned by TMDB. */
export type JsonPrimitive = string | number | boolean | null

/** JSON object/array tree returned by TMDB for fields this SDK does not model yet. */
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]

export interface JsonObject {
  [key: string]: JsonValue | undefined
}

/** Escape hatch for append_to_response payloads and future TMDB fields. */
export type TMDBObject = Record<string, unknown>

/** Date string in TMDB format (typically `YYYY-MM-DD`). */
export type TMDBDateString = string

/** ISO 639-1 language code (e.g. `"en"`, `"zh"`). */
export type LanguageCode = string

/** ISO 3166-1 country/region code (e.g. `"US"`, `"CN"`). */
export type RegionCode = string

/** Supported media types for multi-search results. */
export type MediaType = 'movie' | 'tv' | 'person'

/** Time window for trending endpoints: `"day"` or `"week"`. */
export type TrendingTimeWindow = 'day' | 'week'

export interface PagedResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export interface Genre {
  id: number
  name: string
}

export interface ProductionCompany {
  id: number
  logo_path: string | null
  name: string
  origin_country: string
}

export interface ProductionCountry {
  iso_3166_1: string
  name: string
}

export interface SpokenLanguage {
  english_name: string
  iso_639_1: string
  name: string
}

export interface CollectionSummary {
  id: number
  name: string
  poster_path: string | null
  backdrop_path: string | null
}

export interface MovieSummary {
  adult: boolean
  backdrop_path: string | null
  genre_ids: number[]
  id: number
  original_language: string
  original_title: string
  overview: string
  popularity: number
  poster_path: string | null
  release_date: TMDBDateString
  title: string
  video: boolean
  vote_average: number
  vote_count: number
}

export interface MovieDetails extends Omit<MovieSummary, 'genre_ids'> {
  belongs_to_collection: CollectionSummary | null
  budget: number
  genres: Genre[]
  homepage: string | null
  imdb_id: string | null
  production_companies: ProductionCompany[]
  production_countries: ProductionCountry[]
  revenue: number
  runtime: number | null
  spoken_languages: SpokenLanguage[]
  status: string
  tagline: string | null
}

export interface TVSummary {
  adult?: boolean
  backdrop_path: string | null
  first_air_date: TMDBDateString
  genre_ids: number[]
  id: number
  name: string
  origin_country: string[]
  original_language: string
  original_name: string
  overview: string
  popularity: number
  poster_path: string | null
  vote_average: number
  vote_count: number
}

export interface CreatedBy {
  id: number
  credit_id: string
  name: string
  gender: number
  profile_path: string | null
}

export interface Network {
  id: number
  logo_path: string | null
  name: string
  origin_country: string
}

export interface SeasonSummary {
  air_date: TMDBDateString | null
  episode_count: number
  id: number
  name: string
  overview: string
  poster_path: string | null
  season_number: number
  vote_average: number
}

export interface EpisodeGuestStar {
  adult: boolean
  character: string
  credit_id: string
  gender: number | null
  id: number
  known_for_department: string
  name: string
  order: number
  original_name: string
  popularity: number
  profile_path: string | null
}

export interface EpisodeSummary {
  air_date: TMDBDateString | null
  crew: CreditCrewMember[]
  episode_number: number
  episode_type: string
  guest_stars: EpisodeGuestStar[]
  id: number
  name: string
  overview: string
  production_code: string | null
  runtime: number | null
  season_number: number
  show_id: number
  still_path: string | null
  vote_average: number
  vote_count: number
}

export interface TVSeasonDetails {
  _id: string
  air_date: TMDBDateString | null
  episodes: EpisodeSummary[]
  id: number
  name: string
  overview: string
  poster_path: string | null
  season_number: number
  vote_average: number
}

export type TVSeasonAppendToResponse =
  | 'account_states'
  | 'aggregate_credits'
  | 'credits'
  | 'external_ids'
  | 'images'
  | 'translations'
  | 'videos'
  | (string & {})

export interface TVSeasonDetailsOptions extends LanguageOptions {
  appendToResponse?: TVSeasonAppendToResponse | readonly TVSeasonAppendToResponse[]
}

/**
 * Episode details endpoint payload. Unlike {@link EpisodeSummary}, the
 * single-episode endpoint does not return `show_id`.
 */
export type EpisodeDetails = Omit<EpisodeSummary, 'show_id'>

export type EpisodeAppendToResponse =
  | 'account_states'
  | 'credits'
  | 'external_ids'
  | 'images'
  | 'translations'
  | 'videos'
  | (string & {})

export interface EpisodeDetailsOptions extends LanguageOptions {
  appendToResponse?: EpisodeAppendToResponse | readonly EpisodeAppendToResponse[]
}

export interface AggregateRole {
  credit_id: string
  character: string
  episode_count: number
}

export interface AggregateJob {
  credit_id: string
  job: string
  episode_count: number
}

export interface AggregateCastMember {
  adult?: boolean
  gender: number | null
  id: number
  known_for_department: string
  name: string
  order: number
  original_name: string
  popularity: number
  profile_path: string | null
  roles: AggregateRole[]
  total_episode_count: number
}

export interface AggregateCrewMember {
  adult?: boolean
  department: string
  gender: number | null
  id: number
  jobs: AggregateJob[]
  known_for_department: string
  name: string
  original_name: string
  popularity: number
  profile_path: string | null
  total_episode_count: number
}

export interface AggregateCreditsResponse {
  id: number
  cast: AggregateCastMember[]
  crew: AggregateCrewMember[]
}

export interface EpisodeGroupSummary {
  description: string
  episode_count: number
  group_count: number
  id: string
  name: string
  network: Network | null
  type: number
}

export interface EpisodeGroupsResponse {
  id: number
  results: EpisodeGroupSummary[]
}

export interface EpisodeGroupEpisode {
  air_date: TMDBDateString | null
  episode_number: number
  episode_type: string
  id: number
  name: string
  order: number
  overview: string
  production_code: string | null
  runtime: number | null
  season_number: number
  show_id: number
  still_path: string | null
  vote_average: number
  vote_count: number
}

export interface EpisodeGroup {
  id: string
  name: string
  order: number
  locked: boolean
  episodes: EpisodeGroupEpisode[]
}

export interface EpisodeGroupDetails extends EpisodeGroupSummary {
  groups: EpisodeGroup[]
}

export interface TVDetails extends Omit<TVSummary, 'genre_ids'> {
  created_by: CreatedBy[]
  episode_run_time: number[]
  genres: Genre[]
  homepage: string | null
  in_production: boolean
  languages: string[]
  last_air_date: TMDBDateString | null
  networks: Network[]
  number_of_episodes: number
  number_of_seasons: number
  production_companies: ProductionCompany[]
  production_countries: ProductionCountry[]
  seasons: SeasonSummary[]
  spoken_languages: SpokenLanguage[]
  status: string
  tagline: string | null
  type: string
}

export interface PersonKnownForMovie extends MovieSummary {
  media_type: 'movie'
}

export interface PersonKnownForTV extends TVSummary {
  media_type: 'tv'
}

export type PersonKnownFor = PersonKnownForMovie | PersonKnownForTV

export interface PersonSummary {
  adult: boolean
  gender: number
  id: number
  known_for: PersonKnownFor[]
  known_for_department: string
  name: string
  original_name?: string
  popularity: number
  profile_path: string | null
}

export interface PersonDetails extends Omit<PersonSummary, 'known_for'> {
  also_known_as: string[]
  biography: string
  birthday: TMDBDateString | null
  deathday: TMDBDateString | null
  homepage: string | null
  imdb_id: string | null
  place_of_birth: string | null
}

export interface PersonCombinedCastMovie extends MovieSummary {
  character: string
  credit_id: string
  media_type: 'movie'
  order?: number
}

export interface PersonCombinedCastTV extends TVSummary {
  character: string
  credit_id: string
  episode_count?: number
  media_type: 'tv'
}

export type PersonCombinedCast = PersonCombinedCastMovie | PersonCombinedCastTV

export interface PersonCombinedCrewMovie extends MovieSummary {
  credit_id: string
  department: string
  job: string
  media_type: 'movie'
}

export interface PersonCombinedCrewTV extends TVSummary {
  credit_id: string
  department: string
  job: string
  media_type: 'tv'
}

export type PersonCombinedCrew = PersonCombinedCrewMovie | PersonCombinedCrewTV

export interface PersonCombinedCreditsResponse {
  cast: PersonCombinedCast[]
  crew: PersonCombinedCrew[]
  id: number
}

export interface MovieSearchResult extends MovieSummary {
  media_type?: 'movie'
}

export interface TVSearchResult extends TVSummary {
  media_type?: 'tv'
}

export interface PersonSearchResult extends PersonSummary {
  media_type?: 'person'
}

export type SearchMultiResult =
  | (MovieSummary & { media_type: 'movie' })
  | (TVSummary & { media_type: 'tv' })
  | (PersonSummary & { media_type: 'person' })

/** A single multi-search result narrowed to a specific media type. */
export type MovieMultiResult = MovieSummary & { media_type: 'movie' }
export type TVMultiResult = TVSummary & { media_type: 'tv' }
export type PersonMultiResult = PersonSummary & { media_type: 'person' }

export type TrendingResult = SearchMultiResult

export interface CreditCastMember {
  adult?: boolean
  cast_id?: number
  character: string
  credit_id: string
  gender: number | null
  id: number
  known_for_department: string
  name: string
  order: number
  original_name: string
  popularity: number
  profile_path: string | null
}

export interface CreditCrewMember {
  adult?: boolean
  credit_id: string
  department: string
  gender: number | null
  id: number
  job: string
  known_for_department: string
  name: string
  original_name: string
  popularity: number
  profile_path: string | null
}

export interface CreditsResponse {
  id: number
  cast: CreditCastMember[]
  crew: CreditCrewMember[]
}

export interface Video {
  id: string
  iso_3166_1: string
  iso_639_1: string
  key: string
  name: string
  official: boolean
  published_at: string
  site: string
  size: number
  type: string
}

export interface VideosResponse {
  id: number
  results: Video[]
}

export interface ImageItem {
  aspect_ratio: number
  height: number
  iso_639_1: string | null
  file_path: string
  vote_average: number
  vote_count: number
  width: number
}

export interface ImagesResponse {
  id: number
  backdrops: ImageItem[]
  logos?: ImageItem[]
  posters: ImageItem[]
}

export interface SeasonImagesResponse {
  id: number
  posters: ImageItem[]
}

export interface ConfigurationImages {
  base_url: string
  secure_base_url: string
  backdrop_sizes: string[]
  logo_sizes: string[]
  poster_sizes: string[]
  profile_sizes: string[]
  still_sizes: string[]
}

export interface Configuration {
  images: ConfigurationImages
  change_keys: string[]
}

export interface Country {
  iso_3166_1: string
  english_name: string
  native_name: string
}

export interface Language {
  iso_639_1: string
  english_name: string
  name: string
}

export interface Timezone {
  iso_3166_1: string
  zones: string[]
}

export interface JobDepartment {
  department: string
  jobs: string[]
}

export interface GenresResponse {
  genres: Genre[]
}

export type BackdropSize = 'w300' | 'w780' | 'w1280' | 'original' | (string & {})
export type LogoSize =
  'w45' | 'w92' | 'w154' | 'w185' | 'w300' | 'w500' | 'original' | (string & {})
export type PosterSize =
  'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' | (string & {})
export type ProfileSize = 'w45' | 'w185' | 'h632' | 'original' | (string & {})
export type StillSize = 'w92' | 'w185' | 'w300' | 'original' | (string & {})
export type ImageSize = BackdropSize | LogoSize | PosterSize | ProfileSize | StillSize

/**
 * Public set of image sizes TMDB currently documents. The SDK does not
 * pin to a static copy of the TMDB docs — TMDB has added new sizes in
 * the past (e.g. `h632` for profile) without notice — but exposing the
 * canonical list lets callers:
 *
 * - iterate over the set to build a size picker
 * - validate user-supplied sizes with `isKnownBackdropSize(...)` etc.
 * - type a variable as a "known" size without giving up the
 *   `(string & {})` escape hatch for forward-compatibility
 *
 * If TMDB publishes a new size, the SDK will still accept it at runtime
 * (every helper is `(string & {})` permissive), but you will need to
 * add the literal to these constants to get autocomplete on it.
 */
export const KNOWN_BACKDROP_SIZES: readonly ['w300', 'w780', 'w1280', 'original'] = Object.freeze([
  'w300',
  'w780',
  'w1280',
  'original',
] as const)
export const KNOWN_LOGO_SIZES: readonly ['w45', 'w92', 'w154', 'w185', 'w300', 'w500', 'original'] =
  Object.freeze(['w45', 'w92', 'w154', 'w185', 'w300', 'w500', 'original'] as const)
export const KNOWN_POSTER_SIZES: readonly [
  'w92',
  'w154',
  'w185',
  'w342',
  'w500',
  'w780',
  'original',
] = Object.freeze(['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'] as const)
export const KNOWN_PROFILE_SIZES: readonly ['w45', 'w185', 'h632', 'original'] = Object.freeze([
  'w45',
  'w185',
  'h632',
  'original',
] as const)
export const KNOWN_STILL_SIZES: readonly ['w92', 'w185', 'w300', 'original'] = Object.freeze([
  'w92',
  'w185',
  'w300',
  'original',
] as const)

export type KnownBackdropSize = (typeof KNOWN_BACKDROP_SIZES)[number]
export type KnownLogoSize = (typeof KNOWN_LOGO_SIZES)[number]
export type KnownPosterSize = (typeof KNOWN_POSTER_SIZES)[number]
export type KnownProfileSize = (typeof KNOWN_PROFILE_SIZES)[number]
export type KnownStillSize = (typeof KNOWN_STILL_SIZES)[number]
export type KnownImageSize =
  KnownBackdropSize | KnownLogoSize | KnownPosterSize | KnownProfileSize | KnownStillSize

/** Union of every documented image size. */
export const KNOWN_IMAGE_SIZES: readonly KnownImageSize[] = Object.freeze([
  ...KNOWN_BACKDROP_SIZES,
  ...KNOWN_LOGO_SIZES,
  ...KNOWN_POSTER_SIZES,
  ...KNOWN_PROFILE_SIZES,
  ...KNOWN_STILL_SIZES,
] as const)

/** O(1) membership check backed by a Set. */
const KNOWN_BACKDROP_SET: ReadonlySet<string> = new Set(KNOWN_BACKDROP_SIZES)
const KNOWN_LOGO_SET: ReadonlySet<string> = new Set(KNOWN_LOGO_SIZES)
const KNOWN_POSTER_SET: ReadonlySet<string> = new Set(KNOWN_POSTER_SIZES)
const KNOWN_PROFILE_SET: ReadonlySet<string> = new Set(KNOWN_PROFILE_SIZES)
const KNOWN_STILL_SET: ReadonlySet<string> = new Set(KNOWN_STILL_SIZES)
const KNOWN_IMAGE_SET: ReadonlySet<string> = new Set(KNOWN_IMAGE_SIZES)

export function isKnownBackdropSize(value: string): value is KnownBackdropSize {
  return KNOWN_BACKDROP_SET.has(value)
}

export function isKnownLogoSize(value: string): value is KnownLogoSize {
  return KNOWN_LOGO_SET.has(value)
}

export function isKnownPosterSize(value: string): value is KnownPosterSize {
  return KNOWN_POSTER_SET.has(value)
}

export function isKnownProfileSize(value: string): value is KnownProfileSize {
  return KNOWN_PROFILE_SET.has(value)
}

export function isKnownStillSize(value: string): value is KnownStillSize {
  return KNOWN_STILL_SET.has(value)
}

/** True if `value` is in any documented size set. */
export function isKnownImageSize(value: string): value is KnownImageSize {
  return KNOWN_IMAGE_SET.has(value)
}

export type MovieAppendToResponse =
  | 'account_states'
  | 'alternative_titles'
  | 'changes'
  | 'credits'
  | 'external_ids'
  | 'images'
  | 'keywords'
  | 'lists'
  | 'recommendations'
  | 'release_dates'
  | 'reviews'
  | 'similar'
  | 'translations'
  | 'videos'
  | 'watch/providers'
  | (string & {})

export type TVAppendToResponse =
  | 'account_states'
  | 'aggregate_credits'
  | 'alternative_titles'
  | 'changes'
  | 'content_ratings'
  | 'credits'
  | 'episode_groups'
  | 'external_ids'
  | 'images'
  | 'keywords'
  | 'recommendations'
  | 'reviews'
  | 'screened_theatrically'
  | 'similar'
  | 'translations'
  | 'videos'
  | 'watch/providers'
  | (string & {})

/** Per-request options shared by every resource method. */
export interface RequestOptions {
  /** AbortSignal used to cancel the underlying request. */
  signal?: AbortSignal
}

export interface ListOptions extends RequestOptions {
  language?: LanguageCode
  page?: number
  region?: RegionCode
}

export interface LanguageOptions extends RequestOptions {
  language?: LanguageCode
}

export interface MovieDetailsOptions extends LanguageOptions {
  appendToResponse?: MovieAppendToResponse | readonly MovieAppendToResponse[]
}

export interface TVDetailsOptions extends LanguageOptions {
  appendToResponse?: TVAppendToResponse | readonly TVAppendToResponse[]
}

export interface MovieSearchOptions extends ListOptions {
  includeAdult?: boolean
  primaryReleaseYear?: string | number
  year?: string | number
}

export interface TVSearchOptions extends Omit<ListOptions, 'region'> {
  firstAirDateYear?: string | number
  includeAdult?: boolean
  year?: string | number
}

export interface MultiSearchOptions extends Omit<ListOptions, 'region'> {
  includeAdult?: boolean
  /**
   * Media types to exclude from a `search.multi()` response. Filtering is
   * performed client-side because the TMDB multi-search endpoint does not
   * support a server-side media_type filter.
   */
  exclude?: ReadonlyArray<MediaType>
}

export interface ImageQueryOptions extends LanguageOptions {
  includeImageLanguage?: string | readonly string[]
}

/** External ID namespace accepted by the TMDB `/find` endpoint. */
export type ExternalIdSource =
  | 'imdb_id'
  | 'freebase_mid'
  | 'freebase_id'
  | 'tvdb_id'
  | 'tvrage_id'
  | 'facebook_id'
  | 'twitter_id'
  | 'instagram_id'
  | 'tiktok_id'
  | 'youtube_id'
  | 'wikidata_id'

/**
 * External IDs attached to a TMDB movie, TV show, season, episode, or person.
 *
 * Fields are optional because they vary by entity: seasons have no
 * `imdb_id`, people have no `tvdb_id`, and older records omit newer
 * social IDs.
 */
export interface ExternalIds {
  id: number
  imdb_id?: string | null
  freebase_mid?: string | null
  freebase_id?: string | null
  facebook_id?: string | null
  instagram_id?: string | null
  twitter_id?: string | null
  tiktok_id?: string | null
  youtube_id?: string | null
  wikidata_id?: string | null
  tvdb_id?: number | null
  tvrage_id?: number | null
}

export interface FindOptions extends LanguageOptions {
  /** Which external ID namespace `externalId` belongs to. */
  source: ExternalIdSource
}

export interface FindMovieResult extends MovieSummary {
  media_type: 'movie'
}

export interface FindTVResult extends TVSummary {
  media_type: 'tv'
}

export interface FindPersonResult extends PersonSummary {
  media_type: 'person'
}

export interface FindTVEpisodeResult {
  air_date: TMDBDateString | null
  episode_number: number
  episode_type: string
  id: number
  media_type: 'tv_episode'
  name: string
  overview: string
  production_code: string | null
  runtime: number | null
  season_number: number
  show_id: number
  still_path: string | null
  vote_average: number
  vote_count: number
}

export interface FindTVSeasonResult extends SeasonSummary {
  media_type: 'tv_season'
  show_id: number
}

/**
 * Result of a reverse external-ID lookup.
 *
 * TMDB returns all five arrays on every call, even when only one has
 * matches. Episodes and seasons are only present for TV IDs.
 */
export interface FindResponse {
  movie_results: FindMovieResult[]
  person_results: FindPersonResult[]
  tv_episode_results: FindTVEpisodeResult[]
  tv_results: FindTVResult[]
  tv_season_results: FindTVSeasonResult[]
}

export type WatchMonetizationType = 'flatrate' | 'free' | 'ads' | 'rent' | 'buy'

export interface WatchProvider {
  display_priority: number
  logo_path: string | null
  provider_id: number
  provider_name: string
}

export interface WatchProviderRegion {
  /** JustWatch link for this title and region. */
  link: string
  ads?: WatchProvider[]
  buy?: WatchProvider[]
  flatrate?: WatchProvider[]
  free?: WatchProvider[]
  rent?: WatchProvider[]
}

/**
 * Per-title watch providers keyed by ISO 3166-1 region code.
 *
 * Use `client.watchProviders.movies()` / `tv()` to resolve provider IDs
 * to names and logos.
 */
export interface WatchProvidersResponse {
  id: number
  results: Record<string, WatchProviderRegion>
}

export interface WatchProviderListItem extends WatchProvider {
  /** Display priority per region, keyed by ISO 3166-1 region code. */
  display_priorities: Record<string, number>
}

export interface WatchProviderListResponse {
  results: WatchProviderListItem[]
}

export interface WatchProviderListOptions extends LanguageOptions {
  /**
   * Limit the provider list to one region. Unlike `defaultRegion`, this
   * is never inherited automatically: it describes provider availability,
   * not a release region.
   */
  watchRegion?: RegionCode
}

export interface CollectionPart extends MovieSummary {
  media_type?: 'movie'
}

export interface CollectionDetails extends CollectionSummary {
  original_language: string
  original_name: string
  overview: string
  parts: CollectionPart[]
}

export interface CollectionTranslationData {
  homepage: string
  overview: string
  title: string
}

export interface CollectionTranslation {
  data: CollectionTranslationData
  english_name: string
  iso_3166_1: string
  iso_639_1: string
  name: string
}

export interface CollectionTranslationsResponse {
  id: number
  translations: CollectionTranslation[]
}

/**
 * Multi-value discover filter.
 *
 * Arrays are comma-joined (TMDB treats commas as AND). Pass a raw string
 * such as `"28|12"` to use TMDB's pipe syntax (OR).
 */
export type DiscoverIdFilter = number | string | readonly (number | string)[]

export type DiscoverMovieSortBy =
  | 'popularity.asc'
  | 'popularity.desc'
  | 'revenue.asc'
  | 'revenue.desc'
  | 'primary_release_date.asc'
  | 'primary_release_date.desc'
  | 'original_title.asc'
  | 'original_title.desc'
  | 'title.asc'
  | 'title.desc'
  | 'vote_average.asc'
  | 'vote_average.desc'
  | 'vote_count.asc'
  | 'vote_count.desc'

export type DiscoverTVSortBy =
  | 'first_air_date.asc'
  | 'first_air_date.desc'
  | 'name.asc'
  | 'name.desc'
  | 'original_name.asc'
  | 'original_name.desc'
  | 'popularity.asc'
  | 'popularity.desc'
  | 'vote_average.asc'
  | 'vote_average.desc'
  | 'vote_count.asc'
  | 'vote_count.desc'

export interface DiscoverCommonOptions extends RequestOptions {
  includeAdult?: boolean
  language?: LanguageCode
  page?: number
  runtimeGte?: number
  runtimeLte?: number
  voteAverageGte?: number
  voteAverageLte?: number
  voteCountGte?: number
  voteCountLte?: number
  /** Provider availability region. Never inherited from `defaultRegion`. */
  watchRegion?: RegionCode
  withCompanies?: DiscoverIdFilter
  withGenres?: DiscoverIdFilter
  withKeywords?: DiscoverIdFilter
  withOriginalLanguage?: LanguageCode
  withOriginCountry?: RegionCode | readonly RegionCode[]
  withWatchMonetizationTypes?: WatchMonetizationType | readonly WatchMonetizationType[]
  withWatchProviders?: DiscoverIdFilter
  withoutGenres?: DiscoverIdFilter
}

export interface DiscoverMovieOptions extends DiscoverCommonOptions {
  primaryReleaseDateGte?: TMDBDateString
  primaryReleaseDateLte?: TMDBDateString
  primaryReleaseYear?: number
  /** Release region. Inherits `defaultRegion` when omitted. */
  region?: RegionCode
  releaseDateGte?: TMDBDateString
  releaseDateLte?: TMDBDateString
  sortBy?: DiscoverMovieSortBy
  withCast?: DiscoverIdFilter
  withCrew?: DiscoverIdFilter
  withPeople?: DiscoverIdFilter
  withReleaseType?: DiscoverIdFilter
  year?: number
}

export interface DiscoverTVOptions extends DiscoverCommonOptions {
  airDateGte?: TMDBDateString
  airDateLte?: TMDBDateString
  firstAirDateGte?: TMDBDateString
  firstAirDateLte?: TMDBDateString
  firstAirDateYear?: number
  sortBy?: DiscoverTVSortBy
  withNetworks?: DiscoverIdFilter
  withStatus?: number
  withType?: number
}
