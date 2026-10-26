import { defineCommand } from 'citty'
import { createClient } from '../client'
import { runSafely } from '../errors'
import { printGenres, printJson } from '../format'
import { commonArgs, parseGenreType } from '../options'

export const genresCommand = defineCommand({
  meta: {
    name: 'genres',
    description: 'List movie or TV genres',
  },
  args: {
    ...commonArgs,
    type: {
      type: 'positional',
      description: 'Genre list type: movie or tv',
      default: 'movie',
    },
  },
  async run({ args }) {
    await runSafely(async () => {
      const type = parseGenreType(args.type)
      const client = createClient({ language: args.lang })
      const response = type === 'tv' ? await client.genres.tv() : await client.genres.movies()

      if (args.json) {
        printJson(response)
      } else {
        printGenres(response)
      }
    })
  },
})
