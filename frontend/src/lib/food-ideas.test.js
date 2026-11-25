import { describe, it, expect } from 'vitest'
import { MEALS, SLOTS, FOOD_GROUPS, mealIdeas, dayPlan, pick } from './food-ideas.js'

describe('food ideas', () => {
  it('has French and English for every text', () => {
    for (const m of MEALS) for (const k of ['name', 'what']) { expect(m[k].fr).toBeTruthy(); expect(m[k].en).toBeTruthy() }
    for (const g of FOOD_GROUPS) for (const f of g.foods) { expect(f.fr).toBeTruthy(); expect(f.en).toBeTruthy(); expect(f.kcal).toBeGreaterThan(0) }
    expect(new Set(MEALS.map(m => m.id)).size).toBe(MEALS.length)
  })
  it('has ideas for every slot', () => {
    for (const s of SLOTS) expect(mealIdeas(s, 2000).length).toBe(2)
  })
  it('puts the closest to the slot share first', () => {
    const [first] = mealIdeas('lunch', 2000) // aim 700
    const others = MEALS.filter(m => m.slot === 'lunch')
    expect(Math.abs(first.kcal - 700)).toBe(Math.min(...others.map(m => Math.abs(m.kcal - 700))))
  })
  it('rotates with the seed', () => {
    expect(mealIdeas('dinner', 2000, 0)[0].id).not.toBe(mealIdeas('dinner', 2000, 1)[0].id)
    expect(mealIdeas('dinner', 2000, 5)[0].id).toBe(mealIdeas('dinner', 2000, 0)[0].id)
  })
  it('builds a day with one idea per slot', () => {
    const d = dayPlan(2200)
    expect(d.meals.map(m => m.slot)).toEqual(SLOTS)
    expect(d.kcal).toBe(d.meals.reduce((a, m) => a + m.kcal, 0))
  })
  it('falls back to English outside French', () => {
    expect(pick({ fr: 'Bonjour', en: 'Hello' })).toBe('Hello')
    expect(pick('plain')).toBe('plain')
  })
})
