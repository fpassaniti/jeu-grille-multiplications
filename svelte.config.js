import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://kit.svelte.dev/docs/integrations#preprocessors
  // for more information about preprocessors
  preprocess: vitePreprocess(),

  kit: {
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: adapter({
      // Ajouter ceci pour s'assurer que les alias fonctionnent correctement
      alias: {
        $lib: 'src/lib'
      },
      // Utilisez 'edge' pour un déploiement Edge Function plus rapide
      // Ou 'nodejs18' pour un déploiement Node.js
      runtime: 'nodejs18',

      // Configuration pour les fonctions serverless
      regions: ['cdg1'], // Optionnel: spécifiez les régions Vercel (exemple: CDG pour Paris)
    }),

    // Configuration de l'environnement
    env: {
      dir: './'
    }
  }
};

export default config;