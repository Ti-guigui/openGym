import { describe, it, expect } from 'vitest'
import { guidedOrder, guidedNow, guidedAfter, guidedWhere } from './guided.js'

const set = (done = false, extra = {}) => ({ w: 20, r: 10, done, ...extra })
const e = (id, sets, sg) => ({ id, sets, ...(sg ? { sg } : {}) })

describe('guided workout order', () => {
  it('goes exercise by exercise, a superset round by round', () => {
    const entries = [e('a', [set(), set()]), e('b', [set(), set()], 's1'), e('c', [set(), set()], 's1'), e('d', [set()])]
    expect(guidedOrder(entries).map(p => entries[p.idx].id + p.i)).toEqual(['a0', 'a1', 'b0', 'c0', 'b1', 'c1', 'd0'])
  })
  it('picks the first set not done, skipping what was skipped', () => {
    const entries = [e('a', [set(true), set()]), e('b', [set()])]
    expect(guidedNow(entries)).toEqual({ idx: 0, i: 1 })
    expect(guidedNow(entries, ['0:1'])).toEqual({ idx: 1, i: 0 })
    expect(guidedNow(entries, ['0:1', '1:0'])).toEqual({ idx: 0, i: 1 })
    expect(guidedNow([e('a', [set(true)])])).toBe(null)
  })
  it('says what comes next', () => {
    const entries = [e('a', [set(), set()]), e('b', [set()])]
    expect(guidedAfter(entries, { idx: 0, i: 0 })).toEqual({ idx: 0, i: 1 })
    expect(guidedAfter(entries, { idx: 0, i: 1 })).toEqual({ idx: 1, i: 0 })
    expect(guidedAfter(entries, { idx: 1, i: 0 })).toEqual({ idx: 0, i: 0 })
    expect(guidedAfter([e('a', [set()])], { idx: 0, i: 0 })).toBe(null)
  })
  it('counts warm-ups apart from work sets', () => {
    const entries = [e('a', [set(true, { phase: 'warmup' }), set(), set()]), e('b', [set()])]
    expect(guidedWhere(entries, { idx: 0, i: 2 })).toMatchObject({ done: 1, total: 4, warm: false, setNo: 2, setOf: 2, unitNo: 1, units: 2 })
    expect(guidedWhere(entries, { idx: 0, i: 0 })).toMatchObject({ warm: true, setNo: 1, setOf: 1 })
  })
})
