/* L'Atelier : exercices animés. Positions en cm (sol y = 0), le mannequin regarde +Z, sa gauche est +X.
   Chaque exercice : durée d'une répétition (s), images clés (t de 0 à 1, la dernière rejoint la première),
   muscles principaux (p) et secondaires (s), étapes du tempo, et une version « erreur » à comparer.
   Les appuis (mains, pieds) sont donnés en position monde : la cinématique inverse calcule coudes et genoux. */

const D = Math.PI / 180;
const copie = o => JSON.parse(JSON.stringify(o));
const sin = a => Math.sin(a * D), cos = a => Math.cos(a * D);

/* Morceaux de poses réutilisés */
const MAIN_SOL = [90, 180, 0];            // main à plat, doigts vers l'avant, paume au sol
const PIED_PLAT = (lacet = 0) => [0, lacet, 0];
const PIED_ORTEILS = [110, 0, 0];         // sur la pointe, talon vers le ciel (planche, pompe)
const PIED_TALON = [-70, 0, 0];           // sur le talon, orteils vers le ciel (rowing)
const POING = { prono: 90, doigts: 50, phal: 65 };   // course : main souple à demi fermée, pouce vers le haut
const bras2 = (g, d = null) => ({ G: g, D: d || miroir(g) });
const jambes2 = (g, d = null) => ({ G: g, D: d || miroir(g) });
function miroir(m) {                       // même réglage de l'autre côté : on inverse x des cibles et des pôles
  const o = copie(m);
  if (o.ik) o.ik[0] = -o.ik[0];
  if (o.pole) o.pole[0] = -o.pole[0];
  if (o.pied) o.pied[1] = -o.pied[1];
  return o;
}
const col = (lomb = 0, thorax = 0, cou = 0, rot = 0) => ({ lomb: { flex: lomb, rot: rot / 2 }, thorax: { flex: thorax, rot: rot / 2 }, cou: { flex: cou } });

/* Corps rigide en appui sur la pointe des pieds ou les genoux (planche, pompe) :
   épaules à la hauteur hs, appui (cheville ou genou) à la hauteur ha, à la distance L le long du corps. */
function appui(hs, ha, Lepaule, Lappui, zAppui) {
  const th = Math.asin((hs - ha) / (Lepaule + Lappui)) / D;
  const yb = ha + Lappui * sin(th), zb = zAppui + Lappui * cos(th);
  return { pitch: 90 - th, y: yb, z: zb, ys: yb + Lepaule * sin(th), zs: zb + Lepaule * cos(th) };
}

import { RECALAGE } from "./recalage.js";
import { ECARTS } from "./ecarts.js";

export const EXERCICES = {};
const E = (id, def) => { EXERCICES[id] = def; return def; };

/* ---------- GAINAGE ---------- */
{ // Planche sur les avant-bras
  // épaules 33 cm au-dessus du sol (bras vertical sur le coude), pointe des pieds 80 cm derrière
  const P = (hs, lomb, cou, t, affaisse = 0) => {
    const a = appui(hs, 12, 43, 91, -84);
    return { t, racine: { p: [0, a.y - affaisse, a.z], r: [a.pitch - affaisse * 0.3, 0, 0] }, colonne: col(lomb, 0, cou),
      bras: bras2({ ik: [15, 4, a.zs + 23], pole: [0.1, -1, -0.4], main: MAIN_SOL }),
      jambes: jambes2({ ik: [10, 12, -84], pole: [0, -1, 0], pied: PIED_ORTEILS }) };
  };
  E("planche", {
    nom: "Planche ventrale", duree: 4, reps: 1, affiche: 0.25, vue: "profil",
    camera: { cible: [0, 24, 0], dist: 300, el: 5 }, ombre: [0, 5, 70, 220], accessoires: [{ type: "tapis", p0: [0, 0, 5] }],
    muscles: { p: ["abdominaux", "obliques"], s: ["deltoides", "fessiers", "quadriceps", "pectoraux"] },
    tempo: [[0, "Tenir · respirer normalement"]],
    cles: [P(33, 0, -8, 0), P(33.4, 0, -8, 0.5)],
    erreur: { texte: "le bassin s'affaisse : le bas du dos se creuse et encaisse à la place des abdominaux.", zone: ["lombaires"],
      cles: [P(33, -18, -20, 0, 6), P(33.3, -18, -20, 0.5, 6)] }
  });
}
{ // Planche latérale sur l'avant-bras gauche, vue de face
  const P = (y, roll, lat, t) => ({
    t, racine: { p: [0, y, 0], r: [0, 0, roll] }, colonne: { lomb: { lat }, thorax: {}, cou: { lat: -8 } },
    bras: { G: { ik: [44, 4, 24], pole: [0, -1, -1], main: MAIN_SOL }, D: { fk: { abd: 92 }, coude: 4, doigts: 10 } },   // bras du dessus tendu vers le plafond
    jambes: { G: { fk: { abd: 0 }, genou: 0 }, D: { fk: { abd: 0 }, genou: 0 } }
  });
  E("planche-laterale", {
    nom: "Planche latérale", duree: 4, reps: 1, affiche: 0.25, vue: "3/4",
    camera: { cible: [-20, 28, 0], dist: 408, el: 22 }, ombre: [-20, 0, 220, 70], accessoires: [{ type: "tapis", p0: [-20, 0, 0], ry: 90 }],
    muscles: { p: ["obliques", "abdominaux"], s: ["deltoides", "fessiers", "adducteurs"] },
    tempo: [[0, "Tenir · hanche haute, corps aligné"]],
    cles: [P(37, -73, 0, 0), P(37.4, -73, 0, 0.5)],
    erreur: { texte: "la hanche descend vers le sol : les obliques ne tiennent plus le bassin.", zone: ["obliques"],
      cles: [P(37.5, -75, 16, 0), P(37.8, -75, 16, 0.5)] }
  });
}
{ // Dead bug : bras et jambe opposés qui s'éloignent, dos plaqué
  const base = { racine: { p: [0, 10.5, 0], r: [-90, 0, 0] }, colonne: col(0, 0, 8) };
  const table = { fk: { flex: 90, abd: 6 }, genou: 90, cheville: 10 };
  const brasHaut = { fk: { flex: 90, abd: 4 }, coude: 3 };
  const P = (t, bG, bD, jG, jD, lomb = 0) => ({ t, ...copie(base), racine: { p: [0, 10.5, 0], r: [-90 + -0.75 * lomb, 0, 0] }, colonne: col(lomb, 0, 8), bras: { G: bG, D: bD }, jambes: { G: jG, D: jD } });
  const loinBras = { fk: { flex: 165, abd: 6 }, coude: 3 }, loinJambe = { fk: { flex: 22, abd: 4 }, genou: 2, cheville: -20 };
  E("dead-bug", {
    nom: "Dead bug", duree: 5, reps: 8, affiche: 0.25, vue: "profil",
    camera: { cible: [0, 30, 5], dist: 360, el: 16 }, ombre: [0, 5, 70, 200], accessoires: [{ type: "tapis", p0: [0, 0, 0] }],
    muscles: { p: ["abdominaux"], s: ["obliques", "flechisseurs"] },
    tempo: [[0, "Éloigner bras droit et jambe gauche · 2 s"], [0.25, "Revenir"], [0.5, "Éloigner bras gauche et jambe droite · 2 s"], [0.75, "Revenir"]],
    cles: [
      P(0, brasHaut, brasHaut, table, table), P(0.25, brasHaut, loinBras, loinJambe, table), P(0.5, brasHaut, brasHaut, table, table),
      P(0.75, loinBras, brasHaut, table, loinJambe)
    ],
    erreur: { texte: "le bas du dos se décolle du sol quand la jambe descend : les abdominaux lâchent.", zone: ["lombaires"],
      cles: [P(0, brasHaut, brasHaut, table, table), P(0.25, brasHaut, loinBras, { fk: { flex: 8, abd: 4 }, genou: 0 }, table, -15),
        P(0.5, brasHaut, brasHaut, table, table), P(0.75, loinBras, brasHaut, table, { fk: { flex: 8, abd: 4 }, genou: 0 }, -15)] }
  });
}
{ // Superman alterné à quatre pattes (bird dog)
  const MS = [MAIN_SOL[0], MAIN_SOL[1], MAIN_SOL[2]];
  const quatre = (bG, bD, jG, jD, lomb = 0, roll = 0, t = 0) => ({
    t, racine: { p: [0, 48, 0], r: [90, 0, roll] }, colonne: col(lomb, 0, -12),
    bras: { G: bG, D: bD }, jambes: { G: jG, D: jD }
  });
  const appuiBG = { ik: [17, 3, 44], pole: [0, 0, -1], main: MS }, appuiBD = { ik: [-17, 3, 44], pole: [0, 0, -1], main: MS };
  const genouG = { ik: [9, 7, -45], pole: [0, -1, 0.2], pied: [170, 0, 0] }, genouD = miroir(genouG);   // genou d'appui ancré au sol
  const loinB = { fk: { flex: 178, abd: 4 }, coude: 0, poignet: 0 }, loinJ = { fk: { flex: -2, abd: 2 }, genou: 0, cheville: -30 };
  E("bird-dog", {
    nom: "Superman alterné à quatre pattes", duree: 5, reps: 8, affiche: 0.25, vue: "profil",
    camera: { cible: [0, 45, 0], dist: 360, el: 12 }, ombre: [0, 0, 70, 200], accessoires: [{ type: "tapis", p0: [0, 0, 0] }],
    muscles: { p: ["lombaires", "fessiers"], s: ["deltoides", "trapezes", "ischios", "abdominaux"] },
    tempo: [[0, "Tendre bras droit et jambe gauche · tenir 2 s"], [0.5, "Changer de côté"]],
    cles: [
      quatre(appuiBG, appuiBD, genouG, genouD, 0, 0, 0),
      quatre(appuiBG, loinB, loinJ, genouD, 0, 0, 0.18), quatre(appuiBG, loinB, loinJ, genouD, 0, 0, 0.36),
      quatre(appuiBG, appuiBD, genouG, genouD, 0, 0, 0.5),
      quatre(loinB, appuiBD, genouG, loinJ, 0, 0, 0.68), quatre(loinB, appuiBD, genouG, loinJ, 0, 0, 0.86)
    ],
    erreur: { texte: "le dos se creuse et le bassin pivote : la jambe monte trop haut au lieu de rester dans l'axe.", zone: ["lombaires"],
      cles: [quatre(appuiBG, appuiBD, genouG, genouD, 0, 0, 0),
        quatre(appuiBG, loinB, { fk: { flex: -25, abd: 10 }, genou: 0, cheville: -30 }, genouD, -12, 0, 0.18),
        quatre(appuiBG, loinB, { fk: { flex: -25, abd: 10 }, genou: 0, cheville: -30 }, genouD, -12, 0, 0.36),
        quatre(appuiBG, appuiBD, genouG, genouD, 0, 0, 0.5),
        quatre(loinB, appuiBD, genouG, { fk: { flex: -25, abd: 10 }, genou: 0, cheville: -30 }, -12, 0, 0.68),
        quatre(loinB, appuiBD, genouG, { fk: { flex: -25, abd: 10 }, genou: 0, cheville: -30 }, -12, 0, 0.86)] }
  });
}
{ // Hollow body (banane)
  const H = (t, thorax, jambes, lomb, souffle = 0) => ({
    t, racine: { p: [0, 10.5 + souffle, 0], r: [-90, 0, 0] }, colonne: col(lomb, thorax, 18),
    bras: bras2({ fk: { flex: 160, abd: 6 }, coude: 2 }), jambes: jambes2({ fk: { flex: jambes, abd: 2 }, genou: 0, cheville: -25 })
  });
  E("hollow", {
    nom: "Hollow body (banane)", duree: 4, reps: 1, affiche: 0.25, vue: "profil",
    camera: { cible: [0, 22, 5], dist: 336, el: 12 }, ombre: [0, 0, 70, 220], accessoires: [{ type: "tapis", p0: [0, 0, 0] }],
    muscles: { p: ["abdominaux"], s: ["flechisseurs", "obliques", "quadriceps"] },
    tempo: [[0, "Tenir · bas du dos plaqué au sol"]],
    cles: [H(0, 22, 28, 6), H(0.5, 22, 28, 6, 0.4)],
    erreur: { texte: "les jambes trop basses font creuser le bas du dos : il décolle du sol.", zone: ["lombaires"],
      cles: [H(0, 10, 10, -18, 3), H(0.5, 10, 10, -18, 3.4)] }
  });
}

/* ---------- JAMBES ---------- */
{ // Squat
  const pieds = (y = 8, z = 3, pole = 0.35, talon = 0) => jambes2({ ik: [13, y, z], pole: [pole, 0, 1], pied: [-talon, 14, 0] });
  const haut = { t: 0, racine: { p: [0, 99, 0], r: [0, 0, 0] }, colonne: col(0, 0, 0), bras: bras2({ fk: { flex: 85, abd: 8 }, coude: 5 }), jambes: pieds() };
  const fin = { ...copie(haut), t: 0.94 };
  const ebas = { t: 0.45, racine: { p: [0, 58, -10], r: [18, 0, 0] }, colonne: col(30, 20, -10), bras: bras2({ fk: { flex: 110, abd: 8 }, coude: 5 }), jambes: pieds(12, 6, -0.9, 18) };
  // Capture de mouvement réelle : base CMU (mocap.cs.cmu.edu), sujet 13, essai 29, répétition des images 3828 à 4096,
  // convertie par mannequin/outils/capture-cmu.py squat : [t, hauteur et recul du bassin, bascule du bassin, lombaires, thorax, nuque]
  const CMU_13_29 = [
    [0, 99, 0, 0, 0, 0, 0], [0.064, 89.7, -4.3, 10.9, 2, -2.5, -4], [0.129, 79.9, -6.8, 17.8, 3.2, -3.2, -6.6],
    [0.193, 70.6, -8.2, 22.7, 3.5, -4.2, -8.9], [0.257, 61.9, -9.2, 25.3, 5.1, -3.9, -10.8], [0.321, 54.4, -10.7, 29.1, 6.2, -2.6, -12.7],
    [0.386, 49.2, -11.4, 29, 6.9, -2.1, -13.3], [0.45, 46, -11.3, 27.6, 6.8, -2.2, -13.9], [0.55, 46, -11.3, 27.6, 6.8, -2.2, -13.9],
    [0.606, 48.5, -11.1, 26.3, 6.9, -1.8, -13.9], [0.661, 54.8, -10.8, 23.7, 7.8, -1.3, -14.2], [0.717, 62.6, -9.6, 19.6, 7.7, 0, -13.3],
    [0.773, 70.5, -7.7, 14.4, 6.8, 0.5, -11.7], [0.829, 79, -5, 7.9, 5.1, 0.5, -11.1], [0.884, 88.5, -1.8, 1.4, 3, 0.7, -9.5],
    [0.94, 96.5, 1.5, -5, 1.3, 1.1, -5.8]];
  // bras de la capture remplacés par nos bras tendus devant (contrepoids), qui montent avec la profondeur
  const capte = ([t, py, pz, pitch, lomb, thorax, cou]) => ({ t, racine: { p: [0, py, pz], r: [pitch, 0, 0] },
    colonne: col(lomb, thorax, cou), bras: bras2({ fk: { flex: 85 + 40 * (99 - py) / 53, abd: 8 }, coude: 5 }), jambes: pieds() });
  E("squat", {
    nom: "Squat", duree: 4, reps: 10, affiche: 0.47, vue: "3/4",
    camera: { cible: [0, 84, 0], dist: 400, el: 6 },
    muscles: { p: ["quadriceps", "fessiers"], s: ["ischios", "adducteurs", "lombaires", "abdominaux", "mollets"] },
    tempo: [[0, "Descente · 2 s"], [0.45, "Pause en bas"], [0.56, "Montée · 1,5 s"], [0.94, "Debout"]],
    cles: CMU_13_29.map(capte),
    erreur: { texte: "les genoux rentrent vers l'intérieur, les talons se décollent et le dos s'arrondit.", zone: ["quadriceps", "adducteurs"],
      cles: [haut, ebas, { ...copie(ebas), t: 0.55 }, fin] }
  });
}
{ // Fente arrière, jambes alternées : la droite recule, puis la gauche (deux répétitions par tour)
  const brasL = b => bras2({ fk: { flex: 8 + 26 * b, abd: 14 }, coude: 25 + 45 * b });   // b : 0 debout, 1 en bas
  const avant = { ik: [13, 8, 6], pole: [0.2, 0, 1], pied: PIED_PLAT(10) };
  const P = (t, py, pz, dr, pitch = 0, avantG = avant) => { const b = (99 - py) / 42; return { t, racine: { p: [0, py, pz], r: [pitch + 5 * b, 0, 0] }, colonne: col(0, 0, 0), bras: brasL(b), jambes: { G: avantG, D: dr } }; };
  const drDebout = { ik: [-13, 8, 3], pole: [-0.2, 0, 1], pied: PIED_PLAT(-10) };
  const drVol = { ik: [-13, 22, -34], pole: [-0.1, 0, 1], pied: [40, -6, 0] };
  // première moitié du tour : la fente telle quelle ; seconde moitié : la même en miroir
  const alterner = cles => [...cles.map(k => ({ ...k, t: k.t / 2 })),
    ...cles.map(k => ({ ...copie(k), t: 0.5 + k.t / 2, jambes: { G: miroir(k.jambes.D), D: miroir(k.jambes.G) } }))];
  const tempo = [[0, "Grand pas en arrière"], [0.4, "Descendre le genou arrière"], [0.6, "Pousser sur le talon avant"], [0.9, "Debout"]];
  // Phase deux pieds au sol tirée d'une capture réelle : base CMU, sujet 144, essai 17, images 1112 à 1192 (fente avant,
  // mesurée par rapport au pied avant ; mannequin/outils/capture-cmu.py fente). Le pas en arrière reste dessiné à la main.
  // [t, hauteur du bassin, bascule du bassin, lombaires, thorax, nuque, cheville arrière (hauteur, recul), pied arrière (angle)]
  const CMU_144_17 = [
    [0.3, 81, -1.1, 4, -1.3, 5.3, 17.3, -75.5, 45], [0.337, 72.7, 0.9, 4.4, -1.9, 3.5, 17.7, -71.8, 59], [0.375, 65.4, 3.6, 5, -2.6, 1.3, 17.4, -68.9, 70],
    [0.412, 60.9, 5, 5.6, -2.3, 0.5, 17.1, -67.3, 76], [0.45, 59.2, 5.6, 5.7, -2.5, 0.9, 16.9, -66.5, 78], [0.58, 59.2, 5.6, 5.7, -2.5, 0.9, 16.9, -66.5, 78],
    [0.615, 60.4, 5.5, 5.7, -2.3, 0.7, 16.9, -67, 78], [0.65, 64.4, 5.2, 5.3, -2.3, 0.8, 17.2, -68.4, 72], [0.685, 70.3, 4.5, 4.9, -2.3, 0.6, 17.7, -70.4, 65],
    [0.72, 77.3, 3.5, 4.8, -2.1, 0.5, 17.9, -72.9, 55]];
  const capte = ([t, py, pitch, lomb, thorax, cou, ay, az, pied]) => { const b = (99 - py) / 40; return { t, racine: { p: [0, py, -22 * b], r: [pitch, 0, 0] },
    colonne: col(lomb, thorax, cou), bras: brasL(b), jambes: { G: avant, D: { ik: [-13, ay, 6 + az], pole: [0, -0.2, 1], pied: [pied, -4, 0] } } }; };
  E("fente-arriere", {
    alterne: true,
    nom: "Fente arrière", duree: 8, cycle: 2, reps: 8, affiche: 0.25, vue: "profil",
    camera: { cible: [0, 80, -20], dist: 420, el: 6 }, ombre: [0, -25, 90, 160],
    muscles: { p: ["quadriceps", "fessiers"], s: ["ischios", "adducteurs", "mollets", "abdominaux"] },
    tempo: [...tempo.map(([t, x]) => [t / 2, x + " (jambe droite)"]), ...tempo.map(([t, x]) => [0.5 + t / 2, x + " (jambe gauche)"])],
    cles: alterner([P(0, 99, 0, drDebout), P(0.2, 93, -8, drVol), ...CMU_144_17.map(capte), P(0.82, 93, -8, drVol)]),
    erreur: { texte: "pas trop court : le genou avant part loin devant les orteils et le talon se décolle.", zone: ["quadriceps"],
      cles: alterner([P(0, 99, 0, drDebout), P(0.2, 93, -2, { ik: [-13, 22, -20], pole: [-0.1, 0, 1], pied: [40, -6, 0] }),
        P(0.33, 78, 4, { ik: [-13, 19, -29], pole: [-0.05, -0.1, 1], pied: [50, -5, 0] }, 6, { ik: [13, 9.5, 7], pole: [0.2, 0, 1], pied: [-8, 10, 0] }),   // à mi-descente : le talon avant commence à se lever
        P(0.45, 62, 10, { ik: [-13, 16, -38], pole: [0, -0.2, 1], pied: [60, -4, 0] }, 12, { ik: [13, 12, 8], pole: [0.2, 0, 1], pied: [-22, 10, 0] }),
        P(0.58, 62, 10, { ik: [-13, 16, -38], pole: [0, -0.2, 1], pied: [60, -4, 0] }, 12, { ik: [13, 12, 8], pole: [0.2, 0, 1], pied: [-22, 10, 0] }),
        P(0.68, 78, 4, { ik: [-13, 19, -29], pole: [-0.05, -0.1, 1], pied: [50, -5, 0] }, 6, { ik: [13, 9.5, 7], pole: [0.2, 0, 1], pied: [-8, 10, 0] }),
        P(0.78, 93, -2, { ik: [-13, 22, -20], pole: [-0.1, 0, 1], pied: [40, -6, 0] })]) }
  });
}
{ // Squat bulgare, pied arrière sur une chaise
  const ar = { ik: [-12, 60, -83], pole: [0, -0.3, 1], pied: [100, 0, 0] };
  const P = (t, py, pz, pitch, av = { ik: [12, 8, 14], pole: [0.25, 0, 1], pied: PIED_PLAT(8) }) => ({
    t, racine: { p: [0, py, pz], r: [pitch, 0, 0] }, colonne: col(4, 2, -6), bras: bras2({ fk: { flex: 10, abd: 14 }, coude: 30 }), jambes: { G: av, D: ar }
  });
  E("squat-bulgare", {
    nom: "Squat bulgare", duree: 4, reps: 8, affiche: 0.5, vue: "profil",
    camera: { cible: [0, 70, -25], dist: 430, el: 6 }, ombre: [0, -30, 90, 160],
    accessoires: [{ type: "chaise", p0: [-12, 0, -92], ry: 0 }],
    muscles: { p: ["quadriceps", "fessiers"], s: ["adducteurs", "ischios", "abdominaux"] },
    tempo: [[0, "Descente · 2 s"], [0.45, "Pause"], [0.55, "Montée · 1,5 s"]],
    cles: [P(0, 90, -20, 6), P(0.45, 58, -24, 14), P(0.55, 58, -24, 14)],
    erreur: { texte: "le genou avant rentre vers l'intérieur : il doit rester dans l'axe du pied.", zone: ["adducteurs", "quadriceps"],
      cles: [P(0, 90, -20, 6), P(0.45, 60, -22, 14, { ik: [12, 8, 14], pole: [-0.9, 0, 1], pied: PIED_PLAT(8) }), P(0.55, 60, -22, 14, { ik: [12, 8, 14], pole: [-0.9, 0, 1], pied: PIED_PLAT(8) })] }
  });
}
{ // Pont fessier : épaules au sol, pousser dans les talons
  const pieds = jambes2({ ik: [15, 8, 50], pole: [0.15, 1, 0], pied: PIED_PLAT(0) });
  // épaules posées au sol ; si le bas du dos se cambre (lomb < 0), le bassin bascule d'autant pour que le buste garde son angle
  const P = (t, ang, lomb = 0, cou = 0, baisse = 0) => {     // baisse : épaules plus bas (cm) pour qu'elles portent sur le tapis
    const S = [13.5 - baisse, -43], phiB = -90 - ang - lomb, phiT = -90 - ang;
    const y = S[0] - 38 * Math.cos(phiT * D) - 5 * Math.cos(phiB * D), z = S[1] - 38 * Math.sin(phiT * D) - 5 * Math.sin(phiB * D);
    return { t, racine: { p: [0, y - Math.min(0, lomb) * 0.03, z], r: [phiB, 0, 0] }, colonne: col(lomb, 0, cou), bras: bras2({ fk: { flex: -ang - 7 - Math.min(0, lomb) * 0.25, abd: 14 }, coude: 0, poignet: 0 }), jambes: pieds };
  };
  E("pont-fessier", {
    nom: "Pont fessier", duree: 3.5, reps: 12, affiche: 0.45, vue: "profil",
    camera: { cible: [0, 25, 5], dist: 300, el: 10 }, ombre: [0, 0, 70, 180], accessoires: [{ type: "tapis", p0: [0, 0, 0] }],
    muscles: { p: ["fessiers"], s: ["ischios", "lombaires", "abdominaux"] },
    tempo: [[0, "Monter en poussant dans les talons"], [0.4, "Serrer les fesses · 2 s"], [0.65, "Redescendre lentement"]],
    cles: [P(0, 0, 0, 0), P(0.4, 30, 0, 28), P(0.62, 30, 0, 28)],
    clesFemme: [P(0, 0, 0, 0), P(0.4, 30, 0, 40, 2), P(0.62, 30, 0, 40, 2)],      // chignon : menton plus rentré, sinon la tête porte avant le haut du dos
    erreur: { texte: "monter en cambrant le bas du dos au lieu de serrer les fesses.", zone: ["lombaires"],
      cles: [P(0, 0, 0, 0), P(0.4, 34, -24, 36), P(0.62, 34, -24, 36)], clesFemme: [P(0, 0, 0, 0), P(0.4, 34, -24, 48, 2), P(0.62, 34, -24, 48, 2)] }
  });
}
{ // Mollets sur une marche
  const P = (t, y, cheville, genou = 0) => ({ t, racine: { p: [0, y, 0], r: [0, 0, 0] }, colonne: col(0, 0, 0), bras: bras2({ fk: { flex: 6, abd: 8 }, coude: 10 }),
    jambes: jambes2({ fk: { flex: genou / 2, abd: 2 }, genou, cheville }) });
  E("mollets", {
    nom: "Mollets sur une marche", duree: 3.5, reps: 15, affiche: 0.45, vue: "profil",
    camera: { cible: [0, 102, 10], dist: 480, el: 4 }, ombre: [0, 14, 90, 90], accessoires: [{ type: "marche", p0: [0, 0, 16], h: 18, p: 32 }],   // avant du pied sur la marche, talons dans le vide
    muscles: { p: ["mollets"], s: [] },
    tempo: [[0, "Monter sur la pointe · 1 s"], [0.4, "Tenir 1 s"], [0.55, "Descendre lentement · 3 s"]],
    cles: [P(0, 114, 25), P(0.2, 118.8, -5), P(0.3, 121.3, -20), P(0.4, 123.4, -34), P(0.55, 123.4, -34), P(0.65, 121.3, -20), P(0.75, 119, -5), P(0.95, 114, 25)],
    erreur: { texte: "plier les genoux pour monter : les cuisses aident et les mollets travaillent moins.", zone: ["quadriceps"],
      cles: [P(0, 111, 25, 24), P(0.1, 113, 13, 24), P(0.2, 115, 1.5, 24), P(0.4, 119, -22, 24), P(0.55, 119, -22, 24), P(0.75, 115, 1.5, 24), P(0.85, 113, 13, 24), P(0.95, 111, 25, 24)] }
  });
}

/* ---------- HAUT DU CORPS ---------- */
function pompe(id, nom, surGenoux) {
  const Lap = surGenoux ? 48 : 91;          // du bassin à l'appui (genou ou cheville)
  const ha = surGenoux ? 6 : 14, za = surGenoux ? -40 : -82;
  const mains = (pole) => bras2({ ik: [24, surGenoux ? 3.4 : 3, 42], pole: [0.6, 0.15, -1].map((v, i) => i === 0 ? v * pole : v), main: MAIN_SOL });
  const P = (t, hs, flare = 1, affaisse = 0) => {
    const a = appui(hs, ha, 43, Lap, za);
    const cou = surGenoux ? -4 : -10;
    const jambes = surGenoux ? jambes2({ fk: { flex: 0, abd: 3 }, genou: 110, cheville: -30 })
      : jambes2({ ik: [10, ha, za], pole: [0, -1, 0], pied: PIED_ORTEILS });
    return { t, racine: { p: [0, a.y - affaisse, a.z], r: [a.pitch - affaisse * 0.25, 0, 0] }, colonne: col(-affaisse * 1.2, 0, cou), bras: mains(flare), jambes };
  };
  E(id, {
    nom, duree: 3.5, reps: 10, affiche: 0.42, vue: "3/4",
    camera: { cible: [0, 30, surGenoux ? 10 : 0], dist: 390, el: 18 }, ombre: [0, 0, 80, 200], accessoires: [{ type: "tapis", p0: [0, 0, 0] }],
    muscles: { p: ["pectoraux", "triceps"], s: ["deltoides", "abdominaux", "avant-bras"] },
    tempo: [[0, "Descente · 2 s"], [0.5, "Poitrine à un poing du sol"], [0.6, "Pousser · 1 s"]],
    cles: [P(0, 57), P(0.5, surGenoux ? 23 : 19), P(0.6, surGenoux ? 23 : 19)],
    erreur: { texte: "coudes écartés à 90° et bassin qui tombe : l'épaule souffre et le dos se creuse.", zone: ["deltoides", "lombaires"],
      cles: [P(0, 57, 1.8, 6), P(0.5, surGenoux ? 25 : 22, 1.8, surGenoux ? 6 : 10), P(0.6, surGenoux ? 25 : 22, 1.8, surGenoux ? 6 : 10)] }
  });
}
pompe("pompe", "Pompe", false);
pompe("pompe-genoux", "Pompe sur les genoux", true);

{ // Rowing sous une table : corps gainé, talons au sol
  const MAINS = bras2({ ik: [22, 63, -4.6], pole: [0.2, -1, 0.6], main: [0, 180, 180], doigts: 85, phal: 95, pouce: 85 });
  const cheville = [7.2, 112];
  const P = (t, ys, sag = 0) => {
    const th = Math.asin((ys - cheville[0]) / 131) / D;
    const y = cheville[0] + 87 * sin(th) - sag, z = cheville[1] - 87 * cos(th);
    return { t, racine: { p: [0, y, z], r: [-90 + th, 0, 0] }, colonne: col(0, 0, -4),
      bras: MAINS, jambes: jambes2({ ik: [10, cheville[0], cheville[1]], pole: [0, 1, 0], pied: PIED_TALON }), _sag: sag };
  };
  const Psag = (t, ys) => { const p = P(t, ys); p.racine.p[1] -= 4; p.jambes = jambes2({ ik: [10, cheville[0], cheville[1]], pole: [0, 1, 0], pied: PIED_TALON }); p.colonne = col(0, 0, 34); return p; };
  E("rowing-table", {
    nom: "Rowing sous une table", duree: 3.5, reps: 10, affiche: 0.5, vue: "profil",
    camera: { cible: [0, 45, 40], dist: 420, el: 6 }, ombre: [0, 40, 80, 220],
    accessoires: [{ type: "table", p0: [0, 0, -42], l: 110, p: 70 }],
    muscles: { p: ["dorsaux"], s: ["biceps", "trapezes", "deltoides", "avant-bras", "lombaires"] },
    tempo: [[0, "Tirer la poitrine vers la table · 1 s"], [0.45, "Tenir"], [0.55, "Redescendre · 2 s"]],
    cles: [P(0, 22), P(0.45, 41), P(0.55, 41)],
    erreur: { texte: "le bassin tombe : le corps n'est plus gainé et les bras tirent seuls.", zone: ["lombaires"],
      cles: [Psag(0, 22), Psag(0.45, 41), Psag(0.55, 41)] }
  });
}
{ // Traction, prise en pronation
  // poignets juste derrière et sous la barre, doigts enroulés par-dessus ; le corps passe derrière la barre en montant (menton au-dessus)
  const MAINS = bras2({ ik: [30, 206.5, -4.2], pole: [1, 0, 0.35], main: [0, 0, 180], doigts: 85, phal: 95, pouce: 100 });
  const P = (t, y, hanches = 8, genoux = 25, pitch = 0) => ({ t, racine: { p: [0, y, -6 - Math.max(0, y - 115) * 0.2], r: [pitch - Math.max(0, y - 115) * 0.12, 0, 0] }, colonne: col(0, -6, -8), bras: MAINS,
    jambes: jambes2({ fk: { flex: hanches, abd: 2 }, genou: genoux, cheville: -25 }) });
  E("traction", {
    nom: "Traction", duree: 3.5, reps: 6, affiche: 0.48, vue: "3/4",
    camera: { cible: [0, 128, 0], dist: 560, el: 3 }, ombre: [0, 0, 90, 90], accessoires: [{ type: "barre", h: 217, l: 120 }],
    muscles: { p: ["dorsaux", "biceps"], s: ["trapezes", "avant-bras", "deltoides", "abdominaux"] },
    tempo: [[0, "Tirer · menton au-dessus de la barre"], [0.45, "Tenir"], [0.55, "Descendre lentement · 3 s"]],
    cles: [P(0, 115), P(0.45, 158), P(0.55, 158)],
    erreur: { texte: "se balancer avec les jambes pour monter : l'élan fait le travail à la place du dos.", zone: ["flechisseurs"],
      cles: [P(0, 115, 10, 30, -8), P(0.2, 125, 70, 60, 4), P(0.45, 156, 30, 40, 0), P(0.55, 156, 30, 40, 0), P(0.8, 120, 0, 20, -12)] }
  });
}
{ // Dips sur une chaise
  const MAINS = bras2({ ik: [19, 48, -10], pole: [0, 0, -1], main: MAIN_SOL });
  const PIEDS = jambes2({ ik: [12, 8, 62], pole: [0, 1, 0.6], pied: PIED_PLAT(6) });
  const P = (t, y, thorax = 0, z = 0) => ({ t, racine: { p: [0, y, z], r: [0, 0, 0] }, colonne: col(0, thorax, -4), bras: MAINS, jambes: PIEDS });
  E("dips", {
    nom: "Dips sur une chaise", duree: 3.5, reps: 10, affiche: 0.47, vue: "profil",
    camera: { cible: [0, 60, 15], dist: 400, el: 8 }, ombre: [0, 15, 80, 150], accessoires: [{ type: "chaise", p0: [0, 0, -30] }],
    muscles: { p: ["triceps"], s: ["pectoraux", "deltoides"] },
    tempo: [[0, "Descente · 2 s, coudes vers l'arrière"], [0.47, "Coudes à 90°"], [0.57, "Pousser · 1 s"]],
    cles: [P(0, 57, 0, 2), P(0.47, 33, 6, 4), P(0.57, 33, 6, 4)],
    erreur: { texte: "descendre trop bas, épaules en avant : l'avant de l'épaule est en danger.", zone: ["deltoides"],
      cles: [P(0, 57, 0, 2), P(0.47, 20, 22, 8), P(0.57, 20, 22, 8)] }
  });
}

