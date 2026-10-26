import type { FetchLike } from '../../src'

export interface FetchCall {
  headers: Headers
  init: RequestInit
  method: string
  signal: AbortSignal | null | undefined
  url: URL
}

export interface MockFetchResponse {
  body?: unknown
  headers?: HeadersInit
  status?: number
  statusText?: string
}

export interface FetchMock {
  calls: FetchCall[]
  fetch: FetchLike
  lastCall(): FetchCall
}

export function createFetchMock(...responses: Array<MockFetchResponse | Response>): FetchMock {
  const calls: FetchCall[] = []
  const queue = [...responses]

  const fetch: FetchLike = async (input, init = {}) => {
    const headers = new Headers(init.headers)

    calls.push({
      headers,
      init,
      method: init.method ?? 'GET',
      signal: init.signal,
      url: new URL(input),
    })

    return toResponse(queue.shift() ?? jsonResponse({}))
  }

  return {
    calls,
    fetch,
    lastCall() {
      const call = calls.at(-1)

      if (call === undefined) {
        throw new Error('Expected at least one fetch call')
      }

      return call
    },
  }
}

export function jsonResponse(
  body: unknown,
  init: Omit<MockFetchResponse, 'body'> = {},
): MockFetchResponse {
  return {
    ...init,
    body,
  }
}

export function textResponse(body: string, init: Omit<MockFetchResponse, 'body'> = {}): Response {
  return new Response(body, {
    headers: init.headers,
    status: init.status ?? 200,
    statusText: init.statusText,
  })
}

export function emptyResponse(init: Omit<MockFetchResponse, 'body'> = {}): Response {
  return new Response(null, {
    headers: init.headers,
    status: init.status ?? 204,
    statusText: init.statusText,
  })
}

function toResponse(response: MockFetchResponse | Response): Response {
  if (response instanceof Response) {
    return response
  }

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
