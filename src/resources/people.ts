import type { TMDBTransport } from '../http'
import { toId, withLanguage, type QueryParams } from '../query'
import type {
  ExternalIds,
  LanguageOptions,
  ListOptions,
  PagedResponse,
  PersonCombinedCreditsResponse,
  PersonDetails,
  PersonSummary,
  RequestOptions,
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
      signal: options.signal,
    })
  }

  details(personId: number, options: LanguageOptions = {}): Promise<PersonDetails> {
    return this.#transport.get(`/person/${toId(personId, 'personId')}`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
      }),
      signal: options.signal,
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
      signal: options.signal,
    })
  }

  externalIds(personId: number, options: RequestOptions = {}): Promise<ExternalIds> {
    return this.#transport.get(`/person/${toId(personId, 'personId')}/external_ids`, {
      signal: options.signal,
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
