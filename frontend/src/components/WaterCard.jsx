import { useStore } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import { todayISO } from '../lib/format.js'
import { waterOf, withWater, WATER_GOAL, GLASS_ML } from '../lib/water.js'
import CardHead from './CardHead.jsx'
import { Button } from './ui.jsx'

// Today's glasses of water on Home (Ti Guigui FIT, lib/water.js): one tap per glass.
export default function WaterCard({ S }) {
  const update = useStore(s => s.update)
  const today = todayISO()
  const n = waterOf(S, today)
  const set = v => update(s => { s.water = withWater(s.water, today, v) })
  return <div className="card water-card">
    <CardHead icon="drop" tint="var(--blue)" title={t('Water')}
      sub={t('{0} of {1} glasses', n, WATER_GOAL) + (n >= WATER_GOAL ? ' · ' + t('Goal reached') : '')}
      action={<span className="row" style={{ gap: 6 }}>
        <Button size="sm" icon="minus" aria-label={t('Remove a glass')} disabled={!n} onClick={() => set(n - 1)} />
        <Button size="sm" variant="tinted" icon="plus" aria-label={t('Add a glass')} onClick={() => set(n + 1)} />
      </span>} />
    <div className="water-dots" aria-hidden="true">
      {Array.from({ length: Math.max(WATER_GOAL, n) }, (_, i) => <span key={i} className={'water-dot' + (i < n ? ' on' : '')} />)}
    </div>
    <div className="small dim">{t('{0} ml today', n * GLASS_ML)}</div>
  </div>
}
