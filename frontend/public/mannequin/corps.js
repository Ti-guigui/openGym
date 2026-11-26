/* L'Atelier : mannequin 3D articulé (unités : cm, sol à y = 0, le mannequin regarde vers +Z, sa gauche est +X).
   Squelette à angles limités + cinématique inverse à deux os pour poser mains et pieds exactement où il faut.
   Les muscles sont des volumes posés sur les os : ils s'allument en rouge (principaux) ou rouge clair (secondaires).
   Peau : un corps humain lisse (homme ou femme, MPFB / MakeHuman, CC0) recalé sur ce squelette (corps-homme.bin, corps-femme.bin) ;
   ses zones musculaires s'allument directement sur la peau. Si le fichier manque, le mannequin en volumes reste. */
import * as THREE from "./three.module.min.js";

const D = Math.PI / 180;

/* Corps lisses : positions Int16 (1/20 cm), 4 os + 4 poids (Uint8), muscle (n°, force) + tenue (Uint8), triangles Uint16.
   Les os sont dans l'ordre OS_PEAU ; au repos, chaque os est à la position REPOS (racine à l'origine, aucune rotation). */
const OS_PEAU = ["bassin", "lomb", "thorax", "cou", "tete", "epauleG", "coudeG", "poignetG", "epauleD", "coudeD", "poignetD",
  "hancheG", "genouG", "chevilleG", "hancheD", "genouD", "chevilleD", "doigtsG", "phalG", "doigtsD", "phalD", "pouceG", "pouceD"];
/* Articulations des doigts au repos (jointures, phalanges ; G puis D), lues en fin de fichier quand elles y sont. */
const DOIGTS_DEF = [[15.8, -22.6, -0.8], [15, -26.2, 0.2], [-15.8, -22.6, -0.8], [-15, -26.2, 0.2], [19.6, -16.5, 2.2], [-19.6, -16.5, 2.2]];
export const MODELES = {};
async function lireModele(nom) {
  const r = await fetch(new URL(`./corps-${nom}.bin`, import.meta.url));
  if (!r.ok) throw new Error(r.status);
  const b = await r.arrayBuffer(), dv = new DataView(b), nv = dv.getUint32(4, true), ni = dv.getUint32(8, true);
  let o = 12;
  const pos = new Int16Array(b, o, nv * 3); o += nv * 6;
  const idx = new Uint8Array(b, o, nv * 4); o += nv * 4;
  const pds = new Uint8Array(b, o, nv * 4); o += nv * 4;
  const mus = new Uint8Array(b, o, nv * 3); o += nv * 3;
  const tri = new Uint16Array(b, o, ni); o += ni * 2;
  let doigts = null;
  const nd = Math.min(6, Math.floor((b.byteLength - o) / 12));
  if (nd >= 4) doigts = Array.from({ length: nd }, (_, j) => [0, 1, 2].map(c => dv.getFloat32(o + (j * 3 + c) * 4, true)));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(Float32Array.from(pos, v => v / 20), 3));
  g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(Uint16Array.from(idx), 4));
  g.setAttribute("skinWeight", new THREE.BufferAttribute(Float32Array.from(pds, v => v / 255), 4));
  g.setIndex(new THREE.BufferAttribute(tri, 1));
  g.computeVertexNormals();
  return { g, mus, nv, doigts };
}
/* Scènes habillées (visage et cheveux peints) : corps-*.bin. */
export async function chargerCorps() {
  try { [MODELES.homme, MODELES.femme] = await Promise.all([lireModele("homme"), lireModele("femme")]); }
  catch (e) { /* hors ligne ou fichier absent : mannequin en volumes */ }
}
/* Exercices : athlete-*.bin + cartes d'anatomie, partagées par les deux corps. Format : en-tête (3 Uint32 : signature, sommets, indices),
   positions Int16 (1/20 cm), normales Int8, UV Uint16, os Uint8 ×4, poids Uint8 ×4, triangles Uint16, articulations des doigts Float32 ×18, yeux Float32 ×8 (centre, rayon). */
async function lireAthlete(nom) {
  const r = await fetch(new URL(`./athlete-${nom}.bin`, import.meta.url));
  if (!r.ok) throw new Error(r.status);
  const b = await r.arrayBuffer(), [, nv, ni] = new Uint32Array(b.slice(0, 12));
  let o = 12;
  const lire = (T, n) => { const a = new T(b.slice(o, o + n * T.BYTES_PER_ELEMENT)); o += n * T.BYTES_PER_ELEMENT; return a; };
  const pos = lire(Int16Array, nv * 3), nor = lire(Int8Array, nv * 3), uv = lire(Uint16Array, nv * 2), idx = lire(Uint8Array, nv * 4), pds = lire(Uint8Array, nv * 4), tri = lire(Uint16Array, ni);
  const doigts = Array.from({ length: 6 }, (_, j) => Array.from(new Float32Array(b.slice(o + j * 12, o + j * 12 + 12))));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(Float32Array.from(pos, v => v / 20), 3));
  g.setAttribute("normal", new THREE.BufferAttribute(nor, 3, true));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2, true));
  g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(Uint16Array.from(idx), 4));
  g.setAttribute("skinWeight", new THREE.BufferAttribute(Float32Array.from(pds, v => v / 255), 4));
  g.setIndex(new THREE.BufferAttribute(tri, 1));
  const yeux = Array.from(new Float32Array(b.slice(o + 72, o + 104)));
  return { g, nv, doigts, yeux, athlete: true };
}
export async function chargerAthletes() {
  try {
    const tl = new THREE.TextureLoader(), carte = n => tl.loadAsync(new URL(`./${n}`, import.meta.url).href);
    const [h, f, relief, zones] = await Promise.all([lireAthlete("homme"), lireAthlete("femme"), carte("relief.webp"), carte("zones.png")]);
    relief.anisotropy = 4;
    const zonesN = zones.clone();                       // le n° de muscle ne s'interpole pas
    zonesN.minFilter = zonesN.magFilter = THREE.NearestFilter; zonesN.generateMipmaps = false; zonesN.needsUpdate = true;
    for (const m of [h, f]) Object.assign(m, { relief, zonesL: zones, zonesN });
    MODELES.homme = h; MODELES.femme = f;
  } catch (e) { /* hors ligne ou fichier absent : mannequin en volumes */ }
}

export const COULEURS = { peau: 0xd5d9dd, muscle: 0xc3c9cf, principal: 0xd9200f, secondaire: 0xd98a0c, erreur: 0xf08a00, accessoire: 0x8c959c, bois: 0xa07a52 };

/* Limites articulaires (degrés) : le mannequin ne peut pas plier un genou ou un coude à l'envers. */
const LIMITES = {
  lomb: { flex: [-30, 60], lat: [-25, 25], rot: [-30, 30] },
  thorax: { flex: [-25, 45], lat: [-20, 20], rot: [-35, 35] },
  cou: { flex: [-50, 60], lat: [-35, 35], rot: [-70, 70] },
  epaule: { flex: [-60, 180], abd: [-30, 180], rot: [-90, 90] },
  coude: { flex: [0, 150] },
  poignet: { flex: [-70, 80], dev: [-25, 25] },
  prono: [-30, 180],              // rotation de l'avant-bras depuis la paume vers l'avant : 90 = prise neutre, 180 = paume vers l'arrière (pronation complète), partagée entre coude et poignet
  doigts: [0, 100], phal: [0, 110],
  hanche: { flex: [-30, 130], abd: [-25, 60], rot: [-40, 40] },
  genou: { flex: [0, 155] },
  cheville: { flex: [-50, 30] }
};
const borne = (v, [a, b]) => Math.max(a, Math.min(b, v));

