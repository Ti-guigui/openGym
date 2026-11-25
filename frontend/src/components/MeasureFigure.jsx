import { useEffect, useState } from 'react'
import { t } from '../lib/i18n.js'
import { fmtNum } from '../lib/format.js'
import Icon from './Icon.jsx'

// Body measurements on a figure (Ti Guigui FIT, views/Measurements.jsx). A male profile gets the
// illustrated man (public/mensurations-homme.webp, the owner's own picture, the brand logo on the
// shorts painted out), whose coloured circles and tape lines are part of the picture: the spots sit
// exactly on them and only the ones it lacks are drawn. A female profile gets the body of the
// muscle maps (lib/body-geometry.js) drawn plain, with every spot drawn. Beside it, the list: a dot
// of the same colour, the name and the latest value.
// A tap picks it for the chart below; one never logged opens the log. In `choosing` mode every
// circumference shows and a tap switches it on or off (Measurements → choose on the figure).
//
// Facing us, the person's left side is on our right. Spots are in each view's own viewBox.
// The illustrated man, in the picture's own pixels (448 × 1072). `p`: the circle is in the picture.
export const PHOTO = {
  src: 'mensurations-homme.webp', vb: [0, 0, 448, 1072],
  spots: {
    neck: { x: 20, y: 165, side: 'l', p: 1 },
    shoulders: { x: 20, y: 224, side: 'l', p: 1 },
    chest: { x: 20, y: 294, side: 'l', p: 1 },
    upperArmRight: { x: 20, y: 349, side: 'l', p: 1 },
    forearmRight: { x: 20, y: 404, side: 'l', p: 1 },
    waist: { x: 139, y: 382, side: 'l', p: 1 },
    hips: { x: 116, y: 449, side: 'l', p: 1 },
    wristRight: { x: 64, y: 530, side: 'l' },
    thighRight: { x: 65, y: 604, side: 'l', p: 1 },
    calfRight: { x: 65, y: 790, side: 'l', p: 1 },
    ankleRight: { x: 158, y: 960, side: 'l' },
    upperArmLeft: { x: 353, y: 350, side: 'r' },
    forearmLeft: { x: 420, y: 404, side: 'r', p: 1 },
    abdomen: { x: 208, y: 415, side: 'r' },
    wristLeft: { x: 373, y: 530, side: 'r' },
    thighLeft: { x: 369, y: 604, side: 'r', p: 1 },
    calfLeft: { x: 369, y: 790, side: 'r', p: 1 },
    ankleLeft: { x: 283, y: 960, side: 'r' },
  },
}

