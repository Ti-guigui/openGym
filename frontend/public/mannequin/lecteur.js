/* L'Atelier : lecteurs d'exercices animés. Balisage : <figure class="mq" data-ex="squat"><img class="mq-poster" …></figure>
   Un seul rendu WebGL pour toute la page : il se place dans le lecteur le plus visible ; les autres montrent leur image fixe.
   Sans WebGL ou sans JavaScript, l'image fixe reste. */
import * as THREE from "./three.module.min.js";
import { creerCorps, poser, colorer, allumer, accessoire, suivreAccessoires, poseA, NOMS_MUSCLES, MODELES, chargerAthletes } from "./corps.js";
import { EXERCICES } from "./exercices.js";
await chargerAthletes();

const VUES = { face: 0, "3/4": 35, profil: 90, dos: 180 };
let rendu = null, scene, camera, corps, groupeAcc, actif = null, horloge = new THREE.Clock();
/* Corps homme ou femme : choix gardé d'une page à l'autre (simple confort, sans conséquence s'il se perd). */
let genre = "homme";
try { if (localStorage.getItem("mq:genre") === "femme") genre = "femme"; } catch (e) { }
const libelleGenre = () => genre === "homme" ? "♀ Femme" : "♂ Homme";
function changerGenre() {
  genre = genre === "homme" ? "femme" : "homme";
  try { localStorage.setItem("mq:genre", genre); } catch (e) { }
  scene.remove(corps.racine); corps = creerCorps(genre); scene.add(corps.racine);
  if (actif) { appliquerCouleurs(actif); actif.courbes = null; }
  for (const l of lecteurs) if (l.btnGenre) l.btnGenre.textContent = libelleGenre();
}

function initGL() {
  if (rendu) return true;
  try {
    rendu = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  } catch (e) { return false; }
  rendu.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  rendu.outputColorSpace = THREE.SRGBColorSpace;
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(30, 1, 10, 3000);
  // éclairage de planche d'anatomie : lumière douce de face, et une lumière froide de contour qui détache le corps du fond sombre
  scene.add(new THREE.HemisphereLight(0xdfe7f5, 0x23272f, 0.85));
  const d = new THREE.DirectionalLight(0xfff4e8, 1.9); d.position.set(170, 320, 240); scene.add(d);      // lumière principale, rasante : elle dessine le relief
  const d3 = new THREE.DirectionalLight(0xcfdcff, 0.7); d3.position.set(-260, 70, 200); scene.add(d3);   // débouchage de l'autre côté
  const d2 = new THREE.DirectionalLight(0xb8ccff, 1.6); d2.position.set(-200, 180, -280); scene.add(d2); // contre-jour
  // ombre douce au sol
  const c = document.createElement("canvas"); c.width = c.height = 128;
  const x = c.getContext("2d"), gr = x.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, "rgba(0,0,0,.45)"); gr.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = gr; x.fillRect(0, 0, 128, 128);
  const ombre = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
  ombre.rotation.x = -Math.PI / 2; ombre.position.y = 0.2; ombre.name = "ombre"; scene.add(ombre);
  corps = creerCorps(genre); scene.add(corps.racine);
  groupeAcc = new THREE.Group(); scene.add(groupeAcc);
  rendu.setAnimationLoop(boucle);
  return true;
}

function cadrer(l) {
  const ex = l.ex, cam = ex.camera || {};
  const cible = new THREE.Vector3(...(cam.cible || [0, 90, 0]));
  const az = (l.az) * Math.PI / 180, el = (cam.el ?? 8) * Math.PI / 180, dist = (cam.dist || 420) * 0.92;
  camera.position.set(cible.x + dist * Math.sin(az) * Math.cos(el), cible.y + dist * Math.sin(el), cible.z + dist * Math.cos(az) * Math.cos(el));
  camera.lookAt(cible);
  const o = scene.getObjectByName("ombre");
  const t = ex.ombre || [0, 0, 120, 120];
  o.position.x = t[0]; o.position.z = t[1]; o.scale.set(t[2], t[3], 1);
}

function preparerScene(l) {
  groupeAcc.clear();
  for (const a of l.ex.accessoires || []) groupeAcc.add(accessoire(a.type, a));
  appliquerCouleurs(l);
}
function appliquerCouleurs(l) {
  const m = l.ex.muscles;
  colorer(corps, m.p, m.s, l.erreur ? (l.ex.erreur.zone || []) : []);
}

/* Effort : chaque muscle s'allume avec le déplacement des articulations qu'il commande, de son côté (0 = position de départ,
   1 = amplitude maximale de la répétition). Sans mouvement (gainage), il tient une intensité constante. Calculé une fois par exercice. */
