import { describe, it, expect } from 'vitest'
import { suppListOf, takenOn, withToggled, suppStreak } from './supps.js'
import { mergeStampedMap } from './sync-merge.js'

const day = (ids, ts = 1) => ({ ids, _ts: ts })

describe('supplements', () => {
  it('keeps only known ids, once, in the list order', () => {
    expect(suppListOf({ suppList: ['whey', 'nope', 'creatine', 'whey'] })).toEqual(['creatine', 'whey'])
    expect(suppListOf({})).toEqual([])
    expect([...takenOn({ supps: { d: day(['x', 'whey']) } }, 'd')]).toEqual(['whey'])
    expect(takenOn({ supps: { d: 'junk' } }, 'd').size).toBe(0)
  })

  it('ticks and unticks one supplement on one day, stamped, other days untouched', () => {
    const S = { supps: { a: day(['whey'], 1) } }
    const on = withToggled(S, 'b', 'creatine', 7)
    expect(on).toEqual({ a: day(['whey'], 1), b: day(['creatine'], 7) })
    const off = withToggled({ supps: on }, 'b', 'creatine', 8)
    expect(off.b).toEqual(day([], 8))
    expect(withToggled({}, 'a', 'unknown', 9).a).toEqual(day([], 9))
  })

  it('counts the days in a row, from yesterday when today is not ticked yet', () => {
    const supps = { '2026-11-19': day(['creatine']), '2026-11-20': day(['creatine']), '2026-11-21': day(['creatine']) }
    expect(suppStreak({ supps }, 'creatine', '2026-11-21')).toBe(3)
    expect(suppStreak({ supps }, 'creatine', '2026-11-22')).toBe(3)
    expect(suppStreak({ supps }, 'creatine', '2026-11-23')).toBe(0)
    expect(suppStreak({ supps }, 'whey', '2026-11-21')).toBe(0)
  })

  it('runs across a month and a year end', () => {
    const supps = { '2026-12-31': day(['vitd']), '2027-01-01': day(['vitd']), '2026-11-30': day(['whey']), '2026-12-01': day(['whey']) }
    expect(suppStreak({ supps }, 'vitd', '2027-01-01')).toBe(2)
    expect(suppStreak({ supps }, 'whey', '2026-12-01')).toBe(2)
  })

  it('merges per day across devices', () => {
    const phone = { a: day(['creatine'], 20) }
    const laptop = { a: day([], 10), b: day(['whey'], 15) }
    const merged = { supps: mergeStampedMap(phone, laptop) }
    expect([...takenOn(merged, 'a')]).toEqual(['creatine'])
    expect([...takenOn(merged, 'b')]).toEqual(['whey'])
  })
})
