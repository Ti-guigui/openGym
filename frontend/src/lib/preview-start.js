// "Preview before starting" (#976, Settings → Workout): upstream shows it only when turned on;
// Ti Guigui FIT shows it unless turned off, because its preview carries the map of the muscles the
// session works and the guided-workout button (components/StartSheets.jsx).
import { APP_NAME } from './brand.js'

export const previewOn = (st, name = APP_NAME) => (name === 'openGym' ? st?.previewStart === true : st?.previewStart !== false)
