import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import { t, tn } from '../lib/i18n.js'
import { todayISO } from '../lib/format.js'
import { waterOf, withWater, waterGoalOf, clampGoal, GLASS_ML, WATER_GOAL_MIN, WATER_GOAL_MAX } from '../lib/water.js'
import CardHead from './CardHead.jsx'
import { Button } from './ui.jsx'

// Today's glasses of water on Home (Ti Guigui FIT, lib/water.js): one tap per glass. The target
// button opens the daily goal, a stepper from 1 to 20 glasses.
export default function WaterCard({ S }) {
  const update = useStore(s => s.update)
  const [editing, setEditing] = useState(false)
  const today = todayISO()
  const n = waterOf(S, today)
  const goal = waterGoalOf(S)
  const set = v => update(s => { s.water = withWater(s.water, today, v) })
  const setGoal = v => update(s => { s.waterGoal = clampGoal(v) })
  return <div className="card water-card">
    <CardHead icon="drop" tint="var(--blue)" title={t('Water')}
      sub={t('{0} of {1} glasses', n, goal) + (n >= goal ? ' · ' + t('Goal reached') : '')}
      action={editing
        ? <Button size="sm" variant="tinted" onClick={() => setEditing(false)}>{t('Done')}</Button>
        : <span className="row" style={{ gap: 6 }}>
          <Button size="sm" variant="ghost" icon="target" aria-label={t('Goal')} onClick={() => setEditing(true)} />
          <Button size="sm" icon="minus" aria-label={t('Remove a glass')} disabled={!n} onClick={() => set(n - 1)} />
          <Button size="sm" variant="tinted" icon="plus" aria-label={t('Add a glass')} onClick={() => set(n + 1)} />
        </span>} />
    {editing && <div className="row water-goal">
      <span className="small muted">{t('Goal')}</span>
      <Button size="sm" icon="minus" aria-label={t('Decrease')} disabled={goal <= WATER_GOAL_MIN} onClick={() => setGoal(goal - 1)} />
      <span className="water-goal-n" aria-live="polite">{tn('{0} glass', '{0} glasses', goal)}</span>
      <Button size="sm" icon="plus" aria-label={t('Increase')} disabled={goal >= WATER_GOAL_MAX} onClick={() => setGoal(goal + 1)} />
    </div>}
    <div className="water-dots" aria-hidden="true">
      {Array.from({ length: Math.max(goal, n) }, (_, i) => <span key={i} className={'water-dot' + (i < n ? ' on' : '')} />)}
    </div>
    <div className="small dim">{t('{0} ml today', n * GLASS_ML)}</div>
  </div>
}
