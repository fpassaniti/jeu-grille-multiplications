# PROMPT_ASSETS — Génération des assets d'équipement du personnage

> Guide pratique pour produire l'art des items de la boutique MultyFun (`items.asset_url`). Référencé depuis `SPEC.md` §5.9.

---

## 1. Constat

**Mise à jour 2026-07-22** : le catalogue procédural à 353 items (placeholders SVG générés automatiquement, `scripts/item-catalog.mjs`/`scripts/generate-item-placeholders.mjs`) a été abandonné — la table `items` a été entièrement vidée (`db/migrations/005_items_reset.sql`, voir `SPEC.md` §5.9). Il n'y a plus de placeholder d'aucune sorte : chaque item n'existe en base qu'à partir du moment où son vrai art est produit et ajouté via `scripts/add-shop-item.mjs` (§6). Ce document décrit comment produire cet art, un item à la fois, avec un style cohérent avec les images de niveau existantes (`static/images/levels/level_N.png`).

## 2. Point d'attention technique — pipeline de compositing (tranché 2026-07-22)

`SPEC.md` §5.3 décrit un pipeline où chaque item est dessiné **directement sur le canvas du personnage complet**, à la même position exacte que le corps de base, pour que l'empilement en `<img>` absolument positionnées fonctionne sans offset en code.

