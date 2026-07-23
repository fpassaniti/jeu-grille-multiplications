#!/usr/bin/env node
/**
 * Extrait un asset d'item depuis une paire d'images Nano Banana générées sur
 * fond chroma-key (vert), en éditant une seule variation à la fois (voir
 * item-art/raw/<character>/). Le script :
 *  1. Détoure le robot (fond vert → alpha réel) sur les deux images.
 *  2. Calcule la ou les zones modifiées entre base et variant, pixel par
 *     pixel, par hystérésis (comme Canny : seuil fort pour germer une
 *     région, seuil faible pour la laisser grandir) puis composantes
 *     connexes — résiste au bruit JPEG et gère les changements bilatéraux
 *     disjoints (ex. une mitaine à chaque main : deux régions séparées
 *     plutôt qu'une bbox unique qui engloberait tout le torse entre les
 *     deux). L'hystérésis est ce qui évite qu'une pièce de robot non
 *     modifiée mais géométriquement collée à l'ajout (ex. le connecteur de
 *     poignet) serve de pont vers un autre bout de robot sans rapport (ex.
 *     une jambe démasquée par une mitaine plus volumineuse que la main nue) —
 *     une dilatation ou un masque par bloc grossier ne fait pas cette
 *     distinction (bug observé et corrigé en pratique, 2026-07-22).
 *  3. Découpe chaque région dans l'image variant détourée et l'enregistre
 *     comme asset dédié (crop serré), sur fond transparent — pour la revue
 *     humaine : quelles régions sont de vrais ajouts, lesquelles sont du bruit,
 *     et pour un éventuel nettoyage manuel (voir plus bas). Masqué par la
 *     forme réelle des pixels modifiés, jamais par le rectangle englobant.
 *
 * Ce script s'arrête là : il écrit aussi un manifeste `<name>_regions.json`
 * (position left/top/width/height de chaque région + nom de fichier) et
 * s'arrête — il ne construit plus jamais lui-même le calque final. Certains
 * cas (silhouettes réellement connectées, ex. une mitaine collée à l'armure
 * de jambe voisine) ne peuvent PAS être nettoyés automatiquement : c'est à
 * l'humain d'ouvrir le `_diff_asset_N.png` concerné dans un éditeur d'image
 * et d'effacer les pixels en trop, avant de lancer l'étape suivante :
 *
 *   scripts/compose-item-layer.mjs --regions <name>_regions.json --keep 1,3
 *
 * qui recolle les crops (éventuellement retouchés) à leur position d'origine
 * sur un calque plein cadre (même cadrage 1024×1024 que base/variant, alpha=0
 * ailleurs) — le fichier prêt à superposer en jeu. Comme il partage le
 * cadrage exact du personnage de base, il se superpose pixel-perfect sans
 * aucun calcul de position — pas besoin de coordonnées x/y séparées tant que
 * tous les accessoires sont générés comme des éditions du même personnage de
 * base/même pose.
 *
 * Aucun redimensionnement n'est appliqué : les fichiers gardent la résolution
 * native de Nano Banana (1024×1024). CharacterAvatar.svelte affiche déjà
 * chaque calque via `object-fit: contain` dans une boîte carrée de taille
 * CSS fixe (40/70/100/150/300px selon le contexte) — le rendu est basé sur le
 * ratio d'aspect (1:1), pas sur les pixels sources, donc du 1024×1024 s'affiche
 * correctement sans changement de code.
 *
 * Étape d'extraction du pipeline item-art/ (voir scripts/compose-item-layer.mjs
 * pour recoller les régions en calque final, puis scripts/add-shop-item.mjs
 * pour l'ajouter au catalogue : copie dans static/images/items/, insertion
 * en base).
 *
 * Usage :
 *   node scripts/extract-item-diff.mjs --base <chemin.jpg> --variant <chemin.jpg> --name <nom> \
 *     [--out <dossier>] [--key-threshold N] [--diff-threshold N] [--weak-diff-threshold N] [--padding N] [--min-region-pixels N]
 *
 * Sorties (dans --out, défaut item-art/extracted/<name>/) :
 *   <name>_base_extracted.png     robot de base, fond transparent
 *   <name>_variant_extracted.png  robot avec le nouvel élément, fond transparent
 *   <name>_diff_asset.png         une seule région modifiée détectée, fond transparent
 *   <name>_diff_asset_1.png, _2.png, ...  si plusieurs régions disjointes détectées (crops de revue, à nettoyer si besoin)
 *   <name>_regions.json           manifeste des positions, consommé par scripts/compose-item-layer.mjs
 */
