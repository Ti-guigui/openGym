import { describe, it, expect } from 'vitest'
import { cmAt, fracOf, snapCm, shownHeight, RULER_MIN, RULER_MAX } from './height-ruler.js'

describe('height ruler', () => {
  it('reads 220 cm at the top and 120 cm at the bottom', () => {
    expect(cmAt(0)).toBe(RULER_MAX)
    expect(cmAt(1)).toBe(RULER_MIN)
    expect(cmAt(0.42)).toBe(178)
    expect(cmAt(-1)).toBe(RULER_MAX)
    expect(cmAt(3)).toBe(RULER_MIN)
  })
  it('puts a height back where it was read', () => {
    for (const cm of [120, 165, 178, 220]) expect(cmAt(fracOf(cm))).toBe(cm)
    expect(fracOf(300)).toBe(0)
    expect(fracOf(50)).toBe(1)
  })
  it('snaps to whole inches for an inch profile, stored in cm', () => {
    const cm = cmAt(0.42, 'in')
    expect(shownHeight(cm, 'in')).toBe(70)
    expect(cm).toBe(177.8)
    expect(snapCm(178.3)).toBe(178)
  })
})
