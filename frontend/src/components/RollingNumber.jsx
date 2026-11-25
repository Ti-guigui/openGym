import { useEffect, useRef, useState } from 'react'
import { fmtNum } from '../lib/format.js'
import { tweenAt } from '../lib/tween.js'

// A figure that rolls to its new value when it changes (Ti Guigui FIT), instead of jumping: the
// one motion of the screen it sits on. Nothing moves when the phone asks for reduced motion, and a
// screen reader only ever reads the final value.
const reduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

export default function RollingNumber({ value, ms = 450, step = 1, format = fmtNum }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    const start = from.current
    from.current = value
    if (start === value || reduced() || typeof requestAnimationFrame !== 'function') { setShown(value); return }
    const t0 = performance.now()
    let raf = requestAnimationFrame(function tick(now) {
      const v = tweenAt(start, value, now - t0, ms, step)
      setShown(v)
      if (v !== value) raf = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(raf)
  }, [value, ms, step])
  return <span className="roll-n"><span aria-hidden="true">{format(shown)}</span><span className="vh">{format(value)}</span></span>
}