/* Volumes musculaires : [nom, os, centre, rayons]. Ils affleurent la peau de 1 à 2 cm : un relief, pas des boules. */
const MUSCLES = [
  ["pectoraux", "thorax", [8, 19, 7.4], [8, 6, 3.6]],
  ["abdominaux", "lomb", [3.4, 8, 7.4], [3.4, 10, 2.6]],
  ["obliques", "lomb", [10.6, 7, 3], [3.2, 8, 5.4]],
  ["dorsaux", "thorax", [9.5, 13, -7.4], [6, 10.5, 3.6]],
  ["trapezes", "thorax", [6, 27, -4], [7, 4.5, 4.2]],
  ["lombaires", "lomb", [3.6, 4, -7.6], [3.2, 8.5, 2.6]],
  ["fessiers", "bassin", [7.5, -5, -6.6], [7.4, 8, 5]],
  ["flechisseurs", "bassin", [7, -4, 7.2], [3.2, 5.5, 2.8]],
  ["deltoides", "brasH", [0, -3, 0], [5.6, 7, 5.6]],
  ["biceps", "brasH", [0, -15, 1.8], [3.4, 9, 3.2]],
  ["triceps", "brasH", [0, -14, -1.9], [3.6, 10, 3.2]],
  ["avant-bras", "brasB", [0, -8, 0.3], [4.1, 9, 3.9]],
  ["quadriceps", "cuisse", [0, -20, 2.6], [6.6, 17, 5.2]],
  ["ischios", "cuisse", [0, -22, -2.6], [6.2, 16, 5.2]],
  ["adducteurs", "cuisse", [-3.2, -14, 0.2], [4.2, 11, 4.8]],
  ["mollets", "jambe", [0, -12, -2.4], [4.2, 10, 3.8]],
  ["tibial", "jambe", [0.6, -18, 2.6], [2.2, 12, 2.8]]
];
export const NOMS_MUSCLES = {
  pectoraux: "Pectoraux", abdominaux: "Abdominaux", obliques: "Obliques", dorsaux: "Grand dorsal", trapezes: "Trapèzes",
  lombaires: "Lombaires", fessiers: "Fessiers", flechisseurs: "Fléchisseurs de hanche", deltoides: "Épaules (deltoïdes)",
  biceps: "Biceps", triceps: "Triceps", "avant-bras": "Avant-bras", quadriceps: "Quadriceps", ischios: "Ischio-jambiers",
  adducteurs: "Adducteurs", mollets: "Mollets", tibial: "Jambier antérieur"
};

function ellipsoide(mat, r) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat);
  m.scale.set(r[0], r[1], r[2]);
  return m;
}

function cone(mat, r1, r2, l) {          // segment effilé le long de -Y, avec des rotules aux deux bouts
  const g = new THREE.Group();
  const c = new THREE.Mesh(new THREE.CylinderGeometry(r2, r1, l, 20), mat); c.position.y = -l / 2; g.add(c);
  const s1 = new THREE.Mesh(new THREE.SphereGeometry(r1, 20, 14), mat); g.add(s1);
  const s2 = new THREE.Mesh(new THREE.SphereGeometry(r2, 20, 14), mat); s2.position.y = -l; g.add(s2);
  return g;
}

const PENTE_DOIGTS = 20;   // degrés : pente de la ligne des jointures (mesurée sur la peau des mannequins réalistes)
export function creerCorps(genre = "homme") {
  const matPeau = new THREE.MeshStandardMaterial({ color: COULEURS.peau, roughness: 0.72 });
  const os = {}, muscles = {};
  const J = (nom, parent, x, y, z) => { const g = new THREE.Group(); g.name = nom; g.position.set(x, y, z); parent.add(g); os[nom] = g; return g; };
  const E = (parent, r, x, y, z) => { const m = ellipsoide(matPeau, r); m.position.set(x, y, z); parent.add(m); return m; };

  const racine = new THREE.Group(); racine.name = "racine"; os.racine = racine;
  const bassin = J("bassin", racine, 0, 0, 0);
  E(bassin, [15, 10, 10.5], 0, -1.5, 0);
  const lomb = J("lomb", bassin, 0, 5, 0);
  E(lomb, [13, 11, 9.5], 0, 7, 0.4);
  const thorax = J("thorax", lomb, 0, 12, 0);
  E(thorax, [16.5, 16, 10.5], 0, 15, 0);
  E(thorax, [18.5, 5.5, 8], 0, 26, -0.5);            // ligne des épaules
  const cou = J("cou", thorax, 0, 30, -0.5);
  const c = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 5.4, 10, 18), matPeau); c.position.y = 4; cou.add(c);
  const tete = J("tete", cou, 0, 8, 0.5);
  E(tete, [8.6, 11, 9.8], 0, 10, 1);
  E(tete, [6.2, 4.5, 6], 0, 3.5, 4);                 // mâchoire
  E(tete, [1.8, 2.2, 1.8], 0, 9.5, 10.6);            // nez : repère de l'orientation du visage

  for (const [cote, s] of [["G", 1], ["D", -1]]) {
    const ep = J("epaule" + cote, thorax, 17 * s, 26, 0);
    ep.add(cone(matPeau, 4.8, 3.9, 29)); os["brasH" + cote] = ep;
    const co = J("coude" + cote, ep, 0, -29, 0);
    co.add(cone(matPeau, 3.9, 2.9, 25)); os["brasB" + cote] = co;
    const po = J("poignet" + cote, co, 0, -25, 0);
    const dj = (MODELES[genre] && MODELES[genre].doigts) || DOIGTS_DEF, i0 = cote === "G" ? 0 : 2;
    // la ligne des jointures du maillage descend de l'auriculaire vers l'index : l'axe de pliage des doigts suit cette pente
    const doi = J("doigts" + cote, po, dj[i0][0] - 17 * s, dj[i0][1] + 11, dj[i0][2]);
    doi.userData.pente = -PENTE_DOIGTS * s * D; doi.rotation.set(0, 0, doi.userData.pente, "ZXY");
    J("phal" + cote, doi, 0, 0, 0).position.set(dj[i0 + 1][0] - dj[i0][0], dj[i0 + 1][1] - dj[i0][1], dj[i0 + 1][2] - dj[i0][2])
      .applyAxisAngle(new THREE.Vector3(0, 0, 1), -doi.userData.pente);
    const pj = (dj[cote === "G" ? 4 : 5] || DOIGTS_DEF[cote === "G" ? 4 : 5]);
    J("pouce" + cote, po, pj[0] - 17 * s, pj[1] + 11, pj[2]);
    E(po, [3.9, 6.5, 1.9], 0, -6.5, 0.4);             // paume et doigts
    E(po, [1.4, 3.6, 1.4], -3.4 * s, -4, 1.6).rotation.z = 0.5 * s;   // pouce
    const ha = J("hanche" + cote, bassin, 9 * s, -4, 0);
    ha.add(cone(matPeau, 7.6, 5.3, 44)); os["cuisse" + cote] = ha;
    const ge = J("genou" + cote, ha, 0, -44, 0);
    ge.add(cone(matPeau, 5.3, 3.6, 43)); os["jambe" + cote] = ge;
    const ch = J("cheville" + cote, ge, 0, -43, 0);
    E(ch, [4.4, 3.6, 12.5], 0, -4.4, 6.5);            // pied
    E(ch, [3.8, 3.4, 4], 0, -4.2, -2.5);              // talon
  }
  for (const [nom, osNom, ctr, r] of MUSCLES) {
    muscles[nom] = [];
    for (const [cote, s] of [["G", 1], ["D", -1]]) {
      const parent = os[osNom + cote] || os[osNom];
      const m = ellipsoide(new THREE.MeshStandardMaterial({ color: COULEURS.muscle, roughness: 0.6 }), r);
      m.position.set(ctr[0] * s, ctr[1], ctr[2]);
      parent.add(m);
      muscles[nom].push(m);
    }
  }
  const k = { racine, os, muscles, matPeau, genre };
  const modele = MODELES[genre];
  if (modele) (modele.athlete ? athlete : peau)(k, modele, genre);
  return k;
}

