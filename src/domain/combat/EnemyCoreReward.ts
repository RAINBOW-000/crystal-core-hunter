export type CoreTier = 1 | 2 | 3 | 4;

export interface EnemyCoreReward {
  coreTier: CoreTier;
  experience: number;
}
