-- Permet de déséquiper explicitement un item sur un slot à défaut virtuel
-- (body/outfit/weapon, cf. shop.js DEFAULT_SLOTS) : une ligne user_equipment
-- avec item_id NULL signifie "explicitement vide", prioritaire sur le défaut
-- virtuel, distinct de "aucune ligne" qui continue de retomber sur le défaut.

ALTER TABLE user_equipment ALTER COLUMN item_id DROP NOT NULL;