/* ---------- ÉCHAUFFEMENT ET CARDIO ---------- */
{ // Montées de genoux
  const P = (t, y, gG, gD, pitch = 0) => ({
    t, racine: { p: [0, y, 0], r: [pitch, 0, 0] }, colonne: col(0, 0, 0),
    bras: { G: { fk: { flex: gD ? 38 : -30, abd: 8 }, coude: 90, ...POING }, D: { fk: { flex: gG ? 38 : -30, abd: 8 }, coude: 90, ...POING } },
    jambes: {
      G: gG ? { fk: { flex: 90, abd: 3 }, genou: 95, cheville: -25 } : { fk: { flex: 0, abd: 3 }, genou: 4, cheville: -18 },
      D: gD ? { fk: { flex: 90, abd: 3 }, genou: 95, cheville: -25 } : { fk: { flex: 0, abd: 3 }, genou: 4, cheville: -18 }
    }
  });
  E("montees-genoux", {
    nom: "Montées de genoux", duree: 0.9, reps: 20, affiche: 0.25, vue: "3/4",
    camera: { cible: [0, 90, 0], dist: 420, el: 5 }, ombre: [0, 0, 90, 90],
    muscles: { p: ["flechisseurs", "quadriceps"], s: ["mollets", "abdominaux", "fessiers"] },
    tempo: [[0, "Genou à hauteur de hanche"], [0.5, "Changer de jambe"]],
    cles: [P(0, 101, false, false), P(0.25, 101, true, false), P(0.5, 101, false, false), P(0.75, 101, false, true)],
    erreur: { texte: "le buste part en arrière : on monte le genou en cambrant au lieu de gainer.", zone: ["lombaires"],
      cles: [P(0, 101, false, false, -10), P(0.25, 101, true, false, -14), P(0.5, 101, false, false, -10), P(0.75, 101, false, true, -14)] }
  });
}
{ // Chat-vache
  const MAINS = bras2({ ik: [17, 5, 44], pole: [0, 0, -1], main: MAIN_SOL });
  const GENOUX = jambes2({ ik: [9, 7, -45], pole: [0, -1, 0.2], pied: [170, 0, 0] });   // chevilles ancrées au sol : les genoux ne décollent pas
  // le bassin bascule en sens inverse de la colonne : les épaules restent au-dessus des mains, seul le dos s'arrondit ou se creuse
  const BASCULE = a => a > 0 ? -0.9 * a : -0.5 * a;
  const P = (t, lomb, thorax, cou) => ({ t, racine: { p: [0, 55 + Math.min(0, lomb) * 0.3, 0], r: [90 + BASCULE(lomb + thorax), 0, 0] }, colonne: col(lomb, thorax, cou), bras: MAINS, jambes: GENOUX });
  E("chat-vache", {
    nom: "Chat-vache", duree: 5, reps: 8, affiche: 0.25, vue: "profil",
    camera: { cible: [0, 45, 0], dist: 360, el: 10 }, ombre: [0, 0, 70, 200], accessoires: [{ type: "tapis", p0: [0, 0, 0] }],
    muscles: { p: ["lombaires", "abdominaux"], s: ["trapezes", "obliques"] },
    tempo: [[0, "Chat : arrondir le dos, menton vers la poitrine"], [0.5, "Vache : creuser doucement, regard devant"]],
    cles: [P(0, 34, 30, 34), P(0.5, -26, -22, -38)]
  });
}
{ // Fente avant avec rotation du buste
  const brasR = (rot) => ({ G: { fk: { flex: 88, abd: 6 + rot / 3 }, coude: 10 }, D: { fk: { flex: 88, abd: 6 - rot / 3 }, coude: 10 } });
  const P = (t, py, pz, ga, dr, rot) => ({ t, racine: { p: [0, py, pz], r: [0, 0, 0] }, colonne: col(0, 0, 0, rot), bras: brasR(rot), jambes: { G: ga, D: dr } });
  const gDebout = { ik: [13, 8, 3], pole: [0.2, 0, 1], pied: PIED_PLAT(8) }, dDebout = { ik: [-13, 8, 3], pole: [-0.2, 0, 1], pied: PIED_PLAT(-8) };
  const gAvant = { ik: [13, 8, 70], pole: [0.2, 0, 1], pied: PIED_PLAT(6) }, gVol = { ik: [13, 22, 36], pole: [0.2, 0, 1], pied: [-10, 6, 0] };
  const dBas = { ik: [-13, 15, -10], pole: [0, -0.2, 1], pied: [60, -4, 0] }, dMi = { ik: [-13, 12, -2], pole: [-0.1, -0.1, 1], pied: [28, -6, 0] };
  // première moitié du tour : jambe gauche devant ; seconde moitié : le même geste en miroir, buste tourné de l'autre côté
  const demi = [[0, 99, 0, gDebout, dDebout, 0], [0.15, 95, 10, gVol, dMi, 0], [0.32, 60, 28, gAvant, dBas, 0], [0.48, 60, 28, gAvant, dBas, 40], [0.62, 60, 28, gAvant, dBas, 0], [0.82, 95, 10, gVol, dMi, 0]];
  const tempoR = [[0, "Grand pas en avant"], [0.35, "Tourner le buste vers la jambe avant"], [0.62, "Revenir face"], [0.8, "Revenir debout"]];
  E("fente-rotation", {
    alterne: true,
    nom: "Fente avec rotation du buste", duree: 10, cycle: 2, reps: 6, affiche: 0.24, vue: "profil",
    camera: { cible: [0, 76, 25], dist: 460, el: 8 }, ombre: [0, 30, 90, 160],
    muscles: { p: ["quadriceps", "fessiers", "obliques"], s: ["adducteurs", "abdominaux", "lombaires"] },
    tempo: [...tempoR.map(([t, x]) => [t / 2, x + " (jambe gauche)"]), ...tempoR.map(([t, x]) => [0.5 + t / 2, x + " (jambe droite)"])],
    cles: [...demi.map(([t, y, z, g, d, r]) => P(t / 2, y, z, g, d, r)), ...demi.map(([t, y, z, g, d, r]) => P(0.5 + t / 2, y, z, miroir(d), miroir(g), -r))]
  });
}

/* ---------- COURSE À PIED ---------- */
/* Hauteur du bassin pour que le pied d'appui touche le sol (plan sagittal) :
   cheville sous la hanche = 44 cos(hanche) + 43 cos(hanche - genou), plus 4 (hanche) et 16 (cheville-sol). */
const hauteurAppui = (h, g) => 4 + 44 * cos(h) + 43 * cos(h - g) + 16;
function foulee(tableau, { pitch = 7, erreur = false, balancier = null } = {}) {
  // tableau : 8 phases pour la jambe gauche [hanche, genou, cheville, appui ?], contact du pied gauche à t = 0
  const n = tableau.length, cles = [];
  let yPrec = 96;
  for (let i = 0; i < n; i++) {
    const G = tableau[i], Dp = tableau[(i + n / 2) % n];
    const appuiG = G[3], appuiD = Dp[3];
    let y = appuiG ? hauteurAppui(G[0], G[1]) : appuiD ? hauteurAppui(Dp[0], Dp[1]) : yPrec + 2.5;
    yPrec = y;
    // bras opposés aux jambes ; balancier imposé (degrés) quand les hanches bougent peu (talons-fesses)
    const brasG = balancier ? balancier * Math.sin(2 * Math.PI * i / n) - 5 : -(G[0] - 10) * 0.95;
    const brasD = balancier ? -balancier * Math.sin(2 * Math.PI * i / n) - 5 : -(Dp[0] - 10) * 0.95;
    cles.push({
      t: i / n, racine: { p: [0, y, 0], r: [pitch, (G[0] - Dp[0]) * 0.12, 0] }, colonne: col(2, 0, -pitch - 2, -(G[0] - Dp[0]) * 0.15),
      bras: { G: { fk: { flex: brasG, abd: 8 }, coude: 88 + Math.max(0, brasG) * 0.3, ...POING }, D: { fk: { flex: brasD, abd: 8 }, coude: 88 + Math.max(0, brasD) * 0.3, ...POING } },
      jambes: { G: { fk: { flex: G[0], abd: 2 }, genou: G[1], cheville: G[2] }, D: { fk: { flex: Dp[0], abd: 2 }, genou: Dp[1], cheville: Dp[2] } }
    });
  }
  return cles;
}
//            hanche genou cheville appui
const FOULEE = [[24, 18, 2, 1], [8, 38, 18, 1], [-10, 25, 4, 1], [-18, 35, -25, 0], [0, 85, -5, 0], [25, 100, 5, 0], [40, 60, 8, 0], [34, 24, 5, 0]];
const FOULEE_LONGUE = [[40, 4, 18, 1], [16, 34, 18, 1], [-8, 25, 4, 1], [-18, 35, -25, 0], [0, 80, -5, 0], [25, 90, 5, 0], [42, 40, 8, 0], [42, 12, 12, 0]];
E("course", {
  nom: "Foulée de course", duree: 0.72, reps: 30, affiche: 0.08, vue: "profil",
  camera: { cible: [0, 86, 0], dist: 470, el: 4 }, ombre: [0, 0, 70, 120],
  muscles: { p: ["quadriceps", "fessiers", "mollets"], s: ["ischios", "flechisseurs", "abdominaux", "tibial"] },
  tempo: [[0, "Appui sous le bassin"], [0.3, "Poussée"], [0.4, "Phase de vol"], [0.5, "Appui de l'autre pied"], [0.8, "Phase de vol"]],
  cles: foulee(FOULEE),
  erreur: { texte: "le pied attaque loin devant, talon d'abord, jambe tendue : chaque appui freine et le genou encaisse le choc.", zone: ["quadriceps", "tibial"],
    tempo: [[0, "Attaque talon, loin devant : frein"], [0.3, "Poussée"], [0.4, "Vol"], [0.5, "Attaque talon de l'autre pied"], [0.8, "Vol"]],
    cles: foulee(FOULEE_LONGUE, { pitch: 1 }) }
});
{ // Talons-fesses
  const TF = [[0, 20, -10, 1], [-8, 85, -20, 0], [-10, 150, -35, 0], [-4, 90, -15, 0], [0, 18, -10, 1], [0, 18, -10, 1], [0, 18, -10, 1], [0, 18, -10, 1]];
  const cles = foulee(TF, { pitch: 4, balancier: 32 }).map(k => { k.racine.p[1] += 1; return k; });
  E("talons-fesses", {
    nom: "Talons-fesses", duree: 0.7, reps: 20, affiche: 0.25, vue: "profil",
    camera: { cible: [0, 86, 0], dist: 470, el: 4 }, ombre: [0, 0, 70, 90],
    muscles: { p: ["ischios"], s: ["mollets", "flechisseurs"] },
    tempo: [[0, "Talon vers la fesse, appui rapide"], [0.5, "Changer de jambe"]],
    cles
  });
}
{ // Petits sauts chevilles toniques (le ressort)
  const P = (t, y, cheville, genou = 6) => ({ t, racine: { p: [0, y, 0], r: [2, 0, 0] }, colonne: col(0, 0, -2),
    bras: bras2({ fk: { flex: 4, abd: 12 }, coude: 18, doigts: 20, phal: 25 }), jambes: jambes2({ fk: { flex: genou * 0.5, abd: 3 }, genou, cheville }) });
  E("sauts-chevilles", {
    nom: "Petits sauts, chevilles toniques", duree: 0.42, reps: 20, affiche: 0.5, vue: "profil",
    camera: { cible: [0, 86, 0], dist: 470, el: 4 }, ombre: [0, 0, 80, 80],
    muscles: { p: ["mollets"], s: ["quadriceps", "tibial"] },
    tempo: [[0, "Contact bref sur l'avant du pied"], [0.35, "Rebond"]],
    cles: [P(0, 104, -22), P(0.2, 102, -8, 10), P(0.5, 115, -38, 2), P(0.8, 104, -28)],
    erreur: { texte: "plier beaucoup les genoux à chaque réception : on amortit au lieu de rebondir, l'effet ressort disparaît.", zone: ["quadriceps"],
      cles: [P(0, 100, -10, 20), P(0.2, 92, 10, 45), P(0.5, 108, -30, 10), P(0.8, 100, -10, 20)] }
  });
}

/* ---------- SEMAINE SANS SALLE ---------- */
{ // Pompe inclinée : mains sur un banc ou une marche haute, plus facile que la pompe au sol
  const MAINS = bras2({ ik: [24, 48, 40], pole: [0.6, 0.15, -1], main: MAIN_SOL });
  const P = (t, hs, affaisse = 0) => {
    const a = appui(hs, 14, 43, 91, -82);
    return { t, racine: { p: [0, a.y - affaisse, a.z], r: [a.pitch - affaisse * 0.25, 0, 0] }, colonne: col(-affaisse * 1.2, 0, -10), bras: MAINS,
      jambes: jambes2({ ik: [10, 14, -82], pole: [0, -1, 0], pied: PIED_ORTEILS }) };
  };
  E("pompe-inclinee", {
    nom: "Pompe inclinée", duree: 3.5, reps: 12, affiche: 0.45, vue: "profil",
    camera: { cible: [0, 50, 0], dist: 400, el: 14 }, ombre: [0, 0, 80, 220], accessoires: [{ type: "marche", p0: [0, 0, 52], h: 45, p: 36, l: 64 }],
    muscles: { p: ["pectoraux", "triceps"], s: ["deltoides", "abdominaux"] },
    tempo: [[0, "Descente · 2 s"], [0.5, "Poitrine au bord du banc"], [0.6, "Pousser · 1 s"]],
    cles: [P(0, 99), P(0.5, 64), P(0.6, 64)],
    erreur: { texte: "le bassin tombe et les épaules remontent vers les oreilles : le corps doit rester gainé d'un bloc.", zone: ["lombaires"],
      cles: [P(0, 99, 8), P(0.5, 66, 12), P(0.6, 66, 12)] }
  });
}
{ // Pompe piquée (pike) : bassin haut, la tête descend vers le sol entre les mains
  const MAINS = bras2({ ik: [22, 3, 44], pole: [0.7, 0.1, -1], main: MAIN_SOL });
  const PIEDS = jambes2({ ik: [11, 12, -62], pole: [0, -1, 0.3], pied: PIED_ORTEILS });
  const P = (t, y, z, pitch, cou = -10) => ({ t, racine: { p: [0, y, z], r: [pitch, 0, 0] }, colonne: col(0, 4, cou), bras: MAINS, jambes: PIEDS });
  E("pompe-pike", {
    nom: "Pompe piquée", duree: 3.5, reps: 8, affiche: 0.48, vue: "profil",
    camera: { cible: [0, 45, 0], dist: 380, el: 8 }, ombre: [0, 0, 80, 200], accessoires: [{ type: "tapis", p0: [0, 0, 0] }],
    muscles: { p: ["deltoides", "triceps"], s: ["trapezes", "pectoraux", "abdominaux"] },
    tempo: [[0, "Descendre la tête vers le sol · 2 s"], [0.48, "Front près du sol"], [0.6, "Pousser · 1 s"]],
    cles: [P(0, 80, -2, 128), P(0.48, 68, 6, 142, -4), P(0.6, 68, 6, 142, -4)],
    erreur: { texte: "les coudes s'ouvrent sur les côtés et la tête part en avant des mains : c'est l'épaule qui encaisse.", zone: ["deltoides"],
      cles: [P(0, 80, -2, 128), P(0.48, 62, 14, 132, 10), P(0.6, 62, 14, 132, 10)] }
  });
}
{ // Superman à plat ventre : poitrine, bras et jambes décollent ensemble
  const P = (t, lomb, thorax, hanche, bras, cou = -6, y = 9) => ({ t, racine: { p: [0, y, 0], r: [90, 0, 0] }, colonne: col(lomb, thorax, cou),
    bras: bras2({ fk: { flex: bras, abd: 10 }, coude: 4, poignet: 0 }), jambes: jambes2({ fk: { flex: hanche, abd: 4 }, genou: 2, cheville: -40 }) });
  E("superman", {
    nom: "Superman", duree: 4, reps: 10, affiche: 0.4, vue: "profil",
    camera: { cible: [0, 18, 0], dist: 330, el: 12 }, ombre: [0, 0, 70, 230], accessoires: [{ type: "tapis", p0: [0, 0, 0] }],
    muscles: { p: ["lombaires", "fessiers"], s: ["dorsaux", "trapezes", "ischios", "deltoides"] },
    tempo: [[0, "Décoller bras, poitrine et jambes · 1 s"], [0.3, "Tenir 2 s, regard vers le sol"], [0.7, "Redescendre"]],
    cles: [P(0, 0, 0, 0, 172, -4), P(0.15, -7, -4, -7, 170, -5, 7.5), P(0.3, -14, -8, -14, 168), P(0.7, -14, -8, -14, 168), P(0.81, -7, -4, -7, 170, -5, 7.5), P(0.92, 0, 0, 0, 172, -4)],
    erreur: { texte: "relever la tête vers le plafond : la nuque se casse. Le regard reste vers le sol.", zone: ["trapezes"],
      cles: [P(0, 0, 0, 0, 172, -4), P(0.15, -7, -4, -7, 170, -22, 7.5), P(0.3, -14, -8, -14, 168, -40), P(0.7, -14, -8, -14, 168, -40), P(0.81, -7, -4, -7, 170, -22, 7.5), P(0.92, 0, 0, 0, 172, -4)] }
  });
}
{ // Chaise contre le mur : dos au mur, cuisses horizontales
  const P = (t, y, genouZ, souffle = 0, dz = 0) => ({ t, racine: { p: [0, y + souffle, -4.4 + dz], r: [0, 0, 0] }, colonne: col(0, 0, 0),
    bras: bras2({ fk: { flex: 0, abd: 10 }, coude: 10 }), jambes: jambes2({ ik: [12, 8, genouZ], pole: [0, 0, 1], pied: PIED_PLAT(6) }) });
  E("chaise-mur", {
    nom: "Chaise contre le mur", duree: 4, reps: 1, affiche: 0.25, vue: "profil",
    camera: { cible: [0, 62, 18], dist: 380, el: 6 }, ombre: [0, 22, 80, 90], accessoires: [{ type: "mur", p0: [0, 0, -17], l: 120, h: 170 }],
    muscles: { p: ["quadriceps"], s: ["fessiers", "adducteurs", "mollets"] },
    tempo: [[0, "Tenir · cuisses à l'horizontale, dos plaqué"]],
    cles: [P(0, 55, 44), P(0.5, 55, 44, 0.4)],
    erreur: { texte: "les fesses restent trop hautes : avec les genoux peu pliés, les cuisses ne travaillent presque plus.", zone: ["quadriceps"],
      cles: [P(0, 78, 24, 0, 0.6), P(0.5, 78, 24, 0.4, 0.6)] }
  });
}
{ // Relevés de jambes allongé : jambes tendues, bas du dos plaqué
  const P = (t, jambes, lomb = 0) => ({ t, racine: { p: [0, 10.5, 0], r: [-90 + -0.75 * lomb, 0, 0] }, colonne: col(lomb, 0, 10),
    bras: bras2({ fk: { flex: 0, abd: 14 }, coude: 0 }), jambes: jambes2({ fk: { flex: jambes, abd: 2 }, genou: 4, cheville: -20 }) });
  E("releve-jambes", {
    nom: "Relevés de jambes", duree: 4, reps: 10, affiche: 0.45, vue: "profil",
    camera: { cible: [0, 30, 10], dist: 412, el: 12 }, ombre: [0, 0, 70, 220], accessoires: [{ type: "tapis", p0: [0, 0, 0] }],
    muscles: { p: ["abdominaux", "flechisseurs"], s: ["obliques", "quadriceps"] },
    tempo: [[0, "Monter les jambes tendues · 1,5 s"], [0.45, "Jambes à la verticale"], [0.55, "Redescendre lentement · 2 s"]],
    cles: [P(0, 12), P(0.45, 88), P(0.55, 88), P(0.95, 12)],
    erreur: { texte: "le bas du dos se creuse quand les jambes descendent : arrêtez la descente plus haut.", zone: ["lombaires"],
      cles: [P(0, 10, -12), P(0.45, 88), P(0.55, 88), P(0.95, 10, -12)] }
  });
}
{ // Mountain climbers : planche haute, genoux ramenés vers la poitrine en alternance
  const a = appui(57, 14, 43, 91, -82);
  const appuiJ = s => ({ ik: [10 * s, 14, -82], pole: [0, -1, 0], pied: PIED_ORTEILS });
  const genouJ = s => ({ ik: [10 * s, 48, -22], pole: [0, -1, 0], pied: PIED_ORTEILS });
  const P = (t, gG, gD, monte = 0) => ({ t, racine: { p: [0, a.y + monte, a.z], r: [a.pitch, 0, 0] }, colonne: col(6 * monte, 0, -10),
    bras: bras2({ ik: [24, 3, 42], pole: [0.6, 0.15, -1], main: MAIN_SOL }), jambes: { G: gG ? genouJ(1) : appuiJ(1), D: gD ? genouJ(-1) : appuiJ(-1) } });
  E("mountain-climber", {
    nom: "Mountain climbers", duree: 0.9, reps: 20, affiche: 0.25, vue: "profil",
    camera: { cible: [0, 30, 0], dist: 380, el: 10 }, ombre: [0, 0, 80, 200], accessoires: [{ type: "tapis", p0: [0, 0, 0] }],
    muscles: { p: ["abdominaux", "flechisseurs"], s: ["deltoides", "quadriceps", "pectoraux"] },
    tempo: [[0, "Genou gauche vers la poitrine"], [0.5, "Changer de jambe"]],
    cles: [P(0, false, false), P(0.25, true, false, 1), P(0.5, false, false), P(0.75, false, true, 1)],
    erreur: { texte: "les fesses montent très haut : le gainage disparaît et l'exercice perd son intérêt.", zone: ["abdominaux"],
      cles: [P(0, false, false, 14), P(0.25, true, false, 18), P(0.5, false, false, 14), P(0.75, false, true, 18)] }
  });
}
{ // Burpee : accroupi, planche, accroupi, saut bras en l'air
  const a = appui(57, 14, 43, 91, -82);
  const debout = { t: 0, racine: { p: [0, 99, 0], r: [0, 0, 0] }, colonne: col(0, 0, 0),
    bras: bras2({ ik: [19, 88, 2], pole: [0.4, 0, -1], main: [0, 180, 0] }), jambes: jambes2({ ik: [13, 8, 3], pole: [0.3, 0, 1], pied: [0, 10, 0] }) };
  const accroupi = t => ({ t, racine: { p: [0, 52, -14], r: [38, 0, 0] }, colonne: col(10, 6, -10),
    bras: bras2({ ik: [22, 3, 40], pole: [0.6, 0.2, -1], main: MAIN_SOL }), jambes: jambes2({ ik: [13, 8, 3], pole: [0.35, 0, 1], pied: [0, 10, 0] }) });
  const planche = t => ({ t, racine: { p: [0, a.y, a.z], r: [a.pitch, 0, 0] }, colonne: col(0, 0, -10),
    bras: bras2({ ik: [24, 3, 42], pole: [0.6, 0.15, -1], main: MAIN_SOL }), jambes: jambes2({ ik: [10, 14, -82], pole: [0, -1, 0], pied: PIED_ORTEILS }) });
  // petit bond entre l'accroupi et la planche : les pieds décollent au lieu de glisser à travers le sol
  const bond = t => ({ t, racine: { p: [0, (52 + a.y) / 2 + 6, (-14 + a.z) / 2], r: [(38 + a.pitch) / 2, 0, 0] }, colonne: col(5, 3, -10),
    bras: bras2({ ik: [23, 3, 41], pole: [0.6, 0.15, -1], main: MAIN_SOL }), jambes: jambes2({ ik: [12, 26, -40], pole: [0, -1, 0.5], pied: [60, 0, 0] }) });
  const saut = { t: 0.78, racine: { p: [0, 112, 0], r: [0, 0, 0] }, colonne: col(0, 0, -4),
    bras: bras2({ fk: { flex: 172, abd: 8 }, coude: 4, prono: 90 }), jambes: jambes2({ ik: [13, 22, 3], pole: [0.2, 0, 1], pied: [35, 0, 0] }) };
  // après le saut, les bras redescendent par les côtés (sans passer derrière la tête)
  const bras_redescendent = { ...copie(debout), t: 0.89, racine: { p: [0, 99, 0], r: [0, 0, 0] }, bras: bras2({ fk: { flex: 10, abd: 62 }, coude: 10, prono: 90 }) };
  E("burpee", {
    nom: "Burpee", duree: 3.2, reps: 8, affiche: 0.38, vue: "3/4",
    camera: { cible: [0, 96, -22], dist: 510, el: 10 }, ombre: [0, -20, 90, 220], accessoires: [{ type: "tapis", p0: [0, 0, -20] }],
    muscles: { p: ["quadriceps", "pectoraux"], s: ["fessiers", "deltoides", "triceps", "abdominaux", "mollets"] },
    tempo: [[0, "S'accroupir, mains au sol"], [0.24, "Pieds en arrière : planche"], [0.5, "Pieds sous les mains"], [0.68, "Sauter, bras en l'air"], [0.86, "Atterrir souplement"]],
    cles: [debout, accroupi(0.16), bond(0.24), planche(0.32), planche(0.46), bond(0.53), accroupi(0.6), saut, bras_redescendent, { ...copie(debout), t: 0.97 }]
  });
}
{ // Jumping jacks : sauter jambes écartées, bras au-dessus de la tête
  // Capture réelle CMU sujet 13, essai 29, images 270 à 396 (mannequin/outils/capture-cmu.py jj) :
  // [t, hauteur du bassin, demi-écart des chevilles, chevilles décollées du sol, écartement des bras, coude]
  const CMU_13_29_JJ = [
    [0, 89.5, 12, 1.4, 2, 30], [0.083, 96.4, 12.8, 4, 6, 32], [0.167, 107.2, 17.7, 9.2, 26, 40], [0.25, 109.9, 25.4, 12.6, 55, 46],
    [0.333, 104.6, 33.4, 10.8, 83, 48], [0.417, 92.6, 39.8, 5, 108, 54], [0.5, 82.4, 37.8, 1.1, 122, 70], [0.583, 85.1, 37.4, 1.6, 116, 69],
    [0.667, 96.9, 35.8, 6.4, 93, 59], [0.75, 105.9, 30.2, 10.7, 69, 45], [0.833, 106.9, 20.2, 11.5, 44, 37], [0.917, 99.6, 13.4, 7, 19, 35]];
  const capte = ([t, y, pieds, decolle, bras, coude]) => ({ t, racine: { p: [0, y, 0], r: [0, 0, 0] }, colonne: col(0, 0, 0),
    // la capture ne monte les bras qu'à 122° : on garde son rythme mais on va jusqu'au-dessus de la tête (172°), coudes presque tendus
    bras: bras2({ fk: { flex: 0, abd: 2 + (bras - 2) * 170 / 120 }, coude: 6 + (coude - 30) / 5, prono: 90 }),
    jambes: jambes2({ ik: [pieds, 8 + decolle, 3], pole: [0.3, 0, 1], pied: [Math.min(25, decolle * 3), 8, 0] }) });   // pointe du pied tendue en l'air
  E("jumping-jack", {
    nom: "Jumping jacks", duree: 1, reps: 20, affiche: 0.5, vue: "face",
    camera: { cible: [0, 100, 0], dist: 520, el: 4 }, ombre: [0, 0, 110, 90],
    muscles: { p: ["mollets", "deltoides"], s: ["quadriceps", "fessiers", "adducteurs"] },
    tempo: [[0, "Pieds joints, bras le long du corps"], [0.5, "Pieds écartés, bras en l'air"]],
    cles: CMU_13_29_JJ.map(capte)
  });
}
{ // Soulevé de terre roumain avec un sac à dos : charnière de hanche, dos droit
  const PIEDS = jambes2({ ik: [12, 8, 3], pole: [0.2, 0, 1], pied: PIED_PLAT(6) });
  const P = (t, y, z, pitch, mains, colonne = col(0, 0, -6)) => ({ t, racine: { p: [0, y, z], r: [pitch, 0, 0] }, colonne,
    bras: bras2({ ik: mains, pole: [0.3, 0, -1], main: [0, 180, 0] }), jambes: PIEDS });
  const haut = P(0, 99, 0, 0, [14, 72, 8], col(0, 0, 0));
  const bas = P(0.45, 92, -16, 68, [14, 56, 22]);
  // Rythme réel, capture CMU sujet 115 essais 02 (images 30 à 90 et 118 à 165, mannequin/outils/capture-cmu.py progression) :
  // progression [recul des hanches, bascule du buste] de 0 (debout) à 1 (en bas). Descente : les hanches reculent d'abord ;
  // montée : le buste se redresse d'abord, les hanches reviennent en dernier. Les poses extrêmes restent les nôtres.
  const DESC = [[0.21, 0.12], [0.6, 0.36], [0.91, 0.61], [0.98, 0.8], [0.98, 0.94]], MONT = [[0.05, 0.18], [0.19, 0.39], [0.45, 0.61], [0.72, 0.79], [0.92, 0.93]];
  const entre = (t, z, b) => P(t, 99 - 7 * b, -16 * z, 68 * b, [14, 72 - 16 * b, 8 + 14 * b], col(0, 0, -6 * b));
  const descente = DESC.map(([z, b], j) => entre(0.45 * (j + 1) / 6, z, b));
  const montee = MONT.map(([z, b], j) => entre(0.56 + 0.38 * (j + 1) / 6, 1 - z, 1 - b));
  E("souleve-roumain", {
    nom: "Soulevé de terre roumain", duree: 4, reps: 10, affiche: 0.47, vue: "profil",
    camera: { cible: [0, 90, 0], dist: 440, el: 6 }, ombre: [0, 0, 90, 110],
    muscles: { p: ["ischios", "fessiers"], s: ["lombaires", "dorsaux", "avant-bras"] },
    tempo: [[0, "Reculer les fesses, dos droit · 2 s"], [0.45, "Les mains descendent le long des cuisses"], [0.56, "Pousser les hanches vers l'avant · 1 s"]],
    cles: [haut, ...descente, bas, { ...copie(bas), t: 0.56 }, ...montee, { ...copie(haut), t: 0.94 }],
    erreur: { texte: "le dos s'arrondit pour descendre plus bas : ce sont les lombaires qui encaissent au lieu des hanches.", zone: ["lombaires"],
      cles: [haut, P(0.45, 95, -6, 46, [14, 40, 26], col(28, 24, 12)), P(0.56, 95, -6, 46, [14, 40, 26], col(28, 24, 12)), { ...copie(haut), t: 0.94 }] }
  });
}

/* ---------- SALLE DE SPORT : poids libres, banc, poulie ---------- */
const PRISE = { doigts: 88, phal: 95, pouce: 80 };      // main fermée sur une barre ou un haltère
const DEBOUT = jambes2({ ik: [12, 8, 3], pole: [0.2, 0, 1], pied: PIED_PLAT(6) });
const HALTERES = [{ type: "haltere", main: "G" }, { type: "haltere", main: "D" }];
{ // Curl biceps aux haltères : coudes collés au corps, seuls les avant-bras bougent
  const P = (t, coude, epaule = 0, lomb = 0) => ({ t, racine: { p: [0, 99, 0], r: [0, 0, 0] }, colonne: col(lomb, 0, 0),
    bras: bras2({ fk: { flex: epaule, abd: 6 }, coude, prono: 0, ...PRISE }), jambes: DEBOUT });
  E("curl-biceps", {
    nom: "Curl biceps aux haltères", duree: 3.5, reps: 10, affiche: 0.45, vue: "3/4",
    camera: { cible: [0, 110, 0], dist: 380, el: 6 }, ombre: [0, 0, 70, 70], accessoires: HALTERES,
    muscles: { p: ["biceps"], s: ["avant-bras", "deltoides"] },
    tempo: [[0, "Monter en 1 s, coudes fixes"], [0.4, "Serrer en haut"], [0.5, "Descendre en 2 s"]],
    cles: [P(0, 4), P(0.4, 135, 8), P(0.5, 135, 8), P(0.95, 4)],
    erreur: { texte: "le buste part en arrière et les coudes avancent : l'élan du dos soulève le poids à la place des biceps.", zone: ["lombaires", "deltoides"],
      cles: [P(0, 4), P(0.4, 130, 45, -18), P(0.5, 130, 45, -18), P(0.95, 4)] }
  });
}
{ // Développé couché à la barre : allongé sur le banc, la barre descend au bas des pectoraux
  const BANC = { type: "banc", p0: [0, 0, -15] };
  const J = jambes2({ ik: [20, 8, 48], pole: [0.3, 1, 0], pied: PIED_PLAT(8) });
  const P = (t, y, z, ecart = 28, pole = [0.8, -1, 0.3]) => ({ t, racine: { p: [0, 60, 0], r: [-90, 0, 0] }, colonne: col(0, -4, 10),
    bras: bras2({ ik: [ecart, y, z], pole, ...PRISE }), jambes: J });
  const haut = P(0, 110, -40), bas = P(0.45, 76, -34);
  E("developpe-couche", {
    nom: "Développé couché à la barre", duree: 3.5, reps: 8, affiche: 0.45, vue: "3/4",
    camera: { cible: [0, 70, -10], dist: 420, el: 18 }, ombre: [0, -15, 90, 200], accessoires: [BANC, { type: "barre-olympique", main: "2" }],
    muscles: { p: ["pectoraux", "triceps"], s: ["deltoides", "avant-bras"] },
    tempo: [[0, "Descendre en 2 s vers le bas des pectoraux"], [0.45, "Toucher sans rebondir"], [0.55, "Pousser en 1 s"]],
    cles: [haut, bas, { ...copie(bas), t: 0.55 }, { ...copie(haut), t: 0.95 }],
    erreur: { texte: "coudes écartés à 90° et barre qui descend vers le cou : l'avant de l'épaule se coince.", zone: ["deltoides"],
      cles: [haut, P(0.45, 80, -46, 30, [1, 0, 0]), P(0.55, 80, -46, 30, [1, 0, 0]), { ...copie(haut), t: 0.95 }] }
  });
}

