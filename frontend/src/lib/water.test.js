import { describe, it, expect } from 'vitest'
import { waterOf, withWater, WATER_MAX } from './water.js'
import { mergeStampedMap } from './sync-merge.js'

describe('water', () => {
  it('reads 0 for a missing day, a missing map or junk', () => {
    expect(waterOf({}, '2026-11-21')).toBe(0)
    expect(waterOf({ water: { '2026-11-21': { n: 'x' } } }, '2026-11-21')).toBe(0)
    expect(waterOf({ water: [] }, '2026-11-21')).toBe(0)
  })

  it('clamps what it reads and writes to 0..WATER_MAX', () => {
    expect(waterOf({ water: { d: { n: -3 } } }, 'd')).toBe(0)
    expect(waterOf({ water: { d: { n: 99 } } }, 'd')).toBe(WATER_MAX)
    expect(withWater({}, 'd', -1, 5).d).toEqual({ n: 0, _ts: 5 })
    expect(withWater({}, 'd', 2.7, 5).d).toEqual({ n: 2, _ts: 5 })
  })

  it('keeps the other days and stamps the changed one', () => {
    const m = withWater({ a: { n: 3, _ts: 1 } }, 'b', 4, 9)
    expect(m).toEqual({ a: { n: 3, _ts: 1 }, b: { n: 4, _ts: 9 } })
  })

  it('merges per day: each device keeps its own day, the same day keeps the later count', () => {
    const phone = { a: { n: 5, _ts: 20 }, b: { n: 1, _ts: 10 } }
    const laptop = { a: { n: 2, _ts: 10 }, c: { n: 3, _ts: 15 } }
    const merged = mergeStampedMap(phone, laptop)
    expect(waterOf({ water: merged }, 'a')).toBe(5)
    expect(waterOf({ water: merged }, 'b')).toBe(1)
    expect(waterOf({ water: merged }, 'c')).toBe(3)
  })
})
