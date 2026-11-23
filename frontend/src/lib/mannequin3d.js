// Catalogue exercises that have a 3D animation from the Atelier player (public/mannequin/, copied
// by scripts/sync-mannequin.mjs). Key: the player's exercise id; value: the catalogue ids it shows.
const BY_ANIM = {
  'planche': ['0463'], 'planche-laterale': ['0715', '0706'], 'dead-bug': ['0276', '1243'], 'bird-dog': ['1241', '3141'],
  'hollow': ['1246'], 'squat': ['1197', '3948'], 'fente-arriere': ['1581'], 'squat-bulgare': ['3743'],
  'pont-fessier': ['2471', '0145', '0486'], 'mollets': ['3018'], 'pompe': ['0662'], 'pompe-genoux': ['3211'],
  'rowing-table': ['0499', '2298', '3381'], 'traction': ['0652'], 'dips': ['0129'], 'montees-genoux': ['3556'],
  'chat-vache': ['4580', '1051'], 'fente-rotation': ['1688'], 'course': ['0685', '4004'], 'talons-fesses': ['3037'],
  'sauts-chevilles': ['9070'], 'pompe-inclinee': ['0493'], 'pompe-pike': ['2921'], 'superman': ['3436'],
  'chaise-mur': ['7557'], 'releve-jambes': ['1163'], 'mountain-climber': ['0630'], 'burpee': ['1160'],
  'jumping-jack': ['3094'], 'souleve-roumain': ['5555'], 'curl-biceps': ['0294', '0416'], 'developpe-couche': ['0025'],
  'developpe-incline': ['0314'], 'rowing-haltere': ['0292', '2393'], 'tirage-vertical': ['2291', '2330', '0198', '0150'],
  'rowing-barre': ['0027'], 'souleve-de-terre': ['0032'], 'developpe-militaire': ['0426'], 'elevations-laterales': ['0334'],
  'triceps-poulie': ['0201', '0241', '0200'], 'squat-barre': ['0043', '3593'], 'fentes-halteres': ['0381'], 'souleve-roumain-halteres': ['1459', '0432', '0434'],
  'hip-thrust': ['1060'], 'leg-extension': ['0585'], 'leg-curl': ['0599'], 'presse-cuisses': ['0739', '2224'],
  'chest-press': ['0576', '0577', '10671'], 'adducteurs-machine': ['0598'], 'abducteurs-machine': ['0597'],
  'pec-deck': ['1030', '0596'], 'oiseau-machine': ['0602', '0601'], 'shoulder-press': ['0603', '0587'], 'rowing-assis': ['0861', '0180', '1323', '0163'],
  'vis-a-vis': ['8141', '0227'], 'face-pull': ['5656', '5609'], 'banc-lombaires': ['5813', '4455', '0489', '0488'], 'crunch-machine': ['1452', '0595'],
  'smith-squat': ['0770', '3281'], 'curl-poulie': ['0868'], 'mollets-machine': ['0605'], 'traction-assistee': ['0017'],
  'hack-squat': ['0743'], 'presse-horizontale': ['2951', '3768'], 'hip-thrust-machine': ['2146', '2743'], 'kickback-machine': ['1037'],
  // variants made for the app (atelier PR #86)
  'curl-marteau': ['0313'], 'curl-barre': ['0031', '0447'], 'developpe-couche-halteres': ['0289'], 'pompe-diamant': ['0283', '0259'],
  'traction-supination': ['1326', '0140', '0674'], 'rowing-halteres': ['0293'], 'souleve-roumain-barre': ['0085', '0116'], 'squat-bulgare-halteres': ['2290', '0410'],
  'developpe-militaire-barre': ['1162'], 'ecarte-halteres': ['0308'], 'releve-genoux-suspendu': ['9819'], 'releve-jambes-suspendu': ['0472', '0475'],
  'dips-barres': ['0251', '0814'], 'split-squat': ['0781'], 'goblet-squat': ['1760'],
  'elevation-laterale-poulie': ['0178', '0192'], 'oiseau-halteres': ['0380', '0383', '0378'], 'fente-avant': ['0612', '3470'],
  'step-up': ['0431'], 'leg-curl-allonge': ['0586'], 'swing-kettlebell': ['0549'],
  'pont-fessier-barre': ['1409', '2964'], 'hip-thrust-une-jambe': ['1061'], 'souleve-terre-kettlebell': ['3322'], 'rowing-kettlebell': ['0541'],
  'goblet-squat-kettlebell': ['0534'], 'dips-chaises': ['3387'], 'fente-croisee': ['3769'], 'l-sit': ['3419'], 'etirement-flechisseurs': ['1053'],
  'developpe-couche-serre': ['0030'], 'developpe-incline-barre': ['0047'], 'good-morning': ['0044', '0115'], 'front-squat': ['0042'],
  'rowing-debout': ['0120'], 'barre-front': ['0060', '0061'], 'pullover-haltere': ['0375', '0433'], 'crunch': ['0274'], 'extension-triceps-nuque': ['0430'],
  'elevation-frontale': ['0310'], 'tirage-vertical-serre': ['1047', '7583'], 'developpe-epaules-assis': ['0405'], 'squat-sumo': ['1064'],
  'squat-saute': ['0514'], 'russian-twist': ['0687'],
  'pompe-large': ['1311'], 'curl-inverse': ['0080'], 'crunch-inverse': ['0872'], 'kickback-triceps': ['0333'], 'fente-laterale': ['2972'],
  // stretches (atelier lot 8)
  'etirement-quadriceps': ['1059'], 'etirement-ischios-assis': ['0692'], 'etirement-mollet-mur': ['1377'], 'etirement-pectoraux': ['1271'],
  'etirement-triceps': ['0643'], 'etirement-epaule-croise': ['0669'], 'posture-enfant': ['0945'], 'cobra': ['1482'], 'papillon': ['1494', '1169'],
  'genou-poitrine': ['1810'],
  'chien-tete-en-bas': ['3469', '0949'], 'pigeon': ['1943', '6761'], 'pliure-avant': ['0959', '0789'], 'torsion-allongee': ['1491', '3639'],
  'etirement-poignets': ['0561'], 'fessier-figure-4': ['1056'],
  // atelier lot 10
  'fente-arriere-barre': ['0078'], 'fente-avant-barre': ['0054'], 'fente-avant-halteres': ['0336'], 'rowing-debout-halteres': ['0437'],
  'souleve-terre-halteres': ['0300'], 'souleve-terre-sumo': ['0117'], 'sit-up': ['0736', '0456'], 'pompe-declinee': ['0279'],
  // atelier lot 11
  'curl-marteau-poulie': ['0166', '0165'], 'curl-inverse-poulie': ['0206'], 'rowing-debout-poulie': ['0246'], 'elevation-frontale-barre': ['0041'],
  'squat-halteres': ['0413'], 'step-up-sans-poids': ['0801'], 'curl-assis': ['0391'], 'pont-fessier-une-jambe': ['0726'],
  // atelier lot 12
  'squat-large-barre': ['0124'], 'elevation-frontale-poulie': ['0162', '0161', '0164'], 'battements-jambes': ['0459'], 'ciseaux-allonge': ['0622'],
  'pompe-mur': ['0659'], 'bateau': ['0136'],
  // atelier lot 13
  'step-up-barre': ['0114'], 'squat-serre-barre': ['0063', '5633'], 'developpe-couche-large': ['0122'], 'rowing-debout-large': ['0123'],
  'curl-barre-large': ['0113'], 'triceps-poulie-supination': ['0207'], 'developpe-assis-barre': ['0091', '1045'],
  // atelier lot 14
  'squat-banc-barre': ['0026'], 'squat-banc-halteres': ['0291'], 'squat-barre-tete': ['0069'], 'squat-saute-barre': ['0053'],
  'rowing-barre-serre': ['0062'], 'tirage-vertical-supination': ['0245'], 'rowing-assis-large': ['0218'], 'tirage-bras-tendus': ['0238'],
  // atelier lot 15
  'curl-alterne': ['0285'], 'curl-marteau-alterne': ['6147'], 'curl-assis-alterne': ['3761'], 'squat-vitesse-barre': ['0101'],
  'sit-up-3-4': ['0001'], 'planche-laterale-genoux': ['0133'], 'good-morning-assis': ['0090'],
  // atelier lot 16
  'elevations-laterales-assis': ['0396'], 'developpe-epaules-assis-alterne': ['0388'], 'mollets-halteres': ['0417'], 'curl-inverse-halteres': ['0429', '0382'],
  'curl-barre-serre': ['0446', '0106'], 'pompe-inclinee-serree': ['0490'], 'developpe-couche-smith': ['0748'], 'developpe-couche-serre-smith': ['0751'],
  // atelier lot 17
  'extension-triceps-halteres': ['0351'], 'squat-saute-halteres': ['0371'], 'traction-assistee-supination': ['0572'], 'traction-mixte': ['0627'],
  'kickback-haltere': ['0354'], 'kickback-halteres-debout': ['0420'],
  'mollets-barre': ['0108'], 'squat-bulgare-barre': ['0099'], 'curl-inverse-barre': ['0110'], 'rowing-barre-supination': ['0118'],
  'developpe-militaire-neutre': ['0427'], 'developpe-epaules-assis-neutre': ['0404'], 'developpe-militaire-alterne': ['0414'],
  'elevation-frontale-assis': ['0392'], 'elevation-frontale-assis-alterne': ['0387'],
}
// The same exercise again in the catalogue (its female version, or a "v. 2" of the same name): same animation.
const SAME_AS = {
  '0077': '0078', '0119': '0120', '0121': '0120', '0132': '3639', '0135': '1241', '0146': '3037', '0156': '0868',
  '0249': '1051', '0275': '0274', '0280': '0279', '0309': '0310', '0312': '0313', '0395': '0396', '0465': '0463',
  '0485': '0486', '0497': '0499', '0513': '0514', '0516': '3094', '0644': '4004', '0658': '0659', '0671': '0872',
  '0705': '0706', '0714': '0715', '0787': '1197', '0802': '1064', '0804': '3436', '0869': '0603', '0877': '5813',
  '1057': '1169', '1067': '0238', '11250': '0227', '11305': '3281', '1179': '0459', '1196': '0285', '1244': '0459',
  '1455': '0577', '1555': '0413', '1860': '0489', '1867': '0598', '1869': '0597', '2106': '1051', '2196': '0685',
  '2210': '0417', '2211': '0605', '2213': '0085', '2214': '0032', '2215': '0044', '2216': '1060', '2217': '0291',
  '2218': '0336', '2219': '0381', '2220': '0413', '2221': '0431', '2222': '1459', '2223': '0586', '2225': '0026',
  '2226': '0078', '2227': '0099', '2229': '0120', '2230': '0162', '2231': '0192', '2232': '0246', '2233': '0310',
  '2235': '0392', '2236': '0396', '2237': '0405', '2238': '0447', '2239': '0313', '2240': '0391', '2241': '0433',
  '2242': '0027', '2243': '0198', '2245': '0861', '2247': '0150', '2251': '0351', '2253': '0308', '2254': '0289',
  '2255': '0596', '2256': '0585', '2257': '0599', '2277': '0577', '2280': '1943', '2281': '1760', '2299': '0499',
  '2318': '0603', '2356': '0534', '2373': '0354', '2374': '0514', '2376': '0129', '2377': '2951', '2379': '1326',
  '2380': '0426', '2384': '0743', '2388': '0047', '2389': '0063', '2390': '0430', '2391': '0030', '2392': '0378',
  '2427': '1030', '2437': '0333', '2438': '0200', '2440': '0025', '2441': '0314', '2445': '1452', '2456': '0576',
  '2457': '0577', '2467': '0118', '2476': '0001', '2477': '0041', '2478': '0054', '2479': '0080', '2482': '0293',
  '2483': '0294', '2484': '0300', '2485': '0313', '2499': '0446', '2501': '0114', '2502': '0042', '2515': '0162',
  '2517': '0117', '2518': '0124', '2520': '0207', '2529': '0017', '2530': '0475', '2531': '0489', '2537': '0549',
  '2538': '0687', '2552': '0598', '2553': '0597', '2584': '0285', '2589': '0351', '2593': '0404', '2594': '0388',
  '2595': '0387', '2598': '0420', '2599': '0427', '2602': '0090', '2604': '0091', '2614': '0659', '2615': '0259',
  '2636': '0432', '2692': '0061', '2693': '0106', '2697': '0283', '2752': '0781', '2794': '1160', '2822': '0602',
  '2881': '0662', '2965': '2964', '2973': '2972', '3054': '0178', '3071': '0276', '3083': '0391', '3101': '0587',
  '3115': '0814', '3262': '1163', '3340': '0432', '3341': '0336', '3428': '0310', '3431': '0437', '3592': '0031',
  '3594': '0116', '3595': '0123', '3598': '0218', '3599': '0251', '3611': '0597', '3612': '0598', '3613': '1037',
  '3753': '0595', '3754': '1047', '3760': '1452', '3800': '1243', '3817': '3556', '3894': '0432', '3895': '0674',
  '3902': '3322', '4019': '0872', '4037': '1311', '4267': '1482', '4301': '0669', '4508': '1494', '4643': '0459',
  '4645': '0630', '4778': '0872', '4808': '1163', '4811': '0715', '4975': '1163', '5119': '0300', '5177': '3769',
  '5213': '0630', '5251': '3469', '5252': '4580', '5330': '0375', '5734': '0459', '5964': '0180', '6036': '0238',
  '6484': '0375', '7002': '0748', '7069': '0122', '7113': '0433', '7157': '1246', '7253': '1053', '7839': '1243',
  '8372': '1059', '9609': '3322', '9739': '0201',
}
export const ANIM_3D = Object.fromEntries(Object.entries(BY_ANIM).flatMap(([anim, ids]) => ids.map(id => [id, anim])))
for (const [id, ref] of Object.entries(SAME_AS)) ANIM_3D[id] = ANIM_3D[ref]

// The player's id for a catalogue exercise, or null (custom exercises never have one).
export const anim3dOf = ex => (ex && !ex.custom && ANIM_3D[ex.id]) || null
