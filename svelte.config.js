import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Pas de préprocesseur : composants en JS/CSS pur
  // (vitePreprocess casse la compilation des .svelte sous Vitest 1.6 + Vite 6)
  kit: {
    // adapter-auto only supports some environments, see https://kit.svelte.dev/docs/adapter-auto for a list.
    // If your environment is not supported, or you settled on a specific environment, switch out the adapter.
    // See https://kit.svelte.dev/docs/adapters for more information about adapters.
    adapter: adapter({
      // Ajouter ceci pour s'assurer que les alias fonctionnent correctement
      alias: {
        $lib: 'src/lib'
      }
    }),

    // Configuration de l'environnement
    env: {
      dir: './'
    }
  }
};

export default config;