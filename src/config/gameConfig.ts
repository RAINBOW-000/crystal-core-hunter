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
  rareVeinSpawnTimesMs: [180000, 390000, 570000],
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