export const SPOTS = {
  male: {
    neck: { x: 363, y: 268, side: 'l' },
    shoulders: { x: 205, y: 330, tape: [205, 525], side: 'l' },
    chest: { x: 258, y: 385, tape: [258, 470], side: 'l' },
    upperArmRight: { x: 205, y: 405, side: 'l' },
    forearmRight: { x: 160, y: 525, side: 'l' },
    wristRight: { x: 135, y: 595, side: 'l' },
    thighRight: { x: 285, y: 790, side: 'l' },
    calfRight: { x: 282, y: 1060, side: 'l' },
    ankleRight: { x: 290, y: 1215, side: 'l' },
    upperArmLeft: { x: 522, y: 405, side: 'r' },
    forearmLeft: { x: 567, y: 525, side: 'r' },
    wristLeft: { x: 592, y: 595, side: 'r' },
    abdomen: { x: 410, y: 545, side: 'r' },
    waist: { x: 458, y: 600, tape: [270, 458], side: 'r' },
    hips: { x: 480, y: 690, tape: [245, 480], side: 'r' },
    thighLeft: { x: 442, y: 790, side: 'r' },
    calfLeft: { x: 445, y: 1060, side: 'r' },
    ankleLeft: { x: 437, y: 1215, side: 'r' },
  },
  female: {
    neck: { x: 320, y: 280, side: 'l' },
    shoulders: { x: 178, y: 330, tape: [178, 470], side: 'l' },
    chest: { x: 218, y: 380, tape: [218, 422], side: 'l' },
    upperArmRight: { x: 180, y: 430, side: 'l' },
    forearmRight: { x: 135, y: 570, side: 'l' },
    wristRight: { x: 85, y: 640, side: 'l' },
    thighRight: { x: 240, y: 800, side: 'l' },
    calfRight: { x: 255, y: 1150, side: 'l' },
    ankleRight: { x: 262, y: 1290, side: 'l' },
    upperArmLeft: { x: 460, y: 430, side: 'r' },
    forearmLeft: { x: 510, y: 570, side: 'r' },
    wristLeft: { x: 560, y: 640, side: 'r' },
    abdomen: { x: 360, y: 520, side: 'r' },
    waist: { x: 395, y: 560, tape: [245, 395], side: 'r' },
    hips: { x: 435, y: 660, tape: [210, 435], side: 'r' },
    thighLeft: { x: 405, y: 800, side: 'r' },
    calfLeft: { x: 385, y: 1150, side: 'r' },
    ankleLeft: { x: 378, y: 1290, side: 'r' },
  },
}
// The picture's own colours: arms violet, torso green, legs yellow.
const VIOLET = new Set(['upperArmRight', 'upperArmLeft', 'forearmRight', 'forearmLeft', 'wristRight', 'wristLeft'])
const YELLOW = new Set(['thighRight', 'thighLeft', 'calfRight', 'calfLeft', 'ankleRight', 'ankleLeft'])
export const COLOR = key => (VIOLET.has(key) ? 'violet' : YELLOW.has(key) ? 'yellow' : 'green')
/** Whether a measurement key has a place on the figure. */
export const onFigure = key => !!SPOTS.male[key] && !!PHOTO.spots[key]

let GEO = null
function useGeometry() {
  const [geo, setGeo] = useState(GEO)
  useEffect(() => {
    if (GEO) return
    let alive = true
    import('../lib/body-geometry.js').then(m => { GEO = m.default; if (alive) setGeo(GEO) }).catch(() => {})
    return () => { alive = false }
  }, [])
  return geo
}

const spotsFor = body => (body !== 'female' ? PHOTO.spots : SPOTS.female)
/** The keys that have a spot, top to bottom as on the body: the order a quick fill walks through. */
export function figureOrder(keys, body) {
  const s = spotsFor(body)
  return keys.filter(k => s[k]).sort((a, b) => s[a].y - s[b].y || (s[a].side === 'l' ? -1 : 1))
}

// The ruler's graduation beside the body: a long tick every 10, a middle one every 5.
const TICKS = Array.from({ length: 51 }, (_, i) => <line key={i} x1="0" x2={i % 10 === 0 ? 20 : i % 5 === 0 ? 13 : 7} y1={i * 2} y2={i * 2} />)

/**
 * fields: [{ key, label, on? }] in display order; values: { [key]: number | null } in display
 * units; unit: the length unit; selected: the key the chart shows; body: 'male' | 'female';
 * choosing: every field shows, `on` says which are tracked; onPick(key, hasValue).
 * stats (optional): { height, heightLabel, onHeight, weight, weightLabel, onWeight }: the ruler
 * beside the body and the scale under it, each a value already formatted (null when unknown).
 */
