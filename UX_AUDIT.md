# Rapport d'étonnement UX — MultyFun

> Audit UX réalisé le 2026-07-19, sur l'état du code de la V1 en production (52 comptes, 423 scores, 381 sessions) au regard de la V2 déjà spécifiée dans [`SPEC.md`](./SPEC.md) mais non encore implémentée. Rédigé du point de vue d'un regard extérieur (senior UX), pour servir de guide d'amélioration aux prochaines versions.
>
> Public cible du produit : enfants de CE1/CE2 (7-9 ans), avec supervision adulte/parentale attendue mais actuellement absente du parcours.

---

## 1. Résumé exécutif

MultyFun part d'une base pédagogique et éthique inhabituellement soignée pour son stade : génération de questions rigoureuse, scoring équitable, gamification pensée sans dark patterns. La V2 déjà spécifiée dans `SPEC.md` (multi-modes, pièces, boutique, personnage RPG, coffres, streaks) comble intelligemment la plupart des trous de rétention identifiés ci-dessous.

Mais trois zones de dette concentrent l'essentiel du risque UX :
1. **Aucune adaptativité pédagogique** — le jeu ne s'ajuste jamais au niveau réel de l'enfant en cours de partie, et ne retient aucune notion de maîtrise par table/notion.
2. **Authentification et contrôle parental quasi absents** — un point sensible pour un produit destiné à des enfants.
3. **Accessibilité très en retrait** — peu d'aria-labels, forte dépendance aux emojis comme seul label sémantique, aucune gestion du `prefers-reduced-motion`.

Le reste du rapport détaille point par point ce qui fonctionne bien, ce qui fonctionne moins bien, ce qui est étrange, et propose des recommandations priorisées.

---

## 2. Ce qui fonctionne bien

### Rigueur pédagogique de la génération de questions
- `src/lib/modes/generator-utils.js` construit les nombres **chiffre par chiffre** pour garantir ou exclure exactement une retenue/un emprunt (`genAdditionWithCarry`/`genAdditionNoCarry`, `genSubtractionWithBorrow`/`genSubtractionNoBorrow`), plutôt qu'un rejet aléatoire approximatif. C'est un choix technique juste et rare à ce niveau de soin.
- `src/lib/modes/tables.js` utilise une **matrice de difficulté cognitive 10×10** calée sur la recherche en didactique (pic à 7×7 = 3.0), pas une difficulté uniforme.
- Chaque mode (addition, soustraction, multiplication) est organisé en **paliers pédagogiques explicites** (A1-A6, S1-S5, M1-M5) avec une échelle de difficulté commune 0.5-3.0, permettant de comparer et d'équilibrer les modes entre eux (`SPEC.md` §4.5).

### Présentation fidèle à l'école française
- `QuestionPanel.svelte` bascule automatiquement en affichage **"opération posée en colonnes"** pour les additions/soustractions à partir de 2 chiffres — reproduit la technique opératoire enseignée en classe, plutôt qu'un simple "a + b = ?" générique.

### Scoring équitable et bien pensé
- `src/lib/game/scoring.js` : `points = 15 × difficulté × ratio(temps restant / temps alloué)`, avec un plancher à 25% — une bonne réponse lente rapporte toujours un peu (motivation CE1), et le ratio rend le score **insensible** au multiplicateur de temps enfant (×3) et comparable entre une table (8s) et une addition posée (40s). Un vrai souci de cohérence inter-modes.

### Pas de sanction brutale
- Le moteur (`engine.svelte.js`) n'implémente **aucun système de vies/game over** : une erreur coûte du temps, jamais la partie. Choix explicitement adapté à un public enfant, évite la frustration et l'abandon.

