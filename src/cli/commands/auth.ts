import { existsSync } from 'node:fs'
import { defineCommand } from 'citty'
import { createTMDB, TMDBResponseError } from '../../index'
import { getConfigPath, readConfig, writeConfig } from '../config'
import { resolveCredentials, type ResolvedCredentials } from '../credentials'
import { CliError, errorMessage, exitCodeFor, runSafely } from '../errors'
import { printJson } from '../format'
import { jsonArg } from '../options'
import { readSecret, readStdinSecret } from '../prompt'
import { maskSecret } from '../redact'

export const authCommand = defineCommand({
  meta: {
    name: 'auth',
    description: 'Manage TMDB API credentials',
  },
  subCommands: {
    login: defineCommand({
      meta: {
        name: 'login',
        description: 'Validate and save a TMDB API Read Access Token',
      },
      args: {
        'token-stdin': {
          type: 'boolean',
          description: 'Read the token from stdin instead of prompting',
        },
      },
      async run({ args }) {
        await runSafely(async () => {
          const token = args['token-stdin']
            ? await readStdinSecret()
            : await promptForToken()

          if (!token) {
            throw new CliError('Token must not be empty.', 2)
          }

          const config = readConfig()
          const client = createTMDB({
            accessToken: token,
            baseUrl: process.env.TMDB_BASE_URL,
            defaultLanguage: config.language ?? 'en-US',
          })

          try {
            await client.movies.details(550)
          } catch (error) {
            if (
              error instanceof TMDBResponseError &&
              (error.status === 401 || error.status === 403)
            ) {
              throw new CliError(
                [
                  'Token validation failed: TMDB rejected the token.',
                  'Make sure you copied the API Read Access Token, not the legacy API Key.',
                  'Existing config was not changed.',
                ].join('\n'),
                3,
              )
            }

            throw new CliError(
              `Token validation failed; existing config was not changed.\n${errorMessage(error)}`,
              exitCodeFor(error),
            )
          }

          delete config.apiKey
          config.accessToken = token
          writeConfig(config)
          process.stdout.write(
            `Token validated.\nSaved accessToken to ${getConfigPath()}\n`,
          )

          if (process.env.TMDB_ACCESS_TOKEN?.trim()) {
            process.stdout.write(
              'Note: TMDB_ACCESS_TOKEN is set and takes precedence over the config file.\n',
            )
          }
        })
      },
    }),

    status: defineCommand({
      meta: {
        name: 'status',
        description: 'Show credential source, token mask, and config path',
      },
      args: { ...jsonArg },
      async run({ args }) {
        await runSafely(async () => {
          const credentials = resolveCredentials()
          const path = getConfigPath()
          const configExists = existsSync(path)
          const view = {
            source: credentials.source,
            environmentVariable: credentials.envVar,
            configField: credentials.configField,
            token: maskSecret(credentials.accessToken ?? credentials.apiKey),
            configPath: path,
            configExists,
            language: credentials.config.language ?? null,
            region: credentials.config.region ?? null,
          }

          if (args.json) {
            printJson(view)
            return
          }

          const lines = [
            `Credential source: ${describeSource(credentials)}`,
            `Token: ${view.token ?? '(not set)'}`,
            `Config: ${path}${configExists ? '' : ' (missing)'}`,
            `Language: ${view.language ?? '(not set)'}`,
            `Region: ${view.region ?? '(not set)'}`,
          ]

          if (
            credentials.source === 'environment' &&
            (credentials.config.accessToken || credentials.config.apiKey)
          ) {
            lines.push(
              'Note: config credentials are shadowed by environment variables.',
            )
          }

          if (credentials.source === 'none') {
            lines.push('', 'Run `tmdb auth login` to set up credentials.')
          }

          process.stdout.write(`${lines.join('\n')}\n`)
        })
      },
    }),

    logout: defineCommand({
      meta: {
        name: 'logout',
        description: 'Remove saved API credentials from the config file',
      },
      async run() {
        await runSafely(async () => {
          const config = readConfig()
          const hadCredentials = Boolean(config.accessToken || config.apiKey)

          if (hadCredentials) {
            delete config.accessToken
            delete config.apiKey
            writeConfig(config)
            process.stdout.write(
              `Removed API credentials from ${getConfigPath()}\n`,
            )
          } else {
            process.stdout.write('No saved API credentials found.\n')
          }

          if (
            process.env.TMDB_ACCESS_TOKEN?.trim() ||
            process.env.TMDB_API_KEY?.trim()
          ) {
            process.stdout.write(
              'Environment credentials are still set and will continue to be used.\n',
            )
          }
        })
      },
    }),
  },
})

async function promptForToken(): Promise<string> {
  if (!process.stdin.isTTY) {
    throw new CliError(
      [
        'No interactive terminal available.',
        'Pipe the token with --token-stdin:',
        '  printf \'%s\' "$TMDB_ACCESS_TOKEN" | tmdb auth login --token-stdin',
        'Or set TMDB_ACCESS_TOKEN directly.',
      ].join('\n'),
      2,
    )
  }

  process.stdout.write(
    [
      'Create a token at https://www.themoviedb.org/settings/api',
      'Use the API Read Access Token (not the legacy API Key).',
      '',
    ].join('\n'),
  )

  return readSecret('TMDB access token: ')
}

function describeSource(credentials: ResolvedCredentials): string {
  if (credentials.source === 'environment') {
    return `environment (${credentials.envVar})`
  }
  if (credentials.source === 'config') {
    return `config (${credentials.configField})`
  }
  return 'none'
}