/* Peau lisse : maillage animé par les os du mannequin (les volumes sont masqués, le squelette et les poses ne changent pas). */
/* Personnages habillés des scènes fixes. Teintes par sommet (3e octet) : 1 short, 2 brassière, puis le visage : 3 blanc de l'œil, 4 iris, 5 pupille, 6 cheveux, 7 sourcils, 8 lèvres. */
const TENUE = { 1: 0x2a2f3a, 2: 0x2a2f3a, 3: 0xeee9e2, 4: 0x5b3a22, 5: 0x101010, 6: 0x2e2119, 7: 0x2e2119, 8: 0xa8625a };
const CHEVEUX = { homme: 0x2e2119, femme: 0x3b2618 };
const VISAGE = 3;            // codes ≥ 3 : le visage, jamais recouvert par l'habit
function attacher(k, g, mat) {
  k.racine.updateMatrixWorld(true);
  k.racine.traverse(o => { if (o.isMesh) o.visible = false; });
  const bones = OS_PEAU.map(n => k.os[n]);
  const squelette = new THREE.Skeleton(bones, bones.map(b => new THREE.Matrix4().copy(b.matrixWorld).invert()));
  const m = new THREE.SkinnedMesh(g, mat);
  m.bindMode = "detached"; m.bind(squelette, new THREE.Matrix4());
  m.frustumCulled = false; m.matrixAutoUpdate = false;
  m.updateMatrixWorld = () => {};            // les os portent déjà la position du corps : la peau reste au repère monde
  m.name = "peau"; k.racine.add(m);
  return m;
}
/* Les doigts du maillage sont modelés écartés : repliés autour d'un seul axe, ils partiraient chacun de leur côté.
   On les resserre une fois, au chargement, vers l'axe de la main, d'autant plus qu'on s'éloigne des jointures (la paume ne bouge pas). */
const SERRER_DOIGTS = 0.3;
function serrerDoigts(g) {
  const P = g.attributes.position, si = g.attributes.skinIndex, sw = g.attributes.skinWeight;
  for (const [os, s] of [[[17, 18], 1], [[19, 20], -1]]) {
    const idx = [];
    for (let i = 0; i < P.count; i++) {
      let bw = 0, o = -1; for (let j = 0; j < 4; j++) { const w = sw.getComponent(i, j); if (w > bw) { bw = w; o = si.getComponent(i, j); } }
      if (os.includes(o)) idx.push(i);
    }
    if (!idx.length) continue;
    const a = -PENTE_DOIGTS * s * D, L = [Math.cos(a), Math.sin(a)], F = [Math.sin(a), -Math.cos(a)];   // ligne des jointures, sens des doigts
    let cx = 0, cy = 0; for (const i of idx) { cx += P.getX(i); cy += P.getY(i); } cx /= idx.length; cy /= idx.length;
    let t0 = Infinity; for (const i of idx) t0 = Math.min(t0, (P.getX(i) - cx) * F[0] + (P.getY(i) - cy) * F[1]);
    for (const i of idx) {
      const dx = P.getX(i) - cx, dy = P.getY(i) - cy, lat = dx * L[0] + dy * L[1], t = dx * F[0] + dy * F[1] - t0;
      const k = SERRER_DOIGTS * Math.min(1, t / 9) * lat;
      P.setXY(i, P.getX(i) - k * L[0], P.getY(i) - k * L[1]);
    }
  }
  P.needsUpdate = true;
}
function peau(k, modele, genre) {
  const g = modele.g.clone();
  if (SERRER_DOIGTS) serrerDoigts(g);
  g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(modele.nv * 3), 3));
  const m = attacher(k, g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0 }));
  Object.assign(k, { peau: m, modele, genre });
  if (genre === "femme") chignon(k);
  teinter(k, { });
}

/* Chignon de la femme (le reste des cheveux est peint sur le crâne) : seulement pour les personnages habillés. */
function chignon(k) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshStandardMaterial({ color: CHEVEUX.femme, roughness: 0.85 }));
  m.scale.set(4.6, 4.2, 4.0);
  m.position.set(0, CHIGNON[1] - 55, CHIGNON[2]);            // repère de l'os de la tête (articulation à y = 55)
  m.name = "chignon"; k.os.tete.add(m); k.chignon = m;
}
const CHIGNON = [0, 73.5, -8.6];

