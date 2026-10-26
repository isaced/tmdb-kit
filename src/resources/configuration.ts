import type { TMDBTransport } from '../http'
import type {
  Configuration,
  Country,
  JobDepartment,
  Language,
  RequestOptions,
  Timezone,
} from '../types'

/**
 * Access TMDB configuration data (image sizes, countries, languages, etc.).
 *
 * Obtained via `client.configuration`.
 */
export class ConfigurationResource {
  readonly #transport: TMDBTransport

  constructor(transport: TMDBTransport) {
    this.#transport = transport
  }

  details(options: RequestOptions = {}): Promise<Configuration> {
    return this.#transport.get('/configuration', { signal: options.signal })
  }

  countries(options: RequestOptions = {}): Promise<Country[]> {
    return this.#transport.get('/configuration/countries', { signal: options.signal })
  }

  jobs(options: RequestOptions = {}): Promise<JobDepartment[]> {
    return this.#transport.get('/configuration/jobs', { signal: options.signal })
  }

  languages(options: RequestOptions = {}): Promise<Language[]> {
    return this.#transport.get('/configuration/languages', { signal: options.signal })
  }

  primaryTranslations(options: RequestOptions = {}): Promise<string[]> {
    return this.#transport.get('/configuration/primary_translations', {
      signal: options.signal,
    })
  }

  timezones(options: RequestOptions = {}): Promise<Timezone[]> {
    return this.#transport.get('/configuration/timezones', { signal: options.signal })
  }
}
