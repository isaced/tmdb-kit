import type {
  AggregateCreditsResponse,
  CreditsResponse,
  EpisodeDetails,
  EpisodeGroupDetails,
  EpisodeGroupsResponse,
  GenresResponse,
  ImageItem,
  ImagesResponse,
  MovieDetails,
  MovieSearchResult,
  PagedResponse,
  PersonCombinedCast,
  PersonCombinedCreditsResponse,
  PersonCombinedCrew,
  PersonDetails,
  PersonSearchResult,
  SearchMultiResult,
  SeasonImagesResponse,
  TMDBClient,
  TVDetails,
  TVSearchResult,
  TVSeasonDetails,
  VideosResponse,
} from '../index'
import type { SearchType } from './options'

export type SearchResult =
  MovieSearchResult | TVSearchResult | PersonSearchResult | SearchMultiResult

export function printJson(value: unknown, compact = false): void {
  process.stdout.write(`${compact ? JSON.stringify(value) : JSON.stringify(value, null, 2)}\n`)
}

export function printSearchResults(response: PagedResponse<SearchResult>, type: SearchType): void {
  const lines = [
    `Page ${response.page}/${response.total_pages} · ${response.total_results} results`,
  ]

  if (response.results.length === 0) {
    lines.push('No results.')
  } else {
    response.results.forEach((result, index) => {
      lines.push(formatSearchResult(result, index, type))
    })
  }

  writeLines(lines)
}

export function printMovie(movie: MovieDetails, tmdb: TMDBClient): void {
  const year = movie.release_date ? ` (${movie.release_date.slice(0, 4)})` : ''
  const lines = [`${movie.title}${year}`]

  if (movie.original_title !== movie.title) {
    lines.push(`Original title: ${movie.original_title}`)
  }
  if (movie.tagline) {
    lines.push(movie.tagline)
  }

  const facts = [
    movie.status,
    movie.runtime ? `${movie.runtime} min` : undefined,
    `★ ${movie.vote_average.toFixed(1)}/10 (${movie.vote_count} votes)`,
  ].filter(Boolean)
  lines.push(facts.join(' · '))

  if (movie.genres.length > 0) {
    lines.push(`Genres: ${movie.genres.map((genre) => genre.name).join(', ')}`)
  }

  lines.push(`TMDB: https://www.themoviedb.org/movie/${movie.id}`)

  const poster = tmdb.images.url(movie.poster_path, 'w500')
  if (poster) {
    lines.push(`Poster: ${poster}`)
  }

  const backdrop = tmdb.images.url(movie.backdrop_path, 'w780')
  if (backdrop) {
    lines.push(`Backdrop: ${backdrop}`)
  }

  if (movie.homepage) {
    lines.push(`Homepage: ${movie.homepage}`)
  }

  if (movie.overview) {
    lines.push('', movie.overview)
  }

  writeLines(lines)
}

