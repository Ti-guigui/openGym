import { useNavigate } from 'react-router-dom'
import { t } from '../lib/i18n.js'
import { fmtNum } from '../lib/format.js'
import { lastBW } from '../lib/history.js'
import { sexOf, ageOf } from '../lib/strength-level.js'
import { nutritionOf, dailyTarget, kgOf, weeklyBurn, weekGoalOf } from '../lib/nutrition.js'
import CardHead from './CardHead.jsx'

// Home (Ti Guigui FIT, Body module): today's calorie target and this week's burn, one tap to
// views/Nutrition.jsx. Without height or age yet, it invites to set them up there.
export default function NutritionCard({ S }) {
  const nav = useNavigate()
  const n = nutritionOf(S)
  const bw = Number(lastBW(S)?.w)
  const kg = bw > 0 ? kgOf(S, bw) : null
  const cm = Number(S.heightCm) > 0 ? Number(S.heightCm) : null
  const age = ageOf(S)
  const target = kg && cm && age ? dailyTarget({ kg, cm, age, sex: sexOf(S) || 'male', activity: n.activity, goal: n.goal, rate: n.rate }) : null
  const burn = weeklyBurn(S, 1)[0]?.kcal || 0
  const goal = weekGoalOf(S)
  const sub = target
    ? (target.change < 0 ? t('Deficit of {0} kcal a day', fmtNum(-target.change)) : target.change > 0 ? t('Surplus of {0} kcal a day', fmtNum(target.change)) : t('Maintenance'))
      + ' · ' + (goal ? t('{0} of {1} kcal burned this week', fmtNum(burn), fmtNum(goal)) : t('{0} kcal burned this week', fmtNum(burn)))
    : t('Set your goal and see how much to eat.')
  return <div className="card tap-host nutrition-card">
    <CardHead icon="utensils" tint="var(--green)" eyebrow={t('Nutrition')}
      title={target ? t('{0} kcal today', fmtNum(target.target)) : t('Your calorie target')} sub={sub}
      open={{ onClick: () => nav('/nutrition') }} />
  </div>
}
