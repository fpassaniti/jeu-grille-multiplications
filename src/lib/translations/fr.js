export default {
  common: {
    appName: 'MultyFun',
    home: 'Accueil',
    play: 'Jouer',
    collection: 'Collection',
    login: 'Connexion',
    register: 'Inscription',
    logout: 'Déconnexion',
    greeting: 'Bonjour, {name}!',
    backToHome: 'Retour à l\'accueil',
    loggedInAs: 'Connecté en tant que',
    error: 'Erreur',
    success: 'Succès',
    loading: 'Chargement...',
    next: 'Suivant',
    previous: 'Précédent',
    save: 'Sauvegarder',
    cancel: 'Annuler',
    yes: 'Oui',
    no: 'Non',
    close: 'Fermer',
    select: 'Sélectionner',
    all: 'Tout',
    none: 'Aucun',
    level: 'Niveau',
    levels: 'Niveaux',
    score: 'Score',
    scores: 'Scores',
    xp: 'XP',
    date: 'Date',
    adult: 'Adulte',
    child: 'Enfant',
    name: 'Nom',
    duration: 'Durée',
    status: 'Statut',
    language: 'Langue',
    selectLanguage: 'Sélectionner la langue',
    copyright: '© {year} {appName} - Apprends les multiplications en t\'amusant!',
    min: 'min',
    coins: 'Pièces',
    shop: 'Boutique',
    character: 'Personnage',
  },

  navigation: {
    logoutTitle: 'Déconnexion'
  },

  home: {
    title: 'MultyFun - Apprends les multiplications en t\'amusant!',
    metaDescription: 'Améliore tes compétences en multiplication avec ce jeu interactif amusant et gagne des niveaux!',
    gameTitle: 'Jeu de Multiplication',
    gameIntro: 'Résous autant de multiplications que possible avant la fin du temps!',
    levelNumber: 'Niveau {level}:',
    startOptions: {
      startAdventure: {
        title: 'Commencer l\'aventure',
        description: 'Crée un compte et gagne des niveaux!'
      },
      login: {
        title: 'Se connecter',
        description: 'Continue ton aventure mathématique!'
      }
    },
    modesShowcase: {
      title: 'Choisis ton calcul'
    },
    gamificationShowcase: {
      title: 'Un jeu qui te récompense chaque jour',
      character: {
        title: 'Ton personnage',
        description: 'Équipe ton aventurier avec des tenues, armes et compagnons à débloquer.'
      },
      coins: {
        title: 'Des pièces d\'or',
        description: 'Gagne des pièces à chaque partie et dépense-les dans la boutique.'
      },
      chests: {
        title: 'Des coffres à ouvrir',
        description: 'Coffre quotidien, coffre de niveau, coffre de série... plein de surprises t\'attendent.'
      },
      streaks: {
        title: 'Une série à préserver',
        description: 'Reviens chaque jour pour faire grandir ta série et débloquer des récompenses.'
      }
    },
    features: {
      title: 'Pourquoi jouer à MultyFun?',
      gainLevels: {
        title: 'Gagne des niveaux',
        description: 'Accumule de l\'expérience et monte en grade!'
      },
      collectTitles: {
        title: 'Collectionne des titres',
        description: 'Débloque 10 titres uniques de champion!'
      },
      printCard: {
        title: 'Imprime ta carte',
        description: 'Montre ta progression à tes amis!'
      },
      playEverywhere: {
        title: 'Joue partout',
        description: 'Sur ordinateur, tablette ou téléphone!'
      }
    },
    leaderboard: {
      title: 'Découvre les meilleurs joueurs!',
      description: 'Vois qui est en tête du classement et défie-les!',
      viewButton: 'Voir le classement'
    }
  },

  auth: {
    loginTitle: 'Connexion',
    loginSubtitle: 'Connecte-toi pour suivre ta progression et débloquer des récompenses !',
    username: 'Nom d\'utilisateur',
    secretCharacter: 'Caractère secret',
    chooseSecretCharacter: 'Choisis un caractère secret',
    clickEmoji: 'Clique sur l\'émoji que tu utilises comme mot de passe',
    loggingIn: 'Connexion...',
    loginButton: 'Se connecter',
    noAccount: 'Pas encore de compte ? Inscris-toi ici',
    fillAllFields: 'Veuillez remplir tous les champs',
    loginError: 'Erreur lors de la connexion',
    connectionError: 'Problème de connexion au serveur',
    
    registerTitle: 'Créer un compte',
    registerSubtitle: 'Commence ton aventure mathématique!',
    accountCreated: 'Compte créé avec succès!',
    welcomeMessage: 'Bienvenue dans l\'aventure MultyFun! Tu vas être redirigé vers ton tableau de bord...',
    firstName: 'Ton prénom',
    firstNamePlaceholder: 'Entre ton prénom',
    firstNameHelp: 'C\'est le nom que tu utiliseras pour te connecter',
    displayName: 'Nom d\'affichage (optionnel)',
    displayNamePlaceholder: 'Comment veux-tu qu\'on t\'appelle?',
    displayNameHelp: 'C\'est le nom qui sera affiché dans le jeu',
    secretCharacterHelp: 'Ton caractère secret',
    emojiPassword: 'Choisis un emoji comme mot de passe. Tu utiliseras celui-ci pour te connecter.',
    creatingAccount: 'Création en cours...',
    createAccount: 'Créer mon compte',
    alreadyHaveAccount: 'Tu as déjà un compte?',
    requiredFields: 'Le prénom et le caractère secret sont obligatoires',
    registrationError: 'Erreur d\'inscription',
    accountCreationError: 'Erreur lors de la création du compte. Essaie à nouveau.'
  },

  dashboard: {
    title: 'Tableau de bord - MultyFun',
    welcome: 'Bonjour, {name}!',
    levelNumber: 'Niveau {level}',
    defaultLevelName: 'Explorateur des Nombres',
    defaultLevelDescription: 'Tu as commencé ton voyage dans le monde des mathématiques!',
    gamesPlayed: 'Parties jouées',
    totalXp: 'XP totale',
    nextLevel: 'Niveau suivant: {title}',
    xpUntilNextLevel: '{xp} XP nécessaires pour le niveau suivant',
    maxLevel: 'Tu as atteint le niveau maximum!',
    playButton: 'Jouer',
    collectionButton: 'Collection',
    printCardButton: 'Imprimer ma carte',
    recentGames: 'Parties récentes',
    noGames: 'Tu n\'as pas encore joué de parties.',
    playNow: 'Jouer maintenant!',
    logoutError: 'Erreur lors de la déconnexion'
  },

  shop: {
    title: 'Boutique',
    subtitle: 'Personnalise ton aventurier !',
    dailyOffers: 'Offres du jour',
    owned: 'Possédé',
    buy: 'Acheter',
    confirmTitle: 'Confirmer l\'achat',
    confirmBuy: 'Acheter pour {price} 🪙 ?',
    confirmRemaining: 'Il te restera {remaining} 🪙',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    bought: 'Acheté !',
    insufficient_coins: 'Pas assez de pièces',
    already_owned: 'Déjà possédé',
    level_locked: 'Niveau {level} requis',
    levelLocked: 'Niveau {level} requis',
    not_purchasable: 'Non disponible à l\'achat',
    already_active: 'Déjà actif',
    freeze_cap_reached: 'Nombre maximum de gels atteint',
    tryOn: 'Essayer',
    potions: 'Potions',
    freezeName: 'Gel de streak',
    freezeDesc: 'Protège ta série si tu rates un jour',
    boosterName: 'Potion ×2',
    boosterDesc: 'Double tes pièces sur 3 parties',
    boosterActive: 'Potion active !',
    slots: {
      background: 'Décor',
      aura: 'Aura',
      back: 'Dos',
      body: 'Corps',
      outfit: 'Tenue',
      weapon: 'Arme',
      hat: 'Chapeau',
      pet: 'Familier'
    },
    rarity: {
      common: 'Commun',
      uncommon: 'Peu commun',
      rare: 'Rare',
      epic: 'Épique',
      legendary: 'Légendaire',
      mythic: 'Mythique'
    },
    allRarities: 'Tous'
  },

  character: {
    title: 'Mon personnage',
    subtitle: 'Équipe les objets que tu as débloqués',
    equip: 'Équiper',
    equipped: 'Équipé',
    unequip: 'Retirer',
    none: 'Aucun',
    empty: 'Gagne des items dans la boutique et les coffres !',
    goToShop: 'Aller à la boutique'
  },

  admin: {
    fittingRoom: {
      navLabel: 'Cabine d\'essayage',
      title: 'Cabine d\'essayage',
      subtitle: 'Essaie tous les équipements de la boutique, sans limite de niveau ni de prix.',
      reset: 'Réinitialiser'
    }
  },

  chest: {
    open: 'Ouvrir mon coffre',
    tapToOpen: 'Tape sur le coffre pour l\'ouvrir !',
    daily: 'Coffre quotidien',
    streak: 'Coffre de série',
    levelup: 'Coffre de niveau',
    perfect: 'Coffre parfait',
    welcome: 'Coffre de bienvenue',
    welcomeTitle: 'Bienvenue dans la nouvelle aventure !',
    welcomeText: 'Voici un cadeau pour fêter les nouveautés de MultyFun.',
    youWon: 'Tu as gagné {coins} 🪙 !',
    newItem: 'Nouvel objet débloqué !',
    duplicate: 'Tu l\'as déjà ! +{refund} 🪙',
    comeBackTomorrow: 'Reviens demain pour un nouveau coffre !',
    alreadyOpened: 'Déjà ouvert aujourd\'hui'
  },

  rewards: {
    base: 'Pièces gagnées',
    weekend: 'Bonus week-end ×2 !',
    booster: 'Potion ×2 ⚡',
    firstOfDay: 'Première partie du jour',
    streakBonus: 'Bonus streak 🔥',
    perfectBonus: 'Partie parfaite 💯',
    openChest: 'Un coffre t\'attend !'
  },

  streak: {
    days: '{count} jours de suite 🔥',
    calendarTitle: 'Ta semaine',
    nextMilestone: 'Encore {days} jour(s) → coffre {reward} !',
    freezeUsed: 'Ton gel de streak 🛡️ t\'a sauvé !',
    freezeCount: 'Gels de streak disponibles',
    milestoneReached: 'Palier de streak atteint !'
  },

  game: {
    answerPlaceholder: 'Ta réponse',
    recentlySolved: 'Dernières réponses justes',
    noSolved: 'Aucune question résolue pour le moment.',
    pointsEarned: '+{points} pts',
    validate: 'OK ✓'
  },

  modes: {
    chooseMode: 'Choisis ton calcul :',
    tables: 'Tables',
    addition: 'Additions',
    subtraction: 'Soustractions',
    multiplication: 'Multiplications',
    division: 'Divisions'
  },

  difficulty: {
    chooseTitle: 'Choisis ta difficulté :',
    customHint: 'Coche les exercices que tu veux travailler :',
    editExercises: 'Voir / modifier les exercices',
    selectAll: 'Tout cocher',
    presets: {
      ce1: 'CE1',
      ce2: 'CE2',
      cm1: 'CM1'
    },
    tiers: {
      A1: 'Sans retenue, jusqu\'à 20',
      A2: 'Sans retenue, jusqu\'à 100',
      A3: 'Avec retenue, jusqu\'à 100',
      A4: 'Sans retenue, jusqu\'à 1000',
      A5: 'Avec retenue, jusqu\'à 1000',
      A6: 'Avec retenue, jusqu\'à 10 000',
      S1: 'Sans emprunt, jusqu\'à 20',
      S2: 'Sans emprunt, jusqu\'à 100',
      S3: 'Avec emprunt, jusqu\'à 100',
      S4: 'Sans emprunt, jusqu\'à 1000',
      S5: 'Avec emprunt, jusqu\'à 1000',
      M1: 'Multiplier par 10',
      M2: 'Multiplier par 100 ou 1000',
      M3: '2 chiffres × 1 chiffre, sans retenue',
      M4: '2 chiffres × 1 chiffre, avec retenue',
      M5: '3 chiffres × 1 chiffre',
      M6: '2-3 chiffres × 2 chiffres',
      D1: 'Diviser par 2, 5 ou 10',
      D2: 'Diviser par 3, 4 ou 6',
      D3: 'Diviser par 7, 8 ou 9'
    }
  },

  leaderboard: {
    nameHeader: 'Nom',
    scoreHeader: 'Score',
    tablesHeader: 'Tables',
    dateHeader: 'Date',
    allTables: 'Toutes les tables',
    noScores: 'Aucun score enregistré pour ce niveau et cette durée.',
    beFirst: 'Sois le premier à relever le défi!'
  },

  collection: {
    pageTitle: 'Ma Collection - MultyFun',
    title: 'Ma Collection de Niveaux',
    description: 'Découvre tous les niveaux que tu peux débloquer en jouant à MultyFun! Chaque niveau franchi te donne un nouveau titre et un badge à collectionner et imprimer. Pour habiller ton personnage, direction la boutique !',
    unlockedLevels: 'Niveaux débloqués:',
    currentLevel: 'Niveau actuel:',
    levelLabel: 'Niveau',
    unlocked: 'Débloqué',
    locked: 'Verrouillé',
    unlockHint: 'Débloque ce niveau en gagnant plus d\'XP!',
    requiredXp: 'XP nécessaire:',
    xpNeeded: 'Encore {xp} XP à gagner',
    print: 'Imprimer',
    certificateTitle: 'MultyFun - Certificat de Niveau',
    currentLevelLabel: 'Niveau actuel',
    continueAdventure: 'Continue ton aventure mathématique sur MultyFun!',
    templateNotLoaded: 'Le modèle d\'impression n\'est pas encore chargé. Veuillez réessayer.',
    popupBlocked: 'Veuillez autoriser les popups pour imprimer le certificat.',
    printError: 'Une erreur est survenue lors de la préparation de l\'impression.',
  },

  play: {
    pageTitle: 'MultyFun - Jeu de Multiplication',
    metaDescription: 'Améliorez vos compétences en multiplication avec ce jeu interactif amusant pour les enfants et les adultes!',
    title: 'Jeu de Multiplication',
    description: 'Résous autant de multiplications que possible avant la fin du temps!',
    chooseLevel: 'Choisis ton niveau:',
    adultResponseTime: 'Temps de réponse: 5-15 secondes',
    childResponseTime: 'Temps de réponse: 15-45 secondes',
    chooseDuration: 'Choisis la durée:',
    start: 'Commencer',
    timeLabel: 'Temps:',
    levelLabel: 'Niveau:',
    scoreLabel: 'Score:',
    solvedLabel: 'Multiplications résolues:',
    errorsLabel: 'Erreurs:',
    tablesLabel: 'Tables sélectionnées:',
    currentMultiplicationLabel: 'Multiplication actuelle:',
    currentQuestionLabel: 'Question :',
    solvedGenericLabel: '{count} réponses justes',
    gameOver: 'Partie terminée!',
    yourScore: 'Ton score:',
    solvedMultiplications: 'Multiplications résolues:',
    practicedTables: 'Tables pratiquées:',
    earnedXp: 'XP gagnée:',
    progressionTitle: 'Progression dans l\'aventure',
    savingScore: 'Ton score est en cours de sauvegarde...',
    levelUp: 'Niveau Supérieur!',
    reachedLevel: 'Tu as atteint le niveau...',
    viewNewLevel: 'Voir mon nouveau niveau',
    scoreSaved: 'Score sauvegardé avec succès!',
    xpEarned: 'Tu as gagné {xp} points d\'expérience.',
    newGame: 'Nouvelle partie',
    backToHome: 'Retour à l\'accueil',
    dashboardButton: 'Tableau de bord',
    viewLeaderboardButton: 'Voir le classement',
    gridReset: 'Nouvelle grille! Continue à jouer!',
    endGame: 'Finir la partie',
  },

  tableSelector: {
    title: 'Tables à pratiquer:',
    selectAll: 'Tout sélectionner',
    deselectAll: 'Tout désélectionner',
    allTablesInfo: 'Aucune table choisie = toutes les tables seront utilisées !',
    selectedTables: 'Tables sélectionnées:'
  },

  level: {
    1: 'Explorateur des Nombres',
    2: 'Apprenti Calculateur',
    3: 'Chasseur de Solutions',
    4: 'Éclaireur des Tables',
    5: 'Rêveur Numérique',
    6: 'Gardien des Multiplications',
    7: 'Aventurier du Calcul',
    8: 'Mage des Chiffres',
    9: 'Chevalier des Tables',
    10: 'Alchimiste des Formules',
    11: 'Architecte Mathématique',
    12: 'Dompteur d\'Équations',
    13: 'Maître des Tables',
    14: 'Chroniqueur des Nombres',
    15: 'Oracle des Solutions',
    16: 'Ninja Mathématique',
    17: 'Champion des Calculs',
    18: 'Sage des Multiplications',
    19: 'Sorcier des Algorithmes',
    20: 'Légende des Nombres',
    21: 'Gardien des Théorèmes',
    22: 'Érudit des Tables',
    23: 'Grand Maître Calculateur',
    24: 'Virtuose des Équations',
    25: 'Titan des Multiplications',
    26: 'Commandant de la Logique',
    27: 'Archimage Numérique',
    28: 'Souverain des Mathématiques',
    29: 'Génie Universel',
    30: 'Légende du Multivers',

    description: {
      1: "Tu commences ton voyage dans le monde des mathématiques. Une aventure passionnante t'attend!",
      2: "Tu maîtrises maintenant les bases du calcul. Continue à t'entraîner!",
      3: "Tu es maintenant capable de résoudre des problèmes plus complexes.",
      4: "Tu explores avec aisance les tables de multiplication.",
      5: "Tu imagines des connexions entre les nombres et trouves des solutions créatives.",
      6: "Tu protèges et préserves la connaissance des multiplications.",
      7: "Tu t'aventures maintenant dans des calculs plus complexes.",
      8: "Tu manipules les nombres avec une habileté presque magique.",
      9: "Tu défends vaillamment ta maîtrise des tables face à tous les défis.",
      10: "Tu transformes des problèmes complexes en solutions élégantes.",
      11: "Tu construis des fondations mathématiques solides pour ta réussite future.",
      12: "Les multiplications les plus difficiles n'ont plus de secrets pour toi.",
      13: "Ta maîtrise des tables de multiplication est exemplaire.",
      14: "Tu enregistres et te souviens des faits mathématiques avec précision.",
      15: "Tu prédis les résultats des calculs avant même de les terminer.",
      16: "Ta rapidité et ta précision sont impressionnantes.",
      17: "Tu excelles dans l'arène des défis mathématiques.",
      18: "Ta sagesse mathématique inspire les autres.",
      19: "Tu comprends les logiques cachées des opérations mathématiques.",
      20: "Tes exploits de calcul font de toi une véritable légende.",
      21: "Tu protèges et appliques les principes mathématiques fondamentaux.",
      22: "Ta connaissance approfondie dépasse la simple mémorisation.",
      23: "Tu as atteint un niveau d'excellence rare en calcul mental.",
      24: "Tu jonglais avec les nombres avec l'aisance d'un virtuose.",
      25: "Ta puissance de calcul est impressionnante et fiable.",
      26: "Tu diriges tes pensées mathématiques avec stratégie et précision.",
      27: "Tu maîtrises les aspects les plus profonds du calcul.",
      28: "Tu règnes sur le royaume des nombres avec bienveillance.",
      29: "Ton intelligence mathématique s'étend à tous les domaines.",
      30: "Ta maîtrise mathématique transcende les limites ordinaires. Tu es un exemple pour tous!"
    }
  }
};