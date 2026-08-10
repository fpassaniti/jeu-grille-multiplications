#!/usr/bin/env node
/**
 * Orchestrateur du pipeline item-art/ complet, un item à la fois : génère
 * l'édition Nano Banana via l'API Gemini (remplace l'étape manuelle dans
 * Google AI Studio décrite dans PROMPT_ASSETS.md §3/§4), puis enchaîne les
 * 3 scripts existants du pipeline en sous-process, dans l'ordre documenté
 * (PROMPT_ASSETS.md §6) :
 *   1. génération (ce script) -> item-art/raw/robot-unit01/<slug>.jpg
 *   2. scripts/extract-item-diff.mjs -> crops de revue + manifeste
 *   3. (pause : revue humaine des _diff_asset_N.png, retouche si besoin)
 *   4. scripts/compose-item-layer.mjs -> <slug>_layer.png
 *   5. scripts/add-shop-item.mjs -> copie + insertion en base
 *
 * Exception pour le slot 'background' : un décor change tout le cadre par
 * définition, il n'y a donc rien de localisé à soustraire par diff — les
 * étapes 2 et 4 sont sautées, l'image validée est normalisée directement en
 * <slug>_layer.png (voir PROMPT_ASSETS.md §5.1).
 *
 * Ne duplique aucune logique des 3 scripts existants : il les invoque tels
 * quels (mêmes commandes que PROMPT_ASSETS.md §6 / example_cmd_item-art.md).
 *
 * Les paramètres par item (code, slot, rareté, prix, niveau, description,
 * noms traduits) viennent de item-art/items-plan.json, pas de la ligne de
 * commande — ce fichier est la liste d'objets à produire.
 *
 * Usage :
 *   node item-art/scripts/generate-item-art.mjs --code <code>
 *   node item-art/scripts/generate-item-art.mjs --all
 *     [--plan item-art/items-plan.json]
 *     [--base item-art/raw/robot-unit01/base.jpg]
 *     [--model gemini-3.1-flash-lite-image]
 *     [--dry-run]   (passthrough vers add-shop-item.mjs)
 */
import 'dotenv/config';
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const DEFAULT_PLAN = join(ROOT, 'item-art', 'items-plan.json');
const DEFAULT_BASE = join(ROOT, 'item-art', 'raw', 'robot-unit01', 'base.jpg');
const DEFAULT_MODEL = 'gemini-3.1-flash-lite-image';

// Notes de style par rareté (PROMPT_ASSETS.md §5), injectées dans le prompt Nano Banana.
const RARITY_NOTES = {
  common: 'simple, no special effect, basic silhouette',
  uncommon: 'a touch of color/texture, still understated',
  rare: 'one accent color plus a light highlight/reflection',
  epic: 'gem-like or glowing accents, slightly more ornate',
  legendary: 'gold trim plus a particle/sparkle motif',
  mythic: 'prismatic/rainbow trim plus the strongest glow effect in the catalog — must look distinct from legendary at a glance'
};

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    if (key === 'dry-run' || key === 'all') {
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
    'Usage: node item-art/scripts/generate-item-art.mjs (--code <code> | --all) ' +
      '[--plan item-art/items-plan.json] [--base item-art/raw/robot-unit01/base.jpg] ' +
      '[--model gemini-3.1-flash-lite-image] [--dry-run]'
  );
  process.exit(1);
}

function loadPlan(planPath) {
  if (!existsSync(planPath)) usageAndExit(`fichier --plan introuvable : ${planPath}`);
  return JSON.parse(readFileSync(planPath, 'utf8'));
}

function rarityNoteFor(item) {
  const rarityNote = RARITY_NOTES[item.rarity];
  if (!rarityNote) throw new Error(`rareté inconnue '${item.rarity}' pour ${item.code} (attendu : ${Object.keys(RARITY_NOTES).join(', ')})`);
  return rarityNote;
}

/** Prompt pour un accessoire porté sur le robot (tous les slots sauf 'background') : édition guidée par diff (PROMPT_ASSETS.md §5/§6). */
function buildAccessoryPrompt(item) {
  const rarityNote = rarityNoteFor(item);
  return (
    `Edit the attached reference image: add a ${item.itemDescription} to the '${item.slot}' equipment slot, ` +
    `${item.slot == 'aura' ? 'aura should be around the robot with no detail in front of the robot, ' : ''} ` +
    `${item.slot == 'back' ? 'the item must be in the back of the robot, so barely visible, no detail must appears in front of the robot, ' : ''} ` +
    `${item.slot == 'pet' ? 'pets should be positionning in the lower right corner, and should be on the side, on the floor of the robot, ' : ''} ` +
    `${item.slot == 'weapon' ? 'close the hand around the handle of the weapon, ' : ''} ` +
    `${item.slot == 'weapon' ? 'keep this new element on the side, not covering the rest of the body, ' : ''} ` +
    `${item.slot == 'hat' ? 'it doesn\'t matter if the item is partly out of the frame, prioritize the good positioning so do not hesitate to cut the new part, ' : ''} ` +
    `styled for ${item.rarity} rarity (${rarityNote}). Keep everything else in the image exactly unchanged — ` +
    'same character, same pose, same camera framing, same proportions, same style, ' +
    'same background. Only the described addition should differ from the reference.'
  );
}

