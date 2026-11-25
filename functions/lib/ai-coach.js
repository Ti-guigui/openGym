// Ti Guigui FIT's AI coach on Cloudflare Pages (functions/api/[[path]].js, /api/ai/*): the request
// to the Claude Messages API and the reading of its answer, kept apart so they can be tested
// (api/test/ai-coach.test.js). Plain fetch, like api/coach/core/adapters/anthropic.js: no SDK, no
// new dependency. The key is the Pages secret ANTHROPIC_API_KEY; the model can be changed with
// the AI_MODEL variable (claude-haiku-5-5 costs far less), the daily cap with AI_DAILY.

export const API_URL = 'https://api.anthropic.com/v1/messages'
export const API_VERSION = '2026-10-21'
export const DEFAULT_MODEL = 'claude-opus-5-5'
export const DEFAULT_DAILY = 20
export const MAX_TURNS = 20
export const MAX_MESSAGE = 2000
export const MAX_CONTEXT = 8000

export const SYSTEM = `Tu es le coach sportif et nutrition de l'appli Ti Guigui FIT, une appli de musculation.
Tu réponds dans la langue de la personne (le français par défaut), en tutoyant, de façon courte, concrète et bienveillante.
Tu t'appuies sur ses données (profil, objectif, calories, poids, mensurations, dernières séances) fournies plus bas : cite-les quand elles comptent, et dis-le quand une donnée manque au lieu d'inventer.
Tu peux proposer des séances, des idées de repas, des ajustements de calories ou de macros, et expliquer les exercices.
Sécurité : tu n'es pas médecin. Pas de diagnostic, pas de médicament. Pour une douleur, une blessure, un malaise, une grossesse, un trouble alimentaire ou une maladie, tu conseilles d'en parler à un professionnel de santé. Jamais de régime sous 1 200 kcal (femme) ou 1 500 kcal (homme) sans suivi médical, jamais plus d'environ 1 % du poids perdu par semaine.
Mise en forme : paragraphes courts, listes à puces si utile, pas de tableaux, pas de titres.`

/**
 * The messages, cleaned: user and assistant turns only, strings, each cut to MAX_MESSAGE, the last
 * MAX_TURNS, starting with a user turn and ending with one. null when nothing usable is left.
 */
export function cleanMessages(raw) {
  if (!Array.isArray(raw)) return null
  let list = raw
    .filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map(m => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE) }))
    .slice(-MAX_TURNS)
  // Two turns of the same role in a row are merged, so the roles alternate.
  list = list.reduce((out, m) => {
    const last = out.at(-1)
    if (last && last.role === m.role) last.content += '\n\n' + m.content
    else out.push({ ...m })
    return out
  }, [])
  while (list.length && list[0].role !== 'user') list.shift()
  if (!list.length || list.at(-1).role !== 'user') return null
  return list
}

/** The Messages API request body. The rules are cached; the person's data follows them. */
export function requestBody({ messages, context, model = DEFAULT_MODEL }) {
  const ctx = typeof context === 'string' ? context.slice(0, MAX_CONTEXT) : ''
  return {
    model,
    max_tokens: 4000,
    system: [
      { type: 'text', text: SYSTEM, cache_control: { type: 'ephemeral' } },
      ...(ctx ? [{ type: 'text', text: 'Données de la personne :\n' + ctx }] : [])
    ],
    messages,
    // A chat answer, not a research task: low effort keeps it quick and cheap.
    output_config: { effort: 'low' },
    // If the model declines, the API retries on a model it picks for that case.
    fallbacks: 'default'
  }
}

export const requestHeaders = key => ({
  'Content-Type': 'application/json',
  'x-api-key': key,
  'anthropic-version': API_VERSION,
  'anthropic-beta': 'server-side-fallback-2026-07-01'
})

/** { text } from a Messages API answer, or { error } (a short code the app explains). */
export function readReply(data) {
  if (!data || typeof data !== 'object') return { error: 'bad-reply' }
  if (data.stop_reason === 'refusal') return { error: 'refused' }
  const text = (Array.isArray(data.content) ? data.content : [])
    .filter(b => b && b.type === 'text' && typeof b.text === 'string').map(b => b.text).join('').trim()
  if (!text) return { error: 'bad-reply' }
  return { text, truncated: data.stop_reason === 'max_tokens' }
}

/** The daily cap from AI_DAILY (1 to 500), else DEFAULT_DAILY. */
export const dailyCap = v => {
  const n = Math.round(Number(v))
  return n >= 1 && n <= 500 ? n : DEFAULT_DAILY
}
