import type { TMDBTransport } from '../http'
import { toId, withLanguage, type QueryParams } from '../query'
import type {
  LanguageOptions,
  ListOptions,
  PagedResponse,
  PersonCombinedCreditsResponse,
  PersonDetails,
  PersonSummary,
} from '../types'

/**
 * Access TMDB person (actor, director, etc.) endpoints.
 *
 * Obtained via `client.people`.
 */
export class PeopleResource {
  readonly #transport: TMDBTransport

  constructor(transport: TMDBTransport) {
    this.#transport = transport
  }

  popular(options: Omit<ListOptions, 'region'> = {}): Promise<PagedResponse<PersonSummary>> {
    return this.#transport.get('/person/popular', {
      query: peopleListQuery(this.#transport, options),
    })
  }

  details(personId: number, options: LanguageOptions = {}): Promise<PersonDetails> {
    return this.#transport.get(`/person/${toId(personId, 'personId')}`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
      }),
    })
  }

  combinedCredits(
    personId: number,
    options: LanguageOptions = {},
  ): Promise<PersonCombinedCreditsResponse> {
    return this.#transport.get(`/person/${toId(personId, 'personId')}/combined_credits`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
      }),
    })
  }
}

/** Build query parameters for person list endpoints. */
function peopleListQuery(
  transport: TMDBTransport,
  options: Omit<ListOptions, 'region'>,
): QueryParams {
  return withLanguage(transport.defaults, {
    language: options.language,
    page: options.page,
  })
}
