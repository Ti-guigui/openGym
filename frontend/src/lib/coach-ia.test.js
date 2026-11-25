import { describe, it, expect } from 'vitest'
import { coachContext, loadChat, saveChat, CHAT_KEEP } from './coach-ia.js'

const now = new Date('2026-11-25T12:00:00')
const day = iso => new Date(iso + 'T10:00:00').getTime()

describe('coachContext', () => {
  it('says what is missing on an empty profile', () => {
    const txt = coachContext({ bodyweight: [], workouts: [], measurements: [] }, { now })
    expect(txt).toMatch(/aucune pesée/)
    expect(txt).toMatch(/Aucune séance/)
    expect(txt).toMatch(/perdre du poids/)
  })
  it('sums up the profile, target, trend, measurements and recent workouts', () => {
    const S = {
      unit: 'kg', sex: 'male', birthYear: 1996, heightCm: 180, targetW: 80,
      nutrition: { goal: 'lose', rate: 0.5, activity: 'moderate' },
      bodyweight: [{ d: '2026-11-01', w: 86, t: day('2026-11-01') }, { d: '2026-11-24', w: 85, t: day('2026-11-24') }],
      measurements: [{ d: '2026-11-20', waist: 90 }],
      workouts: [{ start: day('2026-11-24'), end: day('2026-11-24') + 3600e3, entries: [{ id: '0025', sets: [{ w: 60, r: 8, done: true }, { w: 70, r: 5, done: true }] }] }],
    }
    const txt = coachContext(S, { nameOf: () => 'Développé couché', now })
    expect(txt).toMatch(/homme, 30 ans, 180 cm/)
    expect(txt).toMatch(/Poids actuel : 85 kg \(-1 kg en 30 jours\)/)
    expect(txt).toMatch(/Poids visé : 80 kg/)
    expect(txt).toMatch(/kcal\/jour/)
    expect(txt).toMatch(/Waist 90 cm/)
    expect(txt).toMatch(/2026-11-24, 60 min : Développé couché 2× \(max 70 kg × 5\)/)
  })
})

describe('chat storage', () => {
  it('round-trips and keeps the last messages', () => {
    const store = new Map()
    const storage = { getItem: k => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) }
    saveChat(Array.from({ length: 50 }, (_, i) => ({ role: 'user', content: 'm' + i })), storage)
    const back = loadChat(storage)
    expect(back.length).toBe(CHAT_KEEP)
    expect(back.at(-1).content).toBe('m49')
  })
  it('survives a broken or missing storage', () => {
    expect(loadChat({ getItem: () => '{bad' })).toEqual([])
    expect(loadChat({ getItem: () => { throw new Error('blocked') } })).toEqual([])
    expect(() => saveChat([], { setItem: () => { throw new Error('full') } })).not.toThrow()
  })
})