{ // Développé incliné aux haltères : dossier à 30°, haltères qui montent au-dessus des épaules
  const BANC = { type: "banc", dossier: 30, ry: 180, p0: [0, 0, 0] };
  const J = jambes2({ ik: [20, 8, 72], pole: [0.3, 0.3, 1], pied: PIED_PLAT(8) });
  const P = (t, y, z, x, pole = [0.9, -1, 0.2]) => ({ t, racine: { p: [0, 62, 18], r: [-58, 0, 0] }, colonne: col(0, -2, 22),
    bras: bras2({ ik: [x, y, z], pole, prono: -80, ...PRISE }), jambes: J });
  const haut = P(0, 128, -12, 14), bas = P(0.45, 88, -10, 33);
  E("developpe-incline", {
    nom: "Développé incliné aux haltères", duree: 3.5, reps: 10, affiche: 0.45, vue: "3/4",
    camera: { cible: [0, 80, 0], dist: 430, el: 12 }, ombre: [0, 5, 90, 180], accessoires: [BANC, ...HALTERES],
    muscles: { p: ["pectoraux", "deltoides"], s: ["triceps"] },
    tempo: [[0, "Descendre en 2 s, coudes à 45°"], [0.45, "Étirer la poitrine"], [0.55, "Pousser en 1 s"]],
    cles: [haut, bas, { ...copie(bas), t: 0.55 }, { ...copie(haut), t: 0.95 }],
    erreur: { texte: "les haltères descendent trop bas, coudes sous le banc : l'épaule part en avant et se fragilise.", zone: ["deltoides"],
      cles: [haut, P(0.45, 76, -14, 40, [1, -1, -0.2]), P(0.55, 76, -14, 40, [1, -1, -0.2]), { ...copie(haut), t: 0.95 }] }
  });
}
{ // Rowing haltère un bras : genou et main droits sur le banc, le bras gauche tire
  const BANC = { type: "banc", p0: [-12, 0, 10] };
  const D_ = { fk: { flex: 80, abd: 4 }, coude: 4, main: MAIN_SOL };          // bras d'appui tendu à la verticale, main à plat sur le banc
  const JB = { G: { ik: [24, 8, 16], pole: [0.2, 0, 1], pied: PIED_PLAT(10) }, D: { ik: [-12, 58, -40], pole: [0, -1, 0.2] } };
  const P = (t, main, pole = [0.3, 1, -1], rot = 0) => ({ t, racine: { p: [0, 96 + rot * 0.05, 0], r: [78, 0, 0] }, colonne: col(0, 0, -30, rot),
    bras: { G: { ik: main, pole, prono: -85, ...PRISE }, D: rot ? { ...D_, coude: 28 } : D_ }, jambes: JB });   // buste tourné : l'épaule d'appui descend, le coude plie
  const bas = P(0, [25, 52, 44]), haut = P(0.4, [25, 88, 18]);
  const plie = k => ({ ...copie(k), bras: { ...copie(k.bras), D: { ...D_, coude: 28 } } });   // erreur : coude d'appui plié tout du long, sinon il se déplie pendant la rotation et la main entre dans le banc       // l'haltère pend à côté du genou d'appui, sans le toucher
  E("rowing-haltere", {
    nom: "Rowing haltère à un bras", duree: 3.5, reps: 10, affiche: 0.4, vue: "profil",
    camera: { cible: [0, 70, 15], dist: 420, el: 10 }, ombre: [0, 10, 80, 180], accessoires: [BANC, { type: "haltere", main: "G" }],
    muscles: { p: ["dorsaux"], s: ["biceps", "trapezes", "deltoides", "avant-bras"] },
    tempo: [[0, "Tirer le coude vers la hanche · 1 s"], [0.4, "Serrer l'omoplate"], [0.5, "Descendre en 2 s"]],
    cles: [bas, haut, { ...copie(haut), t: 0.5 }, { ...copie(bas), t: 0.95 }],
    erreur: { texte: "le buste tourne vers le plafond pour monter la charge : c'est le dos qui se tord au lieu du grand dorsal qui travaille.", zone: ["lombaires", "obliques"],
      cles: [plie(bas), P(0.4, [27, 98, 22], [0.6, 1, -0.4], 30), P(0.5, [27, 98, 22], [0.6, 1, -0.4], 30), { ...plie(bas), t: 0.95 }] }
  });
}
{ // Tirage vertical à la poulie haute, assis
  const J = jambes2({ ik: [16, 8, 42], pole: [0.2, 0, 1], pied: PIED_PLAT(8) });
  const P = (t, y, z, x, pitch = -8, pole = [1, -0.4, 0]) => ({ t, racine: { p: [0, 61, -8], r: [pitch, 0, 0] }, colonne: col(0, -6, -8),
    bras: bras2({ ik: [x, y, z], pole, ...PRISE }), jambes: J });
  const haut = P(0, 154, 2, 32), bas = P(0.45, 108, 8, 30);
  E("tirage-vertical", {
    nom: "Tirage vertical à la poulie", duree: 3.5, reps: 10, affiche: 0.45, vue: "3/4",
    camera: { cible: [0, 110, 0], dist: 470, el: 8 }, ombre: [0, -10, 90, 140],
    accessoires: [{ type: "banc", l: 60, p0: [0, 0, -12] }, { type: "poulie", h: 225, bras: 72, ry: 180, p0: [0, 0, 76] },    // face à la machine : la potence revient au-dessus de la tête
      { type: "machine", pieces: [{ c: [5, 44], p: [0, 72, 30], r: [0, 0, 90], m: "cuir" }, { b: [6, 6, 46], p: [0, 72, 53] }] },       // boudins qui bloquent les cuisses
      { type: "cable", de: [0, 219, 4], main: "2", poignee: 110 }],
    muscles: { p: ["dorsaux"], s: ["biceps", "trapezes", "avant-bras", "deltoides"] },
    tempo: [[0, "Tirer la barre vers le haut de la poitrine · 1 s"], [0.45, "Coudes vers les hanches"], [0.55, "Remonter en 2 s, bras tendus"]],
    cles: [haut, bas, { ...copie(bas), t: 0.55 }, { ...copie(haut), t: 0.95 }],
    erreur: { texte: "se pencher loin en arrière et tirer derrière la nuque : le dos se creuse et l'épaule force en rotation.", zone: ["lombaires", "deltoides"],
      cles: [haut, P(0.45, 128, -14, 30, -32), P(0.55, 128, -14, 30, -32), { ...copie(haut), t: 0.95 }] }
  });
}
{ // Rowing barre buste penché
  const J = jambes2({ ik: [14, 8, 4], pole: [0.2, 0, 1], pied: PIED_PLAT(6) });
  const P = (t, y, z, pitch = 45, colonne = col(0, 0, -20), py = 92) => ({ t, racine: { p: [0, py, -12], r: [pitch, 0, 0] }, colonne,
    bras: bras2({ ik: [22, y, z], pole: [0.3, 0.4, -1], ...PRISE }), jambes: J });
  const bas = P(0, 72, 22), haut = P(0.4, 98, 2);
  E("rowing-barre", {
    nom: "Rowing barre buste penché", duree: 3.5, reps: 10, affiche: 0.4, vue: "3/4",
    camera: { cible: [0, 90, 5], dist: 430, el: 6 }, ombre: [0, 0, 90, 110], accessoires: [{ type: "barre-olympique", main: "2" }],
    muscles: { p: ["dorsaux", "trapezes"], s: ["biceps", "lombaires", "ischios", "deltoides", "avant-bras"] },
    tempo: [[0, "Tirer la barre vers le nombril · 1 s"], [0.4, "Serrer les omoplates"], [0.5, "Descendre en 2 s, dos fixe"]],
    cles: [bas, haut, { ...copie(haut), t: 0.5 }, { ...copie(bas), t: 0.95 }],
    erreur: { texte: "dos rond et buste qui se redresse à chaque répétition : les lombaires encaissent et le dos ne travaille presque plus.", zone: ["lombaires"],
      cles: [P(0, 74, 22, 50, col(26, 20, 0)), P(0.4, 104, 12, 22, col(18, 12, 0), 96), P(0.5, 104, 12, 22, col(18, 12, 0), 96), P(0.95, 74, 22, 50, col(26, 20, 0))] }
  });
}
{ // Soulevé de terre à la barre : la barre part du sol, frôle les tibias, et on se redresse en poussant le sol
  const J = jambes2({ ik: [14, 8, 3], pole: [0.25, 0, 1], pied: PIED_PLAT(8) });
  const P = (t, py, pz, pitch, mains, colonne = col(0, 0, -20)) => ({ t, racine: { p: [0, py, pz], r: [pitch, 0, 0] }, colonne,
    bras: bras2({ ik: mains, pole: [0.2, 0, -1], ...PRISE }), jambes: J });
  // rythme réel (capture CMU 115_06, hauteur du bassin) : en descendant on reste haut longtemps puis on descend vite ;
  // en montant la hauteur accélère au milieu. Seuls les instants des clés en viennent : les poses restent les nôtres.
  // trajet de la barre : épaules au-dessus de la barre, hanches en arrière ; les genoux reculent avant que la barre passe
  // (genoux), puis la barre glisse devant les cuisses (cuisses) : sinon elle traverse tibias et cuisses
  const bas = P(0, 62, -26, 56, [22, 30, 16]), genoux = P(0.29, 80, -24, 45, [22, 52, 16], col(0, 0, -14)),
    cuisses = P(0.365, 90, -14, 28, [22, 66, 13], col(0, 0, -8)), haut = P(0.5, 99, 0, 0, [22, 83, 9.5], col(0, 0, 0));      // cibles des mains à portée des bras : sinon le bras tendu décide seul
  const verrou = t => P(t, 96, -6, 12, [22, 78, 12], col(0, 0, -4));     // fin de la montée : la barre reste devant le haut des cuisses
  const E0 = t => P(t, 72, -18, 64, [22, 32, 18], col(30, 26, 10)), E1 = t => P(t, 84, -18, 50, [22, 52, 17], col(24, 20, 6)),
    E2 = t => P(t, 92, -13, 34, [22, 66, 15], col(14, 12, 4));
  E("souleve-de-terre", {
    nom: "Soulevé de terre", duree: 4.5, reps: 5, affiche: 0.02, vue: "3/4",
    camera: { cible: [0, 80, 0], dist: 440, el: 6 }, ombre: [0, 0, 90, 110], accessoires: [{ type: "barre-olympique", main: "2" }],
    muscles: { p: ["fessiers", "ischios", "lombaires"], s: ["quadriceps", "dorsaux", "trapezes", "avant-bras", "abdominaux"] },
    tempo: [[0, "Dos plat, pousser le sol avec les jambes"], [0.3, "La barre frôle les tibias"], [0.5, "Hanches en avant, debout"], [0.6, "Redescendre en reculant les fesses"]],
    cles: [bas, genoux, cuisses, verrou(0.43), haut, { ...copie(haut), t: 0.6 }, verrou(0.75), { ...copie(cuisses), t: 0.8 }, { ...copie(genoux), t: 0.86 },
      { ...copie(bas), t: 0.97 }],
    erreur: { texte: "dos arrondi au départ : la charge tire sur les lombaires au lieu des hanches et des jambes.", zone: ["lombaires"],
      cles: [E0(0), E1(0.29), E2(0.365), verrou(0.43), haut, { ...copie(haut), t: 0.6 }, verrou(0.75), E2(0.8), E1(0.86), E0(0.97)] }
  });
}
{ // Développé militaire debout aux haltères
  const P = (t, y, x, lomb = 0, z = 4) => ({ t, racine: { p: [0, 99, 0], r: [0, 0, 0] }, colonne: col(lomb, lomb * 0.6, 0),
    bras: bras2({ ik: [x, y, z], pole: [1, -1, 0.2], prono: -80, ...PRISE }), jambes: DEBOUT });
  const bas = P(0, 150, 31), haut = P(0.4, 190, 17);           // départ : haltères au niveau des oreilles, avant-bras verticaux
  E("developpe-militaire", {
    nom: "Développé militaire aux haltères", duree: 3.5, reps: 10, affiche: 0.4, vue: "3/4",
    camera: { cible: [0, 120, 0], dist: 420, el: 6 }, ombre: [0, 0, 70, 70], accessoires: HALTERES,
    muscles: { p: ["deltoides", "triceps"], s: ["trapezes", "pectoraux", "abdominaux"] },
    tempo: [[0, "Pousser au-dessus de la tête · 1 s"], [0.4, "Bras tendus, sans bloquer"], [0.5, "Redescendre en 2 s"]],
    cles: [bas, haut, { ...copie(haut), t: 0.5 }, { ...copie(bas), t: 0.95 }],
    erreur: { texte: "le bas du dos se creuse pour pousser : abdominaux et fessiers relâchés, ce sont les lombaires qui prennent.", zone: ["lombaires"],
      cles: [P(0, 150, 31, -18, 10), P(0.4, 188, 17, -26, 14), P(0.5, 188, 17, -26, 14), P(0.95, 150, 31, -18, 10)] }
  });
}
{ // Élévations latérales
  const P = (t, abd, coude = 18, cou = 0, flex = 10) => ({ t, racine: { p: [0, 99, 0], r: [0, 0, 0] }, colonne: col(0, 4, cou),
    bras: bras2({ fk: { flex, abd }, coude, prono: -85, ...PRISE }), jambes: DEBOUT });
  E("elevations-laterales", {
    nom: "Élévations latérales", duree: 3.5, reps: 12, affiche: 0.4, vue: "face",
    camera: { cible: [0, 120, 0], dist: 420, el: 6 }, ombre: [0, 0, 80, 70], accessoires: HALTERES,
    muscles: { p: ["deltoides"], s: ["trapezes"] },
    tempo: [[0, "Monter sur les côtés · 1 s"], [0.4, "Coudes à hauteur d'épaule"], [0.5, "Descendre en 2 s"]],
    cles: [P(0, 8), P(0.4, 86), P(0.5, 86), P(0.95, 8)],
    erreur: { texte: "monter au-dessus des épaules en haussant les épaules : ce sont les trapèzes qui travaillent, pas les deltoïdes.", zone: ["trapezes"],
      cles: [P(0, 8), P(0.4, 120, 30, 15, 25), P(0.5, 120, 30, 15, 25), P(0.95, 8)] }
  });
}
{ // Extension des triceps à la poulie haute (pushdown)
  const P = (t, coude, flex = 4, pitch = 10) => ({ t, racine: { p: [0, 98, -4], r: [pitch, 0, 0] }, colonne: col(0, 0, -4),
    bras: bras2({ fk: { flex, abd: 8 }, coude, prono: 80, ...PRISE }), jambes: DEBOUT });
  E("triceps-poulie", {
    nom: "Extension des triceps à la poulie", duree: 3, reps: 12, affiche: 0.4, vue: "profil",
    camera: { cible: [0, 115, 2], dist: 470, el: 6 }, ombre: [0, 15, 90, 120],
    accessoires: [{ type: "poulie", h: 205, p0: [0, 0, 52] }, { type: "cable", de: [0, 205, 58], main: "2", poignee: 30 }],
    muscles: { p: ["triceps"], s: ["avant-bras", "abdominaux"] },
    tempo: [[0, "Pousser vers le bas · 1 s"], [0.4, "Bras tendus, coudes collés"], [0.5, "Remonter en 2 s jusqu'à 90°"]],
    cles: [P(0, 100), P(0.4, 4), P(0.5, 4), P(0.95, 100)],
    erreur: { texte: "les coudes s'écartent et avancent : les épaules et le dos aident, les triceps travaillent moins.", zone: ["deltoides", "pectoraux"],
      cles: [P(0, 120, 45, 20), P(0.4, 10, 9, 30), P(0.5, 10, 9, 30), P(0.95, 120, 45, 20)] }
  });
}
{ // Squat barre sur le dos, et fentes arrière avec haltères : mêmes mouvements que les versions au poids du corps
  const BARRE = bras2({ fk: { flex: -45, abd: 50, rot: 85 }, coude: 142, prono: 0, ...PRISE });
  const sq = EXERCICES["squat"], fe = EXERCICES["fente-arriere"];
  const avecBras = (cles, bras) => cles.map(k => ({ ...copie(k), bras: copie(bras) }));
  // barre sur les trapèzes : la nuque reste neutre (tête en arrière, elle irait dans la barre)
  const nuque = (cles, mini = -4) => cles.map(k => { if (k.colonne?.cou) k.colonne.cou.flex = Math.max(k.colonne.cou.flex || 0, mini); return k; });
  E("squat-barre", {
    ...copie(sq), recalageDe: "squat", nom: "Squat barre sur le dos", reps: 8, accessoires: [{ type: "barre-olympique", main: "2" }],
    muscles: { p: ["quadriceps", "fessiers"], s: ["ischios", "adducteurs", "lombaires", "abdominaux", "trapezes"] },
    cles: nuque(avecBras(sq.cles, BARRE)),
    erreur: { ...copie(sq.erreur), cles: nuque(avecBras(sq.erreur.cles, BARRE), 0), clesFemme: nuque(avecBras(sq.erreur.cles, BARRE)) }   // nuque : l'homme touche la barre tête en arrière, la femme tête en avant
  });
  const BAS = bras2({ fk: { flex: 2, abd: 7 }, coude: 4, prono: -85, ...PRISE });
  E("fentes-halteres", {
    ...copie(fe), recalageDe: "fente-arriere", nom: "Fentes arrière avec haltères", accessoires: HALTERES,
    muscles: { p: ["quadriceps", "fessiers"], s: ["ischios", "adducteurs", "mollets", "avant-bras", "trapezes"] },
    cles: avecBras(fe.cles, BAS), erreur: { ...copie(fe.erreur), cles: avecBras(fe.erreur.cles, BAS) }
  });
  const sr = EXERCICES["souleve-roumain"], devant = b => ({ ...b, ...PRISE, ik: [b.ik[0] + 3, b.ik[1] + 4, b.ik[2] + 13] });   // les disques frôlent les cuisses sans y entrer
  const PRISE_SR = k => ({ ...copie(k), bras: { G: devant(k.bras.G), D: devant(k.bras.D) } });
  E("souleve-roumain-halteres", {
    ...copie(sr), recalageDe: "souleve-roumain", nom: "Soulevé de terre roumain aux haltères", reps: 10, accessoires: HALTERES,
    cles: sr.cles.map(PRISE_SR), erreur: { ...copie(sr.erreur), cles: sr.erreur.cles.map(PRISE_SR) }
  });
}
{ // Hip thrust : haut du dos sur le banc, barre sur les hanches
  const J = jambes2({ ik: [18, 8, 40], pole: [0.3, 1, 0.4], pied: PIED_PLAT(8) });
  const P = (t, py, pz, pitch, cou = 0, lomb = 0) => {
    const hz = pz + 4, hy = py - 1 + (pitch > -70 ? 5 : 0);   // en bas, les cuisses remontent vers les genoux : barre 5 cm plus haut
    return { t, racine: { p: [0, py, pz], r: [pitch, 0, 0] }, colonne: col(lomb, 0, cou),
      bras: bras2({ ik: [30, hy + 18, hz + 2], pole: [0.5, 1, 0], ...PRISE }), jambes: J };
  };
  const bas = P(0, 28, -12, -50, 30), haut = P(0.4, 56, -2, -88, 40);
  E("hip-thrust", {
    nom: "Hip thrust à la barre", duree: 3.5, reps: 10, affiche: 0.4, vue: "3/4",
    camera: { cible: [0, 50, -5], dist: 430, el: 8 }, ombre: [0, 0, 90, 150],
    accessoires: [{ type: "banc", l: 110, ry: 90, p0: [0, 0, -46] }, { type: "barre-olympique", main: "2" }],
    muscles: { p: ["fessiers"], s: ["ischios", "quadriceps", "abdominaux"] },
    tempo: [[0, "Pousser dans les talons · 1 s"], [0.4, "Serrer les fesses 1 s, menton rentré"], [0.55, "Redescendre en 2 s"]],
    cles: [bas, haut, { ...copie(haut), t: 0.55 }, { ...copie(bas), t: 0.95 }],
    erreur: { texte: "monter en cambrant le bas du dos, tête en arrière : les lombaires remplacent les fessiers.", zone: ["lombaires"],
      cles: [bas, P(0.4, 64, -2, -94, -10, -22), P(0.55, 64, -2, -94, -10, -22), { ...copie(bas), t: 0.95 }] }
  });
}

/* ---------- MACHINES ---------- */
const ASSIS = 61;                                          // hauteur du bassin assis sur un siège de 47 cm
const PILE = (x, z) => [{ b: [8, 220, 8], p: [x - 14, 110, z] }, { b: [8, 220, 8], p: [x + 14, 110, z] }, { b: [36, 6, 14], p: [x, 217, z] },
  { b: [22, 70, 12], p: [x, 38, z], m: "fonte" }, { b: [50, 1, 30], p: [x, 0.5, z] }];
const SIEGE = (z = 0, dos = true, h = 47) => [{ b: [44, 8, 44], p: [0, h - 4, z + 6], m: "cuir" }, { b: [7, h - 8, 7], p: [0, (h - 8) / 2, z + 6] },
  { b: [70, 1, 80], p: [0, 0.5, z + 10] }, ...(dos ? [{ b: [44, 70, 8], p: [0, h + 38, z - 17], m: "cuir" }, { b: [7, h + 60, 7], p: [0, (h + 60) / 2, z - 24] }] : [])];
const MAINS_SIEGE = bras2({ ik: [25, 49, 6], pole: [0.3, -1, 0], ...PRISE });
const machine = (pieces, o = {}) => ({ type: "machine", pieces, ...o });
const levier = (de, suit, decal, r = 2, perp) => ({ type: "cable", r, de, suit, decal, perp });
/* Bas du tibia (un cinquième du chemin de la cheville au genou), des deux jambes : là où se posent les boudins */
const TIBIAS = ["chevilleG", "chevilleG", "chevilleG", "chevilleG", "genouG", "chevilleD", "chevilleD", "chevilleD", "chevilleD", "genouD"];
{ // Leg extension : assis, les tibias poussent le boudin vers l'avant
  const J = g => jambes2({ fk: { flex: 88, abd: 2 }, genou: g, cheville: 10 });
  const P = (t, g, lomb = 0) => ({ t, racine: { p: [0, ASSIS + (lomb ? 2 : 0), lomb ? 4.5 : -4], r: [-4, 0, 0] }, colonne: col(lomb, 0, -4), bras: MAINS_SIEGE, jambes: J(g) });
  const TIBIA_AVANT = ["genouG", "chevilleG", 10];          // boudin contre le devant du bas des tibias
  E("leg-extension", {
    nom: "Leg extension", duree: 3.5, reps: 12, affiche: 0.4, vue: "3/4",
    camera: { cible: [0, 70, 15], dist: 430, el: 8 }, ombre: [0, 10, 90, 120],
    accessoires: [machine([...SIEGE(-4), ...PILE(-55, -20), { c: [5, 12], p: [24, 56, 40], r: [0, 0, 90], m: "acier" }, { c: [5, 12], p: [-24, 56, 40], r: [0, 0, 90], m: "acier" }]),
      machine([{ c: [5, 40], r: [0, 0, 90], m: "cuir" }], { suit: TIBIAS, perp: TIBIA_AVANT }),
      levier([24, 56, 40], TIBIAS, [22, 0, 0], 2, TIBIA_AVANT), levier([-24, 56, 40], TIBIAS, [-22, 0, 0], 2, TIBIA_AVANT)],
    muscles: { p: ["quadriceps"], s: [] },
    tempo: [[0, "Tendre les jambes · 1 s"], [0.4, "Serrer 1 s en haut"], [0.5, "Redescendre en 2 s"]],
    cles: [P(0, 90), P(0.4, 4), P(0.5, 4), P(0.95, 90)],
    erreur: { texte: "lancer la charge en décollant les fesses et en tirant sur les poignées : le dos aide et le genou encaisse un choc en haut.", zone: ["lombaires"],
      cles: [P(0, 90), P(0.25, 0, -14), P(0.35, 0, -14), P(0.55, 95)] }
  });
}
{ // Leg curl assis : les talons tirent le boudin vers le bas et l'arrière
  const J = g => jambes2({ fk: { flex: 88, abd: 2 }, genou: g, cheville: 10 });
  const J2 = (g, f) => jambes2({ fk: { flex: 88 + f, abd: 2 }, genou: g, cheville: 10 });
  const P = (t, g, flexDos = 0) => ({ t, racine: { p: [0, ASSIS, -4], r: [-4 + flexDos, 0, 0] }, colonne: col(0, 0, -4), bras: MAINS_SIEGE, jambes: J2(g, flexDos) });
  const pieds = ["chevilleG", "chevilleD"];
  const MOLLET = ["genouG", "chevilleG", -11];             // boudin derrière le bas des mollets
  E("leg-curl", {
    nom: "Leg curl assis", duree: 3.5, reps: 12, affiche: 0.4, vue: "3/4",
    camera: { cible: [0, 70, 15], dist: 430, el: 8 }, ombre: [0, 10, 90, 120],
    accessoires: [machine([...SIEGE(-4), ...PILE(-55, -20), { c: [5, 40], p: [0, 72, 34], r: [0, 0, 90], m: "cuir" }, { b: [5, 30, 5], p: [24, 72, 34] }, { b: [5, 30, 5], p: [-24, 72, 34] },
      { c: [5, 12], p: [24, 56, 40], r: [0, 0, 90], m: "acier" }, { c: [5, 12], p: [-24, 56, 40], r: [0, 0, 90], m: "acier" }]),
      machine([{ c: [5, 40], r: [0, 0, 90], m: "cuir" }], { suit: TIBIAS, perp: MOLLET }),
      levier([24, 56, 40], TIBIAS, [22, 0, 0], 2, MOLLET), levier([-24, 56, 40], TIBIAS, [-22, 0, 0], 2, MOLLET)],
    muscles: { p: ["ischios"], s: ["mollets"] },
    tempo: [[0, "Tirer les talons sous le siège · 1 s"], [0.4, "Tenir 1 s"], [0.5, "Remonter en 2 s"]],
    cles: [P(0, 4), P(0.4, 100), P(0.5, 100), P(0.95, 4)],
    erreur: { texte: "le bassin se soulève et le buste bascule pour finir le mouvement : les ischios ne travaillent plus sur toute l'amplitude.", zone: ["lombaires"],
      cles: [P(0, 4), P(0.4, 70, 18), P(0.5, 70, 18), P(0.95, 4)] }
  });
}
{ // Presse à cuisses à 45° : dos sur le dossier, les pieds poussent le plateau le long des rails
  const u = [0, Math.SQRT1_2, Math.SQRT1_2];
  const J = (d, ecart = 15, pole = [0.35, 0.7, -0.6]) => jambes2({ ik: [ecart, 49 + d * u[1], 4 + d * u[2]], pole, pied: [-135, 0, 0] });
  const P = (t, d, extra = {}) => ({ t, racine: { p: [0, 52, 2], r: [-52, 0, 0] }, colonne: col(0, 0, 20), bras: bras2({ ik: [27, 46, 12], pole: [0.3, -1, 0], ...PRISE }), jambes: J(d), ...extra });
  const pieds = ["chevilleG", "chevilleD"];
  const PLIE = { racine: { p: [0, 56, 8], r: [-36, 0, 0] }, colonne: col(24, 10, 20) };
  E("presse-cuisses", {
    nom: "Presse à cuisses", duree: 4, reps: 10, affiche: 0.45, vue: "profil",
    camera: { cible: [0, 75, 35], dist: 470, el: 8 }, ombre: [0, 30, 100, 220],
    accessoires: [machine([{ b: [44, 70, 8], p: [0, 66, -36], r: [-52, 0, 0], m: "cuir" }, { b: [44, 8, 40], p: [0, 41, 6], r: [-12, 0, 0], m: "cuir" },
      { b: [70, 4, 220], p: [0, 2, 40] }, { b: [8, 40, 8], p: [0, 20, -10] }, { b: [8, 30, 8], p: [0, 15, -40] },
      { c: [2.5, 170], p: [40, 95, 80], r: [45, 0, 0], m: "acier" }, { c: [2.5, 170], p: [-40, 95, 80], r: [45, 0, 0], m: "acier" },
      { b: [6, 150, 6], p: [42, 75, 140] }, { b: [6, 150, 6], p: [-42, 75, 140] }]),
      machine([{ b: [76, 50, 4], p: [0, -5, 0] }, { b: [80, 12, 10], p: [0, -26, 4] }, { c: [12, 6], p: [42, 12, 6], r: [0, 0, 90], m: "fonte" }, { c: [12, 6], p: [-42, 12, 6], r: [0, 0, 90], m: "fonte" }],
        { suit: pieds, decal: [0, 6.5, 6.5], rx: -45 })],
    muscles: { p: ["quadriceps", "fessiers"], s: ["ischios", "adducteurs", "mollets"] },
    tempo: [[0, "Descendre en 2 s, genoux vers les épaules"], [0.45, "Bas du dos collé au dossier"], [0.55, "Pousser dans les talons · 1 s"], [0.95, "Sans verrouiller les genoux"]],
    cles: [P(0, 80), P(0.45, 40), P(0.55, 40), P(0.95, 80)],
    erreur: { texte: "descendre si bas que les fesses décollent et le bas du dos s'enroule : les lombaires prennent la charge.", zone: ["lombaires"],
      cles: [P(0, 82), P(0.45, 30, PLIE), P(0.55, 30, PLIE), P(0.95, 82)] }
  });
}
{ // Chest press : assis, pousser les poignées vers l'avant
  const J = jambes2({ fk: { flex: 86, abd: 6 }, genou: 80, pied: PIED_PLAT(6) });
  const P = (t, z, x = 26, coudes = [0.9, -0.6, -0.3]) => ({ t, racine: { p: [0, ASSIS, -6], r: [0, 0, 0] }, colonne: col(0, -6, 0),
    bras: bras2({ ik: [x, 97, z], pole: coudes, prono: 80, ...PRISE }), jambes: J });
  const poignees = ["G", "D"].map(c => machine([{ c: [1.6, 14], r: [0, 0, 90], m: "acier" }], { main: c }));
  E("chest-press", {
    nom: "Chest press (développé assis à la machine)", duree: 3.5, reps: 10, affiche: 0.05, vue: "3/4",
    camera: { cible: [0, 95, 10], dist: 440, el: 8 }, ombre: [0, 5, 90, 120],
    accessoires: [machine([...SIEGE(-6), ...PILE(0, -60), { c: [3, 90], p: [0, 155, -20], r: [0, 0, 90], m: "acier" }]), ...poignees,
      levier([42, 155, -20], ["poingG"], [7, 0, 0], 2.2), levier([-42, 155, -20], ["poingD"], [-7, 0, 0], 2.2)],
    muscles: { p: ["pectoraux", "triceps"], s: ["deltoides"] },
    tempo: [[0, "Pousser devant soi · 1 s"], [0.4, "Bras presque tendus"], [0.5, "Revenir en 2 s, poignées au niveau de la poitrine"]],
    cles: [P(0, 6), P(0.4, 40, 22), P(0.5, 40, 22), P(0.95, 6)],
    erreur: { texte: "le dos se décolle du dossier et les épaules montent vers les oreilles : les épaules poussent à la place des pectoraux.", zone: ["deltoides", "trapezes"],
      cles: [P(0, 0, 28, [1, -0.1, 0]), P(0.4, 40, 22, [1, -0.1, 0]), P(0.5, 40, 22, [1, -0.1, 0]), P(0.95, 0, 28, [1, -0.1, 0])] }
  });
}

