# Notes Ti Guigui FIT

Ce fichier sert de mémoire entre les conversations avec Claude. Au début d'une nouvelle
conversation, dis simplement : « lis NOTES-TI-GUIGUI.md dans mon fork ».

## L'appli

- **Nom :** Ti Guigui FIT (nom court sur l'écran d'accueil du téléphone : TG FIT)
- **Couleur principale :** violet (`#bf5af2`, le préréglage « violet » de l'appli)
- **Base :** fork de [openGym](https://github.com/DuarteSantos8/openGym), sous licence AGPL-3.0
- **Fork :** https://github.com/Ti-guigui/openGym, branche `main`
- **Utilisation :** sous Windows, avec Docker Desktop, sur http://localhost:8080

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
     `frontend/src/lib/water.js` (tests dans `water.test.js`). Objectif fixe : 8 verres de 250 ml ;
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
6. **Docker.** `docker-compose.yml` construit des images locales (`tiguiguifit-*`) au lieu de
   télécharger celles d'openGym.

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

## Idées pour la suite (pas encore faites)

- Choisir son propre objectif d'eau (aujourd'hui fixé à 8 verres)
- Ajouter ses propres compléments (aujourd'hui une liste fixe de 6)
- Citation motivante du jour sur l'accueil
