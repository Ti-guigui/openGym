// Supplements (Ti Guigui FIT): which ones you take, ticked off day by day, with a streak each.
//
//   S.suppList = ['creatine', 'whey']                      the ones on the card, a plain setting
//   S.supps    = { '2026-11-21': { ids: ['creatine'], _ts }, … }   what was taken, per day
//
// S.supps is stored per day like S.water (lib/water.js): each day carries its own edit time, so
// two devices that each ticked a different day keep both (lib/sync-merge.js mergeStampedMap).
import { isoOf } from './format.js'

// shortcut: a fixed list of common supplements, add custom names if people ask for them.
/** Labels are English source strings, translated where they are shown. */
export const SUPPS = [
  { id: 'creatine', label: 'Creatine' },
  { id: 'whey', label: 'Whey' },
  { id: 'vitd', label: 'Vitamin D' },
  { id: 'omega3', label: 'Omega-3' },
  { id: 'magnesium', label: 'Magnesium' },
  { id: 'multi', label: 'Multivitamin' },
]
const KNOWN = new Set(SUPPS.map(s => s.id))
const isMap = v => !!v && typeof v === 'object' && !Array.isArray(v)
const clean = ids => (Array.isArray(ids) ? [...new Set(ids.filter(id => KNOWN.has(id)))] : [])

/** The supplements on the card, in the order of SUPPS, unknown ids left out. */
export const suppListOf = S => { const on = new Set(clean(S?.suppList)); return SUPPS.filter(s => on.has(s.id)).map(s => s.id) }

/** The ids taken on `iso`, as a Set. */
export const takenOn = (S, iso) => new Set(clean(isMap(S?.supps) && isMap(S.supps[iso]) ? S.supps[iso].ids : null))

/** S.supps with `id` ticked or unticked on `iso`, stamped `now`. */
export function withToggled(S, iso, id, now = Date.now()) {
  const taken = takenOn(S, iso)
  if (taken.has(id)) taken.delete(id); else if (KNOWN.has(id)) taken.add(id)
  return { ...(isMap(S?.supps) ? S.supps : {}), [iso]: { ids: SUPPS.filter(s => taken.has(s.id)).map(s => s.id), _ts: now } }
}

const dayBefore = iso => { const [y, m, d] = iso.split('-').map(Number); return isoOf(new Date(y, m - 1, d - 1)) }

/**
 * Days in a row `id` was taken, up to `today`. Not taken yet today does not break the run: it is
 * counted from yesterday, so the streak still shows in the morning before the first scoop.
 */
export function suppStreak(S, id, today) {
  let iso = takenOn(S, today).has(id) ? today : dayBefore(today)
  let n = 0
  while (n < 3660 && takenOn(S, iso).has(id)) { n++; iso = dayBefore(iso) }
  return n
}
