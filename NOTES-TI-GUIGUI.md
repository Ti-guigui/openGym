# Notes Ti Guigui FIT

Ce fichier sert de mémoire entre les conversations avec Claude. Au début d'une nouvelle
conversation, dis simplement : « lis NOTES-TI-GUIGUI.md dans mon fork ».

## L'appli

- **Nom :** Ti Guigui FIT (nom court sur l'écran d'accueil du téléphone : TG FIT)
- **Couleur principale :** violet (`#bf5af2`, le préréglage « violet » de l'appli)
- **Base :** fork de [openGym](https://github.com/DuarteSantos8/openGym), sous licence AGPL-3.0
- **Fork :** https://github.com/Ti-guigui/openGym, branche `main`
- **Utilisation :** sous Windows, avec Docker Desktop, sur http://localhost:8080
- **Sur téléphone (hors ligne) :** https://ti-guigui-fit.pages.dev, à ajouter à l'écran d'accueil. Mode invité seulement (pas de serveur derrière) : les données restent sur le téléphone, sans synchro avec le PC.

## Ce qui a été modifié par rapport à openGym

1. **Le nom.** `frontend/src/lib/brand.js` remplace « openGym » par le nom de l'appli au moment
   de l'affichage, via `t()` dans `frontend/src/lib/i18n-core.js`. Les fichiers de traduction ne
   sont donc pas touchés. Les liens, les identifiants et la mention de licence ne sont jamais
   modifiés. Pendant les tests, le nom reste « openGym » (`VITE_APP_NAME` dans
   `frontend/vite.config.js`).
   Autres fichiers renommés : `frontend/index.html`, `frontend/public/manifest.json`,
   `frontend/src/components/BrandLogo.jsx` (logo « Ti Guigui FIT »),
   `frontend/src/views/Settings.jsx` (ligne de version, avec « based on openGym ») et
   `frontend/src/components/LiveGlance.jsx`.
2. **Le violet.** `NEW_ACCENT` et `DEFAULT_ACCENT` dans `frontend/src/lib/accent.js`,
   `accent: 'violet'` dans `frontend/src/store/useStore.js`, le logo dans
   `frontend/src/index.css` (`.brand-lockup-*`), plus les tests qui vérifient la couleur.
3. **La carte Calories** (Stats → Plus → Outils) :
   - le calcul est dans `frontend/src/lib/calculators.js` (`bmrMifflin`, `calorieNeeds`,
     `ACTIVITY`), avec ses tests dans `calculators.test.js` ;
   - la carte est dans `frontend/src/views/Tools.jsx` (`CaloriesCard`), avec son style dans
     `frontend/src/index.css` (`.tools-kcal-*`) ;
   - les textes sont traduits dans les 25 fichiers de `frontend/src/locales/`. Pour le
     portugais du Brésil, ils sont dans `PT_BR_OVERRIDES` de `pt-BR.js`.
4. **La carte Eau** (Accueil, sous le poids, avec le module Corps) :
   - les verres par jour sont dans `S.water = { 'AAAA-MM-JJ': { n, _ts } }`, lus et écrits par
     `frontend/src/lib/water.js` (tests dans `water.test.js`). Verres de 250 ml ;
   - l'objectif est `S.waterGoal` (1 à 20 verres, vide = 8), réglable avec le bouton cible de la
     carte ; c'est un réglage simple, synchronisé comme les autres ;
   - la synchro jour par jour passe par `STAMPED_MAPS` et `OWN_MERGE`, dans
     `frontend/src/lib/sync-merge.js` **et** `api/sync-stamps.js` (les deux listes doivent rester
     identiques) ;
   - la carte est `frontend/src/components/WaterCard.jsx`, l'icône `drop` est dans `Icon.jsx`,
     le style dans `frontend/src/index.css` (`.water-*`), les textes dans les 25 langues.
5. **La carte Compléments** (Accueil, sous l'eau, avec le module Corps) :
   - la liste fixe (créatine, whey, vitamine D, oméga-3, magnésium, multivitamines) est `SUPPS`
     dans `frontend/src/lib/supps.js`, avec les tests dans `supps.test.js` ;
   - `S.suppList` = ceux qu'on prend (réglage simple), `S.supps = { 'AAAA-MM-JJ': { ids, _ts } }`
     = ce qui a été pris, synchronisé jour par jour comme l'eau (mêmes deux listes) ;
   - la série compte les jours d'affilée ; pas encore pris aujourd'hui, elle part d'hier ;
   - la carte est `frontend/src/components/SuppsCard.jsx` (crayon pour choisir), l'icône `pill`
     dans `Icon.jsx`, le style `.supps-*` / `.supp-run` dans `index.css`.
6. **La citation du jour** (Accueil, sous la carte du jour, avec le module Motivation) :
   - 20 phrases écrites pour l'appli (pas de citations de célébrités, donc rien à attribuer),
     dans `QUOTES` de `frontend/src/lib/quotes.js`, tests dans `quotes.test.js` ;
   - la phrase dépend seulement de la date : la même toute la journée, sur tous les appareils,
     et les 20 passent avant qu'une revienne. Rien n'est enregistré ni synchronisé ;
   - la carte est directement dans `frontend/src/views/Home.jsx` (`quote-card`), les 21 textes
     sont traduits dans les 25 langues. Pour ajouter une phrase : l'ajouter dans `QUOTES` puis
     dans les 25 fichiers de langue.
7. **Docker.** `docker-compose.yml` construit des images locales (`tiguiguifit-*`) au lieu de
   télécharger celles d'openGym.
8. **Mannequin 3D de L'Atelier.** Le lecteur 3D du site (dépôt `atelier`, dossier `mannequin/`)
   est copié dans `frontend/public/mannequin/` :
   - 66 exercices animés en 3D, reliés aux exercices du catalogue dans
     `frontend/src/lib/mannequin3d.js` (test : `mannequin3d.test.js`) ;
   - affichage : `frontend/src/components/Mannequin3D.jsx`, branché dans `Media.jsx`. Bouton
     « Voir en 2D / Voir en 3D » (choix gardé sur l'appareil, clé `mq:2d`). Les petites vues
     (superséries, animation réduite) gardent l'animation 2D ;
   - après une modification des animations sur le site : `cd frontend; node scripts/sync-mannequin.mjs`
     (le dépôt `atelier` doit être à côté d'`openGym`), puis reconstruire et republier ;
   - les textes du lecteur sont en français seulement ; crédits (Z-Anatomy, CMU, three.js) dans `NOTICE.md`.

9. **Nutrition** (Accueil → carte Nutrition, ou Stats → Nutrition ; module Corps) :
   - calculs dans `frontend/src/lib/nutrition.js` (tests `nutrition.test.js`) : besoin du jour
     (Mifflin-St Jeor × activité), déficit = rythme × 7 700 / 7 kcal par jour (gain : la moitié),
     jamais sous 1 500 kcal (homme) / 1 200 kcal (femme) ni sous le métabolisme de repos ; macros
     (protéines 2 g/kg en perte, 1,8 sinon ; lipides 0,9 g/kg ; glucides le reste) ; date estimée
     pour le poids visé (`S.targetW`, le même que la carte Poids) ;
   - réglages : `S.nutrition = { goal, rate, activity }` et `S.kcalWeekGoal` (objectif de calories
     brûlées par semaine), synchronisés comme les autres réglages ;
   - calories brûlées par semaine : estimées depuis les séances (`activeKcal` de `active-energy.js`) ;
   - « Quoi manger » et « Idées repas » : `frontend/src/lib/food-ideas.js` (tests
     `food-ideas.test.js`), textes en **français et anglais seulement** (les autres langues lisent
     l'anglais), comme le mannequin 3D. Pour ajouter un repas : une ligne dans `MEALS` ;
   - écran `frontend/src/views/Nutrition.jsx`, carte `frontend/src/components/NutritionCard.jsx`,
     style `.nut-*` dans `index.css`, icônes `utensils` et `leaf` dans `Icon.jsx`.
10. **Mannequin des mensurations** (Stats → Mensurations) : `frontend/src/components/MeasureFigure.jsx`.
    - Profil homme : ton image du mannequin, recadrée sur le corps, dans
      `frontend/public/mensurations-homme.webp` (448 × 1072). Retouches : logo de marque du short
      effacé, bande du haut du bras droit recolorée en mauve (comme le bras gauche ; la ligne de la
      poitrine reste verte). Les ronds de couleur font partie de l'image : les points cliquables
      (`PHOTO.spots`) sont posés dessus, seuls ceux qui manquent (abdomen, poignets, chevilles, haut du
      bras gauche) sont dessinés. Pour changer d'image : garder les ronds aux mêmes endroits, ou
      recaler `PHOTO.spots` (coordonnées en pixels de l'image).
    - Profil femme : le corps des cartes musculaires (`lib/body-geometry.js`), points dessinés (`SPOTS.female`).
    - À côté, la liste : pastille de la même couleur (bras mauve, tronc vert, jambes jaune : `COLOR`),
      nom et dernière valeur. Toucher un point ou une ligne affiche la courbe ; un tour jamais noté
      ouvre la saisie. Bouton **Choisir** : tous les tours apparaissent, toucher active ou désactive.
      Tests : `MeasureFigure.test.js`. Style `.mfig-*`.
11. **Partager une séance avec un collègue** : le bouton « Partager avec un ami » (dans une routine,
    ou dans le détail d'une séance terminée) crée maintenant un lien
    `https://ti-guigui-fit.pages.dev/#/r/…` (avant : opengym.ch). Le collègue l'ouvre sur son
    téléphone, entre dans l'appli (compte ou invité) et ajoute la séance à ses routines.
    Code : `linkFor` dans `frontend/src/lib/routine-link.js`.
12. **Coach IA** (version téléphone Cloudflare seulement, avec un compte) :
    - serveur : routes `/api/ai/status` et `/api/ai/chat` dans `functions/api/[[path]].js`, requête
      au modèle dans `functions/lib/ai-coach.js` (tests `api/test/ai-coach.test.js`) ; compteur du
      jour dans la table D1 `ai_usage` (`migrations/0003_coach_ia.sql`). Les questions ne sont pas
      gardées sur le serveur ;
    - appli : écran `frontend/src/views/CoachIA.jsx` (carte « Coach IA » sur l'Accueil), résumé des
      données envoyé avec chaque question dans `frontend/src/lib/coach-ia.js`, conversation gardée
      dans le téléphone ;
    - **modèle : Cloudflare Workers AI** (depuis le 25/11/2026), branché par `[ai] binding = "AI"`
      dans `wrangler.toml` : aucune clé, gratuit jusqu'à 10 000 « neurons » par jour pour tout le
      compte Cloudflare (environ quelques dizaines de questions ; au-delà, l'écran dit « plus de
      questions pour aujourd'hui »). Modèle : `WORKERS_MODEL` dans `functions/lib/ai-coach.js`
      (Llama 3.3 70B). Mise en route : seulement la migration D1 (`npx wrangler d1 migrations apply
      ti-guigui-fit --remote`) puis un déploiement ;
    - **revenir à Claude** (payant, meilleures réponses) : poser `AI_PROVIDER` = `anthropic` et la clé
      `ANTHROPIC_API_KEY` comme secrets Pages, puis redéployer. La clé se crée sur
      https://platform.claude.com/settings/keys et il faut des crédits (Plans & Billing). La poser
      dans sa propre fenêtre PowerShell, sans passer par le presse-papiers déjà utilisé pour la
      commande :
      ```powershell
      cd "$HOME\openGym"
      $k = (Read-Host "Clé").Trim()   # coller la clé ici
      $k | npx.cmd wrangler pages secret put ANTHROPIC_API_KEY --project-name ti-guigui-fit
      "anthropic" | npx.cmd wrangler pages secret put AI_PROVIDER --project-name ti-guigui-fit
      ```
      (`npx.cmd`, car `npx` y est bloqué ; jamais avec `!` dans Claude Code, qui enregistre une
      valeur vide.) `AI_MODEL` choisit le modèle Claude (`claude-haiku-5-5` posé le 25/11/2026) ;
    - `AI_DAILY` = questions par personne et par jour (20 par défaut), posé lui aussi comme secret
      (avec `wrangler.toml` présent, le tableau de bord Cloudflare ne laisse pas modifier les
      variables). Tout changement de secret ne compte qu'au déploiement suivant ; vérifier ensuite
      https://ti-guigui-fit.pages.dev/api/ai/status (`"available":true` et `"provider"`) ;
    - en cas de refus, la raison est dans les journaux : `npx wrangler pages deployment tail <adresse
      du déploiement> --project-name ti-guigui-fit` (lignes `ai workers` ou `ai upstream`) ;
    - la politique de confidentialité dit à qui partent les questions (Cloudflare, ou Anthropic si
      Claude est choisi), et l'écran du coach aussi.

13. **Séance guidée** (comme sur la montre) : `frontend/src/components/GuidedPlayer.jsx`, en plein
    écran, une série à la fois : animation de l'exercice, répétitions et poids réglables avec un grand
    bouton Terminé, ou chrono pour un exercice tenu (gainage…), puis le repos en compte à rebours avec
    l'exercice suivant. S'ouvre avec « Séance guidée » dans l'aperçu de séance ou en haut de la séance
    en cours (et dans le menu ⋯). L'ordre des séries (superséries comprises) est dans `lib/guided.js`
    (tests `guided.test.js`) ; valider une série, les chronos et le repos passent par le code normal de
    `views/Workout.jsx` (records, temps de repos, fin de séance identiques). Style `.gp-*` (repris du
    lecteur de circuit `.cp-*`).
14. **Aperçu de séance avec les zones travaillées** : choisir une séance ouvre l'aperçu
    (`components/StartSheets.jsx`, activé par défaut dans Ti Guigui FIT, désactivable dans Réglages →
    Séance → Aperçu avant de démarrer ; règle dans `lib/preview-start.js`) avec le grand mannequin
    avant/arrière des muscles travaillés et leurs noms, puis « Séance guidée » ou « Démarrer ».

15. **Passe « unslop » et mouvement** (méthode unslop de Damir Sokolovsky, CC BY 4.0 ; règles de
    mouvement de fortix.fr) :
    - direction : la salle de muscu (fonte, craie, chrono mural, mètre ruban). Deux moments en couleur :
      le chiffre du jour et le chrono de la séance guidée, puis le mannequin. Signature : les pointillés
      du mètre ruban (mannequin, ligne d'objectif des graphiques) ;
    - Nutrition : en-têtes en pastilles grises, couleur gardée pour les protéines et la semaine en cours,
      « 30 g P » devenu « 30 g protéines », plus d'icône répétée devant les repas ;
    - plus d'étincelles pour l'IA : le Coach IA a une bulle de discussion, la citation du jour une note ;
    - un seul mouvement par écran, sans librairie : le chiffre des calories et les reps/poids de la
      séance guidée roulent (`components/RollingNumber.jsx`, `lib/tween.js` + tests), l'anneau du chrono
      avance en douceur, le point choisi du mannequin apparaît. Rien ne bouge avec « Réduire les
      animations » ;
    - correction openGym : la bannière « Défi réussi » s'affichait parfois en anglais.

16. **Balance des mensurations** : au-dessus de la liste, à côté du mannequin, la carte « Poids »
    (dernière pesée, crayon pour noter) et la balance de ton image (`frontend/public/balance.webp`),
    dont l'écran affiche le même poids en perspective (`frontend/src/components/ScaleCard.jsx`,
    réglage de l'écran dans `LCD`). Elle remplace la balance dessinée en vectoriel ; la règle de
    taille reste à côté du corps. Toucher la carte ou la balance ouvre la pesée. Style `.scale-*`.

## Règles à respecter

- **Mention de licence Gym visual :** la garder mot pour mot, ainsi que `NOTICE.md`. Ne jamais
  ajouter, remplacer ni agrandir les fichiers de `catalogue/media/`. Pour une appli payante,
  il faudrait une licence à soi auprès de Gym visual.
- Lire `CLAUDE.md` avant de modifier le code.
- Chaque nouveau texte affiché doit être ajouté dans les 25 fichiers de langue.
- Pas de nouvelle dépendance npm si on peut l'éviter.
- Avant d'envoyer des modifications sur GitHub, vérifier, depuis `frontend/` :
  ```
  npx vitest run
  node scripts/check-locales.mjs
  node scripts/check-source-strings.mjs --strict
  npm run build && node scripts/check-bundle-syntax.mjs
  ```

## Version utilisée (depuis le 23/11/2026)

L'appli s'utilise sur **https://ti-guigui-fit.pages.dev** (Cloudflare Pages) : tous les téléphones, partout, même hors connexion.
Comptes (depuis le 23/11/2026) : un surnom et un mot de passe, rien d'autre (pas d'e-mail). Le petit serveur est dans `functions/api/[[path]].js`, les comptes et les séances dans la base Cloudflare D1 `ti-guigui-fit` (tables dans `migrations/`). On retrouve ses séances sur n'importe quel téléphone. Le mode invité existe toujours (données gardées sur le téléphone).
Ce que ce serveur ne fait pas : passkeys, e-mail, montre, notifications push, le coach d'openGym (mais il a son propre Coach IA, voir le point 12). Le mot de passe se change dans Réglages → Compte. Politique de confidentialité : `frontend/public/confidentialite.html` (https://ti-guigui-fit.pages.dev/confidentialite), sans aucun nom ; à mettre à jour si on ajoute un service ou une donnée. 10 mauvais mots de passe d'affilée bloquent le compte 15 minutes.
Administration (Réglages → Compte → Tableau d'administration, réservé aux comptes admin) : liste des comptes et code de réinitialisation (une fois, 24 h) pour un mot de passe oublié. La personne le saisit via « Se connecter avec un mot de passe » → « Tu as un code de réinitialisation… ». Le compte « Ti Guigui » est admin. Rendre un autre compte admin :
`npx wrangler d1 execute ti-guigui-fit --remote --command "UPDATE users SET admin = 1 WHERE name_key = 'pseudo en minuscules'"`

- **Mise en place, une seule fois :**

  ```powershell
  cd "$HOME\openGym"
  npx wrangler d1 create ti-guigui-fit          # recopier le "database_id" affiché dans wrangler.toml
  npx wrangler d1 migrations apply ti-guigui-fit --remote
  ```

- **Tester en local :** `npx wrangler d1 migrations apply ti-guigui-fit --local` une fois, puis `npx wrangler pages dev --port 8788` après `npm run build:pages`, et ouvrir http://localhost:8788.
La version Docker du PC est arrêtée (`docker compose down`) ; le dossier `data` reste en sauvegarde. Pour la relancer : `docker compose up -d`.

## Commandes Windows (PowerShell)

Docker Desktop doit être ouvert, avec « Engine running » affiché.

```powershell
cd "$HOME\openGym"
git pull                      # récupérer les dernières modifications
docker compose up -d --build  # construire et lancer l'appli
docker compose down           # arrêter l'appli
```

- **Sauvegarde :** copier le dossier `C:\Users\Ti Guigui\openGym\data`.
- **Si la nouvelle version ne s'affiche pas :** faire Ctrl+F5 dans le navigateur.
- **Mettre à jour la version téléphone** (Cloudflare Pages, projet `ti-guigui-fit`) :

  ```powershell
  cd "$HOME\openGym\frontend"; npm run build:pages; cd ..
  node scripts/catalogue/stage-media.mjs frontend/dist
  npx wrangler pages deploy frontend/dist --project-name ti-guigui-fit --branch main --commit-dirty=true --force
  ```

  `--force` est nécessaire : sans lui, wrangler essaie de transformer le projet Pages en Worker et échoue.
  La dernière commande se lance depuis `openGym` (pas `frontend`) : c'est là qu'elle trouve `functions/` (le serveur des comptes) et `wrangler.toml` (la base D1).

## Idées pour la suite (pas encore faites)

- Ajouter ses propres compléments (aujourd'hui une liste fixe de 6)
