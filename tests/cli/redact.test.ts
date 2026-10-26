import { describe, expect, it } from 'vitest'
import {
  describeSecret,
  isPlaceholderCredential,
  maskSecret,
} from '../../src/cli/redact'

describe('credential redaction', () => {
  it('detects template placeholders', () => {
    expect(isPlaceholderCredential('YOUR_TMDB_ACCESS_TOKEN')).toBe(true)
    expect(isPlaceholderCredential('  YOUR_TMDB_API_KEY  ')).toBe(true)
    expect(isPlaceholderCredential('real-token')).toBe(false)
    expect(isPlaceholderCredential(undefined)).toBe(false)
  })

  it('masks secrets', () => {
    expect(maskSecret(undefined)).toBeNull()
    expect(maskSecret('abc')).toBe('••••')
    expect(maskSecret('abcdef')).toBe('••••cdef')
  })

  it('labels placeholders and masks real secrets', () => {
    expect(describeSecret(undefined)).toBeNull()
    expect(describeSecret('YOUR_TMDB_ACCESS_TOKEN')).toBe('(placeholder)')
    expect(describeSecret('abcdef')).toBe('••••cdef')
  })
})
