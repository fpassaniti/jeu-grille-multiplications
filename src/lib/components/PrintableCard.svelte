<!-- src/lib/components/PrintableCard.svelte -->
<script>
  import { onMount } from 'svelte';
  import { loadTemplate, renderTemplate } from '$lib/utils/template-loader';

  // Props
  export let level = 1;
  export let title = "Explorateur des Nombres";
  export let description = "Tu commences ton voyage mathématique!";
  export let imageUrl = null;
  export let colorTheme = "blue";
  export let playerName = "Joueur";
  export let date = new Date().toLocaleDateString();

  let templateLoaded = false;
  let printTemplate = '';

  // Convertir l'URL de l'image en version haute résolution
  $: highResImageUrl = imageUrl ? imageUrl.replace(/level-(\d+)\.png/i, 'level-$1_lg.png') : null;

  // Charger le template au montage du composant
  onMount(async () => {
    try {
      printTemplate = await loadTemplate('/templates/print-certificate.html');
      templateLoaded = true;
    } catch (error) {
      console.error('Erreur lors du chargement du template:', error);
    }
  });

  // Préparer les données pour le template
  function getTemplateData() {
    // Déterminer le gradient à utiliser selon le thème de couleur
    const gradient =
      colorTheme === 'blue' ? 'linear-gradient(45deg, #4d57ff, #8a90ff)' :
        colorTheme === 'green' ? 'linear-gradient(45deg, #43d787, #7df0b2)' :
          colorTheme === 'purple' ? 'linear-gradient(45deg, #9c5fff, #c29aff)' :
            colorTheme === 'orange' ? 'linear-gradient(45deg, #ff8f3e, #ffb585)' :
              colorTheme === 'red' ? 'linear-gradient(45deg, #ff6b6b, #ff9999)' :
                colorTheme === 'teal' ? 'linear-gradient(45deg, #26c0c0, #7fe7e7)' :
                  colorTheme === 'indigo' ? 'linear-gradient(45deg, #4f46e5, #a5b4fc)' :
                    colorTheme === 'pink' ? 'linear-gradient(45deg, #ec4899, #f9a8d4)' :
                      colorTheme === 'amber' ? 'linear-gradient(45deg, #d97706, #fbbf24)' :
                        colorTheme === 'gold' ? 'linear-gradient(45deg, #d4af37, #f9e29c)' :
                          'linear-gradient(45deg, #4d57ff, #8a90ff)';

    return {
      level,
      title,
      description,
      hasImage: !!highResImageUrl,
      imageUrl: highResImageUrl,
      gradient,
      playerName,
      date
    };
  }

  // Fonction pour ouvrir la fenêtre d'impression
  function preparePrint() {
    if (!templateLoaded) {
      console.error('Le template n\'est pas encore chargé');
      alert('Erreur lors de la préparation de l\'impression. Veuillez réessayer dans quelques instants.');
      return;
    }

    try {
      // Préparer les données pour le template
      const templateData = getTemplateData();

      // Remplir le template avec les données
      const printContent = renderTemplate(printTemplate, templateData);

      // Ouvrir une nouvelle fenêtre pour l'impression
      const printWindow = window.open('', '_blank', 'width=800,height=900');

      if (printWindow) {
        printWindow.document.write(printContent);
        printWindow.document.close();
      } else {
        // Si les popups sont bloqués, alerter l'utilisateur
        alert('Veuillez autoriser les popups pour imprimer le certificat.');
      }
    } catch (error) {
      console.error('Erreur lors de la préparation de l\'impression:', error);
      alert('Une erreur est survenue lors de la préparation de l\'impression.');
    }
  }
</script>

<div class="print-component">
  <!-- Bouton pour déclencher l'impression -->
  <button class="print-button" on:click={preparePrint} disabled={!templateLoaded}>
    <span class="emoji">🖨️</span> Imprimer
  </button>
</div>

<style>
  .print-component {
    display: inline-block;
  }

  /* Styles pour le bouton d'impression */
  .print-button {
    background-color: var(--bg-secondary, #f8f9f9);
    color: var(--text-secondary, #555);
    padding: 8px 15px;
    border-radius: 12px;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 5px;
    transition: transform 0.2s, background-color 0.2s;
    border: none;
    cursor: pointer;
  }

  .print-button:hover:not(:disabled) {
    transform: translateY(-2px);
    background-color: #e9ecef;
  }

  .print-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .emoji {
    font-size: 1.1rem;
  }
</style>