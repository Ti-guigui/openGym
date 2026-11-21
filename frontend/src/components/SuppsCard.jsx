import { useState } from 'react'
import { useStore } from '../store/useStore.js'
import { t } from '../lib/i18n.js'
import { todayISO } from '../lib/format.js'
import { SUPPS, suppListOf, takenOn, withToggled, suppStreak } from '../lib/supps.js'
import CardHead from './CardHead.jsx'
import Icon from './Icon.jsx'
import { Button } from './ui.jsx'

const LABEL = Object.fromEntries(SUPPS.map(s => [s.id, s.label]))

// Today's supplements on Home (Ti Guigui FIT, lib/supps.js): one chip per supplement you take,
// tapped once taken, with its days in a row. The pencil picks which ones are on the card.
export default function SuppsCard({ S }) {
  const update = useStore(s => s.update)
  const today = todayISO()
  const list = suppListOf(S)
  const [editing, setEditing] = useState(false)
  const taken = takenOn(S, today)
  const pick = id => update(s => { const on = new Set(suppListOf(s)); on.has(id) ? on.delete(id) : on.add(id); s.suppList = SUPPS.filter(x => on.has(x.id)).map(x => x.id) })
  const tick = id => update(s => { s.supps = withToggled(s, today, id) })
  const done = list.filter(id => taken.has(id)).length

  return <div className="card supps-card">
    <CardHead icon="pill" tint="var(--green)" title={t('Supplements')}
      sub={list.length && !editing ? t('{0} of {1} taken today', done, list.length) : t('Pick the ones you take.')}
      action={editing
        ? <Button size="sm" variant="tinted" onClick={() => setEditing(false)}>{t('Done')}</Button>
        : <Button size="sm" variant="ghost" icon="pencil" aria-label={t('Choose supplements')} onClick={() => setEditing(true)} />} />
    {editing
      ? <div className="chips fit supps-chips">
        {SUPPS.map(({ id, label }) => <button key={id} type="button" className={'chip nocap' + (list.includes(id) ? ' on' : '')}
          aria-pressed={list.includes(id)} onClick={() => pick(id)}>{t(label)}</button>)}
      </div>
      : list.length
        ? <div className="chips fit supps-chips">
          {list.map(id => {
            const run = suppStreak(S, id, today)
            return <button key={id} type="button" className={'chip nocap ichip' + (taken.has(id) ? ' on' : '')} aria-pressed={taken.has(id)} onClick={() => tick(id)}>
              {taken.has(id) && <Icon name="check" />}
              <span>{t(LABEL[id])}</span>
              {run > 1 && <span className="supp-run" title={t('{0} days in a row', run)} aria-label={t('{0} days in a row', run)}><Icon name="flame" />{run}</span>}
            </button>
          })}
        </div>
        : <Button size="sm" icon="plus" onClick={() => setEditing(true)}>{t('Choose supplements')}</Button>}
  </div>
}
