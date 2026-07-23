#!/usr/bin/env node
/**
 * Point d'entrée unique pour ajouter un item au catalogue de la boutique
 * (table `items`). Remplace l'ancien système de catalogue procédural
 * (scripts/item-catalog.mjs, supprimé, décision 2026-07-22) : il n'y a plus
 * de source de vérité en code, la base de données EST le catalogue, et ce
 * script est la seule façon d'y ajouter un item — un à la fois, au fil de la
 * production réelle des assets (voir scripts/extract-item-diff.mjs et
 * scripts/compose-item-layer.mjs pour produire le PNG en amont).
 *
 * Copie l'image vers static/images/items/{code}.png puis insère directement
 * la ligne en base (connexion Neon directe, comme scripts/migrate-supabase-
 * to-neon.js — pas de fichier de migration à appliquer à part).
 *
 * Usage :
 *   node scripts/add-shop-item.mjs \
 *     --code <identifiant_unique> \
 *     --slot <background|aura|back|body|outfit|weapon|hat|pet> \
 *     --image <chemin/vers/layer.png> \
 *     --price <entier> \
 *     --rarity <common|uncommon|rare|epic|legendary|mythic|none> \
 *     --unlock-level <entier> \
 *     --name-fr "..." --name-en "..." --name-es "..." --name-zh "..." \
 *     [--purchasable true|false]  (défaut true)
 *     [--default]                  (marque is_default=true)
 *     [--dry-run]
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const ITEMS_DIR = join(ROOT, 'static', 'images', 'items');

const SLOTS = ['background', 'aura', 'back', 'body', 'outfit', 'weapon', 'hat', 'pet'];
const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic'];
const REQUIRED = ['code', 'slot', 'image', 'price', 'rarity', 'unlock-level', 'name-fr', 'name-en', 'name-es', 'name-zh'];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    if (key === 'dry-run' || key === 'default') {
      args[key] = true;
      continue;
    }
    args[key] = argv[i + 1];
    i += 1;
  }
  return args;
}

function usageAndExit(message) {
  if (message) console.error(`Erreur : ${message}\n`);
  console.error(
    'Usage: node scripts/add-shop-item.mjs --code <code> --slot <slot> --image <chemin.png> --price <N> ' +
      '--rarity <common|uncommon|rare|epic|legendary|mythic|none> --unlock-level <N> ' +
      '--name-fr "..." --name-en "..." --name-es "..." --name-zh "..." [--purchasable true|false] [--default] [--dry-run]'
  );
  process.exit(1);
}

function validate(args) {
  const isDefault = Boolean(args.default);
  const missing = REQUIRED.filter((key) => !isDefault && args[key] === undefined);
  // --default fixe price/rarity de façon cohérente ; on les rend optionnels dans ce cas précis.
  const missingWithoutDefaults = isDefault ? missing.filter((k) => k !== 'price' && k !== 'rarity') : missing;
  if (missingWithoutDefaults.length > 0) {
    usageAndExit(`champ(s) manquant(s) : --${missingWithoutDefaults.join(', --')}`);
  }

  if (!SLOTS.includes(args.slot)) {
    usageAndExit(`--slot invalide '${args.slot}' (attendu : ${SLOTS.join(', ')})`);
  }

  const rarityInput = isDefault && args.rarity === undefined ? 'none' : args.rarity;
  if (!RARITIES.includes(rarityInput) && rarityInput !== 'none') {
    usageAndExit(`--rarity invalide '${args.rarity}' (attendu : ${RARITIES.join(', ')} ou none)`);
  }

  const imagePath = join(ROOT, args.image);
  if (!existsSync(imagePath)) {
    usageAndExit(`fichier --image introuvable : ${imagePath}`);
  }

  const price = isDefault && args.price === undefined ? 0 : Number(args.price);
  if (!Number.isInteger(price) || price < 0) {
    usageAndExit(`--price doit être un entier positif (reçu '${args.price}')`);
  }

  const unlockLevel = Number(args['unlock-level']);
  if (!Number.isInteger(unlockLevel) || unlockLevel < 1) {
    usageAndExit(`--unlock-level doit être un entier >= 1 (reçu '${args['unlock-level']}')`);
  }

  const purchasable = isDefault ? false : args.purchasable !== 'false';

  return {
    code: args.code,
    slot: args.slot,
    imagePath,
    price,
    rarity: rarityInput === 'none' ? null : rarityInput,
    unlockLevel,
    names: { fr: args['name-fr'], en: args['name-en'], es: args['name-es'], zh: args['name-zh'] },
    purchasable,
    isDefault
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.code) usageAndExit();

  const item = validate(args);
  const destPath = join(ITEMS_DIR, `${item.code}.png`);
  const assetUrl = `/images/items/${item.code}.png`;

  console.log('Item à ajouter :');
  console.log(`  code            ${item.code}`);
  console.log(`  slot            ${item.slot}`);
  console.log(`  rarity          ${item.rarity ?? '(aucune — item par défaut)'}`);
  console.log(`  price           ${item.price}`);
  console.log(`  unlock_level    ${item.unlockLevel}`);
  console.log(`  is_purchasable  ${item.purchasable}`);
  console.log(`  is_default      ${item.isDefault}`);
  console.log(`  names           ${JSON.stringify(item.names)}`);
  console.log(`  image           ${item.imagePath} -> ${destPath}`);

  if (args['dry-run']) {
    console.log('\n--dry-run : aucun fichier copié, aucune écriture en base.');
    return;
  }

  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL manquant (voir .env / .env.example).');
  }

  mkdirSync(ITEMS_DIR, { recursive: true });
  copyFileSync(item.imagePath, destPath);
  console.log(`\n✓ Copié : ${destPath}`);

  const sql = neon(process.env.DATABASE_URL);
  let inserted;
  try {
    inserted = await sql`
      INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
      SELECT ${item.code}, ${item.slot}, ${item.rarity}, ${item.price}, ${assetUrl}, ${JSON.stringify(item.names)}::jsonb,
             ${item.unlockLevel}, ${item.purchasable}, ${item.isDefault}, COALESCE(MAX(sort_order), 0) + 1
      FROM items
      RETURNING id, sort_order
    `;
  } catch (error) {
    if (error.code === '23505') {
      throw new Error(`le code '${item.code}' existe déjà en base (contrainte unique sur items.code).`);
    }
    throw error;
  }

  console.log(`✓ Inséré en base : id=${inserted[0].id}, sort_order=${inserted[0].sort_order}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