export function printTV(tv: TVDetails, tmdb: TMDBClient): void {
  const year = tv.first_air_date ? ` (${tv.first_air_date.slice(0, 4)})` : ''
  const lines = [`${tv.name}${year}`]

  if (tv.original_name !== tv.name) {
    lines.push(`Original name: ${tv.original_name}`)
  }
  if (tv.tagline) {
    lines.push(tv.tagline)
  }

  const facts = [
    tv.status,
    `${tv.number_of_seasons} seasons`,
    `${tv.number_of_episodes} episodes`,
    `★ ${tv.vote_average.toFixed(1)}/10 (${tv.vote_count} votes)`,
  ].filter(Boolean)
  lines.push(facts.join(' · '))

  if (tv.genres.length > 0) {
    lines.push(`Genres: ${tv.genres.map((genre) => genre.name).join(', ')}`)
  }
  if (tv.networks.length > 0) {
    lines.push(`Networks: ${tv.networks.map((network) => network.name).join(', ')}`)
  }
  if (tv.created_by.length > 0) {
    lines.push(`Created by: ${tv.created_by.map((person) => person.name).join(', ')}`)
  }

  lines.push(`TMDB: https://www.themoviedb.org/tv/${tv.id}`)

  const poster = tmdb.images.url(tv.poster_path, 'w500')
  if (poster) {
    lines.push(`Poster: ${poster}`)
  }

  const backdrop = tmdb.images.url(tv.backdrop_path, 'w780')
  if (backdrop) {
    lines.push(`Backdrop: ${backdrop}`)
  }

  if (tv.homepage) {
    lines.push(`Homepage: ${tv.homepage}`)
  }

  if (tv.overview) {
    lines.push('', tv.overview)
  }

  if (tv.seasons.length > 0) {
    lines.push('', 'Seasons:')
    for (const season of tv.seasons) {
      const airDate = season.air_date ? ` (${season.air_date.slice(0, 4)})` : ''
      lines.push(
        `  ${season.season_number}. ${season.name}${airDate} · ${season.episode_count} episodes`,
      )
    }
  }

  writeLines(lines)
}

export function printCredits(credits: CreditsResponse, limit = 10): void {
  const lines: string[] = []

  if (credits.cast.length > 0) {
    lines.push('Cast:')
    for (const member of credits.cast.slice(0, limit)) {
      const character = member.character ? ` as ${member.character}` : ''
      lines.push(`  ${member.name}${character}  #${member.id}`)
    }
  }

  if (credits.crew.length > 0) {
    if (lines.length > 0) {
      lines.push('')
    }
    lines.push('Crew:')
    for (const member of credits.crew.slice(0, limit)) {
      lines.push(`  ${member.name} — ${member.job} (${member.department})  #${member.id}`)
    }
  }

  if (lines.length === 0) {
    lines.push('No credits.')
  }

  writeLines(lines)
}

export function printAggregateCredits(credits: AggregateCreditsResponse, limit = 10): void {
  const lines: string[] = []

  if (credits.cast.length > 0) {
    lines.push('Cast:')
    for (const member of credits.cast.slice(0, limit)) {
      const roles = member.roles
        .map((role) => `${role.character} (${role.episode_count} eps)`)
        .join(', ')
      lines.push(`  ${member.name} as ${roles}  #${member.id}`)
    }
  }

  if (credits.crew.length > 0) {
    if (lines.length > 0) {
      lines.push('')
    }
    lines.push('Crew:')
    for (const member of credits.crew.slice(0, limit)) {
      const jobs = member.jobs.map((job) => `${job.job} (${job.episode_count} eps)`).join(', ')
      lines.push(`  ${member.name} — ${jobs} (${member.department})  #${member.id}`)
    }
  }

  if (lines.length === 0) {
    lines.push('No credits.')
  }

  writeLines(lines)
}

export function printImages(images: ImagesResponse, tmdb: TMDBClient): void {
  const lines: string[] = []
  appendImageSection(lines, 'Posters', images.posters, 'w500', tmdb)
  appendImageSection(lines, 'Backdrops', images.backdrops, 'w780', tmdb)
  appendImageSection(lines, 'Logos', images.logos ?? [], 'w300', tmdb)

  if (lines.length === 0) {
    lines.push('No images.')
  }

  writeLines(lines)
}

export function printSeasonImages(images: SeasonImagesResponse, tmdb: TMDBClient): void {
  const lines: string[] = []
  appendImageSection(lines, 'Posters', images.posters, 'w500', tmdb)

  if (lines.length === 0) {
    lines.push('No images.')
  }

  writeLines(lines)
}

export function printVideos(videos: VideosResponse): void {
  if (videos.results.length === 0) {
    writeLines(['No videos.'])
    return
  }

  const lines = videos.results.map((video) => {
    const url =
      video.site.toLowerCase() === 'youtube'
        ? `https://www.youtube.com/watch?v=${video.key}`
        : video.key
    return `${video.type}: ${video.name}  ${url}`
  })
  writeLines(lines)
}

