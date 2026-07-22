-- Bascule progressive des placeholders SVG vers du vrai art (item-art/,
-- scripts/integrate-item-art.mjs). Une ligne par item intégré, ajoutée au fil
-- de l'eau — ne pas réécrire ce fichier à la main, seulement l'exécuter.
UPDATE items SET asset_url = replace(asset_url, '.svg', '.png') WHERE code = 'hat_helmet_common';
UPDATE items SET asset_url = replace(asset_url, '.svg', '.png') WHERE code = 'body_blob_blue';
