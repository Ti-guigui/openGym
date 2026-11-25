import { describe, it, expect } from 'vitest'
import { SPOTS, PHOTO, COLOR, onFigure } from './MeasureFigure.jsx'
import { MEASUREMENT_FIELDS } from '../lib/measurements.js'

describe('figure spots', () => {
  it('has a place for every circumference, on both bodies', () => {
    const circ = MEASUREMENT_FIELDS.filter(f => !f.kind).map(f => f.key)
    for (const k of circ) {
      expect(onFigure(k)).toBe(true)
      expect(SPOTS.female[k]).toBeTruthy()
      expect(PHOTO.spots[k]).toBeTruthy()
    }
    expect(onFigure('bodyFat')).toBe(false)
  })
})

describe('figure colours', () => {
  it('match the picture: arms violet, torso green, legs yellow', () => {
    expect(COLOR('upperArmRight')).toBe('violet')
    expect(COLOR('forearmLeft')).toBe('violet')
    expect(COLOR('chest')).toBe('green')
    expect(COLOR('shoulders')).toBe('green')
    expect(COLOR('calfRight')).toBe('yellow')
  })
})