/* Couleur de chaque sommet : peau et habits. */
function teinter(k, habits) {
  const { mus, nv } = k.modele, g = k.peau.geometry, col = g.attributes.color.array, si = g.attributes.skinIndex.array;
  const c = new THREE.Color(), tons = {};
  const ton = hex => tons[hex] || (tons[hex] = new THREE.Color(hex));
  const cheveux = habits.cheveux || CHEVEUX[k.genre];
  for (let i = 0; i < nv; i++) {
    const f = mus[i * 3 + 1] / 255, t = mus[i * 3 + 2];
    if (t >= 6) c.copy(ton(habits.peau ?? COULEURS.peau)).lerp(ton(t === 8 ? TENUE[8] : cheveux), f);
    else if (t >= VISAGE) c.copy(ton(TENUE[t]));
    else c.copy(ton(habits[ZONES[OS_PEAU[si[i * 4]]]] ?? habits.peau ?? COULEURS.peau));
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.attributes.color.needsUpdate = true;
}

/* Corps des exercices : gris satiné à visage neutre. L'anatomie vient de deux cartes cuites par outils/cuire.py (atlas Z-Anatomy) :
   relief.webp (sillons et fibres), zones.png (R = n° de muscle × 10, G = distance au bord, B = short / brassière).
   Chaque muscle s'allume côté par côté : activation[n] = (gauche, droite), de 0 (éteint) à 1 (pleine charge). */
const ATHLETE = { gris: 0x8f949b, tissu: 0x50545c };
function athlete(k, modele, genre) {
  const u = {
    zonesN: { value: modele.zonesN }, zonesL: { value: modele.zonesL }, femme: { value: genre === "femme" ? 1 : 0 }, tissu: { value: new THREE.Color(ATHLETE.tissu) },
    activation: { value: Array.from({ length: MUSCLES.length + 1 }, () => new THREE.Vector2()) },
    teinte: { value: Array.from({ length: MUSCLES.length + 1 }, () => new THREE.Color()) }
  };
  const mat = new THREE.MeshStandardMaterial({ color: ATHLETE.gris, roughness: 0.64, metalness: 0, bumpMap: modele.relief, bumpScale: 1.9, side: THREE.DoubleSide });
  mat.onBeforeCompile = s => {
    Object.assign(s.uniforms, u);
    s.vertexShader = s.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vRepos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRepos = position;");
    s.fragmentShader = s.fragmentShader.replace("#include <common>", `#include <common>
      uniform sampler2D zonesN, zonesL; uniform float femme; uniform vec3 tissu;
      uniform vec2 activation[${MUSCLES.length + 1}]; uniform vec3 teinte[${MUSCLES.length + 1}];
      varying vec3 vRepos; vec3 lueurMuscle;`)
      .replace("#include <color_fragment>", `#include <color_fragment>
      vec3 zl = texture2D(zonesL, vBumpMapUv).rgb;
      int zid = int(texture2D(zonesN, vBumpMapUv).r * 25.5 + 0.5);
      float cav = smoothstep(0.40, 0.56, texture2D(bumpMap, vBumpMapUv).r);
      float enTenue = smoothstep(0.4, 0.6, zl.b) * (vRepos.y >= 10.0 ? femme : 1.0);
      diffuseColor.rgb = mix(diffuseColor.rgb * mix(0.66, 1.04, cav), tissu, enTenue);
      float act = (vRepos.x >= 0.0 ? activation[zid].x : activation[zid].y) * smoothstep(0.02, 0.2, zl.g);
      vec3 tn = teinte[zid];
      // la couleur monte avec l'effort : braise sombre, puis couleur franche, puis cœur du muscle presque incandescent
      diffuseColor.rgb = mix(diffuseColor.rgb, mix(tn * 0.5, tn, smoothstep(0.1, 0.8, act)) * mix(0.55, 1.0, cav) * mix(0.72, 1.0, zl.g), smoothstep(0.0, 0.95, act) * (1.0 - 0.15 * enTenue));
      lueurMuscle = tn * act * act * (0.04 + 0.2 * zl.g) * cav + vec3(1.0, 0.6, 0.3) * pow(act, 4.0) * zl.g * zl.g * 0.05;`)
      .replace("#include <normal_fragment_maps>", "normal = perturbNormalArb(-vViewPosition, normal, dHdxy_fwd() * (1.0 - 0.45 * enTenue), faceDirection);")   // le tissu reste lisse
      .replace("#include <emissivemap_fragment>", "#include <emissivemap_fragment>\ntotalEmissiveRadiance += lueurMuscle;")
      .replace("#include <opaque_fragment>", `// liseré froid de contour : détache le corps du fond sombre
      outgoingLight += vec3(0.42, 0.52, 0.72) * pow(1.0 - saturate(dot(normal, normalize(vViewPosition))), 3.2) * 0.55;
      #include <opaque_fragment>`);
  };
  const m = attacher(k, modele.g.clone(), mat);
  Object.assign(k, { peau: m, modele, genre, uniformes: u });
  yeuxNeutres(k, modele.yeux);
}

/* Yeux dans le gris du corps : blanc clair, iris et pupille sombres. Attachés à l'os de la tête (articulation au repos à y = 55). */
const GEO_OEIL = (() => {
  const g = new THREE.SphereGeometry(1, 28, 20); g.rotateX(Math.PI / 2);            // pôle vers l'avant (+Z)
  const p = g.attributes.position, col = new Float32Array(p.count * 3), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const a = Math.acos(Math.max(-1, Math.min(1, p.getZ(i))));
    c.setHex(a < 0.22 ? 0x121316 : a < 0.5 ? 0x3d4148 : 0xc9ccd0).toArray(col, i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
})();
function yeuxNeutres(k, y) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.3 });
  for (const i of [0, 4]) {
    const m = new THREE.Mesh(GEO_OEIL, mat);
    m.position.set(y[i], y[i + 1] - 55, y[i + 2]); m.scale.setScalar(y[i + 3]);
    m.name = "oeil"; k.os.tete.add(m);
  }
}

/* Applique une pose : racine, colonne, membres en angles (fk) ou en cible (ik). */
function setEuler(g, rx, ry, rz, ordre = "ZXY") { g.rotation.set(rx * D, ry * D, rz * D, ordre); }

export function poser(corps, pose) {
  const { os, racine } = corps;
  for (const k in os) if (k !== "racine" && os[k].isGroup) os[k].rotation.set(0, 0, 0);
  const r = pose.racine || {};
  const p = r.p || [0, 99, 0], ro = r.r || [0, 0, 0];
  racine.position.set(p[0], p[1], p[2]);
  racine.rotation.set(ro[0] * D, ro[1] * D, ro[2] * D, "YXZ");
  if (r.tour) racine.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), r.tour * D)); // rouler sur l'axe du corps
  const col = pose.colonne || {};
  for (const n of ["lomb", "thorax", "cou"]) {
    const a = col[n] || {}, L = LIMITES[n];
    setEuler(os[n], borne(a.flex || 0, L.flex), borne(a.rot || 0, L.rot), -borne(a.lat || 0, L.lat));
  }
  racine.updateMatrixWorld(true);
  for (const [cote, s] of [["G", 1], ["D", -1]]) {
    membre(corps, "bras", cote, s, (pose.bras || {})[cote] || {});
    membre(corps, "jambe", cote, s, (pose.jambes || {})[cote] || {});
  }
  racine.updateMatrixWorld(true);
}

