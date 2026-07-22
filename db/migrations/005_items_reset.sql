-- Réinitialisation complète du catalogue d'items (décision 2026-07-22) :
-- abandon du catalogue procédural par thème (scripts/item-catalog.mjs,
-- supprimé) au profit d'un catalogue alimenté à la main, un item à la fois,
-- via scripts/add-shop-item.mjs, au fil de la production réelle des assets.
--
-- Les équipements "par défaut" sont résolus dynamiquement par
-- src/lib/server/shop.js (WHERE is_default = true), pas par des lignes
-- user_equipment pré-remplies : vider items sans rien réinsérer n'affecte
-- pas l'affichage du personnage (slots vides tant qu'aucun item n'est
-- rajouté), CharacterAvatar.svelte gère déjà ce cas.
--
-- user_inventory.item_id / user_equipment.item_id référencent items(id) sans
-- ON DELETE CASCADE : les inclure explicitement dans le TRUNCATE est
-- nécessaire, sinon la contrainte bloque la suppression des items encore
-- possédés/équipés (impact réel vérifié avant d'exécuter : 11 lignes
-- user_inventory / 6 user_equipment, comptes de test QA + compte personnel).

TRUNCATE TABLE user_equipment, user_inventory, items RESTART IDENTITY;