const ARTIC = { quadriceps: ["genou"], ischios: ["hanche", "genou"], fessiers: ["hanche"], adducteurs: ["hanche"], flechisseurs: ["hanche"],
  mollets: ["cheville"], tibial: ["cheville"], deltoides: ["epaule"], pectoraux: ["epaule", "coude"], dorsaux: ["epaule", "coude"], trapezes: ["epaule"],
  biceps: ["coude"], triceps: ["coude"], "avant-bras": ["coude", "poignet"], abdominaux: ["lomb", "thorax", "hanche"], obliques: ["lomb", "thorax", "hanche"], lombaires: ["lomb", "thorax", "hanche"] };
const JAMBE = new Set(["quadriceps", "ischios", "fessiers", "adducteurs", "flechisseurs", "mollets", "tibial"]);
const N_EFFORT = 32, MIN_AMPLITUDE = 6 * Math.PI / 180;
function courbesEffort(l) {
  const o = l.erreur && l.ex.erreur ? l.ex.erreur : l.ex, cles = genre === "femme" && o.clesFemme ? o.clesFemme : o.cles;
  const m = l.ex.muscles, zone = l.erreur ? (l.ex.erreur.zone || []) : [], noms = [...new Set([...m.p, ...m.s, ...zone])];
  const art = {};                                        // articulation -> angle par rapport à la position de départ, sur un tour
  const lire = n => corps.os[n].quaternion.clone();
  const reperes = {};
  for (let i = 0; i < N_EFFORT; i++) {
    poser(corps, poseA(cles, (l.ex.depart || 0) + i / N_EFFORT));
    for (const a of new Set(noms.flatMap(n => ARTIC[n] || []))) for (const c of ["lomb", "thorax"].includes(a) ? [""] : ["G", "D"]) {
      const k = a + c; if (!i) { reperes[k] = lire(k); art[k] = []; }
      art[k].push(lire(k).angleTo(reperes[k]));
    }
  }
  const norm = {};
  for (const k in art) { const max = Math.max(...art[k]); norm[k] = max < MIN_AMPLITUDE ? null : art[k].map(v => v / max); }
  const courbes = {};
  for (const n of noms) {
    const pour = c => {
      const liste = (ARTIC[n] || []).map(a => norm[a + (["lomb", "thorax"].includes(a) ? "" : c)]).filter(Boolean);
      return liste.length ? Array.from({ length: N_EFFORT }, (_, i) => Math.max(...liste.map(x => x[i]))) : null;
    };
    courbes[n] = { G: pour("G"), D: pour("D"), secondaire: !m.p.includes(n) && !zone.includes(n) };
  }
  return courbes;
}
const lireCourbe = (c, u) => { const x = u * N_EFFORT, i = Math.floor(x) % N_EFFORT, t = x - Math.floor(x); return c[i] * (1 - t) + c[(i + 1) % N_EFFORT] * t; };
function majEffort(l) {
  if (!l.courbes) { l.courbes = courbesEffort(l); }
  const u = ((l.u - (l.ex.depart || 0)) % 1 + 1) % 1;
  // l'intensité monte aussi au fil de la série : les premières répétitions restent plus sombres
  const nc = l.ex.cycle || 1, serie = Math.min(1, (l.reps + (u * nc) % 1) / 3), chauffe = l.demarre ? 0.68 + 0.32 * serie : 1;
  for (const [n, c] of Object.entries(l.courbes)) {
    const val = (co, cote) => {
      if (!l.demarre) return c.secondaire ? 0.62 : 1;     // image fixe, ou lecture pas encore lancée : les muscles restent visibles
      let e = co ? 0.1 + 0.9 * lireCourbe(co, u) : 0.8;
      // jambes alternées : la jambe avant porte l'effort (la gauche pendant la première moitié du tour)
      if (l.ex.alterne && JAMBE.has(n) && (cote === "G") !== (u < 0.5)) e *= 0.28;
      return e * chauffe * (c.secondaire ? 0.62 : 1);
    };
    allumer(corps, n, val(c.G, "G"), val(c.D, "D"));
  }
}

