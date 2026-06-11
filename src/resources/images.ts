import type { TMDBTransport } from '../http'
import { buildImageUrl } from '../query'
import type { ImageSize } from '../types'

export class ImagesHelper {
  readonly #transport: TMDBTransport

  constructor(transport: TMDBTransport) {
    this.#transport = transport
  }

  url(path: string | null | undefined, size: ImageSize = 'original'): string | null {
    return buildImageUrl(path, size, {
      baseUrl: this.#transport.defaults.imageBaseUrl,
    })
  }
}
