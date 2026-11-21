// The app's own name in this fork. The source strings (and every locale pack keyed by them) still
// say "openGym"; brandName() swaps the name in at display time, so the packs stay untouched and
// upstream merges stay easy. URLs and package ids (opengym.ch, github.com/.../openGym,
// ch.opengym.app) are left alone, and so is anything about the exercise media licence: that
// mention stays exactly as Gym visual granted it (NOTICE.md).
// The test run keeps the upstream name (vite.config.js sets VITE_APP_NAME there), so the
// upstream suite still checks every string; brand.test.js checks the swap itself.
export const APP_NAME = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_APP_NAME) || 'Ti Guigui FIT'

// No lookbehind: the app still runs on Safari 15.5 (vite.config.js build target).
const NAME = /(^|[^\w./-])openGym(?![\w/-]|\.\w)/g
const LICENCE = /gym ?visual|gymvisual|licen[cs]/i

/** `s` with the upstream name replaced by APP_NAME; anything that is not a string as it is. */
export function brandName(s, name = APP_NAME) {
  if (typeof s !== 'string' || name === 'openGym' || !s.includes('openGym') || LICENCE.test(s)) return s
  // "an openGym backup" reads "a Ti Guigui FIT backup".
  const article = /^[aeiou]/i.test(name) ? null : /\b([Aa])n openGym(?![\w/-]|\.\w)/g
  if (article) s = s.replace(article, (m, a) => a + ' openGym')
  return s.replace(NAME, (m, before) => before + name)
}
