# MultyFun - Jeu de calcul mental

Application interactive pour pratiquer le calcul mental (tables de multiplication, additions, soustractions, multiplications étendues), développée avec SvelteKit et déployée sur Vercel avec SSR pour sécuriser les scores.

## Fonctionnalités

- Modes de calcul multiples : tables, additions, soustractions, multiplications étendues, avec paliers pédagogiques CE1/CE2
- Deux niveaux (adulte et enfant), 3 durées de partie (2/3/5 min)
- Calcul de score basé sur la vitesse de réponse et la difficulté
- Gamification : pièces d'or, boutique, personnage RPG à calques, coffres au trésor, streaks quotidiens
- Progression par niveaux (XP) avec titres et avatars débloquables
- Tableau des meilleurs scores par mode, filtré par niveau/durée
- Interface responsive (desktop et mobile), PWA installable

## Prérequis

- Node.js 20+
- Compte Neon (Postgres serverless)
- Compte Vercel (déploiement)

## Installation

1. Cloner le dépôt puis installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement :
   - Copier `.env.example` vers `.env`
   - Renseigner `DATABASE_URL` (chaîne de connexion Neon)

3. Démarrer le serveur de développement :
```bash
npm run dev
```

## Base de données

Le schéma et les fonctions PL/pgSQL sont versionnés dans `db/` :
- `db/create_level_definitions.sql`, `db/insert_level_definitions.sql` : les 30 niveaux de progression
- `db/add_user_xp.sql` : fonction historique (conservée en transition)
- `db/migrations/001_game_modes.sql` : colonnes `game_mode`/`mode_options` (modes de calcul)
- `db/migrations/002_gamification.sql` : pièces, boutique, personnage, coffres, streaks

Le catalogue d'items (personnage/boutique) est généré depuis `scripts/item-catalog.mjs` via `scripts/generate-item-placeholders.mjs`, qui produit les placeholders SVG (`static/images/items/`) et le bloc de seed SQL.

## Déploiement sur Vercel

1. Connecter le dépôt GitHub à un projet Vercel
2. Configurer la variable d'environnement `DATABASE_URL` dans l'interface Vercel
3. Déployer

## Structure du projet

- `src/routes` — pages et endpoints API
- `src/lib/modes` — abstraction des modes de calcul (JS pur, testable et partagé client/serveur)
- `src/lib/game` — moteur de jeu (`engine.svelte.js`), scoring, persistance des réglages
- `src/lib/server` — accès DB, session, boutique, coffres (code serveur uniquement)
- `src/lib/components` — composants réutilisables
- `src/lib/translations` — traductions (fr, en, es, zh)

## Tests

```bash
npm test           # Vitest (unitaire + intégration)
npm run check      # svelte-check
```

## Licence

MIT