/**
 * Prompt pour un décor (slot 'background') : pas d'édition par diff — la
 * référence ne sert qu'à caler la ligne de sol (pieds du robot) et la
 * perspective caméra ; le robot ne doit pas apparaître dans le résultat
 * (voir PROMPT_ASSETS.md §5.1).
 */
// Convention du corps canonique (item-art/raw/robot-unit01/base.jpg, PROMPT_ASSETS.md §4) :
// caméra frontale plate (quasi aucune distorsion de perspective), robot centré horizontalement,
// pieds posés à environ 90% de la hauteur du cadre depuis le haut. Utilisé comme description
// numérique de la ligne de sol/perspective puisqu'on ne peut plus envoyer l'image en référence.
const CANONICAL_FLOOR_LINE = 'about 90% down from the top of the square frame (roughly a 10% margin of floor below it)';
const CANONICAL_CAMERA = 'flat, mostly frontal camera angle with very little perspective distortion, matching a simple flat cartoon mascot render';

function buildBackgroundPrompt(item) {
  const rarityNote = rarityNoteFor(item);
  return (
    `Generate a full-frame background illustration for a game avatar, no reference image provided: ${item.itemDescription}. ` +
    `Square 1:1 canvas, ${CANONICAL_CAMERA}. The ground/floor line sits at ${CANONICAL_FLOOR_LINE}. ` +
    'Flat cartoon illustration style — thick bold black outlines (4-6px), vivid saturated flat colors, ' +
    'no gradients except simple flat highlights. ' +
    `Apply a visual richness level for ${item.rarity} rarity (${rarityNote}) to the scene itself (lighting, props, detail density). ` +
    'Opaque painted scene filling the entire square frame edge to edge — no transparency, no empty margin. ' +
    'Do not include any robot, character, creature, mascot, or figure of any kind — the scene must be completely ' +
    'empty of characters, with no character shadow, silhouette, or footprints on the ground. ' +
    'No border, no frame, no vignette, no text, no logo, no watermark. ' +
    'Keep the centre of the frame visually calm and uncluttered — a character will be composited on top of it afterwards.'
  );
}

function buildPrompt(item) {
  return item.slot === 'background' ? buildBackgroundPrompt(item) : buildAccessoryPrompt(item);
}

/**
 * Appelle l'API Gemini (generateContent), retourne {mimeType, data (base64)}.
 * `basePath` null/undefined -> génération texte seul (pas d'édition guidée par image) :
 * utilisé pour le slot 'background', voir PROMPT_ASSETS.md §5.1 (envoyer l'image de
 * référence du robot fait échouer la consigne « pas de robot dans le résultat » — le
 * modèle d'édition privilégie fortement la préservation du sujet de l'image fournie,
 * même avec des négations explicites — constaté en pratique sur decor-jardin).
 */
