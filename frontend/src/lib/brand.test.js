import { describe, it, expect } from 'vitest'
import { brandName } from './brand.js'

const APP_NAME = 'Ti Guigui FIT'
const b = s => brandName(s, APP_NAME)

describe('brandName', () => {
  it('swaps the name in plain text', () => {
    expect(b('Welcome to openGym.')).toBe('Welcome to ' + APP_NAME + '.')
    expect(b("openGym's backup")).toBe(APP_NAME + "'s backup")
  })
  it('leaves URLs and ids alone', () => {
    expect(b('See github.com/DuarteSantos8/openGym')).toBe('See github.com/DuarteSantos8/openGym')
    expect(b('openGym.json')).toBe('openGym.json')
  })
  it('never touches the media licence mention', () => {
    const s = 'Exercise media © Gym visual. Media licensed for use in openGym only.'
    expect(b(s)).toBe(s)
  })
  it('fixes the article', () => {
    expect(b('That file isn’t an openGym backup.')).toBe('That file isn’t a Ti Guigui FIT backup.')
    expect(b('An openGym server')).toBe('A Ti Guigui FIT server')
  })
  it('passes non-strings through', () => {
    expect(b(undefined)).toBe(undefined)
  })
})
