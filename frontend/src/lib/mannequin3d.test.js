import fs from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ANIM_3D, anim3dOf } from './mannequin3d.js'

const catalogue = new URL('../../../catalogue/exercises/', import.meta.url)
const player = new URL('../../public/mannequin/', import.meta.url)

describe('3D animations table', () => {
  it('points every entry at a real catalogue exercise', () => {
    for (const id of Object.keys(ANIM_3D)) expect(fs.existsSync(new URL(id + '.json', catalogue)), id).toBe(true)
  })
  it('points every entry at an animation and a poster the player has', async () => {
    const { EXERCICES } = await import(/* @vite-ignore */ new URL('exercices.js', player).href)
    for (const anim of new Set(Object.values(ANIM_3D))) {
      expect(EXERCICES[anim], anim).toBeTruthy()
      expect(fs.existsSync(new URL('affiches/' + anim + '.webp', player)), anim).toBe(true)
    }
  })
  it('gives nothing for custom or unknown exercises', () => {
    expect(anim3dOf({ id: '0662' })).toBe('pompe')
    expect(anim3dOf({ id: '0662', custom: true })).toBe(null)
    expect(anim3dOf({ id: '0001' })).toBe(null)
    expect(anim3dOf(null)).toBe(null)
  })
})
