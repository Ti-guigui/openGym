import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store/useStore.js'
import { t, tn, dateLocale } from '../lib/i18n.js'
import { fmtNum, fmtDate } from '../lib/format.js'
import { lastBW } from '../lib/history.js'
import { sexOf, ageOf } from '../lib/strength-level.js'
import { lengthUnitOf } from '../lib/measurements.js'
import { ACTIVITY, LB_PER_KG, CM_PER_IN } from '../lib/calculators.js'
import {
  nutritionOf, dailyTarget, weeksToGoal, dateInWeeks, kgOf, weeklyBurn, weekGoalOf, clampWeekGoal, GOALS, RATES,
} from '../lib/nutrition.js'
import { FOOD_GROUPS, GOAL_TIPS, LIMIT, SLOTS, SLOT_NAME, mealIdeas, pick } from '../lib/food-ideas.js'
import Icon from '../components/Icon.jsx'
import CardHead from '../components/CardHead.jsx'
import { Button, Segmented, Stepper } from '../components/ui.jsx'
import { bwSheet, goalSheet } from '../sheets.jsx'

// Nutrition (Ti Guigui FIT): the day's calorie target for a goal and a weekly rate (the deficit),
// its macros and the date the goal weight should be reached; the energy the workouts burned week
// by week against a goal; what to eat and meal ideas sized to the target. Formulas and sources are
// in lib/nutrition.js, the food texts in lib/food-ideas.js. Home → Nutrition card, or Stats.

const ACTIVITY_LABEL = { sedentary: 'Sedentary', light: 'Lightly active', moderate: 'Moderate', very: 'Very active' }
const GOAL_LABEL = { lose: 'Lose', keep: 'Maintain', gain: 'Gain' }

