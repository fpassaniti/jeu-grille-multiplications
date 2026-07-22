// Le header n'affiche plus que l'état de connexion (voir NavigationHeader.svelte) ;
// chaque route qui a besoin de la progression/équipement du joueur les recharge elle-même.
export function load({ locals }) {
  return { user: locals.user ?? null };
}