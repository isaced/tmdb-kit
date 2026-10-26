import { defineCommand } from 'citty'
import pkg from '../../package.json' with { type: 'json' }
import { authCommand } from './commands/auth'
import { configCommand } from './commands/config'
import { genresCommand } from './commands/genres'
import { movieCommand } from './commands/movie'
import { personCommand } from './commands/person'
import { searchCommand } from './commands/search'
import { trendingCommand } from './commands/trending'
import { tvCommand } from './commands/tv'

export const CLI_VERSION = pkg.version

export const mainCommand = defineCommand({
  meta: {
    name: 'tmdb',
    version: CLI_VERSION,
    description: 'A read-only TMDB command-line client',
  },
  subCommands: {
    search: searchCommand,
    movie: movieCommand,
    tv: tvCommand,
    person: personCommand,
    trending: trendingCommand,
    genres: genresCommand,
    auth: authCommand,
    config: configCommand,
  },
})