{ // Adducteurs et abducteurs à la machine : assis, les genoux serrent ou écartent les boudins
  const J = abd => jambes2({ fk: { flex: 84, abd }, genou: 88, cheville: 10 });
  const P = (t, abd, lomb = 0) => ({ t, racine: { p: [0, ASSIS, -4], r: [-6, 0, 0] }, colonne: col(lomb, 0, -4), bras: MAINS_SIEGE, jambes: J(abd) });
  const coussins = cote => [["genouG", -1], ["genouD", 1]].flatMap(([os, s]) => [
    machine([{ b: [5, cote < 0 ? 12 : 24, cote < 0 ? 14 : 18], m: "cuir" }], { suit: [os], decal: cote < 0 ? [-s * 10, 3.5, -9] : [s * 10.3, -10, 4] }),   // dehors, le genou est plus large ; dedans, contre le bas de la cuisse
    (cote < 0 ? levier([-s * 28, 58, 70], [os], [-s * 15, 3.5, -9], 2.2) : levier([s * 8, 28, 30], [os], [s * 10, -14, -2], 2.2))]);
  const cadre = machine([...SIEGE(-4), ...PILE(0, -70), { b: [30, 30, 10], p: [0, 15, 32] }]);
  const montants = (x, h, z) => machine([{ b: [5, h, 5], p: [x, h / 2, z] }, { b: [5, h, 5], p: [-x, h / 2, z] }]);   // du sol au pivot de chaque levier
  E("adducteurs-machine", {
    nom: "Machine à adducteurs", duree: 3.5, reps: 12, affiche: 0.4, vue: "face",
    camera: { cible: [0, 70, 0], dist: 430, el: 14 }, ombre: [0, 5, 100, 120], accessoires: [cadre, montants(8, 28, 30), ...coussins(1)],
    muscles: { p: ["adducteurs"], s: [] },
    tempo: [[0, "Serrer les genoux · 1 s"], [0.4, "Tenir 1 s"], [0.5, "Ouvrir en 2 s, sans lâcher la charge"]],
    cles: [P(0, 40), P(0.4, 4), P(0.5, 4), P(0.95, 40)],
    erreur: { texte: "ouvrir plus loin que la souplesse ne le permet et laisser claquer la pile : l'aine est étirée sous charge.", zone: ["adducteurs"],
      cles: [P(0, 55, 12), P(0.3, 10), P(0.4, 10), P(0.6, 55, 12)] }
  });
  E("abducteurs-machine", {
    nom: "Machine à abducteurs", duree: 3.5, reps: 12, affiche: 0.4, vue: "face",
    camera: { cible: [0, 70, 0], dist: 430, el: 14 }, ombre: [0, 5, 100, 120], accessoires: [cadre, montants(28, 58, 70), ...coussins(-1)],
    muscles: { p: ["fessiers"], s: [] },
    tempo: [[0, "Écarter les genoux · 1 s"], [0.4, "Tenir 1 s"], [0.5, "Revenir en 2 s"]],
    cles: [P(0, 4), P(0.4, 40), P(0.5, 40), P(0.95, 4)],
    erreur: { texte: "se pencher en avant et donner des à-coups : l'élan du buste remplace le travail des fessiers.", zone: ["lombaires"],
      cles: [P(0, 4), P(0.3, 40, 26), P(0.4, 40, 26), P(0.6, 4)] }
  });
}
{ // Butterfly (pec deck) et oiseau à la machine : bras presque tendus qui se ferment devant la poitrine, ou s'ouvrent vers l'arrière
  const J = jambes2({ fk: { flex: 86, abd: 6 }, genou: 80, pied: PIED_PLAT(6) });
  const P = (t, x, z, y = 100, lomb = 0, pole = [1, -0.3, -0.6]) => ({ t, racine: { p: [0, ASSIS, -6], r: [0, 0, 0] }, colonne: col(lomb, -4, 0),
    bras: bras2({ ik: [x, y, z], pole, prono: 0, ...PRISE }), jambes: J });
  const poignees = ["G", "D"].map(c => machine([{ c: [1.6, 14], r: [0, 0, 90], m: "acier" }], { main: c }));
  const ouvert = P(0, 62, -2), ferme = P(0.4, 8, 40);
  E("pec-deck", {
    nom: "Butterfly (pec deck)", duree: 3.5, reps: 12, affiche: 0.4, vue: "3/4",
    camera: { cible: [0, 100, 5], dist: 450, el: 10 }, ombre: [0, 0, 100, 110],
    accessoires: [machine([...SIEGE(-6), ...PILE(0, -60), { c: [3, 70], p: [0, 172, -12], r: [0, 0, 90], m: "acier" }]), ...poignees,
      levier([20, 172, -12], ["poingG"], [0, 7, 0], 2.2), levier([-20, 172, -12], ["poingD"], [0, 7, 0], 2.2)],
    muscles: { p: ["pectoraux"], s: ["deltoides", "biceps"] },
    tempo: [[0, "Fermer les bras devant soi · 1 s"], [0.4, "Serrer la poitrine 1 s"], [0.5, "Ouvrir en 2 s jusqu'aux épaules"]],
    cles: [ouvert, ferme, { ...copie(ferme), t: 0.5 }, { ...copie(ouvert), t: 0.95 }],
    erreur: { texte: "ouvrir les bras loin derrière le corps : l'avant de l'épaule est tiré à son maximum sous charge.", zone: ["deltoides"],
      cles: [P(0, 66, -19), ferme, { ...copie(ferme), t: 0.5 }, P(0.95, 66, -19)] }
  });
  const R = (t, x, z, y = 104, lomb = 6) => P(t, x, z, y, lomb, [1, 0.3, -0.2]);
  const devant = R(0, 9, 40), ecarte = R(0.4, 64, 2);
  E("oiseau-machine", {
    nom: "Oiseau à la machine (arrière d'épaule)", duree: 3.5, reps: 15, affiche: 0.4, vue: "dos",
    camera: { cible: [0, 105, 0], dist: 450, el: 12 }, ombre: [0, 0, 100, 110],
    accessoires: [machine([...SIEGE(-6, false), { b: [36, 46, 8], p: [0, 96, 17], m: "cuir" }, { b: [7, 7, 55], p: [0, 112, 44] }, ...PILE(0, 70),
      { c: [3, 70], p: [0, 172, 30], r: [0, 0, 90], m: "acier" }]), ...poignees,
      levier([20, 172, 30], ["poingG"], [0, 7, 0], 2.2), levier([-20, 172, 30], ["poingD"], [0, 7, 0], 2.2)],
    muscles: { p: ["deltoides", "trapezes"], s: ["dorsaux"] },
    tempo: [[0, "Ouvrir les bras vers l'arrière · 1 s"], [0.4, "Serrer les omoplates"], [0.5, "Revenir en 2 s"]],
    cles: [devant, ecarte, { ...copie(ecarte), t: 0.5 }, { ...copie(devant), t: 0.95 }],
    erreur: { texte: "hausser les épaules et se redresser en arrière : ce sont les trapèzes et le dos qui tirent, pas l'arrière des épaules.", zone: ["trapezes", "lombaires"],
      cles: [devant, R(0.4, 60, -6, 116, -14), R(0.5, 60, -6, 116, -14), { ...copie(devant), t: 0.95 }] }
  });
}
{ // Développé épaules à la machine
  const J = jambes2({ fk: { flex: 86, abd: 6 }, genou: 80, pied: PIED_PLAT(6) });
  const P = (t, y, x, lomb = 0) => ({ t, racine: { p: [0, ASSIS - (lomb ? 2 : 0), lomb ? 6 : -6], r: [0, 0, 0] }, colonne: col(lomb, lomb * 0.4, -lomb),
    bras: bras2({ ik: [x, y, -4], pole: [1, -1, 0.2], prono: 80, ...PRISE }), jambes: J });
  const poignees = ["G", "D"].map(c => machine([{ c: [1.6, 14], r: [0, 0, 90], m: "acier" }], { main: c }));
  E("shoulder-press", {
    nom: "Développé épaules à la machine", duree: 3.5, reps: 10, affiche: 0.05, vue: "3/4",
    camera: { cible: [0, 110, 0], dist: 460, el: 8 }, ombre: [0, 0, 90, 110],
    accessoires: [machine([...SIEGE(-6), ...PILE(0, -70), { c: [3, 90], p: [0, 70, -44], r: [0, 0, 90], m: "acier" }]), ...poignees,
      levier([40, 70, -44], ["poingG"], [7, 0, 0], 2.2), levier([-40, 70, -44], ["poingD"], [-7, 0, 0], 2.2)],
    muscles: { p: ["deltoides", "triceps"], s: ["trapezes", "pectoraux"] },
    tempo: [[0, "Pousser vers le haut · 1 s"], [0.4, "Sans verrouiller les coudes"], [0.5, "Redescendre en 2 s jusqu'aux épaules"]],
    cles: [P(0, 106, 28), P(0.4, 148, 18), P(0.5, 148, 18), P(0.95, 106, 28)],
    erreur: { texte: "cambrer le bas du dos et décoller le dos du dossier pour pousser : les lombaires encaissent.", zone: ["lombaires"],
      cles: [P(0, 106, 28, -12), P(0.4, 146, 18, -18), P(0.5, 146, 18, -18), P(0.95, 106, 28, -12)] }
  });
}
{ // Rowing assis à la poulie basse
  const J = jambes2({ ik: [13, 26, 46], pole: [0.2, 1, 0.3], pied: [-60, 6, 0] });
  const P = (t, z, y, pitch = 0, lomb = 0) => ({ t, racine: { p: [0, 58, -26], r: [pitch, 0, 0] }, colonne: col(lomb, 0, -6),
    bras: bras2({ ik: [14, y, z], pole: [0.4, 0, -1], prono: -85, ...PRISE }), jambes: J });
  E("rowing-assis", {
    nom: "Rowing assis à la poulie basse", duree: 3.5, reps: 12, affiche: 0.4, vue: "profil",
    camera: { cible: [0, 70, 20], dist: 470, el: 8 }, ombre: [0, 10, 100, 220],
    accessoires: [{ type: "banc", l: 80, p0: [0, 0, -28] }, machine([...PILE(0, 90), { b: [50, 30, 6], p: [0, 18, 62.2], r: [-30, 0, 0] }, { b: [8, 20, 8], p: [0, 10, 65.2] }]),
      { type: "cable", de: [0, 22, 82], main: "2", poignee: 18 }],
    muscles: { p: ["dorsaux", "trapezes"], s: ["biceps", "deltoides", "lombaires"] },
    tempo: [[0, "Tirer la poignée vers le nombril · 1 s"], [0.4, "Serrer les omoplates, buste droit"], [0.5, "Rendre en 2 s, bras tendus"]],
    cles: [P(0, 24, 92, 6), P(0.4, -6, 86), P(0.5, -6, 86), P(0.95, 24, 92, 6)],
    erreur: { texte: "se jeter en arrière pour tirer, puis s'enrouler vers l'avant : c'est le dos qui balance la charge.", zone: ["lombaires"],
      cles: [P(0, 34, 84, 30, 22), P(0.4, -14, 92, -24), P(0.5, -14, 92, -24), P(0.95, 34, 84, 30, 22)] }
  });
}
{ // Écarté à la poulie vis-à-vis
  const P = (t, x, y, z, pitch = 12, pole = [1, 0.2, -0.6]) => ({ t, racine: { p: [0, 98, -4], r: [pitch, 0, 0] }, colonne: col(0, 0, -6),
    bras: bras2({ ik: [x, y, z], pole, prono: 0, ...PRISE }), jambes: jambes2({ ik: [14, 8, 6], pole: [0.2, 0, 1], pied: PIED_PLAT(8) }) });
  const ouvert = P(0, 72, 142, 4), ferme = P(0.4, 8, 110, 44);
  E("vis-a-vis", {
    nom: "Écarté à la poulie vis-à-vis", duree: 3.5, reps: 12, affiche: 0.42, vue: "3/4",
    camera: { cible: [0, 120, 0], dist: 520, el: 6 }, ombre: [0, 0, 120, 100],
    accessoires: [machine([...PILE(100, -10), ...PILE(-100, -10)]),
      { type: "cable", de: [94, 200, -6], main: "G", poignee: 12 }, { type: "cable", de: [-94, 200, -6], main: "D", poignee: 12 }],
    muscles: { p: ["pectoraux"], s: ["deltoides", "biceps", "abdominaux"] },
    tempo: [[0, "Ramener les mains devant le bas de la poitrine · 1 s"], [0.4, "Serrer 1 s"], [0.5, "Ouvrir en 2 s, coudes légèrement fléchis"]],
    cles: [ouvert, ferme, { ...copie(ferme), t: 0.5 }, { ...copie(ouvert), t: 0.95 }],
    erreur: { texte: "plier fort les coudes et pousser comme un développé : les triceps et les épaules prennent le relais des pectoraux.", zone: ["triceps", "deltoides"],
      cles: [P(0, 50, 130, -6, 12, [1, -1, -0.3]), P(0.4, 14, 118, 44, 12, [1, -1, -0.3]), P(0.5, 14, 118, 44, 12, [1, -1, -0.3]), P(0.95, 50, 130, -6, 12, [1, -1, -0.3])] }
  });
}
{ // Face pull à la poulie, corde à hauteur du visage
  const P = (t, x, y, z, pitch = 4, pole = [1, 1, -0.6]) => ({ t, racine: { p: [0, 98, -6], r: [pitch, 0, 0] }, colonne: col(0, 0, -4),
    bras: bras2({ ik: [x, y, z], pole, prono: 0, ...PRISE }), jambes: jambes2({ ik: [14, 8, 2], pole: [0.2, 0, 1], pied: PIED_PLAT(8) }) });
  const tendu = P(0, 9, 148, 40), tire = P(0.4, 26, 156, 8);
  E("face-pull", {
    nom: "Face pull à la poulie", duree: 3.5, reps: 15, affiche: 0.4, vue: "3/4",
    camera: { cible: [0, 130, 20], dist: 480, el: 6 }, ombre: [0, 20, 90, 140],
    accessoires: [machine(PILE(0, 72)), { type: "cable", de: [0, 160, 66], main: "2", poignee: 20 }],
    muscles: { p: ["deltoides", "trapezes"], s: ["dorsaux", "biceps"] },
    tempo: [[0, "Tirer la corde vers le front, coudes hauts · 1 s"], [0.4, "Écarter les mains, pouces vers l'arrière"], [0.5, "Rendre en 2 s"]],
    cles: [tendu, tire, { ...copie(tire), t: 0.5 }, { ...copie(tendu), t: 0.95 }],
    erreur: { texte: "tirer vers le menton coudes bas en se penchant en arrière : on fait un rowing avec élan au lieu de travailler l'arrière des épaules.", zone: ["lombaires"],
      cles: [tendu, P(0.4, 18, 128, 4, -16, [0.6, -1, -0.6]), P(0.5, 18, 128, 4, -16, [0.6, -1, -0.6]), { ...copie(tendu), t: 0.95 }] }
  });
}
{ // Banc à lombaires à 45° (extension du dos)
  const J = jambes2({ ik: [11, 34, -61], pole: [0, -0.7, 0.7], cheville: 0 });          // jambes presque tendues sur la ligne à 45° de la hanche
  const BRAS = bras2({ fk: { flex: 35, abd: 0, rot: -70 }, coude: 135 });          // bras croisés sur la poitrine : rien ne pend vers le montant du banc
  const P = (t, pitch, lomb = 0, thorax = 0) => ({ t, racine: { p: [0, 100, 2], r: [pitch, 0, 0] }, colonne: col(lomb, thorax, -10), bras: BRAS, jambes: J });
  E("banc-lombaires", {
    nom: "Banc à lombaires (extension à 45°)", duree: 4, reps: 12, affiche: 0.05, vue: "profil",
    camera: { cible: [0, 80, 0], dist: 470, el: 6 }, ombre: [0, -20, 90, 160],
    accessoires: [machine([{ b: [40, 26, 8], p: [0, 71.4, -2], r: [45, 0, 0], m: "cuir" }, { b: [6, 100, 6], p: [0, 31.1, -32.5], r: [45, 0, 0] },
      { b: [44, 4, 30], p: [0, 23.6, -64.4], r: [45, 0, 0] }, { c: [4, 36], p: [0, 44.5, -63.9], r: [0, 0, 90], m: "cuir" }, { b: [60, 4, 120], p: [0, 2, -20] }])],
    muscles: { p: ["lombaires", "fessiers"], s: ["ischios"] },
    tempo: [[0, "Remonter jusqu'à l'alignement · 1 s"], [0.45, "Corps droit, pas plus haut"], [0.55, "Descendre en 2 s en pliant les hanches"]],
    cles: [P(0, 108, 10, 6), P(0.45, 45), P(0.55, 45), P(0.95, 108, 10, 6)],
    erreur: { texte: "remonter au-delà de l'alignement en creusant le dos, tête en arrière : les vertèbres lombaires sont écrasées.", zone: ["lombaires"],
      cles: [P(0, 108, 10, 6), P(0.45, 30, -26, -12), P(0.55, 30, -26, -12), P(0.95, 108, 10, 6)] }
  });
}
{ // Crunch à la machine
  const P = (t, lomb, thorax, pitch = 0) => ({ t, racine: { p: [0, ASSIS - pitch * 0.06, -6], r: [pitch, 0, 0] }, colonne: col(lomb, thorax, 14),
    bras: bras2({ fk: { flex: 165, abd: 30 }, coude: 112, prono: 80, ...PRISE }), jambes: jambes2({ fk: { flex: 86 + pitch, abd: 6 }, genou: 70, pied: PIED_PLAT(6) }) });
  const poignees = ["G", "D"].map(c => machine([{ c: [1.6, 14], r: [0, 0, 90], m: "acier" }], { main: c }));
  E("crunch-machine", {
    nom: "Crunch à la machine", duree: 3.5, reps: 15, affiche: 0.4, vue: "profil",
    camera: { cible: [0, 95, 5], dist: 440, el: 8 }, ombre: [0, 0, 90, 110],
    accessoires: [machine([...SIEGE(-6), ...PILE(-55, -30)]), ...poignees,
      levier([30, 135, -26], ["poingG"], [6, 0, 0], 2.2), levier([-30, 135, -26], ["poingD"], [-6, 0, 0], 2.2)],
    muscles: { p: ["abdominaux"], s: ["obliques"] },
    tempo: [[0, "Enrouler le buste, côtes vers le bassin · 1 s"], [0.4, "Souffler, serrer 1 s"], [0.5, "Dérouler en 2 s"]],
    cles: [P(0, 0, 0), P(0.4, 34, 30), P(0.5, 34, 30), P(0.95, 0, 0)],
    erreur: { texte: "tirer avec les bras et basculer d'un bloc depuis les hanches, dos droit : les abdominaux ne s'enroulent pas.", zone: ["flechisseurs"],
      cles: [P(0, 0, 0), P(0.4, 0, 0, 38), P(0.5, 0, 0, 38), P(0.95, 0, 0)] }
  });
}
{ // Machines dérivées d'un exercice déjà animé : mêmes mouvements, matériel différent
  const avec = (id, o) => ({ ...copie(EXERCICES[id]), recalageDe: EXERCICES[id].recalageDe || id, ...o });
  // Smith machine : la barre du squat glisse dans deux rails verticaux
  E("smith-squat", avec("squat-barre", { nom: "Squat à la Smith machine", reps: 10,
    accessoires: [{ type: "barre-olympique", main: "2" }, machine([{ b: [8, 230, 8], p: [92, 115, -4] }, { b: [8, 230, 8], p: [-92, 115, -4] }, { b: [200, 8, 8], p: [0, 230, -4] }])] }));
  // Curl à la poulie basse
  const devantCuisses = cles => cles.map(k => { k = copie(k); for (const c of "GD") k.bras[c].fk.flex = Math.max(k.bras[c].fk.flex || 0, 10); return k; });   // la poignée passe devant les cuisses
  E("curl-poulie", avec("curl-biceps", { nom: "Curl biceps à la poulie basse", vue: "profil", camera: { cible: [0, 105, 20], dist: 440, el: 6 },
    cles: devantCuisses(EXERCICES["curl-biceps"].cles), erreur: { ...copie(EXERCICES["curl-biceps"].erreur), cles: devantCuisses(EXERCICES["curl-biceps"].erreur.cles) },
    accessoires: [machine(PILE(0, 50)), { type: "cable", de: [0, 22, 44], main: "2", poignee: 40 }] }));
  // Mollets debout à la machine : boudins sur les épaules
  const m = EXERCICES["mollets"];
  const mains = k => ({ ...copie(k), bras: bras2({ ik: [22, k.racine.p[1] + 42, 8], pole: [0.5, -1, 0], prono: 80, ...PRISE }) });
  E("mollets-machine", { ...copie(m), recalageDe: "mollets", nom: "Mollets debout à la machine",
    cles: m.cles.map(mains), erreur: { ...copie(m.erreur), cles: m.erreur.cles.map(mains) },
    accessoires: [...m.accessoires, machine(PILE(0, -50)),
      machine([{ b: [12, 7, 20], m: "cuir" }], { suit: ["epauleG"], decal: [0, 12.5, 0] }), machine([{ b: [12, 7, 20], m: "cuir" }], { suit: ["epauleD"], decal: [0, 12.5, 0] }),
      levier([18, 165, -48], ["epauleG"], [0, 9, -6], 2.5), levier([-18, 165, -48], ["epauleD"], [0, 9, -6], 2.5)] });
  // Traction assistée : les genoux reposent sur un appui qui pousse vers le haut
  const tr = EXERCICES["traction"];
  const genoux = k => ({ ...copie(k), racine: { ...copie(k.racine), r: [Math.max(k.racine.r[0], -6), 0, 0] },      // genoux sur l'appui : le corps bascule peu
    jambes: jambes2({ fk: { flex: 4, abd: 3 }, genou: 95, cheville: -20 }) });
  E("traction-assistee", { ...copie(tr), recalageDe: "traction", nom: "Traction assistée à la machine",
    cles: tr.cles.map(genoux), erreur: { ...copie(tr.erreur), cles: tr.erreur.cles.map(genoux) },
    accessoires: [...tr.accessoires, machine(PILE(0, -85)),
      machine([{ b: [40, 6, 26], m: "cuir" }], { suit: ["genouG", "genouD"], decal: [0, -8.5, -10] }), levier([0, 40, -40], ["genouG", "genouD"], [0, -11.5, -10], 2.5)] });
}

{ // Hack squat : dos contre le chariot incliné, les épaules sous les boudins, le corps descend le long des rails
  const d = [0, -0.82, -0.57];                                   // direction des rails (vers le bas et l'arrière)
  const P = (t, k, pole = [0.3, 0, 1], cheville = PIED_PLAT(10)) => ({ t, racine: { p: [0, 94 + 46 * k * d[1], -10 + 46 * k * d[2]], r: [-35, 0, 0] }, colonne: col(0, 0, 18),
    bras: bras2({ fk: { flex: 30, abd: 28 }, coude: 118, prono: 80, ...PRISE }), jambes: jambes2({ ik: [15, 16 + cheville[0] / 12, 22], pole, pied: cheville }) });
  const chariot = machine([{ b: [40, 64, 8], m: "cuir" }], { suit: ["thorax"], decal: [0, -9.3, -11.8], rx: -35 });
  const epaules = ["G", "D"].map(c => machine([{ b: [12, 7, 22], m: "cuir" }], { suit: ["epaule" + c], decal: [0, 10.5, -5], rx: -35 }));
  E("hack-squat", {
    nom: "Hack squat", duree: 4, reps: 10, affiche: 0.45, vue: "3/4",
    camera: { cible: [0, 85, 0], dist: 470, el: 8 }, ombre: [0, 0, 100, 160],
    accessoires: [machine([{ b: [80, 6, 50], p: [0, 6, 22] }, { b: [100, 2, 200], p: [0, 1, -20] },
      { c: [3, 150], p: [32, 62, -79], r: [35, 0, 0], m: "acier" }, { c: [3, 150], p: [-32, 62, -79], r: [35, 0, 0], m: "acier" },
      { b: [6, 150, 6], p: [38, 75, -120] }, { b: [6, 150, 6], p: [-38, 75, -120] }]), chariot, ...epaules],
    muscles: { p: ["quadriceps", "fessiers"], s: ["adducteurs", "ischios", "mollets"] },
    tempo: [[0, "Déverrouiller, descendre en 2 s"], [0.45, "Cuisses parallèles au plateau"], [0.55, "Pousser dans tout le pied · 1 s"], [0.95, "Sans verrouiller les genoux"]],
    cles: [P(0, 0), P(0.45, 1), P(0.55, 1), P(0.95, 0)],
    erreur: { texte: "les genoux rentrent vers l'intérieur et les talons décollent du plateau : le genou encaisse en torsion.", zone: ["adducteurs", "quadriceps"],
      cles: [P(0, 0), P(0.45, 1.05, [-0.5, 0, 1], [24, 6, 0]), P(0.55, 1.05, [-0.5, 0, 1], [24, 6, 0]), P(0.95, 0)] }
  });
}
{ // Presse horizontale : les pieds sont sur un plateau fixe, c'est le siège qui recule sur ses rails
  const P = (t, z, colonne = col(0, 0, 14), pole = [0.35, 0.6, 0.4]) => ({ t, racine: { p: [0, 56, z], r: [-25, 0, 0] }, colonne,
    bras: bras2({ ik: [27, 50, z + 10], pole: [0.3, -1, 0], ...PRISE }), jambes: jambes2({ ik: [15, 52, 62], pole, pied: [-80, 8, 0] }) });
  const siege = machine([{ b: [44, 8, 40], p: [0, -14, 2], m: "cuir" }, { b: [44, 62, 8], p: [0, 22, -24], r: [-25, 0, 0], m: "cuir" }, { b: [50, 6, 50], p: [0, -22, -4] },
    { b: [6, 10, 22], p: [27, -8, 10] }, { b: [6, 10, 22], p: [-27, -8, 10] }], { suit: ["hancheG", "hancheD"], decal: [0, -1.5, -1.5] });
  E("presse-horizontale", {
    nom: "Presse horizontale (assise)", duree: 4, reps: 12, affiche: 0.45, vue: "profil",
    camera: { cible: [0, 70, 15], dist: 470, el: 8 }, ombre: [0, 10, 90, 220],
    accessoires: [machine([{ b: [70, 70, 6], p: [0, 50, 75.5], m: "cuir" }, { b: [8, 100, 8], p: [0, 50, 83.5] }, { b: [70, 6, 200], p: [0, 25, -10] },
      { b: [8, 25, 8], p: [30, 12, -90] }, { b: [8, 25, 8], p: [-30, 12, -90] }, { b: [8, 25, 8], p: [30, 12, 70] }, { b: [8, 25, 8], p: [-30, 12, 70] },
      ...PILE(-60, 40)]), siege],
    muscles: { p: ["quadriceps", "fessiers"], s: ["ischios", "adducteurs", "mollets"] },
    tempo: [[0, "Pousser le plateau : le siège recule · 1 s"], [0.45, "Jambes presque tendues"], [0.55, "Revenir en 2 s, genoux vers la poitrine"]],
    cles: [P(0, 16), P(0.45, -20), P(0.55, -20), P(0.95, 16)],
    erreur: { texte: "revenir si près du plateau que le bassin s'enroule et le bas du dos se décolle du dossier.", zone: ["lombaires"],
      cles: [P(0, 26, col(24, 12, 14), [0.5, 0.6, 0.2]), P(0.45, -20), P(0.55, -20), P(0.95, 26, col(24, 12, 14), [0.5, 0.6, 0.2])] }
  });
}
{ // Hip thrust à la machine : même mouvement qu'à la barre, une ceinture rembourrée sur les hanches remplace la barre
  const ht = EXERCICES["hip-thrust"];
  const PLI = ["hancheG", "hancheG", "genouG", "hancheD", "hancheD", "genouD"], HANCHE = ["hancheG", "genouG", [20.5, 18]];   // coussin sur le pli de la hanche
  E("hip-thrust-machine", { ...copie(ht), recalageDe: ht.recalageDe || "hip-thrust", nom: "Hip thrust à la machine",
    accessoires: [{ type: "banc", l: 110, ry: 90, p0: [0, 0, -46] }, machine([...PILE(-75, -46), { b: [6, 60, 6], p: [-50, 30, 6] }, { b: [6, 60, 6], p: [50, 30, 6] }]),
      machine([{ c: [6, 56], r: [0, 0, 90], m: "cuir" }], { suit: PLI, perp: HANCHE }),
      levier([50, 58, 6], PLI, [28, 0, 0], 2.5, HANCHE), levier([-50, 58, 6], PLI, [-28, 0, 0], 2.5, HANCHE)] });
}
{ // Machine à fessiers (kickback) : buste sur le coussin, une jambe pousse le levier vers l'arrière
  const P = (t, flex, genou, lomb = 0) => ({ t, racine: { p: [0, 96, 0], r: [40, 0, 0] }, colonne: col(lomb, 0, -20),
    bras: bras2({ ik: [22, 92, 40], pole: [0.4, -1, 0], prono: 80, ...PRISE }),
    jambes: { G: { ik: [12, 8, 14], pole: [0.2, 0, 1], pied: PIED_PLAT(8) }, D: { fk: { flex, abd: 2 }, genou, cheville: 10 } } });
  E("kickback-machine", {
    nom: "Machine à fessiers (kickback)", duree: 3.5, reps: 12, affiche: 0.42, vue: "profil",
    camera: { cible: [0, 85, -10], dist: 470, el: 8 }, ombre: [0, 0, 90, 160],
    accessoires: [machine([{ b: [36, 30, 8], p: [0, 106, 30], r: [40, 0, 0], m: "cuir" }, { b: [6, 100, 6], p: [0, 50, 40] }, { b: [60, 4, 80], p: [0, 2, 25] },
      { b: [50, 6, 6], p: [0, 90, 46] }, ...PILE(-60, 50)]),
      machine([{ b: [16, 6, 14], m: "cuir" }], { suit: ["chevilleD"], decal: [0, -9, -10.5] }), levier([-22, 92, 0], ["chevilleD"], [-10, -9, -10.5], 2.5)],
    muscles: { p: ["fessiers"], s: ["ischios", "lombaires"] },
    tempo: [[0, "Pousser le talon vers l'arrière · 1 s"], [0.4, "Serrer la fesse, jambe dans l'axe du buste"], [0.5, "Revenir en 2 s, genou sous la hanche"]],
    cles: [P(0, 80, 95), P(0.4, -4, 25), P(0.5, -4, 25), P(0.95, 80, 95)],
    erreur: { texte: "monter la jambe trop haut en creusant le dos : ce sont les lombaires qui finissent le mouvement.", zone: ["lombaires"],
      cles: [P(0, 80, 95), P(0.4, -30, 5, -20), P(0.5, -30, 5, -20), P(0.95, 80, 95)] }
  });
}

/* ---------- VARIANTES (demandées pour l'appli Ti Guigui FIT) ----------
   Même mouvement qu'un exercice existant : on copie ses images clés (et son recalage) et on ne change que les bras
   (prise, écart des mains) et le matériel tenu. */
{
  const bras = (cles, f) => cles && cles.map(k => { const n = copie(k); for (const c of ["G", "D"]) if (n.bras?.[c]) n.bras[c] = f(n.bras[c], c === "G" ? 1 : -1); return n; });
  const variante = (id, base, def, f = b => b) => {
    const b = EXERCICES[base], e = b.erreur;
    E(id, { ...copie(b), recalageDe: b.recalageDe || base, ...def, cles: bras(b.cles, f), clesFemme: bras(b.clesFemme, f),
      erreur: e && { ...copie(e), cles: bras(e.cles, f), clesFemme: bras(e.clesFemme, f) } });
    if (!EXERCICES[id].clesFemme) delete EXERCICES[id].clesFemme;
    if (e && !e.clesFemme) delete EXERCICES[id].erreur.clesFemme;
  };
  variante("curl-marteau", "curl-biceps", { nom: "Curl marteau aux haltères", muscles: { p: ["biceps", "avant-bras"], s: ["deltoides"] } },
    b => ({ ...b, prono: 90, fk: { ...b.fk, abd: 9 } }));              // pouces vers le haut tout le long, haltères écartés des cuisses
  variante("curl-barre", "curl-biceps", { nom: "Curl à la barre", accessoires: [{ type: "barre-olympique", main: "2" }] },
    b => ({ ...b, fk: { ...b.fk, abd: 9, flex: Math.max(b.fk.flex, 5) }, coude: Math.max(b.coude, 20) }));   // mains à la largeur des épaules ; coudes un peu fléchis en bas : la barre reste devant les cuisses
  variante("developpe-couche-halteres", "developpe-couche",
    { nom: "Développé couché aux haltères", accessoires: [EXERCICES["developpe-couche"].accessoires[0], ...HALTERES] });
  variante("pompe-diamant", "pompe", { nom: "Pompe diamant (mains rapprochées)", muscles: { p: ["triceps", "pectoraux"], s: ["deltoides", "abdominaux", "avant-bras"] } },
    (b, s) => ({ ...b, ik: [7 * s, b.ik[1], b.ik[2]], pole: [b.pole[0] * 0.4, b.pole[1], b.pole[2]] }));   // mains sous la poitrine, coudes le long du corps
  variante("traction-supination", "traction", { recalageDe: "traction-supination", nom: "Traction en supination (chin-up)", muscles: { p: ["dorsaux", "biceps"], s: ["avant-bras", "trapezes", "abdominaux"] } },
    (b, s) => ({ ...b, ik: [24 * s, b.ik[1], b.ik[2]] }));            // prise plus serrée, poignets devant la barre ; paumes vers soi : table ORIENTATION
  variante("rowing-halteres", "rowing-barre", { nom: "Rowing buste penché aux haltères", accessoires: HALTERES });
  variante("souleve-roumain-barre", "souleve-roumain", { nom: "Soulevé de terre roumain à la barre", reps: 8, accessoires: [{ type: "barre-olympique", main: "2" }] },
    (b, s) => ({ ...b, ...PRISE, ik: [22 * s, b.ik[1] + 4, b.ik[2] + 13] }));   // la barre glisse le long des cuisses
  variante("squat-bulgare-halteres", "squat-bulgare", { nom: "Squat bulgare aux haltères", accessoires: [...EXERCICES["squat-bulgare"].accessoires, ...HALTERES] },
    () => ({ fk: { flex: 2, abd: 7 }, coude: 4, prono: -85, ...PRISE }));   // bras pendants, haltères le long des jambes
}

