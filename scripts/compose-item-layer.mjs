#!/usr/bin/env node
/**
 * Deuxième étape du pipeline item-art/ (voir scripts/extract-item-diff.mjs
 * pour la première) : recolle des crops de régions — éventuellement
 * retouchés à la main entretemps dans un éditeur d'image, pour effacer un
 * bout de robot en trop qu'aucun seuillage automatique ne peut séparer
 * (silhouettes réellement connectées, ex. une mitaine collée à l'armure de
 * jambe voisine) — à leur position d'origine sur un calque plein cadre.
 *
 * Ne fait aucune détection ni détourage lui-même : lit uniquement le
 * manifeste produit par extract-item-diff.mjs et les fichiers PNG qu'il
 * référence (tels qu'ils sont au moment de l'exécution — donc après retouche
 * manuelle éventuelle). Le fichier édité doit rester au même chemin, à la
 * même taille (largeur/hauteur), pour correspondre à sa position enregistrée.
 *
 * Usage :
 *   node scripts/compose-item-layer.mjs --regions <chemin/vers/xxx_regions.json> --keep 1,3 [--out <chemin/layer.png>]
 *
 * Sortie : <dossier du manifeste>/<name>_layer.png (ou --out), calque plein
 * cadre prêt à superposer en jeu (mêmes dimensions que l'image source).
 */
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { mkdirSync } from 'node:fs';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      args[key] = argv[i + 1];
      i += 1;
    }
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.regions || !args.keep) {
    console.error('Usage: node scripts/compose-item-layer.mjs --regions <chemin/vers/xxx_regions.json> --keep 1,3 [--out <chemin/layer.png>]');
    process.exit(1);
  }

  const manifestPath = join(ROOT, args.regions);
  const manifestDir = dirname(manifestPath);
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  const keepIndices = args.keep.split(',').map((s) => Number(s.trim()));
  const composites = keepIndices.map((idx) => {
    const region = manifest.regions.find((r) => r.index === idx);
    if (!region) {
      throw new Error(`--keep: région ${idx} absente du manifeste (${manifest.regions.length} région(s) disponible(s))`);
    }
    return { input: join(manifestDir, region.file), left: region.left, top: region.top };
  });

  const manifestBaseName = basename(manifestPath).replace(/_regions\.json$/, '');
  const outPath = args.out ? join(ROOT, args.out) : join(manifestDir, `${manifestBaseName}_layer.png`);
  mkdirSync(dirname(outPath), { recursive: true });

  await sharp({
    create: { width: manifest.width, height: manifest.height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } }
  })
    .composite(composites)
    .png()
    .toFile(outPath);

  console.log(`Écrit (calque plein cadre, région(s) ${keepIndices.join(',')}) : ${outPath}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
