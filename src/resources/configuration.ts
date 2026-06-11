import type { TMDBTransport } from '../http'
import type { Configuration, Country, JobDepartment, Language, Timezone } from '../types'

export class ConfigurationResource {
  readonly #transport: TMDBTransport

  constructor(transport: TMDBTransport) {
    this.#transport = transport
  }

  details(): Promise<Configuration> {
    return this.#transport.get('/configuration')
  }

  countries(): Promise<Country[]> {
    return this.#transport.get('/configuration/countries')
  }

  jobs(): Promise<JobDepartment[]> {
    return this.#transport.get('/configuration/jobs')
  }

  languages(): Promise<Language[]> {
    return this.#transport.get('/configuration/languages')
  }

  primaryTranslations(): Promise<string[]> {
    return this.#transport.get('/configuration/primary_translations')
  }

  timezones(): Promise<Timezone[]> {
    return this.#transport.get('/configuration/timezones')
  }
}
