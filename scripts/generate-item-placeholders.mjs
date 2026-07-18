#!/usr/bin/env node
/**
 * Génère les placeholders visuels des items (SPEC §5.9, décision "placeholders
 * SVG emoji") depuis scripts/item-catalog.mjs, source de vérité unique.
 *
 * Sorties :
 *  - static/images/items/{code}.svg (45 fichiers, 512×512, fond transparent)
 *  - db/migrations/002_gamification.sql : bloc INSERT INTO items regénéré
 *    (section délimitée par des marqueurs, le reste du fichier est conservé)
 *
 * Swap futur vers de vrais assets : déposer static/images/items/{code}.png puis
 *   UPDATE items SET asset_url = replace(asset_url, '.svg', '.png');
 * — zéro changement de code, le front lit toujours `asset_url`.
 *
 * Usage : node scripts/generate-item-placeholders.mjs
 */
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { ITEMS, priceOf } from './item-catalog.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const ITEMS_DIR = join(ROOT, 'static', 'images', 'items');
const MIGRATION_FILE = join(ROOT, 'db', 'migrations', '002_gamification.sql');

const START_MARKER = '-- BEGIN GENERATED ITEMS SEED (scripts/generate-item-placeholders.mjs)';
const END_MARKER = '-- END GENERATED ITEMS SEED';

/** Ancrage du glyphe emoji par slot pour un empilement lisible en calques. */
const SLOT_LAYOUT = {
  background: { kind: 'fill' },
  aura: { kind: 'aura' },
  back: { x: 256, y: 260, size: 300, opacity: 0.85 },
  body: { x: 256, y: 300, size: 280 },
  outfit: { x: 256, y: 340, size: 170 },
  weapon: { x: 400, y: 320, size: 130 },
  hat: { x: 256, y: 110, size: 150 },
  pet: { x: 420, y: 440, size: 100 }
};

function escapeXml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function svgForItem(item) {
  const layout = SLOT_LAYOUT[item.slot];
  const emoji = escapeXml(item.emoji);

  if (layout.kind === 'fill') {
    // background : rect plein + emoji répétés en mosaïque discrète
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" fill="#dfe7fd"/>
  <text x="120" y="150" font-size="90" opacity="0.35" text-anchor="middle">${emoji}</text>
  <text x="380" y="230" font-size="90" opacity="0.35" text-anchor="middle">${emoji}</text>
  <text x="250" y="400" font-size="90" opacity="0.35" text-anchor="middle">${emoji}</text>
</svg>
`;
  }

  if (layout.kind === 'aura') {
    // aura : halo translucide centré + emoji en couronne autour du corps
    const ring = Array.from({ length: 4 }, (_, i) => {
      const angle = (Math.PI / 2) * i - Math.PI / 2;
      const x = 256 + 210 * Math.cos(angle);
      const y = 256 + 210 * Math.sin(angle);
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="70" text-anchor="middle" dominant-baseline="middle">${emoji}</text>`;
    }).join('\n  ');
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <circle cx="256" cy="256" r="230" fill="none" stroke="gold" stroke-width="6" opacity="0.4"/>
  ${ring}
</svg>
`;
  }

  const { x, y, size, opacity = 1 } = layout;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <text x="${x}" y="${y}" font-size="${size}" text-anchor="middle" dominant-baseline="middle" opacity="${opacity}">${escapeXml(item.emoji)}</text>
</svg>
`;
}

function sqlString(str) {
  return `'${str.replace(/'/g, "''")}'`;
}

function sqlJsonNames(names) {
  const json = JSON.stringify(names).replace(/'/g, "''");
  return `'${json}'::jsonb`;
}

function insertStatementFor(item) {
  const assetUrl = `/images/items/${item.code}.svg`;
  const price = priceOf(item);
  return `INSERT INTO items (code, slot, rarity, price, asset_url, name, unlock_level, is_purchasable, is_default, sort_order)
VALUES (${sqlString(item.code)}, ${sqlString(item.slot)}, ${item.rarity ? sqlString(item.rarity) : 'NULL'}, ${price}, ${sqlString(assetUrl)}, ${sqlJsonNames(item.names)}, ${item.unlockLevel}, ${item.isPurchasable}, ${item.isDefault}, ${item.sortOrder})
ON CONFLICT (code) DO NOTHING;`;
}

function generateSvgFiles() {
  mkdirSync(ITEMS_DIR, { recursive: true });
  for (const item of ITEMS) {
    writeFileSync(join(ITEMS_DIR, `${item.code}.svg`), svgForItem(item));
  }
  console.log(`✓ ${ITEMS.length} SVG écrits dans ${ITEMS_DIR}`);
}

function updateMigrationSeed() {
  if (!existsSync(MIGRATION_FILE)) {
    console.warn(`⚠ ${MIGRATION_FILE} n'existe pas encore — seed non injecté (lancez la migration d'abord).`);
    return;
  }
  const current = readFileSync(MIGRATION_FILE, 'utf8');
  const seedBlock = [START_MARKER, ...ITEMS.map(insertStatementFor), END_MARKER].join('\n\n');

  const startIdx = current.indexOf(START_MARKER);
  const endIdx = current.indexOf(END_MARKER);
  let next;
  if (startIdx !== -1 && endIdx !== -1) {
    next = current.slice(0, startIdx) + seedBlock + current.slice(endIdx + END_MARKER.length);
  } else {
    next = `${current.trimEnd()}\n\n${seedBlock}\n`;
  }
  writeFileSync(MIGRATION_FILE, next);
  console.log(`✓ Bloc seed (${ITEMS.length} items) écrit dans ${MIGRATION_FILE}`);
}

generateSvgFiles();
updateMigrationSeed();