export default function MeasureFigure({ fields, values, unit, selected, onPick, body, choosing = false, stats = null }) {
  const photo = body !== 'female'
  const geo = useGeometry()
  const view = photo ? null : geo?.female?.front
  const spots = spotsFor(body)
  const shown = figureOrder(fields.map(f => f.key), body).map(k => fields.find(f => f.key === k))
  if (!shown.length) return null
  const [vx, vy, vw, vh] = photo ? PHOTO.vb : (view?.vb || '0 0 650 1450').split(' ').map(Number)
  const k = photo ? 0.45 : 1
  const pick = f => onPick(f.key, values[f.key] != null)
  return <div className="mfig">
    <div className={'mfig-fig' + (stats ? ' with-ruler' : '')}>
    {stats && <button type="button" className="mfig-ruler" onClick={stats.onHeight} aria-label={stats.heightLabel + (stats.height ? ' ' + stats.height : '')}>
      <svg viewBox="0 0 20 100" preserveAspectRatio="none" aria-hidden="true">{TICKS}</svg>
    </button>}
    <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} className="mfig-svg" aria-hidden="true">
      {photo && <image href={PHOTO.src} x={vx} y={vy} width={vw} height={vh} className="mfig-photo" preserveAspectRatio="xMidYMid meet" />}
      {view && <g className="mfig-body">{Object.values(view.p).flat().map((d, i) => <path key={i} d={d} />)}</g>}
      {shown.map(f => {
        const s = spots[f.key]
        const on = f.key === selected && !choosing
        const off = choosing && !f.on
        return <g key={f.key} className={'mfig-spot c-' + COLOR(f.key) + (on ? ' on' : '') + (off ? ' off' : '') + (s.p ? ' painted' : '')}
          style={{ '--k': k }} onClick={() => pick(f)}>
          {s.tape && <line x1={s.tape[0]} y1={s.y} x2={s.tape[1]} y2={s.y} className="mfig-tape" />}
          {s.p ? <circle cx={s.x} cy={s.y} r={22} className={'mfig-ring' + (on ? ' on' : '')} />
            : <circle cx={s.x} cy={s.y} r={(on ? 17 : 13) * k} />}
          {/* a bigger invisible target for a finger */}
          <circle cx={s.x} cy={s.y} r={34 * (photo ? 1 : 2.2)} className="mfig-hit" />
        </g>
      })}
    </svg>
    </div>
    <div className="mfig-list">
      {shown.map(f => {
        const v = values[f.key]
        const has = v != null
        const off = choosing && !f.on
        return <button key={f.key} type="button"
          className={'mfig-row c-' + COLOR(f.key) + (f.key === selected && !choosing ? ' on' : '') + (has ? '' : ' empty') + (off ? ' off' : '') + (choosing && f.on ? ' picked' : '')}
          aria-pressed={choosing ? !!f.on : f.key === selected} onClick={() => pick(f)}>
          <span className="mfig-dot" aria-hidden="true">{choosing && f.on ? <Icon name="check" /> : null}</span>
          <span className="mfig-n">{t(f.label)}</span>
          <span className="mfig-v">{choosing ? null : has ? <>{fmtNum(v)}<small> {unit}</small></> : <Icon name="plus" />}</span>
        </button>
      })}
    </div>
    {stats && <div className="mfig-stats">
      <button type="button" className="mfig-stat" onClick={stats.onHeight}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="2" width="8" height="20" rx="1.5" /><path d="M8 6h4M8 10h3M8 14h4M8 18h3" /></svg>
        <span className="mfig-n">{stats.heightLabel}</span>
        <span className="mfig-v">{stats.height ?? <Icon name="plus" />}</span>
      </button>
      {/* A bathroom scale seen from above: the weight on its screen, the two foot pads below. */}
      <button type="button" className="mfig-scale" onClick={stats.onWeight} aria-label={stats.weightLabel + (stats.weight ? ' ' + stats.weight : '')}>
        <svg viewBox="0 0 160 84" aria-hidden="true">
          <rect className="sc-body" x="3" y="3" width="154" height="78" rx="20" />
          <rect className="sc-lcd" x="44" y="10" width="72" height="26" rx="6" />
          <text className="sc-val" x="80" y="29" textAnchor="middle">{stats.weight ?? '+'}</text>
          <rect className="sc-pad" x="18" y="42" width="52" height="32" rx="12" />
          <rect className="sc-pad" x="90" y="42" width="52" height="32" rx="12" />
          <path className="sc-grip" d="M28 52h32M28 58h32M28 64h32M100 52h32M100 58h32M100 64h32" />
        </svg>
        <span className="mfig-n">{stats.weightLabel}</span>
      </button>
    </div>}
  </div>
}
