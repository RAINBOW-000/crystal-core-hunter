export type RunPhase = "choosingCharacter" | "choosingInitialWeapon" | "playing" | "choosingUpgrade" | "choosingItemReward" | "choosingItemReplacement" | "choosingVictoryReward" | "won" | "lost";

export interface RunSnapshot {
  phase: RunPhase;
  hp: number;
  maxHp: number;
  level: number;
  xp: number;
  xpRequired: number;
  elapsedMs: number;
  remainingMs: number;
  enemyCount: number;
  dropCount: number;
  combo: number;
  hitCount: number;
  weaponLevel: number;
  pickupRadius: number;
  dodgeCooldownMs: number;
  playerPosition: { x: number; y: number };
  dodging: boolean;
  activeItems: readonly ({ name: string; level: number } | undefined)[];
  bossActive: boolean;
  bossHp: number;
  bossMaxHp: number;
  equippedWeapons: readonly { name: string; level: number }[];
  characterName: string;
}