import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');

const KEY_BAND = 40;

/** Parse `--flag value` en objet simple. */
function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const value = argv[i + 1];
      args[key] = value;
      i += 1;
    }
  }
  return args;
}

/** Moyenne des pixels d'un patch NxN à (x0,y0) dans un buffer RGBA. */
function averagePatch(data, info, x0, y0, patchSize) {
  const { width, height, channels } = info;
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let y = y0; y < y0 + patchSize && y < height; y += 1) {
    for (let x = x0; x < x0 + patchSize && x < width; x += 1) {
      const idx = (y * width + x) * channels;
      r += data[idx];
      g += data[idx + 1];
      b += data[idx + 2];
      count += 1;
    }
  }
  return { r: r / count, g: g / count, b: b / count };
}

/** Échantillonne la couleur clé (fond) sur les 4 coins de l'image de base. */
function sampleKeyColor(data, info) {
  const { width, height } = info;
  const patchSize = 5;
  const corners = [
    averagePatch(data, info, 0, 0, patchSize),
    averagePatch(data, info, width - patchSize, 0, patchSize),
    averagePatch(data, info, 0, height - patchSize, patchSize),
    averagePatch(data, info, width - patchSize, height - patchSize, patchSize)
  ];
  const sum = corners.reduce((acc, c) => ({ r: acc.r + c.r, g: acc.g + c.g, b: acc.b + c.b }), { r: 0, g: 0, b: 0 });
  return { r: sum.r / corners.length, g: sum.g / corners.length, b: sum.b / corners.length };
}

function colorDistance(r, g, b, key) {
  const dr = r - key.r;
  const dg = g - key.g;
  const db = b - key.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Retire le fond chroma-key d'un buffer RGBA : sous lowThreshold -> transparent,
 * au-dessus de lowThreshold + KEY_BAND -> opaque, entre les deux -> dégradé
 * (anti-aliasing des bords, évite les franges dures).
 */
function removeGreenScreen(data, info, keyColor, lowThreshold) {
  const highThreshold = lowThreshold + KEY_BAND;
  const { width, height, channels } = info;
  const out = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i += 1) {
    const srcIdx = i * channels;
    const dstIdx = i * 4;
    const r = data[srcIdx];
    const g = data[srcIdx + 1];
    const b = data[srcIdx + 2];
    const distance = colorDistance(r, g, b, keyColor);
    let alpha;
    if (distance <= lowThreshold) {
      alpha = 0;
    } else if (distance >= highThreshold) {
      alpha = 255;
    } else {
      alpha = Math.round(((distance - lowThreshold) / KEY_BAND) * 255);
    }
    out[dstIdx] = r;
    out[dstIdx + 1] = g;
    out[dstIdx + 2] = b;
    out[dstIdx + 3] = alpha;
  }
  return out;
}

/**
 * Différence par pixel (moyenne des écarts RGB) entre base et variant.
 * Retourne un Float32Array plein cadre — pas encore seuillé.
 */
function computeDiffPixelGrid(baseData, variantData, info) {
  const { width, height, channels } = info;
  const diff = new Float32Array(width * height);
  for (let i = 0; i < width * height; i += 1) {
    const idx = i * channels;
    const dr = Math.abs(baseData[idx] - variantData[idx]);
    const dg = Math.abs(baseData[idx + 1] - variantData[idx + 1]);
    const db = Math.abs(baseData[idx + 2] - variantData[idx + 2]);
    diff[i] = (dr + dg + db) / 3;
  }
  return diff;
}

