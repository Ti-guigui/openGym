import { describe, it, expect } from 'vitest'
import { previewOn } from './preview-start.js'

describe('previewOn', () => {
  it('is opt-in upstream', () => {
    expect(previewOn({}, 'openGym')).toBe(false)
    expect(previewOn({ previewStart: true }, 'openGym')).toBe(true)
  })
  it('is opt-out in Ti Guigui FIT', () => {
    expect(previewOn({}, 'Ti Guigui FIT')).toBe(true)
    expect(previewOn({ previewStart: false }, 'Ti Guigui FIT')).toBe(false)
  })
})