export default function Nutrition() {
  const nav = useNavigate()
  const S = useStore(s => s.S)
  const update = useStore(s => s.update)
  const unit = S.unit === 'lb' ? 'lb' : 'kg'
  const lenUnit = lengthUnitOf(S)
  const n = nutritionOf(S)
  const set = patch => update(s => { s.nutrition = { ...nutritionOf(s), ...patch } })

  const bw = Number(lastBW(S)?.w) > 0 ? Number(lastBW(S).w) : null
  const kg = bw ? kgOf(S, bw) : null
  const cm = Number(S.heightCm) > 0 ? Number(S.heightCm) : null
  const age = ageOf(S)
  const sex = sexOf(S) || 'male'
  const target = kg && cm && age ? dailyTarget({ kg, cm, age, sex, activity: n.activity, goal: n.goal, rate: n.rate }) : null
  const goalKg = Number(S.targetW) > 0 ? kgOf(S, S.targetW) : null
  const weeks = target && kg && goalKg ? weeksToGoal(kg, goalKg, target.change) : null
  const num2 = v => new Intl.NumberFormat(dateLocale(), { maximumFractionDigits: 2 }).format(v)
  const rateText = r => (unit === 'lb' ? num2(Math.round(r * LB_PER_KG * 10) / 10) : num2(r)) + ' ' + unit

  return <div className="narrow nut">
    <div className="hdr">
      <button className="iconbtn" data-back="/home" onClick={() => nav('/home')} aria-label={t('Home')}><Icon name="chevronLeft" /></button>
      <div style={{ flex: 1, marginInlineStart: 12 }}><h1>{t('Nutrition')}</h1>
        <div className="sub">{t('Calories, deficit, what to eat')}</div></div>
    </div>

    {/* Who you are: what the formula needs, saved on the profile. */}
    <section className="card">
      <CardHead icon="person" title={t('Your profile')} sub={t('Saved on your profile, used by every estimate.')} />
      <div className="row cfgrow nut-profile">
        <div className="nut-bw">
          <span className="stp-l">{t('Body weight ({0})', unit)}</span>
          <Button size="sm" variant="tinted" icon={bw ? 'pencil' : 'plus'} onClick={() => bwSheet()}>{bw ? fmtNum(bw) + ' ' + unit : t('Log')}</Button>
        </div>
        <Stepper label={t('Height ({0})', lenUnit)} value={cm ? (lenUnit === 'in' ? Math.round(cm / CM_PER_IN) : Math.round(cm)) : 0} step={1}
          onChange={v => update(s => { if (v > 0) s.heightCm = Math.round((lenUnit === 'in' ? v * CM_PER_IN : v) * 10) / 10; else delete s.heightCm })} />
        <Stepper label={t('Year of birth')} value={Number(S.birthYear) > 0 ? Number(S.birthYear) : 1995} step={1} decimal={false}
          min={1920} max={new Date().getFullYear() - 10} onChange={v => update(s => { s.birthYear = Math.round(v) })} />
      </div>
      <Segmented className="seg-inline" value={sex} onChange={v => update(s => { s.sex = v })}
        options={[{ value: 'male', label: t('Male') }, { value: 'female', label: t('Female') }]} />
      <div className="nut-lab">{t('Activity')}</div>
      <Segmented className="seg-inline" value={n.activity} onChange={v => set({ activity: v })}
        options={Object.keys(ACTIVITY).map(k => ({ value: k, label: t(ACTIVITY_LABEL[k]) }))} />
      <div className="small dim">{t('Lightly active: 1 to 3 sessions a week. Moderate: 3 to 5. Very active: 6 or 7.')}</div>
    </section>

    {/* The goal and the deficit it means. */}
    <section className="card">
      <CardHead icon="target" tint="var(--gold-ink)" title={t('Your goal')}
        action={<Button size="sm" variant="ghost" icon="target" onClick={goalSheet}>{S.targetW ? fmtNum(S.targetW) + ' ' + unit : t('Goal weight')}</Button>} />
      <Segmented value={n.goal} onChange={v => set({ goal: v })} options={GOALS.map(g => ({ value: g, label: t(GOAL_LABEL[g]) }))} />
      {n.goal !== 'keep' && <>
        <div className="nut-lab">{t('Pace per week')}</div>
        <Segmented className="seg-inline" value={n.rate} onChange={v => set({ rate: v })}
          options={RATES.map(r => ({ value: r, label: rateText(r) }))} />
        {n.goal === 'lose' && n.rate >= 1 && <div className="small dim">{t('1 kg a week is fast. Fine for a few weeks, hard to hold.')}</div>}
      </>}

      {target ? <>
        <div className="nut-target" aria-live="polite">
          <div className="nut-big">{fmtNum(target.target)}<span> kcal</span></div>
          <div className="small dim">{t('to eat each day')}</div>
        </div>
        <div className="tiles tools-tiles">
          <div className="tile"><div className="l">{t('Maintenance')}</div><div className="v v-sm">{fmtNum(target.maintenance)}</div><div className="small dim">kcal</div></div>
          <div className="tile"><div className="l">{target.change < 0 ? t('Deficit') : target.change > 0 ? t('Surplus') : t('Balance')}</div>
            <div className="v v-sm">{target.change > 0 ? '+' : ''}{fmtNum(target.change)}</div><div className="small dim">{t('kcal a day')}</div></div>
          <div className="tile"><div className="l">{t('Resting')}</div><div className="v v-sm">{fmtNum(target.bmr)}</div><div className="small dim">kcal</div></div>
        </div>
        {target.limited && <div className="small nut-warn"><Icon name="warning" /> {t('Held at a safe minimum: eating less would cost muscle and energy. Lose slower or move more.')}</div>}
        <div className="nut-macros">
          <Macro label={t('Protein')} g={target.protein} kcal={target.protein * 4} total={target.target} color="var(--red)" />
          <Macro label={t('Carbs')} g={target.carbs} kcal={target.carbs * 4} total={target.target} color="var(--orange)" />
          <Macro label={t('Fat')} g={target.fat} kcal={target.fat * 9} total={target.target} color="var(--yellow)" />
        </div>
        {weeks != null && <div className="nut-eta"><Icon name="flag" />
          <span>{t('Goal weight around {0}', fmtDate(dateInWeeks(weeks), true))} · {tn('{0} week', '{0} weeks', weeks)}</span></div>}
        <div className="small dim" style={{ marginTop: 8 }}>{t('Mifflin-St Jeor formula, 7,700 kcal per kg. An estimate: check the scale over 2 to 3 weeks and adjust by 100 to 200 kcal.')}</div>
      </> : <div className="small dim" style={{ marginTop: 10 }}>{t('Log your weight and add your height and year of birth to see your target.')}</div>}
    </section>

    <BurnCard S={S} update={update} />

    {/* What to eat */}
    <h4 className="sec">{t('What to eat')}</h4>
    <div className="card nut-tip"><Icon name="lightbulb" /><span>{pick(GOAL_TIPS[n.goal])}</span></div>
    {FOOD_GROUPS.map(g => <FoodGroup key={g.id} g={g} />)}
    <div className="small dim nut-limit">{pick(LIMIT)}</div>

    <MealIdeas dayKcal={target?.target || null} />
  </div>
}

function Macro({ label, g, kcal, total, color }) {
  const share = total > 0 ? Math.round(kcal / total * 100) : 0
  return <div className="nut-macro">
    <div className="small dim">{label}</div>
    <b className="nut-macro-g">{fmtNum(g)} g</b>
    <div className="nut-track"><span style={{ width: Math.min(100, share) + '%', background: color }} /></div>
    <div className="small dim">{share} %</div>
  </div>
}