function membre(corps, type, cote, s, m) {
  const { os } = corps;
  if (m.fondu) {                   // d'une pose en cible (ik) à une pose en angles : fondu des rotations, sans à-coup
    const noms = (type === "bras" ? ["epaule", "coude", "poignet", "doigts", "phal", "pouce"] : ["hanche", "genou", "cheville"]).map(n => os[n + cote]);
    membre(corps, type, cote, s, m.fondu[0]);
    const q = noms.map(o => o.quaternion.clone());
    membre(corps, type, cote, s, m.fondu[1]);
    noms.forEach((o, i) => o.quaternion.slerp(q[i], 1 - m.fondu[2]));
    return;
  }
  const bras = type === "bras";
  const haut = os[(bras ? "epaule" : "hanche") + cote], milieu = os[(bras ? "coude" : "genou") + cote], bout = os[(bras ? "poignet" : "cheville") + cote];
  const Lh = bras ? LIMITES.epaule : LIMITES.hanche;
  if (m.ik) {
    ik(haut, milieu, m.ik, m.pole || (bras ? [0, -1, -1] : [0, 0, 1]), bras ? 29 : 44, bras ? 25 : 43, bras ? -1 : 1);
    if (bras) milieu.rotation.y = torsion(m, s);
  } else {
    const f = m.fk || {};
    const flex = borne(f.flex || 0, Lh.flex), abd = borne(f.abd || 0, Lh.abd), rot = borne(f.rot || 0, Lh.rot);
    setEuler(haut, -flex, rot * s, abd * s);
    const fl = borne(m[bras ? "coude" : "genou"] || 0, (bras ? LIMITES.coude : LIMITES.genou).flex);
    milieu.rotation.set(bras ? -fl * D : fl * D, bras ? torsion(m, s) : 0, 0);
  }
  // paume vers le bas (un peu tournée vers le corps) quand l'exercice n'impose ni la main ni la rotation de l'avant-bras
  // m.paume : direction voulue de la paume dans le monde (côté gauche ; x inversé à droite), dans les limites d'un vrai avant-bras
  if (bras && !m.main && m.prono === undefined) m = { ...m, auto: !m.paume, prono: pronoNaturel(haut, milieu, bout, s, borne(m.poignet || 0, LIMITES.poignet.flex), m.paume) };
  if (bras) milieu.rotation.y = torsion(m, s);
  haut.updateMatrixWorld(true);
  // bout : orientation monde imposée (main à plat, pied à plat) ou angle relatif
  const o = bras ? m.main : m.pied;
  if (o) {
    const voulu = new THREE.Quaternion().setFromEuler(new THREE.Euler(o[0] * D, o[1] * D, o[2] * D, "YXZ"));
    const parent = new THREE.Quaternion(); bout.parent.getWorldQuaternion(parent);
    bout.quaternion.copy(parent.invert().multiply(voulu));
  } else {
    const a = borne(m[bras ? "poignet" : "cheville"] || 0, (bras ? LIMITES.poignet : LIMITES.cheville).flex);
    bout.rotation.set(-a * D, bras ? torsion(m, s) : 0, 0, "YXZ");
  }
  if (bras) {                       // doigts : 0 = tendus, 90 = repliés (poing, prise de barre)
    os["doigts" + cote].rotation.set(-borne(m.doigts || 0, LIMITES.doigts) * D, 0, os["doigts" + cote].userData.pente || 0, "ZXY");
    os["phal" + cote].rotation.x = -borne(m.phal ?? m.doigts ?? 0, LIMITES.phal) * D;
    const pc = borne(m.pouce ?? (m.doigts || 0) * 0.8, LIMITES.doigts) * D;          // le pouce se replie devant la paume
    os["pouce" + cote].rotation.set(-0.72 * pc, -0.86 * pc * s, -1.15 * pc * s);         // le bout du pouce vient sur les doigts repliés (rotation cherchée sur la peau)
  }
}
const torsion = (m, s) => -borne(m.prono || 0, m.auto ? [-180, 180] : LIMITES.prono) * s * 0.5 * D;

/* Rotation de l'avant-bras qui tourne la paume le plus possible vers le sol (et un peu vers le corps, bras pendants).
   Normale de la paume dans le repère du poignet : (0, 0, +1), la même des deux côtés (les doigts se replient vers +Z) :
   au repos la paume regarde devant ; bras tendus devant sans rotation, elle regarde le plafond. Il faut donc jusqu'à
   un demi-tour, réparti entre le coude et le poignet ; à score égal, on garde la plus petite rotation. */
const _q = new THREE.Quaternion(), _n = new THREE.Vector3(), _c = new THREE.Vector3();
function pronoNaturel(haut, milieu, bout, s, flexPoignet, paume) {
  if (paume) _c.set(paume[0] * s, paume[1], paume[2]).normalize(); else _c.set(-0.35 * s, -1, 0).normalize();
  let meilleur = paume ? 90 : 0, score = -9;
  const [p0, p1] = paume ? LIMITES.prono : [-180, 180];
  for (let p = p0; p <= p1; p += 6) {
    const t = -p * s * 0.5 * D;
    milieu.rotation.y = t;
    bout.rotation.set(-flexPoignet * D, t, 0, "YXZ");
    haut.updateMatrixWorld(true);
    bout.getWorldQuaternion(_q);
    const v = _n.set(0, 0, 1).applyQuaternion(_q).dot(_c) - Math.abs(p) * 2e-4;
    if (v > score) { score = v; meilleur = p; }
  }
  // sommet affiné entre trois essais : sans ça, l'avant-bras avance par sauts de 6°
  const essai = p => { const t = -p * s * 0.5 * D; milieu.rotation.y = t; bout.rotation.set(-flexPoignet * D, t, 0, "YXZ"); haut.updateMatrixWorld(true); bout.getWorldQuaternion(_q); return _n.set(0, 0, 1).applyQuaternion(_q).dot(_c) - Math.abs(p) * 2e-4; };
  const a = essai(meilleur - 6), b = essai(meilleur), c = essai(meilleur + 6), den = a - 2 * b + c;
  return den < -1e-9 ? meilleur + 3 * (a - c) / den : meilleur;
}

/* Cinématique inverse à deux os. pliage : -1 = l'os du bas part vers +Z local (coude), +1 = vers -Z local (genou). */
function ik(haut, milieu, cible, pole, a, b, pliage) {
  const S = new THREE.Vector3(); haut.getWorldPosition(S);
  const T = new THREE.Vector3(...cible);
  const ST = T.clone().sub(S);
  let c = ST.length();
  c = Math.min(c, a + b - 0.01); c = Math.max(c, Math.abs(a - b) + 0.01);
  const dir = ST.normalize();
  const P = new THREE.Vector3(...pole).normalize();
  const perp = P.sub(dir.clone().multiplyScalar(P.dot(dir)));
  if (perp.lengthSq() < 1e-6) perp.set(0, 0, 1);
  perp.normalize();
  const alpha = Math.acos(Math.max(-1, Math.min(1, (a * a + c * c - b * b) / (2 * a * c))));
  const E = S.clone().add(dir.clone().multiplyScalar(a * Math.cos(alpha))).add(perp.clone().multiplyScalar(a * Math.sin(alpha)));
  const d = E.clone().sub(S).normalize();             // direction de l'os du haut
  const Tf = S.clone().add(dir.clone().multiplyScalar(c));
  const f = Tf.clone().sub(E).normalize();             // direction de l'os du bas
  const Y = d.clone().negate();
  let Z = f.clone().sub(d.clone().multiplyScalar(f.dot(d)));
  if (Z.lengthSq() < 1e-8) Z = perp.clone().multiplyScalar(-1);
  Z.normalize();
  if (pliage > 0) Z.negate();
  const X = new THREE.Vector3().crossVectors(Y, Z).normalize();
  Z = new THREE.Vector3().crossVectors(X, Y).normalize();
  const qMonde = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(X, Y, Z));
  const qParent = new THREE.Quaternion(); haut.parent.getWorldQuaternion(qParent);
  haut.quaternion.copy(qParent.invert().multiply(qMonde));
  const angle = Math.acos(Math.max(-1, Math.min(1, d.dot(f)))) / D;
  milieu.rotation.set((pliage > 0 ? angle : -angle) * D, 0, 0);
}

/* Habillage pour les images fixes : couleur du haut, du bas, de la peau, des chaussures ; muscles masqués ; cheveux. */
const ZONES = { bassin: "bas", hancheG: "bas", hancheD: "bas", genouG: "bas", genouD: "bas", lomb: "haut", thorax: "haut",
  epauleG: "haut", epauleD: "haut", coudeG: "haut", coudeD: "haut", cou: "peau", tete: "peau", poignetG: "mains", poignetD: "mains",
  chevilleG: "chaussures", chevilleD: "chaussures" };
