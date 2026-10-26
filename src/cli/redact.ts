const PLACEHOLDER_CREDENTIALS = new Set(['YOUR_TMDB_ACCESS_TOKEN', 'YOUR_TMDB_API_KEY'])

export function isPlaceholderCredential(value: string | undefined): boolean {
  return value !== undefined && PLACEHOLDER_CREDENTIALS.has(value.trim())
}

export function maskSecret(value: string | undefined): string | null {
  if (!value) {
    return null
  }
  return value.length <= 4 ? '••••' : `••••${value.slice(-4)}`
}

export function describeSecret(value: string | undefined): string | null {
  if (!value) {
    return null
  }
  return isPlaceholderCredential(value) ? '(placeholder)' : maskSecret(value)
}
