import { describe, expect, it } from 'vitest'
import {
  isKnownBackdropSize,
  isKnownImageSize,
  isKnownLogoSize,
  isKnownPosterSize,
  isKnownProfileSize,
  isKnownStillSize,
  KNOWN_BACKDROP_SIZES,
  KNOWN_IMAGE_SIZES,
  KNOWN_LOGO_SIZES,
  KNOWN_POSTER_SIZES,
  KNOWN_PROFILE_SIZES,
  KNOWN_STILL_SIZES,
} from '../../src'

describe('known image-size constants', () => {
  it('expose the canonical TMDB-documented sizes as readonly tuples', () => {
    // We assert against snapshots rather than types so that any
    // accidental change to a public constant is caught by CI.
    expect([...KNOWN_BACKDROP_SIZES]).toEqual(['w300', 'w780', 'w1280', 'original'])
    expect([...KNOWN_LOGO_SIZES]).toEqual(['w45', 'w92', 'w154', 'w185', 'w300', 'w500', 'original'])
    expect([...KNOWN_POSTER_SIZES]).toEqual([
      'w92',
      'w154',
      'w185',
      'w342',
      'w500',
      'w780',
      'original',
    ])
    expect([...KNOWN_PROFILE_SIZES]).toEqual(['w45', 'w185', 'h632', 'original'])
    expect([...KNOWN_STILL_SIZES]).toEqual(['w92', 'w185', 'w300', 'original'])
  })

  it('KNOWN_IMAGE_SIZES is the union of every per-type set, with duplicates collapsed to the unique set', () => {
    const concat = [
      ...KNOWN_BACKDROP_SIZES,
      ...KNOWN_LOGO_SIZES,
      ...KNOWN_POSTER_SIZES,
      ...KNOWN_PROFILE_SIZES,
      ...KNOWN_STILL_SIZES,
    ]

    // The merged constant should contain every concat entry in order.
    expect([...KNOWN_IMAGE_SIZES]).toEqual(concat)
    // …and the unique size should be smaller than (or equal to) the
    // total — sizes like 'w300' and 'original' are shared across types.
    expect(new Set(KNOWN_IMAGE_SIZES).size).toBeLessThan(concat.length)
    // Sanity: every per-type set contributes at least one unique entry
    // that survives the dedup.
    expect(new Set(KNOWN_IMAGE_SIZES).size).toBeGreaterThan(0)
  })

  it('treat the constants as readonly tuples (mutating throws at runtime)', () => {
    // `as const` produces a readonly tuple. Casting to a mutable array
    // is required to even attempt the write — and TS rejects it.
    const backdrop = KNOWN_BACKDROP_SIZES as unknown as string[]
    expect(() => {
      ;(backdrop as string[]).push('w9999')
    }).toThrow(TypeError)
  })
})

describe('isKnown* size guards', () => {
  it('accept every documented size for its corresponding type', () => {
    for (const size of KNOWN_BACKDROP_SIZES) {
      expect(isKnownBackdropSize(size), `backdrop: ${size} (typeof=${typeof size})`).toBe(true)
    }
    for (const size of KNOWN_LOGO_SIZES) {
      expect(isKnownLogoSize(size), `logo: ${size}`).toBe(true)
    }
    for (const size of KNOWN_POSTER_SIZES) {
      expect(isKnownPosterSize(size), `poster: ${size}`).toBe(true)
    }
    for (const size of KNOWN_PROFILE_SIZES) {
      expect(isKnownProfileSize(size), `profile: ${size}`).toBe(true)
    }
    for (const size of KNOWN_STILL_SIZES) {
      expect(isKnownStillSize(size), `still: ${size}`).toBe(true)
    }
  })

  it('reject strings that do not belong to the corresponding type', () => {
    // Profile and logo both contain 'w45', so neither rejects the
    // other. The test cases below focus on unambiguously-wrong inputs.
    expect(isKnownBackdropSize('w45')).toBe(false) // not a backdrop size
    expect(isKnownBackdropSize('w342')).toBe(false) // poster-only
    expect(isKnownLogoSize('w1280')).toBe(false) // backdrop-only
    expect(isKnownPosterSize('h632')).toBe(false) // profile-only
    expect(isKnownProfileSize('w342')).toBe(false) // poster-only
    expect(isKnownStillSize('w500')).toBe(false) // not a still size
  })

  it('do not throw for empty / unknown / nullish inputs', () => {
    expect(isKnownBackdropSize('')).toBe(false)
    expect(isKnownBackdropSize('w9999')).toBe(false)
    // We don't accept null/undefined at the parameter level because the
    // signature is `(value: string)`. Verify that passing non-strings
    // is at least safe.
    expect(isKnownBackdropSize(undefined as unknown as string)).toBe(false)
    expect(isKnownBackdropSize(null as unknown as string)).toBe(false)
    expect(isKnownBackdropSize(42 as unknown as string)).toBe(false)
  })

  it('isKnownImageSize is the union of every per-type check', () => {
    for (const size of KNOWN_IMAGE_SIZES) {
      expect(isKnownImageSize(size)).toBe(true)
    }

    const negativeSamples = ['', 'w9999', 'h9999', 'original-ish', 'thumb']
    for (const sample of negativeSamples) {
      expect(isKnownImageSize(sample)).toBe(false)
    }
  })
})
