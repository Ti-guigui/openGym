// A motivating line of the day on Home (Ti Guigui FIT). Our own lines, not famous quotes, so
// nothing to attribute or license. English source strings, translated where they are shown.
// The same line all day, on every device: it is picked from the date alone.

export const QUOTES = [
  'The hardest part is showing up. You already know the way.',
  'Small plates add up. So do small wins.',
  "You don't have to feel like it. You just have to start.",
  'Strong is built one rep at a time.',
  'Rest is part of the plan, not a break from it.',
  'Compare yourself to last month, not to the person next to you.',
  'A short workout beats the one you skipped.',
  'Progress likes boring: the same lifts, a little more each week.',
  'Your future self is watching. Give them a reason to thank you.',
  'Good form today, heavier weights tomorrow.',
  'Motivation comes and goes. Habits stay.',
  'Every set you log is proof you showed up.',
  'Slow progress is still progress.',
  'Drink water, eat protein, sleep. Then do it again.',
  'The bar is honest: it only moves when you push it.',
  'Ten minutes is enough to keep the streak alive.',
  'Breathe, brace, lift. One rep at a time.',
  "Be proud of the days you trained when you didn't want to.",
  'Consistency beats intensity.',
  "Today's effort is next month's warm-up.",
]

/** The index of the line for `iso` (YYYY-MM-DD): one step a day, the whole list before a repeat. */
export function quoteIndex(iso) {
  const [y, m, d] = String(iso || '').split('-').map(Number)
  const day = Math.floor(Date.UTC(y, m - 1, d) / 86400000)
  if (!Number.isFinite(day)) return 0
  return ((day % QUOTES.length) + QUOTES.length) % QUOTES.length
}

/** The line for `iso`, as its English source string. */
export const quoteOf = iso => QUOTES[quoteIndex(iso)]
