import { defineCommand } from 'citty'
import { createClient } from '../client'
import { CliError } from '../errors'
import { printSearchResults, type SearchResult } from '../format'
import { printPaged, runSafely } from '../output'
import { commonArgs, paginationArgs, parsePage, parseSearchType, SEARCH_TYPES } from '../options'

export const searchCommand = defineCommand({
  meta: {
    name: 'search',
    description: 'Search movies, TV shows, and people',
  },
  args: {
    ...commonArgs,
    ...paginationArgs,
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
    await runSafely(
      args,
      async (output) => {
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

        await printPaged<SearchResult>({
          fetchPage: (nextPage) => {
            const options = { page: nextPage }

            return type === 'movie'
              ? client.search.movies(query, { ...options, year })
              : type === 'tv'
                ? client.search.tv(query, { ...options, firstAirDateYear: year })
                : type === 'person'
                  ? client.search.people(query, options)
                  : client.search.multi(query, options)
          },
          output,
          renderText: (response) => printSearchResults(response, type),
          startPage: page,
        })
      },
      { paginated: true },
    )
  },
})
