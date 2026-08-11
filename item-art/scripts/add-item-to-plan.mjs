#!/usr/bin/env node
/**
 * Ajoute une entrée à item-art/items-plan.json à partir d'une simple
 * description libre : l'IA (Gemini, sortie JSON structurée) détermine slot,
 * rareté, description image-gen, slug, code et les 4 traductions (fr/en/es/zh).
 *
 * Le prix et la fourchette de unlockLevel restent déterministes par rareté
 * (RARITY_TABLE ci-dessous, extraite sans exception des 33 entrées actuelles
 * de items-plan.json) : la valeur de l'IA n'est jamais utilisée pour le prix,
 * et le unlockLevel proposé est clampé dans la fourchette de la rareté.
 *
 * Ce script n'insère rien en base ni ne génère d'image — il prépare
 * seulement l'entrée du plan. Étape suivante :
 *   node item-art/scripts/generate-item-art.mjs --code <code>
 *
 * Usage :
 *   node item-art/scripts/add-item-to-plan.mjs "<description libre de l'item>"
 *     [--plan item-art/items-plan.json]
 *     [--done item-art/items-plan-done.json]
 *     [--model gemini-2.5-flash]
 *     [--dry-run]
 */
import 'dotenv/config';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const DEFAULT_PLAN = join(ROOT, 'item-art', 'items-plan.json');
const DEFAULT_DONE = join(ROOT, 'item-art', 'items-plan-done.json');
const DEFAULT_MODEL = 'gemini-3.1-flash';

const SLOTS = ['background', 'aura', 'back', 'body', 'outfit', 'weapon', 'hat', 'pet'];

// Prix fixe + fourchette de unlockLevel par rareté, déduits sans exception des
// 33 entrées actuelles de items-plan.json. Source de vérité pour l'équilibrage
// économique : ne jamais laisser l'IA choisir ces valeurs librement.
const RARITY_TABLE = {
  common: { price: 150, levelRange: [1, 4] },
  uncommon: { price: 350, levelRange: [7, 10] },
  rare: { price: 900, levelRange: [12, 15] },
  epic: { price: 2700, levelRange: [17, 23] },
  legendary: { price: 8000, levelRange: [24, 28] },
  mythic: { price: 45000, levelRange: [29, 30] }
};

const SLOT_HINTS = {
  outfit: 'a full outfit/costume worn on the body',
  hat: 'headwear — a hat, helmet, crown or hairstyle covering the head',
  weapon: 'a weapon or tool held in the hand',
  background: 'a full-frame backdrop/scene behind the character (no character in it)',
  aura: 'a glowing energy aura surrounding the whole character',
  back: 'a small accessory attached to the back, barely visible from the front',
  pet: 'a small companion creature standing beside the character',
  body: 'a full alternate body/skin variant replacing the character model itself'
};

const FEW_SHOT_EXAMPLES = [
  {
    slug: 'sceptre-cosmique',
    codeSuffix: 'scepter_mythic',
    slot: 'weapon',
    rarity: 'mythic',
    itemDescription: 'a cosmic scepter with a swirling galaxy orb on top and a rainbow prismatic glow',
    names: { fr: 'Sceptre cosmique', en: 'Cosmic scepter', es: 'Cetro cósmico', zh: '宇宙权杖' }
  },
  {
    slug: 'decor-planete-mars',
    codeSuffix: 'mars',
    slot: 'background',
    rarity: 'rare',
    itemDescription:
      'a red rocky Mars planet surface backdrop with a dusty orange sky and distant craters',
    names: { fr: 'Planète Mars', en: 'Mars planet', es: 'Planeta Marte', zh: '火星背景' }
  },
  {
    slug: 'familier-dragonneau',
    codeSuffix: 'baby_dragon',
    slot: 'pet',
    rarity: 'epic',
    itemDescription: 'a small cute baby dragon companion, sitting with tiny wings',
    names: { fr: 'Dragonneau', en: 'Baby dragon', es: 'Dragón bebé', zh: '小龙伙伴' }
  },
  {
    slug: 'casquette-rouge',
    codeSuffix: 'cap_red',
    slot: 'hat',
    rarity: 'common',
    itemDescription: 'a simple red baseball cap',
    names: { fr: 'Casquette rouge', en: 'Red cap', es: 'Gorra roja', zh: '红色棒球帽' }
  }
];

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    slot: { type: 'STRING', enum: SLOTS },
    rarity: { type: 'STRING', enum: Object.keys(RARITY_TABLE) },
    unlockLevel: { type: 'INTEGER' },
    slug: { type: 'STRING' },
    codeSuffix: { type: 'STRING' },
    itemDescription: { type: 'STRING' },
    names: {
      type: 'OBJECT',
      properties: {
        fr: { type: 'STRING' },
        en: { type: 'STRING' },
        es: { type: 'STRING' },
        zh: { type: 'STRING' }
      },
      required: ['fr', 'en', 'es', 'zh']
    }
  },
  required: ['slot', 'rarity', 'unlockLevel', 'slug', 'codeSuffix', 'itemDescription', 'names']
};

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) {
      args._.push(token);
      continue;
    }
    const key = token.slice(2);
    if (key === 'dry-run') {
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
    'Usage: node item-art/scripts/add-item-to-plan.mjs "<description libre>" ' +
      '[--plan item-art/items-plan.json] [--done item-art/items-plan-done.json] ' +
      '[--model gemini-2.5-flash] [--dry-run]'
  );
  process.exit(1);
}