### Gamification pensée sans dark patterns
- `SPEC.md` §5.1 formule des principes explicites et suivis dans le code : pas d'achat réel, pas de publicité, catalogue de boutique entièrement visible (pas de FOMO type "aujourd'hui seulement"), doublons de coffres toujours convertis positivement.
- Le système de coffres (`db/migrations/002_gamification.sql`) a une **hygiène anti-frustration** remarquable : tirage 100% serveur, pity system (un coffre quotidien vide 9 fois de suite garantit un objet), doublons remboursés à 50% du prix avec message positif ("Tu l'as déjà ! +250 🪙").
- Le **gel de streak** (freeze) reconnaît qu'un enfant ne maîtrise pas son emploi du temps : un jour manqué avec un freeze disponible ne casse pas la série, contrairement à la dureté classique des streaks d'apps adultes.

### Identité visuelle cohérente
- Polices Baloo 2 / Comic Neue, boutons à effet "3D" (`box-shadow` qui se déplace au clic), animations bounce/pulse/confetti : un univers enfantin cohérent, ludique sans être criard.
- Le personnage RPG en **calques d'images empilées** (`CharacterAvatar.svelte`, 8 slots) est un choix de production intelligent : simple à générer (PNG 512×512 alignés sur un même canvas), pas de logique de positionnement en dur, réutilisable à 3 tailles (nav 40px / dashboard 150px / page dédiée 300px).

### PWA correctement câblée
- `vite.config.js` + `@vite-pwa/sveltekit` : cache Workbox, fallback offline, prompt d'installation, manifest avec icônes complètes — une base technique solide et rare d'être aussi bien branchée dès la V1.

---

## 3. Ce qui fonctionne moins bien

### Aucune adaptativité pédagogique en cours de partie
La difficulté est figée par la sélection de paliers/tables faite **avant** de démarrer la partie. Rien n'ajuste le mix de questions en temps réel selon la performance : pas de montée en difficulté après une série de bonnes réponses, pas d'allègement après plusieurs erreurs. Un enfant fort et un enfant en difficulté qui choisissent le même préréglage voient exactement le même flux de questions.

### Aucun suivi de maîtrise par notion
XP = score de la partie, 1:1 (`add_game_rewards()`, `002_gamification.sql:206` ; confirmé côté API `src/routes/api/scores/+server.js:122`, `xpEarned: score`). C'est une mesure de **volume**, pas de **maîtrise** :
- `tables_used`/`mode_options` sont enregistrés en base à chaque partie mais **jamais relus** pour biaiser la génération de questions futures.
- Aucune trace de répétition espacée, de score de maîtrise par table, ou de ciblage des points faibles dans tout le code (confirmé par recherche exhaustive : aucun hit sur "weak"/"spaced"/"mastery"/"adaptive" hors chaînes de traduction).

C'est le plus gros écart entre la promesse produit ("continuer à pratiquer et progresser") et l'implémentation actuelle, qui ne mesure que le temps de jeu cumulé.

### Des signaux calculés mais jamais montrés à l'enfant
- `errorsCount` est tracké par le moteur et validé côté serveur, mais **n'est affiché nulle part** sur l'écran de fin (`EndScreen.svelte:11` reçoit la prop mais ne la rend pas) — aucun retour sur le taux de réussite.
- `freeze_used` (le fait qu'un gel de streak vient de sauver la série) est calculé et renvoyé par l'API (`002_gamification.sql:127,164,240` ; `+server.js:106`) mais **jamais lu** côté `EndScreen.svelte` ou `LevelUpModal.svelte` — un moment de réassurance ("ton bouclier t'a sauvé !") est perdu alors qu'il est déjà calculé.

### Asymétrie invité / connecté
Un joueur non connecté peut jouer (`/play` est public) mais n'a accès à **aucune** gamification : pas de pièces, pas de coffres, pas de streak. L'écran de fin pour un invité est beaucoup plus pauvre que pour un compte connecté — c'est cohérent techniquement, mais l'occasion de "vendre" l'inscription à ce moment précis (juste après avoir vu ce qu'il manque) n'est pas exploitée.

