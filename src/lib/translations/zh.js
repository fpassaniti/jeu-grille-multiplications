export default {
  common: {
    appName: 'MultyFun',
    home: '首页',
    play: '开始游戏',
    collection: '收藏',
    login: '登录',
    register: '注册',
    logout: '退出登录',
    greeting: '你好，{name}！',
    backToHome: '返回首页',
    loggedInAs: '当前登录账号',
    error: '错误',
    success: '成功',
    loading: '加载中...',
    next: '下一个',
    previous: '上一个',
    save: '保存',
    cancel: '取消',
    yes: '是',
    no: '否',
    close: '关闭',
    select: '选择',
    all: '全部',
    none: '无',
    level: '等级',
    levels: '等级',
    score: '分数',
    scores: '分数',
    xp: '经验值',
    date: '日期',
    adult: '成人',
    child: '儿童',
    name: '名字',
    duration: '时长',
    status: '状态',
    language: '语言',
    selectLanguage: '选择语言',
    copyright: '© {year} {appName} - 有趣地学习乘法表！',
    min: '分钟',
    coins: '金币',
    shop: '商店',
    character: '角色',
  },

  navigation: {
    logoutTitle: '退出登录'
  },

  home: {
    title: 'MultyFun - 有趣地学习乘法表！',
    metaDescription: '通过这个有趣的互动游戏提高你的乘法技能并获得等级！',
    gameTitle: '乘法游戏',
    gameIntro: '在时间结束前解决尽可能多的乘法题！',
    levelNumber: '等级 {level}：',
    startOptions: {
      startAdventure: {
        title: '开始冒险',
        description: '创建账号并获得等级！'
      },
      login: {
        title: '登录',
        description: '继续你的数学冒险！'
      }
    },
    modesShowcase: {
      title: '选择你的计算方式'
    },
    gamificationShowcase: {
      title: '每天都有奖励的游戏',
      character: {
        title: '你的角色',
        description: '为你的冒险家装备可解锁的服装、武器和伙伴。'
      },
      coins: {
        title: '金币',
        description: '每局游戏都能赚取金币，用于商店消费。'
      },
      chests: {
        title: '待开启的宝箱',
        description: '每日宝箱、等级宝箱、连续宝箱……许多惊喜等着你。'
      },
      streaks: {
        title: '保持连续记录',
        description: '每天回来增加你的连续天数，解锁奖励。'
      }
    },
    features: {
      title: '为什么玩MultyFun？',
      gainLevels: {
        title: '获得等级',
        description: '积累经验并提升等级！'
      },
      collectTitles: {
        title: '收集称号',
        description: '解锁10个独特的冠军称号！'
      },
      printCard: {
        title: '打印你的卡片',
        description: '向朋友展示你的进步！'
      },
      playEverywhere: {
        title: '随处游戏',
        description: '电脑、平板或手机！'
      }
    },
    leaderboard: {
      title: '发现最好的玩家！',
      description: '看看谁在排行榜上领先并挑战他们！',
      viewButton: '查看排行榜'
    }
  },

  auth: {
    loginTitle: '登录',
    loginSubtitle: '登录以跟踪您的进度并解锁奖励！',
    username: '用户名',
    secretCharacter: '密码字符',
    chooseSecretCharacter: '选择一个密码字符',
    clickEmoji: '点击你用作密码的表情符号',
    loggingIn: '登录中...',
    loginButton: '登录',
    noAccount: '还没有账号？在这里注册',
    fillAllFields: '请填写所有字段',
    loginError: '登录错误',
    connectionError: '服务器连接问题',

    registerTitle: '创建账号',
    registerSubtitle: '开始你的数学冒险！',
    accountCreated: '账号创建成功！',
    welcomeMessage: '欢迎来到MultyFun冒险！你将被重定向到你的控制面板...',
    firstName: '你的名字',
    firstNamePlaceholder: '输入你的名字',
    firstNameHelp: '这是你用来登录的名字',
    displayName: '显示名称（可选）',
    displayNamePlaceholder: '你希望我们怎么称呼你？',
    displayNameHelp: '这是游戏中将显示的名称',
    secretCharacterHelp: '你的密码字符',
    emojiPassword: '选择一个表情符号作为密码。你将使用它来登录。',
    creatingAccount: '创建账号中...',
    createAccount: '创建我的账号',
    alreadyHaveAccount: '已有账号？',
    requiredFields: '名字和密码字符是必填项',
    registrationError: '注册错误',
    accountCreationError: '创建账号时出错。请重试。'
  },

  dashboard: {
    title: '控制面板 - MultyFun',
    welcome: '你好，{name}！',
    levelNumber: '等级 {level}',
    defaultLevelName: '数字探险家',
    defaultLevelDescription: '你已经开始了你在数学世界的旅程！',
    gamesPlayed: '已玩游戏',
    totalXp: '总经验值',
    nextLevel: '下一级：{title}',
    xpUntilNextLevel: '需要{xp}经验值到达下一级',
    maxLevel: '你已达到最高等级！',
    playButton: '游戏',
    collectionButton: '收藏',
    printCardButton: '打印我的卡片',
    recentGames: '最近的游戏',
    noGames: '你还没有玩过任何游戏。',
    playNow: '现在游戏！',
    logoutError: '退出登录时出错'
  },

  shop: {
    title: '商店',
    subtitle: '装扮你的冒险家！',
    owned: '已拥有',
    buy: '购买',
    confirmTitle: '确认购买',
    confirmBuy: '花费 {price} 🪙 购买？',
    confirmRemaining: '购买后剩余 {remaining} 🪙',
    confirm: '确认',
    cancel: '取消',
    bought: '购买成功！',
    insufficient_coins: '金币不足',
    already_owned: '已经拥有',
    level_locked: '需要等级 {level}',
    levelLocked: '需要等级 {level}',
    not_purchasable: '暂不可购买',
    already_active: '已经生效',
    freeze_cap_reached: '已达到最大保护数量',
    tryOn: '试穿',
    potions: '药水',
    freezeName: '连续保护',
    freezeDesc: '错过一天时保护你的连续记录',
    boosterName: '双倍药水 ×2',
    boosterDesc: '接下来3场游戏金币翻倍',
    boosterActive: '药水生效中！',
    slots: {
      background: '背景',
      aura: '光环',
      back: '背部',
      body: '身体',
      outfit: '服装',
      weapon: '武器',
      hat: '帽子',
      pet: '宠物'
    },
    rarity: {
      common: '普通',
      uncommon: '优良',
      rare: '稀有',
      epic: '史诗',
      legendary: '传奇',
      mythic: '神话'
    },
    allRarities: '全部'
  },

  character: {
    title: '我的角色',
    subtitle: '装备你已解锁的物品',
    equip: '装备',
    equipped: '已装备',
    unequip: '卸下',
    none: '无',
    empty: '在商店和宝箱中获取物品吧！',
    goToShop: '前往商店'
  },

  admin: {
    fittingRoom: {
      navLabel: '试衣间',
      title: '试衣间',
      subtitle: '试穿商店里的所有装备，不受等级或价格限制。',
      reset: '重置'
    }
  },

  chest: {
    open: '打开我的宝箱',
    tapToOpen: '点击宝箱打开它！',
    daily: '每日宝箱',
    streak: '连续宝箱',
    levelup: '升级宝箱',
    perfect: '完美宝箱',
    welcome: '欢迎宝箱',
    welcomeTitle: '欢迎来到全新冒险！',
    welcomeText: '这是庆祝 MultyFun 新功能的礼物。',
    youWon: '你获得了 {coins} 🪙！',
    comeBackTomorrow: '明天再来开新的宝箱吧！',
    alreadyOpened: '今天已经打开过了'
  },

  rewards: {
    base: '获得的金币',
    weekend: '周末双倍奖励 ×2！',
    booster: '双倍药水 ×2 ⚡',
    firstOfDay: '今日首场游戏',
    streakBonus: '连续奖励 🔥',
    perfectBonus: '完美游戏 💯',
    openChest: '有一个宝箱等着你！'
  },

  streak: {
    days: '连续 {count} 天 🔥',
    calendarTitle: '本周',
    nextMilestone: '再坚持 {days} 天 → {reward}宝箱！',
    freezeUsed: '你的连续保护 🛡️ 救了你！',
    freezeCount: '可用的连续保护',
    milestoneReached: '达成连续里程碑！'
  },

  game: {
    answerPlaceholder: '你的答案',
    recentlySolved: '最近答对的题目',
    noSolved: '尚未解决任何题目。',
    pointsEarned: '+{points}分',
    validate: '确定 ✓'
  },

  modes: {
    chooseMode: '选择运算类型：',
    tables: '乘法表',
    addition: '加法',
    subtraction: '减法',
    multiplication: '乘法',
    division: '除法'
  },

  difficulty: {
    chooseTitle: '选择难度：',
    customHint: '勾选你想练习的题型：',
    editExercises: '查看/修改题型',
    selectAll: '全选',
    presets: {
      ce1: '二年级',
      ce2: '三年级',
      cm1: '四年级'
    },
    tiers: {
      A1: '不进位，20以内',
      A2: '不进位，100以内',
      A3: '进位，100以内',
      A4: '不进位，1000以内',
      A5: '进位，1000以内',
      A6: '进位，10000以内',
      S1: '不借位，20以内',
      S2: '不借位，100以内',
      S3: '借位，100以内',
      S4: '不借位，1000以内',
      S5: '借位，1000以内',
      M1: '乘以10',
      M2: '乘以100或1000',
      M3: '两位数 × 一位数，不进位',
      M4: '两位数 × 一位数，进位',
      M5: '三位数 × 一位数',
      M6: '2-3位数 × 两位数',
      D1: '除以2、5或10',
      D2: '除以3、4或6',
      D3: '除以7、8或9'
    }
  },

  leaderboard: {
    nameHeader: '名称',
    scoreHeader: '分数',
    tablesHeader: '乘法表',
    dateHeader: '日期',
    allTables: '所有乘法表',
    noScores: '该级别和时长没有记录的分数。',
    beFirst: '成为第一个接受挑战的人！'
  },

  collection: {
    pageTitle: '我的收藏 - MultyFun',
    title: '我的等级收藏',
    description: '发现通过玩MultyFun可以解锁的所有等级！每达到一个新等级，都会获得一个新称号和一枚可收藏、可打印的徽章。想给你的角色换装，请前往商店！',
    unlockedLevels: '已解锁等级：',
    currentLevel: '当前等级：',
    levelLabel: '等级',
    unlocked: '已解锁',
    locked: '已锁定',
    unlockHint: '通过获得更多经验值解锁这个等级！',
    requiredXp: '所需经验值：',
    xpNeeded: '还需要获得{xp}经验值',
    print: '打印',
    certificateTitle: 'MultyFun - 等级证书',
    currentLevelLabel: '当前等级',
    continueAdventure: '在MultyFun上继续你的数学冒险！',
    templateNotLoaded: '打印模板尚未加载。请重试。',
    popupBlocked: '请允许弹出窗口以打印证书。',
    printError: '准备打印时发生错误。',
  },

  play: {
    pageTitle: 'MultyFun - 乘法游戏',
    metaDescription: '通过这个有趣的互动游戏提高儿童和成人的乘法技能！',
    title: '乘法游戏',
    description: '在时间结束前解决尽可能多的乘法题！',
    chooseLevel: '选择你的级别：',
    adultResponseTime: '响应时间：5-15秒',
    childResponseTime: '响应时间：15-45秒',
    chooseDuration: '选择时长：',
    start: '开始',
    timeLabel: '时间：',
    levelLabel: '级别：',
    scoreLabel: '分数：',
    solvedLabel: '已解决的乘法题：',
    errorsLabel: '错误数：',
    tablesLabel: '已选择的乘法表：',
    currentMultiplicationLabel: '当前乘法题：',
    currentQuestionLabel: '题目：',
    solvedGenericLabel: '已答对 {count} 题',
    gameOver: '游戏结束！',
    yourScore: '你的分数：',
    solvedMultiplications: '已解决的乘法题：',
    practicedTables: '练习的乘法表：',
    earnedXp: '获得的经验值：',
    progressionTitle: '冒险进度',
    savingScore: '你的分数正在保存中...',
    levelUp: '升级！',
    reachedLevel: '你已达到等级...',
    viewNewLevel: '查看我的新等级',
    scoreSaved: '分数成功保存！',
    gameNotCounted: '本局未计入：未完成任何计算。',
    xpEarned: '你获得了{xp}点经验值。',
    newGame: '新游戏',
    backToHome: '返回首页',
    dashboardButton: '控制面板',
    viewLeaderboardButton: '查看排行榜',
    gridReset: '新网格！继续游戏！',
    endGame: '结束游戏',
  },

  tableSelector: {
    title: '要练习的乘法表：',
    selectAll: '全选',
    deselectAll: '全不选',
    allTablesInfo: '未选择任何表 = 将使用所有乘法表！',
    selectedTables: '已选择的乘法表：'
  },

  level: {
    1: '数字探险家',
    2: '计算学徒',
    3: '解答猎人',
    4: '乘法表侦察兵',
    5: '数字梦想家',
    6: '乘法守护者',
    7: '计算冒险家',
    8: '数字魔法师',
    9: '乘法表骑士',
    10: '公式炼金术士',
    11: '数学建筑师',
    12: '方程驯服者',
    13: '乘法表大师',
    14: '数字编年史家',
    15: '解题先知',
    16: '数学忍者',
    17: '计算冠军',
    18: '乘法智者',
    19: '算法巫师',
    20: '数字传奇',
    21: '定理守护者',
    22: '乘法表学者',
    23: '计算大师',
    24: '方程大师',
    25: '乘法泰坦',
    26: '逻辑指挥官',
    27: '数字大法师',
    28: '数学君主',
    29: '通用天才',
    30: '多元宇宙传奇',

    description: {
      1: "你正在开始你在数学世界的旅程。一个激动人心的冒险等待着你！",
      2: "你现在掌握了计算的基础知识。继续练习！",
      3: "你现在能够解决更复杂的问题。",
      4: "你轻松探索乘法表。",
      5: "你想象数字之间的联系并找到创造性的解决方案。",
      6: "你保护并保存乘法知识。",
      7: "你现在冒险进入更复杂的计算。",
      8: "你用几乎魔法般的技能操纵数字。",
      9: "你勇敢地保卫你对乘法表的掌握，应对各种挑战。",
      10: "你将复杂的问题转化为优雅的解决方案。",
      11: "你为未来的成功建立坚实的数学基础。",
      12: "最困难的乘法对你来说不再有任何秘密。",
      13: "你对乘法表的掌握堪称典范。",
      14: "你准确地记录和记忆数学事实。",
      15: "你在完成计算之前就能预测结果。",
      16: "你的速度和准确性令人印象深刻。",
      17: "你在数学挑战的舞台上表现出色。",
      18: "你的数学智慧激励他人。",
      19: "你理解数学运算的隐藏逻辑。",
      20: "你的计算壮举使你成为真正的传奇。",
      21: "你保护并应用基本数学原理。",
      22: "你的深入知识超越了简单的记忆。",
      23: "你在心算方面达到了罕见的卓越水平。",
      24: "你像大师一样轻松地玩转数字。",
      25: "你的计算能力令人印象深刻且可靠。",
      26: "你用策略和精确性指导你的数学思想。",
      27: "你掌握了计算的最深层面。",
      28: "你仁慈地统治着数字王国。",
      29: "你的数学智能扩展到所有领域。",
      30: "你的数学掌握超越了普通极限。你是所有人的榜样！"
    }
  },
};