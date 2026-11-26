import { t } from '../lib/i18n.js'
import Icon from './Icon.jsx'

// The body weight beside the measurements figure (Ti Guigui FIT, components/MeasureFigure.jsx): a
// card with the last weigh-in and a pencil, and the bathroom scale from the owner's picture
// (public/balance.webp) showing that same weight on its own display. Either one opens the weigh-in.
//
// The display is a slanted rectangle in the picture (520 × 310 px): its centre, the angle of its
// long edge and the slant of its short one, so the figures sit on it like a print.
export const LCD = { x: 312.5, y: 72, rotate: 22, skew: -40, size: 30 }

/** weight: already formatted (null when there is no weigh-in); unit: 'kg' or 'lb'. */
export default function ScaleCard({ weight, unit, onWeight }) {
  return <div className="scale">
    <button type="button" className="scale-card" onClick={onWeight} aria-label={t('Log a weigh-in')}>
      <span className="scale-i" aria-hidden="true"><Icon name="scale" /></span>
      <span className="scale-m">
        <span className="scale-l">{t('Weight')}</span>
        <span className="scale-v">{weight != null ? <>{weight}<small> {unit}</small></> : '–'}</span>
      </span>
      <Icon name="pencil" className="scale-edit" />
    </button>
    <button type="button" className="scale-pic" onClick={onWeight} tabIndex={-1} aria-hidden="true">
      <svg viewBox="0 0 520 310">
        <image href="balance.webp" x="0" y="0" width="520" height="310" />
        {weight != null && <text className="scale-lcd" textAnchor="middle" dominantBaseline="central" fontSize={LCD.size}
          transform={`translate(${LCD.x} ${LCD.y}) rotate(${LCD.rotate}) skewX(${LCD.skew})`}>{weight}</text>}
      </svg>
    </button>
  </div>
}
