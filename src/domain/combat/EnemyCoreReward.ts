export type CoreTier = 1 | 2 | 3 | 4;

export type EnemyArchetype =
  | "crystalBug"
  | "crystalSpitter"
  | "crystalRam"
  | "elite"
  | "boss";

export interface EnemyCoreReward {
  coreTier: CoreTier;
  experience: number;
}

const REWARDS: Record<EnemyArchetype, EnemyCoreReward> = {
  crystalBug: { coreTier: 1, experience: 1 },
  crystalSpitter: { coreTier: 2, experience: 3 },
  crystalRam: { coreTier: 3, experience: 6 },
  elite: { coreTier: 4, experience: 10 },
  boss: { coreTier: 4, experience: 0 },
};

/** Crystal-core tier and experience are fixed by enemy archetype. */
export function getEnemyCoreReward(archetype: EnemyArchetype): EnemyCoreReward {
  return REWARDS[archetype];
}
