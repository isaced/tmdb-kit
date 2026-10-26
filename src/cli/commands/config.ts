import { defineCommand } from 'citty'
import {
  getConfigPath,
  readConfig,
  setConfigValue,
  unsetConfigValue,
  type ConfigField,
} from '../config'
import { createClient } from '../client'
import { CliError, runSafely } from '../errors'
import { printJson } from '../format'
import { jsonArg } from '../options'
import { readSecret } from '../prompt'
import { maskSecret } from '../redact'

const CONFIG_KEY_ALIASES = {
  token: 'accessToken',
  accessToken: 'accessToken',
  'api-key': 'apiKey',
  apiKey: 'apiKey',
  language: 'language',
  region: 'region',
} as const

type ConfigKey = keyof typeof CONFIG_KEY_ALIASES

export const configCommand = defineCommand({
  meta: {
    name: 'config',
    description: 'Manage TMDB CLI configuration',
  },
  subCommands: {
    show: defineCommand({
      meta: {
        name: 'show',
        description: 'Show the resolved config with secrets masked',
      },
      args: { ...jsonArg },
      async run({ args }) {
        await runSafely(async () => {
          const config = readConfig()
          const path = getConfigPath()
          const view = {
            path,
            accessToken: maskSecret(config.accessToken),
            apiKey: maskSecret(config.apiKey),
            language: config.language ?? null,
            region: config.region ?? null,
          }

          if (args.json) {
            printJson(view)
            return
          }

          process.stdout.write(
            [
              `Path: ${path}`,
              `accessToken: ${view.accessToken ?? '(not set)'}`,
              `apiKey: ${view.apiKey ?? '(not set)'}`,
              `language: ${view.language ?? '(not set)'}`,
              `region: ${view.region ?? '(not set)'}`,
            ].join('\n') + '\n',
          )
        })
      },
    }),

    path: defineCommand({
      meta: {
        name: 'path',
        description: 'Print the config file path',
      },
      run() {
        process.stdout.write(`${getConfigPath()}\n`)
      },
    }),

    test: defineCommand({
      meta: {
        name: 'test',
        description: 'Verify credentials with an authenticated TMDB request',
      },
      args: { ...jsonArg },
      async run({ args }) {
        await runSafely(async () => {
          const client = createClient()
          await client.movies.details(550)

          if (args.json) {
            printJson({ ok: true })
            return
          }

          process.stdout.write('TMDB connection OK\nCredentials are valid.\n')
        })
      },
    }),

    set: defineCommand({
      meta: {
        name: 'set',
        description: 'Set a config value (token and api-key are read securely)',
      },
      args: {
        key: {
          type: 'positional',
          description: 'token, api-key, language, or region',
          required: true,
        },
        value: {
          type: 'positional',
          description: 'Value for language or region',
          required: false,
        },
      },
      async run({ args }) {
        await runSafely(async () => {
          const field = parseConfigKey(args.key)
          const path = getConfigPath()

          if (field === 'accessToken' || field === 'apiKey') {
            if (args.value !== undefined) {
              throw new CliError(
                'Do not pass secrets as command arguments. Run the command without a value to enter it securely.',
                2,
              )
            }

            const label = field === 'accessToken' ? 'TMDB access token' : 'TMDB API key'
            const secret = await readSecret(`${label}: `)
            if (!secret) {
              throw new CliError('Secret must not be empty.', 2)
            }

            setConfigValue(field, secret)
            process.stdout.write(`Saved ${field} to ${path}\n`)
            return
          }

          const value = args.value?.trim()
          if (!value) {
            throw new CliError(`A value is required for ${args.key}.`, 2)
          }

          setConfigValue(field, field === 'region' ? value.toUpperCase() : value)
          process.stdout.write(`Saved ${field} to ${path}\n`)
        })
      },
    }),

    unset: defineCommand({
      meta: {
        name: 'unset',
        description: 'Remove a config value',
      },
      args: {
        key: {
          type: 'positional',
          description: 'token, api-key, language, or region',
          required: true,
        },
      },
      async run({ args }) {
        await runSafely(async () => {
          const field = parseConfigKey(args.key)
          unsetConfigValue(field)
          process.stdout.write(`Removed ${field} from ${getConfigPath()}\n`)
        })
      },
    }),
  },
})

function parseConfigKey(value: string): ConfigField {
  if (!(value in CONFIG_KEY_ALIASES)) {
    throw new CliError(
      `Unknown config key "${value}". Expected one of: ${Object.keys(CONFIG_KEY_ALIASES).join(', ')}.`,
      2,
    )
  }
  return CONFIG_KEY_ALIASES[value as ConfigKey]
}
