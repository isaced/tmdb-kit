import { defineCommand } from 'citty'
import { createClient } from '../client'
import { CliError } from '../errors'
import { printSearchResults } from '../format'
import { printResult, runSafely } from '../output'
import { commonArgs, parsePage, parseSearchType, SEARCH_TYPES } from '../options'

export const searchCommand = defineCommand({
  meta: {
    name: 'search',
    description: 'Search movies, TV shows, and people',
  },
  args: {
    ...commonArgs,
    query: {
      type: 'positional',
      description: 'Search query',
      required: true,
    },
    type: {
      type: 'enum',
      description: 'Media type to search',
      options: [...SEARCH_TYPES],
      default: 'all',
    },
    page: {
      type: 'string',
      description: 'Page number',
    },
    year: {
      type: 'string',
      description: 'Release year for movies, first-air year for TV',
    },
  },
  async run({ args }) {
    await runSafely(args, async (output) => {
      const query = args.query.trim()
      if (!query) {
        throw new CliError('Search query must not be empty.', 2)
      }

      const type = parseSearchType(args.type)
      const page = parsePage(args.page)
      const year = args.year?.trim() || undefined

      if (year && type !== 'movie' && type !== 'tv') {
        throw new CliError('--year is only supported with --type movie or tv.', 2)
      }

      const client = createClient({ language: args.lang })
      const options = { page }

      const response =
        type === 'movie'
          ? await client.search.movies(query, { ...options, year })
          : type === 'tv'
            ? await client.search.tv(query, { ...options, firstAirDateYear: year })
            : type === 'person'
              ? await client.search.people(query, options)
              : await client.search.multi(query, options)

      printResult(response, output, () => printSearchResults(response, type))
    })
  },
})
