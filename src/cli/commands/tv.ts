import { defineCommand } from 'citty'
import type { EpisodeAppendToResponse, TVAppendToResponse } from '../../index'
import { createClient } from '../client'
import {
  printAggregateCredits,
  printCredits,
  printEpisode,
  printEpisodeGroup,
  printEpisodeGroups,
  printImages,
  printSearchResults,
  printSeason,
  printSeasonImages,
  printTV,
  printVideos,
} from '../format'
import { printPaged, printResult, runSafely } from '../output'
import {
  commonArgs,
  paginationArgs,
  parseCommaList,
  parseGroupId,
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
        ...paginationArgs,
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
        await runSafely(
          args,
          async (output) => {
            const category = parseTVListCategory(args.category)
            const params = { page: parsePage(args.page) }
            const client = createClient({ language: args.lang })

            await printPaged({
              fetchPage: (page) => {
                const options = { ...params, page }

                return category === 'top-rated'
                  ? client.tv.topRated(options)
                  : category === 'airing-today'
                    ? client.tv.airingToday(options)
                    : category === 'on-the-air'
                      ? client.tv.onTheAir(options)
                      : client.tv.popular(options)
              },
              output,
              renderText: (response) => printSearchResults(response, 'tv'),
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
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'TV show ID')
          const client = createClient({ language: args.lang })
          const appendToResponse = parseCommaList(args.append) as TVAppendToResponse[] | undefined

          const tv = await client.tv.details(id, { appendToResponse })

          printResult(tv, output, () => printTV(tv, client))
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
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'TV show ID')
          const limit = parseLimit(args.limit)
          const client = createClient({ language: args.lang })
          const credits = await client.tv.credits(id)

          printResult(credits, output, () => printCredits(credits, limit))
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
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'TV show ID')
          const includeImageLanguage = parseCommaList(args['image-language'])
          const client = createClient({ language: args.lang })
          const images = await client.tv.images(id, { includeImageLanguage })

          printResult(images, output, () => printImages(images, client))
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
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'TV show ID')
          const client = createClient({ language: args.lang })
          const videos = await client.tv.videos(id)

          printResult(videos, output, () => printVideos(videos))
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
        ...paginationArgs,
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
        await runSafely(
          args,
          async (output) => {
            const id = parseId(args.id, 'TV show ID')
            const params = { page: parsePage(args.page) }
            const client = createClient({ language: args.lang })

            await printPaged({
              fetchPage: (page) => client.tv.similar(id, { ...params, page }),
              output,
              renderText: (response) => printSearchResults(response, 'tv'),
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
        description: 'List recommended TV shows for a show',
      },
      args: {
        ...commonArgs,
        ...paginationArgs,
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
        await runSafely(
          args,
          async (output) => {
            const id = parseId(args.id, 'TV show ID')
            const params = { page: parsePage(args.page) }
            const client = createClient({ language: args.lang })

            await printPaged({
              fetchPage: (page) => client.tv.recommendations(id, { ...params, page }),
              output,
              renderText: (response) => printSearchResults(response, 'tv'),
              startPage: params.page,
            })
          },
          { paginated: true },
        )
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
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'TV show ID')
          const seasonNumber = parseSeasonNumber(args.season)
          const client = createClient({ language: args.lang })
          const season = await client.tv.seasonDetails(id, seasonNumber)

          printResult(season, output, () => printSeason(season, client))
        })
      },
    }),

    episode: defineCommand({
      meta: {
        name: 'episode',
        description: 'Show a TV episode',
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
        episode: {
          type: 'positional',
          description: 'Episode number',
          required: true,
        },
        append: {
          type: 'string',
          description: 'Comma-separated append_to_response values',
        },
      },
      async run({ args }) {
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'TV show ID')
          const seasonNumber = parseSeasonNumber(args.season)
          const episodeNumber = parseId(args.episode, 'episode number')
          const appendToResponse = parseCommaList(args.append) as
            EpisodeAppendToResponse[] | undefined
          const client = createClient({ language: args.lang })
          const episode = await client.tv.episodeDetails(id, seasonNumber, episodeNumber, {
            appendToResponse,
          })

          printResult(episode, output, () => printEpisode(episode, client, id))
        })
      },
    }),

    'aggregate-credits': defineCommand({
      meta: {
        name: 'aggregate-credits',
        description: 'Show aggregate cast and crew credits for a TV show',
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
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'TV show ID')
          const limit = parseLimit(args.limit)
          const client = createClient({ language: args.lang })
          const credits = await client.tv.aggregateCredits(id)

          printResult(credits, output, () => printAggregateCredits(credits, limit))
        })
      },
    }),

    'season-credits': defineCommand({
      meta: {
        name: 'season-credits',
        description: 'Show cast and crew credits for a TV season',
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
        limit: {
          type: 'string',
          description: 'Maximum cast/crew rows (default: 10)',
        },
      },
      async run({ args }) {
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'TV show ID')
          const seasonNumber = parseSeasonNumber(args.season)
          const limit = parseLimit(args.limit)
          const client = createClient({ language: args.lang })
          const credits = await client.tv.seasonCredits(id, seasonNumber)

          printResult(credits, output, () => printCredits(credits, limit))
        })
      },
    }),

    'season-aggregate-credits': defineCommand({
      meta: {
        name: 'season-aggregate-credits',
        description: 'Show aggregate cast and crew credits for a TV season',
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
        limit: {
          type: 'string',
          description: 'Maximum cast/crew rows (default: 10)',
        },
      },
      async run({ args }) {
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'TV show ID')
          const seasonNumber = parseSeasonNumber(args.season)
          const limit = parseLimit(args.limit)
          const client = createClient({ language: args.lang })
          const credits = await client.tv.seasonAggregateCredits(id, seasonNumber)

          printResult(credits, output, () => printAggregateCredits(credits, limit))
        })
      },
    }),

    'season-images': defineCommand({
      meta: {
        name: 'season-images',
        description: 'Show TV season image URLs',
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
        'image-language': {
          type: 'string',
          description: 'Comma-separated image language codes',
        },
      },
      async run({ args }) {
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'TV show ID')
          const seasonNumber = parseSeasonNumber(args.season)
          const includeImageLanguage = parseCommaList(args['image-language'])
          const client = createClient({ language: args.lang })
          const images = await client.tv.seasonImages(id, seasonNumber, { includeImageLanguage })

          printResult(images, output, () => printSeasonImages(images, client))
        })
      },
    }),

    'season-videos': defineCommand({
      meta: {
        name: 'season-videos',
        description: 'Show TV season videos and trailers',
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
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'TV show ID')
          const seasonNumber = parseSeasonNumber(args.season)
          const client = createClient({ language: args.lang })
          const videos = await client.tv.seasonVideos(id, seasonNumber)

          printResult(videos, output, () => printVideos(videos))
        })
      },
    }),

    'episode-groups': defineCommand({
      meta: {
        name: 'episode-groups',
        description: 'List alternate episode groupings for a TV show',
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
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'TV show ID')
          const client = createClient({ language: args.lang })
          const groups = await client.tv.episodeGroups(id)

          printResult(groups, output, () => printEpisodeGroups(groups))
        })
      },
    }),

    'episode-group': defineCommand({
      meta: {
        name: 'episode-group',
        description: 'Show an alternate episode group',
      },
      args: {
        ...commonArgs,
        'group-id': {
          type: 'positional',
          description: 'TMDB episode group ID',
          required: true,
        },
      },
      async run({ args }) {
        await runSafely(args, async (output) => {
          const groupId = parseGroupId(args['group-id'])
          const client = createClient({ language: args.lang })
          const group = await client.tv.episodeGroup(groupId)

          printResult(group, output, () => printEpisodeGroup(group))
        })
      },
    }),
  },
})
