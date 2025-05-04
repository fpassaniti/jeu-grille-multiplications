# Jeu de Multiplication - SvelteKit

Application interactive pour pratiquer les tables de multiplication, développée avec SvelteKit et déployée sur Vercel avec SSR pour sécuriser les scores.

## Fonctionnalités

- Jeu de multiplication interactif avec deux niveaux (adulte et enfant)
- Sélection personnalisée des tables à pratiquer
- Calcul de score basé sur la vitesse de réponse
- Tableau des meilleurs scores sécurisé
- Interface responsive (desktop et mobile)
- Sauvegarde des scores dans Supabase avec validation côté serveur

## Prérequis

- Node.js 18+
- Compte Vercel
- Compte Supabase (base de données)

## Installation

1. Cloner le dépôt :
```bash
git clone https://github.com/votre-nom/svelte-multiplication-game-kit
cd svelte-multiplication-game-kit
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer les variables d'environnement :
    - Copier `.env.example` vers `.env`
    - Compléter avec vos identifiants Supabase

4. Démarrer le serveur de développement :
```bash
npm run dev
```

## Configuration de Supabase

1. Créer un nouveau projet sur [Supabase](https://supabase.com)

2. Créer une table `scores` avec la structure suivante :

```sql
CREATE TABLE scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  score INTEGER NOT NULL,
  level TEXT NOT NULL,
  duration INTEGER NOT NULL,
  cells_solved INTEGER,
  total_cells INTEGER,
  tables_used INTEGER[],
  date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour améliorer les performances des requêtes
CREATE INDEX idx_scores_level ON scores(level);
CREATE INDEX idx_scores_score ON scores(score);
```

3. Configurer les politiques de sécurité RLS (Row Level Security) :

```sql
-- Activer RLS
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre à tous les utilisateurs de LIRE les scores
CREATE POLICY "Scores are viewable by everyone" 
ON scores FOR SELECT 
USING (true);

-- Politique pour permettre l'insertion uniquement via l'API sécurisée
CREATE POLICY "Scores can only be inserted via api" 
ON scores FOR INSERT 
USING (auth.role() = 'service_role');
```

## Déploiement sur Vercel

1. Créer un nouveau projet sur [Vercel](https://vercel.com)

2. Connecter le dépôt GitHub

3. Configurer les variables d'environnement dans l'interface Vercel :
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
    - `VITE_SUPABASE_SERVICE_KEY`

4. Déployer l'application

## Structure du Projet

Le projet suit la structure standard de SvelteKit :

- `src/routes` - Pages et endpoints API
- `src/lib` - Composants, stores et utilitaires
- `src/lib/components` - Composants réutilisables
- `src/lib/stores` - Stores Svelte pour la gestion d'état
- `src/lib/utils` - Fonctions utilitaires

## Sécurité

Les principales améliorations de sécurité par rapport à la version originale :

1. **Validation côté serveur** : Toutes les données sont validées côté serveur avant l'insertion
2. **Clé de service** : Utilisation d'une clé de service privée pour les opérations sensibles
3. **API Routes sécurisées** : Les endpoints API gèrent l'insertion des scores de manière sécurisée
4. **Row Level Security** : Configuration RLS dans Supabase pour restreindre les insertions

## Licence

MIT