import { defineCommand } from 'citty'
import { createClient } from '../client'
import { runSafely } from '../errors'
import { printJson, printPerson, printPersonCredits } from '../format'
import { commonArgs, parseId, parseLimit } from '../options'

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
        await runSafely(async () => {
          const id = parseId(args.id, 'person ID')
          const client = createClient({ language: args.lang })
          const person = await client.people.details(id)

          if (args.json) {
            printJson(person)
          } else {
            printPerson(person, client)
          }
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
        await runSafely(async () => {
          const id = parseId(args.id, 'person ID')
          const limit = parseLimit(args.limit)
          const client = createClient({ language: args.lang })
          const credits = await client.people.combinedCredits(id)

          if (args.json) {
            printJson(credits)
          } else {
            printPersonCredits(credits, limit)
          }
        })
      },
    }),
  },
})
