// A number moving from one value to the next (Ti Guigui FIT, components/RollingNumber.jsx): the
// value at time `t` of a tween of `ms`, eased out, rounded to `step`. Pure, so it is tested.

/** Cubic ease-out: fast at first, settling at the end. 0 → 0, 1 → 1. */
export const easeOut = x => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3)

/** The shown value `elapsed` ms into a tween from `from` to `to` lasting `ms`. */
export function tweenAt(from, to, elapsed, ms = 450, step = 1) {
  if (!(ms > 0) || elapsed >= ms || from === to) return to
  const v = from + (to - from) * easeOut(elapsed / ms)
  return Math.round(v / step) * step
}