Une version précédente de ce document mettait en doute la fiabilité de cette approche (crainte d'un désalignement pixel entre générations séparées) et recommandait de générer chaque item seul puis de le positionner via `offset_x`/`offset_y`/`scale` stockés en base. **Testé et infirmé** (`item-art/`, 2026-07-22) : en éditant itérativement une seule image de référence avec Nano Banana (fond chroma-key, un ajout à la fois — voir `item-art/raw/robot-unit01/`) plutôt qu'en générant chaque item indépendamment, le cadrage reste parfaitement stable d'une édition à l'autre. La crainte initiale s'appliquait à un mode de génération plus faible (générations indépendantes sans référence partagée), pas à l'édition itérative.

**Approche retenue : calque plein cadre.** Chaque item exporté (`scripts/extract-item-diff.mjs`) garde le cadrage exact et la résolution native de l'image dont il est extrait — transparent partout sauf la zone de l'accessoire (exceptions : le slot `background`, plein cadre **opaque**, voir §5.1 — rien à préserver derrière puisqu'il est toujours au z-index le plus bas ; le slot `back`, plein cadre transparent mais généré comme item **autonome**, sans édition ni soustraction, voir §5.2). `CharacterAvatar.svelte` continue d'empiler de simples `<img>` sans aucun offset en code (§5.3 inchangé), et **aucune colonne `offset_x`/`offset_y`/`scale` n'est ajoutée** au schéma `items`.

**Contrepartie assumée** (accessoires diff-extraits par édition, ex. `hat`/`weapon`/`outfit`/`aura`/`pet`/`body`) : ils sont verrouillés à un seul personnage de base (le robot de `item-art/raw/robot-unit01/`) — un accessoire ne peut pas être réutilisé tel quel sur un autre corps, puisque leur cadrage/silhouette diffère. Décision : rester sur ce seul corps canonique tant qu'un autre corps n'a pas lui-même besoin de vrai art. Si ce besoin apparaît, ce choix (calque plein cadre vs `offset_x/y/scale`) devra être revu — probablement en régénérant un jeu d'accessoires par corps plutôt qu'en réintroduisant un système d'offset, `object-fit: contain` rendant déjà les deux approches équivalentes visuellement une fois qu'un asset est correctement cadré. **Le slot `back` échappe volontairement à cette contrepartie** (§5.2) : un item ample (cape, sac à dos) diff-extrait contre ce seul robot ne contiendrait que les pixels réellement rendus dans son ombre — un robot plus maigre laisserait apparaître des trous (zones jamais rendues, pas juste masquées à tort). D'où le choix de le générer en calque autonome complet dès maintenant, plutôt que d'attendre qu'un futur corps révèle le problème.

## 3. Outil recommandé

**Recommandation principale : Gemini 2.5 Flash Image ("Nano Banana")**, via Google AI Studio (aistudio.google.com) ou l'API Gemini.
- Excelle en cohérence de style/personnage sur des éditions successives à partir d'une image de référence (garder le même trait/palette sur 40+ générations).
- Rapide et économique — adapté à l'itération en volume nécessaire ici (42+ items).
- Bon support du fond transparent et de l'édition guidée par image de référence.

**Alternative : Recraft** (recraft.ai) — spécialisé dans le verrouillage d'un style cohérent sur un gros catalogue d'icônes/illustrations via une référence de style réutilisable (un ID de style appliqué à toutes les générations). À considérer si le catalogue grossit significativement au-delà des 42 items de lancement, ou si Gemini dérive trop en style sur de longues séries.

## 4. Prompt de référence — corps de base

À générer **une seule fois**, réutilisé comme image de référence pour toutes les éditions suivantes (garantit la cohérence du style de trait/palette *et* l'alignement, §2 — toutes les éditions ultérieures partent de cette même image, jamais d'une nouvelle génération indépendante) :

> Cute round mascot creature, front-facing, standing pose, centered in frame, flat cartoon illustration style, thick bold black outlines (4-6px), vivid saturated flat colors, no gradients except a simple flat highlight, simple dot eyes with big pupils, friendly smile, chibi proportions (large head, small body), **solid flat green background (chroma-key, not transparent)**, 1024x1024, matches the style of a children's math-learning game mascot, plain bare body only, light violet/blue base tone, no clothing, no accessories.

**Fond vert, pas "transparent"** : demander un fond transparent produit un damier grisé dessiné en dur dans les pixels (pas de vrai canal alpha, vérifié sur les générations JPEG) — un fond vert uni se détoure ensuite de façon fiable par distance de couleur (`scripts/extract-item-diff.mjs`), alors que parser un damier ne l'est pas.

## 5. Prompt gabarit — par item (édition en place, §2/§6)

À utiliser en **édition guidée par image sur `item-art/raw/robot-unit01/base.jpg`** (ou l'édition précédente de la même chaîne) — pas une génération indépendante : le personnage, la pose et le cadrage doivent rester identiques, seul l'ajout demandé change (§2 : c'est ce qui garantit l'alignement, testé et validé).

> Edit the attached reference image: add a **{ITEM_DESCRIPTION}** to the **'{SLOT}'** equipment slot, styled for **{RARITY}** rarity ({RARITY_NOTE}). Keep everything else in the image exactly unchanged — same character, same pose, same camera framing, same proportions, same flat cartoon style with thick black outline and vivid flat colors, same background. Only the described addition should differ from the reference.

### Notes de rareté (`{RARITY_NOTE}`)

6 raretés (`SPEC.md` §5.2) :

| Rareté | Note de style |
|---|---|
| Commun | Simple, sans effet, silhouette basique |
| Peu commun | Une touche de couleur/texture, encore sobre |
| Rare | Une couleur d'accent + léger reflet |
| Épique | Accents type gemme/lueur, un peu plus orné |
| Légendaire | Liseré doré + motif particules/étincelles |
| Mythique | Liseré prismatique/arc-en-ciel + effet de lueur le plus marqué du catalogue — doit se distinguer visuellement de légendaire au premier coup d'œil |

### Exemples de remplissage (idées de contenu, pas un catalogue existant)

| Slot | Item | Rareté | `{ITEM_DESCRIPTION}` suggérée |
|---|---|---|---|
| `hat` | Couronne dorée | Légendaire | "a golden royal crown with jewels" |
| `weapon` | Épée laser des maths | Légendaire | "a glowing laser sword shaped like a multiplication sign" |
| `pet` | Bébé dragon | Épique | "a small cute baby dragon companion, sitting" |
| `outfit` | Tunique de mage | Rare | "a wizard's tunic with stars embroidered" |
| `back` | Ailes de chauve-souris | Épique | "a pair of small bat-like wings" |
| `background` | Galaxie | Légendaire | "a swirling starry galaxy backdrop" |
| `aura` | Étincelles | Épique | "a ring of sparkling light particles around the wearer" |
| `body` | Blob bleu | Commun | "a simple round blue blob body variant" |

### Fragments de prompt spécifiques par slot (`item-art/scripts/generate-item-art.mjs`, `buildAccessoryPrompt`)

Le gabarit générique ci-dessus est complété par des fragments ajoutés selon le slot (slots réellement diff-extraits uniquement — `back` n'y figure plus, voir §5.2) :

| Slot | Fragment ajouté |
|---|---|
| `aura` | l'aura doit entourer le robot, sans détail devant lui |
| `pet` | positionné en bas à droite, sur le côté, au sol |
| `weapon` | main refermée sur la poignée, élément gardé sur le côté, ne couvrant pas le reste du corps |
| `hat` | peut dépasser du cadre, la position prime sur le fait de couper l'item |

## 5.1 Cas particulier — slot `background` (pas de soustraction)

Le principe de soustraction (§6 étapes 3-5) suppose qu'une petite zone localisée change entre l'image de base et la variante — vrai pour un accessoire porté, faux pour un décor : le but même d'un item `background` est de repeindre tout le cadre, donc la diff ne capture pas un « ajout » mais toute la scène (observé en pratique sur `decor-jardin` : une région quasi plein cadre plus un éclat isolé entre les jambes du robot, là où le fond perce un trou de la silhouette).

**Ne pas envoyer l'image de référence** (correctif retenu après coup, voir « fuite de contenu » ci-dessous) : deux premiers essais envoyaient l'image canonique en demandant explicitement d'exclure le robot du résultat — le robot est réapparu dans l'image générée à chaque fois, malgré la négation. `generate-item-art.mjs` (`buildBackgroundPrompt`, `processItem`) :
- **n'envoie aucune image** à Gemini pour ce slot (`basePath: null` dans l'appel `callGemini`) — décrit à la place, en dur dans le prompt, la ligne de sol et l'angle de caméra canoniques (`CANONICAL_FLOOR_LINE`/`CANONICAL_CAMERA`, dérivés une fois par inspection visuelle de `base.jpg`) ;
- demande explicitement l'absence du robot/de tout personnage (et de son ombre au sol) dans le résultat, ainsi que le remplacement total du fond vert chroma-key par une scène opaque plein cadre ;
- demande explicitement l'absence de cadre/bordure/vignette décoratifs (les notes de rareté légendaire/mythique parlent de « liseré doré »/« liseré prismatique », qui pourraient sinon être lues comme une bordure autour de l'image plutôt qu'un motif dans la scène).

Une fois l'image validée par l'humain (même boucle de confirmation que les accessoires), le script saute entièrement les étapes 3 à 5 du §6 : il écrit directement `<slug>_layer.png` via `sharp` (`png({ compressionLevel: 9, effort: 10 })` — la compression PNG par défaut de `compose-item-layer.mjs` produit un fichier ~4× plus lourd sur une scène entièrement peinte, le bruit JPEG source compressant mal), avec un contrôle de dimensions contre l'image de base (recadrage `fit: 'cover'` en cas d'écart) puisque le garde-fou équivalent d'`extract-item-diff.mjs` ne s'applique plus ici.

### Fuite de contenu (« content/conditional image leakage ») — pourquoi pas d'image de référence

Envoyer une image en conditionnement à un modèle d'édition/génération d'image le pousse à en reproduire le contenu, même si le texte demande explicitement l'inverse — un signal d'image dense pèse plus, dans les mécanismes d'attention du modèle, qu'une négation textuelle. C'est un phénomène documenté dans la littérature (« content leakage » / « conditional image leakage » — *StyleKeeper: Prevent Content Leakage using Negative Visual Query Guidance*, ICCV 2025 ; *Less is More: Masking Elements in Image Condition Features Avoids Content Leakages in Style Transfer Diffusion Models* ; *thu-ml/cond-image-leakage*, NeurIPS 2024), pas une anomalie propre à Nano Banana. Les correctifs de la littérature agissent à l'intérieur du modèle (masquage de features d'attention) — inaccessibles via l'API publique Gemini, qui n'expose que deux modes de fait (édition « garde tout, change X » ou composition multi-images à haute fidélité « conserve l'identité du sujet »), aucun mode « référence pour la géométrie seulement, sujet exclu ». La seule parade fiable côté prompt : ne pas envoyer l'image du tout quand son contenu ne doit pas apparaître, et décrire numériquement à la place ce dont on a besoin. S'applique à `background` (ci-dessus) et `back` (§5.2).

## 5.2 Cas particulier — slot `back` (calque autonome, pas d'édition)

Un item `back` (cape, bosse, sac à dos...) pourrait sembler être un simple accessoire porté comme `hat` ou `weapon`, mais deux essais réels ont montré que le pipeline diff ne convient pas :
1. **Composition** : un premier essai (pipeline diff classique, robot présent) a généré une cape drapée **devant** le robot façon poncho plutôt que dans le dos — la caméra canonique étant strictement frontale, un vêtement réellement dans le dos n'a presque rien à montrer de face, donc le modèle le rend visible en le ramenant devant.
2. **Fragilité structurelle** : même un item diff-extrait correctement composé (`dos-jetpack`, livré et fonctionnel) reste verrouillé à la silhouette exacte du robot canonique (§2) — l'extraction ne contient que les pixels réellement rendus contre ce robot précis. Un item `back` ample (cape) qui dépasse la silhouette montrerait des trous dès qu'un robot de corpulence différente serait dessiné par-dessus (zones jamais rendues dans l'image source, pas juste masquées à tort). `dos-jetpack` n'est donc pas un précédent à généraliser à de futurs items `back` volumineux.

D'où le traitement retenu, même famille que `background` (`buildBackAccessoryPrompt`, aucune image de référence envoyée pour la même raison de fuite de contenu — voir ci-dessus) mais pour un calque **transparent** plutôt qu'opaque :
- l'item est décrit et généré **seul, en entier**, sans jamais supposer qu'un corps le cache déjà partiellement — c'est le corps (dessiné par-dessus, z-index supérieur, §5.3 de `SPEC.md`) qui cachera ce qu'il faut selon sa propre silhouette, quelle qu'elle soit ;
- ancrage numérique volontairement lâche aux épaules (`CANONICAL_SHOULDER_LINE`/`CANONICAL_SHOULDER_SPAN`) — un repère approximatif, pas une contrainte pixel-perfect, puisque l'item doit tolérer plusieurs corpulences à venir ;
- fond vert chroma-key classique (pas de scène plein cadre opaque comme `background` — l'item doit rester transparent autour de lui-même).

Post-génération : pas de diff (rien à comparer à une base), pas de scène à remplir en opaque — un simple **détourage chroma-key mono-image** (nouvelles fonctions locales `sampleCornerKeyColor`/`stripChromaKey` dans `generate-item-art.mjs`, même principe que `sampleKeyColor`/`removeGreenScreen` d'`extract-item-diff.mjs` mais réimplémenté en quelques lignes — ce script exécute `main()` sans garde d'import, ses fonctions ne sont pas réutilisables directement). Écrit directement `<slug>_layer.png`, en sautant les étapes 3 à 5 du §6 comme `background`.

## 6. Process (un item à la fois)

1. Générer/valider `item-art/raw/robot-unit01/base.jpg` (fond vert) — image de référence unique, réutilisée pour toutes les éditions (§2 : un seul personnage canonique pour l'instant).
2. Éditer itérativement cette image avec Nano Banana, **un ajout à la fois** — sauver chaque édition sous `item-art/raw/robot-unit01/<slug>.jpg`.
3. Extraire (sauf slots `background`/`back`, voir §5.1/§5.2) : `node scripts/extract-item-diff.mjs --base item-art/raw/robot-unit01/base.jpg --variant item-art/raw/robot-unit01/<slug>.jpg --name <slug>` — écrit les crops `diff_asset_N.png` et un manifeste `<slug>_regions.json` dans `item-art/extracted/<slug>/`. Ce script s'arrête là, il ne construit jamais lui-même le calque final.
4. Revue humaine des crops : vrai ajout vs bruit JPEG. **Si un bout de robot non voulu est réellement connecté** à l'ajout (silhouettes qui se touchent, ex. une mitaine collée à l'armure de jambe voisine — aucun seuillage ne peut alors les séparer), ouvrir le `_diff_asset_N.png` concerné dans un éditeur d'image et effacer directement les pixels en trop, avant de passer à l'étape suivante.
5. Composer : `node scripts/compose-item-layer.mjs --regions item-art/extracted/<slug>/<slug>_regions.json --keep <indices>` — recolle les crops (retouchés ou non) à leur position d'origine, produit `<slug>_layer.png`.
6. Ajouter au catalogue : `node scripts/add-shop-item.mjs --code <code> --slot <slot> --image item-art/extracted/<slug>/<slug>_layer.png --price <N> --rarity <rareté> --unlock-level <N> --name-fr "..." --name-en "..." --name-es "..." --name-zh "..."` — copie l'image dans `static/images/items/{code}.png` et insère directement la ligne en base (pas de migration à appliquer à part). `--dry-run` pour vérifier avant d'écrire.

## 7. Priorisation du contenu

Pas de rollout figé par phases ni de quota par slot/rareté (catalogue vidé, plus de squelette de 353 items à remplir, §1). Chaque nouvel item se décide au cas par cas selon ce qui a du sens pour le jeu à ce moment — slot le plus visible, occasion (nouveau niveau, événement), ou simplement l'accessoire qui vient d'être produit et testé.