/* ---------- LOT 2 pour l'appli : poses nouvelles ou fortement modifiées ---------- */
{ // Développé militaire à la barre : la barre part du haut de la poitrine et passe devant le visage (la tête recule un peu)
  const P = (t, y, z, cou = 0, lomb = 0) => ({ t, racine: { p: [0, 99, 0], r: [0, 0, 0] }, colonne: col(lomb, lomb * 0.6, cou),
    bras: bras2({ ik: [24, y, z], pole: [1, -1, 0.2], ...PRISE }), jambes: DEBOUT });
  const bas = P(0, 146, 16, -8), mi = P(0.18, 170, 13, -10), haut = P(0.4, 197, 1);
  E("developpe-militaire-barre", {
    nom: "Développé militaire à la barre", duree: 3.5, reps: 8, affiche: 0.4, vue: "3/4",
    camera: { cible: [0, 125, 0], dist: 440, el: 6 }, ombre: [0, 0, 80, 80], accessoires: [{ type: "barre-olympique", main: "2" }],
    muscles: { p: ["deltoides", "triceps"], s: ["trapezes", "pectoraux", "abdominaux"] },
    tempo: [[0, "Pousser · 1 s, la tête recule"], [0.4, "Barre au-dessus de la tête"], [0.5, "Redescendre en 2 s"]],
    cles: [bas, mi, haut, { ...copie(haut), t: 0.5 }, { ...copie(mi), t: 0.75 }, { ...copie(bas), t: 0.95 }],
    erreur: { texte: "le bas du dos se creuse pour faire passer la barre : ce sont les lombaires qui prennent.", zone: ["lombaires"],
      cles: [P(0, 146, 18, -8, -16), P(0.18, 170, 16, -8, -20), P(0.4, 196, 8, 0, -24), P(0.5, 196, 8, 0, -24), P(0.75, 170, 16, -8, -20), P(0.95, 146, 18, -8, -16)] }
  });
}
{ // Écarté couché aux haltères : bras presque tendus qui s'ouvrent en arc au-dessus de la poitrine
  const dc = EXERCICES["developpe-couche"].cles[0];
  const P = (t, x, y, coudes = 1) => ({ t, racine: copie(dc.racine), colonne: copie(dc.colonne), jambes: copie(dc.jambes),
    bras: bras2({ ik: [x, y, -36], pole: [1, -coudes, 0], ...PRISE }) });
  const haut = P(0, 11, 112), bas = P(0.45, 58, 78);
  E("ecarte-halteres", {
    nom: "Écarté couché aux haltères", duree: 3.5, reps: 12, affiche: 0.45, vue: "3/4",
    camera: { cible: [0, 70, -10], dist: 440, el: 22 }, ombre: [0, -15, 110, 200], accessoires: [EXERCICES["developpe-couche"].accessoires[0], ...HALTERES],
    muscles: { p: ["pectoraux"], s: ["deltoides", "biceps"] },
    tempo: [[0, "Ouvrir en arc · 2 s"], [0.45, "Étirement de la poitrine"], [0.55, "Refermer en serrant · 1 s"]],
    cles: [haut, bas, { ...copie(bas), t: 0.55 }, { ...copie(haut), t: 0.95 }],
    erreur: { texte: "descendre trop bas, bras tendus : l'avant de l'épaule est tiré au-delà de ce qu'il supporte.", zone: ["deltoides"],
      cles: [haut, P(0.45, 66, 64, 0.2), P(0.55, 66, 64, 0.2), { ...copie(haut), t: 0.95 }] }
  });
}
{ // Relevés de genoux et de jambes, suspendu à la barre : mêmes mains que la traction, bras tendus
  const tr = EXERCICES["traction"], base = tr.cles[0];
  const H = (t, hanches, genoux, pitch = 0) => ({ ...copie(base), t, racine: { p: [...base.racine.p], r: [base.racine.r[0] + pitch, 0, 0] },
    jambes: jambes2({ fk: { flex: hanches, abd: 2 }, genou: genoux, cheville: -20 }) });
  const def = (nom, haut) => ({
    nom, duree: 3.5, reps: 10, affiche: 0.42, vue: "profil",
    camera: { cible: [0, 128, 0], dist: 560, el: 3 }, ombre: [0, 0, 90, 90], accessoires: copie(tr.accessoires),
    muscles: { p: ["abdominaux", "flechisseurs"], s: ["avant-bras", "dorsaux", "quadriceps"] },
    tempo: [[0, "Monter sans se balancer · 1,5 s"], [0.45, "Tenir en haut"], [0.55, "Redescendre en 2 s"]],
    cles: [H(0, 6, 15), haut, { ...copie(haut), t: 0.55 }, H(0.95, 6, 15)],
    erreur: { texte: "se balancer d'avant en arrière : l'élan soulève les jambes à la place des abdominaux.", zone: ["lombaires"],
      cles: [H(0, -10, 25, 12), { ...copie(haut), racine: { ...copie(haut.racine), r: [haut.racine.r[0] - 14, 0, 0] } }, H(0.6, 30, 40, -10), H(0.95, -10, 25, 12)] }
  });
  E("releve-genoux-suspendu", def("Relevé de genoux suspendu", H(0.45, 100, 105, -4)));
  E("releve-jambes-suspendu", def("Relevé de jambes suspendu", H(0.45, 88, 6, -8)));
}
{ // Dips aux barres parallèles : bras tendus en haut, buste un peu penché en bas, genoux pliés
  const BARRES = machine([{ c: [2.4, 60], p: [25, 111, 5], r: [90, 0, 0], m: "acier" }, { c: [2.4, 60], p: [-25, 111, 5], r: [90, 0, 0], m: "acier" },
    { b: [5, 111, 5], p: [25, 55.5, 32] }, { b: [5, 111, 5], p: [-25, 55.5, 32] }, { b: [5, 111, 5], p: [25, 55.5, -22] }, { b: [5, 111, 5], p: [-25, 55.5, -22] }]);
  const P = (t, y, pitch, z = 0, hy = 118) => ({ t, racine: { p: [0, y, z], r: [pitch, 0, 0] }, colonne: col(0, pitch * 0.3, -6),
    bras: bras2({ ik: [24, hy, 5], pole: [0.2, 0, -1], ...PRISE }), jambes: jambes2({ fk: { flex: 15, abd: 2 }, genou: 85, cheville: -25 }) });
  const haut = P(0, 124, 4, -2), bas = P(0.45, 95, 16, -6);
  E("dips-barres", {
    nom: "Dips aux barres parallèles", duree: 3.5, reps: 8, affiche: 0.4, vue: "3/4",
    camera: { cible: [0, 110, 0], dist: 500, el: 6 }, ombre: [0, 5, 90, 100], accessoires: [BARRES],
    muscles: { p: ["triceps", "pectoraux"], s: ["deltoides", "abdominaux"] },
    tempo: [[0, "Descendre en 2 s, coudes vers l'arrière"], [0.45, "Bras à angle droit"], [0.55, "Pousser · 1 s"]],
    cles: [haut, bas, { ...copie(bas), t: 0.55 }, { ...copie(haut), t: 0.95 }],
    erreur: { texte: "descendre trop bas, épaules qui roulent en avant : l'avant de l'épaule est écrasé.", zone: ["deltoides"],
      cles: [haut, P(0.45, 82, 24, -9, 119.5), P(0.55, 82, 24, -9, 119.5), { ...copie(haut), t: 0.95 }] }
  });
}
{ // Split squat : pieds fixes, un devant, un derrière sur la pointe ; le bassin descend tout droit
  const brasL = b => bras2({ fk: { flex: 8 + 26 * b, abd: 14 }, coude: 25 + 45 * b });
  const avant = { ik: [13, 8, 6], pole: [0.2, 0, 1], pied: PIED_PLAT(10) };
  const P = (t, y, ay, pied, pitch = 5) => { const b = (84 - y) / 26; return { t, racine: { p: [0, y, -24], r: [pitch, 0, 0] }, colonne: col(-2, 1, 0),
    bras: brasL(b), jambes: { G: avant, D: { ik: [-13, ay, -58], pole: [0, -0.2, 1], pied: [pied, -4, 0] } } }; };
  const haut = P(0, 84, 14, 45), bas = P(0.45, 58, 16, 72);
  E("split-squat", {
    nom: "Split squat (fente statique)", duree: 4, reps: 8, affiche: 0.45, vue: "profil",
    camera: { cible: [0, 75, -20], dist: 430, el: 6 }, ombre: [0, -25, 90, 160],
    muscles: { p: ["quadriceps", "fessiers"], s: ["ischios", "adducteurs", "mollets", "abdominaux"] },
    tempo: [[0, "Descendre tout droit · 2 s"], [0.45, "Genou arrière près du sol"], [0.55, "Pousser sur le talon avant"]],
    cles: [haut, bas, { ...copie(bas), t: 0.55 }, { ...copie(haut), t: 0.95 }],
    erreur: { texte: "le buste plonge en avant : le dos travaille et le genou avant part loin devant.", zone: ["lombaires"],
      cles: [haut, P(0.45, 60, 16, 72, 28), P(0.55, 60, 16, 72, 28), { ...copie(haut), t: 0.95 }] }
  });
}
{ // Goblet squat : le squat capté (CMU), un haltère tenu à deux mains contre la poitrine
  const sq = EXERCICES["squat"];
  const goblet = cles => cles.map(k => {
    const n = copie(k), a = (n.racine.r[0] + n.colonne.lomb.flex + n.colonne.thorax.flex) * D, [, py, pz] = n.racine.p;
    n.bras = bras2({ ik: [15, py + 36 * Math.cos(a) + 2, pz + 36 * Math.sin(a) + 24], pole: [1, -1, 0.2], ...PRISE });
    return n;
  });
  E("goblet-squat", {
    ...copie(sq), recalageDe: "squat", nom: "Goblet squat (haltère contre la poitrine)", reps: 10, accessoires: [{ type: "haltere", main: "2" }],
    muscles: { p: ["quadriceps", "fessiers"], s: ["ischios", "adducteurs", "abdominaux", "deltoides", "biceps"] },
    cles: goblet(sq.cles), erreur: { ...copie(sq.erreur), cles: goblet(sq.erreur.cles) }
  });
}

/* ---------- LOT 3 pour l'appli ---------- */
{ // Élévation latérale à la poulie basse, un bras : le câble part de la poulie placée de l'autre côté et passe devant le corps
  const el = EXERCICES["elevations-laterales"], APPUI = { fk: { flex: 8, abd: 28 }, coude: 35 };   // main droite posée vers la colonne
  const unBras = cles => cles.map(k => { const n = copie(k); n.bras.G.fk.flex = Math.max(n.bras.G.fk.flex, 22); n.bras.D = copie(APPUI); return n; });
  E("elevation-laterale-poulie", {
    ...copie(el), recalageDe: "elevations-laterales", nom: "Élévation latérale à la poulie basse (un bras)", vue: "3/4",
    camera: { cible: [0, 110, 0], dist: 460, el: 6 }, ombre: [-10, 0, 110, 80],
    accessoires: [{ type: "poulie", h: 18, p0: [-48, 0, 8] }, { type: "cable", de: [-44, 18, 12], main: "G", poignee: 10 }],
    cles: unBras(el.cles), erreur: { ...copie(el.erreur), cles: unBras(el.erreur.cles) }
  });
}
{ // Oiseau buste penché aux haltères : même buste que le rowing, les bras s'ouvrent sur les côtés, coudes légèrement fléchis
  const rb = EXERCICES["rowing-barre"].cles[0];
  const P = (t, flex, abd, coude = 18, cou = -20) => ({ t, racine: copie(rb.racine), colonne: col(0, 0, cou), jambes: copie(rb.jambes),
    bras: bras2({ fk: { flex, abd }, coude, prono: 90, ...PRISE }) });
  const bas = P(0, 48, 10), haut = P(0.4, 18, 80, 22);
  E("oiseau-halteres", {
    nom: "Oiseau buste penché aux haltères", duree: 3.5, reps: 12, affiche: 0.4, vue: "3/4", recalageDe: "rowing-barre",
    camera: { cible: [0, 90, 5], dist: 440, el: 8 }, ombre: [0, 0, 100, 110], accessoires: HALTERES,
    muscles: { p: ["deltoides", "trapezes"], s: ["dorsaux", "lombaires", "ischios"] },
    tempo: [[0, "Ouvrir les bras sur les côtés · 1 s"], [0.4, "Serrer les omoplates"], [0.5, "Redescendre en 2 s"]],
    cles: [bas, haut, { ...copie(haut), t: 0.5 }, { ...copie(bas), t: 0.95 }],
    erreur: { texte: "le buste se redresse et donne de l'élan : les bras montent avec le dos au lieu des épaules.", zone: ["lombaires"],
      cles: [bas, { ...P(0.4, 25, 84, 30, -10), racine: { ...copie(rb.racine), r: [rb.racine.r[0] - 22, 0, 0] } }, { ...P(0.5, 25, 84, 30, -10), racine: { ...copie(rb.racine), r: [rb.racine.r[0] - 22, 0, 0] } }, { ...copie(bas), t: 0.95 }] }
  });
}
{ // Fente avant : la phase basse captée (CMU) de la fente arrière, déplacée pour que le pied arrière reste en place
  const fa = EXERCICES["fente-arriere"], k0 = fa.cles[0];
  const bas = fa.cles.filter(k => k.t < 0.5 && k.jambes.D.ik && k.jambes.D.ik[2] < -40);
  const t0 = bas[0].t, t1 = bas[bas.length - 1].t, dz = 3 - bas[0].jambes.D.ik[2];
  const capte = bas.map(k => { const n = copie(k); n.t = 0.3 + 0.42 * (k.t - t0) / (t1 - t0); n.racine.p[2] += dz; n.jambes.G.ik[2] += dz; n.jambes.D.ik[2] += dz; return n; });
  const debout = t => ({ ...copie(k0), t });
  const pas = t => { const n = debout(t); n.racine.p = [0, 95, 16]; n.racine.r = [3, 0, 0]; n.jambes.G = { ik: [13, 22, 40], pole: [0.2, 0, 1], pied: [-15, 10, 0] }; return n; };
  const penche = cles => cles.map(k => { const n = copie(k); n.racine.r[0] += 22; return n; });
  E("fente-avant", {
    nom: "Fente avant", duree: 4, reps: 8, affiche: 0.5, vue: "profil",
    camera: { cible: [0, 80, 25], dist: 440, el: 6 }, ombre: [0, 30, 90, 170],
    muscles: { p: ["quadriceps", "fessiers"], s: ["ischios", "adducteurs", "mollets", "abdominaux"] },
    tempo: [[0, "Grand pas en avant"], [0.3, "Descendre le genou arrière"], [0.72, "Pousser sur le talon avant pour revenir"], [0.95, "Debout"]],
    cles: [debout(0), pas(0.15), ...capte, pas(0.85), debout(0.97)],
    erreur: { texte: "le buste plonge en avant à la réception : le dos encaisse et le genou avant part loin devant.", zone: ["lombaires"],
      cles: [debout(0), pas(0.15), ...penche(capte), pas(0.85), debout(0.97)] }
  });
}
{ // Montée sur banc aux haltères : le pied gauche reste sur la boîte, le droit monte puis redescend
  const BOITE = machine([{ b: [50, 44, 40], p: [0, 22, 36] }]);
  const G = { ik: [12, 52, 34], pole: [0.2, 0, 1], pied: PIED_PLAT(6) };
  const BAS = bras2({ fk: { flex: 2, abd: 7 }, coude: 4, prono: -85, ...PRISE });
  const P = (t, y, z, pitch, D) => ({ t, racine: { p: [0, y, z], r: [pitch, 0, 0] }, colonne: col(0, 0, -4), bras: copie(BAS), jambes: { G: copie(G), D } });
  const sol = { ik: [-12, 8, -8], pole: [-0.2, 0, 1], pied: PIED_PLAT(-6) }, monte = { ik: [-12, 40, -10], pole: [-0.2, 0, 1], pied: [20, -4, 0] },
    dessus = { ik: [-12, 52, 32], pole: [-0.2, 0, 1], pied: PIED_PLAT(-6) };
  const auDessus = { ik: [-12, 64, 12], pole: [-0.2, 0, 1], pied: [10, -4, 0] };
  const depart = P(0, 96, 2, 14, sol), haut = P(0.4, 139, 30, 0, dessus);
  E("step-up", {
    nom: "Montée sur banc aux haltères (step-up)", duree: 4, reps: 8, affiche: 0.25, vue: "profil",
    camera: { cible: [0, 100, 20], dist: 480, el: 6 }, ombre: [0, 20, 90, 120], accessoires: [BOITE, ...HALTERES],
    muscles: { p: ["quadriceps", "fessiers"], s: ["ischios", "mollets", "avant-bras", "abdominaux"] },
    tempo: [[0, "Pousser sur le pied posé sur le banc · 1,5 s"], [0.4, "Debout sur le banc"], [0.55, "Redescendre en contrôlant · 2 s"]],
    // le pied droit passe au-dessus du bord de la boîte (au-dessus) au lieu de couper son coin
    cles: [depart, P(0.15, 116, 18, 9, monte), P(0.28, 132, 26, 3, auDessus), haut, { ...copie(haut), t: 0.55 }, P(0.66, 132, 26, 3, auDessus), P(0.8, 116, 18, 9, monte), { ...copie(depart), t: 0.95 }],
    erreur: { texte: "pousser avec la jambe restée au sol : c'est elle qui fait le travail, pas celle posée sur le banc.", zone: ["mollets"],
      cles: [depart, P(0.15, 120, 14, 20, { ik: [-12, 24, -6], pole: [-0.2, 0, 1], pied: [40, -4, 0] }), P(0.28, 132, 26, 3, auDessus), haut, { ...copie(haut), t: 0.55 }, P(0.66, 132, 26, 3, auDessus), P(0.8, 116, 18, 9, monte), { ...copie(depart), t: 0.95 }] }
  });
}
{ // Leg curl allongé : à plat ventre sur la machine, le boudin derrière les chevilles monte vers les fesses
  const MOLLET = ["genouG", "chevilleG", -11];
  const MACHINE = machine([{ b: [40, 7, 88], p: [0, 58, -6], m: "cuir" }, { b: [8, 54, 8], p: [0, 27, 30] }, { b: [8, 54, 8], p: [0, 27, -36] },
    { b: [60, 4, 30], p: [0, 2, 30] }, { b: [60, 4, 30], p: [0, 2, -36] }, { c: [1.6, 50], p: [0, 44, 40], r: [0, 0, 90], m: "acier" }]);
  const P = (t, g, hanches = 0, pitch = 90) => ({ t, racine: { p: [0, 72, 0], r: [pitch, 0, 0] }, colonne: col(0, 0, 18),
    bras: bras2({ ik: [22, 47, 40], pole: [1, 0, -0.3], ...PRISE }), jambes: jambes2({ fk: { flex: hanches, abd: 3 }, genou: g, cheville: 10 }) });
  E("leg-curl-allonge", {
    nom: "Leg curl allongé", duree: 3.5, reps: 12, affiche: 0.4, vue: "3/4",
    camera: { cible: [0, 70, -10], dist: 470, el: 14 }, ombre: [0, -10, 90, 200],
    accessoires: [MACHINE, machine([{ c: [5, 40], r: [0, 0, 90], m: "cuir" }], { suit: TIBIAS, perp: MOLLET })],
    muscles: { p: ["ischios"], s: ["mollets", "fessiers"] },
    tempo: [[0, "Ramener les talons vers les fesses · 1 s"], [0.4, "Tenir 1 s, hanches collées"], [0.5, "Redescendre en 2 s"]],
    cles: [P(0, 6), P(0.4, 115), P(0.5, 115), P(0.95, 6)],
    erreur: { texte: "les hanches décollent du banc pour finir le mouvement : le bas du dos se cambre.", zone: ["lombaires"],
      cles: [P(0, 6), P(0.4, 100, 14, 83), P(0.5, 100, 14, 83), P(0.95, 6)] }
  });
}
{ // Swing kettlebell : charnière de hanche, la kettlebell passe entre les cuisses puis monte à hauteur d'épaules
  const KB = machine([{ c: [8.5, 15], p: [0, -12, 0], m: "fonte" }, { b: [14, 2.4, 2.4], p: [0, 0, 0], m: "fonte" }, { b: [2.4, 6, 2.4], p: [6, -4, 0], m: "fonte" }, { b: [2.4, 6, 2.4], p: [-6, -4, 0], m: "fonte" }], { main: "2" });
  const J = jambes2({ ik: [17, 8, 4], pole: [0.35, 0, 1], pied: PIED_PLAT(10) });
  const P = (t, y, z, pitch, hy, hz, lomb = 0) => ({ t, racine: { p: [0, y, z], r: [pitch, 0, 0] }, colonne: col(lomb, 0, -pitch * 0.25),
    bras: bras2({ ik: [5, hy, hz], pole: [0.3, -0.2, -1], ...PRISE }), jambes: J });
  const bas = P(0, 86, -16, 58, 52, -14), mi = P(0.22, 95, -6, 22, 92, 34), haut = P(0.45, 99, 0, -3, 140, 50);
  E("swing-kettlebell", {
    nom: "Swing kettlebell", duree: 1.8, reps: 15, affiche: 0.45, vue: "profil",
    camera: { cible: [0, 95, 10], dist: 470, el: 6 }, ombre: [0, 0, 90, 110], accessoires: [KB],
    muscles: { p: ["fessiers", "ischios"], s: ["lombaires", "abdominaux", "deltoides", "avant-bras"] },
    tempo: [[0, "Pousser les hanches vers l'avant"], [0.45, "Bras tendus, la kettlebell flotte"], [0.55, "Laisser redescendre, hanches en arrière"]],
    cles: [bas, mi, haut, { ...copie(haut), t: 0.52 }, { ...copie(mi), t: 0.75 }, { ...copie(bas), t: 0.95 }],
    erreur: { texte: "squatter au lieu de plier les hanches et lever avec les bras : les épaules tirent, les fessiers ne poussent pas.", zone: ["deltoides", "quadriceps"],
      cles: [P(0, 70, -10, 25, 40, 2, 10), P(0.22, 88, -4, 12, 100, 36), P(0.45, 97, 0, -6, 150, 40, -10), P(0.52, 97, 0, -6, 150, 40, -10), P(0.75, 88, -4, 12, 100, 36), P(0.95, 70, -10, 25, 40, 2, 10)] }
  });
}

/* ---------- LOT 4 pour l'appli ---------- */
{
  const KETTLE = main => machine([{ c: [8.5, 15], p: [0, -12, 0], m: "fonte" }, { b: [14, 2.4, 2.4], p: [0, 0, 0], m: "fonte" },
    { b: [2.4, 6, 2.4], p: [6, -4, 0], m: "fonte" }, { b: [2.4, 6, 2.4], p: [-6, -4, 0], m: "fonte" }], { main });
  const bras = (cles, f) => cles && cles.map(k => { const n = copie(k); for (const c of ["G", "D"]) if (n.bras?.[c]) n.bras[c] = f(n.bras[c], c === "G" ? 1 : -1, n); return n; });
  const jambes = (cles, f) => cles && cles.map(k => { const n = copie(k); n.jambes = f(n.jambes, n); return n; });
  const variante = (id, base, def, f = b => b, fj = null) => {
    const b = EXERCICES[base], e = b.erreur, g = c => { const r = bras(c, f); return fj ? jambes(r, fj) : r; };
    E(id, { ...copie(b), recalageDe: b.recalageDe || base, ...def, cles: g(b.cles), clesFemme: g(b.clesFemme),
      erreur: e && { ...copie(e), cles: g(e.cles), clesFemme: g(e.clesFemme) } });
    if (!EXERCICES[id].clesFemme) delete EXERCICES[id].clesFemme;
    if (e && !e.clesFemme) delete EXERCICES[id].erreur.clesFemme;
  };
  // Pont fessier à la barre : la barre posée sur les hanches, tenue des deux mains (comme le hip thrust)
  variante("pont-fessier-barre", "pont-fessier", { nom: "Pont fessier à la barre", accessoires: [{ type: "tapis", p0: [0, 0, 0] }, { type: "barre-olympique", main: "2" }],
    muscles: { p: ["fessiers"], s: ["ischios", "lombaires", "abdominaux", "avant-bras"] } },
    (b, s, n) => ({ ik: [30 * s, n.racine.p[1] + 17, n.racine.p[2] + 6], pole: [0.5 * s, 1, 0], ...PRISE }));
  // Hip thrust sur une jambe : la droite tendue dans le prolongement de la cuisse
  variante("hip-thrust-une-jambe", "hip-thrust", { nom: "Hip thrust sur une jambe à la barre", muscles: { p: ["fessiers"], s: ["ischios", "quadriceps", "abdominaux", "flechisseurs"] } },
    b => b, (j, n) => ({ G: j.G, D: { ik: [-14, n.racine.p[1] + 8, n.racine.p[2] + 86], pole: [0, 1, 0], pied: [-15, 0, 0] } }));
  // Kettlebell : soulevé de terre (charnière de hanche), rowing un bras, goblet squat tenu par la poignée
  variante("souleve-terre-kettlebell", "souleve-roumain", { nom: "Soulevé de terre à la kettlebell", reps: 10, accessoires: [KETTLE("2")] },
    (b, s) => ({ ...b, ...PRISE, ik: [6 * s, b.ik[1] + 2, b.ik[2] + 15] }));   // assez devant pour que la kettlebell passe devant les cuisses
  variante("rowing-kettlebell", "rowing-haltere", { nom: "Rowing kettlebell à un bras", accessoires: [EXERCICES["rowing-haltere"].accessoires[0], KETTLE("G")] });
  variante("goblet-squat-kettlebell", "goblet-squat", { nom: "Goblet squat à la kettlebell", accessoires: [KETTLE("2")] },
    (b, s) => ({ ...b, ik: [6 * s, b.ik[1] - 9, b.ik[2] + 8] }));   // tenue plus loin et plus bas : la cloche pend devant la poitrine, sous le menton
  // Dips entre deux chaises : une main sur chaque chaise, de part et d'autre des hanches
  variante("dips-chaises", "dips", { nom: "Dips entre deux chaises", accessoires: [{ type: "chaise", p0: [44, 0, -2], ry: -90 }, { type: "chaise", p0: [-44, 0, -2], ry: 90 }] },
    (b, s) => ({ ...b, ik: [31 * s, b.ik[1] + 4, -2] }));
  // Fente croisée (curtsey) : la jambe qui recule passe derrière l'autre
  const croise = (j) => { const o = copie(j); for (const c of ["G", "D"]) { const m = o[c]; if (m.ik && m.ik[2] < -20) m.ik[0] = (c === "D" ? 1 : -1) * 9; } return o; };
  variante("fente-croisee", "fente-arriere", { nom: "Fente croisée (curtsey)", muscles: { p: ["fessiers", "quadriceps"], s: ["adducteurs", "ischios", "mollets", "abdominaux"] } }, b => b, croise);
}
{ // L-sit au sol : mains à plat près des hanches, bassin décollé, jambes tendues à l'horizontale
  const MAINS = bras2({ ik: [21, 5, 2], pole: [0, 0, -1], main: MAIN_SOL });
  const P = (t, y, flex, cou = -6) => ({ t, racine: { p: [0, y, 0], r: [-4, 0, 0] }, colonne: col(8, 6, cou), bras: MAINS,
    jambes: jambes2({ fk: { flex, abd: 3 }, genou: 2, cheville: 30 }) });
  const assis = P(0, 13, 86), tenu = P(0.25, 19, 90);
  E("l-sit", {
    nom: "L-sit au sol", duree: 6, reps: 3, affiche: 0.5, vue: "profil",
    camera: { cible: [0, 35, 20], dist: 360, el: 8 }, ombre: [0, 20, 70, 130], accessoires: [{ type: "tapis", p0: [0, 0, 20] }],
    muscles: { p: ["abdominaux", "flechisseurs", "triceps"], s: ["quadriceps", "deltoides", "dorsaux"] },
    tempo: [[0, "Pousser dans les mains, décoller les fesses"], [0.25, "Tenir · jambes tendues"], [0.8, "Reposer doucement"]],
    cles: [assis, tenu, { ...copie(tenu), t: 0.8 }, { ...copie(assis), t: 0.95 }],
    erreur: { texte: "les genoux plient et les épaules remontent vers les oreilles : les bras ne poussent plus.", zone: ["trapezes"],
      cles: [assis, { ...P(0.25, 17, 80, 4), jambes: jambes2({ fk: { flex: 115, abd: 3 }, genou: 45, cheville: 20 }) }, { ...P(0.8, 17, 80, 4), jambes: jambes2({ fk: { flex: 115, abd: 3 }, genou: 45, cheville: 20 }) }, { ...copie(assis), t: 0.95 }] }
  });
}
{ // Étirement des fléchisseurs de hanche, un genou au sol : le bassin avance doucement
  const brasH = z => bras2({ ik: [19, 64, z + 2], pole: [1, 0, -0.6] });     // mains sur les hanches
  const avant = { ik: [13, 8, 10], pole: [0.2, 0, 1], pied: PIED_PLAT(10) }, genou = { ik: [-13, 7, -58], pole: [0, -1, 0.3], pied: [-30, -4, 0] };
  const P = (t, z, pitch = 0) => ({ t, racine: { p: [0, 58, z], r: [pitch, 0, 0] }, colonne: col(-4, 2, 0), bras: brasH(z), jambes: { G: avant, D: genou } });
  const recule = P(0, -26, 2), avance = P(0.4, -16, -4);
  E("etirement-flechisseurs", {
    nom: "Étirement des fléchisseurs de hanche (un genou au sol)", duree: 6, reps: 4, affiche: 0.45, vue: "profil",
    camera: { cible: [0, 55, -20], dist: 420, el: 6 }, ombre: [0, -25, 90, 160], accessoires: [{ type: "tapis", p0: [0, 0, -25] }],
    muscles: { p: ["flechisseurs"], s: ["quadriceps", "fessiers"] },
    tempo: [[0, "Serrer la fesse du genou au sol"], [0.4, "Avancer le bassin · tenir"], [0.75, "Revenir doucement"]],
    cles: [recule, avance, { ...copie(avance), t: 0.75 }, { ...copie(recule), t: 0.95 }],
    erreur: { texte: "le bas du dos se creuse au lieu d'avancer le bassin : l'étirement part dans les lombaires.", zone: ["lombaires"],
      cles: [recule, { ...P(0.4, -20, 8), colonne: col(-24, -8, -6) }, { ...P(0.75, -20, 8), colonne: col(-24, -8, -6) }, { ...copie(recule), t: 0.95 }] }
  });
}

/* ---------- LOT 5 pour l'appli : grands classiques de musculation ---------- */
{
  const bras = (cles, f) => cles && cles.map(k => { const n = copie(k); for (const c of ["G", "D"]) if (n.bras?.[c]) n.bras[c] = f(n.bras[c], c === "G" ? 1 : -1, n); return n; });
  const variante = (id, base, def, f = b => b) => {
    const b = EXERCICES[base], e = b.erreur;
    E(id, { ...copie(b), recalageDe: b.recalageDe || base, ...def, cles: bras(b.cles, f), clesFemme: bras(b.clesFemme, f),
      erreur: e && { ...copie(e), cles: bras(e.cles, f), clesFemme: bras(e.clesFemme, f) } });
    if (!EXERCICES[id].clesFemme) delete EXERCICES[id].clesFemme;
    if (e && !e.clesFemme) delete EXERCICES[id].erreur.clesFemme;
  };
  variante("developpe-couche-serre", "developpe-couche", { nom: "Développé couché prise serrée", muscles: { p: ["triceps", "pectoraux"], s: ["deltoides", "avant-bras"] } },
    (b, s) => ({ ...b, ik: [15 * s, b.ik[1], b.ik[2]], pole: [0.5 * s, -1, 0.6] }));     // mains à la largeur des épaules, coudes le long du corps
  variante("developpe-incline-barre", "developpe-incline", { nom: "Développé incliné à la barre", accessoires: [EXERCICES["developpe-incline"].accessoires[0], { type: "barre-olympique", main: "2" }] },
    (b, s) => ({ ...b, ik: [28 * s, b.ik[1], b.ik[2]] }));
  // Good morning : la charnière du roumain, barre sur les trapèzes (bras du squat barre), nuque neutre
  const sq = EXERCICES["squat-barre"].cles[0].bras;
  variante("good-morning", "souleve-roumain", { nom: "Good morning à la barre", reps: 10, accessoires: [{ type: "barre-olympique", main: "2" }],
    muscles: { p: ["ischios", "lombaires"], s: ["fessiers", "abdominaux", "trapezes"] } }, (b, s) => copie(s > 0 ? sq.G : sq.D));
  for (const o of [EXERCICES["good-morning"], EXERCICES["good-morning"].erreur]) for (const k of o.cles) if (k.colonne?.cou) k.colonne.cou.flex = Math.max(k.colonne.cou.flex || 0, -4);
  // Front squat : le squat capté, barre posée sur l'avant des épaules, coudes hauts
  const AVANT_EP = bras2({ fk: { flex: 92, abd: 22 }, coude: 150, ...PRISE });
  variante("front-squat", "squat", { nom: "Front squat (barre devant)", reps: 8, accessoires: [{ type: "barre-olympique", main: "2" }],
    muscles: { p: ["quadriceps", "fessiers"], s: ["abdominaux", "adducteurs", "lombaires", "trapezes"] } }, (b, s) => copie(s > 0 ? AVANT_EP.G : AVANT_EP.D));
}
{ // Rowing debout (tirage menton) : la barre monte le long du corps jusqu'au bas de la poitrine, coudes plus hauts que les mains
  const P = (t, y, z, lomb = 0) => ({ t, racine: { p: [0, 99, 0], r: [0, 0, 0] }, colonne: col(lomb, 0, 0), bras: bras2({ ik: [12, y, z], pole: [1, 1, -0.3], ...PRISE }), jambes: DEBOUT });
  const bas = P(0, 86, 17), haut = P(0.4, 132, 17);
  E("rowing-debout", {
    nom: "Rowing debout à la barre (tirage menton)", duree: 3.5, reps: 12, affiche: 0.4, vue: "3/4",
    camera: { cible: [0, 115, 0], dist: 420, el: 6 }, ombre: [0, 0, 80, 80], accessoires: [{ type: "barre-olympique", main: "2" }],
    muscles: { p: ["deltoides", "trapezes"], s: ["biceps", "avant-bras"] },
    tempo: [[0, "Monter la barre le long du corps · 1 s"], [0.4, "Coudes à hauteur d'épaules"], [0.5, "Redescendre en 2 s"]],
    cles: [bas, haut, { ...copie(haut), t: 0.5 }, { ...copie(bas), t: 0.95 }],
    erreur: { texte: "monter la barre jusqu'au menton en se cambrant : les épaules se coincent et le bas du dos compense.", zone: ["lombaires", "trapezes"],
      cles: [bas, P(0.4, 150, 14, -16), P(0.5, 150, 14, -16), { ...copie(bas), t: 0.95 }] }
  });
}
{ // Allongé sur le banc plat : barre au front (skull crusher) et pull-over à l'haltère
  const dc = EXERCICES["developpe-couche"], k0 = dc.cles[0];
  const L = (t, x, y, z, pole) => ({ t, racine: copie(k0.racine), colonne: copie(k0.colonne), jambes: copie(k0.jambes), bras: bras2({ ik: [x, y, z], pole, ...PRISE }) });
  const coudes = [0.2, 1, 0.3];               // coudes pointés vers le plafond
  const hautF = L(0, 12, 112, -38, coudes), basF = L(0.45, 12, 82, -62, coudes);
  E("barre-front", {
    nom: "Barre au front (skull crusher)", duree: 3.5, reps: 10, affiche: 0.45, vue: "3/4",
    camera: { cible: [0, 75, -20], dist: 430, el: 18 }, ombre: [0, -15, 90, 200], accessoires: [dc.accessoires[0], { type: "barre-olympique", main: "2" }],
    muscles: { p: ["triceps"], s: ["avant-bras", "deltoides"] },
    tempo: [[0, "Plier les coudes · 2 s, la barre vient au-dessus du front"], [0.45, "Coudes fixes"], [0.55, "Tendre les bras · 1 s"]],
    cles: [hautF, basF, { ...copie(basF), t: 0.55 }, { ...copie(hautF), t: 0.95 }],
    erreur: { texte: "les coudes s'écartent et partent vers la tête : les épaules prennent le relais des triceps.", zone: ["deltoides"],
      cles: [hautF, L(0.45, 16, 86, -72, [1, 0.6, -0.4]), L(0.55, 16, 86, -72, [1, 0.6, -0.4]), { ...copie(hautF), t: 0.95 }] }
  });
  const hautP = L(0, 12, 112, -36, [1, 0, 0]), basP = L(0.45, 12, 76, -98, [1, -0.2, 0]);
  E("pullover-haltere", {
    nom: "Pull-over à l'haltère", duree: 4, reps: 12, affiche: 0.45, vue: "3/4",
    camera: { cible: [0, 75, -30], dist: 450, el: 18 }, ombre: [0, -25, 90, 220], accessoires: [dc.accessoires[0], { type: "haltere", main: "2" }],
    muscles: { p: ["dorsaux", "pectoraux"], s: ["triceps", "abdominaux", "deltoides"] },
    tempo: [[0, "Descendre derrière la tête · 2 s, bras presque tendus"], [0.45, "Étirement"], [0.55, "Ramener au-dessus de la poitrine"]],
    cles: [hautP, basP, { ...copie(basP), t: 0.55 }, { ...copie(hautP), t: 0.95 }],
    erreur: { texte: "le bas du dos se creuse quand l'haltère passe derrière la tête : les côtes s'ouvrent au lieu des épaules.", zone: ["lombaires"],
      cles: [hautP, { ...L(0.45, 12, 72, -106, [1, -0.2, 0]), colonne: col(-6, -6, 10) }, { ...L(0.55, 12, 72, -106, [1, -0.2, 0]), colonne: col(-6, -6, 10) }, { ...copie(hautP), t: 0.95 }] }
  });
}
{ // Crunch au sol : genoux pliés, les épaules décollent en enroulant le haut du dos, bras tendus vers les genoux
  const k0 = EXERCICES["pont-fessier"].cles[0];
  const P = (t, lomb, thorax, cou, flex = 25) => ({ t, racine: copie(k0.racine), colonne: col(lomb, thorax, cou), jambes: copie(k0.jambes), bras: bras2({ fk: { flex, abd: 10 }, coude: 8 }) });
  const bas = P(0, 0, 0, 0, 20), haut = P(0.4, 8, 32, 12, 45);
  E("crunch", {
    nom: "Crunch au sol", duree: 3, reps: 15, affiche: 0.4, vue: "profil", recalageDe: "pont-fessier",
    camera: { cible: [0, 25, 5], dist: 300, el: 10 }, ombre: [0, 0, 70, 180], accessoires: [{ type: "tapis", p0: [0, 0, 0] }],
    muscles: { p: ["abdominaux"], s: ["obliques"] },
    tempo: [[0, "Enrouler le haut du dos · 1 s"], [0.4, "Serrer les abdos"], [0.5, "Redescendre en 2 s"]],
    cles: [bas, haut, { ...copie(haut), t: 0.5 }, { ...copie(bas), t: 0.95 }],
    erreur: { texte: "tirer sur la nuque pour monter : le cou se plie et les abdominaux travaillent peu.", zone: ["trapezes"],
      cles: [bas, P(0.4, 2, 16, 40, 30), P(0.5, 2, 16, 40, 30), { ...copie(bas), t: 0.95 }] }
  });
}
{ // Extension des triceps à la nuque : un haltère à deux mains, bras à la verticale, seuls les avant-bras bougent
  const P = (t, coude, flex = 168, lomb = 0) => ({ t, racine: { p: [0, 99, 0], r: [0, 0, 0] }, colonne: col(lomb, lomb * 0.5, 4),
    bras: bras2({ fk: { flex, abd: 9 }, coude, ...PRISE }), jambes: DEBOUT });
  const haut = P(0, 8), bas = P(0.45, 125);
  E("extension-triceps-nuque", {
    nom: "Extension des triceps à la nuque (haltère)", duree: 3.5, reps: 12, affiche: 0.4, vue: "3/4",
    camera: { cible: [0, 135, 0], dist: 440, el: 4 }, ombre: [0, 0, 70, 70], accessoires: [{ type: "haltere", main: "2" }],
    muscles: { p: ["triceps"], s: ["deltoides", "abdominaux"] },
    tempo: [[0, "Descendre l'haltère derrière la tête · 2 s"], [0.45, "Coudes vers le plafond"], [0.55, "Tendre les bras · 1 s"]],
    cles: [haut, bas, { ...copie(bas), t: 0.55 }, { ...copie(haut), t: 0.95 }],
    erreur: { texte: "les coudes s'écartent et le dos se cambre : les épaules et les lombaires aident.", zone: ["lombaires", "deltoides"],
      cles: [haut, { ...P(0.45, 115, 150, -14), bras: bras2({ fk: { flex: 150, abd: 30 }, coude: 115, ...PRISE }) }, { ...P(0.55, 115, 150, -14), bras: bras2({ fk: { flex: 150, abd: 30 }, coude: 115, ...PRISE }) }, { ...copie(haut), t: 0.95 }] }
  });
}

