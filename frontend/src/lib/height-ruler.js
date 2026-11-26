// The height ruler beside the measurements figure (Ti Guigui FIT, components/HeightRuler.jsx):
// the ruler runs from 220 cm at the top to 120 cm at the bottom, one tick every 2 cm. Where a
// finger is on it says a height, and a height says where its marker sits. Pure, so it is tested.

export const RULER_MIN = 120
export const RULER_MAX = 220
const CM_PER_IN = 2.54
const clamp = v => Math.min(RULER_MAX, Math.max(RULER_MIN, v))

/** A height on the profile's unit grid: whole centimetres, or whole inches stored in cm. */
export const snapCm = (cm, unit = 'cm') => (unit === 'in'
  ? Math.round(Math.round(clamp(cm) / CM_PER_IN) * CM_PER_IN * 10) / 10
  : Math.round(clamp(cm)))

/** The height at `frac` of the ruler's length from its top (0) to its bottom (1). */
export const cmAt = (frac, unit = 'cm') => snapCm(RULER_MAX - Math.min(1, Math.max(0, frac)) * (RULER_MAX - RULER_MIN), unit)

/** Where a height's marker sits, as a fraction from the top. */
export const fracOf = cm => (RULER_MAX - clamp(Number(cm))) / (RULER_MAX - RULER_MIN)

/** The height as shown: whole cm, or whole inches. */
export const shownHeight = (cm, unit = 'cm') => (unit === 'in' ? Math.round(cm / CM_PER_IN) : Math.round(cm))