/** Flou boîte séparable (bords clampés), O(largeur×hauteur) par passe. */
function boxBlur(grid, width, height, radius) {
  const windowSize = radius * 2 + 1;
  const temp = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * width;
    let sum = 0;
    for (let x = -radius; x <= radius; x += 1) {
      sum += grid[row + Math.min(width - 1, Math.max(0, x))];
    }
    for (let x = 0; x < width; x += 1) {
      temp[row + x] = sum / windowSize;
      const removeX = Math.min(width - 1, Math.max(0, x - radius));
      const addX = Math.min(width - 1, Math.max(0, x + radius + 1));
      sum += grid[row + addX] - grid[row + removeX];
    }
  }
  const out = new Float32Array(width * height);
  for (let x = 0; x < width; x += 1) {
    let sum = 0;
    for (let y = -radius; y <= radius; y += 1) {
      sum += temp[Math.min(height - 1, Math.max(0, y)) * width + x];
    }
    for (let y = 0; y < height; y += 1) {
      out[y * width + x] = sum / windowSize;
      const removeY = Math.min(height - 1, Math.max(0, y - radius));
      const addY = Math.min(height - 1, Math.max(0, y + radius + 1));
      sum += temp[addY * width + x] - temp[removeY * width + x];
    }
  }
  return out;
}

/**
 * Un léger flou (3×3) avant seuillage supprime le bruit JPEG "poivre et sel"
 * du fond — sans lui, assez de pixels isolés dépassent même un seuil faible
 * bas pour former, par connectivité, un pont traversant tout le fond (testé
 * en pratique : sans flou, une seule région finissait par couvrir l'image
 * entière). Un flou de rayon 1 amortit le bruit ponctuel sans effacer les
 * vrais bords (larges de plusieurs pixels).
 */
function computeSmoothedDiffGrid(baseData, variantData, info) {
  return boxBlur(computeDiffPixelGrid(baseData, variantData, info), info.width, info.height, 1);
}

/**
 * Regroupe les pixels modifiés en composantes connexes par hystérésis
 * (comme Canny) : germe sur les pixels dépassant `diffThreshold` (seuil
 * fort), grandit par 8-connectivité uniquement à travers des pixels
 * dépassant `weakThreshold` (seuil faible) — jamais à travers un pixel
 * quasi identique à la base. C'est le point clé qui distingue ce script d'une
 * simple dilatation ou d'un masque par bloc : une pièce de robot **non
 * modifiée** entre base et variant (ex. le connecteur du poignet) a un diff
 * ~0 et agit donc comme une vraie coupure, même si elle est géométriquement
 * collée à l'élément ajouté — elle ne sert jamais de pont vers un autre bout
 * de robot sans rapport (ex. un bout de jambe démasqué par une mitaine plus
 * volumineuse que la main nue, cf. en-tête du fichier). Une composante n'est
 * gardée que si elle contient au moins un pixel "fort" (sinon ce n'est que du
 * bruit faible sans vrai centre) et si sa taille dépasse `minRegionPixels`.
 * Retourne un tableau de régions {left, top, width, height, mask}, où `mask`
 * est un Uint8Array plein cadre (1 = pixel à garder) ; `left/top/width/
 * height` ne servent qu'à cadrer les crops de revue.
 */
