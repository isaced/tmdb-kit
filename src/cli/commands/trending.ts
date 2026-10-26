import { defineCommand } from 'citty'
import { createClient } from '../client'
import { printSearchResults, type SearchResult } from '../format'
import { printPaged, runSafely } from '../output'
import {
  commonArgs,
  paginationArgs,
  parsePage,
  parseSearchType,
  parseWindow,
  TRENDING_WINDOWS,
} from '../options'

export const trendingCommand = defineCommand({
  meta: {
    name: 'trending',
    description: 'Show trending movies, TV shows, people, or all media',
  },
  args: {
    ...commonArgs,
    ...paginationArgs,
    type: {
      type: 'positional',
      description: 'Media type: all, movie, tv, or person',
      default: 'all',
    },
    window: {
      type: 'enum',
      description: 'Trending window',
      options: [...TRENDING_WINDOWS],
      default: 'week',
    },
    page: {
      type: 'string',
      description: 'Page number',
    },
  },
  async run({ args }) {
    await runSafely(
      args,
      async (output) => {
        const type = parseSearchType(args.type)
        const window = parseWindow(args.window)
        const page = parsePage(args.page)
        const client = createClient({ language: args.lang })

        await printPaged<SearchResult>({
          fetchPage: (nextPage) => {
            const options = { page: nextPage }

            return type === 'movie'
              ? client.trending.movies(window, options)
              : type === 'tv'
                ? client.trending.tv(window, options)
                : type === 'person'
                  ? client.trending.people(window, options)
                  : client.trending.all(window, options)
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
