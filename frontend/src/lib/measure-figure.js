// Where the labels of the measurements figure go (components/MeasureFigure.jsx): each beside its
// spot, as close to its height as it can be without two labels of one side overlapping, and all
// of them inside the figure. Pure, so it is tested (measure-figure.test.js).

/**
 * spots: [{ key, side: 'l' | 'r', y }]; returns { [key]: y } for each label's centre. Labels are
 * at least `gap` apart on a side and between `top` and `bottom`; when a side holds more than fits,
 * they are spread evenly over the whole height.
 */
export function placeLabels(spots, { top, bottom, gap }) {
  const out = {}
  for (const side of ['l', 'r']) {
    const list = spots.filter(s => s.side === side).sort((a, b) => a.y - b.y)
    if (!list.length) continue
    if ((list.length - 1) * gap > bottom - top) {
      const step = list.length > 1 ? (bottom - top) / (list.length - 1) : 0
      list.forEach((s, i) => { out[s.key] = top + i * step })
      continue
    }
    const ys = list.map(s => Math.min(bottom, Math.max(top, s.y)))
    for (let i = 1; i < ys.length; i++) ys[i] = Math.max(ys[i], ys[i - 1] + gap)
    if (ys.at(-1) > bottom) {
      ys[ys.length - 1] = bottom
      for (let i = ys.length - 2; i >= 0; i--) ys[i] = Math.min(ys[i], ys[i + 1] - gap)
    }
    list.forEach((s, i) => { out[s.key] = ys[i] })
  }
  return out
}
