// Catalogue exercises that have a 3D animation from the Atelier player (public/mannequin/, copied
// by scripts/sync-mannequin.mjs). Key: the player's exercise id; value: the catalogue ids it shows.
const BY_ANIM = {
  'planche': ['0463'], 'planche-laterale': ['0715'], 'dead-bug': ['0276', '1243'], 'bird-dog': ['1241', '3141'],
  'hollow': ['1246'], 'squat': ['1197', '3948'], 'fente-arriere': ['1581'], 'squat-bulgare': ['3743'],
  'pont-fessier': ['2471'], 'mollets': ['3018'], 'pompe': ['0662'], 'pompe-genoux': ['3211'],
  'rowing-table': ['0499', '2298'], 'traction': ['0652'], 'dips': ['0129'], 'montees-genoux': ['3556'],
  'chat-vache': ['4580', '1051'], 'fente-rotation': ['1688'], 'course': ['0685', '4004'], 'talons-fesses': ['3037'],
  'sauts-chevilles': ['9070'], 'pompe-inclinee': ['0493'], 'pompe-pike': ['2921'], 'superman': ['3436'],
  'chaise-mur': ['7557'], 'releve-jambes': ['1163'], 'mountain-climber': ['0630'], 'burpee': ['1160'],
  'jumping-jack': ['3094'], 'souleve-roumain': ['5555'], 'curl-biceps': ['0294'], 'developpe-couche': ['0025'],
  'developpe-incline': ['0314'], 'rowing-haltere': ['0292', '2393'], 'tirage-vertical': ['2291', '2330'],
  'rowing-barre': ['0027'], 'souleve-de-terre': ['0032'], 'developpe-militaire': ['0426'], 'elevations-laterales': ['0334'],
  'triceps-poulie': ['0201'], 'squat-barre': ['0043', '3593'], 'fentes-halteres': ['0336'], 'souleve-roumain-halteres': ['1459'],
  'hip-thrust': ['1060'], 'leg-extension': ['0585'], 'leg-curl': ['0599'], 'presse-cuisses': ['0739', '2224'],
  'chest-press': ['0576', '0577', '10671'], 'adducteurs-machine': ['0598'], 'abducteurs-machine': ['0597'],
  'pec-deck': ['1030', '0596'], 'oiseau-machine': ['0602', '0601'], 'shoulder-press': ['0603'], 'rowing-assis': ['0861', '0180'],
  'vis-a-vis': ['8141', '0227'], 'face-pull': ['5656', '5609'], 'banc-lombaires': ['5813', '4455'], 'crunch-machine': ['1452', '0595'],
  'smith-squat': ['0770', '3281'], 'curl-poulie': ['0868'], 'mollets-machine': ['0605'], 'traction-assistee': ['0017'],
  'hack-squat': ['0743'], 'presse-horizontale': ['2951', '3768'], 'hip-thrust-machine': ['2146', '2743'], 'kickback-machine': ['1037'],
}
export const ANIM_3D = Object.fromEntries(Object.entries(BY_ANIM).flatMap(([anim, ids]) => ids.map(id => [id, anim])))

// The player's id for a catalogue exercise, or null (custom exercises never have one).
export const anim3dOf = ex => (ex && !ex.custom && ANIM_3D[ex.id]) || null
