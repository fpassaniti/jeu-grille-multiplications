/**
 * Catalogue des items de personnage V2 (SPEC §5.9) — source de vérité unique.
 * Consommé par generate-item-placeholders.mjs pour générer :
 *  - les SVG placeholders (static/images/items/{code}.svg)
 *  - le bloc seed SQL de db/migrations/002_gamification.sql
 * Garde la DB, les assets et le catalogue toujours synchrones.
 */

// Prix par rareté (SPEC §5.2)
export const PRICES = { common: 150, rare: 500, epic: 1500, legendary: 4500 };

/**
 * @typedef {Object} ItemDef
 * @property {string} code
 * @property {'background'|'aura'|'back'|'body'|'outfit'|'weapon'|'hat'|'pet'} slot
 * @property {'common'|'rare'|'epic'|'legendary'|null} rarity - null pour les 3 défauts (price 0)
 * @property {number} unlockLevel
 * @property {boolean} isPurchasable - false = exclusif aux coffres (level-up notamment)
 * @property {boolean} isDefault
 * @property {string} emoji - placeholder visuel
 * @property {{fr: string, en: string, es: string, zh: string}} names
 * @property {number} sortOrder
 */

let order = 0;
const next = () => order++;

/** @type {ItemDef[]} */
export const ITEMS = [
  // --- Défauts gratuits (3) ---
  {
    code: 'body_blob_purple',
    slot: 'body',
    rarity: null,
    unlockLevel: 1,
    isPurchasable: false,
    isDefault: true,
    emoji: '🟣',
    names: { fr: 'Blob violet', en: 'Purple blob', es: 'Blob morado', zh: '紫色史莱姆' },
    sortOrder: next()
  },
  {
    code: 'outfit_tshirt_torn',
    slot: 'outfit',
    rarity: null,
    unlockLevel: 1,
    isPurchasable: false,
    isDefault: true,
    emoji: '👕',
    names: { fr: 'T-shirt troué', en: 'Torn t-shirt', es: 'Camiseta rota', zh: '破T恤' },
    sortOrder: next()
  },
  {
    code: 'weapon_stick_wood',
    slot: 'weapon',
    rarity: null,
    unlockLevel: 1,
    isPurchasable: false,
    isDefault: true,
    emoji: '🪵',
    names: { fr: 'Bâton de bois', en: 'Wooden stick', es: 'Palo de madera', zh: '木棍' },
    sortOrder: next()
  },

  // --- body (×5 + défaut) ---
  {
    code: 'body_blob_blue',
    slot: 'body',
    rarity: 'common',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🔵',
    names: { fr: 'Blob bleu', en: 'Blue blob', es: 'Blob azul', zh: '蓝色史莱姆' },
    sortOrder: next()
  },
  {
    code: 'body_blob_green',
    slot: 'body',
    rarity: 'common',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🟢',
    names: { fr: 'Blob vert', en: 'Green blob', es: 'Blob verde', zh: '绿色史莱姆' },
    sortOrder: next()
  },
  {
    code: 'body_blob_spotted',
    slot: 'body',
    rarity: 'rare',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🎨',
    names: { fr: 'Blob à taches', en: 'Spotted blob', es: 'Blob con manchas', zh: '斑点史莱姆' },
    sortOrder: next()
  },
  {
    code: 'body_dragon_junior',
    slot: 'body',
    rarity: 'epic',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🐲',
    names: { fr: 'Dragon junior', en: 'Junior dragon', es: 'Dragón junior', zh: '幼龙' },
    sortOrder: next()
  },
  {
    code: 'body_phoenix_rainbow',
    slot: 'body',
    rarity: 'legendary',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🐦‍🔥',
    names: { fr: 'Phénix arc-en-ciel', en: 'Rainbow phoenix', es: 'Fénix arcoíris', zh: '彩虹凤凰' },
    sortOrder: next()
  },

  // --- outfit (×7 + défaut) ---
  {
    code: 'outfit_tshirt_star',
    slot: 'outfit',
    rarity: 'common',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '⭐',
    names: { fr: 'T-shirt étoile', en: 'Star t-shirt', es: 'Camiseta estrella', zh: '星星T恤' },
    sortOrder: next()
  },
  {
    code: 'outfit_overalls',
    slot: 'outfit',
    rarity: 'common',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '👖',
    names: { fr: 'Salopette', en: 'Overalls', es: 'Peto', zh: '背带裤' },
    sortOrder: next()
  },
  {
    code: 'outfit_mage_tunic',
    slot: 'outfit',
    rarity: 'rare',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🧙',
    names: { fr: 'Tunique de mage', en: 'Mage tunic', es: 'Túnica de mago', zh: '法师长袍' },
    sortOrder: next()
  },
  {
    // Exclusif au coffre de level-up niveau 10 (SPEC §5.3/§5.5) — non achetable
    code: 'outfit_pirate_vest',
    slot: 'outfit',
    rarity: 'rare',
    unlockLevel: 10,
    isPurchasable: false,
    isDefault: false,
    emoji: '🏴‍☠️',
    names: { fr: 'Gilet de pirate', en: 'Pirate vest', es: 'Chaleco pirata', zh: '海盗背心' },
    sortOrder: next()
  },
  {
    code: 'outfit_knight_armor',
    slot: 'outfit',
    rarity: 'epic',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🛡️',
    names: {
      fr: 'Armure de chevalier',
      en: 'Knight armor',
      es: 'Armadura de caballero',
      zh: '骑士盔甲'
    },
    sortOrder: next()
  },
  {
    code: 'outfit_golden_armor',
    slot: 'outfit',
    rarity: 'epic',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🥇',
    names: { fr: 'Armure dorée', en: 'Golden armor', es: 'Armadura dorada', zh: '黄金盔甲' },
    sortOrder: next()
  },
  {
    code: 'outfit_galaxy_armor',
    slot: 'outfit',
    rarity: 'legendary',
    unlockLevel: 15,
    isPurchasable: true,
    isDefault: false,
    emoji: '🌌',
    names: {
      fr: 'Armure galactique',
      en: 'Galactic armor',
      es: 'Armadura galáctica',
      zh: '银河盔甲'
    },
    sortOrder: next()
  },

  // --- hat (×7) ---
  {
    code: 'hat_cap',
    slot: 'hat',
    rarity: 'common',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🧢',
    names: { fr: 'Casquette', en: 'Cap', es: 'Gorra', zh: '棒球帽' },
    sortOrder: next()
  },
  {
    code: 'hat_beanie',
    slot: 'hat',
    rarity: 'common',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🧶',
    names: { fr: 'Bonnet', en: 'Beanie', es: 'Gorro', zh: '毛线帽' },
    sortOrder: next()
  },
  {
    // Exclusif au coffre de level-up niveau 5 (SPEC §5.3/§5.5) — non achetable
    code: 'hat_party',
    slot: 'hat',
    rarity: 'common',
    unlockLevel: 5,
    isPurchasable: false,
    isDefault: false,
    emoji: '🥳',
    names: { fr: 'Chapeau de fête', en: 'Party hat', es: 'Sombrero de fiesta', zh: '派对帽' },
    sortOrder: next()
  },
  {
    code: 'hat_wizard',
    slot: 'hat',
    rarity: 'rare',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🧙‍♂️',
    names: { fr: 'Chapeau de sorcier', en: 'Wizard hat', es: 'Sombrero de mago', zh: '巫师帽' },
    sortOrder: next()
  },
  {
    code: 'hat_bandana',
    slot: 'hat',
    rarity: 'rare',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🧣',
    names: { fr: 'Bandana', en: 'Bandana', es: 'Bandana', zh: '头巾' },
    sortOrder: next()
  },
  {
    code: 'hat_viking',
    slot: 'hat',
    rarity: 'epic',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '⛑️',
    names: { fr: 'Casque viking', en: 'Viking helmet', es: 'Casco vikingo', zh: '维京头盔' },
    sortOrder: next()
  },
  {
    code: 'hat_crown_gold',
    slot: 'hat',
    rarity: 'legendary',
    unlockLevel: 20,
    isPurchasable: true,
    isDefault: false,
    emoji: '👑',
    names: { fr: 'Couronne dorée', en: 'Golden crown', es: 'Corona dorada', zh: '黄金皇冠' },
    sortOrder: next()
  },

  // --- weapon (×6 + défaut) ---
  {
    code: 'weapon_staff_star',
    slot: 'weapon',
    rarity: 'common',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🌟',
    names: { fr: 'Bâton étoilé', en: 'Star staff', es: 'Bastón estelar', zh: '星星法杖' },
    sortOrder: next()
  },
  {
    code: 'weapon_sword_wood',
    slot: 'weapon',
    rarity: 'rare',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🗡️',
    names: { fr: 'Épée en bois', en: 'Wooden sword', es: 'Espada de madera', zh: '木剑' },
    sortOrder: next()
  },
  {
    code: 'weapon_wand_magic',
    slot: 'weapon',
    rarity: 'rare',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🪄',
    names: { fr: 'Baguette magique', en: 'Magic wand', es: 'Varita mágica', zh: '魔杖' },
    sortOrder: next()
  },
  {
    code: 'weapon_trident_ice',
    slot: 'weapon',
    rarity: 'epic',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🔱',
    names: { fr: 'Trident de glace', en: 'Ice trident', es: 'Tridente de hielo', zh: '冰之三叉戟' },
    sortOrder: next()
  },
  {
    code: 'weapon_hammer_thunder',
    slot: 'weapon',
    rarity: 'epic',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🔨',
    names: {
      fr: 'Marteau du tonnerre',
      en: 'Thunder hammer',
      es: 'Martillo del trueno',
      zh: '雷霆之锤'
    },
    sortOrder: next()
  },
  {
    code: 'weapon_laser_math',
    slot: 'weapon',
    rarity: 'legendary',
    unlockLevel: 10,
    isPurchasable: true,
    isDefault: false,
    emoji: '⚔️',
    names: {
      fr: 'Épée laser des maths',
      en: 'Math laser sword',
      es: 'Espada láser de matemáticas',
      zh: '数学激光剑'
    },
    sortOrder: next()
  },

  // --- back (×5) ---
  {
    code: 'back_backpack',
    slot: 'back',
    rarity: 'common',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🎒',
    names: { fr: 'Sac à dos', en: 'Backpack', es: 'Mochila', zh: '背包' },
    sortOrder: next()
  },
  {
    code: 'back_cape_red',
    slot: 'back',
    rarity: 'rare',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🦸',
    names: { fr: 'Cape rouge', en: 'Red cape', es: 'Capa roja', zh: '红色斗篷' },
    sortOrder: next()
  },
  {
    code: 'back_cape_blue',
    slot: 'back',
    rarity: 'rare',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🦹',
    names: { fr: 'Cape bleue', en: 'Blue cape', es: 'Capa azul', zh: '蓝色斗篷' },
    sortOrder: next()
  },
  {
    // Exclusif au coffre de level-up niveau 15 (SPEC §5.3/§5.5) — non achetable
    code: 'back_bat_wings',
    slot: 'back',
    rarity: 'epic',
    unlockLevel: 15,
    isPurchasable: false,
    isDefault: false,
    emoji: '🦇',
    names: {
      fr: 'Ailes de chauve-souris',
      en: 'Bat wings',
      es: 'Alas de murciélago',
      zh: '蝙蝠翅膀'
    },
    sortOrder: next()
  },
  {
    code: 'back_angel_wings',
    slot: 'back',
    rarity: 'legendary',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🪽',
    names: { fr: "Ailes d'ange dorées", en: 'Golden angel wings', es: 'Alas de ángel doradas', zh: '金色天使之翼' },
    sortOrder: next()
  },

  // --- pet (×7) ---
  {
    code: 'pet_mouse',
    slot: 'pet',
    rarity: 'common',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🐭',
    names: { fr: 'Souris', en: 'Mouse', es: 'Ratón', zh: '老鼠' },
    sortOrder: next()
  },
  {
    code: 'pet_snail',
    slot: 'pet',
    rarity: 'common',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🐌',
    names: { fr: 'Escargot', en: 'Snail', es: 'Caracol', zh: '蜗牛' },
    sortOrder: next()
  },
  {
    code: 'pet_goldfish',
    slot: 'pet',
    rarity: 'common',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🐠',
    names: { fr: 'Poisson rouge', en: 'Goldfish', es: 'Pez dorado', zh: '金鱼' },
    sortOrder: next()
  },
  {
    code: 'pet_kitten',
    slot: 'pet',
    rarity: 'rare',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🐱',
    names: { fr: 'Chaton', en: 'Kitten', es: 'Gatito', zh: '小猫' },
    sortOrder: next()
  },
  {
    code: 'pet_owl',
    slot: 'pet',
    rarity: 'rare',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🦉',
    names: { fr: 'Hibou', en: 'Owl', es: 'Búho', zh: '猫头鹰' },
    sortOrder: next()
  },
  {
    // Exclusif au coffre de level-up niveau 25 (SPEC §5.3/§5.5) — non achetable
    code: 'pet_baby_dragon',
    slot: 'pet',
    rarity: 'epic',
    unlockLevel: 25,
    isPurchasable: false,
    isDefault: false,
    emoji: '🐉',
    names: { fr: 'Bébé dragon', en: 'Baby dragon', es: 'Bebé dragón', zh: '龙宝宝' },
    sortOrder: next()
  },
  {
    code: 'pet_unicorn',
    slot: 'pet',
    rarity: 'legendary',
    unlockLevel: 25,
    isPurchasable: true,
    isDefault: false,
    emoji: '🦄',
    names: { fr: 'Licorne', en: 'Unicorn', es: 'Unicornio', zh: '独角兽' },
    sortOrder: next()
  },

  // --- background (×5) ---
  {
    code: 'bg_meadow',
    slot: 'background',
    rarity: 'common',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🌼',
    names: { fr: 'Prairie', en: 'Meadow', es: 'Pradera', zh: '草原' },
    sortOrder: next()
  },
  {
    code: 'bg_forest_magic',
    slot: 'background',
    rarity: 'rare',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🌲',
    names: { fr: 'Forêt magique', en: 'Magic forest', es: 'Bosque mágico', zh: '魔法森林' },
    sortOrder: next()
  },
  {
    code: 'bg_beach',
    slot: 'background',
    rarity: 'rare',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🏖️',
    names: { fr: 'Plage', en: 'Beach', es: 'Playa', zh: '海滩' },
    sortOrder: next()
  },
  {
    code: 'bg_castle',
    slot: 'background',
    rarity: 'epic',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '🏰',
    names: { fr: 'Château', en: 'Castle', es: 'Castillo', zh: '城堡' },
    sortOrder: next()
  },
  {
    code: 'bg_galaxy',
    slot: 'background',
    rarity: 'legendary',
    unlockLevel: 30,
    isPurchasable: true,
    isDefault: false,
    emoji: '🌌',
    names: { fr: 'Galaxie', en: 'Galaxy', es: 'Galaxia', zh: '银河' },
    sortOrder: next()
  },

  // --- aura (×3) ---
  {
    code: 'aura_sparkles',
    slot: 'aura',
    rarity: 'epic',
    unlockLevel: 1,
    isPurchasable: true,
    isDefault: false,
    emoji: '✨',
    names: { fr: 'Étincelles', en: 'Sparkles', es: 'Destellos', zh: '闪光' },
    sortOrder: next()
  },
  {
    // Exclusif au coffre de level-up niveau 20 (SPEC §5.3/§5.5) — non achetable
    code: 'aura_blue_flames',
    slot: 'aura',
    rarity: 'epic',
    unlockLevel: 20,
    isPurchasable: false,
    isDefault: false,
    emoji: '🔥',
    names: { fr: 'Flammes bleues', en: 'Blue flames', es: 'Llamas azules', zh: '蓝色火焰' },
    sortOrder: next()
  },
  {
    // Exclusif au coffre de level-up niveau 30 (SPEC §5.3/§5.5) — non achetable
    code: 'aura_halo_rainbow',
    slot: 'aura',
    rarity: 'legendary',
    unlockLevel: 30,
    isPurchasable: false,
    isDefault: false,
    emoji: '🌈',
    names: {
      fr: 'Halo doré arc-en-ciel',
      en: 'Golden rainbow halo',
      es: 'Halo dorado arcoíris',
      zh: '金色彩虹光环'
    },
    sortOrder: next()
  }
];

/** @param {ItemDef} item */
export function priceOf(item) {
  return item.rarity ? PRICES[item.rarity] : 0;
}
