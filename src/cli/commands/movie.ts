import { defineCommand } from 'citty'
import type { MovieAppendToResponse } from '../../index'
import { createClient } from '../client'
import {
  printCredits,
  printExternalIds,
  printImages,
  printMovie,
  printSearchResults,
  printVideos,
} from '../format'
import { printPaged, printResult, runSafely } from '../output'
import {
  commonArgs,
  outputArgs,
  paginationArgs,
  parseCommaList,
  parseId,
  parseLimit,
  parseMovieListCategory,
  parsePage,
} from '../options'

export const movieCommand = defineCommand({
  meta: {
    name: 'movie',
    description: 'Movie commands',
  },
  subCommands: {
    list: defineCommand({
      meta: {
        name: 'list',
        description: 'List popular, top-rated, now-playing, or upcoming movies',
      },
      args: {
        ...commonArgs,
        ...paginationArgs,
        category: {
          type: 'positional',
          description: 'popular, top-rated, now-playing, or upcoming',
          default: 'popular',
        },
        page: {
          type: 'string',
          description: 'Page number',
        },
        region: {
          type: 'string',
          description: 'ISO 3166-1 region code',
        },
      },
      async run({ args }) {
        await runSafely(
          args,
          async (output) => {
            const category = parseMovieListCategory(args.category)
            const params = { page: parsePage(args.page), region: args.region }
            const client = createClient({ language: args.lang })

            await printPaged({
              fetchPage: (page) => {
                const options = { ...params, page }

                return category === 'top-rated'
                  ? client.movies.topRated(options)
                  : category === 'now-playing'
                    ? client.movies.nowPlaying(options)
                    : category === 'upcoming'
                      ? client.movies.upcoming(options)
                      : client.movies.popular(options)
              },
              output,
              renderText: (response) => printSearchResults(response, 'movie'),
              startPage: params.page,
            })
          },
          { paginated: true },
        )
      },
    }),

    get: defineCommand({
      meta: {
        name: 'get',
        description: 'Get movie details by TMDB ID',
      },
      args: {
        ...commonArgs,
        id: {
          type: 'positional',
          description: 'TMDB movie ID',
          required: true,
        },
        append: {
          type: 'string',
          description: 'Comma-separated append_to_response values',
        },
      },
      async run({ args }) {
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'movie ID')
          const client = createClient({ language: args.lang })
          const appendToResponse = parseCommaList(args.append) as
            MovieAppendToResponse[] | undefined

          const movie = await client.movies.details(id, { appendToResponse })

          printResult(movie, output, () => printMovie(movie, client))
        })
      },
    }),

    credits: defineCommand({
      meta: {
        name: 'credits',
        description: 'Show movie cast and crew',
      },
      args: {
        ...commonArgs,
        id: {
          type: 'positional',
          description: 'TMDB movie ID',
          required: true,
        },
        limit: {
          type: 'string',
          description: 'Maximum cast/crew rows (default: 10)',
        },
      },
      async run({ args }) {
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'movie ID')
          const limit = parseLimit(args.limit)
          const client = createClient({ language: args.lang })
          const credits = await client.movies.credits(id)

          printResult(credits, output, () => printCredits(credits, limit))
        })
      },
    }),

    images: defineCommand({
      meta: {
        name: 'images',
        description: 'Show movie image URLs',
      },
      args: {
        ...commonArgs,
        id: {
          type: 'positional',
          description: 'TMDB movie ID',
          required: true,
        },
        'image-language': {
          type: 'string',
          description: 'Comma-separated image language codes',
        },
      },
      async run({ args }) {
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'movie ID')
          const includeImageLanguage = parseCommaList(args['image-language'])
          const client = createClient({ language: args.lang })
          const images = await client.movies.images(id, { includeImageLanguage })

          printResult(images, output, () => printImages(images, client))
        })
      },
    }),

    videos: defineCommand({
      meta: {
        name: 'videos',
        description: 'Show movie videos and trailers',
      },
      args: {
        ...commonArgs,
        id: {
          type: 'positional',
          description: 'TMDB movie ID',
          required: true,
        },
      },
      async run({ args }) {
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'movie ID')
          const client = createClient({ language: args.lang })
          const videos = await client.movies.videos(id)

          printResult(videos, output, () => printVideos(videos))
        })
      },
    }),

    similar: defineCommand({
      meta: {
        name: 'similar',
        description: 'List movies similar to a movie',
      },
      args: {
        ...commonArgs,
        id: {
          type: 'positional',
          description: 'TMDB movie ID',
          required: true,
        },
        page: {
          type: 'string',
          description: 'Page number',
        },
        region: {
          type: 'string',
          description: 'ISO 3166-1 region code',
        },
        ...paginationArgs,
      },
      async run({ args }) {
        await runSafely(
          args,
          async (output) => {
            const id = parseId(args.id, 'movie ID')
            const params = { page: parsePage(args.page), region: args.region }
            const client = createClient({ language: args.lang })

            await printPaged({
              fetchPage: (page) => client.movies.similar(id, { ...params, page }),
              output,
              renderText: (response) => printSearchResults(response, 'movie'),
              startPage: params.page,
            })
          },
          { paginated: true },
        )
      },
    }),

    recommendations: defineCommand({
      meta: {
        name: 'recommendations',
        description: 'List recommended movies for a movie',
      },
      args: {
        ...commonArgs,
        id: {
          type: 'positional',
          description: 'TMDB movie ID',
          required: true,
        },
        page: {
          type: 'string',
          description: 'Page number',
        },
        region: {
          type: 'string',
          description: 'ISO 3166-1 region code',
        },
        ...paginationArgs,
      },
      async run({ args }) {
        await runSafely(
          args,
          async (output) => {
            const id = parseId(args.id, 'movie ID')
            const params = { page: parsePage(args.page), region: args.region }
            const client = createClient({ language: args.lang })

            await printPaged({
              fetchPage: (page) => client.movies.recommendations(id, { ...params, page }),
              output,
              renderText: (response) => printSearchResults(response, 'movie'),
              startPage: params.page,
            })
          },
          { paginated: true },
        )
      },
    }),

    'external-ids': defineCommand({
      meta: {
        name: 'external-ids',
        description: 'Show external IDs for a movie',
      },
      args: {
        ...outputArgs,
        id: {
          type: 'positional',
          description: 'TMDB movie ID',
          required: true,
        },
      },
      async run({ args }) {
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'movie ID')
          const client = createClient()
          const ids = await client.movies.externalIds(id)

          printResult(ids, output, () => printExternalIds(ids))
        })
      },
    }),
  },
})