/* ---------- LOT 6 pour l'appli ---------- */
{
  const bras = (cles, f) => cles && cles.map(k => { const n = copie(k); for (const c of ["G", "D"]) if (n.bras?.[c]) n.bras[c] = f(n.bras[c], c === "G" ? 1 : -1, n); return n; });
  const corps = (cles, f) => cles && cles.map(k => { const n = copie(k); f(n); return n; });
  const variante = (id, base, def, f = b => b, fk = null) => {
    const b = EXERCICES[base], e = b.erreur, g = c => { const r = bras(c, f); return fk ? corps(r, fk) : r; };
    E(id, { ...copie(b), recalageDe: b.recalageDe || base, ...def, cles: g(b.cles), clesFemme: g(b.clesFemme),
      erreur: e && { ...copie(e), cles: g(e.cles), clesFemme: g(e.clesFemme) } });
    if (!EXERCICES[id].clesFemme) delete EXERCICES[id].clesFemme;
    if (e && !EXERCICES[id].erreur.clesFemme) delete EXERCICES[id].erreur.clesFemme;
  };
  // Élévation frontale : le geste des élévations latérales, mais les bras montent devant
  variante("elevation-frontale", "elevations-laterales", { nom: "Élévation frontale aux haltères", vue: "3/4", muscles: { p: ["deltoides"], s: ["pectoraux", "trapezes"] } },
    b => { const n = { ...b, fk: { flex: b.fk.abd + 2, abd: 8 } }; delete n.prono; return n; });
  variante("tirage-vertical-serre", "tirage-vertical", { nom: "Tirage vertical prise serrée neutre" }, (b, s) => ({ ...b, ik: [9 * s, b.ik[1], b.ik[2]] }));
  // Développé épaules assis : bras du développé militaire, assis sur un banc à dossier droit
  const ASSIS_J = jambes2({ ik: [17, 8, 50], pole: [0.3, 0, 1], pied: PIED_PLAT(8) });
  variante("developpe-epaules-assis", "developpe-militaire", { nom: "Développé épaules assis aux haltères", recalageDe: "developpe-epaules-assis",
    camera: { cible: [0, 95, 5], dist: 430, el: 6 }, ombre: [0, 5, 80, 110], accessoires: [{ type: "banc", dossier: 82, ry: 0, p0: [0, 0, 2] }, ...HALTERES] },
    b => ({ ...b, ik: [b.ik[0], b.ik[1] - 45, b.ik[2]] }), n => { n.racine.p = [0, 54, 6]; n.racine.r = [-4, 0, 0]; n.jambes = copie(ASSIS_J);
      n.colonne.lomb.flex = Math.max(n.colonne.lomb.flex, 0); n.colonne.thorax.flex = Math.max(n.colonne.thorax.flex, 0); });   // assis contre le dossier : pas de cambrure possible
  EXERCICES["developpe-epaules-assis"].erreur.texte = "les haltères partent devant le visage et les coudes avancent : l'avant de l'épaule prend toute la charge.";
  EXERCICES["developpe-epaules-assis"].erreur.zone = ["deltoides"];
  // Squat sumo : pieds larges et ouverts, le reste du squat capté
  variante("squat-sumo", "squat", { nom: "Squat sumo", recalageDe: "squat-sumo", muscles: { p: ["adducteurs", "fessiers", "quadriceps"], s: ["ischios", "lombaires", "abdominaux"] } },
    b => b, n => { const G = { ...n.jambes.G, ik: [27, n.jambes.G.ik[1], n.jambes.G.ik[2]], pole: [0.9, 0, 1], pied: [n.jambes.G.pied?.[0] || 0, 38, 0] }; n.jambes = { G, D: miroir(G) }; n.racine.p[1] -= 2; });   // pieds écartés : le bassin descend un peu
}
{ // Squat sauté : la descente du squat, puis une impulsion qui décolle les pieds du sol
  const sq = EXERCICES["squat"].cles, debout = sq[0], bas = sq.reduce((a, k) => (k.racine.p[1] < a.racine.p[1] ? k : a));
  const K = (k, t) => ({ ...copie(k), t });
  const envol = { ...copie(debout), t: 0.55, racine: { p: [0, 113, 1], r: [-2, 0, 0] }, bras: bras2({ fk: { flex: 150, abd: 10 }, coude: 10 }),
    jambes: jambes2({ fk: { flex: 2, abd: 3 }, genou: 6, cheville: 35 }) };
  const pointes = t => ({ ...copie(debout), t, racine: { p: [0, 105, 1], r: [0, 0, 0] }, bras: bras2({ fk: { flex: 120, abd: 10 }, coude: 10 }),
    jambes: jambes2({ ik: [13, 17, 4], pole: [0.3, 0, 1], pied: [35, 14, 0] }) });   // impulsion et réception sur la pointe des pieds
  const reception = { ...K(bas, 0.75), racine: { ...copie(bas.racine), p: [bas.racine.p[0], bas.racine.p[1] + 14, bas.racine.p[2] * 0.6] } };
  E("squat-saute", {
    nom: "Squat sauté", duree: 2, reps: 10, affiche: 0.55, vue: "3/4",
    camera: { cible: [0, 90, 0], dist: 440, el: 6 }, ombre: [0, 0, 80, 80],
    muscles: { p: ["quadriceps", "fessiers"], s: ["mollets", "ischios", "abdominaux"] },
    tempo: [[0, "Descendre"], [0.35, "Pousser fort dans le sol"], [0.55, "En l'air, corps gainé"], [0.75, "Réception genoux souples"]],
    cles: [K(debout, 0), K(bas, 0.35), pointes(0.46), envol, pointes(0.64), reception, K(debout, 0.95)],
    erreur: { texte: "se réceptionner jambes tendues : le choc remonte dans les genoux et le dos.", zone: ["quadriceps", "lombaires"],
      cles: [K(debout, 0), K(bas, 0.35), pointes(0.46), envol, pointes(0.64), K(debout, 0.75), K(debout, 0.95)] }
  });
}
{ // Rotation russe : assis buste en arrière, pieds au sol, les mains jointes passent d'un côté à l'autre
  const P = (t, rot) => ({ t, racine: { p: [0, 13, 0], r: [-32, 0, 0] }, colonne: col(10, 8, 6, rot),
    bras: bras2({ fk: { flex: 55, abd: -32 }, coude: 82, doigts: 70, phal: 80, pouce: 60 }), jambes: jambes2({ ik: [12, 8, 46], pole: [0.2, 1, 0.2], pied: PIED_PLAT(6) }) });
  E("russian-twist", {
    nom: "Rotation russe (russian twist)", duree: 3, reps: 10, affiche: 0.2, vue: "3/4",
    camera: { cible: [0, 35, 15], dist: 360, el: 12 }, ombre: [0, 15, 70, 120], accessoires: [{ type: "tapis", p0: [0, 0, 10] }],
    muscles: { p: ["obliques", "abdominaux"], s: ["flechisseurs", "lombaires"] },
    tempo: [[0, "Tourner les épaules vers la gauche"], [0.5, "Puis vers la droite, dos droit"]],
    cles: [P(0, 0), P(0.22, 40), P(0.3, 40), P(0.5, 0), P(0.72, -40), P(0.8, -40)],
    erreur: { texte: "le dos s'arrondit et seuls les bras bougent : les obliques ne tournent pas le buste.", zone: ["lombaires"],
      cles: [{ ...P(0, 0), colonne: col(30, 24, 18, 0) }, { ...P(0.22, 8), colonne: col(30, 24, 18, 8), bras: bras2({ fk: { flex: 62, abd: 30 }, coude: 55 }) },
        { ...P(0.5, 0), colonne: col(30, 24, 18, 0) }, { ...P(0.72, -8), colonne: col(30, 24, 18, -8), bras: bras2({ fk: { flex: 62, abd: -10 }, coude: 55 }) }] }
  });
}
{ // Donkey kick à quatre pattes : le genou droit plié à 90° pousse le talon vers le plafond
  const k0 = EXERCICES["bird-dog"].cles[0];
  const P = (t, D, lomb = 0) => ({ ...copie(k0), t, colonne: col(lomb, 0, -12), jambes: { G: copie(k0.jambes.G), D } });
  const haut = { fk: { flex: -12, abd: 2 }, genou: 92, cheville: 5 };
  E("donkey-kick", {
    nom: "Donkey kick (à quatre pattes)", duree: 3, reps: 12, affiche: 0.4, vue: "profil",
    camera: { cible: [0, 50, 0], dist: 380, el: 12 }, ombre: [0, 0, 70, 200], accessoires: [{ type: "tapis", p0: [0, 0, 0] }],
    muscles: { p: ["fessiers"], s: ["ischios", "lombaires", "abdominaux"] },
    tempo: [[0, "Pousser le talon vers le plafond · 1 s"], [0.4, "Serrer la fesse"], [0.5, "Revenir sans poser le genou"]],
    cles: [P(0, copie(k0.jambes.D)), P(0.4, haut), P(0.5, haut), P(0.95, copie(k0.jambes.D))],
    erreur: { texte: "le bas du dos se creuse pour monter plus haut : ce sont les lombaires qui travaillent.", zone: ["lombaires"],
      cles: [P(0, copie(k0.jambes.D)), P(0.4, { ...haut, fk: { flex: -30, abd: 2 } }, -22), P(0.5, { ...haut, fk: { flex: -30, abd: 2 } }, -22), P(0.95, copie(k0.jambes.D))] }
  });
}

/* ---------- LOT 7 pour l'appli ---------- */
{
  const bras = (cles, f) => cles && cles.map(k => { const n = copie(k); for (const c of ["G", "D"]) if (n.bras?.[c]) n.bras[c] = f(n.bras[c], c === "G" ? 1 : -1, n); return n; });
  const variante = (id, base, def, f = b => b) => {
    const b = EXERCICES[base], e = b.erreur;
    E(id, { ...copie(b), recalageDe: b.recalageDe || base, ...def, cles: bras(b.cles, f), erreur: e && { ...copie(e), cles: bras(e.cles, f) } });
    delete EXERCICES[id].clesFemme; if (EXERCICES[id].erreur) delete EXERCICES[id].erreur.clesFemme;
  };
  variante("pompe-large", "pompe", { nom: "Pompe mains larges", muscles: { p: ["pectoraux"], s: ["triceps", "deltoides", "abdominaux"] } },
    (b, s) => ({ ...b, ik: [38 * s, b.ik[1], b.ik[2]], pole: [b.pole[0] * 1.6, b.pole[1], b.pole[2]] }));
  variante("curl-inverse", "curl-barre", { nom: "Curl inversé à la barre (prise en pronation)", muscles: { p: ["avant-bras", "biceps"], s: ["deltoides"] } },
    b => ({ ...b, prono: 180 }));                                     // paumes vers le bas tout le long
}
{ // Crunch inversé : allongé, genoux pliés au-dessus des hanches ; le bassin s'enroule et décolle un peu
  const k0 = EXERCICES["pont-fessier"].cles[0];
  const P = (t, flex, lomb = 0) => ({ t, racine: copie(k0.racine), colonne: col(lomb, 0, 0), bras: copie(k0.bras), jambes: jambes2({ fk: { flex, abd: 4 }, genou: 98, cheville: 10 }) });
  const bas = P(0, 82), haut = P(0.4, 112, 0);
  E("crunch-inverse", {
    nom: "Crunch inversé", duree: 3, reps: 15, affiche: 0.4, vue: "profil",
    camera: { cible: [0, 25, 5], dist: 320, el: 10 }, ombre: [0, 0, 70, 180], accessoires: [{ type: "tapis", p0: [0, 0, 0] }],
    muscles: { p: ["abdominaux"], s: ["flechisseurs", "obliques"] },
    tempo: [[0, "Ramener les genoux vers la poitrine · 1 s"], [0.4, "Le bassin décolle à peine"], [0.5, "Redescendre en 2 s, sans poser les pieds"]],
    cles: [bas, haut, { ...copie(haut), t: 0.5 }, { ...copie(bas), t: 0.95 }],
    erreur: { texte: "balancer les jambes avec élan : ce sont les fléchisseurs de hanche qui travaillent, pas les abdominaux.", zone: ["flechisseurs"],
      cles: [P(0, 60), P(0.4, 110, 2), P(0.5, 110, 2), P(0.95, 60)] }
  });
}
{ // Kickback triceps aux haltères : buste penché, bras collé le long du buste, seul l'avant-bras se tend vers l'arrière
  const rb = EXERCICES["rowing-barre"].cles[0];
  const P = (t, coude, flex = -12) => ({ t, racine: { ...copie(rb.racine), r: [60, 0, 0] }, colonne: col(0, 0, -24), jambes: copie(rb.jambes),
    bras: bras2({ fk: { flex, abd: 7 }, coude, prono: 90, ...PRISE }) });
  const plie = P(0, 95, -24), tendu = P(0.4, 5, -26);
  E("kickback-triceps", {
    nom: "Kickback triceps aux haltères", duree: 3, reps: 12, affiche: 0.4, vue: "profil", recalageDe: "kickback-triceps",
    camera: { cible: [0, 90, 0], dist: 430, el: 8 }, ombre: [0, 0, 90, 110], accessoires: HALTERES,
    muscles: { p: ["triceps"], s: ["deltoides", "lombaires"] },
    tempo: [[0, "Tendre le bras vers l'arrière · 1 s"], [0.4, "Serrer le triceps"], [0.5, "Revenir à 90° en 2 s"]],
    cles: [plie, tendu, { ...copie(tendu), t: 0.5 }, { ...copie(plie), t: 0.95 }],
    erreur: { texte: "le coude descend et le bras se balance : l'épaule fait le mouvement à la place du triceps.", zone: ["deltoides"],
      cles: [P(0, 95, 25), P(0.4, 20, -30), P(0.5, 20, -30), P(0.95, 95, 25)] }
  });
}
{ // Fente latérale : la jambe gauche part sur le côté, la hanche recule et descend, la jambe droite reste tendue
  const BR = bras2({ fk: { flex: 70, abd: 8 }, coude: 20 });
  const P = (t, x, y, z, pitch, G, D = { ik: [-22, 8, 3], pole: [-0.2, 0, 1], pied: PIED_PLAT(-8) }) => ({ t, racine: { p: [x, y, z], r: [pitch, 0, 0] }, colonne: col(4, 4, -6), bras: BR, jambes: { G, D } });
  const pose = { ik: [72, 8, 4], pole: [0.4, 0, 1], pied: PIED_PLAT(18) }, vol = { ik: [45, 20, 5], pole: [0.4, 0, 1], pied: [10, 12, 0] }, rest = { ik: [18, 8, 3], pole: [0.2, 0, 1], pied: PIED_PLAT(8) };
  const debout = P(0, -2, 98, 0, 0, rest), bas = P(0.45, 40, 70, -10, 25, pose);
  E("fente-laterale", {
    nom: "Fente latérale", duree: 4, reps: 8, affiche: 0.45, vue: "face",
    camera: { cible: [25, 80, 0], dist: 500, el: 8 }, ombre: [28, 0, 150, 80],
    muscles: { p: ["quadriceps", "fessiers", "adducteurs"], s: ["ischios", "mollets", "abdominaux"] },
    tempo: [[0, "Grand pas sur le côté"], [0.45, "Hanche en arrière, genou au-dessus du pied"], [0.55, "Pousser pour revenir"]],
    cles: [debout, P(0.2, 14, 95, -2, 8, vol), bas, { ...copie(bas), t: 0.55 }, P(0.8, 14, 95, -2, 8, vol), { ...copie(debout), t: 0.95 }],
    erreur: { texte: "le genou rentre vers l'intérieur et le buste reste droit : le genou encaisse au lieu de la hanche.", zone: ["adducteurs"],
      cles: [debout, P(0.2, 14, 95, -2, 8, vol), P(0.45, 40, 68, -4, 6, { ...pose, pole: [-0.4, 0, 1] }), P(0.55, 40, 68, -4, 6, { ...pose, pole: [-0.4, 0, 1] }), P(0.8, 14, 95, -2, 8, vol), { ...copie(debout), t: 0.95 }] }
  });
}

/* ---------- LOT 8 pour l'appli : étirements (postures tenues : on entre, on tient, on revient) ---------- */
const TENIR = [[0, "Entrer doucement dans la posture"], [0.25, "Tenir 20 à 30 s, respirer lentement"], [0.8, "Revenir sans à-coup"]];
const tenue = (neutre, etire, autres = {}) => ({ duree: 8, reps: 2, affiche: 0.5, tempo: TENIR, ...autres,
  cles: [{ ...copie(neutre), t: 0 }, { ...copie(etire), t: 0.25 }, { ...copie(etire), t: 0.8 }, { ...copie(neutre), t: 0.95 }] });
const BRAS_BAS = bras2({ fk: { flex: 4, abd: 8 }, coude: 8 });
{ // Quadriceps debout : la main droite ramène le talon droit vers la fesse, genoux serrés
  const P = (talon, flex = 0, lomb = 0) => ({ racine: { p: [0, 99, 0], r: [0, 0, 0] }, colonne: col(lomb, 0, 0),
    bras: talon ? { G: { fk: { flex: 75, abd: 25 }, coude: 10 }, D: { ik: [-12, 84, -24], pole: [-0.3, 0, -1], ...PRISE } } : copie(BRAS_BAS),
    jambes: talon ? { G: copie(DEBOUT.G), D: { fk: { flex, abd: 1 }, genou: 148, cheville: 30 } } : copie(DEBOUT) });
  E("etirement-quadriceps", { nom: "Étirement des quadriceps debout", vue: "profil", camera: { cible: [0, 95, 0], dist: 440, el: 6 }, ombre: [0, 0, 70, 70],
    muscles: { p: ["quadriceps"], s: ["flechisseurs"] }, ...tenue(P(false), P(true, -4)),
    erreur: { texte: "le genou part vers l'avant et le dos se creuse : l'étirement du quadriceps disparaît.", zone: ["lombaires"], ...tenue(P(false), P(true, 30, -14)) } });
}
{ // Ischio-jambiers assis, une jambe : jambe gauche tendue, plante du pied droit contre la cuisse gauche, buste penché depuis les hanches
  const P = (pitch, lomb, bras) => ({ racine: { p: [0, 12, 0], r: [-8 + pitch, 0, 0] }, colonne: col(lomb, lomb * 0.8, 6),
    bras: bras2({ ik: [10, bras ? 15 : 20, bras || 22], pole: [1, -1, 0] }),   // mains posées sur le tibia de la jambe tendue
    jambes: { G: { fk: { flex: 85 + pitch, abd: 4 }, genou: 0, cheville: -5 }, D: { ik: [2, 7, 32], pole: [-1, 0.2, 0.3], pied: [10, 50, 30] } } });   // cheville contre l'intérieur de la cuisse gauche, genou vers la droite
  E("etirement-ischios-assis", { nom: "Étirement des ischio-jambiers assis (une jambe)", vue: "profil", camera: { cible: [0, 30, 25], dist: 380, el: 10 },
    ombre: [0, 25, 70, 140], accessoires: [{ type: "tapis", p0: [0, 0, 25] }],
    muscles: { p: ["ischios"], s: ["mollets", "lombaires"] }, ...tenue(P(0, 0, 0), P(32, 10, 50)),
    erreur: { texte: "le dos s'enroule pour aller chercher le pied : ce sont les lombaires qui tirent, pas les ischios.", zone: ["lombaires"], ...tenue(P(0, 0, 0), P(10, 34, 44)) } });
}
{ // Mollet contre un mur : mains au mur, jambe arrière tendue talon au sol, genou avant plié
  const P = (z, pitch, kz) => ({ racine: { p: [0, 92, z], r: [pitch, 0, 0] }, colonne: col(0, 0, -6),
    bras: bras2({ ik: [22, 132, 44], pole: [0.4, -1, -0.4], ...PRISE, doigts: 10, phal: 10, pouce: 20 }),
    jambes: { G: { ik: [12, 8, kz], pole: [0.2, 0, 1], pied: PIED_PLAT(6) }, D: { ik: [-12, 8, -38], pole: [-0.2, 0, 1], pied: PIED_PLAT(-6) } } });
  E("etirement-mollet-mur", { nom: "Étirement du mollet contre un mur", vue: "profil", camera: { cible: [0, 90, 10], dist: 470, el: 6 }, ombre: [0, 0, 80, 120],
    accessoires: [{ type: "mur", p0: [0, 0, 58], l: 120, h: 180 }], recalageDe: "etirement-mollet-mur",
    muscles: { p: ["mollets"], s: ["ischios"] }, ...tenue(P(0, 12, 22), P(10, 22, 26)),
    erreur: { texte: "le talon arrière décolle : le mollet n'est plus étiré.", zone: ["mollets"],
      ...tenue(P(0, 12, 22), { ...P(10, 22, 26), jambes: { G: { ik: [12, 8, 26], pole: [0.2, 0, 1], pied: PIED_PLAT(6) }, D: { ik: [-12, 16, -34], pole: [-0.2, 0, 1], pied: [35, -6, 0] } } }) } });
}
{ // Pectoraux : mains jointes dans le dos, on ouvre la poitrine en levant légèrement les mains vers l'arrière
  const P = (y, z, thorax, cou = 0) => ({ racine: { p: [0, 99, 0], r: [0, 0, 0] }, colonne: col(0, thorax, cou),
    bras: bras2({ ik: [5, y, z], pole: [1, 0, -0.3], ...PRISE }), jambes: copie(DEBOUT) });
  E("etirement-pectoraux", { nom: "Étirement des pectoraux (mains jointes dans le dos)", vue: "3/4", camera: { cible: [0, 115, 0], dist: 420, el: 6 }, ombre: [0, 0, 70, 70],
    muscles: { p: ["pectoraux", "deltoides"], s: ["biceps"] }, ...tenue(P(84, -16, 0), P(92, -30, -8, -4)),
    erreur: { texte: "le buste se penche en avant pour monter les mains : la poitrine se ferme au lieu de s'ouvrir.", zone: ["lombaires"],
      ...tenue(P(84, -16, 0), { ...P(102, -34, 14, 10), racine: { p: [0, 99, 0], r: [22, 0, 0] } }) } });
}
{ // Triceps au-dessus de la tête : main droite derrière la nuque, la main gauche pousse doucement le coude droit
  const P = (etire, lomb = 0) => ({ racine: { p: [0, 99, 0], r: [0, 0, 0] }, colonne: col(lomb, 0, 4), jambes: copie(DEBOUT),
    bras: etire ? { D: { fk: { flex: 172, abd: 12 }, coude: 150 }, G: { ik: [-9, 176, 1], pole: [1, 0.2, 0.3], doigts: 30, phal: 30 } } : copie(BRAS_BAS) });
  E("etirement-triceps", { nom: "Étirement des triceps au-dessus de la tête", vue: "3/4", camera: { cible: [0, 130, 0], dist: 440, el: 6 }, ombre: [0, 0, 70, 70],
    muscles: { p: ["triceps"], s: ["dorsaux"] }, ...tenue(P(false), P(true)),
    erreur: { texte: "le dos se cambre et la tête part en avant : l'épaule compense et le triceps s'étire peu.", zone: ["lombaires"], ...tenue(P(false), P(true, -16)) } });
}
{ // Épaule : bras droit tendu en travers de la poitrine, l'avant-bras gauche le rapproche
  const P = (etire, x = 24) => ({ racine: { p: [0, 99, 0], r: [0, 0, 0] }, colonne: col(0, 0, 0), jambes: copie(DEBOUT),
    bras: etire ? { D: { ik: [x, 135, 20], pole: [0, -1, 0], doigts: 20, phal: 20 }, G: { ik: [x - 14, 131, 26], pole: [1, -1, 0], doigts: 40, phal: 40 } } : copie(BRAS_BAS) });
  E("etirement-epaule-croise", { nom: "Étirement de l'épaule, bras croisé", vue: "3/4", camera: { cible: [0, 125, 0], dist: 420, el: 6 }, ombre: [0, 0, 70, 70],
    muscles: { p: ["deltoides"], s: ["trapezes", "dorsaux"] }, ...tenue(P(false), P(true)),
    erreur: { texte: "le bras passe trop haut, vers le cou : l'épaule se coince au lieu de s'étirer.", zone: ["trapezes"], ...tenue(P(false), { ...P(true, 18), bras: { D: { ik: [18, 152, 18], pole: [0, -1, 0] }, G: { ik: [4, 146, 24], pole: [1, -1, 0] } } }) } });
}
{ // Posture de l'enfant : assis sur les talons, buste posé sur les cuisses, bras allongés devant au sol
  const P = (pitch, y, z, lomb, bx) => ({ racine: { p: [0, y, z], r: [pitch, 0, 0] }, colonne: col(lomb, lomb, lomb > 20 ? 20 : 18),
    bras: bras2({ ik: [17, 3, bx], pole: [0, 1, 0.3], main: MAIN_SOL }),
    jambes: jambes2({ ik: [10, 7, -18], pole: [0, -1, 1], pied: [165, 0, 0] }) });
  E("posture-enfant", { nom: "Posture de l'enfant", vue: "profil", camera: { cible: [0, 30, 15], dist: 360, el: 10 }, ombre: [0, 10, 70, 160],
    accessoires: [{ type: "tapis", p0: [0, 0, 10] }], recalageDe: "posture-enfant",
    muscles: { p: ["dorsaux", "lombaires"], s: ["fessiers", "deltoides"] }, ...tenue(P(40, 40, 6, 6, 52), P(68, 27, -6, 26, 82)),
    erreur: { texte: "les fesses décollent des talons et les bras se plient : le dos ne s'allonge plus.", zone: ["lombaires"], ...tenue(P(40, 40, 6, 6, 52), P(62, 38, 6, 14, 58)) } });
}
{ // Cobra : allongé sur le ventre, les mains sous les épaules poussent le buste vers le haut, bassin au sol
  const P = (lomb, thorax, cou, bz) => ({ racine: { p: [0, 10, 0], r: [90, 0, 0] }, colonne: col(lomb, thorax, cou),
    bras: bras2({ ik: [18, 3, bz], pole: [0, 0, -1], main: MAIN_SOL }), jambes: jambes2({ fk: { flex: 0, abd: 4 }, genou: 0, cheville: 60 }) });
  E("cobra", { nom: "Cobra (extension du dos)", vue: "profil", camera: { cible: [0, 25, 20], dist: 380, el: 10 }, ombre: [0, 0, 70, 190],
    accessoires: [{ type: "tapis", p0: [0, 0, 0] }], recalageDe: "cobra",
    muscles: { p: ["abdominaux", "flechisseurs"], s: ["pectoraux"] }, ...tenue(P(0, 0, -10, 40), P(-30, -22, -12, 34)),
    erreur: { texte: "la tête part en arrière et les épaules montent vers les oreilles : la nuque se tasse.", zone: ["trapezes"], ...tenue(P(0, 0, -10, 40), P(-34, -26, -40, 34)) } });
}
{ // Papillon : assis droit, plantes des pieds jointes, les genoux descendent vers le sol
  const P = (genouY, pitch = -4) => ({ racine: { p: [0, 12, 0], r: [pitch, 0, 0] }, colonne: col(-2, 0, 0),
    bras: bras2({ ik: [6, 13, 35], pole: [1, -0.3, 0], ...PRISE }), jambes: jambes2({ ik: [4, 7, 33], pole: [1, genouY, 0.2], pied: [0, 0, 60] }) });
  E("papillon", { nom: "Papillon (étirement des adducteurs)", vue: "face", camera: { cible: [0, 30, 15], dist: 360, el: 16 }, ombre: [0, 15, 90, 90],
    accessoires: [{ type: "tapis", p0: [0, 0, 15] }], recalageDe: "papillon",
    muscles: { p: ["adducteurs"], s: ["fessiers"] }, ...tenue(P(1.2), P(0.2, 8)),
    erreur: { texte: "le dos s'arrondit et la tête descend : on force sur le dos au lieu d'ouvrir les hanches.", zone: ["lombaires"], ...tenue(P(1.2), { ...P(0.5, 20), colonne: col(24, 20, 20) }) } });
}
{ // Genou vers la poitrine, allongé : les deux mains ramènent le genou droit, la jambe gauche reste au sol
  const k0 = EXERCICES["pont-fessier"].cles[0];
  const P = (flex, mains) => ({ racine: copie(k0.racine), colonne: col(0, 0, 0),
    bras: mains ? { G: { ik: [-2, 55, -12], pole: [1, -1, 0], doigts: 70, phal: 80 }, D: { ik: [-16, 55, -12], pole: [-1, -1, 0], doigts: 70, phal: 80 } } : copie(k0.bras),   // les deux mains sur le genou droit
    jambes: { G: { fk: { flex: 2, abd: 3 }, genou: 2, cheville: 10 }, D: mains ? { fk: { flex, abd: 2 }, genou: 125, cheville: 10 } : copie(k0.jambes.D) } });   // départ : pied droit à plat au sol
  E("genou-poitrine", { nom: "Genou vers la poitrine (allongé)", vue: "profil", camera: { cible: [0, 25, 5], dist: 330, el: 12 }, ombre: [0, 0, 70, 180],
    accessoires: [{ type: "tapis", p0: [0, 0, 0] }], recalageDe: "genou-poitrine",
    muscles: { p: ["fessiers", "lombaires"], s: ["ischios"] }, ...tenue(P(30, false), P(118, true)),
    erreur: { texte: "la tête et les épaules décollent pour tirer le genou : la nuque se crispe.", zone: ["trapezes"],
      ...tenue(P(30, false), { ...P(110, true), colonne: col(6, 24, 30) }) } });
}

