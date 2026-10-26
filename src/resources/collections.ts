import type { TMDBTransport } from '../http'
import { toCommaList, toId, withLanguage } from '../query'
import type {
  CollectionDetails,
  CollectionTranslationsResponse,
  ImageQueryOptions,
  ImagesResponse,
  LanguageOptions,
  RequestOptions,
} from '../types'

/**
 * Access TMDB collection (franchise) endpoints.
 *
 * Obtained via `client.collections`.
 */
export class CollectionsResource {
  readonly #transport: TMDBTransport

  constructor(transport: TMDBTransport) {
    this.#transport = transport
  }

  details(collectionId: number, options: LanguageOptions = {}): Promise<CollectionDetails> {
    return this.#transport.get(`/collection/${toId(collectionId, 'collectionId')}`, {
      query: withLanguage(this.#transport.defaults, {
        language: options.language,
      }),
      signal: options.signal,
    })
  }

  images(collectionId: number, options: ImageQueryOptions = {}): Promise<ImagesResponse> {
    return this.#transport.get(`/collection/${toId(collectionId, 'collectionId')}/images`, {
      query: withLanguage(this.#transport.defaults, {
        include_image_language: toCommaList(options.includeImageLanguage),
        language: options.language,
      }),
      signal: options.signal,
    })
  }

  translations(
    collectionId: number,
    options: RequestOptions = {},
  ): Promise<CollectionTranslationsResponse> {
    return this.#transport.get(`/collection/${toId(collectionId, 'collectionId')}/translations`, {
      signal: options.signal,
    })
  }
}