export function habiller(corps, h) {
  if (corps.peau) {
    teinter(corps, h);              // les cheveux sont peints sur la tête (couleur h.cheveux)
    if (corps.chignon && h.cheveux) corps.chignon.material.color.setHex(h.cheveux);
    return;
  }
  const muscles = new Set(Object.values(corps.muscles).flat());
  const mats = {};
  const mat = z => mats[z] || (mats[z] = new THREE.MeshStandardMaterial({ color: h[z] ?? h.peau ?? COULEURS.peau, roughness: 0.8 }));
  for (const [nom, zone] of Object.entries(ZONES)) {
    const os = corps.os[nom];
    const peindre = o => { for (const c of o.children) { if (muscles.has(c)) { c.visible = !!h.muscles; continue; } if (c.isMesh) c.material = mat(zone); else if (!c.name) peindre(c); } };
    peindre(os);
  }
  if (h.cheveux) {
    const m = new THREE.MeshStandardMaterial({ color: h.cheveux, roughness: 0.9 });
    const calotte = ellipsoide(m, [9.4, 8.6, 10.4]); calotte.position.set(0, 12.5, -0.6); corps.os.tete.add(calotte);
    const chignon = ellipsoide(m, [4.6, 4.6, 4.6]); chignon.position.set(0, 13, -10); corps.os.tete.add(chignon);
  }
}

/* Couleurs des muscles selon l'exercice. */
export function colorer(corps, principaux = [], secondaires = [], erreur = []) {
  if (corps.uniformes) {
    const teinte = corps.uniformes.teinte.value, activation = corps.uniformes.activation.value;
    for (const [i, m] of MUSCLES.entries()) {
      const n = m[0], c = erreur.includes(n) ? COULEURS.erreur : principaux.includes(n) ? COULEURS.principal : secondaires.includes(n) ? COULEURS.secondaire : null;
      if (c) teinte[i + 1].setHex(c);
      activation[i + 1].set(c ? 1 : 0, c ? 1 : 0);
    }
    return;
  }
  for (const nom in corps.muscles) {
    const c = erreur.includes(nom) ? COULEURS.erreur : principaux.includes(nom) ? COULEURS.principal : secondaires.includes(nom) ? COULEURS.secondaire : COULEURS.muscle;
    for (const m of corps.muscles[nom]) {
      m.material.color.setHex(c);
      m.material.emissive.setHex(c === COULEURS.muscle ? 0x000000 : c);
      m.material.emissiveIntensity = c === COULEURS.muscle ? 0 : 0.18;
    }
  }
}

/* Intensité de chaque muscle allumé (lecteur d'exercices). */
export function allumer(corps, nom, g, d) {
  if (corps.uniformes) corps.uniformes.activation.value[MUSCLES.findIndex(m => m[0] === nom) + 1].set(g, d);
}

/* Accessoires simples. */
export function accessoire(type, o = {}) {
  const mat = new THREE.MeshStandardMaterial({ color: o.couleur || COULEURS.accessoire, roughness: 0.8 });
  const bois = new THREE.MeshStandardMaterial({ color: COULEURS.bois, roughness: 0.85 });
  const g = new THREE.Group();
  const boite = (w, h, d, x, y, z, m = mat) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); g.add(b); return b; };
  if (type === "chaise") {           // assise à 45 cm
    boite(42, 4, 40, 0, 45, 0, bois);
    for (const [x, z] of [[-18, -17], [18, -17], [-18, 17], [18, 17]]) boite(3, 43, 3, x, 21.5, z);
    boite(42, 40, 3, 0, 67, -19, bois);
  } else if (type === "table") {     // plateau à 75 cm
    boite(o.l || 90, 4, o.p || 70, 0, 73, 0, bois);
    const lx = (o.l || 90) / 2 - 5, lz = (o.p || 70) / 2 - 5;
    for (const [x, z] of [[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]]) boite(5, 71, 5, x, 35.5, z);
  } else if (type === "barre") {     // barre de traction
    const h = o.h || 215, l = o.l || 120;
    const barre = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, l, 16), mat); barre.rotation.z = Math.PI / 2; barre.position.y = h; g.add(barre);
    for (const x of [-l / 2, l / 2]) boite(5, h + 5, 5, x, (h + 5) / 2, 0);
  } else if (type === "marche") {    // marche de 18 cm
    boite(o.l || 70, o.h || 18, o.p || 30, 0, (o.h || 18) / 2, 0, bois);
  } else if (type === "mur") {
    boite(o.l || 160, o.h || 200, 6, 0, (o.h || 200) / 2, 0, new THREE.MeshStandardMaterial({ color: 0xe9e6df, roughness: 0.95 }));
  } else if (type === "ecran") {     // écran de présentation avec une courbe qui monte
    boite(o.l || 120, o.h || 70, 3, 0, o.y || 150, 0, new THREE.MeshStandardMaterial({ color: 0xf6f0e2, roughness: 0.9 }));
    const pts = [[-45, -20], [-20, -5], [0, -10], [22, 12], [45, 22]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1], l = Math.hypot(x2 - x1, y2 - y1);
      const b = boite(l, 3.5, 2, (x1 + x2) / 2, (o.y || 150) + (y1 + y2) / 2, 2.5, new THREE.MeshStandardMaterial({ color: 0xb23a24 }));
      b.rotation.z = Math.atan2(y2 - y1, x2 - x1);
    }
    boite(4, (o.y || 150) - 35, 4, 0, ((o.y || 150) - 35) / 2, -4);
  } else if (type === "pave") {      // petit objet : compresse, téléphone
    boite(o.l || 10, o.h || 2, o.p || 6, 0, (o.h || 2) / 2, 0);
  } else if (type === "gourde") {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 20, 20), mat); c.position.y = 10; g.add(c);
    const b = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 4, 12), mat); b.position.y = 22; g.add(b);
  } else if (type === "filet") {    // filet d'eau de a à b
    const a = new THREE.Vector3(...o.a), b = new THREE.Vector3(...o.b), l = a.distanceTo(b);
    const r = o.r || 0.9;          // eau : filet fin et clair, à peine translucide
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.5, l, 12), new THREE.MeshPhysicalMaterial({ color: 0x8cc4e4, transparent: true, opacity: 0.7, roughness: 0.05, clearcoat: 1 }));
    c.position.copy(a.clone().add(b).multiplyScalar(0.5)); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); g.add(c);
  } else if (type === "banc") {      // banc de musculation, assise à 45 cm ; o.dossier : angle du dossier en degrés (0 = à plat)
    const cuir = new THREE.MeshStandardMaterial({ color: 0x2b2f35, roughness: 0.6 }), l = o.l || 120;
    if (o.dossier) {
      boite(28, 7, 40, 0, 44, -l / 2 + 20, cuir);                                            // assise
      const d = boite(28, 7, l - 40, 0, 0, 0, cuir), a = o.dossier * D;                          // dossier qui pivote au bout de l'assise
      d.position.set(0, 44 + Math.sin(a) * (l - 40) / 2, -l / 2 + 40 + Math.cos(a) * (l - 40) / 2); d.rotation.x = -a;
      boite(5, 40, 5, 0, 20, -l / 2 + 40 + Math.cos(a) * (l - 40) * 0.6);
    } else boite(28, 7, l, 0, 44, 0, cuir);
    for (const z of [-l / 2 + 12, l / 2 - 12]) { boite(5, 40, 5, 0, 20, z); boite(40, 4, 6, 0, 2, z); }
  } else if (type === "haltere" || type === "barre-olympique") {  // poids tenus en main : le lecteur les replace à chaque image (o.main)
    const acier = new THREE.MeshStandardMaterial({ color: 0xb9c0c7, roughness: 0.35, metalness: 0.8 });
    const fonte = new THREE.MeshStandardMaterial({ color: 0x1f2328, roughness: 0.7 });
    const cyl = (r, l, x, m) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, l, 24), m); c.rotation.z = Math.PI / 2; c.position.x = x; g.add(c); };
    if (type === "haltere") { cyl(1.6, 30, 0, acier); for (const x of [-11, 11]) cyl(o.r || 7, 6, x, fonte); }
    else if (o.baton) cyl(1.4, o.l || 150, 0, new THREE.MeshStandardMaterial({ color: 0xb08850, roughness: 0.8 }));   // bâton d'étirement : sans disques
    else { cyl(1.4, o.l || 200, 0, acier); for (const x of [-1, 1]) { cyl(2.5, 40, x * 80, acier); cyl(o.r || 22, 6, x * 68, fonte); cyl((o.r || 22) * 0.8, 4, x * 73, fonte); } }
  } else if (type === "poulie") {    // colonne de poulie : o.h hauteur du point d'accroche
    const h = o.h || 210;
    boite(8, h + 10, 8, 0, (h + 10) / 2, 0); boite(60, 4, 50, 0, 2, 0);
    boite(16, 30, 12, 0, 25, 0, new THREE.MeshStandardMaterial({ color: 0x1f2328, roughness: 0.7 }));       // pile de disques
    const bras = o.bras || 0;         // potence horizontale vers +Z (tirage vertical) : la roue est au bout
    if (bras) boite(6, 6, bras, 0, h, bras / 2);
    const r = new THREE.Mesh(new THREE.CylinderGeometry(5, 5, 3, 20), mat); r.rotation.z = Math.PI / 2; r.position.set(0, (o.y ?? h) - (bras ? 6 : 0), bras || 6); g.add(r);
  } else if (type === "cable") {     // câble de poulie ou levier (o.r) : de o.de (monde) jusqu'à la main, recalculé à chaque image par le lecteur
    const c = new THREE.Mesh(new THREE.CylinderGeometry(o.r || 0.5, o.r || 0.5, 1, 8), o.couleur ? new THREE.MeshStandardMaterial({ color: o.couleur, roughness: 0.6 })   // élastique coloré
      : o.r ? mat : new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: 0.5 }));
    c.name = "fil"; g.add(c);
    if (o.poignee) { const p = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, o.poignee, 16), mat); p.rotation.z = Math.PI / 2; p.name = "poignee"; g.add(p); }
  } else if (type === "machine") {   // machine de salle décrite pièce par pièce : { b: [l, h, p] ou c: [rayon, longueur], p: [x, y, z], r: [rx, ry, rz] en degrés, m }
    const MATS = { cadre: mat, cuir: new THREE.MeshStandardMaterial({ color: 0x2b2f35, roughness: 0.6 }),
      fonte: new THREE.MeshStandardMaterial({ color: 0x1f2328, roughness: 0.7 }), acier: new THREE.MeshStandardMaterial({ color: 0xb9c0c7, roughness: 0.35, metalness: 0.8 }) };
    for (const q of o.pieces || []) {
      const m = new THREE.Mesh(q.b ? new THREE.BoxGeometry(...q.b) : new THREE.CylinderGeometry(q.c[0], q.c[0], q.c[1], 20), MATS[q.m || "cadre"]);
      m.position.set(...(q.p || [0, 0, 0]));
      if (q.r) m.rotation.set(q.r[0] * D, q.r[1] * D, q.r[2] * D, "YXZ");
      g.add(m);
    }
  } else if (type === "tapis") {
    boite(o.l || 70, 1, o.p || 180, 0, 0.5, 0, new THREE.MeshStandardMaterial({ color: o.couleur || 0x6f8a7a, roughness: 0.95 }));
  }
  if (o.main || o.suit) g.userData = { type, main: o.main, suit: o.suit, de: o.de, decal: o.decal, perp: o.perp };   // pièce mobile : le lecteur la replace à chaque image
  if (o.rx) g.rotation.x = o.rx * D;
  if (o.p0) g.position.set(...o.p0);
  if (o.ry) g.rotation.y = o.ry * D;
  if (o.rz) g.rotation.z = o.rz * D;
  return g;
}

