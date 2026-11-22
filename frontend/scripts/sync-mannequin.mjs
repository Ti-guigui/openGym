#!/usr/bin/env node
// Copies the 3D exercise player from the Atelier site (github.com/Ti-guigui/atelier, mannequin/)
// into public/mannequin/, so the app shows the same animations. Rerun after the site changes:
//   node scripts/sync-mannequin.mjs [path to the atelier checkout, default ../../atelier]
// Only what lecteur.js loads is copied (no Kit scenes, no tools).
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const src = path.resolve(process.argv[2] || path.join(here, '../../../atelier'), 'mannequin')
const out = path.join(here, '../public/mannequin')
const FILES = ['lecteur.js', 'corps.js', 'exercices.js', 'recalage.js', 'ecarts.js', 'three.module.min.js',
  'mannequin.css', 'athlete-homme.bin', 'athlete-femme.bin', 'relief.webp', 'zones.png',
  'LICENSE-three.txt', 'LICENCE-anatomie.txt']

if (!fs.existsSync(path.join(src, 'lecteur.js'))) { console.error('no atelier mannequin in ' + src); process.exit(1) }
fs.rmSync(out, { recursive: true, force: true })
fs.mkdirSync(path.join(out, 'affiches'), { recursive: true })
for (const f of FILES) fs.copyFileSync(path.join(src, f), path.join(out, f))
const posters = fs.readdirSync(path.join(src, 'affiches')).filter(f => f.endsWith('.webp'))
for (const f of posters) fs.copyFileSync(path.join(src, 'affiches', f), path.join(out, 'affiches', f))
console.log(`mannequin: ${FILES.length} files + ${posters.length} posters -> ${path.relative(process.cwd(), out)}`)