// Calories burned by the workouts, week by week, against a weekly goal.
function BurnCard({ S, update }) {
  const [editing, setEditing] = useState(false)
  const rows = weeklyBurn(S, 6)
  const goal = weekGoalOf(S)
  const top = Math.max(goal || 0, ...rows.map(r => r.kcal), 100)
  const now = rows.at(-1)
  return <section className="card">
    <CardHead icon="flame" tint="var(--orange)" title={t('Calories burned')}
      sub={goal ? t('{0} of {1} kcal this week', fmtNum(now.kcal), fmtNum(goal)) : t('{0} kcal this week', fmtNum(now.kcal))}
      action={editing
        ? <Button size="sm" variant="tinted" onClick={() => setEditing(false)}>{t('Done')}</Button>
        : <Button size="sm" variant="ghost" icon="target" onClick={() => setEditing(true)}>{goal ? fmtNum(goal) : t('Goal')}</Button>} />
    {editing && <div className="row nut-goal">
      <Stepper label={t('Weekly goal (kcal)')} value={goal || 1200} step={100} min={100} max={10000} decimal={false}
        onChange={v => update(s => { s.kcalWeekGoal = clampWeekGoal(v) })} />
      {goal && <Button size="sm" variant="ghost" icon="xmark" onClick={() => update(s => { s.kcalWeekGoal = null })}>{t('Clear')}</Button>}
    </div>}
    <div className="nut-chart" role="img" aria-label={rows.map(r => fmtDate(r.week) + ': ' + r.kcal + ' kcal').join(', ')}>
      {goal && <span className="nut-goal-line" style={{ bottom: (goal / top * 100) + '%' }}><i>{fmtNum(goal)}</i></span>}
      {rows.map(r => <div key={r.week} className={'nut-col' + (goal && r.kcal >= goal ? ' hit' : '')}>
        <span className="nut-col-v">{r.kcal ? fmtNum(r.kcal) : ''}</span>
        <span className="nut-col-b" style={{ height: Math.max(r.kcal ? 3 : 0, r.kcal / top * 100) + '%' }} />
      </div>)}
    </div>
    <div className="nut-axis">{rows.map(r => <span key={r.week}>{fmtDate(r.week)}</span>)}</div>
    <div className="small dim" style={{ marginTop: 6 }}>{t('Estimated from the length of each workout and your weight. Only what the session adds to your day, not the calories you burn at rest.')}</div>
  </section>
}

function FoodGroup({ g }) {
  const [open, setOpen] = useState(false)
  const list = open ? g.foods : g.foods.slice(0, 4)
  return <section className="card nut-group">
    <CardHead icon={g.icon} tint={g.tint} title={pick(g.name)} sub={pick(g.why)} />
    <div className="nut-foods">{list.map(f => <div key={f.en} className="nut-food">
      <span>{pick(f)} <span className="dim">· {f.portion}</span></span>
      <span className="dim nut-food-n">{f.kcal} kcal{f.p ? ' · ' + f.p + ' g P' : ''}</span>
    </div>)}</div>
    {g.foods.length > 4 && <Button size="sm" variant="ghost" trailingIcon={open ? 'chevronUp' : 'chevronDown'} onClick={() => setOpen(!open)}>{open ? t('Show less') : t('Show more')}</Button>}
  </section>
}

function MealIdeas({ dayKcal }) {
  const [seed, setSeed] = useState(0)
  return <>
    <div className="row between" style={{ margin: '18px 2px 10px' }}>
      <h4 className="sec" style={{ margin: 0 }}>{t('Meal ideas')}</h4>
      <Button size="sm" variant="ghost" icon="shuffle" onClick={() => setSeed(seed + 1)}>{t('Other ideas')}</Button>
    </div>
    {dayKcal && <div className="small dim" style={{ margin: '0 2px 10px' }}>{t('Sized for {0} kcal a day.', fmtNum(dayKcal))}</div>}
    {SLOTS.map(slot => <section key={slot} className="card nut-meals">
      <div className="nut-slot"><Icon name="utensils" />{pick(SLOT_NAME[slot])}</div>
      {mealIdeas(slot, dayKcal, seed, 2).map(m => <div key={m.id} className="nut-meal">
        <div className="row between"><b>{pick(m.name)}</b><span className="nut-meal-n">{m.kcal} kcal · {m.p} g P</span></div>
        <div className="small dim">{pick(m.what)}</div>
      </div>)}
    </section>)}
  </>
}
