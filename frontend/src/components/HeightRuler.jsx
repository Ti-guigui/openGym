import { useRef, useState } from 'react'
import { cmAt, fracOf, shownHeight } from '../lib/height-ruler.js'

// The height ruler beside the measurements figure (Ti Guigui FIT): a marker at the profile's
// height, with the value beside it. Slide a finger along the ruler to move it (saved when the
// finger lifts); a plain tap opens the height sheet, with − and + for the exact value. The arrow
// keys move it a step at a time. The scale itself is lib/height-ruler.js (220 cm at the top,
// 120 cm at the bottom, one tick every 2 cm).
const TICKS = Array.from({ length: 51 }, (_, i) => <line key={i} x1="0" x2={i % 10 === 0 ? 20 : i % 5 === 0 ? 13 : 7} y1={i * 2} y2={i * 2} />)
const SLIDE_PX = 4

/** cm: the stored height (null when unknown); unit: 'cm' or 'in'; label: "Height (cm)". */
export default function HeightRuler({ cm, unit = 'cm', label, onOpen, onSet }) {
  const box = useRef(null)
  const press = useRef(null)
  const [live, setLive] = useState(null)
  const at = e => {
    const r = box.current.getBoundingClientRect()
    return cmAt((e.clientY - r.top) / r.height, unit)
  }
  const down = e => {
    press.current = { y: e.clientY, sliding: false }
    e.currentTarget.setPointerCapture?.(e.pointerId)
  }
  const move = e => {
    const p = press.current
    if (!p) return
    if (!p.sliding && Math.abs(e.clientY - p.y) < SLIDE_PX) return
    p.sliding = true
    setLive(at(e))
  }
  const up = e => {
    const p = press.current
    press.current = null
    if (!p) return
    if (p.sliding) { const v = at(e); setLive(null); onSet(v) } else onOpen()
  }
  const cancel = () => { press.current = null; setLive(null) }
  const key = e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onOpen() }
    const step = unit === 'in' ? 2.54 : 1
    if ((e.key === 'ArrowUp' || e.key === 'ArrowDown') && cm) { e.preventDefault(); onSet(cmAt(fracOf(cm + (e.key === 'ArrowUp' ? step : -step)), unit)) }
  }
  const shown = live ?? (Number(cm) > 0 ? Number(cm) : null)
  const text = shown != null ? shownHeight(shown, unit) + ' ' + unit : null
  return <div ref={box} className={'mfig-ruler' + (live != null ? ' sliding' : '')} role="button" tabIndex={0}
    aria-label={label + (text ? ' ' + text : '')}
    onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={cancel} onKeyDown={key}>
    <svg viewBox="0 0 20 100" preserveAspectRatio="none" aria-hidden="true">{TICKS}</svg>
    {shown != null && <span className="ruler-mark" style={{ top: fracOf(shown) * 100 + '%' }} aria-hidden="true">
      <span className="ruler-tag">{text}</span>
    </span>}
  </div>
}