### Aucune fonctionnalité sociale réelle
Le seul élément compétitif est un `Leaderboard.svelte` **global et anonyme**, filtré par mode/niveau/durée. Pas d'amis, pas de défis, pas de multijoueur. Pour un enfant, il y a peu de chances qu'il reconnaisse quelqu'un dans ce classement — la force de rappel social d'un leaderboard entre pairs connus est largement plus forte que celle d'un classement anonyme mondial.

### Courbe de progression XP irrégulière
Les seuils dans `insert_level_definitions.sql` semblent calés à la main plutôt que sur une formule : paliers larges et incohérents autour des niveaux 13-15 (+18k puis +8k XP), puis la courbe s'aplatit complètement sur les niveaux 21 à 30 (+10 000 XP partout, comme au tout début) — l'impression de "fin de partie plus dure à atteindre" s'estompe juste au moment où elle devrait culminer.

### Incohérences d'expérience mineures
- Message d'erreur explicite si 0 table sélectionnée (mode "tables"), mais simple bouton désactivé sans explication visible pour les autres modes (`StartScreen.svelte:39`) — un enfant ne comprend pas pourquoi il ne peut pas démarrer.
- Durées de partie figées à 2/3/5 minutes, sans indication de ce qui les différencie pédagogiquement.
- Mode division entièrement codé mais désactivé (`division.js:45 enabled:false`) — cohérent avec la roadmap V3, mais à ne pas laisser une éventuelle mention "division" trainer dans un support marketing avant activation réelle.

---

## 4. Ce qui est étrange / surprenant

