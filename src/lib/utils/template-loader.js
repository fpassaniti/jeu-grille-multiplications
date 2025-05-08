/**
 * Fonction pour charger le template HTML via fetch
 * @param {string} templatePath - Chemin vers le fichier template
 * @returns {Promise<string>} - Promesse avec le contenu du template
 */
export async function loadTemplate(templatePath) {
  try {
    const response = await fetch(templatePath);
    if (!response.ok) {
      throw new Error(`Erreur lors du chargement du template: ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error('Erreur de chargement du template:', error);
    throw error;
  }
}

/**
 * Remplace les placeholders dans un template avec les valeurs fournies
 * @param {string} template - Template HTML avec des placeholders
 * @param {Object} data - Objet contenant les valeurs de remplacement
 * @returns {string} - Template avec les valeurs remplacées
 */
export function renderTemplate(template, data) {
  let result = template;

  // Remplacer les variables simples ({{variable}})
  for (const [key, value] of Object.entries(data)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value !== undefined ? value : '');
  }

  // Traiter les conditions (#if condition)
  const conditionalRegex = /{{#if ([^}]+)}}([\s\S]*?){{else}}([\s\S]*?){{\/if}}/g;
  result = result.replace(conditionalRegex, (match, condition, ifContent, elseContent) => {
    return data[condition] ? ifContent : elseContent;
  });

  // Traiter les conditions simples sans else (#if condition)
  const simpleConditionalRegex = /{{#if ([^}]+)}}([\s\S]*?){{\/if}}/g;
  result = result.replace(simpleConditionalRegex, (match, condition, content) => {
    return data[condition] ? content : '';
  });

  return result;
}