import { defineCommand, type ArgsDef } from 'citty'
import type { DiscoverMovieOptions, DiscoverTVOptions } from '../../index'
import { createClient } from '../client'
import { printSearchResults } from '../format'
import { printPaged, runSafely } from '../output'
import {
  commonArgs,
  paginationArgs,
  parseCommaList,
  parseIdFilter,
  parseInteger,
  parseMovieSortBy,
  parseNumber,
  parsePage,
  parseTVSortBy,
  parseWatchMonetizationTypes,
} from '../options'

interface DiscoverArgValues {
  'include-adult'?: boolean
  'runtime-gte'?: string
  'runtime-lte'?: string
  'sort-by'?: string
  'vote-average-gte'?: string
  'vote-average-lte'?: string
  'vote-count-gte'?: string
  'vote-count-lte'?: string
  'watch-region'?: string
  'with-companies'?: string
  'with-genres'?: string
  'with-keywords'?: string
  'with-original-language'?: string
  'with-origin-country'?: string
  'with-watch-monetization-types'?: string
  'with-watch-providers'?: string
  'without-genres'?: string
  page?: string
}

const commonDiscoverArgs = {
  ...commonArgs,
  ...paginationArgs,
  page: {
    type: 'string',
    description: 'Page number',
  },
  'sort-by': {
    type: 'string',
    description: 'TMDB sort_by value (for example popularity.desc)',
  },
  'with-genres': {
    type: 'string',
    description: 'Genre IDs (comma = AND, pipe = OR)',
  },
  'without-genres': {
    type: 'string',
    description: 'Genre IDs to exclude',
  },
  'with-keywords': {
    type: 'string',
    description: 'Keyword IDs',
  },
  'with-companies': {
    type: 'string',
    description: 'Company IDs',
  },
  'with-origin-country': {
    type: 'string',
    description: 'Origin country codes',
  },
  'with-original-language': {
    type: 'string',
    description: 'Original language code',
  },
  'vote-average-gte': {
    type: 'string',
    description: 'Minimum vote average',
  },
  'vote-average-lte': {
    type: 'string',
    description: 'Maximum vote average',
  },
  'vote-count-gte': {
    type: 'string',
    description: 'Minimum vote count',
  },
  'vote-count-lte': {
    type: 'string',
    description: 'Maximum vote count',
  },
  'runtime-gte': {
    type: 'string',
    description: 'Minimum runtime in minutes',
  },
  'runtime-lte': {
    type: 'string',
    description: 'Maximum runtime in minutes',
  },
  'with-watch-providers': {
    type: 'string',
    description: 'Watch provider IDs',
  },
  'watch-region': {
    type: 'string',
    description: 'Provider availability region',
  },
  'with-watch-monetization-types': {
    type: 'string',
    description: 'flatrate, free, ads, rent, buy',
  },
  'include-adult': {
    type: 'boolean',
    description: 'Include adult titles',
  },
} satisfies ArgsDef

function commonDiscoverOptions(args: DiscoverArgValues): DiscoverMovieOptions {
  return {
    page: parsePage(args.page),
    includeAdult: args['include-adult'] === true ? true : undefined,
    withGenres: parseIdFilter(args['with-genres']),
    withoutGenres: parseIdFilter(args['without-genres']),
    withKeywords: parseIdFilter(args['with-keywords']),
    withCompanies: parseIdFilter(args['with-companies']),
    withOriginCountry: parseCommaList(args['with-origin-country']),
    withOriginalLanguage: args['with-original-language']?.trim() || undefined,
    voteAverageGte: parseNumber(args['vote-average-gte'], '--vote-average-gte'),
    voteAverageLte: parseNumber(args['vote-average-lte'], '--vote-average-lte'),
    voteCountGte: parseNumber(args['vote-count-gte'], '--vote-count-gte'),
    voteCountLte: parseNumber(args['vote-count-lte'], '--vote-count-lte'),
    runtimeGte: parseNumber(args['runtime-gte'], '--runtime-gte'),
    runtimeLte: parseNumber(args['runtime-lte'], '--runtime-lte'),
    withWatchProviders: parseIdFilter(args['with-watch-providers']),
    watchRegion: args['watch-region']?.trim() || undefined,
    withWatchMonetizationTypes: parseWatchMonetizationTypes(args['with-watch-monetization-types']),
  }
}

