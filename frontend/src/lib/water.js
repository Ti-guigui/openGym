// Water (Ti Guigui FIT): glasses drunk per day, on a Home card.
//
// Stored per day, the way a day note is (lib/day-notes.js):
//
//   S.water = { '2026-11-21': { n: 5, _ts }, … }
//
// Each day carries the time it was last written, so two devices that each logged a different day
// keep both, and the same day keeps the later count (lib/sync-merge.js mergeStampedMap). Going back
// to zero is a stamped entry too, never a deleted key, or the other device's copy would bring it back.

export const GLASS_ML = 250
// shortcut: fixed goal of 8 glasses (2 L), add a setting if people want their own.
export const WATER_GOAL = 8
export const WATER_MAX = 30

const isMap = v => !!v && typeof v === 'object' && !Array.isArray(v)

/** Glasses logged on `iso`: a whole number from 0 to WATER_MAX, whatever junk is stored. */
export function waterOf(S, iso) {
  const e = isMap(S?.water) ? S.water[iso] : null
  const n = isMap(e) ? Math.floor(Number(e.n)) : 0
  return Number.isFinite(n) ? Math.min(Math.max(n, 0), WATER_MAX) : 0
}

/** S.water with `iso` set to `n` glasses (clamped), stamped `now`. */
export function withWater(map, iso, n, now = Date.now()) {
  const v = Math.min(Math.max(Math.floor(Number(n)) || 0, 0), WATER_MAX)
  return { ...(isMap(map) ? map : {}), [iso]: { n: v, _ts: now } }
}
