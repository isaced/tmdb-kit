import { defineCommand } from 'citty'
import type { TVAppendToResponse } from '../../index'
import { createClient } from '../client'
import { runSafely } from '../errors'
import {
  printCredits,
  printImages,
  printJson,
  printSearchResults,
  printSeason,
  printTV,
  printVideos,
} from '../format'
import {
  commonArgs,
  parseCommaList,
  parseId,
  parseLimit,
  parsePage,
  parseSeasonNumber,
  parseTVListCategory,
} from '../options'

export const tvCommand = defineCommand({
  meta: {
    name: 'tv',
    description: 'TV show commands',
  },
  subCommands: {
    list: defineCommand({
      meta: {
        name: 'list',
        description: 'List popular, top-rated, airing-today, or on-the-air shows',
      },
      args: {
        ...commonArgs,
        category: {
          type: 'positional',
          description: 'popular, top-rated, airing-today, or on-the-air',
          default: 'popular',
        },
        page: {
          type: 'string',
          description: 'Page number',
        },
      },
      async run({ args }) {
        await runSafely(async () => {
          const category = parseTVListCategory(args.category)
          const options = { page: parsePage(args.page) }
          const client = createClient({ language: args.lang })

          const response =
            category === 'top-rated'
              ? await client.tv.topRated(options)
              : category === 'airing-today'
                ? await client.tv.airingToday(options)
                : category === 'on-the-air'
                  ? await client.tv.onTheAir(options)
                  : await client.tv.popular(options)

          if (args.json) {
            printJson(response)
          } else {
            printSearchResults(response, 'tv')
          }
        })
      },
    }),

    get: defineCommand({
      meta: {
        name: 'get',
        description: 'Get TV show details by TMDB ID',
      },
      args: {
        ...commonArgs,
        id: {
          type: 'positional',
          description: 'TMDB TV show ID',
          required: true,
        },
        append: {
          type: 'string',
          description: 'Comma-separated append_to_response values',
        },
      },
      async run({ args }) {
        await runSafely(async () => {
          const id = parseId(args.id, 'TV show ID')
          const client = createClient({ language: args.lang })
          const appendToResponse = parseCommaList(args.append) as
            | TVAppendToResponse[]
            | undefined

          const tv = await client.tv.details(id, { appendToResponse })

          if (args.json) {
            printJson(tv)
          } else {
            printTV(tv, client)
          }
        })
      },
    }),

    credits: defineCommand({
      meta: {
        name: 'credits',
        description: 'Show TV show cast and crew',
      },
      args: {
        ...commonArgs,
        id: {
          type: 'positional',
          description: 'TMDB TV show ID',
          required: true,
        },
        limit: {
          type: 'string',
          description: 'Maximum cast/crew rows (default: 10)',
        },
      },
      async run({ args }) {
        await runSafely(async () => {
          const id = parseId(args.id, 'TV show ID')
          const limit = parseLimit(args.limit)
          const client = createClient({ language: args.lang })
          const credits = await client.tv.credits(id)

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
        description: 'Show TV show image URLs',
      },
      args: {
        ...commonArgs,
        id: {
          type: 'positional',
          description: 'TMDB TV show ID',
          required: true,
        },
        'image-language': {
          type: 'string',
          description: 'Comma-separated image language codes',
        },
      },
      async run({ args }) {
        await runSafely(async () => {
          const id = parseId(args.id, 'TV show ID')
          const includeImageLanguage = parseCommaList(args['image-language'])
          const client = createClient({ language: args.lang })
          const images = await client.tv.images(id, { includeImageLanguage })

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
        description: 'Show TV show videos and trailers',
      },
      args: {
        ...commonArgs,
        id: {
          type: 'positional',
          description: 'TMDB TV show ID',
          required: true,
        },
      },
      async run({ args }) {
        await runSafely(async () => {
          const id = parseId(args.id, 'TV show ID')
          const client = createClient({ language: args.lang })
          const videos = await client.tv.videos(id)

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
        description: 'List TV shows similar to a show',
      },
      args: {
        ...commonArgs,
        id: {
          type: 'positional',
          description: 'TMDB TV show ID',
          required: true,
        },
        page: {
          type: 'string',
          description: 'Page number',
        },
      },
      async run({ args }) {
        await runSafely(async () => {
          const id = parseId(args.id, 'TV show ID')
          const options = { page: parsePage(args.page) }
          const client = createClient({ language: args.lang })
          const response = await client.tv.similar(id, options)

          if (args.json) {
            printJson(response)
          } else {
            printSearchResults(response, 'tv')
          }
        })
      },
    }),

    recommendations: defineCommand({
      meta: {
        name: 'recommendations',
        description: 'List recommended TV shows for a show',
      },
      args: {
        ...commonArgs,
        id: {
          type: 'positional',
          description: 'TMDB TV show ID',
          required: true,
        },
        page: {
          type: 'string',
          description: 'Page number',
        },
      },
      async run({ args }) {
        await runSafely(async () => {
          const id = parseId(args.id, 'TV show ID')
          const options = { page: parsePage(args.page) }
          const client = createClient({ language: args.lang })
          const response = await client.tv.recommendations(id, options)

          if (args.json) {
            printJson(response)
          } else {
            printSearchResults(response, 'tv')
          }
        })
      },
    }),

    season: defineCommand({
      meta: {
        name: 'season',
        description: 'Show a TV season and its episodes',
      },
      args: {
        ...commonArgs,
        id: {
          type: 'positional',
          description: 'TMDB TV show ID',
          required: true,
        },
        season: {
          type: 'positional',
          description: 'Season number (0 for specials)',
          required: true,
        },
      },
      async run({ args }) {
        await runSafely(async () => {
          const id = parseId(args.id, 'TV show ID')
          const seasonNumber = parseSeasonNumber(args.season)
          const client = createClient({ language: args.lang })
          const season = await client.tv.seasonDetails(id, seasonNumber)

          if (args.json) {
            printJson(season)
          } else {
            printSeason(season, client)
          }
        })
      },
    }),
  },
})