export const discoverCommand = defineCommand({
  meta: {
    name: 'discover',
    description: 'Discover movies and TV shows with filters',
  },
  subCommands: {
    movie: defineCommand({
      meta: {
        name: 'movie',
        description: 'Discover movies',
      },
      args: {
        ...commonDiscoverArgs,
        region: {
          type: 'string',
          description: 'Release region code',
        },
        year: {
          type: 'string',
          description: 'Release year',
        },
        'primary-release-year': {
          type: 'string',
          description: 'Primary release year',
        },
        'primary-release-date-gte': {
          type: 'string',
          description: 'Earliest primary release date',
        },
        'primary-release-date-lte': {
          type: 'string',
          description: 'Latest primary release date',
        },
        'release-date-gte': {
          type: 'string',
          description: 'Earliest release date',
        },
        'release-date-lte': {
          type: 'string',
          description: 'Latest release date',
        },
        'with-people': {
          type: 'string',
          description: 'Person IDs',
        },
        'with-cast': {
          type: 'string',
          description: 'Cast person IDs',
        },
        'with-crew': {
          type: 'string',
          description: 'Crew person IDs',
        },
        'with-release-type': {
          type: 'string',
          description: 'Release type IDs',
        },
      },
      async run({ args }) {
        await runSafely(
          args,
          async (output) => {
            const params: DiscoverMovieOptions = {
              ...commonDiscoverOptions(args),
              sortBy: parseMovieSortBy(args['sort-by']),
              region: args.region?.trim() || undefined,
              year: parseInteger(args.year, '--year'),
              primaryReleaseYear: parseInteger(
                args['primary-release-year'],
                '--primary-release-year',
              ),
              primaryReleaseDateGte: args['primary-release-date-gte']?.trim() || undefined,
              primaryReleaseDateLte: args['primary-release-date-lte']?.trim() || undefined,
              releaseDateGte: args['release-date-gte']?.trim() || undefined,
              releaseDateLte: args['release-date-lte']?.trim() || undefined,
              withPeople: parseIdFilter(args['with-people']),
              withCast: parseIdFilter(args['with-cast']),
              withCrew: parseIdFilter(args['with-crew']),
              withReleaseType: parseIdFilter(args['with-release-type']),
            }
            const client = createClient({ language: args.lang })

            await printPaged({
              fetchPage: (page) => client.discover.movies({ ...params, page }),
              output,
              renderText: (response) => printSearchResults(response, 'movie'),
              startPage: params.page ?? 1,
            })
          },
          { paginated: true },
        )
      },
    }),

    tv: defineCommand({
      meta: {
        name: 'tv',
        description: 'Discover TV shows',
      },
      args: {
        ...commonDiscoverArgs,
        year: {
          type: 'string',
          description: 'First air date year',
        },
        'first-air-date-gte': {
          type: 'string',
          description: 'Earliest first air date',
        },
        'first-air-date-lte': {
          type: 'string',
          description: 'Latest first air date',
        },
        'air-date-gte': {
          type: 'string',
          description: 'Earliest air date',
        },
        'air-date-lte': {
          type: 'string',
          description: 'Latest air date',
        },
        'with-networks': {
          type: 'string',
          description: 'Network IDs',
        },
        'with-status': {
          type: 'string',
          description: 'Status code',
        },
        'with-type': {
          type: 'string',
          description: 'Type code',
        },
      },
      async run({ args }) {
        await runSafely(
          args,
          async (output) => {
            const params: DiscoverTVOptions = {
              ...commonDiscoverOptions(args),
              sortBy: parseTVSortBy(args['sort-by']),
              firstAirDateYear: parseInteger(args.year, '--year'),
              firstAirDateGte: args['first-air-date-gte']?.trim() || undefined,
              firstAirDateLte: args['first-air-date-lte']?.trim() || undefined,
              airDateGte: args['air-date-gte']?.trim() || undefined,
              airDateLte: args['air-date-lte']?.trim() || undefined,
              withNetworks: parseIdFilter(args['with-networks']),
              withStatus: parseInteger(args['with-status'], '--with-status'),
              withType: parseInteger(args['with-type'], '--with-type'),
            }
            const client = createClient({ language: args.lang })

            await printPaged({
              fetchPage: (page) => client.discover.tv({ ...params, page }),
              output,
              renderText: (response) => printSearchResults(response, 'tv'),
              startPage: params.page ?? 1,
            })
          },
          { paginated: true },
        )
      },
    }),
  },
})
