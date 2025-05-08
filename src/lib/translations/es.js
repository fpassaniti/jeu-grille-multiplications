export default {
  common: {
    appName: 'MultyFun',
    home: 'Inicio',
    play: 'Jugar',
    leaderboard: 'Clasificación',
    dashboard: 'Panel',
    collection: 'Colección',
    login: 'Iniciar sesión',
    register: 'Registrarse',
    logout: 'Cerrar sesión',
    greeting: '¡Hola, {name}!',
    backToHome: 'Volver al inicio',
    loggedInAs: 'Conectado como',
    error: 'Error',
    success: 'Éxito',
    loading: 'Cargando...',
    next: 'Siguiente',
    previous: 'Anterior',
    save: 'Guardar',
    cancel: 'Cancelar',
    yes: 'Sí',
    no: 'No',
    close: 'Cerrar',
    select: 'Seleccionar',
    all: 'Todo',
    none: 'Ninguno',
    level: 'Nivel',
    levels: 'Niveles',
    score: 'Puntuación',
    scores: 'Puntuaciones',
    xp: 'XP',
    date: 'Fecha',
    adult: 'Adulto',
    child: 'Niño',
    name: 'Nombre',
    duration: 'Duración',
    status: 'Estado',
    language: 'Idioma',
    selectLanguage: 'Seleccionar idioma',
    copyright: '© {year} {appName} - ¡Aprende las tablas de multiplicar divirtiéndote!',
    min: 'min',
  },

  navigation: {
    logoutTitle: 'Cerrar sesión'
  },

  home: {
    title: 'MultyFun - ¡Aprende las tablas de multiplicar divirtiéndote!',
    metaDescription: '¡Mejora tus habilidades de multiplicación con este divertido juego interactivo y gana niveles!',
    gameTitle: 'Juego de Multiplicación',
    gameIntro: '¡Resuelve tantas multiplicaciones como sea posible antes de que se acabe el tiempo!',
    welcome: '¡Bienvenido, {name}!',
    levelNumber: 'Nivel {level}:',
    defaultLevelName: 'Explorador de Números',
    continueAdventure: 'Continuar la aventura',
    startOptions: {
      startAdventure: {
        title: 'Comenzar la aventura',
        description: '¡Crea una cuenta y gana niveles!'
      },
      login: {
        title: 'Iniciar sesión',
        description: '¡Continúa tu aventura matemática!'
      },
      quickPlay: {
        title: 'Partida rápida',
        description: 'Juega sin crear una cuenta'
      }
    },
    features: {
      title: '¿Por qué jugar a MultyFun?',
      gainLevels: {
        title: 'Gana niveles',
        description: '¡Acumula experiencia y sube de rango!'
      },
      collectTitles: {
        title: 'Colecciona títulos',
        description: '¡Desbloquea 10 títulos únicos de campeón!'
      },
      printCard: {
        title: 'Imprime tu tarjeta',
        description: '¡Muestra tu progreso a tus amigos!'
      },
      playEverywhere: {
        title: 'Juega en todas partes',
        description: '¡En ordenador, tableta o teléfono!'
      }
    },
    leaderboard: {
      title: '¡Descubre a los mejores jugadores!',
      description: '¡Mira quién encabeza la clasificación y desafíalos!',
      viewButton: 'Ver clasificación'
    }
  },

  auth: {
    loginTitle: 'Iniciar sesión',
    loginSubtitle: '¡Inicia sesión para seguir tu progreso y desbloquear recompensas!',
    username: 'Nombre de usuario',
    secretCharacter: 'Carácter secreto',
    chooseSecretCharacter: 'Elige un carácter secreto',
    clickEmoji: 'Haz clic en el emoji que usas como contraseña',
    loggingIn: 'Iniciando sesión...',
    loginButton: 'Iniciar sesión',
    noAccount: '¿No tienes cuenta? Regístrate aquí',
    fillAllFields: 'Por favor, completa todos los campos',
    loginError: 'Error al iniciar sesión',
    connectionError: 'Problema de conexión con el servidor',
    
    registerTitle: 'Crear una cuenta',
    registerSubtitle: '¡Comienza tu aventura matemática!',
    accountCreated: '¡Cuenta creada con éxito!',
    welcomeMessage: '¡Bienvenido a la aventura MultyFun! Serás redirigido a tu panel...',
    firstName: 'Tu nombre',
    firstNamePlaceholder: 'Ingresa tu nombre',
    firstNameHelp: 'Este es el nombre que usarás para iniciar sesión',
    displayName: 'Nombre visible (opcional)',
    displayNamePlaceholder: '¿Cómo quieres que te llamemos?',
    displayNameHelp: 'Este es el nombre que se mostrará en el juego',
    secretCharacterHelp: 'Tu carácter secreto',
    emojiPassword: 'Elige un emoji como contraseña. Lo usarás para iniciar sesión.',
    creatingAccount: 'Creando cuenta...',
    createAccount: 'Crear mi cuenta',
    alreadyHaveAccount: '¿Ya tienes una cuenta?',
    requiredFields: 'El nombre y el carácter secreto son obligatorios',
    registrationError: 'Error de registro',
    accountCreationError: 'Error al crear la cuenta. Inténtalo de nuevo.'
  },

  dashboard: {
    title: 'Panel - MultyFun',
    welcome: '¡Hola, {name}!',
    levelNumber: 'Nivel {level}',
    defaultLevelName: 'Explorador de Números',
    defaultLevelDescription: '¡Has comenzado tu viaje en el mundo de las matemáticas!',
    gamesPlayed: 'Partidas jugadas',
    totalXp: 'XP total',
    nextLevel: 'Siguiente nivel: {title}',
    xpUntilNextLevel: '{xp} XP necesarios para el siguiente nivel',
    maxLevel: '¡Has alcanzado el nivel máximo!',
    playButton: 'Jugar',
    collectionButton: 'Colección',
    printCardButton: 'Imprimir mi tarjeta',
    recentGames: 'Partidas recientes',
    noGames: 'Aún no has jugado ninguna partida.',
    playNow: '¡Jugar ahora!',
    logoutError: 'Error al cerrar sesión'
  },

  game: {
    answerPlaceholder: 'Tu respuesta',
    recentlySolved: 'Multiplicaciones resueltas recientemente',
    noSolved: 'Aún no hay multiplicaciones resueltas.',
    pointsEarned: '+{points} pts'
  },

  leaderboard: {
    pageTitle: 'Clasificación de Mejores Puntuaciones - MultyFun',
    metaDescription: '¡Descubre los mejores jugadores de MultyFun y sus impresionantes puntuaciones!',
    title: 'Clasificación de Mejores Puntuaciones',
    levelLabel: 'Nivel',
    adultLevel: 'Nivel Adulto',
    childLevel: 'Nivel Niño',
    durationLabel: 'Duración',
    filterExplanation: 'Las puntuaciones se filtran por nivel y duración de juego.',
    challenge: '¡Acepta el desafío e inscribe tu nombre en la clasificación!',
    playNow: 'Jugar ahora',
    loading: 'Cargando puntuaciones...',
    nameHeader: 'Nombre',
    scoreHeader: 'Puntuación',
    tablesHeader: 'Tablas',
    dateHeader: 'Fecha',
    allTables: 'Todas las tablas',
    noScores: 'No hay puntuaciones registradas para este nivel y duración.',
    beFirst: '¡Sé el primero en aceptar el desafío!'
  },

  collection: {
    pageTitle: 'Mi Colección - MultyFun',
    title: 'Mi Colección de Niveles',
    description: '¡Descubre todos los niveles que puedes desbloquear jugando a MultyFun! Cada nivel te da un nuevo título y una nueva imagen.',
    unlockedLevels: 'Niveles desbloqueados:',
    currentLevel: 'Nivel actual:',
    levelLabel: 'Nivel',
    unlocked: 'Desbloqueado',
    locked: 'Bloqueado',
    unlockHint: '¡Desbloquea este nivel ganando más XP!',
    requiredXp: 'XP necesaria:',
    xpNeeded: 'Aún {xp} XP por ganar',
    print: 'Imprimir',
    certificateTitle: 'MultyFun - Certificado de Nivel',
    currentLevelLabel: 'Nivel actual',
    continueAdventure: '¡Continúa tu aventura matemática en MultyFun!',
    templateNotLoaded: 'La plantilla de impresión aún no está cargada. Por favor, inténtalo de nuevo.',
    popupBlocked: 'Por favor, permite las ventanas emergentes para imprimir el certificado.',
    printError: 'Ocurrió un error al preparar la impresión.',
  },

  play: {
    pageTitle: 'MultyFun - Juego de Multiplicación',
    metaDescription: '¡Mejora tus habilidades de multiplicación con este divertido juego interactivo para niños y adultos!',
    title: 'Juego de Multiplicación',
    description: '¡Resuelve tantas multiplicaciones como sea posible antes de que se acabe el tiempo!',
    chooseLevel: 'Elige tu nivel:',
    adultResponseTime: 'Tiempo de respuesta: 5-15 segundos',
    childResponseTime: 'Tiempo de respuesta: 15-45 segundos',
    chooseDuration: 'Elige la duración:',
    start: 'Comenzar',
    viewLeaderboard: '¿Quieres ver las mejores puntuaciones?',
    viewLeaderboardButton: 'Ver clasificación completa',
    timeLabel: 'Tiempo:',
    levelLabel: 'Nivel:',
    scoreLabel: 'Puntuación:',
    solvedLabel: 'Multiplicaciones resueltas:',
    tablesLabel: 'Tablas seleccionadas:',
    currentMultiplicationLabel: 'Multiplicación actual:',
    gameOver: '¡Juego terminado!',
    yourScore: 'Tu puntuación:',
    solvedMultiplications: 'Multiplicaciones resueltas:',
    practicedTables: 'Tablas practicadas:',
    earnedXp: 'XP ganada:',
    progressionTitle: 'Progresión en la aventura',
    savingScore: 'Tu puntuación se está guardando...',
    levelUp: '¡Subida de Nivel!',
    reachedLevel: 'Has alcanzado el nivel...',
    viewNewLevel: 'Ver mi nuevo nivel',
    saveScore: 'Guarda tu puntuación',
    firstNamePlaceholder: 'Tu nombre',
    saveButton: 'Guardar',
    scoreSaved: '¡Puntuación guardada con éxito!',
    xpEarned: 'Has ganado {xp} puntos de experiencia.',
    newGame: 'Nueva partida',
    backToHome: 'Volver al inicio',
    dashboardButton: 'Panel',
    gridReset: '¡Nueva cuadrícula! ¡Sigue jugando!',
    endGame: 'Finalizar juego',
  },

  tableSelector: {
    title: 'Tablas para practicar:',
    selectAll: 'Seleccionar todo',
    deselectAll: 'Deseleccionar todo',
    errorMessage: '¡Por favor, selecciona al menos una tabla!',
    selectedTables: 'Tablas seleccionadas:'
  }
};