function loadJsonArray(path) {
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Minuscule, accents retirés, tout caractère hors [a-z0-9] remplacé par le séparateur, doublons/bords nettoyés. */
function sanitize(value, separator) {
  const ascii = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return ascii
    .replace(/[^a-z0-9]+/g, separator)
    .replace(new RegExp(`${separator}{2,}`, 'g'), separator)
    .replace(new RegExp(`^${separator}|${separator}$`, 'g'), '');
}

function clamp(value, [min, max]) {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function buildPrompt(userPrompt) {
  const slotList = SLOTS.map((slot) => `- ${slot}: ${SLOT_HINTS[slot]}`).join('\n');
  const rarityList = Object.entries(RARITY_TABLE)
    .map(([rarity, { levelRange }]) => `- ${rarity}: unlockLevel typiquement entre ${levelRange[0]} et ${levelRange[1]}`)
    .join('\n');
  const examples = FEW_SHOT_EXAMPLES.map((example) => JSON.stringify(example)).join('\n');

  return (
    'Tu remplis une entrée de catalogue pour un item cosmétique de jeu vidéo (robot mascotte). ' +
      "Choisis le slot d'équipement le plus adapté parmi :\n" +
      `${slotList}\n\n` +
      'Choisis une rareté cohérente avec la puissance/richesse visuelle décrite :\n' +
      `${rarityList}\n\n` +
      'Exemples existants (format à respecter) :\n' +
      `${examples}\n\n` +
      "Consignes de format :\n" +
      "- slug : kebab-case, en français, sans accents (identifiant de fichier).\n" +
      '- codeSuffix : snake_case, en anglais, court, SANS préfixe de slot (le slot est ajouté séparément).\n' +
      '- itemDescription : une phrase courte en anglais, orientée génération d\'image (silhouette/matière/couleur), sans mentionner le robot.\n' +
      '- names : traductions naturelles et courtes du nom de l\'item en fr/en/es/zh.\n\n' +
      `Description de l'item à cataloguer : ${userPrompt}`
  );
}

async function callGemini({ model, apiKey, prompt }) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: RESPONSE_SCHEMA
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Appel Gemini échoué (${response.status}) : ${errorText}`);
  }

  const json = await response.json();
  const text = json.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
  if (!text) {
    throw new Error(`Aucune réponse JSON de Gemini pour le prompt : ${prompt}\nRéponse : ${JSON.stringify(json)}`);
  }
  return JSON.parse(text);
}

function validate(raw, { existingCodes, existingSlugs }) {
  if (!SLOTS.includes(raw.slot)) {
    throw new Error(`slot invalide reçu de l'IA '${raw.slot}' (attendu : ${SLOTS.join(', ')})`);
  }
  if (!RARITY_TABLE[raw.rarity]) {
    throw new Error(`rarity invalide reçue de l'IA '${raw.rarity}' (attendu : ${Object.keys(RARITY_TABLE).join(', ')})`);
  }

  const slug = sanitize(raw.slug, '-');
  const codeSuffix = sanitize(raw.codeSuffix, '_');
  const code = `${raw.slot}_${codeSuffix}`;

  if (existingCodes.has(code)) {
    throw new Error(`le code '${code}' existe déjà (plan ou déjà produit) — reformule la description pour obtenir un item distinct.`);
  }
  if (existingSlugs.has(slug)) {
    throw new Error(`le slug '${slug}' existe déjà (plan ou déjà produit) — reformule la description pour obtenir un item distinct.`);
  }

  const { price, levelRange } = RARITY_TABLE[raw.rarity];
  const unlockLevel = clamp(Number(raw.unlockLevel), levelRange);

  for (const locale of ['fr', 'en', 'es', 'zh']) {
    if (!raw.names?.[locale]) throw new Error(`traduction manquante de l'IA pour la locale '${locale}'`);
  }

  return {
    slug,
    code,
    slot: raw.slot,
    rarity: raw.rarity,
    price,
    unlockLevel,
    itemDescription: raw.itemDescription,
    names: { fr: raw.names.fr, en: raw.names.en, es: raw.names.es, zh: raw.names.zh }
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const userPrompt = args._.join(' ').trim();
  if (!userPrompt) usageAndExit("préciser une description libre de l'item entre guillemets");

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY manquant (voir .env / .env.example).');

  const planPath = args.plan ? join(ROOT, args.plan) : DEFAULT_PLAN;
  const donePath = args.done ? join(ROOT, args.done) : DEFAULT_DONE;
  const model = args.model ?? DEFAULT_MODEL;

  const plan = loadJsonArray(planPath);
  const done = loadJsonArray(donePath);
  const existingCodes = new Set([...plan, ...done].map((item) => item.code));
  const existingSlugs = new Set([...plan, ...done].map((item) => item.slug));

  console.log(`Appel Gemini (${model})...`);
  const raw = await callGemini({ model, apiKey, prompt: buildPrompt(userPrompt) });
  const item = validate(raw, { existingCodes, existingSlugs });

  console.log('\nItem généré :');
  console.log(JSON.stringify(item, null, 2));

  if (args['dry-run']) {
    console.log("\n--dry-run : items-plan.json non modifié.");
    return;
  }

  plan.push(item);
  writeFileSync(planPath, `${JSON.stringify(plan, null, 2)}\n`);
  console.log(`\n✓ Ajouté à ${planPath}`);
  console.log(`\nÉtape suivante : node item-art/scripts/generate-item-art.mjs --code ${item.code}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