function computeDiffRegions(baseData, variantData, info, diffThreshold, weakThreshold, padding, minRegionPixels) {
  const { width, height } = info;
  const diffGrid = computeSmoothedDiffGrid(baseData, variantData, info);
  const visited = new Uint8Array(width * height);
  const regions = [];
  let droppedAsNoise = 0;

  for (let start = 0; start < width * height; start += 1) {
    if (visited[start] || diffGrid[start] < diffThreshold) continue;

    const mask = new Uint8Array(width * height);
    const stack = [start];
    visited[start] = 1;
    let hasStrong = false;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    let count = 0;

    while (stack.length > 0) {
      const idx = stack.pop();
      mask[idx] = 1;
      count += 1;
      if (diffGrid[idx] >= diffThreshold) hasStrong = true;
      const x = idx % width;
      const y = (idx - x) / width;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          if (dx === 0 && dy === 0) continue;
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const nidx = ny * width + nx;
          if (visited[nidx] || diffGrid[nidx] < weakThreshold) continue;
          visited[nidx] = 1;
          stack.push(nidx);
        }
      }
    }

    // Un vrai ajout couvre une zone substantielle ; un cluster minuscule
    // isolé est presque toujours du bruit JPEG (recompression, léger
    // crénelage), pas un élément réel — on l'ignore plutôt que de produire
    // un fichier parasite par spéculation.
    if (!hasStrong || count < minRegionPixels) {
      droppedAsNoise += 1;
      continue;
    }

    const left = Math.max(0, minX - padding);
    const top = Math.max(0, minY - padding);
    const right = Math.min(width, maxX + 1 + padding);
    const bottom = Math.min(height, maxY + 1 + padding);
    regions.push({ left, top, width: right - left, height: bottom - top, mask });
  }

  if (droppedAsNoise > 0) {
    console.log(`  (${droppedAsNoise} cluster(s) ignoré(s) comme bruit)`);
  }

  if (regions.length === 0) {
    throw new Error('Aucune différence détectée entre base et variant (ajuster --diff-threshold / --min-region-pixels).');
  }

  regions.sort((a, b) => a.left - b.left);
  return regions;
}

/**
 * Masque un buffer RGBA : alpha forcé à 0 pour tout pixel absent de tous les
 * masques pixel-perfect fournis (Uint8Array, cf. computeDiffRegions). Même
 * dimensions que la source -> superposition pixel-perfect avec le calque de
 * base, aucune coordonnée à recalculer. Utilisé pour les crops de revue (un
 * seul masque) comme pour le calque final (union des masques des régions
 * gardées).
 */
function buildMaskedBuffer(source, info, masks) {
  const { width, height, channels } = info;
  const out = Buffer.from(source);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const idx = y * width + x;
      const inside = masks.some((mask) => mask[idx]);
      if (!inside) {
        out[(y * width + x) * channels + 3] = 0;
      }
    }
  }
  return out;
}

