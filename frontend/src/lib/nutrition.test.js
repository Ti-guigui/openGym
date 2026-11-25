import { describe, it, expect } from 'vitest'
import { dailyTarget, weeksToGoal, nutritionOf, weeklyBurn, clampWeekGoal, weekGoalOf, KCAL_PER_KG, FLOOR_KCAL } from './nutrition.js'

const man = { kg: 85, cm: 180, age: 30, sex: 'male', activity: 'moderate' }

describe('dailyTarget', () => {
  it('takes rate × 7700 / 7 off maintenance to lose', () => {
    const r = dailyTarget({ ...man, goal: 'lose', rate: 0.5 })
    // BMR 10×85 + 6.25×180 − 5×30 + 5 = 1830, × 1.55 = 2836.5
    expect(r.maintenance).toBe(2840)
    expect(r.change).toBe(-550)
    expect(r.target).toBe(2290)
    expect(r.limited).toBe(false)
  })
  it('adds half the rate to gain, nothing to keep', () => {
    expect(dailyTarget({ ...man, goal: 'gain', rate: 0.5 }).target).toBe(3110)
    expect(dailyTarget({ ...man, goal: 'keep', rate: 1 }).target).toBe(2840)
  })
  it('never goes under the floor or the resting rate', () => {
    const r = dailyTarget({ kg: 55, cm: 160, age: 40, sex: 'female', activity: 'sedentary', goal: 'lose', rate: 1 })
    expect(r.limited).toBe(true)
    expect(r.target).toBeGreaterThanOrEqual(FLOOR_KCAL.female)
    expect(r.target).toBeGreaterThanOrEqual(r.bmr - 10)
  })
  it('splits macros: protein and fat by weight, carbs the rest', () => {
    const r = dailyTarget({ ...man, goal: 'lose', rate: 0.5 })
    expect(r.protein).toBe(170)
    expect(r.fat).toBe(77)
    expect(r.carbs).toBe(Math.round((2290 - 170 * 4 - 77 * 9) / 4))
  })
  it('needs height, weight and age', () => {
    expect(dailyTarget({ kg: 80, cm: 0, age: 30 })).toBe(null)
  })
})

describe('weeksToGoal', () => {
  it('counts the weeks at the daily change', () => {
    expect(weeksToGoal(85, 80, -550)).toBe(Math.ceil(5 / (550 * 7 / KCAL_PER_KG)))
  })
  it('is null in the wrong direction or with nothing to reach', () => {
    expect(weeksToGoal(85, 90, -550)).toBe(null)
    expect(weeksToGoal(85, 85, -550)).toBe(null)
    expect(weeksToGoal(85, 80, 0)).toBe(null)
  })
})

describe('settings', () => {
  it('defaults and cleans the nutrition setting', () => {
    expect(nutritionOf({})).toEqual({ goal: 'lose', rate: 0.5, activity: 'moderate' })
    expect(nutritionOf({ nutrition: { goal: 'gain', rate: 0.25, activity: 'very' } })).toEqual({ goal: 'gain', rate: 0.25, activity: 'very' })
    expect(nutritionOf({ nutrition: { goal: 'x', rate: 9, activity: 'y' } })).toEqual({ goal: 'lose', rate: 0.5, activity: 'moderate' })
  })
  it('rounds and bounds the weekly goal', () => {
    expect(clampWeekGoal(1234)).toBe(1250)
    expect(clampWeekGoal(10)).toBe(100)
    expect(clampWeekGoal(99999)).toBe(10000)
    expect(clampWeekGoal(0)).toBe(null)
    expect(weekGoalOf({})).toBe(null)
    expect(weekGoalOf({ kcalWeekGoal: 1200 })).toBe(1200)
  })
})

describe('weeklyBurn', () => {
  it('adds each workout to its week, current week last', () => {
    const now = new Date('2026-11-25T12:00:00') // a Wednesday
    const at = (iso, h) => new Date(iso + 'T10:00:00').getTime() + h * 3600e3
    const done = { sets: [{ w: 50, r: 10, done: true }] }
    const w = (iso, hours) => ({ start: at(iso, 0), end: at(iso, hours), bw: 80, entries: [{ id: '0025', ...done }] })
    const S = { unit: 'kg', workouts: [w('2026-11-24', 1), w('2026-11-17', 1), w('2026-11-18', 0.5), w('2026-09-01', 1)] }
    const rows = weeklyBurn(S, 3, now)
    expect(rows.map(r => r.week)).toEqual(['2026-11-09', '2026-11-16', '2026-11-23'])
    expect(rows[0].kcal).toBe(0)
    expect(rows[1].sessions).toBe(2)
    expect(rows[2].sessions).toBe(1)
    expect(rows[2].kcal).toBeGreaterThan(0)
  })
})