export function printSeason(season: TVSeasonDetails, tmdb: TMDBClient): void {
  const year = season.air_date ? ` (${season.air_date.slice(0, 4)})` : ''
  const lines = [
    `${season.name}${year}`,
    `Episodes: ${season.episodes.length} · ★ ${season.vote_average.toFixed(1)}/10`,
  ]

  if (season.overview) {
    lines.push('', season.overview)
  }

  const poster = tmdb.images.url(season.poster_path, 'w500')
  if (poster) {
    lines.push(`Poster: ${poster}`)
  }

  if (season.episodes.length > 0) {
    lines.push('', 'Episodes:')
    for (const episode of season.episodes) {
      const airDate = episode.air_date ? ` ${episode.air_date}` : ''
      const runtime = episode.runtime ? ` · ${episode.runtime} min` : ''
      lines.push(
        `  E${String(episode.episode_number).padStart(2, '0')}  ${episode.name}${airDate}${runtime}  ★ ${episode.vote_average.toFixed(1)}  #${episode.id}`,
      )
    }
  }

  writeLines(lines)
}

export function printEpisode(episode: EpisodeDetails, tmdb: TMDBClient, seriesId: number): void {
  const lines = [`${episodeCode(episode)} · ${episode.name}`]
  const facts = [
    episode.air_date,
    episode.runtime ? `${episode.runtime} min` : undefined,
    `★ ${episode.vote_average.toFixed(1)}/10 (${episode.vote_count} votes)`,
  ].filter(Boolean)
  lines.push(facts.join(' · '))

  lines.push(
    `TMDB: https://www.themoviedb.org/tv/${seriesId}/season/${episode.season_number}/episode/${episode.episode_number}`,
  )

  const still = tmdb.images.url(episode.still_path, 'w300')
  if (still) {
    lines.push(`Still: ${still}`)
  }

  if (episode.overview) {
    lines.push('', episode.overview)
  }

  writeLines(lines)
}

export function printEpisodeGroups(response: EpisodeGroupsResponse): void {
  if (response.results.length === 0) {
    writeLines(['No episode groups.'])
    return
  }

  writeLines(
    response.results.map(
      (group) =>
        `${group.id}  ${group.name}  (${group.group_count} groups, ${group.episode_count} episodes)`,
    ),
  )
}

export function printEpisodeGroup(group: EpisodeGroupDetails): void {
  const lines = [group.name]

  if (group.description) {
    lines.push(group.description)
  }

  if (group.groups.length === 0) {
    lines.push('', 'No episodes.')
    writeLines(lines)
    return
  }

  for (const section of group.groups) {
    lines.push('', section.name)
    for (const episode of section.episodes) {
      lines.push(`  ${episode.order}. ${episodeCode(episode)} · ${episode.name}  #${episode.id}`)
    }
  }

  writeLines(lines)
}

export function printPerson(person: PersonDetails, tmdb: TMDBClient): void {
  const lines = [person.name]
  const facts = [
    person.known_for_department,
    person.birthday ? `Born: ${person.birthday}` : undefined,
    person.deathday ? `Died: ${person.deathday}` : undefined,
  ].filter(Boolean)

  if (facts.length > 0) {
    lines.push(facts.join(' · '))
  }
  if (person.place_of_birth) {
    lines.push(`From: ${person.place_of_birth}`)
  }

  lines.push(`TMDB: https://www.themoviedb.org/person/${person.id}`)

  const profile = tmdb.images.url(person.profile_path, 'h632')
  if (profile) {
    lines.push(`Profile: ${profile}`)
  }
  if (person.homepage) {
    lines.push(`Homepage: ${person.homepage}`)
  }
  if (person.imdb_id) {
    lines.push(`IMDb: https://www.imdb.com/name/${person.imdb_id}`)
  }
  if (person.biography) {
    lines.push('', person.biography)
  }

  writeLines(lines)
}

