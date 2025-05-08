export default {
  common: {
    appName: 'MultyFun',
    home: 'Accueil',
    play: 'Jouer',
    leaderboard: 'Classement',
    dashboard: 'Tableau de bord',
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
    copyright: '© {year} {appName} - Apprends les multiplications en t\'amusant!'
  },

  navigation: {
    logoutTitle: 'Déconnexion'
  },

  home: {
    title: 'MultyFun - Apprends les multiplications en t\'amusant!',
    metaDescription: 'Améliore tes compétences en multiplication avec ce jeu interactif amusant et gagne des niveaux!',
    gameTitle: 'Jeu de Multiplication',
    gameIntro: 'Résous autant de multiplications que possible avant la fin du temps!',
    welcome: 'Bienvenue, {name}!',
    levelNumber: 'Niveau {level}:',
    defaultLevelName: 'Explorateur des Nombres',
    continueAdventure: 'Continuer l\'aventure',
    startOptions: {
      startAdventure: {
        title: 'Commencer l\'aventure',
        description: 'Crée un compte et gagne des niveaux!'
      },
      login: {
        title: 'Se connecter',
        description: 'Continue ton aventure mathématique!'
      },
      quickPlay: {
        title: 'Partie rapide',
        description: 'Joue sans créer de compte'
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

  game: {
    answerPlaceholder: 'Ta réponse',
    recentlySolved: 'Dernières multiplications résolues',
    noSolved: 'Aucune multiplication résolue pour le moment.',
    pointsEarned: '+{points} pts'
  },

  leaderboard: {
    pageTitle: 'Classement des meilleurs scores - MultyFun',
    metaDescription: 'Découvre les meilleurs joueurs de MultyFun et leurs scores impressionnants!',
    title: 'Classement des Meilleurs Scores',
    levelLabel: 'Niveau',
    adultLevel: 'Niveau Adulte',
    childLevel: 'Niveau Enfant',
    durationLabel: 'Durée',
    filterExplanation: 'Les scores sont filtrés par niveau et durée de jeu.',
    challenge: 'Relève le défi et inscris ton nom dans le classement !',
    playNow: 'Jouer maintenant',
    loading: 'Chargement des scores...',
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
    description: 'Découvre tous les niveaux que tu peux débloquer en jouant à MultyFun! Chaque niveau te donne un nouveau titre et une nouvelle image.',
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
    continueAdventure: 'Continue ton aventure mathématique sur MultyFun!'
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
    viewLeaderboard: 'Envie de voir les meilleurs scores?',
    viewLeaderboardButton: 'Voir le classement complet',
    timeLabel: 'Temps:',
    levelLabel: 'Niveau:',
    scoreLabel: 'Score:',
    solvedLabel: 'Multiplications résolues:',
    tablesLabel: 'Tables sélectionnées:',
    currentMultiplicationLabel: 'Multiplication actuelle:',
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
    saveScore: 'Enregistre ton score',
    firstNamePlaceholder: 'Ton prénom',
    saveButton: 'Sauvegarder',
    scoreSaved: 'Score sauvegardé avec succès!',
    xpEarned: 'Tu as gagné {xp} points d\'expérience.',
    newGame: 'Nouvelle partie',
    backToHome: 'Retour à l\'accueil',
    dashboardButton: 'Tableau de bord'
  },

  tableSelector: {
    title: 'Tables à pratiquer:',
    selectAll: 'Tout sélectionner',
    deselectAll: 'Tout désélectionner',
    errorMessage: 'Veuillez sélectionner au moins une table!',
    selectedTables: 'Tables sélectionnées:'
  }
};