### Authentification sans aucun contrôle parental
Le point le plus surprenant de l'audit pour un produit visant des enfants avec supervision adulte attendue :
- L'inscription (`src/routes/register/+page.svelte`) ne demande qu'un prénom et **un emoji "secret"** choisi parmi 18 valeurs fixes (`passwordChars`) — aucune adresse e-mail, aucun contact parent.
- Côté serveur, la comparaison se fait en **clair** (`login/+server.js:15-30`), sans hachage, sans limitation de tentatives (rate limiting) — avec seulement 18 valeurs possibles, un compte est trivialement forçable par force brute.
- Les messages d'erreur distincts ("Utilisateur non trouvé" vs "Mot de passe incorrect") permettent l'**énumération d'utilisateurs**.
- Aucun mécanisme de récupération de compte : un enfant qui oublie son prénom exact ou son emoji n'a aucun recours self-service, et aucun parent n'est enregistré pour l'aider.
- C'est un choix assumé et documenté dans `SPEC.md` §3 point 4 ("sécurité faible, choix assumé enfants, pas de changement prévu") — mais l'absence totale de lien parent (pas de consentement, pas de dashboard parental, pas d'e-mail de secours) va au-delà d'un simple compromis de simplicité et mérite d'être retestée à la lumière de l'attente produit de "supervision adulte".

### Routes de debug potentiellement exposées en production
`/debug-print/[level]` et `/debug-score` ne présentent aucune garde d'environnement détectée dans le code exploré — à vérifier et gater derrière un contrôle d'environnement ou un rôle admin.

### Petites incohérences de finition
- Couleur du thème PWA (`#5B21B6`, violet) différente de la couleur primaire in-app (`#4d57ff`, bleu) — l'icône installée et l'app elle-même ne racontent pas tout à fait la même identité.
- Le manifest référence des captures d'écran (`screenshots`) absentes du dossier `static/`.
- `package.json` porte encore le nom `svelte-multiplication-game-kit`, trace du scaffold d'origine, déphasé par rapport au branding "MultyFun".
- La bascule mobile/desktop se fait uniquement sur la largeur de fenêtre (`< 768px`), pas sur la capacité tactile réelle — un écran tactile large peut se retrouver avec un champ `readonly` sans clavier numérique affiché.
- La déconnexion force un rechargement complet de page (`window.location.href = '/'`) plutôt qu'une navigation SPA fluide.

---

## 5. Accessibilité — un constat transverse à traiter en priorité

Sur l'ensemble des composants explorés, les attributs `aria-*`/`role`/`tabindex` n'apparaissent que dans une poignée d'endroits (`QuestionPanel.svelte`, `NumericKeypad.svelte`, `ChestModal.svelte`, `NavigationHeader.svelte`). Le reste de l'application — le plateau de jeu, les sélecteurs de mode/difficulté/tables, la boutique, le personnage, le leaderboard — n'a aucun labeling explicite.

Autres points :
- Forte dépendance aux **emojis comme seul contenu sémantique** de boutons (🪙 🔥 🚪 🏆) sans texte alternatif pour les lecteurs d'écran.
- Aucune région `aria-live` pour annoncer les changements de feedback ou de minuteur.
- Aucune gestion de `prefers-reduced-motion` malgré des animations fréquentes (bounce, pulse, confettis), un point sensible pour les utilisateurs sensibles aux stimulations vestibulaires.
- Le focus automatique sur le champ de réponse à chaque nouvelle question est une bonne pratique pour le flux de jeu, mais pourrait désorienter un utilisateur de technologie d'assistance si les changements ne sont pas annoncés.

Pour un produit destiné à des enfants (dont certains à besoins spécifiques) et à leurs parents, c'est un chantier à ne pas reporter indéfiniment à "plus tard".

---

## 6. Recommandations priorisées

### Quick wins (effort faible, impact direct)
- Afficher `errorsCount` et le fait qu'un `freeze_used` a sauvé le streak sur l'écran de fin — les données existent déjà, il ne manque que l'affichage.
- Ajouter un message de validation visible (pas seulement un bouton désactivé) sur tous les modes, pas seulement "tables".
- Corriger l'incohérence de couleur manifest/app, ajouter les captures d'écran manquantes du manifest.
- Vérifier/gater les routes `/debug-print` et `/debug-score` en production.
- Premier passage d'accessibilité : aria-labels sur les boutons à icône/emoji, `prefers-reduced-motion` sur les animations existantes.

### Structurel, à intégrer à la roadmap V2 déjà écrite
- Ajouter une légère brique de contrôle parental à l'inscription (email parent optionnel servant à la récupération de compte), sans complexifier l'inscription de l'enfant lui-même.
- Renforcer l'authentification a minima : rate limiting sur `/api/auth/login`, message d'erreur générique unique (ne plus distinguer "utilisateur inconnu" de "mot de passe incorrect").
- Revoir la courbe XP des niveaux 13 à 30 pour une progression plus régulière, en particulier sur la seconde moitié qui s'aplatit.
- Profiter de l'écran de fin invité pour amener explicitement la conversion vers un compte, en montrant concrètement ce que débloquerait l'inscription (pièces, coffres, streak).

### Vision produit, au-delà de la V2 actuelle
- Introduire un vrai **suivi de maîtrise par table/notion**, avec priorisation des questions sur les points faibles identifiés (répétition espacée légère) plutôt qu'un tirage uniforme dans les paliers sélectionnés.
- Ajouter une **difficulté qui s'ajuste en cours de partie** selon la série de réussites/échecs récente, en plus des paliers choisis en amont.
- Introduire une dimension sociale légère et sûre pour des enfants (défi à un ami via un code, classement limité à un petit groupe) plutôt qu'un unique leaderboard anonyme mondial.

---

## 7. Conclusion

MultyFun part avec des fondations pédagogiques et une éthique de gamification déjà matures pour son stade — la génération de questions, le scoring et le système de coffres sont particulièrement bien pensés. La V2 déjà spécifiée dans `SPEC.md` répond à une grande partie des lacunes de rétention identifiées ici (pièces, boutique, personnage, streaks).

Mais elle gagnerait à être livrée en même temps qu'un traitement de la dette de sécurité/contrôle parental et d'accessibilité, plutôt qu'après — ce sont des risques qui grandissent avec le succès du produit, pas qui se résolvent d'eux-mêmes. Et au-delà de la V2, le chantier le plus structurant à moyen terme reste de faire évoluer la mesure de progression du **volume de jeu** vers une véritable **mesure de maîtrise**, pour tenir la promesse pédagogique du produit.
