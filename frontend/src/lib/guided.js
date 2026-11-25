// The guided workout (Ti Guigui FIT, components/GuidedPlayer.jsx): the running session walked one
// set at a time, like a watch does. Which set is up comes from here, pure and tested; ticking it,
// the holds and the rests are the workout screen's own (views/Workout.jsx toggle, startTimed), so
// records, rest times and the finish behave exactly as in the list.
import { supersetUnits } from './history.js'
import { isWarmupRow } from './workout-model.js'

const key = p => p.idx + ':' + p.i

/**
 * Every set in the order it is done: exercise by exercise, and a superset round by round
 * (A1 B1 A2 B2...), as the workout screen moves through them.
 */
export function guidedOrder(entries) {
  const list = Array.isArray(entries) ? entries : []
  const out = []
  for (const unit of supersetUnits(list)) {
    const rounds = Math.max(0, ...unit.map(idx => list[idx]?.sets?.length || 0))
    for (let i = 0; i < rounds; i++) for (const idx of unit) if (list[idx]?.sets?.[i]) out.push({ idx, i })
  }
  return out
}

/** The set up now: the first not done and not skipped; when only skipped ones are left, those. */
export function guidedNow(entries, skipped = []) {
  const order = guidedOrder(entries).filter(p => !entries[p.idx].sets[p.i].done)
  const skip = new Set(skipped)
  return order.find(p => !skip.has(key(p))) || order[0] || null
}

/** The set after `pos` that is still to do (for "Up next"), or null. */
export function guidedAfter(entries, pos, skipped = []) {
  if (!pos) return null
  const order = guidedOrder(entries)
  const at = order.findIndex(p => p.idx === pos.idx && p.i === pos.i)
  const skip = new Set(skipped)
  const rest = order.slice(at + 1).concat(order.slice(0, Math.max(0, at)))
    .filter(p => !entries[p.idx].sets[p.i].done)
  return rest.find(p => !skip.has(key(p))) || rest[0] || null
}

/** Where `pos` sits: set n of the exercise's sets, exercise n of the session, and the totals. */
export function guidedWhere(entries, pos) {
  const order = guidedOrder(entries)
  const done = order.filter(p => entries[p.idx].sets[p.i].done).length
  if (!pos) return { done, total: order.length }
  const sets = entries[pos.idx].sets
  const warm = isWarmupRow(sets[pos.i])
  const work = sets.filter(s => !isWarmupRow(s))
  const setNo = warm ? sets.slice(0, pos.i + 1).filter(isWarmupRow).length : sets.slice(0, pos.i + 1).filter(s => !isWarmupRow(s)).length
  const units = supersetUnits(entries)
  const unitNo = units.findIndex(u => u.includes(pos.idx)) + 1
  return { done, total: order.length, warm, setNo, setOf: warm ? sets.length - work.length : work.length, unitNo, units: units.length }
}

export const guidedKey = key