async function callGemini({ model, apiKey, prompt, basePath }) {
  const requestParts = [{ text: prompt }];
  if (basePath) {
    const imageBytes = readFileSync(basePath);
    const mimeType = basePath.endsWith('.png') ? 'image/png' : 'image/jpeg';
    requestParts.push({ inlineData: { mimeType, data: imageBytes.toString('base64') } });
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const body = { contents: [{ parts: requestParts }] };

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
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const imagePart = parts.find((part) => part.inlineData);
  if (!imagePart) {
    throw new Error(`Aucune image dans la réponse Gemini pour le prompt : ${prompt}\nRéponse : ${JSON.stringify(json)}`);
  }
  return imagePart.inlineData;
}

function extensionForMimeType(mimeType) {
  if (mimeType === 'image/png') return 'png';
  return 'jpg';
}

function run(command, args) {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  // stdin à 'ignore' (pas 'inherit') : ces sous-scripts ne lisent jamais stdin,
  // et le partage du même descripteur avec le parent casse le readline
  // interactif de ce script (les octets déjà en attente dans le pipe finissent
  // lus par l'enfant au lieu du parent — observé en pratique : la question
  // suivante ne recevait jamais sa réponse).
  execFileSync(command, args, { stdio: ['ignore', 'inherit', 'inherit'], cwd: ROOT });
}

async function confirm(rl, question) {
  const answer = await rl.question(`${question} [o/N] `);
  return answer.trim().toLowerCase().startsWith('o');
}

async function processItem(item, { plan, basePath, model, apiKey, dryRun, rl }) {
  console.log(`\n=== ${item.code} (${item.slot}, ${item.rarity}) — ${item.names.fr} ===`);

  const rawDir = join(ROOT, 'item-art', 'raw', 'robot-unit01');
  mkdirSync(rawDir, { recursive: true });
  const existingVariant = readdirSync(rawDir).find((f) => f.startsWith(`${item.slug}.`));

  let variantPath = existingVariant ? join(rawDir, existingVariant) : null;
  let needsGeneration = !variantPath;
  if (variantPath) {
    needsGeneration = await confirm(rl, `${variantPath} existe déjà. Régénérer via Gemini (écrase le fichier) ?`);
  }

  while (needsGeneration) {
    const prompt = buildPrompt(item);
    console.log(`Appel Gemini (${model})...\nPrompt : ${prompt}`);
    const referenceImage = item.slot === 'background' ? null : basePath;
    const inlineData = await callGemini({ model, apiKey, prompt, basePath: referenceImage });
    const ext = extensionForMimeType(inlineData.mimeType);
    variantPath = join(rawDir, `${item.slug}.${ext}`);
    writeFileSync(variantPath, Buffer.from(inlineData.data, 'base64'));
    console.log(`Écrit : ${variantPath}`);
    if (item.slot === 'background') {
      console.log('Vérifier : aucun robot/personnage visible, plus aucun vert chroma-key, ligne de sol cohérente.');
    }

    const ok = await confirm(rl, `Ouvrez ${variantPath} pour vérifier le rendu. Continuer avec cette image ?`);
    if (ok) {
      needsGeneration = false;
    } else {
      needsGeneration = await confirm(rl, 'Relancer une génération Gemini pour cet item ?');
      if (!needsGeneration) {
        console.log(`Item ${item.code} passé (aucune image validée).`);
        return;
      }
    }
  }

  const extractedDir = join(ROOT, 'item-art', 'extracted', item.slug);
  const layerImage = `item-art/extracted/${item.slug}/${item.slug}_layer.png`;

  if (item.slot === 'background') {
    // Pas de soustraction pour un décor (rien de localisé à isoler) : l'image validée
    // devient directement le calque plein cadre, cf. PROMPT_ASSETS.md §5.1.
    mkdirSync(extractedDir, { recursive: true });

    const [baseMeta, variantMeta] = await Promise.all([sharp(basePath).metadata(), sharp(variantPath).metadata()]);
    let pipeline = sharp(variantPath);
    if (baseMeta.width !== variantMeta.width || baseMeta.height !== variantMeta.height) {
      console.log(
        `Attention : dimensions différentes entre base (${baseMeta.width}x${baseMeta.height}) et variante ` +
          `(${variantMeta.width}x${variantMeta.height}) — recadrage en 'cover' sur les dimensions de base.`
      );
      pipeline = pipeline.resize(baseMeta.width, baseMeta.height, { fit: 'cover', position: 'centre' });
    }
    await pipeline.png({ compressionLevel: 9, effort: 10 }).toFile(join(ROOT, layerImage));
    console.log(`Écrit (calque plein cadre, décor direct) : ${layerImage}`);
  } else {
    run('node', [
      'item-art/scripts/extract-item-diff.mjs',
      '--base',
      relative(ROOT, basePath),
      '--variant',
      relative(ROOT, variantPath),
      '--name',
      item.slug
    ]);

    const manifestPath = join(extractedDir, `${item.slug}_regions.json`);
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    console.log(`\nRégions détectées pour ${item.slug} :`);
    for (const region of manifest.regions) {
      console.log(`  ${region.index}: ${join(extractedDir, region.file)}`);
    }
    console.log('Ouvrez ces fichiers et retouchez-les manuellement si nécessaire avant de continuer.');

    const keep = (await rl.question('Indices à garder pour la fusion (ex: 1,3) : ')).trim();
    if (!keep) {
      console.log(`Item ${item.code} passé (aucun indice fourni).`);
      return;
    }

    run('node', [
      'item-art/scripts/compose-item-layer.mjs',
      '--regions',
      `item-art/extracted/${item.slug}/${item.slug}_regions.json`,
      '--keep',
      keep
    ]);
  }

  const addArgs = [
    'item-art/scripts/add-shop-item.mjs',
    '--code',
    item.code,
    '--slot',
    item.slot,
    '--image',
    layerImage,
    '--price',
    String(item.price),
    '--rarity',
    item.rarity,
    '--unlock-level',
    String(item.unlockLevel),
    '--name-fr',
    item.names.fr,
    '--name-en',
    item.names.en,
    '--name-es',
    item.names.es,
    '--name-zh',
    item.names.zh
  ];
  if (dryRun) addArgs.push('--dry-run');
  run('node', addArgs);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.code && !args.all) usageAndExit('préciser --code <code> ou --all');

  const planPath = args.plan ? join(ROOT, args.plan) : DEFAULT_PLAN;
  const basePath = args.base ? join(ROOT, args.base) : DEFAULT_BASE;
  const model = args.model ?? DEFAULT_MODEL;
  const dryRun = Boolean(args['dry-run']);

  if (!existsSync(basePath)) usageAndExit(`fichier --base introuvable : ${basePath}`);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY manquant (voir .env / .env.example).');

  const plan = loadPlan(planPath);
  const items = args.all ? plan : plan.filter((item) => item.code === args.code);
  if (items.length === 0) usageAndExit(`code '${args.code}' introuvable dans ${planPath}`);

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  try {
    for (const item of items) {
      await processItem(item, { plan, basePath, model, apiKey, dryRun, rl });
    }
  } finally {
    rl.close();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
