// Nutrition (Ti Guigui FIT): the daily calorie target for a goal (lose, keep or gain weight at a
// chosen weekly rate), its macros, when the goal weight should be reached, and the energy the
// logged workouts burned week by week. Pure helpers; views/Nutrition.jsx draws them.
//
// Settings live in S.nutrition = { goal, rate, activity } (a plain setting, synced whole) and
// S.kcalWeekGoal (active kcal a week from workouts, null = off). The goal weight is the one the
// weight card already keeps (S.targetW, in the profile's unit).
import { bmrMifflin, ACTIVITY, LB_PER_KG } from './calculators.js'
import { activeKcal, bodyKgFor } from './active-energy.js'
import { weekKey, weekStartOf, isoOf } from './format.js'

/** One kilogram of body fat is worth about 7,700 kcal (the usual rule of thumb). */
export const KCAL_PER_KG = 7700
export const GOALS = ['lose', 'keep', 'gain']
/** Weekly rates offered, kg a week (a lb profile shows the same choices converted). */
export const RATES = [0.25, 0.5, 0.75, 1]
export const DEFAULT_NUTRITION = { goal: 'lose', rate: 0.5, activity: 'moderate' }
/** Never suggest eating under this, whatever the maths says (common minimum for adults). */
export const FLOOR_KCAL = { male: 1500, female: 1200 }

export function nutritionOf(S) {
  const n = S?.nutrition && typeof S.nutrition === 'object' ? S.nutrition : {}
  return {
    goal: GOALS.includes(n.goal) ? n.goal : DEFAULT_NUTRITION.goal,
    rate: RATES.includes(Number(n.rate)) ? Number(n.rate) : DEFAULT_NUTRITION.rate,
    activity: ACTIVITY[n.activity] ? n.activity : DEFAULT_NUTRITION.activity,
  }
}

const r10 = v => Math.round(v / 10) * 10

/**
 * The day's target. Maintenance = Mifflin-St Jeor × activity factor. Losing takes rate × 7,700 / 7
 * kcal off a day, gaining adds half of that (a lean gain builds slower than fat goes). The target
 * never drops under the floor for the sex nor under the resting rate: `limited` says it was held.
 * Macros: protein 2 g/kg when losing (1.8 otherwise), fat 0.9 g/kg, carbs the rest (at least 0).
 */
export function dailyTarget({ kg, cm, age, sex = 'male', activity = 'moderate', goal = 'lose', rate = 0.5 } = {}) {
  const bmr = bmrMifflin(kg, cm, age, sex)
  if (bmr == null || bmr <= 0) return null
  const maintenance = bmr * (ACTIVITY[activity] || ACTIVITY.moderate)
  const perDay = rate * KCAL_PER_KG / 7
  let change = goal === 'lose' ? -perDay : goal === 'gain' ? perDay / 2 : 0
  const floor = Math.max(FLOOR_KCAL[sex] || FLOOR_KCAL.male, bmr)
  let target = maintenance + change
  let limited = false
  if (goal === 'lose' && target < floor) { target = Math.min(floor, maintenance); change = target - maintenance; limited = true }
  target = r10(target)
  const protein = Math.round(kg * (goal === 'lose' ? 2 : 1.8))
  const fat = Math.round(kg * 0.9)
  const carbs = Math.max(0, Math.round((target - protein * 4 - fat * 9) / 4))
  return { bmr: r10(bmr), maintenance: r10(maintenance), target, change: r10(change), limited, protein, fat, carbs }
}

/**
 * Weeks to go from `now` to `goalKg` at `rate` kg a week, by the real daily change (a held target
 * goes slower than the rate asked). null when there is nothing to reach or the direction is wrong.
 */
export function weeksToGoal(nowKg, goalKg, dailyChangeKcal) {
  const diff = Number(goalKg) - Number(nowKg)
  const perWeek = Number(dailyChangeKcal) * 7 / KCAL_PER_KG
  if (!(Number(nowKg) > 0) || !(Number(goalKg) > 0) || !perWeek || !diff) return null
  if (Math.sign(diff) !== Math.sign(perWeek)) return null
  return Math.ceil(diff / perWeek)
}

/** The date `weeks` from `now`, as an ISO day. */
export const dateInWeeks = (weeks, now = new Date()) => {
  const d = new Date(now)
  d.setDate(d.getDate() + weeks * 7)
  return isoOf(d)
}

/** Body weight in kg from the profile's unit. */
export const kgOf = (S, v) => (S?.unit === 'lb' ? Number(v) / LB_PER_KG : Number(v))

/**
 * Active kcal burned by the workouts of the last `weeks` weeks, oldest first:
 * [{ week: 'YYYY-MM-DD' (its first day), kcal, sessions }]. The current week is last.
 */
export function weeklyBurn(S, weeks = 6, now = new Date()) {
  const ws = weekStartOf(S)
  const keys = []
  const d = new Date(now)
  for (let i = 0; i < weeks; i++) { keys.unshift(weekKey(isoOf(d), ws)); d.setDate(d.getDate() - 7) }
  const out = new Map(keys.map(k => [k, { week: k, kcal: 0, sessions: 0 }]))
  for (const w of Array.isArray(S?.workouts) ? S.workouts : []) {
    const start = Number(w?.start)
    if (!(start > 0)) continue
    const row = out.get(weekKey(isoOf(new Date(start)), ws))
    if (!row) continue
    const kcal = activeKcal(w, bodyKgFor(S, w))
    if (kcal == null) continue
    row.kcal += kcal
    row.sessions++
  }
  return [...out.values()]
}

export const KCAL_WEEK_MIN = 100
export const KCAL_WEEK_MAX = 10000
export const clampWeekGoal = v => {
  const v0 = Number(v)
  if (!Number.isFinite(v0) || v0 <= 0) return null
  return Math.min(KCAL_WEEK_MAX, Math.max(KCAL_WEEK_MIN, Math.round(v0 / 50) * 50))
}
/** The weekly burn goal (S.kcalWeekGoal), or null when none is set. */
export const weekGoalOf = S => (S?.kcalWeekGoal == null ? null : clampWeekGoal(S.kcalWeekGoal))
