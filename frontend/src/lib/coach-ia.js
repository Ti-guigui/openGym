// Ti Guigui FIT's AI coach (views/CoachIA.jsx, server in functions/api/[[path]].js): the summary of
// the person's data sent with each question, and the conversation kept on this device. Plain text,
// a few hundred words at most: no name, no account id, only what helps the answer.
import { nutritionOf, dailyTarget, kgOf, weeklyBurn, weekGoalOf } from './nutrition.js'
import { sexOf, ageOf } from './strength-level.js'
import { enabledMeasurementFields, latestMeasurement, lengthUnitOf, toMeasurementDisplay } from './measurements.js'
import { isoOf } from './format.js'

const GOAL = { lose: 'perdre du poids', keep: 'maintenir son poids', gain: 'prendre du muscle' }
const r1 = v => Math.round(v * 10) / 10

/**
 * The summary. `nameOf(id)` gives an exercise's name (the view passes the app's translated one);
 * `now` is for tests.
 */
export function coachContext(S, { nameOf = id => id, now = new Date() } = {}) {
  const lines = []
  const unit = S?.unit === 'lb' ? 'lb' : 'kg'
  const bw = Array.isArray(S?.bodyweight) ? S.bodyweight : []
  const last = bw.at(-1)
  const sex = sexOf(S), age = ageOf(S, now.getFullYear())
  const cm = Number(S?.heightCm) > 0 ? Number(S.heightCm) : null
  lines.push('Profil : ' + [sex ? (sex === 'female' ? 'femme' : 'homme') : 'sexe non renseigné', age ? age + ' ans' : 'âge non renseigné', cm ? cm + ' cm' : 'taille non renseignée'].join(', '))
  if (last && Number(last.w) > 0) {
    const when = b => Number(b.t) || Date.parse((b.d || '') + 'T12:00:00') || 0
    const month = bw.filter(b => when(b) >= now.getTime() - 30 * 86400000)
    const first = month[0]
    const trend = first && first !== last ? ` (${Number(last.w) - Number(first.w) >= 0 ? '+' : ''}${r1(Number(last.w) - Number(first.w))} ${unit} en 30 jours)` : ''
    lines.push(`Poids actuel : ${r1(Number(last.w))} ${unit}${trend}`)
  } else lines.push('Poids : aucune pesée')
  if (Number(S?.targetW) > 0) lines.push(`Poids visé : ${r1(Number(S.targetW))} ${unit}`)
  const n = nutritionOf(S)
  lines.push(`Objectif : ${GOAL[n.goal]}${n.goal !== 'keep' ? `, ${n.rate} kg par semaine` : ''}, activité ${n.activity}`)
  const kg = last && Number(last.w) > 0 ? kgOf(S, last.w) : null
  const target = kg && cm && age ? dailyTarget({ kg, cm, age, sex: sex || 'male', activity: n.activity, goal: n.goal, rate: n.rate }) : null
  if (target) lines.push(`Calories conseillées par l'appli : ${target.target} kcal/jour (maintien ${target.maintenance}, écart ${target.change} kcal/jour), protéines ${target.protein} g, glucides ${target.carbs} g, lipides ${target.fat} g`)
  const burn = weeklyBurn(S, 4, now)
  const goal = weekGoalOf(S)
  lines.push('Dépense active des séances, 4 dernières semaines : ' + burn.map(b => `${b.kcal} kcal (${b.sessions} séance${b.sessions > 1 ? 's' : ''})`).join(', ') + (goal ? `; objectif ${goal} kcal/semaine` : ''))
  const lu = lengthUnitOf(S)
  const meas = enabledMeasurementFields(S || {}).filter(f => !f.custom && !f.pair).map(f => {
    const l = latestMeasurement(S, f.key)
    return l ? `${f.label} ${r1(toMeasurementDisplay(l.value, lu, f))}${f.kind === 'percent' ? ' %' : ' ' + lu} (${l.entry.d})` : null
  }).filter(Boolean)
  if (meas.length) lines.push('Mensurations récentes : ' + meas.join(', '))
  const workouts = (Array.isArray(S?.workouts) ? S.workouts : []).filter(w => Number(w?.start) > 0)
    .sort((a, b) => b.start - a.start).slice(0, 6)
  if (workouts.length) {
    lines.push('Dernières séances :')
    for (const w of workouts) {
      const min = Number(w.end) > w.start ? Math.round((w.end - w.start) / 60000) : null
      const ex = (w.entries || []).map(e => {
        const sets = (e.sets || []).filter(s => s && (s.done || s.r || s.min) && !s.warmup)
        const top = sets.reduce((b, s) => (Number(s.w) > Number(b?.w || -1) ? s : b), null)
        return nameOf(e.id) + (sets.length ? ` ${sets.length}×` + (top && Number(top.w) > 0 ? ` (max ${top.w} ${unit} × ${top.r || '?'})` : '') : '')
      }).slice(0, 8)
      lines.push(`- ${isoOf(new Date(w.start))}${min ? `, ${min} min` : ''} : ${ex.join(', ') || 'sans exercice noté'}`)
    }
  } else lines.push('Aucune séance enregistrée')
  return lines.join('\n').slice(0, 8000)
}

/* ---- the conversation, on this device only ---- */
export const CHAT_KEY = 'tgf:coach-ia'
export const CHAT_KEEP = 40
export function loadChat(storage = globalThis.localStorage) {
  try {
    const list = JSON.parse(storage?.getItem(CHAT_KEY) || '[]')
    return Array.isArray(list) ? list.filter(m => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string').slice(-CHAT_KEEP) : []
  } catch { return [] }
}
export function saveChat(list, storage = globalThis.localStorage) {
  try { storage?.setItem(CHAT_KEY, JSON.stringify(list.slice(-CHAT_KEEP))) } catch { /* private mode, full */ }
}
