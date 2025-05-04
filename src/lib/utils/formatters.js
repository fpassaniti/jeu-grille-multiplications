/**
 * Formate un nombre de secondes en chaîne mm:ss
 * @param {number} seconds - Nombre de secondes à formater
 * @returns {string} Chaîne de caractères au format mm:ss
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Formate une date en chaîne lisible
 * @param {string} dateString - Chaîne de date ISO
 * @returns {string} Date formatée
 */
export function formatDate(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);

  // Vérification si la date est valide
  if (isNaN(date.getTime())) return '';

  // Format: JJ/MM/AAAA
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}