/* Pièces mobiles : haltères, barre, câbles, poignées et boudins de machine suivent une partie du corps.
   main : centre du poing (G, D ou "2" pour les deux) ; suit : liste d'os (ou "poingG") dont on prend le milieu ; decal : décalage monde. */
const AXE_X = new THREE.Vector3(1, 0, 0), AXE_Y = new THREE.Vector3(0, 1, 0);
const pos = (corps, n, v = new THREE.Vector3()) => corps.os[n].getWorldPosition(v);
const _qp = new THREE.Quaternion(), _v = new THREE.Vector3();
/* Prise : la poignée passe au centre des doigts repliés, dans l'axe où ils s'alignent (de l'index à l'auriculaire).
   Calculé sur la peau réelle (points rattachés aux os des doigts) : le maillage de la main ne suit pas exactement le repère
   de ses os. Sans peau (mannequin simplifié) : près des jointures, décalé vers la paume. */
const OS_DOIGTS = { G: [17, 18], D: [19, 20] };          // doigtsX, phalX dans l'ordre des os de la peau (corps.js)
function pointsDoigts(corps, c) {
  const p = corps.peau; if (!p) return null;
  const cache = p.userData.doigts || (p.userData.doigts = {});
  if (!cache[c]) {
    const si = p.geometry.attributes.skinIndex, sw = p.geometry.attributes.skinWeight, liste = [];
    for (let i = 0; i < si.count; i++) {
      let best = 0, os = -1;
      for (let j = 0; j < 4; j++) { const w = sw.getComponent(i, j); if (w > best) { best = w; os = si.getComponent(i, j); } }
      if (OS_DOIGTS[c].includes(os)) liste.push(i);
    }
    const pas = Math.max(1, Math.floor(liste.length / 120));
    cache[c] = liste.filter((_, k) => k % pas === 0);
  }
  return cache[c].length ? cache[c] : null;
}
function prise(corps, c) {
  const idx = pointsDoigts(corps, c);
  if (!idx) return null;
  const pts = idx.map(i => corps.peau.getVertexPosition(i, new THREE.Vector3()));
  const m = pts.reduce((a, b) => a.add(b), new THREE.Vector3()).multiplyScalar(1 / pts.length);
  const C = [0, 0, 0, 0, 0, 0];                          // covariance (xx, xy, xz, yy, yz, zz)
  for (const q of pts) { const x = q.x - m.x, y = q.y - m.y, z = q.z - m.z; C[0] += x * x; C[1] += x * y; C[2] += x * z; C[3] += y * y; C[4] += y * z; C[5] += z * z; }
  let a = new THREE.Vector3(1, 0, 0).applyQuaternion(corps.os["poignet" + c].getWorldQuaternion(_qp));   // départ : jointures du squelette
  for (let k = 0; k < 12; k++) a = new THREE.Vector3(C[0] * a.x + C[1] * a.y + C[2] * a.z, C[1] * a.x + C[3] * a.y + C[4] * a.z, C[2] * a.x + C[4] * a.y + C[5] * a.z).normalize();
  return { centre: m, axe: a };
}
const poing = (corps, c) => prise(corps, c)?.centre || pos(corps, "poignet" + c).lerp(pos(corps, "doigts" + c), 0.8).add(_v.set(0, 0, 2.6).applyQuaternion(corps.os["poignet" + c].getWorldQuaternion(_qp)));
function point(corps, u) {
  const liste = u.main ? (u.main === "2" ? ["poingG", "poingD"] : ["poing" + u.main]) : u.suit;
  const p = liste.map(n => n.startsWith("poing") ? poing(corps, n.slice(5)) : pos(corps, n)).reduce((a, b) => a.add(b)).multiplyScalar(1 / liste.length);
  if (u.decal) p.add(new THREE.Vector3(...u.decal));
  if (u.perp) {                    // perp : [os A, os B, d] : à d cm du segment A→B, vers l'avant de ce segment (le dessus d'une jambe tendue)
    const [a, b, dd] = u.perp, d = Array.isArray(dd) ? dd[corps.genre === "femme" ? 1 : 0] : dd, dir = pos(corps, b).sub(pos(corps, a)).normalize();   // d ou [homme, femme]
    p.add(new THREE.Vector3(1, 0, 0).cross(dir).normalize().multiplyScalar(-d));
  }
  return p;
}
export function suivreAccessoires(corps, groupe) {
  for (const g of groupe.children) {
    const u = g.userData; if (!u.main && !u.suit) continue;
    const p = point(corps, u);
    if (u.de) {                      // câble ou levier : du point fixe à la pièce mobile
      const a = new THREE.Vector3(...u.de), f = g.getObjectByName("fil"), poi = g.getObjectByName("poignee");
      f.position.copy(a).add(p).multiplyScalar(0.5); f.scale.set(1, a.distanceTo(p), 1);
      f.quaternion.setFromUnitVectors(AXE_Y, p.clone().sub(a).normalize());
      if (poi) {
        poi.position.copy(p);
        if (u.main === "2") {          // barre ou corde tenue à deux mains : d'une main à l'autre, un peu plus large
          const ab = poing(corps, "G").sub(poing(corps, "D")), l = ab.length();
          poi.quaternion.setFromUnitVectors(AXE_Y, ab.normalize()); poi.scale.set(1, (l + 10) / poi.geometry.parameters.height, 1);
        }
      }
      continue;
    }
    g.position.copy(p);
    if (!u.main) continue;           // boudin, plateau : orientation fixe
    const axe = u.main === "2" ? poing(corps, "G").sub(poing(corps, "D"))
      : (prise(corps, u.main)?.axe || new THREE.Vector3(1, 0, 0).applyQuaternion(corps.os["poignet" + u.main].getWorldQuaternion(new THREE.Quaternion())));  // ligne des doigts
    if (axe.lengthSq() > 1e-6) g.quaternion.setFromUnitVectors(AXE_X, axe.normalize());
  }
}

