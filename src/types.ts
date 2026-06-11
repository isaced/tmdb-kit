/** Primitive JSON values returned by TMDB. */
export type JsonPrimitive = string | number | boolean | null

/** JSON object/array tree returned by TMDB for fields this SDK does not model yet. */
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]

export interface JsonObject {
  [key: string]: JsonValue | undefined
}

/** Escape hatch for append_to_response payloads and future TMDB fields. */
export type TMDBObject = Record<string, unknown>

export type TMDBDateString = string
export type LanguageCode = string
export type RegionCode = string

export type MediaType = 'movie' | 'tv' | 'person'
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
  origin_country?: string[]
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
export type LogoSize = 'w45' | 'w92' | 'w154' | 'w185' | 'w300' | 'w500' | 'original' | (string & {})
export type PosterSize = 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' | (string & {})
export type ProfileSize = 'w45' | 'w185' | 'h632' | 'original' | (string & {})
export type StillSize = 'w92' | 'w185' | 'w300' | 'original' | (string & {})
export type ImageSize = BackdropSize | LogoSize | PosterSize | ProfileSize | StillSize

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

export interface ListOptions {
  language?: LanguageCode
  page?: number
  region?: RegionCode
}

export interface LanguageOptions {
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
}

export interface ImageQueryOptions extends LanguageOptions {
  includeImageLanguage?: string | readonly string[]
}
