import { defineCommand } from 'citty'
import { createClient } from '../client'
import { printCollection, printCollectionTranslations, printImages } from '../format'
import { printResult, runSafely } from '../output'
import { commonArgs, outputArgs, parseCommaList, parseId, parseLimit } from '../options'

export const collectionCommand = defineCommand({
  meta: {
    name: 'collection',
    description: 'Collection commands',
  },
  subCommands: {
    get: defineCommand({
      meta: {
        name: 'get',
        description: 'Get collection details by TMDB ID',
      },
      args: {
        ...commonArgs,
        id: {
          type: 'positional',
          description: 'TMDB collection ID',
          required: true,
        },
        limit: {
          type: 'string',
          description: 'Maximum parts to print in text output (default: 10)',
        },
      },
      async run({ args }) {
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'collection ID')
          const client = createClient({ language: args.lang })
          const collection = await client.collections.details(id)

          printResult(collection, output, () =>
            printCollection(collection, client, parseLimit(args.limit)),
          )
        })
      },
    }),

    images: defineCommand({
      meta: {
        name: 'images',
        description: 'Show collection images',
      },
      args: {
        ...commonArgs,
        id: {
          type: 'positional',
          description: 'TMDB collection ID',
          required: true,
        },
        'image-language': {
          type: 'string',
          description: 'Comma-separated image languages (use null for no language)',
        },
      },
      async run({ args }) {
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'collection ID')
          const client = createClient({ language: args.lang })
          const images = await client.collections.images(id, {
            includeImageLanguage: parseCommaList(args['image-language']),
          })

          printResult(images, output, () => printImages(images, client))
        })
      },
    }),

    translations: defineCommand({
      meta: {
        name: 'translations',
        description: 'Show collection translations',
      },
      args: {
        ...outputArgs,
        id: {
          type: 'positional',
          description: 'TMDB collection ID',
          required: true,
        },
      },
      async run({ args }) {
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'collection ID')
          const client = createClient()
          const translations = await client.collections.translations(id)

          printResult(translations, output, () => printCollectionTranslations(translations))
        })
      },
    }),
  },
})
