import { defineCommand } from 'citty'
import { createClient } from '../client'
import { printExternalIds, printPerson, printPersonCredits } from '../format'
import { printResult, runSafely } from '../output'
import { commonArgs, outputArgs, parseId, parseLimit } from '../options'

export const personCommand = defineCommand({
  meta: {
    name: 'person',
    description: 'Person commands',
  },
  subCommands: {
    get: defineCommand({
      meta: {
        name: 'get',
        description: 'Get person details by TMDB ID',
      },
      args: {
        ...commonArgs,
        id: {
          type: 'positional',
          description: 'TMDB person ID',
          required: true,
        },
      },
      async run({ args }) {
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'person ID')
          const client = createClient({ language: args.lang })
          const person = await client.people.details(id)

          printResult(person, output, () => printPerson(person, client))
        })
      },
    }),

    credits: defineCommand({
      meta: {
        name: 'credits',
        description: 'Show a person combined cast and crew credits',
      },
      args: {
        ...commonArgs,
        id: {
          type: 'positional',
          description: 'TMDB person ID',
          required: true,
        },
        limit: {
          type: 'string',
          description: 'Maximum rows per section (default: 10)',
        },
      },
      async run({ args }) {
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'person ID')
          const limit = parseLimit(args.limit)
          const client = createClient({ language: args.lang })
          const credits = await client.people.combinedCredits(id)

          printResult(credits, output, () => printPersonCredits(credits, limit))
        })
      },
    }),

    'external-ids': defineCommand({
      meta: {
        name: 'external-ids',
        description: 'Show external IDs for a person',
      },
      args: {
        ...outputArgs,
        id: {
          type: 'positional',
          description: 'TMDB person ID',
          required: true,
        },
      },
      async run({ args }) {
        await runSafely(args, async (output) => {
          const id = parseId(args.id, 'person ID')
          const client = createClient()
          const ids = await client.people.externalIds(id)

          printResult(ids, output, () => printExternalIds(ids))
        })
      },
    }),
  },
})
