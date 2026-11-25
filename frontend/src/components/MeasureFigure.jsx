import { t } from '../lib/i18n.js'
import { fmtNum } from '../lib/format.js'

// Body measurements on a figure (Ti Guigui FIT, views/Measurements.jsx): each tracked
// circumference is a dot where the tape goes, with its latest value at the side. A tap picks it
// for the chart below; one never logged opens the log. The figure is a plain drawing made for the
// app (rounded shapes), the same for everyone: it marks places, it does not show a body type.
//
// Coordinates are in the 320 × 440 viewBox; labels sit in the left or right column at `ly`.
// Facing us, the person's left side is on our right.
export const SPOTS = {
  neck: { x: 160, y: 74, side: 'l', ly: 62, color: 'green' },
  shoulders: { x: 112, y: 98, side: 'l', ly: 94, w: 96, color: 'green' },
  chest: { x: 128, y: 126, side: 'l', ly: 126, w: 64, color: 'green' },
  upperArmRight: { x: 92, y: 140, side: 'l', ly: 158, color: 'violet' },
  waist: { x: 136, y: 182, side: 'l', ly: 190, w: 48, color: 'green' },
  forearmRight: { x: 80, y: 190, side: 'l', ly: 222, color: 'violet' },
  hips: { x: 130, y: 222, side: 'l', ly: 254, w: 60, color: 'green' },
  thighRight: { x: 140, y: 270, side: 'l', ly: 300, color: 'yellow' },
  calfRight: { x: 141, y: 352, side: 'l', ly: 356, color: 'yellow' },
  upperArmLeft: { x: 228, y: 140, side: 'r', ly: 140, color: 'violet' },
  forearmLeft: { x: 240, y: 190, side: 'r', ly: 196, color: 'violet' },
  thighLeft: { x: 180, y: 270, side: 'r', ly: 270, color: 'yellow' },
  calfLeft: { x: 179, y: 352, side: 'r', ly: 352, color: 'yellow' },
  abdomen: { x: 160, y: 200, side: 'r', ly: 230, w: 0, color: 'green' },
}

const COL_L = 70, COL_R = 250

/**
 * fields: [{ key, label }] the tracked ones; values: { [key]: number | null } in display units;
 * unit: the length unit shown; selected: the key the chart shows; onPick(key, hasValue).
 */
export default function MeasureFigure({ fields, values, unit, selected, onPick }) {
  const spots = fields.filter(f => SPOTS[f.key])
  if (!spots.length) return null
  return <div className="mfig">
    <svg viewBox="0 0 320 440" className="mfig-svg" aria-hidden="true">
      <g className="mfig-body">
        <ellipse cx="160" cy="40" rx="22" ry="26" />
        <rect x="148" y="60" width="24" height="22" rx="8" />
        <path d="M104 92 Q160 78 216 92 Q232 96 234 112 L226 150 Q216 170 206 186 Q202 206 210 230 L212 244 Q160 252 108 244 L110 230 Q118 206 114 186 Q104 170 94 150 L86 112 Q88 96 104 92Z" />
        <rect x="80" y="100" width="26" height="74" rx="13" transform="rotate(10 93 100)" />
        <rect x="214" y="100" width="26" height="74" rx="13" transform="rotate(-10 227 100)" />
        <rect x="64" y="166" width="22" height="72" rx="11" transform="rotate(8 75 166)" />
        <rect x="234" y="166" width="22" height="72" rx="11" transform="rotate(-8 245 166)" />
        <rect x="112" y="236" width="44" height="92" rx="20" />
        <rect x="164" y="236" width="44" height="92" rx="20" />
        <rect x="120" y="320" width="34" height="86" rx="16" />
        <rect x="166" y="320" width="34" height="86" rx="16" />
        <ellipse cx="136" cy="414" rx="20" ry="9" />
        <ellipse cx="184" cy="414" rx="20" ry="9" />
      </g>
      {spots.map(f => {
        const s = SPOTS[f.key]
        const on = f.key === selected
        const end = s.side === 'l' ? COL_L : COL_R
        return <g key={f.key} className={'mfig-spot c-' + s.color + (on ? ' on' : '')}>
          {s.w > 0 && <line x1={s.x} y1={s.y} x2={s.x + s.w} y2={s.y} className="mfig-tape" />}
          <polyline points={`${end},${s.ly} ${s.side === 'l' ? end + 10 : end - 10},${s.ly} ${s.x},${s.y}`} className="mfig-lead" />
          <circle cx={s.x} cy={s.y} r={on ? 6 : 4.5} />
        </g>
      })}
    </svg>
    {spots.map(f => {
      const s = SPOTS[f.key]
      const v = values[f.key]
      const has = v != null
      return <button key={f.key} type="button" className={'mfig-lbl ' + s.side + ' c-' + SPOTS[f.key].color + (f.key === selected ? ' on' : '') + (has ? '' : ' empty')}
        style={{ top: (s.ly / 440 * 100) + '%' }} aria-pressed={f.key === selected} onClick={() => onPick(f.key, has)}>
        <span className="mfig-n">{t(f.label)}</span>
        <span className="mfig-v">{has ? <>{fmtNum(v)} <small>{unit}</small></> : '+'}</span>
      </button>
    })}
  </div>
}
