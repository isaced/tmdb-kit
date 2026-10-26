export type CredentialKind = 'accessToken' | 'apiKey'

export interface DetectedCredential {
  kind: CredentialKind
  value: string
}

const ACCESS_TOKEN_PATTERN =
  /^eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/
const API_KEY_PATTERN = /^[a-fA-F0-9]{32}$/

export function detectCredential(input: string): DetectedCredential | undefined {
  const value = input.trim().replace(/^Bearer\s+/i, '')

  if (API_KEY_PATTERN.test(value)) {
    return { kind: 'apiKey', value }
  }
  if (ACCESS_TOKEN_PATTERN.test(value)) {
    return { kind: 'accessToken', value }
  }
  return undefined
}

export function unrecognizedCredentialMessage(): string {
  return [
    'Unrecognized TMDB credential format.',
    '',
    'Expected one of:',
    '  - API Read Access Token (JWT, three dot-separated segments)',
    '  - API Key (32 hexadecimal characters)',
    '',
    'Create credentials:',
    '  https://www.themoviedb.org/settings/api',
  ].join('\n')
}
