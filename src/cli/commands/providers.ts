import { defineCommand } from 'citty'
import type { WatchProvidersResponse } from '../../index'
import { createClient } from '../client'
import { printProviderList, printWatchProviders } from '../format'
import { printResult, runSafely } from '../output'
import { commonArgs, outputArgs, parseId } from '../options'

function filterWatchProviders(
  response: WatchProvidersResponse,
  region: string,
): WatchProvidersResponse {
  const code = region.toUpperCase()
  const entry = response.results[code]

  return {
    id: response.id,
    results: entry ? { [code]: entry } : {},
  }
}

function perTitleCommand(kind: 'movie' | 'tv') {
  return defineCommand({
    meta: {
      name: kind,
      description: `Show watch providers for a ${kind === 'movie' ? 'movie' : 'TV show'}`,
    },
    args: {
      ...outputArgs,
      id: {
        type: 'positional',
        description: `TMDB ${kind === 'movie' ? 'movie' : 'TV show'} ID`,
        required: true,
      },
      region: {
        type: 'string',
        description: 'Limit output to one region code',
      },
    },
    async run({ args }) {
      await runSafely(args, async (output) => {
        const id = parseId(args.id, kind === 'movie' ? 'movie ID' : 'TV show ID')
        const client = createClient()
        const response =
          kind === 'movie'
            ? await client.movies.watchProviders(id)
            : await client.tv.watchProviders(id)
        const region = args.region?.trim() || undefined
        const payload = region ? filterWatchProviders(response, region) : response

        printResult(payload, output, () => printWatchProviders(response, region))
      })
    },
  })
}

function listCommand(kind: 'movie' | 'tv') {
  return defineCommand({
    meta: {
      name: kind,
      description: `List watch providers for ${kind === 'movie' ? 'movies' : 'TV'}`,
    },
    args: {
      ...commonArgs,
      'watch-region': {
        type: 'string',
        description: 'Limit the list to one region code',
      },
    },
    async run({ args }) {
      await runSafely(args, async (output) => {
        const client = createClient({ language: args.lang })
        const response =
          kind === 'movie'
            ? await client.watchProviders.movies({
                watchRegion: args['watch-region']?.trim() || undefined,
              })
            : await client.watchProviders.tv({
                watchRegion: args['watch-region']?.trim() || undefined,
              })

        printResult(response, output, () => printProviderList(response))
      })
    },
  })
}

export const providersCommand = defineCommand({
  meta: {
    name: 'providers',
    description: 'Watch provider commands',
  },
  subCommands: {
    movie: perTitleCommand('movie'),
    tv: perTitleCommand('tv'),
    list: defineCommand({
      meta: {
        name: 'list',
        description: 'List watch providers for movies or TV',
      },
      subCommands: {
        movie: listCommand('movie'),
        tv: listCommand('tv'),
      },
    }),
  },
})
