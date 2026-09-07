import type { EnemyCoreReward } from "../combat/EnemyCoreReward";
import type { RandomSource } from "../random/RunRandom";

export type EnemyId = "crystal-bug" | "crystal-spitter" | "crystal-ram" | "elite-crystal-bug" | "crystal-hive-boss";
export type EnemyKind = "normal" | "elite" | "boss";

interface EnemyDefinitionBase {
  id: EnemyId;
  name: string;
  kind: EnemyKind;
  texture: string;
  hp: number;
  speed: number;
  contactDamage: number;
  coreReward: EnemyCoreReward;
  itemDropChance: number;
}

export interface ChaserEnemyDefinition extends EnemyDefinitionBase {
  behavior: "chaser";
  stopDistance: number;
}

export interface SpitterEnemyDefinition extends EnemyDefinitionBase {
  behavior: "spitter";
  preferredDistance: number;
  shotCooldownMs: number;
  projectileSpeed: number;
  projectileDamage: number;
}

export interface RamEnemyDefinition extends EnemyDefinitionBase {
  behavior: "ram";
  chargeSpeed: number;
  telegraphMs: number;
  chargeMs: number;
  chargeCooldownMs: number;
}

export interface BossEnemyDefinition extends EnemyDefinitionBase {
  behavior: "boss";
  projectileDamage: number;
}

export type EnemyDefinition = ChaserEnemyDefinition | SpitterEnemyDefinition | RamEnemyDefinition | BossEnemyDefinition;

export interface WaveEntry {
  enemyId: EnemyId;
  weight: number;
}

export interface WaveStage {
  fromProgress: number;
  entries: readonly WaveEntry[];
}

export interface EnemySpawnPlan {
  durationMs: number;
  initialEnemies: number;
  spawnIntervalMs: { start: number; end: number };
  enemyCap: { start: number; end: number };
  maximumBatchSize: number;
  waveStages: readonly WaveStage[];
  eliteSpawns: readonly { atMs: number; enemyId: EnemyId; reinforced?: boolean }[];
  bossSpawn: { atMs: number; enemyId: EnemyId };
}

export function pickWaveEnemy(plan: EnemySpawnPlan, progress: number, random: RandomSource): EnemyId {
  const stage = [...plan.waveStages]
    .sort((left, right) => left.fromProgress - right.fromProgress)
    .filter((candidate) => candidate.fromProgress <= progress)
    .at(-1);
  if (!stage || stage.entries.length === 0) throw new Error("Enemy spawn plan has no active wave entries");
  const totalWeight = stage.entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight <= 0) throw new Error("Enemy spawn stage must have positive weight");
  let roll = Math.min(Math.max(random(), 0), 0.999999999) * totalWeight;
  for (const entry of stage.entries) {
    roll -= entry.weight;
    if (roll < 0) return entry.enemyId;
  }
  return stage.entries.at(-1)!.enemyId;
}
