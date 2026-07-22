# PROMPT_ASSETS — Génération des assets d'équipement du personnage

> Guide pratique pour produire l'art des items de la boutique MultyFun (`items.asset_url`). Référencé depuis `SPEC.md` §5.9.

---

## 1. Constat

**Mise à jour 2026-07-22** : le catalogue procédural à 353 items (placeholders SVG générés automatiquement, `scripts/item-catalog.mjs`/`scripts/generate-item-placeholders.mjs`) a été abandonné — la table `items` a été entièrement vidée (`db/migrations/005_items_reset.sql`, voir `SPEC.md` §5.9). Il n'y a plus de placeholder d'aucune sorte : chaque item n'existe en base qu'à partir du moment où son vrai art est produit et ajouté via `scripts/add-shop-item.mjs` (§6). Ce document décrit comment produire cet art, un item à la fois, avec un style cohérent avec les images de niveau existantes (`static/images/levels/level_N.png`).

## 2. Point d'attention technique — pipeline de compositing (tranché 2026-07-22)

`SPEC.md` §5.3 décrit un pipeline où chaque item est dessiné **directement sur le canvas du personnage complet**, à la même position exacte que le corps de base, pour que l'empilement en `<img>` absolument positionnées fonctionne sans offset en code.

Une version précédente de ce document mettait en doute la fiabilité de cette approche (crainte d'un désalignement pixel entre générations séparées) et recommandait de générer chaque item seul puis de le positionner via `offset_x`/`offset_y`/`scale` stockés en base. **Testé et infirmé** (`item-art/`, 2026-07-22) : en éditant itérativement une seule image de référence avec Nano Banana (fond chroma-key, un ajout à la fois — voir `item-art/raw/robot-unit01/`) plutôt qu'en générant chaque item indépendamment, le cadrage reste parfaitement stable d'une édition à l'autre. La crainte initiale s'appliquait à un mode de génération plus faible (générations indépendantes sans référence partagée), pas à l'édition itérative.

**Approche retenue : calque plein cadre.** Chaque item exporté (`scripts/extract-item-diff.mjs`) garde le cadrage exact et la résolution native de l'image dont il est extrait — transparent partout sauf la zone de l'accessoire. `CharacterAvatar.svelte` continue d'empiler de simples `<img>` sans aucun offset en code (§5.3 inchangé), et **aucune colonne `offset_x`/`offset_y`/`scale` n'est ajoutée** au schéma `items`.

**Contrepartie assumée** : tous les accessoires produits par ce pipeline sont verrouillés à un seul personnage de base (le robot de `item-art/raw/robot-unit01/`) — un accessoire ne peut pas être réutilisé tel quel sur un autre corps, puisque leur cadrage/silhouette diffère. Décision : rester sur ce seul corps canonique tant qu'un autre corps n'a pas lui-même besoin de vrai art. Si ce besoin apparaît, ce choix (calque plein cadre vs `offset_x/y/scale`) devra être revu — probablement en régénérant un jeu d'accessoires par corps plutôt qu'en réintroduisant un système d'offset, `object-fit: contain` rendant déjà les deux approches équivalentes visuellement une fois qu'un asset est correctement cadré.

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

## 6. Process (un item à la fois)

1. Générer/valider `item-art/raw/robot-unit01/base.jpg` (fond vert) — image de référence unique, réutilisée pour toutes les éditions (§2 : un seul personnage canonique pour l'instant).
2. Éditer itérativement cette image avec Nano Banana, **un ajout à la fois** — sauver chaque édition sous `item-art/raw/robot-unit01/<slug>.jpg`.
3. Extraire : `node scripts/extract-item-diff.mjs --base item-art/raw/robot-unit01/base.jpg --variant item-art/raw/robot-unit01/<slug>.jpg --name <slug>` — écrit les crops `diff_asset_N.png` et un manifeste `<slug>_regions.json` dans `item-art/extracted/<slug>/`. Ce script s'arrête là, il ne construit jamais lui-même le calque final.
4. Revue humaine des crops : vrai ajout vs bruit JPEG. **Si un bout de robot non voulu est réellement connecté** à l'ajout (silhouettes qui se touchent, ex. une mitaine collée à l'armure de jambe voisine — aucun seuillage ne peut alors les séparer), ouvrir le `_diff_asset_N.png` concerné dans un éditeur d'image et effacer directement les pixels en trop, avant de passer à l'étape suivante.
5. Composer : `node scripts/compose-item-layer.mjs --regions item-art/extracted/<slug>/<slug>_regions.json --keep <indices>` — recolle les crops (retouchés ou non) à leur position d'origine, produit `<slug>_layer.png`.
6. Ajouter au catalogue : `node scripts/add-shop-item.mjs --code <code> --slot <slot> --image item-art/extracted/<slug>/<slug>_layer.png --price <N> --rarity <rareté> --unlock-level <N> --name-fr "..." --name-en "..." --name-es "..." --name-zh "..."` — copie l'image dans `static/images/items/{code}.png` et insère directement la ligne en base (pas de migration à appliquer à part). `--dry-run` pour vérifier avant d'écrire.

## 7. Priorisation du contenu

Pas de rollout figé par phases ni de quota par slot/rareté (catalogue vidé, plus de squelette de 353 items à remplir, §1). Chaque nouvel item se décide au cas par cas selon ce qui a du sens pour le jeu à ce moment — slot le plus visible, occasion (nouveau niveau, événement), ou simplement l'accessoire qui vient d'être produit et testé.
