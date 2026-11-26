import { t } from '../lib/i18n.js'
import { fmtNum } from '../lib/format.js'
import Icon from './Icon.jsx'
import ScaleCard from './ScaleCard.jsx'

// Body measurements on a figure (Ti Guigui FIT, views/Measurements.jsx). A male profile gets the
// illustrated man (public/mensurations-homme.webp, the owner's own picture, the brand logo on the
// shorts painted out), whose coloured circles and tape lines are part of the picture: the spots sit
// exactly on them and only the ones it lacks are drawn. A female profile gets the illustrated
// woman (public/mensurations-femme.webp, made with Gemini from the man, its rulers cropped out since
// the app draws its own), the same way. Beside it, the list: a dot
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

// The illustrated woman, in the picture's own pixels (484 × 1072).
export const PHOTO_FEMALE = {
  src: 'mensurations-femme.webp', vb: [0, 0, 484, 1072],
  spots: {
    neck: { x: 33, y: 212, side: 'l', p: 1 },
    shoulders: { x: 33, y: 269, side: 'l', p: 1 },
    chest: { x: 33, y: 344, side: 'l', p: 1 },
    upperArmRight: { x: 33, y: 400, side: 'l', p: 1 },
    forearmRight: { x: 33, y: 456, side: 'l', p: 1 },
    waist: { x: 156, y: 433, side: 'l', p: 1 },
    abdomen: { x: 133, y: 500, side: 'l', p: 1 },
    hips: { x: 138, y: 542, side: 'l' },
    wristRight: { x: 76, y: 582, side: 'l' },
    thighRight: { x: 81, y: 655, side: 'l', p: 1 },
    calfRight: { x: 81, y: 835, side: 'l', p: 1 },
    ankleRight: { x: 183, y: 975, side: 'l' },
    upperArmLeft: { x: 366, y: 400, side: 'r' },
    forearmLeft: { x: 451, y: 456, side: 'r', p: 1 },
    wristLeft: { x: 396, y: 582, side: 'r' },
    thighLeft: { x: 389, y: 655, side: 'r', p: 1 },
    calfLeft: { x: 389, y: 835, side: 'r', p: 1 },
    ankleLeft: { x: 291, y: 975, side: 'r' },
  },
}
/** The picture for a profile: the woman for 'female', the man otherwise. */
export const photoFor = body => (body === 'female' ? PHOTO_FEMALE : PHOTO)

// The picture's own colours: arms violet, torso green, legs yellow.
const VIOLET = new Set(['upperArmRight', 'upperArmLeft', 'forearmRight', 'forearmLeft', 'wristRight', 'wristLeft'])
const YELLOW = new Set(['thighRight', 'thighLeft', 'calfRight', 'calfLeft', 'ankleRight', 'ankleLeft'])
export const COLOR = key => (VIOLET.has(key) ? 'violet' : YELLOW.has(key) ? 'yellow' : 'green')
/** Whether a measurement key has a place on the figure. */
export const onFigure = key => !!PHOTO.spots[key] && !!PHOTO_FEMALE.spots[key]

const spotsFor = body => photoFor(body).spots
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
 * stats (optional): { height, heightLabel, onHeight, weight, weightUnit, weightLabel, onWeight }: the ruler
 * beside the body (and its row under it) and the weight card with the scale under the body, each a
 * value already formatted (null when unknown); weightUnit is 'kg' or 'lb'.
 */
export default function MeasureFigure({ fields, values, unit, selected, onPick, body, choosing = false, stats = null }) {
  const ph = photoFor(body)
  const spots = spotsFor(body)
  const shown = figureOrder(fields.map(f => f.key), body).map(k => fields.find(f => f.key === k))
  if (!shown.length) return null
  const [vx, vy, vw, vh] = ph.vb
  const k = 0.45
  const pick = f => onPick(f.key, values[f.key] != null)
  return <div className="mfig">
    {/* The left column: the figure, and under it the weight card and the scale (Ti Guigui FIT),
        so the list beside it stays short. */}
    <div className="mfig-left">
    <div className={'mfig-fig' + (stats ? ' with-ruler' : '')}>
    {stats && <button type="button" className="mfig-ruler" onClick={stats.onHeight} aria-label={stats.heightLabel + (stats.height ? ' ' + stats.height : '')}>
      <svg viewBox="0 0 20 100" preserveAspectRatio="none" aria-hidden="true">{TICKS}</svg>
    </button>}
    <svg viewBox={`${vx} ${vy} ${vw} ${vh}`} className="mfig-svg" aria-hidden="true">
      <image href={ph.src} x={vx} y={vy} width={vw} height={vh} className="mfig-photo" preserveAspectRatio="xMidYMid meet" />
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
          <circle cx={s.x} cy={s.y} r={34} className="mfig-hit" />
        </g>
      })}
    </svg>
    </div>
    {stats && <ScaleCard weight={stats.weight} unit={stats.weightUnit} onWeight={stats.onWeight} />}
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
    </div>}
  </div>
}
