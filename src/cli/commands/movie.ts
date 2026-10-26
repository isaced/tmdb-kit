import { defineCommand } from 'citty'
import type { MovieAppendToResponse } from '../../index'
import { createClient } from '../client'
import { runSafely } from '../errors'
import {
  printCredits,
  printImages,
  printJson,
  printMovie,
  printSearchResults,
  printVideos,
} from '../format'
import {
  commonArgs,
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
        await runSafely(async () => {
          const category = parseMovieListCategory(args.category)
          const options = { page: parsePage(args.page), region: args.region }
          const client = createClient({ language: args.lang })

          const response =
            category === 'top-rated'
              ? await client.movies.topRated(options)
              : category === 'now-playing'
                ? await client.movies.nowPlaying(options)
                : category === 'upcoming'
                  ? await client.movies.upcoming(options)
                  : await client.movies.popular(options)

          if (args.json) {
            printJson(response)
          } else {
            printSearchResults(response, 'movie')
          }
        })
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
        await runSafely(async () => {
          const id = parseId(args.id, 'movie ID')
          const client = createClient({ language: args.lang })
          const appendToResponse = parseCommaList(args.append) as
            | MovieAppendToResponse[]
            | undefined

          const movie = await client.movies.details(id, { appendToResponse })

          if (args.json) {
            printJson(movie)
          } else {
            printMovie(movie, client)
          }
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
        await runSafely(async () => {
          const id = parseId(args.id, 'movie ID')
          const limit = parseLimit(args.limit)
          const client = createClient({ language: args.lang })
          const credits = await client.movies.credits(id)

          if (args.json) {
            printJson(credits)
          } else {
            printCredits(credits, limit)
          }
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
        await runSafely(async () => {
          const id = parseId(args.id, 'movie ID')
          const includeImageLanguage = parseCommaList(args['image-language'])
          const client = createClient({ language: args.lang })
          const images = await client.movies.images(id, { includeImageLanguage })

          if (args.json) {
            printJson(images)
          } else {
            printImages(images, client)
          }
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
        await runSafely(async () => {
          const id = parseId(args.id, 'movie ID')
          const client = createClient({ language: args.lang })
          const videos = await client.movies.videos(id)

          if (args.json) {
            printJson(videos)
          } else {
            printVideos(videos)
          }
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
      },
      async run({ args }) {
        await runSafely(async () => {
          const id = parseId(args.id, 'movie ID')
          const options = { page: parsePage(args.page), region: args.region }
          const client = createClient({ language: args.lang })
          const response = await client.movies.similar(id, options)

          if (args.json) {
            printJson(response)
          } else {
            printSearchResults(response, 'movie')
          }
        })
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
      },
      async run({ args }) {
        await runSafely(async () => {
          const id = parseId(args.id, 'movie ID')
          const options = { page: parsePage(args.page), region: args.region }
          const client = createClient({ language: args.lang })
          const response = await client.movies.recommendations(id, options)

          if (args.json) {
            printJson(response)
          } else {
            printSearchResults(response, 'movie')
          }
        })
      },
    }),
  },
})
