import type { FetchLike } from '../src'

export interface FetchCall {
  init: RequestInit
  url: URL
}

export interface MockFetchResponse {
  body?: unknown
  headers?: HeadersInit
  status?: number
  statusText?: string
}

export function createMockFetch(...responses: MockFetchResponse[]) {
  const calls: FetchCall[] = []
  const queue = [...responses]

  const fetch: FetchLike = async (input, init = {}) => {
    calls.push({
      init,
      url: new URL(input),
    })

    const response = queue.shift() ?? { body: {} }
    const headers = new Headers(response.headers)
    let body: BodyInit | null = null

    if (response.body !== undefined) {
      body = typeof response.body === 'string' ? response.body : JSON.stringify(response.body)

      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json')
      }
    }

    return new Response(body, {
      headers,
      status: response.status ?? 200,
      statusText: response.statusText,
    })
  }

  return { calls, fetch }
}

export function paged<T>(results: T[]) {
  return {
    page: 1,
    results,
    total_pages: 1,
    total_results: results.length,
  }
}
