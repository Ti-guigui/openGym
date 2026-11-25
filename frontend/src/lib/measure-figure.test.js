import { describe, it, expect } from 'vitest'
import { placeLabels } from './measure-figure.js'
import { SPOTS, onFigure } from '../components/MeasureFigure.jsx'
import { MEASUREMENT_FIELDS } from './measurements.js'

describe('placeLabels', () => {
  const opts = { top: 0, bottom: 1000, gap: 100 }
  it('keeps a label at its spot when there is room', () => {
    expect(placeLabels([{ key: 'a', side: 'l', y: 300 }, { key: 'b', side: 'r', y: 310 }], opts)).toEqual({ a: 300, b: 310 })
  })
  it('pushes crowded labels apart, never overlapping', () => {
    const p = placeLabels([{ key: 'a', side: 'l', y: 300 }, { key: 'b', side: 'l', y: 320 }, { key: 'c', side: 'l', y: 330 }], opts)
    expect(p).toEqual({ a: 300, b: 400, c: 500 })
  })
  it('pulls them back up from the bottom edge', () => {
    const p = placeLabels([{ key: 'a', side: 'l', y: 950 }, { key: 'b', side: 'l', y: 990 }], opts)
    expect(p).toEqual({ a: 900, b: 1000 })
  })
  it('spreads them evenly when too many for one side', () => {
    const many = Array.from({ length: 21 }, (_, i) => ({ key: 'k' + i, side: 'r', y: 500 }))
    const p = placeLabels(many, opts)
    expect(p.k0).toBe(0)
    expect(p.k20).toBe(1000)
  })
})

describe('figure spots', () => {
  it('has a place for every circumference, on both bodies', () => {
    const circ = MEASUREMENT_FIELDS.filter(f => !f.kind).map(f => f.key)
    for (const k of circ) {
      expect(onFigure(k)).toBe(true)
      expect(SPOTS.female[k]).toBeTruthy()
    }
    expect(onFigure('bodyFat')).toBe(false)
  })
})