/* Interpolation de deux poses de même structure (nombres et tableaux). */
export function melanger(a, b, t) {
  if (typeof a === "number") return a + (b - a) * t;
  if (Array.isArray(a)) return a.map((x, i) => melanger(x, b[i], t));
  if (a && typeof a === "object") {
    const o = {};
    for (const k of new Set([...Object.keys(a), ...Object.keys(b || {})])) {
      if (!(k in a)) o[k] = b[k]; else if (!b || !(k in b)) o[k] = a[k]; else o[k] = melanger(a[k], b[k], t);
    }
    return o;
  }
  return t < 0.5 ? a : b;
}
export const doux = t => t * t * (3 - 2 * t);

/* Courbe continue entre 4 images clés (cubique d'Hermite monotone) : le mouvement passe par chaque pose sans s'y
   arrêter, et ne dépasse jamais les valeurs voisines (pas de genou qui « rebondit » au-delà de la pose voulue).
   h0, h1, h2 : durées des segments P0→P1, P1→P2, P2→P3. Une valeur qui ne se répète pas d'une pose à l'autre est
   mélangée comme avant. */
function pente(a, b, c, h0, h1) {
  const d0 = (b - a) / h0, d1 = (c - b) / h1;
  return d0 * d1 <= 0 ? 0 : 3 * (h0 + h1) / ((2 * h1 + h0) / d0 + (h1 + 2 * h0) / d1);
}
function hermite(p0, p1, p2, p3, h0, h1, h2, t) {
  if ([p0, p2, p3].some(v => typeof v !== "number")) return melanger(p1, p2, doux(t));
  const m1 = pente(p0, p1, p2, h0, h1) * h1, m2 = pente(p1, p2, p3, h1, h2) * h1;
  const t2 = t * t, t3 = t2 * t;
  return (2 * t3 - 3 * t2 + 1) * p1 + (t3 - 2 * t2 + t) * m1 + (-2 * t3 + 3 * t2) * p2 + (t3 - t2) * m2;
}
function courbe(p0, p1, p2, p3, h0, h1, h2, t) {
  if (p1 && p2 && typeof p1 === "object" && !Array.isArray(p1) && ("ik" in p1) !== ("ik" in p2) && ("ik" in p1 || "fk" in p1 || "coude" in p1 || "genou" in p1)) return { fondu: [p1, p2, doux(t)] };
  if (typeof p1 === "number") return hermite(p0, p1, p2, p3, h0, h1, h2, t);
  if (Array.isArray(p1)) return Array.isArray(p2) && p2.length === p1.length
    ? p1.map((x, i) => courbe(p0?.[i], x, p2[i], p3?.[i], h0, h1, h2, t)) : melanger(p1, p2, doux(t));
  if (p1 && typeof p1 === "object" && p2 && typeof p2 === "object") {
    const o = {};
    for (const k of new Set([...Object.keys(p1), ...Object.keys(p2)])) {
      if (!(k in p1)) o[k] = p2[k]; else if (!(k in p2)) o[k] = p1[k];
      else o[k] = courbe(p0?.[k], p1[k], p2[k], p3?.[k], h0, h1, h2, t);
    }
    return o;
  }
  return melanger(p1, p2, doux(t));
}

/* Pose au temps u (0..1) d'une suite d'images clés [{t, ...pose}] qui boucle. */
export function poseA(cles, u) {
  u = ((u % 1) + 1) % 1;
  const n = cles.length;
  if (n === 1) return cles[0];
  let i = 0;
  while (i < n - 1 && cles[i + 1].t <= u) i++;
  const k = j => cles[((j % n) + n) % n];
  const tk = j => cles[((j % n) + n) % n].t + Math.floor(j / n);           // temps « déroulés » sur la boucle
  const t1 = tk(i), t2 = tk(i + 1) > t1 ? tk(i + 1) : tk(i + 1) + 1;
  const h1 = t2 - t1, h0 = Math.max(1e-3, t1 - (tk(i - 1) < t1 ? tk(i - 1) : tk(i - 1) - 1)), h2 = Math.max(1e-3, (tk(i + 2) > t2 ? tk(i + 2) : tk(i + 2) + 1) - t2);
  const uu = u < t1 ? u + 1 : u;
  const t = h1 > 0 ? Math.max(0, Math.min(1, (uu - t1) / h1)) : 0;
  return courbe(k(i - 1), k(i), k(i + 1), k(i + 2), h0, h1, h2, t);
}
