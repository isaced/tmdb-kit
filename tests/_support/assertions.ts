import { expect } from 'bun:test'
import type { FetchCall } from './fetch'

export interface ExpectedRequest {
  headers?: Record<string, string | null>
  path: string
  query?: Record<string, string | null>
}

export function expectRequest(call: FetchCall, expected: ExpectedRequest): void {
  expect(call.method).toBe('GET')
  expect(call.url.pathname).toBe(expected.path)

  for (const [name, value] of Object.entries(expected.query ?? {})) {
    expect(call.url.searchParams.get(name), `query param ${name}`).toBe(value)
  }

  for (const [name, value] of Object.entries(expected.headers ?? {})) {
    expect(call.headers.get(name), `header ${name}`).toBe(value)
  }
}

export function expectNoQuery(call: FetchCall, ...names: string[]): void {
  for (const name of names) {
    expect(call.url.searchParams.has(name), `query param ${name}`).toBe(false)
  }
}

export function expectPaths(calls: FetchCall[], paths: string[]): void {
  expect(calls.map((call) => call.url.pathname)).toEqual(paths)
}