/* ---------- LOT 9 pour l'appli : étirements (suite) ---------- */
{ // Chien tête en bas : mains et pieds au sol, bassin au plus haut ; on part genoux pliés, talons levés
  const P = (y, z, pitch, ay, pied, pole) => ({ racine: { p: [0, y, z], r: [pitch, 0, 0] }, colonne: col(0, 0, 0),
    bras: bras2({ ik: [20, 3, 64], pole: [0.3, 0, -1], main: MAIN_SOL }), jambes: jambes2({ ik: [12, ay, -52], pole, pied }) });
  const plie = P(74, 4, 122, 13, [35, 0, 0], [0, -1, 1]), tendu = P(84, 0, 136, 8, PIED_PLAT(4), [0, 0, 1]);
  E("chien-tete-en-bas", { nom: "Chien tête en bas", vue: "profil", camera: { cible: [0, 50, 5], dist: 420, el: 8 }, ombre: [0, 5, 70, 160],
    accessoires: [{ type: "tapis", p0: [0, 0, 5] }], recalageDe: "chien-tete-en-bas",
    muscles: { p: ["ischios", "mollets"], s: ["dorsaux", "deltoides", "fessiers"] }, ...tenue(plie, tendu),
    erreur: { texte: "le dos s'arrondit pour garder les jambes tendues : allonger le dos d'abord, quitte à plier les genoux.", zone: ["lombaires"],
      ...tenue(plie, { ...copie(tendu), racine: { p: [0, 78, 4], r: [128, 0, 0] }, colonne: col(24, 16, 14) }) } });
}
{ // Pigeon : jambe gauche repliée devant, tibia en travers ; jambe droite tendue derrière ; buste qui se penche
  const P = (y, pitch, lomb) => ({ racine: { p: [0, y, 0], r: [pitch, 0, 0] }, colonne: col(lomb, lomb * 0.6, 6),
    bras: bras2({ ik: [22, 3, 26], pole: [0.3, 0, -1], main: MAIN_SOL }),
    jambes: { G: { ik: [-12, 6, 26], pole: [1, 0.2, 0.4], pied: [0, -60, 70] }, D: { ik: [-12, 6, -74], pole: [0, -1, 0], pied: [160, 0, 0] } } });
  E("pigeon", { nom: "Pigeon (étirement des fessiers)", vue: "3/4", camera: { cible: [0, 30, 0], dist: 400, el: 14 }, ombre: [0, -15, 90, 170],
    accessoires: [{ type: "tapis", p0: [0, 0, -10] }], recalageDe: "pigeon",
    muscles: { p: ["fessiers"], s: ["flechisseurs", "adducteurs"] }, ...tenue(P(40, 4, 0), P(40, 30, 14)),
    erreur: { texte: "le bassin bascule sur le côté de la jambe pliée : l'étirement passe dans le dos au lieu de la hanche.", zone: ["lombaires"],
      ...tenue(P(40, 4, 0), { ...P(42, 18, 28), racine: { p: [0, 42, 0], r: [18, 0, 14] } }) } });
}
{ // Pliure avant debout : jambes tendues, le buste descend depuis les hanches, bras qui pendent vers les pieds
  const P = (y, z, pitch, lomb, flex) => ({ racine: { p: [0, y, z], r: [pitch, 0, 0] }, colonne: col(lomb, lomb * 0.7, lomb * 0.6),
    bras: bras2({ fk: { flex, abd: 6 }, coude: 8 }), jambes: copie(DEBOUT) });
  E("pliure-avant", { nom: "Pliure avant debout (ischio-jambiers)", vue: "profil", camera: { cible: [0, 70, 0], dist: 440, el: 6 }, ombre: [0, 0, 70, 90],
    recalageDe: "pliure-avant", muscles: { p: ["ischios", "lombaires"], s: ["mollets", "fessiers"] }, ...tenue(P(99, 0, 0, 0, 4), P(94, -12, 70, 20, 30)),
    erreur: { texte: "les genoux plient et le dos s'enroule d'un coup : on descend plus bas mais on étire beaucoup moins les ischios.", zone: ["lombaires"],
      ...tenue(P(99, 0, 0, 0, 4), { ...P(84, -10, 55, 38, 40), jambes: jambes2({ ik: [12, 8, 3], pole: [0.2, 0, 1], pied: PIED_PLAT(6) }) }) } });
}
{ // Torsion allongée : sur le dos, bras en croix, les deux genoux pliés tombent ensemble sur le côté gauche
  const k0 = EXERCICES["pont-fessier"].cles[0];
  const P = (x, pole, cou = 0) => ({ racine: copie(k0.racine), colonne: col(0, 0, cou), bras: bras2({ fk: { flex: 0, abd: 85 }, coude: 5 }),
    jambes: { G: { ik: [15 + x, 8 + Math.abs(x) * 0.25, 46], pole, pied: PIED_PLAT(0) }, D: { ik: [-15 + x, 8 + Math.abs(x) * 0.35, 46], pole, pied: PIED_PLAT(0) } } });
  E("torsion-allongee", { nom: "Torsion allongée (genoux sur le côté)", vue: "3/4", camera: { cible: [0, 20, 5], dist: 380, el: 30 }, ombre: [0, 0, 120, 180],
    accessoires: [{ type: "tapis", p0: [0, 0, 0] }], recalageDe: "torsion-allongee",
    muscles: { p: ["obliques", "lombaires"], s: ["fessiers", "pectoraux"] }, ...tenue(P(0, [0.15, 1, 0]), P(24, [1, -0.2, 0.2], -6)),
    erreur: { texte: "l'épaule opposée décolle du sol pour suivre les genoux : la colonne ne tourne plus.", zone: ["obliques"],
      ...tenue(P(0, [0.15, 1, 0]), { ...P(24, [1, -0.2, 0.2], -6), bras: { G: { fk: { flex: 0, abd: 85 }, coude: 5 }, D: { fk: { flex: 60, abd: 20 }, coude: 30 } } }) } });
}
{ // Poignets à quatre pattes : doigts tournés vers les genoux, on recule doucement le bassin
  const k0 = EXERCICES["bird-dog"].cles[0];
  const MAINS = bras2({ ik: [17, 3, 44], pole: [0, 0, 1], main: [90, 0, 0] });
  const P = (z, pitch) => ({ ...copie(k0), racine: { p: [0, 48, z], r: [pitch, 0, 0] }, bras: copie(MAINS) });
  E("etirement-poignets", { nom: "Étirement des poignets à quatre pattes", vue: "profil", camera: { cible: [0, 30, 15], dist: 340, el: 14 }, ombre: [0, 0, 70, 200],
    accessoires: [{ type: "tapis", p0: [0, 0, 0] }], recalageDe: "etirement-poignets",
    muscles: { p: ["avant-bras"], s: ["biceps"] }, ...tenue(P(0, 90), P(-10, 98)),
    erreur: { texte: "reculer trop loin d'un coup, coudes pliés : le poignet est tiré brusquement au lieu de s'étirer.", zone: ["avant-bras"], ...tenue(P(0, 90), P(-18, 104)) } });
}
{ // Fessier en figure 4, allongé : cheville droite posée sur le genou gauche, pied gauche au sol
  const k0 = EXERCICES["pont-fessier"].cles[0];
  const croise = { ik: [9, 44, 27], pole: [-1, 0.3, 0.1], pied: [0, 0, -40] };
  const P = (D, z = 50) => ({ racine: copie(k0.racine), colonne: col(0, 0, 0), bras: copie(k0.bras),
    jambes: { G: { ik: [15, 8, z], pole: [0.15, 1, 0], pied: PIED_PLAT(0) }, D } });
  E("fessier-figure-4", { nom: "Fessier en figure 4 (allongé)", vue: "3/4", camera: { cible: [0, 25, 10], dist: 340, el: 20 }, ombre: [0, 0, 80, 180],
    accessoires: [{ type: "tapis", p0: [0, 0, 0] }], recalageDe: "fessier-figure-4",
    muscles: { p: ["fessiers"], s: ["adducteurs", "lombaires"] }, ...tenue(P(copie(k0.jambes.D)), P(croise, 46)),
    erreur: { texte: "le bassin tourne et le genou croisé se referme : la fesse ne s'étire plus.", zone: ["fessiers"],
      ...tenue(P(copie(k0.jambes.D)), P({ ...croise, pole: [-0.2, 1, 0.1] }, 46)) } });
}

/* ---------- LOT 10 pour l'appli : charges sur des mouvements existants, relevé de buste, pompe déclinée ---------- */
{ // Variantes : mêmes appuis que l'exercice d'origine (recalageDe), seuls les bras et la charge changent
  const brasDe = (cles, f) => cles && cles.map(k => { const n = copie(k); n.bras = f(n.bras); return n; });
  const V = (id, base, def, f) => {
    const b = EXERCICES[base], e = b.erreur;
    E(id, { ...copie(b), recalageDe: b.recalageDe || base, ...def, cles: brasDe(b.cles, f), clesFemme: brasDe(b.clesFemme, f),
      erreur: e && { ...copie(e), cles: brasDe(e.cles, f), clesFemme: brasDe(e.clesFemme, f) } });
    for (const o of [EXERCICES[id], EXERCICES[id].erreur]) if (o && !o.clesFemme) delete o.clesFemme;
  };
  const cote = (bras, f) => ({ G: f(bras.G, 1), D: f(bras.D, -1) });
  // barre sur les trapèzes (bras du squat barre) : la nuque reste neutre, la tête en arrière irait dans la barre
  const BARRE = EXERCICES["squat-barre"].cles[0].bras, BAS = bras2({ fk: { flex: 2, abd: 7 }, coude: 4, prono: -85, ...PRISE });
  const nuque = id => { for (const o of [EXERCICES[id], EXERCICES[id].erreur]) for (const k of [...(o.cles || []), ...(o.clesFemme || [])])
    if (k.colonne?.cou) k.colonne.cou.flex = Math.max(k.colonne.cou.flex || 0, -4); };
  const BARRE_DOS = { accessoires: [{ type: "barre-olympique", main: "2" }] };
  V("fente-arriere-barre", "fente-arriere", { nom: "Fente arrière, barre sur le dos", ...BARRE_DOS,
    muscles: { p: ["quadriceps", "fessiers"], s: ["ischios", "adducteurs", "mollets", "abdominaux", "trapezes"] } }, () => copie(BARRE));
  V("fente-avant-barre", "fente-avant", { nom: "Fente avant, barre sur le dos", ...BARRE_DOS,
    muscles: { p: ["quadriceps", "fessiers"], s: ["ischios", "adducteurs", "mollets", "abdominaux", "trapezes"] } }, () => copie(BARRE));
  nuque("fente-arriere-barre"); nuque("fente-avant-barre");
  V("fente-avant-halteres", "fente-avant", { nom: "Fente avant avec haltères", accessoires: HALTERES,
    muscles: { p: ["quadriceps", "fessiers"], s: ["ischios", "adducteurs", "mollets", "avant-bras", "trapezes"] } }, () => copie(BAS));
  V("rowing-debout-halteres", "rowing-debout", { nom: "Rowing debout aux haltères", accessoires: HALTERES },
    b => cote(b, (m, s) => ({ ...m, ik: [16 * s, m.ik[1], m.ik[2]] })));      // haltères un peu plus écartés que la barre
  V("souleve-terre-halteres", "souleve-de-terre", { nom: "Soulevé de terre aux haltères", reps: 8, accessoires: HALTERES },
    b => cote(b, (m, s) => ({ ...m, ik: [28 * s, m.ik[1], m.ik[2] - 4] })));  // haltères le long des jambes, paumes face à face (table ORIENTATION)
}
{ // Soulevé de terre sumo : pieds larges et pointes ouvertes, mains entre les genoux, buste plus droit que le soulevé classique
  const sdt = EXERCICES["souleve-de-terre"];
  const sumo = cles => cles.map(k => {
    const n = copie(k); n.racine.r[0] *= 0.72; n.racine.p[2] *= 0.6; n.racine.p[1] -= 3 + (99 - n.racine.p[1]) * 0.12;   // pieds écartés : la jambe descend moins bas
    n.jambes = jambes2({ ik: [30, 8, 3], pole: [0.8, 0, 0.6], pied: PIED_PLAT(30) });
    n.bras.G.ik[0] = 14; n.bras.D.ik[0] = -14; return n;
  });
  E("souleve-terre-sumo", {
    ...copie(sdt), recalageDe: "souleve-terre-sumo", nom: "Soulevé de terre sumo", ombre: [0, 0, 110, 110],
    muscles: { p: ["fessiers", "quadriceps", "adducteurs"], s: ["ischios", "lombaires", "trapezes", "avant-bras"] },
    tempo: [[0, "Genoux ouverts vers les pointes, pousser le sol"], [0.3, "La barre monte tout droit"], [0.5, "Hanches en avant, debout"], [0.6, "Redescendre en ouvrant les genoux"]],
    cles: sumo(sdt.cles),
    erreur: { texte: "les genoux rentrent vers l'intérieur en poussant : ils doivent rester dans l'axe des pieds.", zone: ["adducteurs", "quadriceps"],
      cles: sumo(sdt.cles).map(k => { if (k.racine.p[1] < 95) for (const [c, s] of [["G", 1], ["D", -1]]) { k.jambes[c].pole = [-0.15 * s, 0, 1]; k.bras[c].ik[2] += 2; } return k; }) }
  });
}
{ // Relevé de buste (sit-up) : pieds à plat, le buste s'enroule puis monte jusqu'à la verticale, bras croisés sur la poitrine
  const k0 = EXERCICES["pont-fessier"].cles[0], BRAS = bras2({ fk: { flex: 35, abd: 0, rot: -70 }, coude: 135 });
  const P = (t, monte, lomb, thorax, cou, piedY = 8) => ({ t, racine: { p: [...k0.racine.p], r: [k0.racine.r[0] + monte, 0, 0] }, colonne: col(lomb, thorax, cou),
    bras: copie(BRAS), jambes: jambes2({ ik: [15, piedY, 50], pole: [0.15, 1, 0], pied: PIED_PLAT(0) }) });
  const bas = P(0, 0, 0, 0, 0), enroule = P(0.18, 12, 10, 26, 14), haut = P(0.42, 62, 6, 12, 6);
  E("sit-up", {
    nom: "Relevé de buste (sit-up)", duree: 3.5, reps: 12, affiche: 0.42, vue: "profil",
    camera: { cible: [0, 35, 5], dist: 330, el: 8 }, ombre: [0, 0, 70, 180], accessoires: [{ type: "tapis", p0: [0, 0, 0] }],
    muscles: { p: ["abdominaux", "flechisseurs"], s: ["obliques"] },
    tempo: [[0, "Enrouler le haut du dos"], [0.18, "Monter jusqu'à la verticale · 1,5 s"], [0.55, "Redescendre en 2 s, vertèbre par vertèbre"]],
    cles: [bas, enroule, haut, { ...copie(haut), t: 0.55 }, { ...copie(enroule), t: 0.8 }, { ...copie(bas), t: 0.95 }],
    erreur: { texte: "monter dos plat d'un coup de reins : ce sont les fléchisseurs de hanche qui tirent et le bas du dos se creuse.", zone: ["lombaires", "flechisseurs"],
      cles: [bas, P(0.18, 22, -4, 0, 10), P(0.3, 40, -5, 0, 8), P(0.42, 58, -6, 0, 6), P(0.55, 58, -6, 0, 6), P(0.67, 40, -5, 0, 8), P(0.8, 22, -4, 0, 10), { ...copie(bas), t: 0.95 }] }
  });
}
{ // Pompe déclinée : pieds sur un banc, le corps descend tête vers le bas ; même mains que la pompe au sol
  const HP = 45, ha = HP + 14, za = -82;
  const P = (t, hs, affaisse = 0) => {
    const a = appui(hs, ha, 43, 91, za);
    return { t, racine: { p: [0, a.y - affaisse, a.z], r: [a.pitch - affaisse * 0.25, 0, 0] }, colonne: col(-affaisse * 1.2, 0, -10),
      bras: bras2({ ik: [24, 3, 42], pole: [0.6, 0.15, -1], main: MAIN_SOL }), jambes: jambes2({ ik: [10, ha, za], pole: [0, -1, 0], pied: PIED_ORTEILS }) };
  };
  E("pompe-declinee", {
    nom: "Pompe déclinée (pieds sur un banc)", duree: 3.5, reps: 10, affiche: 0.45, vue: "profil",
    camera: { cible: [0, 40, -10], dist: 420, el: 12 }, ombre: [0, -10, 80, 240],
    accessoires: [{ type: "tapis", p0: [0, 0, 20] }, { type: "marche", p0: [0, 0, -88], h: HP, p: 36, l: 64 }],
    muscles: { p: ["pectoraux", "deltoides"], s: ["triceps", "abdominaux"] },
    tempo: [[0, "Descente · 2 s"], [0.5, "Poitrine à un poing du sol"], [0.6, "Pousser · 1 s"]],
    cles: [P(0, 57), P(0.2, 42), P(0.5, 20), P(0.6, 20), P(0.85, 42)],
    erreur: { texte: "le bassin tombe vers le sol : le bas du dos se creuse au lieu de rester gainé.", zone: ["lombaires"],
      cles: [P(0, 57, 8), P(0.2, 43, 10), P(0.5, 22, 12), P(0.6, 22, 12), P(0.85, 43, 10)] }
  });
}

/* ---------- LOT 11 pour l'appli : poulie, barre, haltères et variantes au poids du corps ---------- */
{
  const appl = (cles, f) => cles && cles.map(k => { const n = copie(k); f(n); return n; });
  const V = (id, base, def, f) => {   // f(image clé) modifie bras, corps ou jambes ; normale et erreur, homme et femme
    const b = EXERCICES[base], e = b.erreur;
    E(id, { ...copie(b), recalageDe: b.recalageDe || base, ...def, cles: appl(b.cles, f), clesFemme: appl(b.clesFemme, f),
      erreur: e && { ...copie(e), cles: appl(e.cles, f), clesFemme: appl(e.clesFemme, f) } });
    for (const o of [EXERCICES[id], EXERCICES[id].erreur]) if (o && !o.clesFemme) delete o.clesFemme;
  };
  const deuxBras = f => n => { for (const [c, s] of [["G", 1], ["D", -1]]) n.bras[c] = f(n.bras[c], s, n); };
  const POULIE = EXERCICES["curl-poulie"].accessoires;
  V("curl-marteau-poulie", "curl-poulie", { nom: "Curl marteau à la poulie (corde)", muscles: { p: ["biceps", "avant-bras"], s: ["deltoides"] } },
    deuxBras(b => ({ ...b, prono: 90, fk: { ...b.fk, flex: Math.min(b.fk.flex, 30) } })));   // erreur : coudes moins avancés, la main resterait dans la pile                              // pouces vers le haut, comme avec une corde
  V("curl-inverse-poulie", "curl-poulie", { nom: "Curl inversé à la poulie basse", muscles: { p: ["avant-bras", "biceps"], s: ["deltoides"] } },
    deuxBras(b => ({ ...b, prono: 180, fk: { ...b.fk, flex: Math.min(b.fk.flex, 30) } })));                             // paumes vers le bas
  V("rowing-debout-poulie", "rowing-debout", { nom: "Rowing debout à la poulie basse", vue: "profil", camera: { cible: [0, 115, 15], dist: 440, el: 6 },
    accessoires: [POULIE[0], { type: "cable", de: [0, 22, 44], main: "2", poignee: 30 }] }, deuxBras(b => ({ ...b, ik: [b.ik[0], b.ik[1], b.ik[2] + 4] })));
  V("elevation-frontale-barre", "elevation-frontale", { nom: "Élévation frontale à la barre", accessoires: [{ type: "barre-olympique", main: "2" }] },
    deuxBras(b => ({ ...b, fk: { ...b.fk, abd: 9 }, prono: 0, ...PRISE })));   // mains à la largeur des épaules, paumes vers le bas
  // Squat aux haltères : le squat capté, bras pendants à la verticale quel que soit le penché du buste
  V("squat-halteres", "squat", { nom: "Squat aux haltères", reps: 10, accessoires: HALTERES,
    muscles: { p: ["quadriceps", "fessiers"], s: ["ischios", "adducteurs", "avant-bras", "trapezes", "abdominaux"] } },
    n => { const a = n.racine.r[0] + n.colonne.lomb.flex + n.colonne.thorax.flex; n.bras = bras2({ fk: { flex: a + 2, abd: 12 }, coude: 4, prono: -85, ...PRISE }); });
  // Step-up au poids du corps : même montée, bras libres qui accompagnent
  V("step-up-sans-poids", "step-up", { nom: "Montée sur banc (step-up)", accessoires: [EXERCICES["step-up"].accessoires[0]],
    muscles: { p: ["quadriceps", "fessiers"], s: ["ischios", "mollets", "abdominaux"] } },
    n => { n.bras = bras2({ fk: { flex: 8, abd: 10 }, coude: 25 }); });
  // Curl assis aux haltères : les bras du curl debout, assis au bout d'un banc plat
  const ASSIS = jambes2({ ik: [17, 8, 50], pole: [0.3, 0, 1], pied: PIED_PLAT(8) });
  V("curl-assis", "curl-biceps", { nom: "Curl biceps assis aux haltères", recalageDe: "curl-assis", camera: { cible: [0, 90, 5], dist: 400, el: 6 },
    ombre: [0, 5, 80, 110], accessoires: [{ type: "banc", ry: 0, p0: [0, 0, 2] }, ...HALTERES] },
    n => { n.racine.p = [0, 54, 6]; n.racine.r = [n.colonne.lomb.flex < 0 ? -10 : 0, 0, 0]; n.jambes = copie(ASSIS);
      for (const c of ["G", "D"]) n.bras[c].fk.abd = 19; });           // haltères à côté du banc, pas dedans
  // Pont fessier sur une jambe : la jambe droite tendue dans l'axe de la cuisse gauche
  V("pont-fessier-une-jambe", "pont-fessier", { nom: "Pont fessier sur une jambe", reps: 10, recalageDe: "pont-fessier-une-jambe",
    muscles: { p: ["fessiers"], s: ["ischios", "lombaires", "abdominaux", "obliques"] } },
    n => { n.jambes.D = { fk: { flex: 30 + 1.5 * (n.racine.r[0] + 90), abd: -4 }, genou: 2, cheville: 15 }; });   // levée de 30° au sol, dans l'axe du corps en haut
}

/* ---------- LOT 12 pour l'appli : squat large, poulie, pupitre, abdos allongés, pompe au mur, bateau ---------- */
{
  const appl = (cles, f) => cles && cles.map(k => { const n = copie(k); f(n); return n; });
  const V = (id, base, def, f) => {
    const b = EXERCICES[base], e = b.erreur;
    E(id, { ...copie(b), recalageDe: b.recalageDe || base, ...def, cles: appl(b.cles, f), clesFemme: appl(b.clesFemme, f),
      erreur: e && { ...copie(e), cles: appl(e.cles, f), clesFemme: appl(e.clesFemme, f) } });
    for (const o of [EXERCICES[id], EXERCICES[id].erreur]) if (o && !o.clesFemme) delete o.clesFemme;
  };
  // Squat large à la barre : le squat sumo, barre sur les trapèzes, nuque neutre
  const BARRE = EXERCICES["squat-barre"].cles[0].bras;
  V("squat-large-barre", "squat-sumo", { nom: "Squat large, barre sur le dos", reps: 8, accessoires: [{ type: "barre-olympique", main: "2" }],
    muscles: { p: ["adducteurs", "fessiers", "quadriceps"], s: ["ischios", "lombaires", "abdominaux", "trapezes"] } },
    n => { n.bras = copie(BARRE); if (n.colonne?.cou) n.colonne.cou.flex = Math.max(n.colonne.cou.flex || 0, -4); });
  // Élévation frontale à la poulie basse : dos à la machine, le câble passe entre les jambes
  V("elevation-frontale-poulie", "elevation-frontale-barre", { nom: "Élévation frontale à la poulie basse", vue: "profil", camera: { cible: [0, 115, 0], dist: 470, el: 6 },
    ombre: [0, -15, 90, 140], accessoires: [machine(PILE(0, -50)), { type: "cable", de: [0, 22, -44], main: "2", poignee: 30 }] }, () => { });
}
{ // Allongé sur le dos, jambes tendues décollées du sol : battements (haut-bas) et ciseaux (croisés)
  const k0 = EXERCICES["pont-fessier"].cles[0];
  const L = (t, g, d, lomb = 0) => ({ t, racine: copie(k0.racine), colonne: col(lomb, 0, 8), bras: copie(k0.bras), jambes: { G: g, D: d } });
  const J = (flex, abd = 3) => ({ fk: { flex, abd }, genou: 2, cheville: 25 }), Jd = (flex, abd = 3) => ({ fk: { flex, abd: -abd }, genou: 2, cheville: 25 });
  const abdos = { muscles: { p: ["abdominaux", "flechisseurs"], s: ["quadriceps", "obliques"] }, vue: "profil", camera: { cible: [0, 25, 20], dist: 340, el: 12 },
    ombre: [0, 0, 70, 200], accessoires: [{ type: "tapis", p0: [0, 0, 0] }] };
  E("battements-jambes", { ...abdos, nom: "Battements de jambes (flutter kicks)", duree: 1, reps: 20, affiche: 0.25, recalageDe: "battements-jambes",
    tempo: [[0, "Petits battements rapides, jambes tendues"], [0.5, "Bas du dos collé au sol"]],
    cles: [L(0, J(22), Jd(8)), L(0.5, J(8), Jd(22))],
    erreur: { texte: "le bas du dos se creuse et décolle du sol : ce sont les lombaires qui souffrent, pas les abdominaux qui travaillent.", zone: ["lombaires"],
      cles: [L(0, J(10), Jd(-4), -14), L(0.5, J(-4), Jd(10), -14)] } });
  E("ciseaux-allonge", { ...abdos, nom: "Ciseaux allongé (jambes croisées)", duree: 1.6, reps: 12, affiche: 0.25, recalageDe: "ciseaux-allonge", vue: "3/4",
    camera: { cible: [0, 25, 20], dist: 340, el: 30 },
    tempo: [[0, "Ouvrir les jambes"], [0.25, "Croiser, jambe gauche dessus"], [0.5, "Ouvrir"], [0.75, "Croiser, jambe droite dessus"]],
    cles: [L(0, J(12, 24), Jd(12, 24)), L(0.25, J(16, -9), Jd(8, -9)), L(0.5, J(12, 24), Jd(12, 24)), L(0.75, J(8, -9), Jd(16, -9))],
    erreur: { texte: "les jambes descendent trop bas et le dos se creuse : le bas du dos prend le relais des abdominaux.", zone: ["lombaires"],
      cles: [L(0, J(2, 24), Jd(2, 24), -14), L(0.25, J(6, -9), Jd(-2, -9), -14), L(0.5, J(2, 24), Jd(2, 24), -14), L(0.75, J(-2, -9), Jd(6, -9), -14)] } });
}
{ // Pompe contre le mur : debout penché, mains au mur à hauteur d'épaules, le corps reste droit des chevilles aux épaules
  const MAIN_MUR = [0, 0, 0], MUR = 100, J = jambes2({ ik: [12, 8, 0], pole: [0.2, 0, 1], pied: PIED_PLAT(6) });
  const P = (t, th, affaisse = 0) => ({ t, racine: { p: [0, 8 + 88 * cos(th) - affaisse, 88 * sin(th)], r: [th - affaisse, 0, 0] }, colonne: col(-affaisse * 1.5, 0, -6),
    bras: bras2({ ik: [24, 136, MUR - 8], pole: [0.8, -0.3, -0.4], main: MAIN_MUR, doigts: 10, phal: 10, pouce: 20 }), jambes: J });
  E("pompe-mur", {
    nom: "Pompe contre le mur", duree: 3, reps: 15, affiche: 0.45, vue: "profil",
    camera: { cible: [0, 100, 40], dist: 460, el: 6 }, ombre: [0, 20, 80, 140], accessoires: [machine([{ b: [60, 200, 4], p: [0, 100, MUR + 2] }])],
    muscles: { p: ["pectoraux", "triceps"], s: ["deltoides", "abdominaux"] },
    tempo: [[0, "Plier les coudes, la poitrine vers le mur · 2 s"], [0.45, "Nez près du mur"], [0.55, "Pousser · 1 s"]],
    cles: [P(0, 18), P(0.45, 27), P(0.55, 27), P(0.95, 18)],
    erreur: { texte: "le bassin part en avant et le dos se creuse : le corps n'est plus gainé d'un bloc.", zone: ["lombaires"],
      cles: [P(0, 18), P(0.45, 25, 8), P(0.55, 25, 8), P(0.95, 18)] }
  });
}
{ // Posture du bateau : en équilibre sur les fesses, buste incliné en arrière, jambes levées, bras tendus vers l'avant
  const P = (assis) => assis
    ? { racine: { p: [0, 10, 0], r: [-8, 0, 0] }, colonne: col(0, 4, -4), bras: bras2({ fk: { flex: 40, abd: 12 }, coude: 15 }),
        jambes: jambes2({ ik: [12, 8, 46], pole: [0.2, 1, 0.3], pied: PIED_PLAT(0) }) }
    : { racine: { p: [0, 10, 0], r: [-32, 0, 0] }, colonne: col(0, 2, -8), bras: bras2({ fk: { flex: 62, abd: 10 }, coude: 4 }),
        jambes: jambes2({ fk: { flex: 108, abd: 4 }, genou: 20, cheville: 15 }) };
  const creuse = { ...P(false), colonne: col(16, 20, 14) };
  E("bateau", { nom: "Posture du bateau (gainage assis)", vue: "profil", camera: { cible: [0, 35, 15], dist: 330, el: 8 }, ombre: [0, 0, 70, 140],
    accessoires: [{ type: "tapis", p0: [0, 0, 0] }], recalageDe: "bateau",
    muscles: { p: ["abdominaux", "flechisseurs"], s: ["obliques", "quadriceps", "lombaires"] }, ...tenue(P(true), P(false)),
    erreur: { texte: "le dos s'arrondit et la poitrine se ferme : on s'affaisse au lieu de gainer, le bas du dos encaisse.", zone: ["lombaires"],
      ...tenue(P(true), creuse) } });
}

/* ---------- LOT 13 pour l'appli : prises larges, step-up et squat serré à la barre, poulie en supination, développé assis à la barre ---------- */
{
  const appl = (cles, f) => cles && cles.map(k => { const n = copie(k); f(n); return n; });
  const V = (id, base, def, f) => {
    const b = EXERCICES[base], e = b.erreur;
    E(id, { ...copie(b), recalageDe: b.recalageDe || base, ...def, cles: appl(b.cles, f), clesFemme: appl(b.clesFemme, f),
      erreur: e && { ...copie(e), cles: appl(e.cles, f), clesFemme: appl(e.clesFemme, f) } });
    for (const o of [EXERCICES[id], EXERCICES[id].erreur]) if (o && !o.clesFemme) delete o.clesFemme;
  };
  const BARRE = EXERCICES["squat-barre"].cles[0].bras, BARRE_OLY = { type: "barre-olympique", main: "2" };
  const nuque = n => { if (n.colonne?.cou) n.colonne.cou.flex = Math.max(n.colonne.cou.flex || 0, -4); };
  const ecarte = dx => n => { for (const c of ["G", "D"]) { const b = n.bras?.[c]; if (b?.ik) b.ik[0] += Math.sign(b.ik[0]) * dx; } };
  // Step-up et squat pieds serrés : barre sur les trapèzes, nuque neutre
  V("step-up-barre", "step-up", { nom: "Montée sur banc avec barre (step-up)", accessoires: [EXERCICES["step-up"].accessoires[0], BARRE_OLY],
    muscles: { p: ["quadriceps", "fessiers"], s: ["ischios", "mollets", "abdominaux", "trapezes"] } }, n => { n.bras = copie(BARRE); nuque(n); });
  V("squat-serre-barre", "squat-barre", { nom: "Squat pieds serrés, barre sur le dos",
    muscles: { p: ["quadriceps"], s: ["fessiers", "ischios", "lombaires", "abdominaux", "trapezes"] } },
    n => { for (const c of ["G", "D"]) if (n.jambes?.[c]?.ik) n.jambes[c].ik[0] *= 0.6; });
  // Prises larges : les mains s'écartent sur la barre
  V("developpe-couche-large", "developpe-couche", { nom: "Développé couché prise large", muscles: { p: ["pectoraux"], s: ["deltoides", "triceps"] } }, ecarte(12));
  V("rowing-debout-large", "rowing-debout", { nom: "Rowing debout prise large", muscles: { p: ["deltoides", "trapezes"], s: ["biceps", "avant-bras"] } }, ecarte(12));
  V("curl-barre-large", "curl-barre", { nom: "Curl à la barre prise large" }, n => { for (const c of ["G", "D"]) if (n.bras?.[c]?.fk) n.bras[c].fk.abd += 9; });
  // Extension à la poulie haute en supination : paumes vers le haut (table ORIENTATION)
  V("triceps-poulie-supination", "triceps-poulie", { nom: "Extension des triceps à la poulie en supination" }, () => { });
  // Développé assis à la barre : le développé militaire, assis contre un dossier droit (pas de cambrure possible)
  const ASSIS_J = jambes2({ ik: [17, 8, 50], pole: [0.3, 0, 1], pied: PIED_PLAT(8) });
  V("developpe-assis-barre", "developpe-militaire-barre", { nom: "Développé épaules assis à la barre", recalageDe: "developpe-assis-barre",
    camera: { cible: [0, 95, 5], dist: 440, el: 6 }, ombre: [0, 5, 80, 110], accessoires: [{ type: "banc", dossier: 82, ry: 0, p0: [0, 0, 2] }, BARRE_OLY] },
    // assis 6 cm plus en avant : la barre aussi ; la tête ne recule pas, le dossier est derrière
    n => { for (const c of ["G", "D"]) { n.bras[c].ik[1] -= 45; n.bras[c].ik[2] += 6; } n.colonne.cou.flex = Math.max(n.colonne.cou.flex || 0, 0); n.racine.p = [0, 54, 6]; n.racine.r = [-4, 0, 0]; n.jambes = copie(ASSIS_J);
      n.colonne.lomb.flex = Math.max(n.colonne.lomb.flex, 0); n.colonne.thorax.flex = Math.max(n.colonne.thorax.flex, 0); });
  const da = EXERCICES["developpe-assis-barre"];
  da.erreur = { texte: "la barre part devant le visage et les coudes avancent : l'avant de l'épaule prend toute la charge.", zone: ["deltoides"],
    cles: da.cles.map((k, i) => { const n = copie(k); if (i > 0 && i < da.cles.length - 1) for (const c of ["G", "D"]) n.bras[c].ik[2] += 14; return n; }) };
}

/* ---------- LOT 14 pour l'appli : squats sur banc, au-dessus de la tête et sautés, prises serrées et larges, tirage bras tendus ---------- */
{
  const appl = (cles, f) => cles && cles.map((k, i) => { const n = copie(k); f(n, i); return n; });
  const V = (id, base, def, f) => {
    const b = EXERCICES[base], e = b.erreur;
    E(id, { ...copie(b), recalageDe: b.recalageDe || base, ...def, cles: appl(b.cles, f), clesFemme: appl(b.clesFemme, f),
      erreur: e && { ...copie(e), cles: appl(e.cles, f), clesFemme: appl(e.clesFemme, f) } });
    for (const o of [EXERCICES[id], EXERCICES[id].erreur]) if (o && !o.clesFemme) delete o.clesFemme;
  };
  const BARRE = EXERCICES["squat-barre"].cles[0].bras, BARRE_OLY = { type: "barre-olympique", main: "2" };
  const nuque = n => { if (n.colonne?.cou) n.colonne.cou.flex = Math.max(n.colonne.cou.flex || 0, -4); };
  const ecarte = dx => n => { for (const c of ["G", "D"]) { const b = n.bras?.[c]; if (b?.ik) b.ik[0] += Math.sign(b.ik[0]) * dx; } };
  // Squat sur banc : on descend jusqu'à effleurer le banc placé derrière (les fesses s'arrêtent à la hauteur de l'assise)
  const BANC_SQ = { type: "banc", l: 60, ry: 90, p0: [0, 0, -30] }, surBanc = n => { n.racine.p[1] = Math.max(n.racine.p[1], 58); };
  V("squat-banc-barre", "squat-barre", { nom: "Squat sur banc, barre sur le dos", recalageDe: "squat-banc-barre", accessoires: [BANC_SQ, BARRE_OLY] }, surBanc);
  V("squat-banc-halteres", "squat-halteres", { nom: "Squat sur banc aux haltères", recalageDe: "squat-banc-halteres", accessoires: [BANC_SQ, ...HALTERES] }, surBanc);
  // Squat barre au-dessus de la tête : bras tendus et verticaux quelle que soit l'inclinaison du buste, prise large
  V("squat-barre-tete", "squat", { nom: "Squat barre au-dessus de la tête (overhead squat)", reps: 6, accessoires: [BARRE_OLY],
    muscles: { p: ["quadriceps", "fessiers"], s: ["deltoides", "trapezes", "abdominaux", "lombaires"] } },
    n => { n.bras = bras2({ ik: [42, n.racine.p[1] + 96, 2], pole: [1, -0.3, -0.2], ...PRISE }); });   // barre à bout de bras, au-dessus du milieu des pieds
  // Squat sauté avec barre sur le dos
  V("squat-saute-barre", "squat-saute", { nom: "Squat sauté avec barre", reps: 6, accessoires: [BARRE_OLY],
    muscles: { p: ["quadriceps", "fessiers"], s: ["mollets", "ischios", "abdominaux", "trapezes"] } }, n => { n.bras = copie(BARRE); nuque(n); });
  // Prises : rowing buste penché serré, tirage vertical en supination, rowing assis prise large
  V("rowing-barre-serre", "rowing-barre", { nom: "Rowing barre prise serrée" },   // mains rapprochées : la barre s'arrête 3 cm plus tôt devant le ventre
    n => { ecarte(-8)(n); for (const c of ["G", "D"]) n.bras[c].ik[2] += 3; });
  V("tirage-vertical-supination", "tirage-vertical", { nom: "Tirage vertical en supination", muscles: { p: ["dorsaux", "biceps"], s: ["trapezes", "avant-bras"] } },
    n => { for (const c of ["G", "D"]) n.bras[c].ik[0] = Math.sign(n.bras[c].ik[0]) * 16; });
  const ra = EXERCICES["rowing-assis"].accessoires;
  V("rowing-assis-large", "rowing-assis", { nom: "Rowing assis à la poulie, prise large", accessoires: [ra[0], ra[1], { ...copie(ra[2]), poignee: 64 }],
    muscles: { p: ["trapezes", "dorsaux", "deltoides"], s: ["biceps", "lombaires"] } }, ecarte(12));
  // Tirage bras tendus à la poulie haute : bras presque tendus, la barre descend en arc des épaules aux cuisses
  const tp = EXERCICES["triceps-poulie"].cles[0];
  const T = (t, flex, coude = 6) => ({ ...copie(tp), t, racine: { p: [0, 97, -6], r: [18, 0, 0] }, colonne: col(0, 0, -8),
    bras: bras2({ fk: { flex, abd: 10 }, coude, prono: 80, ...PRISE }) });
  E("tirage-bras-tendus", {
    nom: "Tirage bras tendus à la poulie haute", duree: 3, reps: 12, affiche: 0.4, vue: "profil",
    camera: { cible: [0, 115, 2], dist: 480, el: 6 }, ombre: [0, 15, 90, 120],
    accessoires: [{ type: "poulie", h: 205, p0: [0, 0, 62] }, { type: "cable", de: [0, 205, 68], main: "2", poignee: 60 }],
    muscles: { p: ["dorsaux"], s: ["triceps", "abdominaux", "trapezes"] },
    tempo: [[0, "Descendre la barre en arc, bras tendus · 1 s"], [0.4, "Barre contre les cuisses"], [0.5, "Remonter en 2 s jusqu'aux yeux"]],
    cles: [T(0, 118), T(0.4, 12), T(0.5, 12), T(0.95, 118)],
    erreur: { texte: "les coudes se plient et poussent vers le bas : c'est un exercice de triceps, plus de dorsaux.", zone: ["triceps"],
      cles: [T(0, 90, 70), T(0.4, 14, 10), T(0.5, 14, 10), T(0.95, 90, 70)] }
  });
}

