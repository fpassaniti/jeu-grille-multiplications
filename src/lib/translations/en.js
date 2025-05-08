export default {
  common: {
    appName: 'MultyFun',
    home: 'Home',
    play: 'Play',
    leaderboard: 'Leaderboard',
    dashboard: 'Dashboard',
    collection: 'Collection',
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    greeting: 'Hello, {name}!',
    backToHome: 'Back to Home',
    loggedInAs: 'Logged in as',
    error: 'Error',
    success: 'Success',
    loading: 'Loading...',
    next: 'Next',
    previous: 'Previous',
    save: 'Save',
    cancel: 'Cancel',
    yes: 'Yes',
    no: 'No',
    close: 'Close',
    select: 'Select',
    all: 'All',
    none: 'None',
    level: 'Level',
    levels: 'Levels',
    score: 'Score',
    scores: 'Scores',
    xp: 'XP',
    date: 'Date',
    adult: 'Adult',
    child: 'Child',
    name: 'Name',
    duration: 'Duration',
    status: 'Status',
    language: 'Language',
    selectLanguage: 'Select language',
    copyright: '© {year} {appName} - Learn multiplication tables while having fun!',
    min: 'min',
  },

  navigation: {
    logoutTitle: 'Logout'
  },

  home: {
    title: 'MultyFun - Learn multiplication tables while having fun!',
    metaDescription: 'Improve your multiplication skills with this fun interactive game and earn levels!',
    gameTitle: 'Multiplication Game',
    gameIntro: 'Solve as many multiplications as possible before time runs out!',
    welcome: 'Welcome, {name}!',
    levelNumber: 'Level {level}:',
    defaultLevelName: 'Number Explorer',
    continueAdventure: 'Continue the adventure',
    startOptions: {
      startAdventure: {
        title: 'Start the adventure',
        description: 'Create an account and earn levels!'
      },
      login: {
        title: 'Log in',
        description: 'Continue your math adventure!'
      },
      quickPlay: {
        title: 'Quick play',
        description: 'Play without creating an account'
      }
    },
    features: {
      title: 'Why play MultyFun?',
      gainLevels: {
        title: 'Earn levels',
        description: 'Accumulate experience and rank up!'
      },
      collectTitles: {
        title: 'Collect titles',
        description: 'Unlock 10 unique champion titles!'
      },
      printCard: {
        title: 'Print your card',
        description: 'Show your progress to your friends!'
      },
      playEverywhere: {
        title: 'Play everywhere',
        description: 'On computer, tablet or phone!'
      }
    },
    leaderboard: {
      title: 'Discover the best players!',
      description: 'See who tops the leaderboard and challenge them!',
      viewButton: 'View leaderboard'
    }
  },

  auth: {
    loginTitle: 'Login',
    loginSubtitle: 'Log in to track your progress and unlock rewards!',
    username: 'Username',
    secretCharacter: 'Secret character',
    chooseSecretCharacter: 'Choose a secret character',
    clickEmoji: 'Click on the emoji you use as a password',
    loggingIn: 'Logging in...',
    loginButton: 'Log in',
    noAccount: 'Don\'t have an account yet? Register here',
    fillAllFields: 'Please fill in all fields',
    loginError: 'Login error',
    connectionError: 'Server connection problem',
    
    registerTitle: 'Create an account',
    registerSubtitle: 'Start your math adventure!',
    accountCreated: 'Account successfully created!',
    welcomeMessage: 'Welcome to the MultyFun adventure! You will be redirected to your dashboard...',
    firstName: 'Your first name',
    firstNamePlaceholder: 'Enter your first name',
    firstNameHelp: 'This is the name you\'ll use to log in',
    displayName: 'Display name (optional)',
    displayNamePlaceholder: 'What should we call you?',
    displayNameHelp: 'This is the name that will be displayed in the game',
    secretCharacterHelp: 'Your secret character',
    emojiPassword: 'Choose an emoji as a password. You\'ll use this to log in.',
    creatingAccount: 'Creating account...',
    createAccount: 'Create my account',
    alreadyHaveAccount: 'Already have an account?',
    requiredFields: 'First name and secret character are required',
    registrationError: 'Registration error',
    accountCreationError: 'Error creating account. Please try again.'
  },

  dashboard: {
    title: 'Dashboard - MultyFun',
    welcome: 'Hello, {name}!',
    levelNumber: 'Level {level}',
    defaultLevelName: 'Number Explorer',
    defaultLevelDescription: 'You\'ve started your journey in the world of mathematics!',
    gamesPlayed: 'Games played',
    totalXp: 'Total XP',
    nextLevel: 'Next level: {title}',
    xpUntilNextLevel: '{xp} XP needed for next level',
    maxLevel: 'You\'ve reached the maximum level!',
    playButton: 'Play',
    collectionButton: 'Collection',
    printCardButton: 'Print my card',
    recentGames: 'Recent games',
    noGames: 'You haven\'t played any games yet.',
    playNow: 'Play now!',
    logoutError: 'Error logging out'
  },

  game: {
    answerPlaceholder: 'Your answer',
    recentlySolved: 'Recently solved multiplications',
    noSolved: 'No multiplications solved yet.',
    pointsEarned: '+{points} pts'
  },

  leaderboard: {
    pageTitle: 'Top Scores Leaderboard - MultyFun',
    metaDescription: 'Discover the best MultyFun players and their impressive scores!',
    title: 'Top Scores Leaderboard',
    levelLabel: 'Level',
    adultLevel: 'Adult Level',
    childLevel: 'Child Level',
    durationLabel: 'Duration',
    filterExplanation: 'Scores are filtered by level and game duration.',
    challenge: 'Take the challenge and get your name on the leaderboard!',
    playNow: 'Play now',
    loading: 'Loading scores...',
    nameHeader: 'Name',
    scoreHeader: 'Score',
    tablesHeader: 'Tables',
    dateHeader: 'Date',
    allTables: 'All tables',
    noScores: 'No scores recorded for this level and duration.',
    beFirst: 'Be the first to take the challenge!'
  },

  collection: {
    pageTitle: 'My Collection - MultyFun',
    title: 'My Level Collection',
    description: 'Discover all the levels you can unlock by playing MultyFun! Each level gives you a new title and a new image.',
    unlockedLevels: 'Unlocked levels:',
    currentLevel: 'Current level:',
    levelLabel: 'Level',
    unlocked: 'Unlocked',
    locked: 'Locked',
    unlockHint: 'Unlock this level by earning more XP!',
    requiredXp: 'Required XP:',
    xpNeeded: '{xp} more XP to earn',
    print: 'Print',
    certificateTitle: 'MultyFun - Level Certificate',
    currentLevelLabel: 'Current level',
    continueAdventure: 'Continue your math adventure on MultyFun!',
    templateNotLoaded: 'The print template is not yet loaded. Please try again.',
    popupBlocked: 'Please allow popups to print the certificate.',
    printError: 'An error occurred while preparing the print.',
  },

  play: {
    pageTitle: 'MultyFun - Multiplication Game',
    metaDescription: 'Improve your multiplication skills with this fun interactive game for children and adults!',
    title: 'Multiplication Game',
    description: 'Solve as many multiplications as possible before time runs out!',
    chooseLevel: 'Choose your level:',
    adultResponseTime: 'Response time: 5-15 seconds',
    childResponseTime: 'Response time: 15-45 seconds',
    chooseDuration: 'Choose duration:',
    start: 'Start',
    viewLeaderboard: 'Want to see the top scores?',
    viewLeaderboardButton: 'View full leaderboard',
    timeLabel: 'Time:',
    levelLabel: 'Level:',
    scoreLabel: 'Score:',
    solvedLabel: 'Multiplications solved:',
    tablesLabel: 'Selected tables:',
    currentMultiplicationLabel: 'Current multiplication:',
    gameOver: 'Game over!',
    yourScore: 'Your score:',
    solvedMultiplications: 'Multiplications solved:',
    practicedTables: 'Tables practiced:',
    earnedXp: 'XP earned:',
    progressionTitle: 'Adventure progression',
    savingScore: 'Your score is being saved...',
    levelUp: 'Level Up!',
    reachedLevel: 'You\'ve reached level...',
    viewNewLevel: 'View my new level',
    saveScore: 'Save your score',
    firstNamePlaceholder: 'Your first name',
    saveButton: 'Save',
    scoreSaved: 'Score saved successfully!',
    xpEarned: 'You earned {xp} experience points.',
    newGame: 'New game',
    backToHome: 'Back to home',
    dashboardButton: 'Dashboard',
    gridReset: 'New grid! Keep playing!',
    endGame: 'End game',
  },

  tableSelector: {
    title: 'Tables to practice:',
    selectAll: 'Select all',
    deselectAll: 'Deselect all',
    errorMessage: 'Please select at least one table!',
    selectedTables: 'Selected tables:'
  }
};