export default {
  common: {
    appName: 'MultyFun',
    home: 'Inicio',
    play: 'Jugar',
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
    coins: 'Monedas',
    shop: 'Tienda',
    character: 'Personaje',
  },

  navigation: {
    logoutTitle: 'Cerrar sesión'
  },

  home: {
    title: 'MultyFun - ¡Aprende las tablas de multiplicar divirtiéndote!',
    metaDescription: '¡Mejora tus habilidades de multiplicación con este divertido juego interactivo y gana niveles!',
    gameTitle: 'Juego de Multiplicación',
    gameIntro: '¡Resuelve tantas multiplicaciones como sea posible antes de que se acabe el tiempo!',
    levelNumber: 'Nivel {level}:',
    startOptions: {
      startAdventure: {
        title: 'Comenzar la aventura',
        description: '¡Crea una cuenta y gana niveles!'
      },
      login: {
        title: 'Iniciar sesión',
        description: '¡Continúa tu aventura matemática!'
      }
    },
    modesShowcase: {
      title: 'Elige tu cálculo'
    },
    gamificationShowcase: {
      title: 'Un juego que te recompensa cada día',
      character: {
        title: 'Tu personaje',
        description: 'Equipa a tu aventurero con ropa, armas y mascotas por desbloquear.'
      },
      coins: {
        title: 'Monedas de oro',
        description: 'Gana monedas en cada partida y gástalas en la tienda.'
      },
      chests: {
        title: 'Cofres por abrir',
        description: 'Cofre diario, cofre de nivel, cofre de racha... te esperan muchas sorpresas.'
      },
      streaks: {
        title: 'Una racha que mantener',
        description: 'Vuelve cada día para hacer crecer tu racha y desbloquear recompensas.'
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

  shop: {
    title: 'Tienda',
    subtitle: '¡Personaliza a tu aventurero!',
    dailyOffers: 'Ofertas del día',
    owned: 'Poseído',
    buy: 'Comprar',
    confirmTitle: 'Confirmar compra',
    confirmBuy: '¿Comprar por {price} 🪙?',
    confirmRemaining: 'Te quedarán {remaining} 🪙',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    bought: '¡Comprado!',
    insufficient_coins: 'No hay suficientes monedas',
    already_owned: 'Ya lo tienes',
    level_locked: 'Requiere nivel {level}',
    levelLocked: 'Requiere nivel {level}',
    not_purchasable: 'No disponible para comprar',
    already_active: 'Ya está activo',
    freeze_cap_reached: 'Máximo de congelaciones alcanzado',
    tryOn: 'Probar',
    potions: 'Pociones',
    freezeName: 'Congelación de racha',
    freezeDesc: 'Protege tu racha si fallas un día',
    boosterName: 'Poción ×2',
    boosterDesc: 'Duplica tus monedas durante 3 partidas',
    boosterActive: '¡Poción activa!',
    slots: {
      background: 'Fondo',
      aura: 'Aura',
      back: 'Espalda',
      body: 'Cuerpo',
      outfit: 'Traje',
      weapon: 'Arma',
      hat: 'Sombrero',
      pet: 'Mascota'
    },
    rarity: {
      common: 'Común',
      uncommon: 'Poco común',
      rare: 'Raro',
      epic: 'Épico',
      legendary: 'Legendario',
      mythic: 'Mítico'
    },
    allRarities: 'Todos'
  },

  character: {
    title: 'Mi personaje',
    subtitle: 'Equipa los objetos que has desbloqueado',
    equip: 'Equipar',
    equipped: 'Equipado',
    unequip: 'Quitar',
    none: 'Ninguno',
    empty: '¡Gana objetos en la tienda y los cofres!',
    goToShop: 'Ir a la tienda'
  },

  admin: {
    fittingRoom: {
      navLabel: 'Probador',
      title: 'Probador',
      subtitle: 'Prueba todos los artículos de la tienda, sin límite de nivel ni de precio.',
      reset: 'Reiniciar'
    }
  },

  chest: {
    open: 'Abrir mi cofre',
    tapToOpen: '¡Toca el cofre para abrirlo!',
    daily: 'Cofre diario',
    streak: 'Cofre de racha',
    levelup: 'Cofre de nivel',
    perfect: 'Cofre perfecto',
    welcome: 'Cofre de bienvenida',
    welcomeTitle: '¡Bienvenido a la nueva aventura!',
    welcomeText: 'Aquí tienes un regalo para celebrar las novedades de MultyFun.',
    youWon: '¡Ganaste {coins} 🪙!',
    newItem: '¡Nuevo objeto desbloqueado!',
    duplicate: '¡Ya lo tienes! +{refund} 🪙',
    comeBackTomorrow: '¡Vuelve mañana para un nuevo cofre!',
    alreadyOpened: 'Ya abierto hoy'
  },

  rewards: {
    base: 'Monedas ganadas',
    weekend: '¡Bono de fin de semana ×2!',
    booster: 'Poción ×2 ⚡',
    firstOfDay: 'Primera partida del día',
    streakBonus: 'Bono de racha 🔥',
    perfectBonus: 'Partida perfecta 💯',
    openChest: '¡Un cofre te espera!'
  },

  streak: {
    days: '{count} días seguidos 🔥',
    calendarTitle: 'Tu semana',
    nextMilestone: '¡{days} día(s) más → cofre {reward}!',
    freezeUsed: '¡Tu congelación de racha 🛡️ te salvó!',
    freezeCount: 'Congelaciones de racha disponibles',
    milestoneReached: '¡Meta de racha alcanzada!'
  },

  game: {
    answerPlaceholder: 'Tu respuesta',
    recentlySolved: 'Respuestas correctas recientes',
    noSolved: 'Aún no hay preguntas resueltas.',
    pointsEarned: '+{points} pts',
    validate: 'OK ✓'
  },

  modes: {
    chooseMode: 'Elige tu operación:',
    tables: 'Tablas',
    addition: 'Sumas',
    subtraction: 'Restas',
    multiplication: 'Multiplicaciones',
    division: 'Divisiones'
  },

  difficulty: {
    chooseTitle: 'Elige tu dificultad:',
    customHint: 'Marca los ejercicios que quieres practicar:',
    editExercises: 'Ver / modificar los ejercicios',
    selectAll: 'Marcar todo',
    presets: {
      ce1: '2º Primaria',
      ce2: '3º Primaria',
      cm1: '4º Primaria'
    },
    tiers: {
      A1: 'Sin llevada, hasta 20',
      A2: 'Sin llevada, hasta 100',
      A3: 'Con llevada, hasta 100',
      A4: 'Sin llevada, hasta 1000',
      A5: 'Con llevada, hasta 1000',
      A6: 'Con llevada, hasta 10 000',
      S1: 'Sin llevada, hasta 20',
      S2: 'Sin llevada, hasta 100',
      S3: 'Con llevada, hasta 100',
      S4: 'Sin llevada, hasta 1000',
      S5: 'Con llevada, hasta 1000',
      M1: 'Multiplicar por 10',
      M2: 'Multiplicar por 100 o 1000',
      M3: '2 cifras × 1 cifra, sin llevada',
      M4: '2 cifras × 1 cifra, con llevada',
      M5: '3 cifras × 1 cifra',
      M6: '2-3 cifras × 2 cifras',
      D1: 'Dividir por 2, 5 o 10',
      D2: 'Dividir por 3, 4 o 6',
      D3: 'Dividir por 7, 8 o 9'
    }
  },

  leaderboard: {
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
    description: '¡Descubre todos los niveles que puedes desbloquear jugando a MultyFun! Cada nivel alcanzado te da un nuevo título y una insignia para coleccionar e imprimir. Para vestir a tu personaje, ¡ve a la tienda!',
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
    timeLabel: 'Tiempo:',
    levelLabel: 'Nivel:',
    scoreLabel: 'Puntuación:',
    solvedLabel: 'Multiplicaciones resueltas:',
    errorsLabel: 'Errores:',
    tablesLabel: 'Tablas seleccionadas:',
    currentMultiplicationLabel: 'Multiplicación actual:',
    currentQuestionLabel: 'Pregunta:',
    solvedGenericLabel: '{count} respuestas correctas',
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
    scoreSaved: '¡Puntuación guardada con éxito!',
    gameNotCounted: 'Partida no contabilizada: ningún cálculo resuelto.',
    xpEarned: 'Has ganado {xp} puntos de experiencia.',
    newGame: 'Nueva partida',
    backToHome: 'Volver al inicio',
    dashboardButton: 'Panel',
    viewLeaderboardButton: 'Ver clasificación',
    gridReset: '¡Nueva cuadrícula! ¡Sigue jugando!',
    endGame: 'Finalizar juego',
  },

  tableSelector: {
    title: 'Tablas para practicar:',
    selectAll: 'Seleccionar todo',
    deselectAll: 'Deseleccionar todo',
    allTablesInfo: '¡Ninguna tabla seleccionada = se usarán todas las tablas!',
    selectedTables: 'Tablas seleccionadas:'
  },

  level: {
    1: 'Explorador de Números',
    2: 'Aprendiz de Cálculo',
    3: 'Cazador de Soluciones',
    4: 'Explorador de Tablas',
    5: 'Soñador Numérico',
    6: 'Guardián de Multiplicaciones',
    7: 'Aventurero del Cálculo',
    8: 'Mago de Números',
    9: 'Caballero de Tablas',
    10: 'Alquimista de Fórmulas',
    11: 'Arquitecto Matemático',
    12: 'Domador de Ecuaciones',
    13: 'Maestro de Tablas',
    14: 'Cronista de Números',
    15: 'Oráculo de Soluciones',
    16: 'Ninja Matemático',
    17: 'Campeón de Cálculos',
    18: 'Sabio de Multiplicaciones',
    19: 'Hechicero de Algoritmos',
    20: 'Leyenda de Números',
    21: 'Guardián de Teoremas',
    22: 'Erudito de Tablas',
    23: 'Gran Maestro Calculador',
    24: 'Virtuoso de Ecuaciones',
    25: 'Titán de Multiplicaciones',
    26: 'Comandante de Lógica',
    27: 'Archimago Digital',
    28: 'Soberano de Matemáticas',
    29: 'Genio Universal',
    30: 'Leyenda del Multiverso',

    description: {
      1: "Estás comenzando tu viaje en el mundo de las matemáticas. ¡Te espera una aventura emocionante!",
      2: "Ahora dominas los fundamentos del cálculo. ¡Sigue practicando!",
      3: "Ahora eres capaz de resolver problemas más complejos.",
      4: "Exploras las tablas de multiplicar con facilidad.",
      5: "Imaginas conexiones entre números y encuentras soluciones creativas.",
      6: "Proteges y preservas el conocimiento de las multiplicaciones.",
      7: "Ahora te aventuras en cálculos más complejos.",
      8: "Manipulas los números con una habilidad casi mágica.",
      9: "Defiendes valientemente tu dominio de las tablas frente a todos los desafíos.",
      10: "Transformas problemas complejos en soluciones elegantes.",
      11: "Construyes cimientos matemáticos sólidos para tu éxito futuro.",
      12: "Las multiplicaciones más difíciles ya no tienen secretos para ti.",
      13: "Tu dominio de las tablas de multiplicar es ejemplar.",
      14: "Registras y recuerdas hechos matemáticos con precisión.",
      15: "Predices los resultados de los cálculos incluso antes de terminarlos.",
      16: "Tu velocidad y precisión son impresionantes.",
      17: "Sobresales en la arena de los desafíos matemáticos.",
      18: "Tu sabiduría matemática inspira a los demás.",
      19: "Comprendes la lógica oculta de las operaciones matemáticas.",
      20: "Tus hazañas de cálculo te convierten en una verdadera leyenda.",
      21: "Proteges y aplicas los principios matemáticos fundamentales.",
      22: "Tu conocimiento profundo va más allá de la simple memorización.",
      23: "Has alcanzado un nivel de excelencia raro en el cálculo mental.",
      24: "Haces malabarismos con los números con la facilidad de un virtuoso.",
      25: "Tu poder de cálculo es impresionante y confiable.",
      26: "Diriges tus pensamientos matemáticos con estrategia y precisión.",
      27: "Dominas los aspectos más profundos del cálculo.",
      28: "Reinas sobre el reino de los números con benevolencia.",
      29: "Tu inteligencia matemática se extiende a todos los dominios.",
      30: "Tu dominio matemático trasciende los límites ordinarios. ¡Eres un ejemplo para todos!"
    }
  }
};