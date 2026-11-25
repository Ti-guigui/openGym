import { useEffect, useState } from 'react'
import { t } from '../lib/i18n.js'
import { fmtNum } from '../lib/format.js'
import { placeLabels } from '../lib/measure-figure.js'

// Body measurements on the app's anatomical figure (Ti Guigui FIT, views/Measurements.jsx): the
// body of the muscle maps (lib/body-geometry.js, male or female as the profile says), drawn plain,
// with a dot where the tape goes for each circumference and its latest value at the side.
// A tap picks it for the chart below; one never logged opens the log. In `choosing` mode every
// circumference shows and a tap switches it on or off (Measurements → choose on the figure).
//
// Facing us, the person's left side is on our right. Spots are in each view's own viewBox.
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
const COLOR = key => (/Arm|forearm|wrist/i.test(key) ? 'violet' : /thigh|calf|ankle/i.test(key) ? 'yellow' : 'green')
/** Whether a measurement key has a place on the figure. */
export const onFigure = key => !!SPOTS.male[key]

// The figure is 55 % of the width; each label column 22.5 %.
const FIG_SHARE = 0.55, COL_SHARE = 0.225

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

/**
 * fields: [{ key, label, on? }] in display order; values: { [key]: number | null } in display
 * units; unit: the length unit; selected: the key the chart shows; body: 'male' | 'female';
 * choosing: every field shows, `on` says which are tracked; onPick(key, hasValue).
 */
export default function MeasureFigure({ fields, values, unit, selected, onPick, body, choosing = false }) {
  const geo = useGeometry()
  const sex = body === 'female' ? 'female' : 'male'
  const view = geo?.[sex]?.front
  const spots = SPOTS[sex]
  const shown = fields.filter(f => spots[f.key])
  if (!shown.length) return null
  const [vx, vy, vw, vh] = (view?.vb || (sex === 'female' ? '0 0 650 1450' : '0 95 727 1280')).split(' ').map(Number)
  const W = vw / FIG_SHARE
  const x0 = vx - (W - vw) / 2
  const colL = x0 + W * COL_SHARE, colR = x0 + W * (1 - COL_SHARE)
  const gap = vh * 0.1
  const ly = placeLabels(shown.map(f => ({ key: f.key, side: spots[f.key].side, y: spots[f.key].y })), { top: vy + gap / 2, bottom: vy + vh - gap / 2, gap })
  return <div className="mfig" style={{ aspectRatio: `${W} / ${vh}` }}>
    <svg viewBox={`${x0} ${vy} ${W} ${vh}`} className="mfig-svg" aria-hidden="true">
      {view && <g className="mfig-body">{Object.values(view.p).flat().map((d, i) => <path key={i} d={d} />)}</g>}
      {shown.map(f => {
        const s = spots[f.key]
        const on = f.key === selected && !choosing
        const off = choosing && !f.on
        const end = s.side === 'l' ? colL : colR
        const y = ly[f.key]
        return <g key={f.key} className={'mfig-spot c-' + COLOR(f.key) + (on ? ' on' : '') + (off ? ' off' : '')}>
          {s.tape && <line x1={s.tape[0]} y1={s.y} x2={s.tape[1]} y2={s.y} className="mfig-tape" />}
          <polyline points={`${end},${y} ${s.side === 'l' ? end + 25 : end - 25},${y} ${s.x},${s.y}`} className="mfig-lead" />
          <circle cx={s.x} cy={s.y} r={on ? 17 : 13} />
        </g>
      })}
    </svg>
    {shown.map(f => {
      const s = spots[f.key]
      const v = values[f.key]
      const has = v != null
      const off = choosing && !f.on
      return <button key={f.key} type="button"
        className={'mfig-lbl ' + s.side + ' c-' + COLOR(f.key) + (f.key === selected && !choosing ? ' on' : '') + (has ? '' : ' empty') + (off ? ' off' : '') + (choosing && f.on ? ' picked' : '')}
        style={{ top: ((ly[f.key] - vy) / vh * 100) + '%' }}
        aria-pressed={choosing ? !!f.on : f.key === selected} onClick={() => onPick(f.key, has)}>
        <span className="mfig-n">{t(f.label)}</span>
        <span className="mfig-v">{choosing ? (f.on ? '✓' : '+') : has ? <>{fmtNum(v)} <small>{unit}</small></> : '+'}</span>
      </button>
    })}
  </div>
}