export function printPersonCredits(credits: PersonCombinedCreditsResponse, limit = 10): void {
  const lines: string[] = []
  const cast = [...credits.cast].sort(byCreditDate)
  const crew = [...credits.crew].sort(byCreditDate)

  if (cast.length > 0) {
    lines.push('Cast:')
    for (const item of cast.slice(0, limit)) {
      lines.push(formatCombinedCast(item))
    }
  }

  if (crew.length > 0) {
    if (lines.length > 0) {
      lines.push('')
    }
    lines.push('Crew:')
    for (const item of crew.slice(0, limit)) {
      lines.push(formatCombinedCrew(item))
    }
  }

  if (lines.length === 0) {
    lines.push('No credits.')
  }

  writeLines(lines)
}

export function printGenres(response: GenresResponse): void {
  if (response.genres.length === 0) {
    writeLines(['No genres.'])
    return
  }

  writeLines(response.genres.map((genre) => `${genre.id}  ${genre.name}`))
}

function appendImageSection(
  lines: string[],
  title: string,
  images: readonly ImageItem[],
  size: 'w300' | 'w500' | 'w780',
  tmdb: TMDBClient,
): void {
  if (images.length === 0) {
    return
  }

  if (lines.length > 0) {
    lines.push('')
  }
  lines.push(`${title}:`)
  for (const image of images) {
    const url = tmdb.images.url(image.file_path, size)
    if (url) {
      lines.push(`  ${url}  (${image.width}x${image.height})`)
    }
  }
}

function formatCombinedCast(item: PersonCombinedCast): string {
  const character = item.character ? ` as ${item.character}` : ''
  const episodes =
    item.media_type === 'tv' && item.episode_count ? ` · ${item.episode_count} eps` : ''
  return `  ${creditYear(item)}  ${creditTitle(item)}${character}${episodes}  (${item.media_type}, ${item.id})`
}

function formatCombinedCrew(item: PersonCombinedCrew): string {
  return `  ${creditYear(item)}  ${creditTitle(item)} — ${item.job} (${item.department})  (${item.media_type}, ${item.id})`
}

function byCreditDate(
  a: PersonCombinedCast | PersonCombinedCrew,
  b: PersonCombinedCast | PersonCombinedCrew,
): number {
  return creditDate(b).localeCompare(creditDate(a))
}

function creditDate(item: PersonCombinedCast | PersonCombinedCrew): string {
  return 'release_date' in item ? item.release_date : item.first_air_date
}

function creditTitle(item: PersonCombinedCast | PersonCombinedCrew): string {
  return 'title' in item ? item.title : item.name
}

function creditYear(item: PersonCombinedCast | PersonCombinedCrew): string {
  const date = creditDate(item)
  return date ? date.slice(0, 4) : '----'
}

function writeLines(lines: readonly string[]): void {
  process.stdout.write(`${lines.join('\n')}\n`)
}

function episodeCode(episode: { season_number: number; episode_number: number }): string {
  return `S${String(episode.season_number).padStart(2, '0')}E${String(episode.episode_number).padStart(2, '0')}`
}

function formatSearchResult(result: SearchResult, index: number, fallbackType: SearchType): string {
  const title = 'title' in result ? result.title : result.name
  const date =
    'release_date' in result
      ? result.release_date
      : 'first_air_date' in result
        ? result.first_air_date
        : ''
  const year = date ? ` (${date.slice(0, 4)})` : ''
  const mediaType = 'media_type' in result && result.media_type ? result.media_type : fallbackType
  const score =
    'vote_average' in result && result.vote_average > 0
      ? `  ★ ${result.vote_average.toFixed(1)}`
      : ''

  return `${String(index + 1).padStart(2)}. ${title}${year}${score}  ${mediaType}  ${result.id}`
}
