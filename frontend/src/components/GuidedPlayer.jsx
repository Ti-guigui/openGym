import { useEffect, useRef, useState } from 'react'
import { useStore } from '../store/useStore.js'
import { useUI } from '../store/useUI.js'
import { t } from '../lib/i18n.js'
import { exOr } from '../lib/exercises.js'
import { exerciseNameText, fmtNum } from '../lib/format.js'
import { modeOf, setLabel } from '../lib/history.js'
import { speedUnitOf } from '../lib/speed.js'
import { fmtClock } from '../lib/circuit-copy.js'
import { useWakeLock } from '../lib/wakelock.js'
import { setOverlayBack } from '../lib/back.js'
import { guidedNow, guidedAfter, guidedWhere, guidedKey } from '../lib/guided.js'
import Media from './Media.jsx'
import Icon from './Icon.jsx'
import { Button } from './ui.jsx'

// The guided workout (Ti Guigui FIT): the running session one set at a time, full screen, the way
// a watch runs it. The exercise's animation (3D where there is one), then either the reps and the
// weight to do with a big Done, or the countdown of a timed set; then the rest, counted down, with
// what comes next. Which set is up is lib/guided.js; ticking it (`toggle`), a hold (`startTimed`)
// and the rest are the workout screen's own, so records, rests and the finish work as in the list.
// The look is the circuit player's (index.css .cp-*). Closing it goes back to the list; the
// session, the clock and the rest keep running.

const nameOf = id => exerciseNameText(exOr(id))

function Ring({ frac, phase }) {
  const R = 46, C = 2 * Math.PI * R
  return <svg className="cp-ring" viewBox="0 0 100 100" aria-hidden="true">
    <circle cx="50" cy="50" r={R} className="cp-ring-bg" />
    {frac != null && <circle cx="50" cy="50" r={R} className={'cp-ring-fg ' + phase}
      strokeDasharray={C} strokeDashoffset={C * (1 - Math.max(0, Math.min(1, frac)))} />}
  </svg>
}

function Clock({ word, left, total, phase, sub }) {
  return <div className="cp-clock gp-clock" role="timer" aria-live="off">
    <Ring frac={total > 0 ? Math.max(0, left) / total : null} phase={phase} />
    <div className="cp-clock-in">
      <span className="cp-word">{word}</span>
      <span className="cp-time cp-num">{left < 0 ? '+' + fmtClock(-left) : fmtClock(left)}</span>
      {sub && <span className="cp-cap">{sub}</span>}
    </div>
  </div>
}

