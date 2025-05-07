import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [sveltekit()],

  // Configuration pour les variables d'environnement
  define: {
    // Permet d'injecter les variables d'environnement côté client de manière sécurisée
    'process.env.VITE_SUPABASE_URL': JSON.stringify(process.env.VITE_SUPABASE_URL || ''),
    'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(process.env.VITE_SUPABASE_ANON_KEY || '')
    // Note: VITE_SUPABASE_SERVICE_KEY n'est pas exposé côté client
  },

  optimizeDeps: {
    esbuildOptions: {
      target: 'es2015'
    }
  }
});