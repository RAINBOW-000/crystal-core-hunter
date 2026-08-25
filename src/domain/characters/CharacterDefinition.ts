export interface CharacterStats {
  maxHp: number;
  moveSpeed: number;
  armor: number;
  damageMultiplier: number;
  cooldownMultiplier: number;
  pickupRadius: number;
  luck: number;
}

export type CharacterTalent =
  | { type: "lowHealthGuard"; threshold: number; damageMultiplier: number }
  | { type: "dodgeFury"; damageMultiplier: number; durationMs: number }
  | { type: "coreRegeneration"; coresRequired: number; healing: number };

export interface CharacterDefinition {
  id: string;
  name: string;
  title: string;
  description: string;
  texture: string;
  color: number;
  stats: CharacterStats;
  talentName: string;
  talentDescription: string;
  talent: CharacterTalent;
}