export default function GuidedPlayer({ toggle, startTimed, close }) {
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const A = S.active
  const timer = useUI(s => s.timer)
  const work = useUI(s => s.work)
  const countIn = useUI(s => s.countIn)
  const [skipped, setSkipped] = useState([])
  const box = useRef(null)
  useWakeLock(true)
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    setOverlayBack(() => { close(); return true })
    box.current?.focus?.()
    return () => { window.removeEventListener('keydown', onKey); setOverlayBack(null) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
  if (!A) return null

  const entries = A.entries || []
  const pos = guidedNow(entries, skipped)
  const where = guidedWhere(entries, pos)
  const unit = S.unit === 'lb' ? 'lb' : 'kg'
  const speedUnit = speedUnitOf(S)
  const resting = !!timer && !timer.ready
  const holding = !!work
  const counting = !!countIn && !holding

  const top = <div className="cp-top">
    <button type="button" className="iconbtn" aria-label={t('Back to the list')} onClick={close}><Icon name="chevronDown" /></button>
    <span className="cp-top-t">{t('{0} sets', where.done + '/' + where.total)}</span>
    <span />
  </div>
  const bar = <div className="wprog gp-prog"><i style={{ width: (where.total ? where.done / where.total * 100 : 0) + '%' }} /></div>

  // Everything ticked: the finish sheet is up (the workout screen opened it); this says so.
  if (!pos) {
    return <div ref={box} className="cp-screen gp" role="dialog" aria-modal="true" aria-label={t('Guided workout')} tabIndex={-1}>
      <div className="cp-body cp-result">
        {top}{bar}
        <div className="cp-result-ico" aria-hidden="true"><Icon name="checkCircle" /></div>
        <h2 className="cp-ready-h">{t('Every set is done')}</h2>
        <Button variant="primary" onClick={close}>{t('Back to the workout')}</Button>
      </div>
    </div>
  }

  const e = entries[pos.idx]
  const row = e.sets[pos.i]
  const cfg = { ...(e.target || {}), id: e.id }
  const mode = modeOf(cfg)
  const ex = exOr(e.id)
  const next = guidedAfter(entries, pos, skipped)
  const nextLine = next ? nameOf(entries[next.idx].id) + ' · ' + setLabel(entries[next.idx].id, entries[next.idx].sets[next.i], entries[next.idx].target, speedUnit) : null
  const setRow = patch => update(s => { const r = s.active?.entries?.[pos.idx]?.sets?.[pos.i]; if (r) Object.assign(r, patch) })
  const step = unit === 'lb' ? 5 : 2.5
  const kicker = (where.warm ? t('Warm-up {0} / {1}', where.setNo, where.setOf) : t('Set {0} / {1}', where.setNo, where.setOf))
    + ' · ' + t('Exercise {0} / {1}', where.unitNo, where.units)

  // The rest, counted down, with the set coming up.
  if (resting) {
    const ui = useUI.getState()
    return <div ref={box} className="cp-screen gp" role="dialog" aria-modal="true" aria-label={t('Guided workout')} tabIndex={-1}>
      <div className="cp-body cp-run is-rest">
        {top}{bar}
        <Clock word={timer.paused ? t('Paused') : t('Rest')} left={timer.left ?? 0} total={timer.total} phase="rest" />
        <section className="cp-station">
          <span className="cp-kicker">{t('Up next')}</span>
          {ex && <div className="cp-media gp-media-sm"><Media ex={ex} compact /></div>}
          <h2 className="cp-name">{nameOf(e.id)}</h2>
          <span className="cp-target">{kicker}</span>
          <span className="cp-target">{setLabel(e.id, row, e.target, speedUnit)}</span>
        </section>
        <div className="cp-ctrl">
          {timer.paused
            ? <button type="button" className="cp-side" onClick={() => ui.resumeRest()}><Icon name="play" /><span>{t('Resume')}</span></button>
            : <button type="button" className="cp-side" onClick={() => ui.pauseRest()}><Icon name="pause" /><span>{t('Pause')}</span></button>}
          <button type="button" className="cp-main" onClick={() => ui.skipRest()}><Icon name="skipForward" /><span>{t('Skip rest')}</span></button>
          <button type="button" className="cp-side" onClick={() => ui.addRest(15)}><Icon name="plus" /><span>{t('+15 s')}</span></button>
        </div>
      </div>
    </div>
  }

  // A timed set being held (or its 3-2-1): the countdown, big.
  if (holding || counting) {
    const ui = useUI.getState()
    const live = holding ? work : countIn
    return <div ref={box} className="cp-screen gp" role="dialog" aria-modal="true" aria-label={t('Guided workout')} tabIndex={-1}>
      <div className={'cp-body cp-run ' + (counting ? 'is-prep' : 'is-work')}>
        {top}{bar}
        <Clock word={live.paused ? t('Paused') : counting ? t('Get ready') : t('Hold')} left={live.left ?? 0} total={live.total} phase={counting ? 'prep' : 'work'} />
        <section className="cp-station">
          {ex && <div className="cp-media gp-media-sm"><Media ex={ex} compact /></div>}
          <h2 className="cp-name">{nameOf(e.id)}</h2>
          <span className="cp-target">{kicker}</span>
        </section>
        <div className="cp-ctrl">
          {holding ? (work.paused
            ? <button type="button" className="cp-side" onClick={() => ui.resumeWork()}><Icon name="play" /><span>{t('Resume')}</span></button>
            : <button type="button" className="cp-side" onClick={() => ui.pauseWork()}><Icon name="pause" /><span>{t('Pause')}</span></button>)
            : <span />}
          <button type="button" className="cp-main" onClick={() => (holding ? ui.finishWorkEarly() : ui.goNow())}>
            <Icon name={holding ? 'check' : 'play'} /><span>{holding ? t('Done') : t('Go now')}</span></button>
          <span />
        </div>
      </div>
    </div>
  }

  // The set to do: the animation, then the reps and weight (or the time), and Done.
  const timed = mode === 'time'
  const go = () => (timed ? startTimed(pos.idx, pos.i) : toggle(pos.idx, pos.i))
  const skip = () => setSkipped(list => [...list.filter(k => k !== guidedKey(pos)), guidedKey(pos)])
  return <div ref={box} className="cp-screen gp" role="dialog" aria-modal="true" aria-label={t('Guided workout')} tabIndex={-1}>
    <div className="cp-body cp-run is-work">
      {top}{bar}
      <section className="cp-station">
        <span className="cp-kicker">{kicker}</span>
        {ex && <div className="cp-media gp-media"><Media ex={ex} compact /></div>}
        <h2 className="cp-name">{nameOf(e.id)}</h2>
      </section>
      {mode === 'reps' ? <div className="gp-nums">
        <div className="gp-num">
          <span className="gp-l">{t('Reps')}</span>
          <div className="cp-reps">
            <button type="button" className="cp-round-btn" aria-label={t('Fewer reps')} onClick={() => setRow({ r: Math.max(0, (Number(row.r) || 0) - 1) })}><Icon name="minus" /></button>
            <span className="gp-big cp-num">{fmtNum(Number(row.r) || 0)}</span>
            <button type="button" className="cp-round-btn" aria-label={t('More reps')} onClick={() => setRow({ r: (Number(row.r) || 0) + 1 })}><Icon name="plus" /></button>
          </div>
        </div>
        {(Number(row.w) > 0 || !cfg.bodyweight) && <div className="gp-num">
          <span className="gp-l">{t('Weight ({0})', unit)}</span>
          <div className="cp-reps">
            <button type="button" className="cp-round-btn" aria-label={t('Decrease')} onClick={() => setRow({ w: Math.max(0, Math.round(((Number(row.w) || 0) - step) * 100) / 100) })}><Icon name="minus" /></button>
            <span className="gp-big cp-num">{fmtNum(Number(row.w) || 0)}</span>
            <button type="button" className="cp-round-btn" aria-label={t('Increase')} onClick={() => setRow({ w: Math.round(((Number(row.w) || 0) + step) * 100) / 100 })}><Icon name="plus" /></button>
          </div>
        </div>}
      </div> : timed ? <div className="gp-num">
        <span className="gp-l">{t('Time')}</span>
        <div className="cp-reps">
          <button type="button" className="cp-round-btn" aria-label={t('Decrease')} onClick={() => setRow({ sec: Math.max(5, (Number(row.sec) || 45) - 5) })}><Icon name="minus" /></button>
          <span className="gp-big cp-num">{fmtClock(Number(row.sec) || 45)}</span>
          <button type="button" className="cp-round-btn" aria-label={t('Increase')} onClick={() => setRow({ sec: (Number(row.sec) || 45) + 5 })}><Icon name="plus" /></button>
        </div>
      </div> : <span className="cp-target gp-big-line">{setLabel(e.id, row, e.target, speedUnit)}</span>}
      {nextLine && <div className="cp-after"><span className="cp-kicker">{t('Then')}</span><span>{nextLine}</span></div>}
      <div className="cp-ctrl">
        <span />
        <button type="button" className="cp-main" onClick={go}>
          <Icon name={timed ? 'play' : 'check'} /><span>{timed ? t('Start') : t('Done')}</span></button>
        <button type="button" className="cp-side" onClick={skip} disabled={!next}><Icon name="skipForward" /><span>{t('Skip')}</span></button>
      </div>
    </div>
  </div>
}