function boucle() {
  if (!actif) return;
  const l = actif, dt = Math.min(0.1, horloge.getDelta());
  const nc = l.ex.cycle || 1, avant = Math.floor(l.u * nc);         // cycle : répétitions par tour d'animation (jambes alternées)
  if (l.lecture) { l.u += dt * l.vitesse / (l.ex.duree || 3); l.demarre = true; }
  if (Math.floor(l.u * nc) > avant) { l.reps++; majCompteur(l); }
  if (l.u >= 1) l.u -= 1;
  const o = l.erreur && l.ex.erreur ? l.ex.erreur : l.ex, cles = genre === "femme" && o.clesFemme ? o.clesFemme : o.cles;
  const p = poseA(cles, l.u);
  // respiration : le thorax bouge d'un degré, un souffle toutes les 4 s (copie : ne pas modifier l'image clé)
  if (p.colonne) p.colonne = { ...p.colonne, thorax: { ...(p.colonne.thorax || {}), flex: ((p.colonne.thorax || {}).flex || 0) + 1.2 * Math.sin(performance.now() / 4000 * 2 * Math.PI) } };
  majEffort(l);                 // avant poser() : le calcul des courbes déplace le corps
  poser(corps, p);
  suivreAccessoires(corps, groupeAcc);
  majPhase(l);
  const w = l.scene.clientWidth, h = l.scene.clientHeight;
  if (rendu.domElement.width !== Math.round(w * rendu.getPixelRatio()) || rendu.domElement.height !== Math.round(h * rendu.getPixelRatio())) {
    rendu.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  cadrer(l);
  rendu.render(scene, camera);
}

function majPhase(l) {
  const ph = (l.erreur && l.ex.erreur && l.ex.erreur.tempo) || l.ex.tempo || [];
  let txt = "";
  for (const [t, label] of ph) if (l.u >= t) txt = label;
  if (l.tempoAffiche && txt !== l._phase) {
    l._phase = txt;
    l.phase.textContent = txt;
  }
}
function majCompteur(l) {
  const n = l.ex.reps || 10, k = ((l.reps - 1) % n) + 1;
  l.compteur.textContent = l.reps ? (k === n ? "Série de " + n + " terminée" : "Rép. " + k + " / " + n) : "Rép. 0 / " + n;
}

function activer(l) {
  if (actif === l) return;
  if (actif) { actif.scene.classList.remove("on"); }
  if (!initGL()) { l.fig.classList.add("sans-3d"); return; }
  actif = l;
  l.scene.appendChild(rendu.domElement);
  l.scene.classList.add("on");
  preparerScene(l);
  l.courbes = null;             // un seul corps pour toute la page : les courbes sont recalculées pour celui-ci
  horloge.getDelta();
}

/* Construction d'un lecteur */
function construire(fig) {
  const ex = EXERCICES[fig.dataset.ex];
  if (!ex) return null;
  const l = { fig, ex, u: ex.depart || 0, vitesse: 1, lecture: !matchMedia("(prefers-reduced-motion: reduce)").matches, erreur: false, reps: 0, az: VUES[ex.vue || "3/4"], tempoAffiche: true };
  fig.classList.add("mq-pret");
  const poster = fig.querySelector(".mq-poster");
  l.scene = document.createElement("div"); l.scene.className = "mq-scene";
  if (poster) { fig.insertBefore(l.scene, poster); l.scene.appendChild(poster); } else fig.prepend(l.scene);
  // consigne et compteur sous l'image : ils ne cachent jamais le mannequin
  const info = document.createElement("div"); info.className = "mq-info";
  l.phase = document.createElement("p"); l.phase.className = "mq-phase"; l.phase.setAttribute("aria-live", "off"); info.appendChild(l.phase);
  l.compteur = document.createElement("p"); l.compteur.className = "mq-compteur"; info.appendChild(l.compteur);
  majCompteur(l);
  l.phase.textContent = (ex.tempo && ex.tempo[0] && ex.tempo[0][1]) || "";
  const barre = document.createElement("div"); barre.className = "mq-ctrl";
  const bouton = (txt, titre, fn, cls) => { const b = document.createElement("button"); b.type = "button"; b.textContent = txt; b.title = titre; b.setAttribute("aria-label", titre); if (cls) b.className = cls; b.addEventListener("click", () => { activer(l); fn(b); }); barre.appendChild(b); return b; };
  // « Réduire les animations » activé : on attend un geste du lecteur ; le bouton de lecture le dit en toutes lettres
  bouton(l.lecture ? "❚❚" : "▶ Lancer", "Lecture ou pause", b => { l.lecture = !l.lecture; b.textContent = l.lecture ? "❚❚" : "▶"; }, "mq-lire");
  const vit = bouton("× 1", "Vitesse", b => { l.vitesse = l.vitesse === 1 ? 0.5 : 1; b.textContent = l.vitesse === 1 ? "× 1" : "× 0,5"; });
  bouton("⟲", "Recommencer la série", () => { l.u = ex.depart || 0; l.reps = 0; majCompteur(l); });
  if (MODELES.femme) l.btnGenre = bouton(libelleGenre(), "Changer de mannequin (homme ou femme)", () => changerGenre(), "mq-genre");
  const sel = document.createElement("span"); sel.className = "mq-vues"; barre.appendChild(sel);
  for (const v of Object.keys(VUES)) {
    const b = document.createElement("button"); b.type = "button"; b.textContent = v === "3/4" ? "3/4" : v[0].toUpperCase() + v.slice(1);
    b.setAttribute("aria-pressed", VUES[v] === l.az ? "true" : "false"); b.title = "Vue " + v;
    b.addEventListener("click", () => { activer(l); l.az = VUES[v]; sel.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", x === b ? "true" : "false")); });
    sel.appendChild(b);
  }
  if (ex.erreur) {
    l.btnErreur = bouton("⚠ Voir l'erreur", "Montrer l'erreur fréquente", b => {
      l.erreur = !l.erreur; b.setAttribute("aria-pressed", l.erreur ? "true" : "false");
      b.textContent = l.erreur ? "✓ Version correcte" : "⚠ Voir l'erreur";
      fig.classList.toggle("mq-en-erreur", l.erreur);
      l.legendeErreur.hidden = !l.erreur; l._phase = null; l.courbes = null;
      if (actif === l) appliquerCouleurs(l);
    }, "mq-err");
    l.btnErreur.setAttribute("aria-pressed", "false");
  }
  l.scene.after(info); info.after(barre);
  // muscles
  const mus = document.createElement("p"); mus.className = "mq-muscles";
  const puce = (nom, cls) => { const s = document.createElement("span"); s.className = cls; s.textContent = NOMS_MUSCLES[nom] || nom; mus.appendChild(s); };
  ex.muscles.p.forEach(n => puce(n, "p")); ex.muscles.s.forEach(n => puce(n, "s"));
  barre.after(mus);
  l.legendeErreur = document.createElement("p"); l.legendeErreur.className = "mq-legende-err"; l.legendeErreur.hidden = true;
  l.legendeErreur.textContent = ex.erreur ? "Erreur : " + ex.erreur.texte : "";
  mus.after(l.legendeErreur);
  // rotation au doigt ou à la souris
  let x0 = null;
  l.scene.addEventListener("pointerdown", e => { if (e.target.closest("button")) return; activer(l); x0 = e.clientX; l.scene.setPointerCapture(e.pointerId); });
  l.scene.addEventListener("pointermove", e => { if (x0 === null) return; l.az -= (e.clientX - x0) * 0.6; x0 = e.clientX; sel.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", "false")); });
  const fin = () => { x0 = null; };
  l.scene.addEventListener("pointerup", fin); l.scene.addEventListener("pointercancel", fin);
  return l;
}

const lecteurs = [], vis = new Map();
const io = "IntersectionObserver" in window ? new IntersectionObserver(es => {
  for (const e of es) vis.set(e.target, e.intersectionRatio);
  let best = null, r = 0.45;
  for (const l of lecteurs) { const v = vis.get(l.fig) || 0; if (v > r && l.fig.isConnected) { r = v; best = l; } }
  if (best) activer(best);
}, { threshold: [0, 0.25, 0.45, 0.6, 0.8, 1] }) : null;
/* Branche un lecteur sur une figure ajoutée après le chargement (pages qui fabriquent leurs fiches en JavaScript). */
export function brancher(fig) {
  if (fig.classList.contains("mq-pret")) return null;
  const l = construire(fig); if (!l) return null;
  for (let i = lecteurs.length - 1; i >= 0; i--) if (!lecteurs[i].fig.isConnected) { io?.unobserve(lecteurs[i].fig); vis.delete(lecteurs[i].fig); lecteurs.splice(i, 1); }
  lecteurs.push(l); io?.observe(fig);
  return l;
}
document.querySelectorAll("figure.mq[data-ex]").forEach(brancher);
document.addEventListener("visibilitychange", () => { horloge.getDelta(); });

/* Mode atelier : ?mq-studio=<id>&u=0.4&az=35 rend une image fixe (pour fabriquer les images de secours). */
const q = new URLSearchParams(location.search);
if (q.get("mq-studio")) {
  const l = lecteurs.find(x => x.fig.dataset.ex === q.get("mq-studio"));
  if (l) {
    l.lecture = false; l.u = +(q.get("u") || l.ex.affiche || 0.4); if (q.get("az")) l.az = +q.get("az");
    l.tempoAffiche = false; l.phase.textContent = ""; l.compteur.hidden = true;
    activer(l);
    window.__mqPret = true;
  }
}
window.__mqLecteurs = lecteurs;
