<!-- src/lib/components/PrintableCard.svelte -->
<script>
  import { onMount, onDestroy } from 'svelte';

  // Props
  export let level = 1;
  export let title = "Explorateur des Nombres";
  export let description = "Tu commences ton voyage mathématique!";
  export let imageUrl = null;
  export let colorTheme = "blue";
  export let playerName = "Joueur";
  export let date = new Date().toLocaleDateString();

  let isPrinting = false;

  // ID unique pour le container d'impression
  const printContainerId = `print-container-${Math.random().toString(36).substring(2, 11)}`;

  // Convertir l'URL de l'image en version haute résolution
  $: highResImageUrl = imageUrl ? imageUrl.replace(/level-(\d+)\.png/i, 'level-$1_lg.png') : null;

  // Préparer l'impression
  function preparePrint() {
    isPrinting = true;

    // Attendre que le DOM soit mis à jour avant d'appeler print()
    setTimeout(() => {
      window.print();

      // Remettre isPrinting à false après l'impression
      setTimeout(() => {
        isPrinting = false;
      }, 500);
    }, 300);
  }

  // Ajouter une feuille de style spécifique à l'impression au head
  onMount(() => {
    const style = document.createElement('style');
    style.id = 'print-card-styles';
    style.media = 'print';
    style.innerHTML = `
      @page {
        size: A4 portrait;
        margin: 15mm;
      }
      body * {
        visibility: hidden;
      }
      #${printContainerId}, #${printContainerId} * {
        visibility: visible !important;
      }
      #${printContainerId} {
        position: absolute;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        z-index: 9999;
        background-color: white;
      }
    `;
    document.head.appendChild(style);

    return () => {
      // Nettoyage au démontage du composant
      const styleElement = document.getElementById('print-card-styles');
      if (styleElement) {
        styleElement.remove();
      }
    };
  });
</script>

<!-- Bouton pour déclencher l'impression -->
<button class="print-button" on:click={preparePrint}>
  <span class="emoji">🖨️</span> Imprimer
</button>

<!-- Container invisible qui devient visible uniquement lors de l'impression -->
{#if isPrinting}
  <div id={printContainerId} class="print-card-container">
    <div class="print-card">
      <div class="print-header">
        <h1 class="print-title">MultyFun - Certificat de Niveau</h1>
      </div>

      <div class="print-content">
        <div class="print-level-info">
          <div class="print-level-number">Niveau {level}</div>
          <div class="print-level-title">{title}</div>

          <div class="print-level-image">
            {#if highResImageUrl}
              <div class="print-image-wrapper">
                <img src={highResImageUrl} alt="Niveau {level}" class="print-image" />
              </div>
            {:else}
              <div class="print-fallback-image"
                   style="background: {
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
                     'linear-gradient(45deg, #4d57ff, #8a90ff)'
                   }">
                <span class="fallback-level">{level}</span>
              </div>
            {/if}
          </div>

          <div class="print-level-description">
            {description}
          </div>
        </div>
      </div>

      <div class="print-player-info">
        <div class="print-player-name">
          {playerName}
        </div>
        <div class="print-date">
          {date}
        </div>
      </div>

      <div class="print-footer">
        <p>Continue ton aventure mathématique sur MultyFun!</p>
      </div>
    </div>
  </div>
{/if}

<style>
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

  .print-button:hover {
    transform: translateY(-2px);
    background-color: #e9ecef;
  }

  .emoji {
    font-size: 1.1rem;
  }

  /* Ces styles ne sont visibles que dans le document imprimé */
  .print-card-container {
    display: none; /* Masqué par défaut, visible uniquement pour l'impression */
  }

  /* Styles pour la version imprimée */
  @media print {
    .print-card-container {
      display: block;
      width: 180mm; /* Réduit la largeur pour s'adapter à A4 avec marges */
      min-height: auto; /* Ajustement automatique de la hauteur */
      box-sizing: border-box;
      background-color: white;
      margin: 0 auto;
      overflow: hidden;
    }

    .print-card {
      border: 3mm double #555;
      padding: 8mm;
      display: flex;
      flex-direction: column;
      max-height: 267mm; /* Pour s'assurer qu'il tient sur une page A4 avec marges */
    }

    .print-header {
      margin-bottom: 8mm;
      text-align: center;
      border-bottom: 2px solid #888;
      padding-bottom: 4mm;
    }

    .print-title {
      font-size: 20pt;
      font-family: 'Baloo 2', sans-serif;
      margin: 0;
      color: #333;
    }

    .print-content {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .print-level-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
    }

    .print-level-number {
      font-size: 14pt;
      margin-bottom: 3mm;
    }

    .print-level-title {
      font-size: 24pt;
      font-weight: bold;
      margin-bottom: 8mm;
      text-align: center;
    }

    .print-level-image {
      margin-bottom: 8mm;
      width: 100%;
      display: flex;
      justify-content: center;
    }

    .print-image-wrapper {
      width: 66mm; /* Image plus large en format rectangulaire */
      height: 100mm; /* Image en orientation portrait */
      margin: 0 auto;
      overflow: hidden;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
      border-radius: 8px;
    }

    .print-image {
      width: 100%;
      height: 100%;
      object-fit: cover; /* Couvre tout l'espace sans déformer */
    }

    .print-fallback-image {
      width: 80mm;
      height: 100mm;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 8px;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
    }

    .fallback-level {
      color: white;
      font-size: 48pt;
      font-weight: bold;
    }

    .print-level-description {
      font-size: 12pt;
      text-align: center;
      max-width: 90%;
      font-style: italic;
      margin: 0 auto;
    }

    .print-player-info {
      display: flex;
      justify-content: space-between;
      margin-top: 10mm;
      padding-top: 8mm;
      border-top: 1px solid #ccc;
      width: 100%;
    }

    .print-player-name {
      font-size: 14pt;
      font-weight: bold;
    }

    .print-date {
      font-size: 12pt;
    }

    .print-footer {
      margin-top: 4mm;
      text-align: center;
      font-size: 10pt;
      color: #777;
    }
  }
</style>