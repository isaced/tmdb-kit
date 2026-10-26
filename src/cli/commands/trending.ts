import { defineCommand } from 'citty'
import { createClient } from '../client'
import { printSearchResults } from '../format'
import { printResult, runSafely } from '../output'
import { commonArgs, parsePage, parseSearchType, parseWindow, TRENDING_WINDOWS } from '../options'

export const trendingCommand = defineCommand({
  meta: {
    name: 'trending',
    description: 'Show trending movies, TV shows, people, or all media',
  },
  args: {
    ...commonArgs,
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
    await runSafely(args, async (output) => {
      const type = parseSearchType(args.type)
      const window = parseWindow(args.window)
      const page = parsePage(args.page)
      const client = createClient({ language: args.lang })

      const response =
        type === 'movie'
          ? await client.trending.movies(window, { page })
          : type === 'tv'
            ? await client.trending.tv(window, { page })
            : type === 'person'
              ? await client.trending.people(window, { page })
              : await client.trending.all(window, { page })

      printResult(response, output, () => printSearchResults(response, type))
    })
  },
})