async function loadRaw(path) {
  return sharp(path).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

async function savePng(buffer, info, path) {
  await sharp(buffer, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toFile(path);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.base || !args.variant || !args.name) {
    console.error('Usage: node scripts/extract-item-diff.mjs --base <chemin> --variant <chemin> --name <nom> [--out <dossier>] [--key-threshold N] [--diff-threshold N] [--weak-diff-threshold N] [--padding N] [--min-region-pixels N]');
    process.exit(1);
  }

  const outDir = args.out ? join(ROOT, args.out) : join(ROOT, 'item-art', 'extracted', args.name);
  const keyThreshold = args['key-threshold'] ? Number(args['key-threshold']) : 60;
  const diffThreshold = args['diff-threshold'] ? Number(args['diff-threshold']) : 20;
  // Seuil "faible" : permet à une région germée par un pixel fort de grandir à
  // travers des pixels réellement un peu différents (anti-aliasing, ombre
  // portée par le nouvel objet) — jamais à travers un pixel quasi identique à
  // la base (ex. le connecteur de poignet, non modifié, qui sinon ferait pont
  // vers un bout de robot sans rapport). Mesuré en pratique (item-art/) : le
  // fond chroma-key "identique" entre deux générations a lui-même un plancher
  // de bruit JPEG systématique allant jusqu'à ~14-15 (pas juste quelques pixels
  // isolés — tout le fond est légèrement décalé) — le seuil faible doit rester
  // nettement au-dessus, sous peine de voir tout le fond se connecter en une
  // seule région géante (bug observé et corrigé le 2026-07-22).
  const weakThreshold = args['weak-diff-threshold'] ? Number(args['weak-diff-threshold']) : Math.max(18, Math.round(diffThreshold * 0.8));
  const padding = args.padding ? Number(args.padding) : 20;
  const minRegionPixels = args['min-region-pixels'] ? Number(args['min-region-pixels']) : 400;

  mkdirSync(outDir, { recursive: true });

  const { data: baseData, info: baseInfo } = await loadRaw(join(ROOT, args.base));
  const { data: variantData, info: variantInfo } = await loadRaw(join(ROOT, args.variant));

  if (baseInfo.width !== variantInfo.width || baseInfo.height !== variantInfo.height) {
    throw new Error(`Dimensions différentes entre base (${baseInfo.width}x${baseInfo.height}) et variant (${variantInfo.width}x${variantInfo.height}).`);
  }

  const keyColor = sampleKeyColor(baseData, baseInfo);
  console.log(`Couleur clé détectée : rgb(${keyColor.r.toFixed(1)}, ${keyColor.g.toFixed(1)}, ${keyColor.b.toFixed(1)})`);

  const baseExtracted = removeGreenScreen(baseData, baseInfo, keyColor, keyThreshold);
  const variantExtracted = removeGreenScreen(variantData, variantInfo, keyColor, keyThreshold);

  const baseExtractedPath = join(outDir, `${args.name}_base_extracted.png`);
  const variantExtractedPath = join(outDir, `${args.name}_variant_extracted.png`);
  await savePng(baseExtracted, baseInfo, baseExtractedPath);
  await savePng(variantExtracted, variantInfo, variantExtractedPath);
  console.log(`Écrit : ${baseExtractedPath}`);
  console.log(`Écrit : ${variantExtractedPath}`);

  const regions = computeDiffRegions(baseData, variantData, baseInfo, diffThreshold, weakThreshold, padding, minRegionPixels);
  console.log(`${regions.length} région(s) modifiée(s) détectée(s)`);

  const manifestRegions = [];
  for (let i = 0; i < regions.length; i += 1) {
    const region = regions[i];
    const index = i + 1;
    console.log(`  région ${index}: left=${region.left} top=${region.top} width=${region.width} height=${region.height}`);
    const suffix = regions.length === 1 ? '' : `_${index}`;
    const fileName = `${args.name}_diff_asset${suffix}.png`;
    const diffAssetPath = join(outDir, fileName);
    // Masque par la forme réelle de la région (pas par son rectangle englobant)
    // avant de rogner : sinon un bout de robot sans rapport qui traîne dans le
    // rectangle (ex. une jambe à côté d'une mitaine) se retrouve dans le crop.
    const maskedForReview = buildMaskedBuffer(variantExtracted, variantInfo, [region.mask]);
    await sharp(maskedForReview, { raw: { width: variantInfo.width, height: variantInfo.height, channels: 4 } })
      .extract({ left: region.left, top: region.top, width: region.width, height: region.height })
      .png()
      .toFile(diffAssetPath);
    console.log(`Écrit : ${diffAssetPath}`);
    manifestRegions.push({ index, left: region.left, top: region.top, width: region.width, height: region.height, file: fileName });
  }

  // Manifeste consommé par scripts/compose-item-layer.mjs : la retouche
  // manuelle (nettoyer un bout de robot en trop dans un _diff_asset_N.png,
  // directement dans un éditeur d'image) se fait entre les deux scripts —
  // celui-ci n'assemble plus jamais lui-même le calque final.
  const manifestPath = join(outDir, `${args.name}_regions.json`);
  await writeFile(
    manifestPath,
    `${JSON.stringify({ width: variantInfo.width, height: variantInfo.height, regions: manifestRegions }, null, 2)}\n`
  );
  console.log(`Écrit : ${manifestPath}`);
  console.log('Revue humaine ensuite : nettoyer les _diff_asset_N.png si besoin, puis scripts/compose-item-layer.mjs --keep ...');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
