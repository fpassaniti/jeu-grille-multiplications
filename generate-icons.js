import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputIcon = './static/favicon.png';
const outputDir = './static';

const sizes = [
  { size: 192, name: 'icon-192x192.png' },
  { size: 192, name: 'icon-192x192-maskable.png', maskable: true },
  { size: 512, name: 'icon-512x512.png' },
  { size: 512, name: 'icon-512x512-maskable.png', maskable: true }
];

async function generateIcons() {
  try {
    console.log('Generating PWA icons...');

    for (const { size, name, maskable } of sizes) {
      const outputPath = path.join(outputDir, name);

      if (maskable) {
        // Pour les icônes maskable, ajouter du padding
        await sharp(inputIcon)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .toFile(outputPath);
      } else {
        // Pour les icônes standard
        await sharp(inputIcon)
          .resize(size, size, {
            fit: 'contain',
            background: { r: 255, g: 255, b: 255, alpha: 1 }
          })
          .toFile(outputPath);
      }

      console.log(`✓ Generated ${name}`);
    }

    console.log('All icons generated successfully!');
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

generateIcons();
