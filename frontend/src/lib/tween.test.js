import { describe, it, expect } from 'vitest'
import { easeOut, tweenAt } from './tween.js'

describe('tween', () => {
  it('eases out between 0 and 1', () => {
    expect(easeOut(0)).toBe(0)
    expect(easeOut(1)).toBe(1)
    expect(easeOut(0.5)).toBeGreaterThan(0.5)
    expect(easeOut(2)).toBe(1)
  })
  it('lands exactly on the new value', () => {
    expect(tweenAt(2000, 2280, 450)).toBe(2280)
    expect(tweenAt(2000, 2280, 9999)).toBe(2280)
    expect(tweenAt(2000, 2280, 0)).toBe(2000)
  })
  it('moves part of the way, on the step, and both ways', () => {
    const mid = tweenAt(2000, 2280, 225, 450, 10)
    expect(mid).toBeGreaterThan(2000)
    expect(mid).toBeLessThan(2280)
    expect(mid % 10).toBe(0)
    expect(tweenAt(2280, 2000, 225)).toBeLessThan(2280)
  })
})
