import { describe, expect, it } from 'vitest'
import {
  detectCredential,
  unrecognizedCredentialMessage,
} from '../../src/cli/credential-format'

const ACCESS_TOKEN =
  'eyJhbGciOiJIUzI1NiJ9.eyJzY29wZXMiOlsiYXBpX3JlYWQiXX0.signature'
const API_KEY = '0123456789abcdef0123456789abcdef'

describe('credential format detection', () => {
  it('detects access tokens and trims optional Bearer prefixes', () => {
    expect(detectCredential(ACCESS_TOKEN)).toEqual({
      kind: 'accessToken',
      value: ACCESS_TOKEN,
    })
    expect(detectCredential(`  ${ACCESS_TOKEN}  `)).toEqual({
      kind: 'accessToken',
      value: ACCESS_TOKEN,
    })
    expect(detectCredential(`Bearer ${ACCESS_TOKEN}`)).toEqual({
      kind: 'accessToken',
      value: ACCESS_TOKEN,
    })
  })

  it('detects 32-character API keys', () => {
    expect(detectCredential(API_KEY)).toEqual({
      kind: 'apiKey',
      value: API_KEY,
    })
    expect(detectCredential(API_KEY.toUpperCase())).toEqual({
      kind: 'apiKey',
      value: API_KEY.toUpperCase(),
    })
  })

  it('rejects unrecognized credential formats', () => {
    for (const value of [
      '',
      'not-a-credential',
      'abc.def',
      '0123456789abcdef0123456789abcde',
      '0123456789abcdef0123456789abcdef0',
      'YOUR_TMDB_ACCESS_TOKEN',
    ]) {
      expect(detectCredential(value), value).toBeUndefined()
    }
  })

  it('describes the accepted credential formats', () => {
    const message = unrecognizedCredentialMessage()

    expect(message).toContain('API Read Access Token')
    expect(message).toContain('API Key')
    expect(message).toContain('32 hexadecimal')
    expect(message).toContain('https://www.themoviedb.org/settings/api')
  })
})
