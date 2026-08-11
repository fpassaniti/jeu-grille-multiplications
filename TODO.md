# TODO

### Nouvelle fonctionnalités

- Nouvelle page profil, ou on pourra :
  - [x] changer de mode adulte/enfant (nouvelle fonctionnalité)
  - voir son niveau, son nombre de partie, expérience etc
  - mais on pourra aussi voir les badges débloqués (nouvelle fonctionnalité)

- Système de badges 
  - on pourra en faisant des parties débloquer des badges. 
    - On va avoir des badges pour 5 / 20 / 50 / 100 / 500 parties de chaque type de calcul/parties
    - On peut aussi avoir des badges où il faut faire des parties avec certains équipement, par exemple les haillons ou autre, donc badge a définir et penser

- [x] Classement général (fait le 2026-08-11, voir SPEC.md §2.1/§2.4)
  - en tant qu'adulte ou enfant, je me compare à tous les autres joueurs du site, avec un classement général, par niveau/xp
  - route publique `/ranking` (+ `GET /api/ranking`), top 20 par mode adulte/enfant + position du joueur connecté hors top 20


### Ajustement

On va simplifier la partie enfant / adulte, voici les changements :
- [x] un compte utilisateur, dès l'inscription, sera enfant ou adulte, il pourra changer de mode dans sa page profil, mais attention un record fait en adulte, n'apparaitra pas dans le classement enfant si on passe de adulte à enfant. Donc attention aux abuts de ce type : quand on enregistre la performance d'une partie, cela doit continué d'être associé à enfant ou adulte. (fait le 2026-08-10, voir SPEC.md §8 — page /profile minimale créée, à enrichir plus tard avec niveau/XP/badges)
- [x] on n'a plus besoin d'avoir ce choix quand on lance une partie, on saura de base si l'utilisateur va jouer en mode enfant ou adulte.

- [x] On va créer de nouvelle potions à acheter dans la boutique, mais également ajouter un emplacement dans la partie personnage où on peut voir son coffre de potion, pour voir toutes les potions déjà achetées
  voici les nouvelles potions à créer et coder :
    - Bonus de temps : rajout de 10, 20, 30 secondes : quand on active cette potion permet de ralonger du temps pendant une partie
    - Bonus de temps : permet de ne pas terminer la partie immédiatement à la fin du chrono si on n'a pas encore répondu au dernier calcul
    - Multiplicateur de gain de pièce d'or : x2, x3, x5
    - Gel de streak : 1 jour, 2 jour, 5 jours, 2 semaines
    je te laisse définir un prix cohérent pour chaque potion
  (fait le 2026-08-11, voir SPEC.md §5.6bis — catalogue générique `potions`/`user_potions`, sélection avant partie sur `/play`, coffre sur `/character`, gel de streak généralisé à un écart multi-jours dans `add_game_rewards`)

- [x] Sur la page d'accueil, agrandir le personnage un peu, on a de la marge donc prenons là pour mieux voir le personnage en mode desktop

### FIx

- [x] Dans la home, les boutons collection et imprimer n'ont plus lieu d'être, ils peuvent être retiré, et les pages et fonctions associées également (fait le 2026-08-11 : suppression de `/collection`, `/debug-print`, `PrintableCard.svelte`, `LevelAvatar.svelte`, `template-loader.js`, `image-paths.js` et des clés de traduction associées)