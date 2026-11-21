import { describe, it, expect } from 'vitest'
import { QUOTES, quoteIndex, quoteOf } from './quotes.js'

const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }

describe('quote of the day', () => {
  it('is the same for the same day and moves one step the next day', () => {
    expect(quoteOf('2026-11-22')).toBe(quoteOf('2026-11-22'))
    expect(quoteIndex('2026-11-23')).toBe((quoteIndex('2026-11-22') + 1) % QUOTES.length)
  })

  it('shows every line once before any repeats, across a year end', () => {
    const seen = new Set()
    for (let i = 0; i < QUOTES.length; i++) seen.add(quoteIndex(addDays('2026-12-25', i)))
    expect(seen.size).toBe(QUOTES.length)
  })

  it('falls back to the first line on a bad date', () => {
    expect(quoteIndex('')).toBe(0)
    expect(quoteIndex('not a date')).toBe(0)
    expect(quoteIndex(undefined)).toBe(0)
  })

  it('has no em dash in any line (house style)', () => {
    for (const q of QUOTES) expect(q).not.toMatch(/—/)
  })
})
