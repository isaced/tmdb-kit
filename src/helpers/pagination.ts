import type { PagedResponse } from '../types'

/** Fetches a single page. The caller closes over its own query options. */
export interface PageFetcher<T> {
  (page: number): Promise<PagedResponse<T>>
}

export interface PaginateOptions {
  /** First page to request. Defaults to 1. */
  startPage?: number
  /** Last page to request, inclusive. Defaults to 500, TMDB's documented cap. */
  endPage?: number
  /** Cancels the iteration before the next request. */
  signal?: AbortSignal
}

/**
 * Iterate a paged TMDB endpoint page by page.
 *
 * Stops when the API reports the last page, when a page has no results,
 * when `endPage` is reached, or when the signal is aborted. Yields nothing
 * when `endPage` is lower than `startPage`. The fetcher
 * receives the page number and should forward the signal to the SDK:
 *
 * ```ts
 * for await (const page of paginate((page) => tmdb.movies.popular({ page, signal }))) {
 *   console.log(page.page, page.results.length)
 * }
 * ```
 */
export async function* paginate<T>(
  fetchPage: PageFetcher<T>,
  options: PaginateOptions = {},
): AsyncGenerator<PagedResponse<T>, void, undefined> {
  const startPage = options.startPage ?? 1
  const endPage = options.endPage ?? 500
  assertPositiveInteger(startPage, 'startPage')
  assertPositiveInteger(endPage, 'endPage')

  for (let page = startPage; page <= endPage; page += 1) {
    options.signal?.throwIfAborted()

    const response = await fetchPage(page)
    yield response

    if (response.results.length === 0 || page >= response.total_pages) {
      return
    }
  }
}

/**
 * Iterate a paged TMDB endpoint item by item.
 *
 * Built on {@link paginate}; use `paginate` directly when you need page
 * metadata such as `total_pages`.
 */
export async function* paginateItems<T>(
  fetchPage: PageFetcher<T>,
  options: PaginateOptions = {},
): AsyncGenerator<T, void, undefined> {
  for await (const page of paginate(fetchPage, options)) {
    yield* page.results
  }
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive integer`)
  }
}
