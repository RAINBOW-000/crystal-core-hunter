export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

export const ROOM_BOUNDS = {
  x: 56,
  y: 68,
  width: 848,
  height: 420,
} as const;

export const PLAYER_CONFIG = {
  attackMoveSpeed: 105,
  attackSlowDuration: 130,
  dodgeSpeed: 410,
  dodgeDuration: 180,
  dodgeInvulnerability: 230,
  dodgeCooldown: 900,
  contactInvulnerability: 700,
} as const;

export const CRYSTAL_BUG_CONFIG = {
  hp: 3,
  speed: 45,
  contactDamage: 8,
  stopDistance: 10,
} as const;

export const ELITE_BUG_CONFIG = {
  hp: 28,
  speed: 52,
  contactDamage: 14,
  stopDistance: 13,
  itemDropChance: 0.65,
} as const;

export const CRYSTAL_SPITTER_CONFIG = {
  hp: 5,
  speed: 40,
  contactDamage: 7,
  preferredDistance: 225,
  shotCooldownMs: 1800,
  projectileSpeed: 155,
  projectileDamage: 7,
} as const;

export const CRYSTAL_RAM_CONFIG = {
  hp: 9,
  speed: 52,
  chargeSpeed: 285,
  telegraphMs: 560,
  chargeMs: 620,
  chargeCooldownMs: 2500,
  contactDamage: 15,
} as const;

export const BOSS_CONFIG = {
  hp: 260,
  speed: 38,
  contactDamage: 22,
  stopDistance: 18,
  projectileDamage: 9,
} as const;

export const GREATSWORD_CONFIG = {
  cooldown: 360,
  comboWindow: 720,
  attackSlowDuration: 130,
  normalRange: 72,
  finisherRange: 86,
  normalHalfArc: 55,
  finisherHalfArc: 68,
  normalDamage: 1,
  finisherDamage: 2,
  normalKnockback: 270,
  finisherKnockback: 380,
} as const;

export const RUN_CONFIG = {
  durationMs: 12 * 60 * 1000,
  eliteSpawnTimesMs: [150000, 300000, 450000, 600000],
  rareVeinSpawnTimesMs: [180000, 390000, 570000],
  initialEnemies: 4,
  spawnIntervalMs: 3200,
  minimumSpawnIntervalMs: 700,
  initialEnemyCap: 10,
  maximumEnemyCap: 70,
} as const;

export const RARE_VEIN_CONFIG = {
  interactionRadius: 82,
  miningDurationMs: 2500,
  spawnPlayerClearance: 220,
} as const;

export const EXPERIENCE_CONFIG = {
  baseRequirement: 3,
  requirementGrowth: 2,
} as const;
