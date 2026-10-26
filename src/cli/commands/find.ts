import { defineCommand } from 'citty'
import { createClient } from '../client'
import { printFindResults } from '../format'
import { printResult, runSafely } from '../output'
import { commonArgs, parseExternalId, parseExternalSource } from '../options'

export const findCommand = defineCommand({
  meta: {
    name: 'find',
    description: 'Find TMDB entries by an external ID',
  },
  args: {
    ...commonArgs,
    externalId: {
      type: 'positional',
      description: 'External ID (for example tt0137523)',
      required: true,
    },
    source: {
      type: 'string',
      description: 'External ID source (default: imdb_id)',
    },
  },
  async run({ args }) {
    await runSafely(args, async (output) => {
      const externalId = parseExternalId(args.externalId)
      const source = parseExternalSource(args.source?.trim() || 'imdb_id')
      const client = createClient({ language: args.lang })
      const response = await client.find.byExternalId(externalId, { source })

      printResult(response, output, () => printFindResults(response))
    })
  },
})
