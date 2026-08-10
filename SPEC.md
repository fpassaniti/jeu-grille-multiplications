# SPEC — MultyFun (multy.ovh)

> Document de spécification vivant. Il décrit l'existant (V1), les points d'attention, puis les spécifications de la V2 : modes de calcul multiples et gamification (pièces d'or, boutique, personnage RPG, coffres, streaks). Il est fait pour itérer : chaque section peut être amendée avant implémentation.

**Dernière mise à jour** : 2026-07-23

---

## 1. Vue d'ensemble

| | |
|---|---|
| **Produit** | Jeu éducatif d'entraînement au calcul mental, pensé pour des enfants de CE1/CE2 (7–9 ans) |
| **V1** | Tables de multiplication uniquement (grille 10×10) |
| **V2 (cible)** | Multi-modes : tables, additions, soustractions, multiplications étendues, divisions + gamification complète |
| **Stack** | SvelteKit 2 + Svelte 5, Neon Postgres (`@neondatabase/serverless`), déployé sur Vercel, PWA (`@vite-pwa/sveltekit`) |
| **i18n** | 4 langues : fr (défaut), en, es, zh — `src/lib/translations/` |
| **Utilisateurs** | ~52 comptes réels, 423 scores, 381 sessions de jeu (données à préserver) |
| **Style** | Enfantin : polices Baloo 2 / Comic Neue, emojis comme icônes, boutons « 3D », pas de sons |

---

## 2. État des lieux V1

### 2.1 Routes et pages

| Route | Accès | Rôle |
|---|---|---|
| `/` | Public | Accueil. Connecté : bienvenue + avatar de niveau + lien dashboard. Invité : cartes S'inscrire / Se connecter / Jouer |
| `/play` | Public | Le jeu (machine à états `notStarted` → `playing` → `finished`) |
| `/login` | Public | Connexion : username + emoji secret (18 choix) |
| `/register` | Public | Inscription : username, displayName optionnel, emoji secret |
| `/dashboard` | Connecté | Niveau, XP, barre de progression, 5 dernières parties, actions |
| `/collection` | Connecté | Les 30 niveaux (débloqués/verrouillés), XP manquante, impression de cartes |
| `/leaderboard` | Public | Top 10 filtré par mode (adulte/enfant) × durée (2/3/5 min) |
| `/offline` | Public | Fallback PWA hors-ligne |
| `/debug-print/[level]`, `/debug-score` | Debug | Aperçu carte imprimable / POST de score simulé |

### 2.2 Mécanique de jeu

| Élément | Comportement V1 |
|---|---|
| **Modes** | `adulte` (toutes les cellules 1–10 × 1–10) / `enfant` (tables choisies via TableSelector, persistées en localStorage) |
| **Durées** | 2, 3 ou 5 minutes (défaut 3) |
| **Génération** | Cellule aléatoire non résolue de la grille 10×10 ; mode enfant : ligne OU colonne dans les tables choisies |
| **Temps/question** | `5 + ((row+col)/20)×10` → 5 à 15 s ; ×3 en mode enfant. Timeout → marqué incorrect, question suivante |
| **Grille épuisée** | Reset des cellules résolues (score conservé), notification 1,5 s |
| **Validation** | Automatique à chaque frappe (`parseInt(saisie) === réponse`) — ⚠️ bug de préfixe, voir §3 |
| **Score** | `timeRemaining × difficulté` (matrice 10×10 en dur, 0.5 à 3.0, pic 7×7 = 3.0) ; enfant : `timeRemaining × (difficulté×0.7 + 0.3)` — `src/lib/utils/game-logic.js:44` |
| **Combo/streak en partie** | Aucun |
| **Fin de partie** | Connecté : sauvegarde auto + XP. Invité : formulaire de prénom pour le leaderboard |

### 2.3 Progression (XP / niveaux)

| Élément | Comportement V1 |
|---|---|
| **XP** | XP = score de la partie (ratio 1:1), attribuée par la fonction SQL `add_user_xp(user_id, xp, update_streak)` |
| **Niveaux** | `level = MAX(level) FROM level_definitions WHERE min_xp <= xp` ; 30 niveaux (titres i18n + images `static/images/levels/level_N.png`) |
| **Level-up** | `LevelUpModal` affiché quand le niveau retourné augmente |
| **Streak jours** | Calculé en base (`streak_days` : +1 si joué la veille, sinon reset) mais **jamais affiché dans l'UI** |
| **Badges** | Colonne `unlocked_badges` (JSON) présente, **aucune logique implémentée** |

### 2.4 Endpoints API

| Endpoint | Méthode | Payload / Query | Notes |
|---|---|---|---|
| `/api/auth/register` | POST | `{username, passwordChar, displayName?}` | Appelle `create_new_user()`, pose cookie session 7 j |
| `/api/auth/login` | POST | `{username, passwordChar}` | Comparaison en clair, `UPDATE last_login` |
| `/api/auth/logout` | POST | — | Supprime le cookie |
| `/api/scores` | POST | `{name, score, duration, level, solvedCells, totalPossibleCells, selectedTables}` | Insère dans `game_sessions` + `scores` ; si connecté, appelle `add_user_xp`. Validation : `duration ∈ {2,3,5}` seulement — **le score n'est pas validé** |
| `/api/leaderboard` | GET | `?level=&duration=` | Meilleur score par nom, top 10 |
| `/api/user/progress` | GET | (cookie) | Progression + niveau courant/suivant + % |
| `/api/levels`, `/api/levels/[id]` | GET | — | Définitions de niveaux, flags `unlocked`/`current` |

### 2.5 Modèle de données

| Table | Colonnes principales |
|---|---|
| `users` | `id (UUID)`, `username`, `password_char` (emoji en clair), `display_name`, `last_login`, `created_at` |
| `user_progress` | `user_id`, `xp`, `level`, `games_played`, `total_score`, `streak_days`, `unlocked_badges (JSON)`, `last_played_at` |
| `scores` (leaderboard) | `id`, `name`, `score`, `level (text: adulte/enfant)`, `duration`, `cells_solved`, `total_cells`, `tables_used (int[])`, `date` |
| `game_sessions` (historique) | idem `scores` + `user_id`, `xp_earned`, `completed` |
| `level_definitions` | `level (unique)`, `title`, `description`, `min_xp`, `rewards (JSON, inutilisé)`, `image_url`, `color_theme` |

**Fonctions SQL** : `add_user_xp(user_id, xp, update_streak)` (streak + XP + niveau, versionnée dans `db/add_user_xp.sql`) ; `create_new_user(...)` (⚠️ non versionnée, existe uniquement en base).

### 2.6 Front : composants et stores

| Zone | Fichiers clés |
|---|---|
| Jeu | `src/routes/play/+page.svelte` (~593 lignes, toute la logique), `game/StartScreen`, `GameScreen`, `EndScreen`, `GameOptions`, `GameHeader`, `GameProgress`, `CurrentMultiplication`, `SaveScoreForm`, `LevelUpModal` |
| Plateau | `GameBoard.svelte` (grille 11×11 desktop), `MobileGame.svelte` (question + input, < 768 px) |
| Généraux | `NavigationHeader`, `Leaderboard`, `LevelAvatar`, `TableSelector`, `PrintableCard`, `PwaInstallPrompt`, `LanguagePicker` |
| Stores | `gameStore.js` (tables sélectionnées, utilisé), `languageStore.js`, `gameStateStore.js` (**code mort**) |
| Utils | `game-logic.js` (difficulté + score), `formatters.js`, `i18n.js`, `image-paths.js`, `template-loader.js` |
| Services | `gameService.js` (wrappers fetch, partiellement dupliqués dans `/play`) |

---

## 3. Points d'attention / dette technique

| # | Problème | Impact | À traiter |
|---|---|---|---|
| 1 | `level_definitions` versionné = 10 niveaux, mais UI/i18n/images = 30 | Seuils XP 11–30 dépendent du contenu réel de la base prod | Réconcilier et versionner le seed 30 niveaux |
| 2 | Le client attend `returned_previous_level`/`returned_level_title` que `add_user_xp` (repo) ne retourne pas | Détection de level-up fragile | Corrigé par `add_game_rewards` (V2, §5.7) |
| 3 | `create_new_user` non versionnée | Base non reconstructible | Extraire le SQL de la base et le versionner |
| 4 | Mot de passe = 1 emoji stocké/comparé en clair | Sécurité faible (choix assumé enfants) | Documenté, pas de changement prévu |
| 5 | `gameStateStore.js` = code mort ; `gameService.saveScore` dupliqué dans `/play` | Confusion | Supprimé/réutilisé au refactor V2 (étape 1) |
| 6 | Auto-validation à chaque frappe : taper « 4 » pour 42 flashe « incorrect » | Bloquant avec des réponses à 3-4 chiffres | Corrigé par l'engine V2 (§4.3) |
| 7 | `POST /api/scores` ne valide pas la plausibilité du score | Triche triviale (XP et bientôt pièces) | Anti-triche V2 (§5.7) |
| 8 | `login/+page.svelte` fait un GET `/api/auth/login` inexistant | Erreur silencieuse | Nettoyage |
| 9 | Restes Supabase (`vite.config.js`, README) après migration Neon | Confusion | Nettoyage |
| 10 | Streak calculé mais invisible ; `unlocked_badges` et `rewards` inutilisés | Potentiel gaspillé | Streak exploité par la V2 (§5) ; badges repris (nouveau modèle relationnel) par le Volet C (§7) |
| 11 | Deux avatars concurrents : `LevelAvatar` (image fixe par niveau) et `CharacterAvatar` (personnage équipable) affichés côte à côte sans lien, notamment sur le dashboard | Confusion "lequel est mon vrai personnage ?", dilue la valeur perçue de la boutique | Résolu (2026-07-20) — voir §5.3.1 |

---

## 4. Spec V2 — Volet A : modes de calcul multiples

### 4.1 Objectif

Ne plus proposer uniquement les tables, mais un choix de **modes de calcul** avec progression pédagogique CE1 → CE2 :

| Mode | id | Statut V2 | Affichage |
|---|---|---|---|
| Tables de multiplication | `tables` | ✅ Existant, réécrit dans l'abstraction | Grille 10×10 (desktop) / question (mobile) |
| Additions posées | `addition` | ✅ Nouveau | Question générique (posée en colonnes) |
| Soustractions posées | `subtraction` | ✅ Nouveau | Question générique (posée en colonnes) |
| Multiplications étendues | `multiplication` | ✅ Nouveau | Question générique |
| Divisions | `division` | ✅ Activé (V2) — non intégré aux presets CE1/CE2, accessible via « Libre » | Question générique |

### 4.2 Abstraction « mode » — `src/lib/modes/` (JS pur, sans import Svelte)

Le JS pur permet les tests Vitest ET l'import côté serveur (validation des options dans `/api/scores`).

```
src/lib/modes/
├── index.js            # MODES, getMode(id) (fallback 'tables'), listEnabledModes()
├── types.js            # Typedefs JSDoc
├── tables.js           # Grille 10×10 + matrice de difficulté (migrée de game-logic.js)
├── addition.js / subtraction.js / multiplication.js
├── division.js         # enabled: false
├── presets.js          # CE1 / CE2 / Libre
└── generator-utils.js  # randInt, contrôle retenue/emprunt, anti-répétition
```

**Interfaces** (JSDoc) :
- `Question` : `id, operands[], operator ('×'|'+'|'−'|'÷'), answer, difficulty (0.5–3.0, échelle commune), timeAllowedSec, meta` (spécifique au mode : `{row,col}` / `{carry:true}` / `{tier:'A3'}`).
- `QuestionGenerator` (créé par partie, avec état) : `next()`, `markSolved(id)`, `progress() → {solved, total|null}`, `poolExhausted()`, `resetPool()`, `boardState()` (état de grille pour `tables`, `null` sinon).
- `GameMode` : `id, enabled, labelKey, icon, boardType ('grid'|'generic'), tiers, defaultOptions, validateOptions(options), createGenerator(options, level)`.

`boardType` est une **chaîne** (pas un composant) ; le mapping vers les composants vit dans `GameScreen.svelte` : `grid` + desktop → `GameBoard`, sinon → `QuestionPanel`. Ajouter un mode = 1 fichier + traductions.

### 4.3 Moteur — `src/lib/game/engine.svelte.js` (classe à runes Svelte 5)

États réactifs : `state, score, gameTimer, questionTimer, question, feedback, solvedHistory, progress`. Méthodes : `start({modeId, options, level, durationMin})`, `onAnswerInput(raw)`, `submitAnswer(raw)`, `end()`, `destroy()`.

- **Validation corrigée** : auto-check seulement quand la longueur saisie atteint celle de la réponse ; Enter/bouton OK force la vérification. Supprime le bug de préfixe (#6).
- Timers (global + question, timeout → feedback → question suivante) migrés depuis `/play`.
- `/play/+page.svelte` retombe à ~100 lignes ; `gameStateStore.js` supprimé ; `gameService.saveScore` réutilisé.
- `src/lib/game/persistence.js` : localStorage `multyfun.gameSettings.v2` = `{lastMode, level, duration, optionsByMode}` (migre `selectedMultiplicationTables`).

### 4.4 Scoring unifié — `src/lib/game/scoring.js`

```js
points = Math.round(15 * question.difficulty * (0.25 + 0.75 * timeRemaining / timeAllowed))
```

- Plancher 0.25 : une bonne réponse lente rapporte toujours (motivation CE1).
- XP = score 1:1 ; pièces = `FLOOR(score/10)` côté SQL (§5.2) → un seul levier (`difficulty`/`timeAllowedSec`) pilote XP et pièces à la fois.

**Modèle de calibration par opérations élémentaires (décision 2026-07-23, remplace l'objectif « points/minute égal entre modes »)** — `src/lib/game/balance-config.js` :

- Un calcul complexe (ex. multiplication posée 3×2 chiffres = 6 multiplications + 4 additions) doit rapporter **nettement plus** qu'un calcul simple (table = 1 fait mémorisé), y compris en pièces et XP, quitte à rapporter moins de points par minute (l'objectif d'égalité points/minute de la V2 initiale est abandonné : il masquait l'écart d'effort réel entre modes).
- **Modes posés** (addition, soustraction, multiplication étendue) : chaque palier porte un `operationCount` (nombre d'opérations élémentaires à un chiffre requises par l'algorithme posé, +1 opération-équivalent si retenue/emprunt). `difficulty = OP_DIFFICULTY(0.8) × operationCount` ; `timeSec (adulte) = BASE_SEC(5) + OP_SEC(4) × operationCount`. `OP_DIFFICULTY` est calé sur le plus haut ratio (ancienne difficulté / operationCount) du barème V2 précédent, pour qu'aucun palier existant ne rapporte moins qu'avant — seuls les paliers à fort `operationCount` (M6 en tête) gagnent significativement. Exemple M6 (6 mult + 4 add = 10 opérations) : difficulty 8.0, 45 s adulte — soit 10× la difficulté d'un M1/M2 (≥ plancher 6× demandé).
- **Modes « rappel »** (tables, division) : un seul fait mémorisé (pas un algorithme multi-étapes) → la grille de difficulté psychologique existante (7×7 plus dur que 1×1, diviser par 9 plus dur que par 10) est conservée pour sa forme relative mais **rescalée** dans une plage resserrée `RECALL_DIFFICULTY_RANGE = [0.3, 0.7]` / `RECALL_TIME_RANGE_SEC = [6, 10] s` (adulte) via `rescaleRecall()`, pour ne pas rivaliser avec les modes posés — seule baisse volontaire du modèle (les tables, notamment 7×7, étaient surévaluées face à M6). Cette plage est indépendante de `OP_DIFFICULTY` et fixée définitivement dès le premier rééquilibrage — les modes posés sont réhaussés en comparaison, tables/division ne sont plus retouchés.
- `MAX_DIFFICULTY = 8.0` (M6) → `maxPointsPerQuestion() = 120` (utilisé par l'anti-triche §5.7, dérivé dynamiquement dans `scoreValidation.js` pour éviter le drift).
- Le facteur enfant `LEVEL_TIME_FACTOR = ×3` (`generator-utils.js`) reste global et suffit à satisfaire les bornes demandées avec les nouvelles valeurs de base : tables adulte ≤ 10 s, multiplication complexe (M6) enfant ≥ 1 min (135 s).
- Testé par `src/lib/game/balance.test.js` (nouvel invariant : `difficulty` proportionnelle à `operationCount`, bornes de temps par niveau, plancher ×6 M6/table).

### 4.5 Paliers pédagogiques (échelle de difficulté commune)

Difficulté et temps alloué (adulte) dérivés du modèle par opérations élémentaires (§4.4, `balance-config.js`) : `operationCount` = nb d'opérations à un chiffre de l'algorithme posé (+1 si retenue/emprunt) pour les modes posés ; rappel resserré `[0.3, 0.7]`/`[6, 10] s` pour tables et division.

| Mode | Palier | Contenu | Opérations | Difficulté | Temps adulte |
|---|---|---|---|---|---|
| Addition | A1 | Sans retenue, résultat ≤ 20 | 2 | 1.6 | 13 s |
| | A2 | Sans retenue, ≤ 100 | 2 | 1.6 | 13 s |
| | A3 | Avec retenue, ≤ 100 | 2+1 | 2.4 | 17 s |
| | A4 | Sans retenue, ≤ 1000 | 3 | 2.4 | 17 s |
| | A5 | Avec retenue, ≤ 1000 | 3+1 | 3.2 | 21 s |
| | A6 | Avec retenue, ≤ 10 000 (option 3 opérandes) | 6 | 4.8 | 29 s |
| Soustraction | S1 | Sans emprunt, ≤ 20 (résultat ≥ 0) | 2 | 1.6 | 13 s |
| | S2 | Sans emprunt, ≤ 100 | 2 | 1.6 | 13 s |
| | S3 | Avec emprunt, ≤ 100 | 2+1 | 2.4 | 17 s |
| | S4 | Sans emprunt, ≤ 1000 | 3 | 2.4 | 17 s |
| | S5 | Avec emprunt, ≤ 1000 | 3+1 | 3.2 | 21 s |
| Multiplication | M1 | n × 10 (règle mentale) | 1 | 0.8 | 9 s |
| | M2 | n × 100, n × 1000 (règle mentale) | 1 | 0.8 | 9 s |
| | M3 | 2 chiffres × 1 chiffre, sans retenue | 2 | 1.6 | 13 s |
| | M4 | 2 chiffres × 1 chiffre, avec retenue | 2+1 | 2.4 | 17 s |
| | M5 | 3 chiffres × 1 chiffre | 3+1 | 3.2 | 21 s |
| | M6 | 2-3 chiffres × 2 chiffres (6 multiplications + 4 additions) | 10 | **8.0** | **45 s** |
| Division | D1–D3 | Inverse des tables → quotients exacts (rappel, non posé) | 1 (rappel) | 0.30–0.70 | 6–10 s |
| Tables | — | Matrice 10×10 existante (rappel, non posé) | 1 (rappel) | 0.30–0.70 | 6–10 s |

M6/M1-M2 = 8.0/0.8 = **10×** ; M6/table-la-plus-dure (7×7) = 8.0/0.7 ≈ **11,4×** — au-delà du plancher ×6 demandé. Enfant = ×3 sur le temps adulte (`LEVEL_TIME_FACTOR`, `generator-utils.js`) : M6 enfant = 135 s (2 min 15), tables enfant ≤ 30 s.

Génération chiffre par chiffre pour **contrôler exactement** la retenue/l'emprunt (sans retenue : chaque colonne somme ≤ 9 ; avec : au moins une colonne > 9).

**Presets** (`presets.js`) : **CE1** = A1–A3, S1–S3, tables {2,3,4,5,10}, M1 · **CE2** = A3–A5, S3–S5, toutes tables, M1–M4 · **CM1** (nouveau, réservé au niveau enfant) = A3–A6, S3–S5 (identique à CE2), M2–M6, D1–D3. `M6` n'est ajouté à aucun preset CE1/CE2 (comme `M5`) — accessible via CM1 ou en cochant la case manuellement.

Le niveau **adulte** (`GameOptions.svelte`) ne propose plus aucun bouton de preset : il applique automatiquement le même jeu de paliers que CM1 pour le mode courant (seule différence : `LEVEL_TIME_FACTOR` reste à `×1` pour l'adulte contre `×3` pour l'enfant, cf. `generator-utils.js`). Cliquer sur CE1/CE2/CM1 ne fait que précocher les cases correspondantes (une case « Tout cocher » permet aussi de tout sélectionner d'un coup) — il n'y a plus de bouton « Libre » séparé. La liste des paliers à cocher est repliée dans un accordéon discret (fermé par défaut, on fait confiance au preset précoché par l'application) que l'on peut ouvrir pour l'ajuster manuellement. Quand deux presets pointent vers le même jeu de paliers pour un mode (ex. CM1 = CE2 en soustraction), `groupPresetsForMode` les fusionne en un seul bouton libellé « CE2 / CM1 » plutôt que d'afficher deux boutons dont un seul peut être en surbrillance à la fois.

#### 4.5.1 Multiplication posée à produits partiels (M6, décision 2026-07-22)

À l'école, une multiplication dont le multiplicateur a plusieurs chiffres se pose avec un étage par produit partiel, additionnés ensuite. `M3`-`M6` retournent `posed: true` (absent pour `M1`/`M2` : `×10`/`×100`/`×1000` restent une règle mentale, pas une technique posée). `M6` retourne en plus `partials: [{value, shift}, ...]` (un par chiffre du multiplicateur, `shift` = position décimale).

`computeStages(operator, answer, meta)` (`src/lib/modes/generator-utils.js`, appelée dans `makeGenericGenerator`) construit `question.stages` — une ligne par étape que l'enfant doit remplir : un seul stage `final` pour toutes les opérations posées à réponse unique (addition/soustraction/multiplication simple), ou un stage par produit partiel puis `final` pour `M6`. `computePosed(operator, operands, meta)` calcule `question.posed` (même fichier) — c'est ce champ, pas une heuristique dupliquée côté UI, que consultent à la fois `GameEngine` et `QuestionPanel` pour choisir la mécanique de saisie.

**Saisie chiffre par chiffre, de droite à gauche (décision 2026-07-22, corrige un premier essai gauche→droite)** : à l'école on commence par les unités (à droite) et on remonte vers la gauche à cause des retenues — et une case fausse **reste active** (on la retape) plutôt que d'effacer toute la ligne. `GameEngine` matérialise ça avec deux compteurs seulement : `stageIndex` (quelle ligne) et `digitIndex` (chiffres déjà verrouillés dans la ligne active, **comptés depuis la droite** — chiffre attendu = `Math.floor(stage.value / 10 ** digitIndex) % 10`). Un chiffre verrouillé n'a pas besoin d'être mémorisé séparément : par construction c'est celui de `stage.value` à cette position, donc pas de tableau `completedStages` à maintenir.

- `#checkDigit` (remplace l'ancien `#checkStage`) : chiffre faux → `digitIndex` inchangé, la case reste active pour réessai (flash rouge `INCORRECT_FLASH_MS`) ; chiffre juste et ligne pas encore complète → verrouillage immédiat, **aucun délai**, la case suivante (à gauche) est saisissable tout de suite ; ligne complète et étapes restantes → flash vert puis `CORRECT_DELAY_MS` avant la ligne suivante ; dernière ligne de la dernière étape → scoring/historique/question suivante (`#markQuestionSolved`, factorisé avec l'ancienne mécanique).
- Cette mécanique par chiffre ne s'applique **qu'aux questions posées** (`question.posed === true`) : les questions non posées (tables, `n×10/×100/×1000`, petites additions) gardent la mécanique historique V1/V2 intacte (`#checkWhole`, réponse entière, auto-check à longueur atteinte — fix du bug de préfixe #6 inchangé).
- `QuestionPanel.svelte` : `isPosed = question.posed`. Pour chaque case, position depuis la droite `p = stage.digits - 1 - j` (j = index visuel gauche→droite) ; verrouillée (verte, définitive) si `p < digitIndex` ou ligne antérieure ; active (curseur clignotant, rouge pendant le flash d'erreur) si `p === digitIndex` de la ligne courante ; sinon en attente (grisée). Le décalage des produits partiels (`shift`) reste purement visuel (cases « spacer » invisibles ajoutées à droite), l'enfant ne tape aucun zéro de décalage. Un seul `<input>` réel (visuellement masqué, focus repris au clic n'importe où sur la zone posée) reste la source de saisie unique — clavier physique ou `NumericKeypad` selon `isMobile` — les cases ne sont qu'un reflet d'affichage : pas de gestion de focus multi-input à maintenir.

### 4.6 DB + API (migration `db/migrations/001_game_modes.sql`, rétrocompatible)

```sql
ALTER TABLE scores        ADD COLUMN game_mode text NOT NULL DEFAULT 'tables',
                          ADD COLUMN mode_options jsonb NOT NULL DEFAULT '{}';
ALTER TABLE game_sessions ADD COLUMN game_mode text NOT NULL DEFAULT 'tables',
                          ADD COLUMN mode_options jsonb NOT NULL DEFAULT '{}';
-- + CHECK game_mode IN (...), backfill tables_used → mode_options.selectedTables,
-- + INDEX (game_mode, level, duration, score DESC)
```

- Les 906 enregistrements existants deviennent `game_mode = 'tables'` via DEFAULT — zéro réécriture.
- `mode_options JSONB` : chaque mode y sérialise ses réglages → la division V3 n'exigera aucune migration.
- `POST /api/scores` : accepte l'**ancien payload** (PWA en cache : `solvedCells`, `selectedTables`…) ET le nouveau (`gameMode, modeOptions, questionsSolved, questionsTotal, errorsCount`) ; validation serveur via `getMode(gameMode).validateOptions()` (rejette `division` tant que désactivée).
- `GET /api/leaderboard` : nouveau paramètre `mode` (défaut `tables` → l'historique reste le classement tables).

### 4.7 UI

| Composant | Rôle |
|---|---|
| `ModeSelector.svelte` (nouveau) | Cartes icône + nom (✖️ ➕ ➖) en tête de StartScreen, depuis `listEnabledModes()` |
| `DifficultySelector.svelte` (nouveau) | Boutons CE1 / CE2 / CM1 (enfant uniquement — l'adulte n'a aucun choix, verrouillé sur le preset le plus difficile) ; liste des paliers à cocher repliée dans un accordéon fermé par défaut, avec case « Tout cocher » |
| `QuestionPanel.svelte` (généralise `MobileGame`) | Rendu `operands/operator` ; **présentation posée en colonnes** pour additions/soustractions multi-chiffres et multiplications posées (M3-M6, §4.5.1), saisie **une case par chiffre** avec retour immédiat ; historique `{question, points}` |
| `CurrentQuestion.svelte` (généralise `CurrentMultiplication`) | Question dans le header desktop |
| `NumericKeypad.svelte` (nouveau) | Pavé 0-9 + effacer + OK sur mobile/tablette (`inputmode="none"`) ; clavier physique + Enter sur desktop |
| `GameOptions.svelte` (modifié) | Niveau + durée communs ; section spécifique par mode (`TableSelector` pour tables, `DifficultySelector` sinon) |
| `Leaderboard.svelte` (modifié) | Sélecteur de mode au-dessus des filtres existants, URL `?mode=&level=&duration=` |

i18n : nouvelles clés `modes.*`, `difficulty.*` (tiers libellés), `game.validate` dans les 4 langues.

---

## 5. Spec V2 — Volet B : gamification

### 5.1 Principes (public : enfants de 7–9 ans)

- **XP et pièces séparés** : l'XP reste la progression permanente (30 niveaux, jamais dépensée) ; les pièces d'or 🪙 sont la monnaie dépensable.
- **Éthique** : pas d'achats réels, pas de pub, catalogue entièrement visible (pas de FOMO agressif type « aujourd'hui seulement »), pity anti-frustration, gel de streak (les enfants ne contrôlent pas leur emploi du temps), doublons toujours convertis positivement.
- **Tout gain est calculé côté serveur** (formules, bonus, tirages de coffres) — le client ne fait qu'afficher.

### 5.2 Économie des pièces

**Conversion** : `pieces_base = GREATEST(10, FLOOR(score / 10))` → 20–200 🪙/partie (score typique 200–2000), moyenne ~80. Nombres petits et lisibles, visuellement distincts de l'XP.

**Partie à 0 point non comptabilisée** : une partie où `score = 0` (aucun calcul résolu) n'est ni enregistrée (`game_sessions`/`scores`) ni récompensée — sinon démarrer une partie et cliquer aussitôt sur « Terminer la partie » en boucle rapporterait le plancher de `pieces_base` sans effort (`/api/scores`, court-circuit avant tout accès base).

**Bonus (serveur uniquement, `add_game_rewards`, `p_completed`)** — `pieces_base` reste crédité pour toute partie à score > 0, mais les bonus ci-dessous exigent une partie allée à son terme naturel (minuteur écoulé) : ils ne sont **jamais** accordés en cas de fin anticipée via « Terminer la partie » (`p_completed = false`), pour qu'écourter une partie ne serve jamais à collecter un bonus forfaitaire sans jouer réellement :

| Bonus | Montant | Condition |
|---|---|---|
| Première partie du jour | +50 🪙 | `DATE(last_played_at) < CURRENT_DATE`, partie complétée |
| Streak actif | +5 × streak_days (plafond +50) | streak ≥ 2 jours, **une seule fois par jour** (première partie complétée du jour), partie complétée |
| Partie parfaite | +25 🪙 | 0 erreur ET ≥ 10 réponses, partie complétée |
| Week-end | ×2 sur la base | samedi/dimanche, partie complétée |

Le bonus de streak était auparavant recrédité à chaque partie du jour (pas seulement la première) — corrigé par `db/migrations/007_reward_completion_gate.sql` suite à un excès de pièces observé chez les joueurs à streak actif enchaînant plusieurs parties/jour.

Revenu d'un joueur régulier (2-3 parties/jour) : **~300–400 🪙/jour** (avec coffre quotidien).

**Prix boutique (6 raretés — décision 2026-07-21, extension à 350 items, §5.9.1)** : prix de base par rareté (bande A), avec deux bandes premium (B ×1,4 / C ×2,0) au sein de chaque rareté à partir d'`uncommon` (`common` reste à prix plat, sans bande — l'entrée dans le catalogue doit rester rapide et uniforme) :

| Rareté | Prix bande A | Bande B (×1,4) | Bande C (×2,0) | Rythme d'acquisition cible (bande A) |
|---|---|---|---|---|
| Commun | 150 🪙 | — | — | ~2 parties |
| Peu commun | 350 🪙 | 490 🪙 | 700 🪙 | ~1 jour |
| Rare | 900 🪙 | 1 260 🪙 | 1 800 🪙 | 2-3 jours |
| Épique | 2 700 🪙 | 3 780 🪙 | 5 400 🪙 | ~1 semaine |
| Légendaire | 8 000 🪙 | 11 200 🪙 | 16 000 🪙 | ~3 semaines |
| Mythique | 45 000 🪙 | 63 000 🪙 | 90 000 🪙 | 4 à 8 mois de jeu régulier |

Coût total du catalogue complet (350 items) ≈ 1,09M 🪙, soit ~8,6 ans à 350 🪙/jour pour tout posséder — **volontairement hors de portée à court terme** : 55% du catalogue (commun + peu commun) reste rapide (0,4-2 jours/item) pour la boucle de récompense courte, tandis que la complétion à 100% est un horizon pluriannuel d'aspiration. Aucune contradiction avec le principe « catalogue entièrement visible, pas de FOMO » (§5.1) : rien n'est retiré ni limité dans le temps, un item cher reste achetable dès le jour 1 dès que le joueur a économisé.

**Crédit rétroactif au lancement** : `LEAST(800, FLOOR(xp/50))` pour les 52 joueurs existants (les vétérans à 25 000–41 000 XP touchent 500–800 🪙 : moment « waouh » sans vider la boutique) + **1 coffre de bienvenue** pour tous au premier login post-V2.

### 5.3 Personnage RPG (calques d'images)

**7 slots + corps**, empilés par z-order croissant :

| z | Slot | Exemples | Équipement de départ |
|---|---|---|---|
| 0 | `background` | prairie, château, galaxie | ciel simple |
| 10 | `aura` | étincelles, flammes (épique+) | — |
| 20 | `back` | cape, ailes, sac à dos | — |
| 30 | `body` | créature de base, variantes, dragon, phénix | blob violet basique |
| 40 | `outfit` | t-shirt troué → armure dorée | t-shirt troué |
| 50 | `weapon` | bâton → épée laser des maths | bâton de bois |
| 60 | `hat` | bonnet → couronne | — |
| 70 | `pet` | familier en bas à droite | — |

- **Assets** : PNG carrés (1024×1024 en production), **tous dessinés sur le même canvas** (corps centré, chaque item positionné à sa place) → composition = simples `<img>` empilées en `position:absolute; inset:0`, aucun offset en code. Transparents partout sauf la zone de l'accessoire, sauf le slot `background` : plein cadre **opaque** (z-index le plus bas, rien à préserver derrière).
- **Composant** `src/lib/components/character/CharacterAvatar.svelte` (prop `equipment`, `size`). Affiché : `/character` (300 px), dashboard (150 px), header (mini 40 px).
- **Lien avec les niveaux** : `unlock_level` sur certains items (« Reviens au niveau 10 pour l'acheter ! » → double motivation). Depuis la décision « coffres = pièces uniquement » (§5.5), tous les items sont acquis par achat boutique — aucun n'est réservé à un tirage de coffre.

#### 5.3.1 Unification avec l'ancien avatar de niveau (décision 2026-07-20)

À l'implémentation, `LevelAvatar` (image statique `level_N.png` par niveau, §2.3) et `CharacterAvatar` coexistaient sans être unifiés : `LevelAvatar` seul sur l'accueil, les deux côte à côte sur le dashboard, aucun sur le header (dette #11, §3). Décision : le niveau (XP, titre, seuils, `color_theme`) reste — il structure les déblocages d'items (`unlock_level`) et les coffres de level-up — mais `LevelAvatar` n'est plus utilisé pour représenter le joueur là où il rivalisait avec `CharacterAvatar` :
- **Accueil, dashboard, header** : un seul avatar visible, `CharacterAvatar`, avec le niveau réduit à une pastille (`LevelBadge.svelte`, dégradé `color_theme` réutilisé de `LevelAvatar` via `src/lib/utils/level-theme.js`) en overlay — le niveau redevient un statut/décoration, pas un second personnage.
- **`/collection`** : `LevelAvatar` + `PrintableCard` inchangés — repositionné comme galerie de badges/certificats de progression à collectionner et imprimer (texte `collection.description` mis à jour en ce sens), une fonctionnalité distincte de la personnalisation du personnage.

### 5.4 Boutique (`/shop`)

- Onglets par slot (🎩 👕 ⚔️ 🐾 🌈 ✨ 🦸), cartes style « 3D » existant, fond de couleur de rareté (gris/bleu/violet/or), badge « ✅ Possédé ».
- **Prévisualisation avant achat** : tap sur un item → le personnage l'essaie en haut de page.
- Confirmation en 2 taps (« Acheter pour 350 🪙 ? Il te restera 120 🪙 »).
- **Pas de remise/promotion** : les prix sont fixes (décision produit, retire l'ancienne mécanique d'« offre du jour » à −20%).

### 5.5 Coffres au trésor

**Décision (coffres = pièces uniquement)** : les coffres ne distribuent plus jamais d'objet, seulement des pièces. Motif : les tirages gratuits permettaient de s'équiper trop vite et trop largement, sans jamais passer par la boutique — désormais, obtenir un item est **toujours** un choix d'achat délibéré.

| Type | Déclencheur | Contenu |
|---|---|---|
| 🎁 Quotidien | 1 clic/jour (dashboard + accueil) | 30–80 🪙 |
| 🔥 Streak | Paliers 3 / 7 / 14 / 30 / 60 jours | pièces (bonus +100 🪙 au palier 7, +500 🪙 au palier 60) |
| ⬆️ Level-up | Chaque montée de niveau | `100 + 20×niveau` 🪙 |
| 💯 Perfect | Partie parfaite (max 1/jour) | 25–75 🪙 |
| 👋 Bienvenue | Premier login post-V2 | 100 🪙 |

- **`ChestModal.svelte`** : coffre qui tremble (CSS), tap pour ouvrir, confettis emoji.
- Tirage exclusivement serveur dans `/api/chests/open`.

### 5.6 Streaks quotidiens et boosters

- Réutilise `user_progress.streak_days` existant (#10).
- **Gel de streak 🛡️** : 1 offert, rachetable 300 🪙 ; consommé automatiquement si 1 jour manqué (logique dans la fonction SQL).
- **UI** : flamme 🔥 + compteur dans le header (grise si pas encore joué aujourd'hui) ; dashboard : calendrier 7 jours (✅/⬜) + prochain palier (« Encore 2 jours → coffre rare ! »).
- **Boosters (volontairement minimal)** : week-end ×2 (pur code serveur + bannière accueil) ; potion ×2 consommable (400 🪙, 3 prochaines parties, `active_booster JSONB`). Pas de système d'événements générique en V2.

### 5.7 Schéma DB (`db/migrations/v2_gamification.sql`)

```sql
ALTER TABLE user_progress
  ADD COLUMN coins INTEGER NOT NULL DEFAULT 0 CHECK (coins >= 0),
  ADD COLUMN coins_total_earned INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN streak_freezes INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN active_booster JSONB DEFAULT NULL,
  ADD COLUMN last_daily_chest_at DATE DEFAULT NULL,
  ADD COLUMN last_streak_reward INTEGER NOT NULL DEFAULT 0;

CREATE TABLE items (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,          -- 'hat_crown_gold'
  slot VARCHAR(20) NOT NULL CHECK (slot IN ('background','aura','back','body','outfit','weapon','hat','pet')),
  rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common','rare','epic','legendary')),
  price INTEGER NOT NULL DEFAULT 0,
  asset_url VARCHAR(255) NOT NULL,
  name JSONB NOT NULL,                        -- {"fr":"Couronne dorée","en":...}
  unlock_level INTEGER NOT NULL DEFAULT 1,
  is_default BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE user_inventory (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL REFERENCES items(id),
  source VARCHAR(20) NOT NULL DEFAULT 'shop', -- shop|chest|level|default|retro
  acquired_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, item_id)
);

CREATE TABLE user_equipment (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot VARCHAR(20) NOT NULL,
  item_id INTEGER NOT NULL REFERENCES items(id),
  PRIMARY KEY (user_id, slot)
);

CREATE TABLE coin_transactions (               -- audit + anti-triche + debug
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,                     -- négatif = dépense
  reason VARCHAR(30) NOT NULL,                 -- game|daily_chest|streak_chest|levelup_chest|perfect|purchase|retro
  ref JSONB DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE chest_openings (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chest_type VARCHAR(20) NOT NULL,
  rewards JSONB NOT NULL,                      -- {"coins":45,"item_id":12}
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Fonction `add_game_rewards(user_id, xp, is_perfect)`** — remplace l'appel à `add_user_xp` dans `/api/scores` (l'ancienne fonction reste en place pendant la transition) :
- `SELECT ... FOR UPDATE` + **un seul UPDATE** (corrige les 4 UPDATE fragiles de `add_user_xp`, #2).
- Gère : streak (avec gel automatique si jour manqué et `streak_freezes > 0`), pièces (base + week-end + booster + bonus premier-du-jour/streak/perfect), XP, level-up, journal `coin_transactions`.
- Retourne : `xp, level, level_up (bool), streak_days, coins_earned, coins_balance, coins_breakdown (JSONB), streak_chest_dû, freeze_used`.

**`buy_item(user_id, item_id)`** : atomique — vérifie niveau + non-possession, débite via `UPDATE ... SET coins = coins - price WHERE coins >= price` (aucun solde négatif possible même en double-clic), insère l'inventaire.

**Anti-triche `/api/scores`** (#7) :
- Plausibilité : rejet si `score > duration × 60 × 10` ou `solvedCells > totalPossibleCells`.
- Anti-replay : rejet si une partie du même utilisateur existe déjà datant de moins de `duration` minutes.
- `errorsCount` ajouté au payload client (perfect = `errorsCount === 0 && solvedCells >= 10`).

### 5.8 API et pages

| Nouveau | Rôle |
|---|---|
| `GET /api/shop` | Catalogue joint à l'inventaire (flag `owned`) |
| `POST /api/shop/buy` | `{itemId}` → `buy_item()` |
| `POST /api/character/equip` | `{slot, itemId\|null}` (UPSERT `user_equipment`, vérifie possession) |
| `GET /api/chests` | Coffres disponibles (quotidien ? palier streak dû ? bienvenue ?) |
| `POST /api/chests/open` | Crédit serveur en pièces uniquement, écrit `chest_openings` + transactions |
| Route `/shop` | Boutique |
| Route `/character` | Équipement du personnage |

**Modifications** : `/api/scores` (anti-triche + `add_game_rewards` + retour pièces/breakdown/coffres) ; `EndScreen` (compteur de pièces animé + détail des bonus + « Ouvrir ton coffre ! ») ; `NavigationHeader` (🪙 + 🔥 permanents) ; dashboard (avatar, coffre quotidien, calendrier streak) ; `+layout.server.js` (expose `coins`/`streak_days`) ; `LevelUpModal` (intègre le coffre de level-up) ; traductions `shop.*, character.*, chest.*, streak.*` ×4 langues.

### 5.9 Production des assets

**Catalogue à la main, un item à la fois (décision 2026-07-22 — remplace le catalogue procédural décrit dans les versions précédentes de ce document, §5.9.1 ci-dessous conservé comme trace historique)** : la table `items` a été entièrement vidée (`db/migrations/005_items_reset.sql`) — plus de catalogue à 353 items pré-généré, plus de placeholders SVG, plus de source de vérité en code (`scripts/item-catalog.mjs` et `scripts/generate-item-placeholders.mjs` supprimés). **La base de données EST le catalogue.** Chaque item est ajouté un par un, au fil de la production réelle de son art, via `scripts/add-shop-item.mjs` (nom 4 langues, slot, rareté, prix, niveau de déblocage, image PNG — copie le fichier dans `static/images/items/{code}.png` et insère directement la ligne en base, pas de migration à appliquer à part). Raison du changement : la production d'art réel via IA s'est révélée être un travail curé, manuel, un item à la fois (édition itérative + nettoyage humain, cf. `PROMPT_ASSETS.md`) — pas la génération en volume qui justifiait un catalogue pré-rempli de 353 entrées procédurales.

**Pipeline de production visuelle** : voir [`PROMPT_ASSETS.md`](./PROMPT_ASSETS.md) pour le prompt de référence et le processus (édition itérative d'une image de personnage de référence sur fond chroma-key, un ajout à la fois). **Décision de compositing (tranchée 2026-07-22)** : calque plein cadre — chaque item est extrait d'une édition itérative d'une image de référence unique (`scripts/extract-item-diff.mjs` → `scripts/compose-item-layer.mjs`), pas généré indépendamment ; il garde le cadrage exact du personnage de base et se superpose sans offset en code (§5.3 inchangé), au prix d'un verrouillage à un seul personnage canonique pour l'instant. Exceptions : le slot `background` n'a rien de localisé à extraire par diff (tout le cadre change par définition) — l'asset est pris directement en sortie de génération, cf. `PROMPT_ASSETS.md` §5.1. Le slot `back` (cape, bosse...) est généré comme calque autonome complet plutôt que diff-extrait, pour rester valable derrière n'importe quelle corpulence de robot future — cf. `PROMPT_ASSETS.md` §5.2. Stockage `static/images/items/{code}.png` + `static/images/chests/` (fermé/tremblant/ouvert).

#### 5.9.1 Extension à 350 items — abandonné (décision 2026-07-21, puis 2026-07-22)

Cette section décrivait un catalogue procédural à 353 items généré par thèmes verticaux (`scripts/item-catalog.mjs`, supprimé). Conservée ici uniquement comme trace historique de cette approche abandonnée — voir §5.9 ci-dessus pour l'approche actuelle. Le détail de la répartition par slot/rareté et des exclusifs de level-up n'est plus d'actualité ; à reconstruire au fil de l'ajout manuel des items si la logique de progression (`unlock_level`, exclusifs de coffres) redevient pertinente à plus grande échelle.

---

## 6. Roadmap V2 (9 étapes, chacune déployable seule)

| # | Étape | Volet | Contenu clé |
|---|---|---|---|
| 1 | Fondation moteur | A | `src/lib/modes/` + `engine.svelte.js` + `scoring.js`, iso-fonctionnel tables, suppression code mort, fix bug de préfixe. Zéro migration DB |
| 2 | DB + API multi-modes | A | Migration `game_mode`/`mode_options`, double payload `/api/scores`, leaderboard param `mode` |
| 3 | Mode addition + UI générique | A | `addition.js`, ModeSelector, DifficultySelector, QuestionPanel (posé), NumericKeypad, i18n |
| 4 | Soustraction + mult. étendue + presets | A | `subtraction.js`, `multiplication.js`, presets CE1/CE2, stub division |
| 5 | Leaderboard par mode + équilibrage | A | Filtre mode UI, vérif points/minute entre modes, mise à jour des tests |
| 6 | Pièces d'or | B | Migration gamification, `add_game_rewards`, anti-triche, crédit rétroactif, EndScreen/header/dashboard |
| 7 | Personnage + boutique | B | Tables items/inventory/equipment, `buy_item`, ~20 premiers assets, `/shop`, `/character` |
| 8 | Coffres + récompenses streak | B | `chest_openings`, `/api/chests`, ChestModal, pity, gel de streak |
| 9 | Boosters + finitions | B | Potion ×2, week-end ×2, offres du jour, catalogue complet 42 items, items de niveau |
| 10 | Extension catalogue 350 items | B | `003_item_catalog_expansion.sql` (6 raretés, repricing, `open_chest`/`add_game_rewards` mis à jour), ~305 nouveaux items générés par thèmes, filtre/tri boutique par rareté |

Les volets A et B sont indépendants jusqu'à l'EndScreen : **l'étape 6 peut démarrer en parallèle des étapes 3–5**. Toutes les migrations sont additives — aucune donnée existante (52 users, 423 scores, 381 sessions) n'est modifiée.

### Hors scope V2 (pistes V3)
Mode multijoueur temps réel, sons, `rewards` de `level_definitions`.

### Exclu définitivement (décision produit, 2026-07-19)
MultyFun est un **jeu vidéo avec gamification** dont la mécanique de jeu est le calcul mental — pas un outil pédagogique de suivi de maîtrise. Sont donc explicitement hors périmètre, y compris pour les versions futures :
- adaptativité de la difficulté en cours de partie selon la performance ;
- suivi de maîtrise par notion/table, répétition espacée, ciblage des points faibles.

Les paliers de difficulté choisis en amont d'une partie (CE1/CE2/CM1, §4.5) restent le seul levier de progression pédagogique du jeu.

---

## 7. Spec V2 — Volet C : Défis entre joueurs et badges

> Design documenté ici pour une implémentation ultérieure (non planifiée dans la roadmap §6). Aucun code n'existe encore pour ce volet.

### 7.1 Objectif

Ajouter une dimension sociale légère : un joueur peut défier un autre joueur MultyFun sur un enchaînement de parties (mode + format imposés), le score total déterminant un vainqueur récompensé — sans graphe d'amis ni système d'événements complexe. En complément, un système de **badges/trophées** capitalise sur cette activité (et sur d'autres jalons du jeu), en remplacement de la colonne `unlocked_badges` (JSON, jamais versionnée, jamais exploitée — dette #10, §3).

### 7.2 Défis

- Un joueur choisit un adversaire dans la liste des joueurs MultyFun (simple requête sur `users`/`user_progress` — pas de graphe d'amis à ce stade), un mode de calcul, une durée (2/3/5 min) et un nombre de manches (ex. 3, 5 ou 6).
- Le défi enchaîne ce nombre de manches par joueur, dans le mode/format imposé. Le score du défi est la **somme des scores** de chaque joueur sur ses manches.
- Le vainqueur remporte un **bonus de pièces** en plus des gains classiques de chaque partie (montant à calibrer, cohérent avec l'économie §5.2).
- Cycle de vie : `pending` (envoyé, en attente de réponse) → `declined` ou `active` (accepté, manches en cours) → `completed` (les deux joueurs ont fini leurs manches, vainqueur déterminé).

**Modèle de données** (nouvelle migration `db/migrations/003_challenges_badges.sql`) :

```sql
CREATE TABLE challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  opponent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_mode VARCHAR(20) NOT NULL,
  duration INTEGER NOT NULL CHECK (duration IN (2,3,5)),
  games_count INTEGER NOT NULL CHECK (games_count BETWEEN 3 AND 7),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending|declined|active|completed
  challenger_total INTEGER NOT NULL DEFAULT 0,
  opponent_total INTEGER NOT NULL DEFAULT 0,
  winner_id UUID REFERENCES users(id),
  coins_bonus INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE challenge_games (
  id SERIAL PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_index INTEGER NOT NULL,
  game_session_id UUID REFERENCES game_sessions(id),
  score INTEGER NOT NULL,
  UNIQUE(challenge_id, user_id, game_index)
);

ALTER TABLE user_progress
  ADD COLUMN challenges_issued INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN challenges_won INTEGER NOT NULL DEFAULT 0;
```

**API à prévoir** :

| Endpoint | Rôle |
|---|---|
| `GET /api/players` | Liste des joueurs (username, displayName, niveau, avatar) pour choisir un adversaire |
| `POST /api/challenges` | Créer un défi `{opponentId, gameMode, duration, gamesCount}` |
| `GET /api/challenges` | Mes défis (reçus / envoyés / actifs / terminés) |
| `POST /api/challenges/[id]/respond` | `{accept: bool}` |
| `POST /api/challenges/[id]/games` | Enregistrer le score d'une manche ; recalcule les totaux et, si les deux joueurs ont fini, résout le défi (vainqueur, bonus de pièces, incrément des stats) |

**UI à prévoir** : nouvelle route `/challenges` (liste des joueurs + défis en cours/reçus/terminés) ; intégration au flux `/play` pour verrouiller mode/durée/manche pendant un défi actif ; écran de résultat de défi (deux totaux + vainqueur + bonus).

### 7.3 Badges / trophées

Remplacer `unlocked_badges` par un modèle relationnel cohérent avec le pattern déjà utilisé pour la boutique (`items`/`user_inventory`, §5.7) :

```sql
CREATE TABLE badges (
  code VARCHAR(50) PRIMARY KEY,
  category VARCHAR(20) NOT NULL DEFAULT 'duelist',
  name JSONB NOT NULL,          -- {"fr":"Premier duel","en":...}
  description JSONB NOT NULL,
  icon VARCHAR(10) NOT NULL,    -- emoji
  criteria JSONB NOT NULL       -- {"type":"challenges_won","threshold":1}
);

CREATE TABLE user_badges (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_code VARCHAR(50) NOT NULL REFERENCES badges(code),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_code)
);
```

Premiers badges visés — trophées de duelliste, alimentés par `challenges_issued`/`challenges_won` : « premier défi lancé », « premier défi gagné », paliers de victoires cumulées (5, 10, 25...). Catalogue extensible à d'autres catégories plus tard (niveaux, streaks...).

**UI à prévoir** : un onglet/section badges (sur `/character` ou `/collection`) affichant le catalogue avec état verrouillé/débloqué.
