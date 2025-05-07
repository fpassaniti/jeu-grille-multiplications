<!-- src/lib/components/LanguagePicker.svelte -->
<script>
  // Import avec verification
  import languageStore from '$lib/stores/languageStore';
  import {languages, defaultLanguage} from "$lib/translations/index.js";

  // État du dropdown
  let isOpen = false;

  // Fonction pour basculer l'état du dropdown
  function toggleDropdown() {
    isOpen = !isOpen;
  }

  // Fonction pour sélectionner une langue
  function selectLanguage(lang) {
    if (languageStore && typeof languageStore.set === 'function') {
      languageStore.set(lang);
    } else {
      console.error('languageStore.set is not a function');
    }
    isOpen = false;
    window.location.reload()
  }

  // Fermer le dropdown quand on clique ailleurs
  function handleClickOutside(event) {
    if (isOpen && !event.target.closest('.language-picker')) {
      isOpen = false;
    }
  }

  // Ajouter et supprimer l'écouteur d'événements
  import {onMount, onDestroy} from 'svelte';

  onMount(() => {
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('click', handleClickOutside);
    }
  });

  // Obtenir le nom de la langue de manière sécurisée
  $: currentLanguageName = getLanguageName($languageStore);

  // Fonction sécurisée pour obtenir le nom de la langue
  function getLanguageName(langCode) {
    // Si languages est undefined ou null
    if (!languages) {
      console.error('languages object is undefined');
      return langCode || defaultLanguage || 'fr';
    }

    // Si le code de langue est valide et existe dans languages
    if (langCode && languages[langCode]) {
      return languages[langCode];
    }

    // Fallback au code de langue ou à la langue par défaut
    return langCode || defaultLanguage || 'fr';
  }
</script>

<div class="language-picker">
  <button class="language-button" on:click={toggleDropdown}>
    <span class="current-language">{currentLanguageName}</span>
    <svg class="dropdown-icon" viewBox="0 0 20 20" fill="currentColor">
      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path>
    </svg>
  </button>

  {#if isOpen && languages}
    <div class="language-dropdown">
      {#each Object.entries(languages) as [code, name]}
        <button
          class="language-option"
          class:selected={$languageStore === code}
          on:click={() => selectLanguage(code)}
        >
          {name}
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .language-picker {
    position: relative;
    display: inline-block;
  }

  .language-button {
    display: flex;
    align-items: center;
    background-color: transparent;
    border: none;
    color: inherit;
    cursor: pointer;
    padding: 0.5rem;
    font-size: 0.875rem;
    border-radius: 0.25rem;
    transition: background-color 0.2s;
  }

  .language-button:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }

  .dropdown-icon {
    width: 1rem;
    height: 1rem;
    margin-left: 0.25rem;
  }

  .language-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    z-index: 10;
    min-width: 120px;
    background-color: white;
    border-radius: 0.25rem;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .language-option {
    display: block;
    width: 100%;
    padding: 0.5rem 1rem;
    text-align: left;
    background: none;
    border: none;
    cursor: pointer;
    color: #333;
    transition: background-color 0.2s;
  }

  .language-option:hover {
    background-color: #f5f5f5;
  }

  .language-option.selected {
    background-color: #e6f7ff;
    font-weight: 500;
  }

  /* Mobile styles */
  @media (max-width: 768px) {
    .language-dropdown {
      right: 0;
      left: auto;
    }
  }
</style>