/* ---------- LOT 15 pour l'appli : curls alternés, squat rapide, good morning assis, sit-up 3/4, planche latérale genoux pliés ---------- */
{
  const appl = (cles, f) => cles && cles.map((k, i) => { const n = copie(k); f(n, i); return n; });
  const V = (id, base, def, f) => {
    const b = EXERCICES[base], e = b.erreur;
    E(id, { ...copie(b), recalageDe: b.recalageDe || base, ...def, cles: appl(b.cles, f), clesFemme: appl(b.clesFemme, f),
      erreur: e && { ...copie(e), cles: appl(e.cles, f), clesFemme: appl(e.clesFemme, f) } });
    for (const o of [EXERCICES[id], EXERCICES[id].erreur]) if (o && !o.clesFemme) delete o.clesFemme;
  };
  const BARRE = EXERCICES["squat-barre"].cles[0].bras, BARRE_OLY = { type: "barre-olympique", main: "2" };
  // Curls alternés : un bras monte pendant que l'autre attend en bas, puis on change (images clés 0 = bas, 1 = haut du curl d'origine)
  const alterne = cles => {
    if (!cles) return cles;
    const bas = cles[0], haut = cles[1];
    const K = (t, g, d) => ({ ...copie(g || d ? haut : bas), t, bras: { G: copie((g ? haut : bas).bras.G), D: copie((d ? haut : bas).bras.D) } });
    return [K(0, 0, 0), K(0.2, 1, 0), K(0.25, 1, 0), K(0.475, 0, 0), K(0.5, 0, 0), K(0.7, 0, 1), K(0.75, 0, 1), K(0.975, 0, 0)];
  };
  const ALT = (id, base, nom) => {
    const b = EXERCICES[base];
    E(id, { ...copie(b), recalageDe: id, nom, duree: b.duree * 2, affiche: 0.2,
      tempo: [[0, "Monter le bras gauche · 1 s"], [0.25, "Redescendre en 2 s"], [0.5, "Monter le bras droit · 1 s"], [0.75, "Redescendre en 2 s"]],
      cles: alterne(b.cles), clesFemme: alterne(b.clesFemme), erreur: b.erreur && { ...copie(b.erreur), cles: alterne(b.erreur.cles), clesFemme: alterne(b.erreur.clesFemme) } });
    for (const o of [EXERCICES[id], EXERCICES[id].erreur]) if (o && !o.clesFemme) delete o.clesFemme;
  };
  ALT("curl-alterne", "curl-biceps", "Curl alterné aux haltères");
  // haltères un peu écartés des cuisses, comme au curl marteau : le bras qui attend en bas ne frotte pas la jambe
  for (const o of [EXERCICES["curl-alterne"], EXERCICES["curl-alterne"].erreur]) for (const cles of [o.cles, o.clesFemme]) for (const k of cles || [])
    for (const c of ["G", "D"]) if (k.bras[c].fk) k.bras[c].fk.abd = Math.max(k.bras[c].fk.abd || 0, 17);
  ALT("curl-marteau-alterne", "curl-marteau", "Curl marteau alterné");
  ALT("curl-assis-alterne", "curl-assis", "Curl alterné assis aux haltères");
  // Squat rapide (speed squat) : barre légère, descente contrôlée et montée explosive
  V("squat-vitesse-barre", "squat-barre", { nom: "Squat rapide à la barre (speed squat)", duree: 2.2, reps: 6,
    tempo: [[0, "Descendre en contrôle"], [0.45, "Toucher le bas"], [0.56, "Remonter le plus vite possible"]] }, () => { });
  // Sit-up 3/4 : le buste s'arrête vers 45° au lieu de monter à la verticale
  const s0 = EXERCICES["sit-up"].cles[0].racine.r[0];
  V("sit-up-3-4", "sit-up", { nom: "Relevé de buste 3/4 (s'arrêter à 45°)", recalageDe: "sit-up-3-4",
    tempo: [[0, "Enrouler le haut du dos"], [0.18, "Monter jusqu'à 45° · 1 s"], [0.55, "Redescendre en 2 s"]] },
    n => { n.racine.r[0] = s0 + (n.racine.r[0] - s0) * 0.62; });
  // Planche latérale genoux pliés : appui sur l'avant-bras et le genou, jambes pliées vers l'arrière
  V("planche-laterale-genoux", "planche-laterale", { nom: "Planche latérale genoux pliés", recalageDe: "planche-laterale-genoux" },
    n => { for (const c of ["G", "D"]) n.jambes[c] = { fk: { abd: 0, flex: 10 }, genou: 95 }; });
}
{ // Good morning assis : assis au bout d'un banc, barre sur les trapèzes, le buste bascule vers l'avant en gardant le dos droit
  const ASSIS = jambes2({ ik: [20, 8, 48], pole: [0.3, 0, 1], pied: PIED_PLAT(8) }), BARRE = EXERCICES["squat-barre"].cles[0].bras;
  const P = (t, pitch, dos = col(0, 0, -4)) => ({ t, racine: { p: [0, 54, 4], r: [pitch, 0, 0] }, colonne: dos, bras: copie(BARRE), jambes: ASSIS });
  E("good-morning-assis", {
    nom: "Good morning assis à la barre", duree: 3.5, reps: 10, affiche: 0.45, vue: "profil", recalageDe: "good-morning-assis",
    camera: { cible: [0, 80, 10], dist: 420, el: 6 }, ombre: [0, 5, 80, 110],
    accessoires: [{ type: "banc", l: 60, ry: 90, p0: [0, 0, -4] }, { type: "barre-olympique", main: "2" }],
    muscles: { p: ["lombaires", "fessiers"], s: ["ischios", "abdominaux", "trapezes"] },
    tempo: [[0, "Basculer le buste vers l'avant, dos droit · 2 s"], [0.45, "Buste vers 45°"], [0.55, "Se redresser · 1 s"]],
    cles: [P(0, -2), P(0.45, 44), P(0.55, 44), P(0.95, -2)],
    erreur: { texte: "le dos s'arrondit pour descendre plus bas : les disques du bas du dos encaissent la charge.", zone: ["lombaires"],
      cles: [P(0, -2), P(0.45, 30, col(22, 18, 10)), P(0.55, 30, col(22, 18, 10)), P(0.95, -2)] }
  });
}

/* ---------- LOT 16 pour l'appli : assis aux haltères, mollets aux haltères, curls inversé et serré, pompe inclinée serrée, développé couché à la Smith ---------- */
{
  const appl = (cles, f) => cles && cles.map((k, i) => { const n = copie(k); f(n, i); return n; });
  const V = (id, base, def, f) => {
    const b = EXERCICES[base], e = b.erreur;
    E(id, { ...copie(b), recalageDe: b.recalageDe || base, ...def, cles: appl(b.cles, f), clesFemme: appl(b.clesFemme, f),
      erreur: e && { ...copie(e), cles: appl(e.cles, f), clesFemme: appl(e.clesFemme, f) } });
    for (const o of [EXERCICES[id], EXERCICES[id].erreur]) if (o && !o.clesFemme) delete o.clesFemme;
  };
  const alterne = cles => {
    if (!cles) return cles;
    const bas = cles[0], haut = cles[1];
    const K = (t, g, d) => ({ ...copie(g || d ? haut : bas), t, bras: { G: copie((g ? haut : bas).bras.G), D: copie((d ? haut : bas).bras.D) } });
    return [K(0, 0, 0), K(0.2, 1, 0), K(0.25, 1, 0), K(0.475, 0, 0), K(0.5, 0, 0), K(0.7, 0, 1), K(0.75, 0, 1), K(0.975, 0, 0)];
  };
  // Assis au bout d'un banc plat (comme le good morning assis)
  const ASSIS = jambes2({ ik: [20, 8, 48], pole: [0.3, 0, 1], pied: PIED_PLAT(8) }), BANC_ASSIS = { type: "banc", l: 60, ry: 90, p0: [0, 0, -4] };
  const assis = n => { n.racine.p = [0, 54, 4]; n.racine.r = [-2, 0, 0]; n.jambes = copie(ASSIS); };
  V("elevations-laterales-assis", "elevations-laterales", { nom: "Élévations latérales assis", recalageDe: "elevations-laterales-assis",
    camera: { cible: [0, 95, 0], dist: 420, el: 6 }, accessoires: [BANC_ASSIS, ...HALTERES] },   // assis, les cuisses sont sous les mains : bras écartés au départ
    n => { assis(n); for (const c of ["G", "D"]) n.bras[c].fk.abd = Math.max(n.bras[c].fk.abd || 0, 24); });
  const b = EXERCICES["developpe-epaules-assis"];
  E("developpe-epaules-assis-alterne", { ...copie(b), recalageDe: "developpe-epaules-assis-alterne", nom: "Développé épaules assis alterné", duree: b.duree * 2, affiche: 0.2,
    tempo: [[0, "Pousser le bras gauche · 1 s"], [0.25, "Redescendre en 2 s"], [0.5, "Pousser le bras droit · 1 s"], [0.75, "Redescendre en 2 s"]],
    cles: alterne(b.cles), erreur: { ...copie(b.erreur), cles: alterne(b.erreur.cles) } });
  delete EXERCICES["developpe-epaules-assis-alterne"].clesFemme; delete EXERCICES["developpe-epaules-assis-alterne"].erreur.clesFemme;
  // Mollets sur une marche, un haltère dans chaque main, bras pendants
  V("mollets-halteres", "mollets", { nom: "Mollets debout aux haltères", accessoires: [EXERCICES["mollets"].accessoires[0], ...HALTERES], muscles: { p: ["mollets"], s: ["avant-bras", "trapezes"] } },
    n => { n.bras = bras2({ fk: { flex: 2, abd: 14 }, coude: 4, prono: -85, ...PRISE }); });
  // Curl inversé aux haltères (paumes vers le bas), curl barre prise serrée
  V("curl-inverse-halteres", "curl-biceps", { nom: "Curl inversé aux haltères (prise en pronation)", muscles: { p: ["avant-bras", "biceps"], s: ["deltoides"] } },
    n => { for (const c of ["G", "D"]) { n.bras[c].prono = 180; n.bras[c].fk.abd = Math.max(n.bras[c].fk.abd || 0, 17); } });
  V("curl-barre-serre", "curl-barre", { nom: "Curl barre EZ prise serrée" }, n => { for (const c of ["G", "D"]) n.bras[c].fk.abd = Math.max((n.bras[c].fk.abd || 0) - 5, 2); });
  // Pompe inclinée mains serrées : mains rapprochées sur le banc, coudes le long du corps
  V("pompe-inclinee-serree", "pompe-inclinee", { nom: "Pompe inclinée mains serrées", muscles: { p: ["triceps", "pectoraux"], s: ["deltoides", "abdominaux"] } },
    n => { for (const c of ["G", "D"]) { const m = n.bras[c]; m.ik[0] = Math.sign(m.ik[0]) * 9; m.pole[0] *= 0.4; } });
  // Développé couché à la Smith machine : la barre monte et descend à la verticale entre deux rails
  const RAILS = machine([{ b: [8, 135, 8], p: [92, 67, -37] }, { b: [8, 135, 8], p: [-92, 67, -37] }, { b: [200, 8, 8], p: [0, 135, -37] }]);
  const verticale = n => { for (const c of ["G", "D"]) n.bras[c].ik[2] = -37; };
  const dc = EXERCICES["developpe-couche"].accessoires;
  V("developpe-couche-smith", "developpe-couche", { nom: "Développé couché à la Smith machine", accessoires: [...copie(dc), RAILS] }, verticale);
  V("developpe-couche-serre-smith", "developpe-couche-serre", { nom: "Développé couché prise serrée à la Smith machine", accessoires: [...copie(EXERCICES["developpe-couche-serre"].accessoires), RAILS] }, verticale);
}

/* ---------- LOT 17 pour l'appli : triceps aux haltères (allongé, kickbacks), squat sauté aux haltères, tractions assistée en supination et prise mixte ---------- */
{
  const appl = (cles, f) => cles && cles.map((k, i) => { const n = copie(k); f(n, i); return n; });
  const V = (id, base, def, f) => {
    const b = EXERCICES[base], e = b.erreur;
    E(id, { ...copie(b), recalageDe: b.recalageDe || base, ...def, cles: appl(b.cles, f), clesFemme: appl(b.clesFemme, f),
      erreur: e && { ...copie(e), cles: appl(e.cles, f), clesFemme: appl(e.clesFemme, f) } });
    for (const o of [EXERCICES[id], EXERCICES[id].erreur]) if (o && !o.clesFemme) delete o.clesFemme;
  };
  // Extension des triceps allongé aux haltères : la barre au front, un haltère dans chaque main, prise neutre
  V("extension-triceps-halteres", "barre-front", { nom: "Extension des triceps allongé aux haltères", accessoires: [EXERCICES["barre-front"].accessoires[0], ...HALTERES] },
    n => { for (const c of ["G", "D"]) n.bras[c].ik[0] = Math.sign(n.bras[c].ik[0]) * 21; });   // les haltères passent de chaque côté de la tête
  // Squat sauté aux haltères : bras pendants, haltères à la verticale des épaules tout le long
  V("squat-saute-halteres", "squat-saute", { nom: "Squat sauté aux haltères", reps: 8, accessoires: HALTERES,
    muscles: { p: ["quadriceps", "fessiers"], s: ["mollets", "ischios", "avant-bras", "abdominaux"] } },
    n => { const a = n.racine.r[0] + (n.colonne.lomb?.flex || 0) + (n.colonne.thorax?.flex || 0); n.bras = bras2({ fk: { flex: a + 2, abd: 14 }, coude: 4, prono: -85, ...PRISE }); });
  // Tractions : assistée en supination (prise de la traction supination), prise mixte (main gauche en supination)
  V("traction-assistee-supination", "traction-assistee", { nom: "Traction assistée en supination", recalageDe: "traction-assistee-supination",
    muscles: { p: ["dorsaux", "biceps"], s: ["avant-bras", "trapezes"] } }, n => { for (const c of ["G", "D"]) n.bras[c].ik[0] = Math.sign(n.bras[c].ik[0]) * 24; });
  V("traction-mixte", "traction", { nom: "Traction prise mixte (une main en supination)", recalageDe: "traction-mixte" }, () => { });
}
{ // Kickbacks : buste penché, le haut du bras reste le long du corps et le coude se tend vers l'arrière
  const K1 = EXERCICES["rowing-haltere"].cles[0], KB = (coude, flex = -14) => ({ fk: { flex, abd: 14 }, coude, prono: 0, ...PRISE });
  const U = (t, coude, flex) => ({ ...copie(K1), t, bras: { G: { ...KB(coude, flex), fk: { flex: flex ?? -14, abd: 24 } }, D: copie(K1.bras.D) } });   // l'haltère passe à côté du genou d'appui
  E("kickback-haltere", {
    nom: "Kickback à un bras (extension triceps penché)", duree: 3, reps: 12, affiche: 0.4, vue: "profil", recalageDe: "kickback-haltere",
    camera: { cible: [0, 70, 15], dist: 420, el: 10 }, ombre: [0, 10, 80, 180], accessoires: [copie(EXERCICES["rowing-haltere"].accessoires[0]), { type: "haltere", main: "G" }],
    muscles: { p: ["triceps"], s: ["deltoides", "dorsaux"] },
    tempo: [[0, "Tendre le coude vers l'arrière · 1 s"], [0.4, "Bras tendu, serrer"], [0.5, "Revenir en 2 s"]],
    cles: [U(0, 95), U(0.4, 6), U(0.5, 6), U(0.95, 95)],
    erreur: { texte: "le coude descend et le bras balance : c'est l'épaule qui lance l'haltère, pas le triceps qui tend le bras.", zone: ["deltoides"],
      cles: [U(0, 95, 30), U(0.4, 20, -30), U(0.5, 20, -30), U(0.95, 95, 30)] }
  });
  const R0 = EXERCICES["rowing-halteres"].cles[0];
  const D = (t, coude, flex = -14) => ({ ...copie(R0), t, bras: bras2(KB(coude, flex)) });
  E("kickback-halteres-debout", {
    nom: "Kickback debout aux haltères, buste penché", duree: 3, reps: 12, affiche: 0.4, vue: "profil", recalageDe: "kickback-halteres-debout",
    camera: { cible: [0, 90, 5], dist: 430, el: 6 }, ombre: [0, 0, 90, 110], accessoires: HALTERES,
    muscles: { p: ["triceps"], s: ["deltoides", "lombaires"] },
    tempo: [[0, "Tendre les coudes vers l'arrière · 1 s"], [0.4, "Bras tendus, serrer"], [0.5, "Revenir en 2 s"]],
    cles: [D(0, 95), D(0.4, 6), D(0.5, 6), D(0.95, 95)],
    erreur: { texte: "les coudes descendent et les bras balancent : l'élan des épaules remplace le travail des triceps.", zone: ["deltoides"],
      cles: [D(0, 95, 30), D(0.4, 20, -30), D(0.5, 20, -30), D(0.95, 95, 30)] }
  });
}

/* ---------- LOT 18 pour l'appli : barre sur le dos (mollets, squat bulgare), curl inversé à la barre, rowing en supination ---------- */
{
  const appl = (cles, f) => cles && cles.map((k, i) => { const n = copie(k); f(n, i); return n; });
  const V = (id, base, def, f) => {
    const b = EXERCICES[base], e = b.erreur;
    E(id, { ...copie(b), recalageDe: b.recalageDe || base, ...def, cles: appl(b.cles, f), clesFemme: appl(b.clesFemme, f),
      erreur: e && { ...copie(e), cles: appl(e.cles, f), clesFemme: appl(e.clesFemme, f) } });
    for (const o of [EXERCICES[id], EXERCICES[id].erreur]) if (o && !o.clesFemme) delete o.clesFemme;
  };
  const BARRE = EXERCICES["squat-barre"].cles[0].bras, BARRE_OLY = { type: "barre-olympique", main: "2" };
  const dos = n => { n.bras = copie(BARRE); if (n.colonne?.cou) n.colonne.cou.flex = Math.max(n.colonne.cou.flex || 0, -4); };   // nuque neutre sous la barre
  V("mollets-barre", "mollets", { nom: "Mollets debout, barre sur le dos", accessoires: [EXERCICES["mollets"].accessoires[0], BARRE_OLY],
    muscles: { p: ["mollets"], s: ["trapezes", "abdominaux"] } }, dos);
  V("squat-bulgare-barre", "squat-bulgare", { nom: "Squat bulgare, barre sur le dos", accessoires: [EXERCICES["squat-bulgare"].accessoires[0], BARRE_OLY],
    muscles: { p: ["quadriceps", "fessiers"], s: ["adducteurs", "ischios", "abdominaux", "trapezes"] } }, dos);
  // Curl inversé à la barre : paumes vers le bas tout le long
  V("curl-inverse-barre", "curl-barre", { nom: "Curl inversé à la barre (prise en pronation)", muscles: { p: ["avant-bras", "biceps"], s: ["deltoides"] } },
    n => { for (const c of ["G", "D"]) n.bras[c].prono = 180; });
  // Rowing barre en supination : paumes vers l'avant (table ORIENTATION), mains un peu plus serrées, coudes le long du corps
  V("rowing-barre-supination", "rowing-barre", { nom: "Rowing barre buste penché en supination", muscles: { p: ["dorsaux", "biceps"], s: ["trapezes", "lombaires", "ischios", "avant-bras"] } },
    n => { for (const c of ["G", "D"]) { const b = n.bras?.[c]; if (b?.ik) { b.ik[0] -= Math.sign(b.ik[0]) * 4; b.ik[2] += 3; } } });   // la barre s'arrête 3 cm devant le ventre
}

/* ---------- LOT 19 pour l'appli : développés en prise neutre et alterné, élévations frontales assis ---------- */
{
  const appl = (cles, f) => cles && cles.map((k, i) => { const n = copie(k); f(n, i); return n; });
  const V = (id, base, def, f) => {
    const b = EXERCICES[base], e = b.erreur;
    E(id, { ...copie(b), recalageDe: b.recalageDe || base, ...def, cles: appl(b.cles, f), clesFemme: appl(b.clesFemme, f),
      erreur: e && { ...copie(e), cles: appl(e.cles, f), clesFemme: appl(e.clesFemme, f) } });
    for (const o of [EXERCICES[id], EXERCICES[id].erreur]) if (o && !o.clesFemme) delete o.clesFemme;
  };
  const alterne = cles => {      // images clés 0 = bas, 1 = haut de l'exercice d'origine ; un bras après l'autre
    if (!cles) return cles;
    const bas = cles[0], haut = cles[1];
    const K = (t, g, d) => ({ ...copie(g || d ? haut : bas), t, bras: { G: copie((g ? haut : bas).bras.G), D: copie((d ? haut : bas).bras.D) } });
    return [K(0, 0, 0), K(0.2, 1, 0), K(0.25, 1, 0), K(0.475, 0, 0), K(0.5, 0, 0), K(0.7, 0, 1), K(0.75, 0, 1), K(0.975, 0, 0)];
  };
  const ALT = (id, base, nom, tempo) => {
    const b = EXERCICES[base];
    E(id, { ...copie(b), recalageDe: id, nom, duree: b.duree * 2, affiche: 0.2, tempo,
      cles: alterne(b.cles), clesFemme: alterne(b.clesFemme), erreur: b.erreur && { ...copie(b.erreur), cles: alterne(b.erreur.cles), clesFemme: alterne(b.erreur.clesFemme) } });
    for (const o of [EXERCICES[id], EXERCICES[id].erreur]) if (o && !o.clesFemme) delete o.clesFemme;
  };
  // Prise neutre : paumes face à face (table ORIENTATION), même trajet
  V("developpe-militaire-neutre", "developpe-militaire", { nom: "Développé debout aux haltères, prise neutre" }, () => { });
  V("developpe-epaules-assis-neutre", "developpe-epaules-assis", { nom: "Développé épaules assis, prise neutre" }, () => { });
  ALT("developpe-militaire-alterne", "developpe-militaire", "Développé debout alterné aux haltères",
    [[0, "Pousser le bras gauche · 1 s"], [0.25, "Redescendre en 2 s"], [0.5, "Pousser le bras droit · 1 s"], [0.75, "Redescendre en 2 s"]]);
  // Élévation frontale assis au bout d'un banc (même assise que les élévations latérales assis)
  const ASSIS = jambes2({ ik: [20, 8, 48], pole: [0.3, 0, 1], pied: PIED_PLAT(8) }), BANC_ASSIS = { type: "banc", l: 60, ry: 90, p0: [0, 0, -4] };
  V("elevation-frontale-assis", "elevation-frontale", { nom: "Élévation frontale assis aux haltères", recalageDe: "elevation-frontale-assis",
    camera: { cible: [0, 95, 0], dist: 420, el: 6 }, accessoires: [BANC_ASSIS, ...HALTERES] },
    n => { n.racine.p = [0, 54, 4]; n.racine.r = [-2, 0, 0]; n.jambes = copie(ASSIS); for (const c of ["G", "D"]) n.bras[c].fk.abd = Math.max(n.bras[c].fk.abd || 0, 32); });   // haltères écartés des cuisses
  ALT("elevation-frontale-assis-alterne", "elevation-frontale-assis", "Élévation frontale assis alternée",
    [[0, "Monter le bras gauche · 1 s"], [0.25, "Redescendre en 2 s"], [0.5, "Monter le bras droit · 1 s"], [0.75, "Redescendre en 2 s"]]);
}

/* Orientation des mains : direction où la paume doit regarder (main gauche ; la droite est symétrique), tenue à chaque image
   par la rotation de l'avant-bras. Vers les pieds au développé couché, vers l'avant au tirage, vers le corps au soulevé de terre,
   face à face en prise neutre… « G » : seule la main gauche (la droite sert d'appui). */
const AVANT = [0, 0, 1], ARRIERE = [0, 0, -1], BAS = [0, -1, 0], DEDANS = [-1, 0, 0];
const ORIENTATION = {
  "developpe-couche": AVANT, "developpe-incline": AVANT, "developpe-militaire": AVANT, "shoulder-press": AVANT, "tirage-vertical": AVANT,
  "squat-barre": AVANT, "smith-squat": AVANT, "pec-deck": DEDANS, "vis-a-vis": DEDANS, "rowing-barre": ARRIERE, "souleve-de-terre": ARRIERE,
  "hip-thrust": BAS, "hip-thrust-machine": BAS, "triceps-poulie": [0, -0.7, -0.7], "kickback-machine": BAS, "chest-press": DEDANS,
  "fentes-halteres": DEDANS, "souleve-roumain-halteres": ARRIERE, "rowing-haltere": [DEDANS, "G"], "rowing-assis": DEDANS,
  "face-pull": DEDANS, "oiseau-machine": DEDANS, "elevations-laterales": [-0.6, -0.8, 0],
  "developpe-couche-halteres": AVANT, "traction-supination": ARRIERE, "rowing-halteres": DEDANS, "souleve-roumain-barre": ARRIERE,
  "developpe-militaire-barre": AVANT, "ecarte-halteres": [-0.7, 0.7, 0], "dips-barres": DEDANS, "goblet-squat": DEDANS,
  "pont-fessier-barre": BAS, "hip-thrust-une-jambe": BAS, "souleve-terre-kettlebell": ARRIERE, "rowing-kettlebell": [DEDANS, "G"], "goblet-squat-kettlebell": DEDANS,
  "developpe-couche-serre": AVANT, "developpe-incline-barre": AVANT, "good-morning": AVANT, "front-squat": [0, 1, 0.3],
  "rowing-debout": ARRIERE, "barre-front": AVANT, "pullover-haltere": DEDANS,
  "tirage-vertical-serre": DEDANS, "developpe-epaules-assis": AVANT,
  "fente-arriere-barre": AVANT, "fente-avant-barre": AVANT, "fente-avant-halteres": DEDANS, "rowing-debout-halteres": ARRIERE,
  "souleve-terre-halteres": DEDANS, "souleve-terre-sumo": ARRIERE, "squat-halteres": DEDANS, "rowing-debout-poulie": ARRIERE,
  "elevation-frontale-barre": BAS, "elevation-frontale-poulie": BAS, "squat-large-barre": AVANT,
  "step-up-barre": AVANT, "squat-serre-barre": AVANT, "developpe-couche-large": AVANT, "rowing-debout-large": ARRIERE,
  "triceps-poulie-supination": [0, 0.7, 0.7], "developpe-assis-barre": AVANT,
  "squat-banc-barre": AVANT, "squat-banc-halteres": DEDANS, "squat-saute-barre": AVANT, "squat-barre-tete": [0, 1, 0],
  "rowing-barre-serre": ARRIERE, "tirage-vertical-supination": ARRIERE, "rowing-assis-large": BAS, "tirage-bras-tendus": [0, -0.7, -0.7],
  "squat-vitesse-barre": AVANT, "good-morning-assis": AVANT,
  "mollets-halteres": DEDANS, "developpe-epaules-assis-alterne": AVANT, "developpe-couche-smith": AVANT, "developpe-couche-serre-smith": AVANT,
  "extension-triceps-halteres": DEDANS, "squat-saute-halteres": DEDANS, "traction-assistee-supination": ARRIERE, "traction-mixte": [ARRIERE, "G"],
  "kickback-haltere": [DEDANS, "G"], "kickback-halteres-debout": DEDANS,
  "mollets-barre": AVANT, "squat-bulgare-barre": AVANT, "rowing-barre-supination": AVANT,
  "developpe-militaire-neutre": DEDANS, "developpe-epaules-assis-neutre": DEDANS, "developpe-militaire-alterne": AVANT
};
for (const [id, v] of Object.entries(ORIENTATION)) {
  const [paume, seul] = Array.isArray(v[0]) ? v : [v, null], ex = EXERCICES[id];
  for (const o of [ex, ex.erreur]) for (const k of (o && o.cles) || []) for (const c of seul ? [seul] : ["G", "D"]) {
    const b = k.bras && k.bras[c]; if (!b) continue;
    b.paume = paume; delete b.prono; delete b.main; delete b.auto;
  }
}

/* Poignet plié vers l'arrière (degrés négatifs) quand la rotation seule ne suffit pas : barre sur le dos, sur les hanches, poignées verticales. */
const POIGNET = { "good-morning": -40, "front-squat": -40, "pont-fessier-barre": -30, "hip-thrust-une-jambe": -30, "squat-barre": -40, "smith-squat": -40, "pec-deck": -40, "tirage-vertical": -20, "hip-thrust": -30, "hip-thrust-machine": -30,
  "kickback-machine": -30, "chest-press": -40, "face-pull": -30, "oiseau-machine": -40, "fente-arriere-barre": -40, "fente-avant-barre": -40, "squat-large-barre": -40,
  "step-up-barre": -40, "squat-serre-barre": -40, "squat-banc-barre": -40, "squat-saute-barre": -40, "squat-vitesse-barre": -40, "good-morning-assis": -40,
  "mollets-barre": -40, "squat-bulgare-barre": -40 };
for (const [id, w] of Object.entries(POIGNET)) for (const o of [EXERCICES[id], EXERCICES[id].erreur]) for (const k of (o && o.cles) || [])
  for (const c of ["G", "D"]) if (k.bras && k.bras[c]) k.bras[c].poignet = w;

/* Variantes pour l'appli : poses propres au mannequin femme (tête plus en arrière avec le chignon, poitrine plus large),
   et orientation des mains / poignet aussi sur ces poses-là (les tables ci-dessus ne lisent que ex.cles). */
for (const [id, f] of [["good-morning", k => { k.colonne.cou.flex = Math.max(k.colonne.cou.flex || 0, 14); }],
  ["rowing-debout", k => { for (const c of ["G", "D"]) k.bras[c].ik[2] += 3; }]])
  for (const o of [EXERCICES[id], EXERCICES[id].erreur]) o.clesFemme = o.cles.map(k => { const n = copie(k); f(n); return n; });
for (const id of ["pont-fessier-barre", "good-morning", "rowing-debout"]) for (const o of [EXERCICES[id], EXERCICES[id].erreur]) {
  if (!o?.clesFemme) continue;
  o.clesFemme.forEach((k, i) => { for (const c of ["G", "D"]) { const ref = o.cles[i]?.bras?.[c], b = k.bras?.[c]; if (!ref || !b) continue;
    for (const champ of ["paume", "poignet"]) if (ref[champ] !== undefined) b[champ] = copie(ref[champ]);
    if (ref.paume) { delete b.prono; delete b.main; delete b.auto; } } });
}

/* Recalage automatique (mannequin/outils/verifier.js --recaler [ids] homme|femme) : hauteur et inclinaison du corps, et appuis en
   cinématique inverse, ajustés image clé par image clé et pour chaque mannequin, afin que mains et pieds touchent leur surface
   sans la traverser. ex.cles (homme) et ex.clesFemme ; même chose dans ex.erreur. */
const recaler = (cles, corr) => cles.map((k, i) => {
  const c = corr && corr[i]; if (!c) return k;
  const n = copie(k);
  n.racine.p[1] += c.dy || 0;
  if (c.da) n.racine.r[c.axe] += c.da;
  for (const [chemin, d] of Object.entries(c.ik || {})) { const [a, b] = chemin.split("."); n[a][b].ik[1] += d; }
  return n;
});
/* Écarts (verifier.js --ecarter) : la main qui tient un haltère, une barre ou une poignée s'écarte juste assez pour que l'objet
   ne traverse pas le corps (cible IK en cm, ou abduction et flexion d'épaule en degrés). Propres à chaque exercice et mannequin. */
const ecarter = (cles, corr) => cles.map((k, i) => {
  const c = corr && corr[i]; if (!c || c.echec) return k;
  const n = copie(k);
  for (const [chemin, d] of Object.entries(c)) {
    const [a, b] = chemin.split("."), m = n[a][b];
    if (Array.isArray(d)) d.forEach((x, j) => { m.ik[j] += x; });
    else { m.fk.abd = (m.fk.abd || 0) + d.abd; m.fk.flex = (m.fk.flex || 0) + d.flex; }
  }
  return n;
});
const brut = import.meta.url.includes("brut"), sansEcart = brut || import.meta.url.includes("sans-ecart");
for (const [id, ex] of Object.entries(EXERCICES)) for (const [variante, o] of [["normal", ex], ["erreur", ex.erreur]]) {
  if (!o || !o.cles) continue;
  const base = o.cles, baseF = o.clesFemme || base;     // clesFemme écrites à la main : propres au mannequin femme
  const r = ex.recalageDe || id;          // variante avec poids (squat-barre) : mêmes appuis que l'exercice d'origine
  o.cles = brut ? base : recaler(base, RECALAGE.homme?.[r]?.[variante]);
  o.clesFemme = brut ? baseF : recaler(baseF, (RECALAGE.femme?.[r] || RECALAGE.homme?.[r])?.[variante]);
  if (!sansEcart) { o.cles = ecarter(o.cles, ECARTS.homme?.[id]?.[variante]); o.clesFemme = ecarter(o.clesFemme, ECARTS.femme?.[id]?.[variante]); }
}
