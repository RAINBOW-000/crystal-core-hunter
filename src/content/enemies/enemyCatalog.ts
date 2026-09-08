import type {
  BossEnemyDefinition,
  ChaserEnemyDefinition,
  EnemyDefinition,
  EnemyId,
  EnemySpawnPlan,
  RamEnemyDefinition,
  SpitterEnemyDefinition,
} from "../../domain/enemies/EnemyDefinition";

export const CRYSTAL_BUG = {
  id: "crystal-bug", name: "晶壳虫", kind: "normal", texture: "crystal-bug",
  hp: 3, speed: 45, contactDamage: 8, coreReward: { coreTier: 1, experience: 1 }, itemDropChance: 0,
  behavior: "chaser", stopDistance: 10,
} as const satisfies ChaserEnemyDefinition;

export const ELITE_CRYSTAL_BUG = {
  id: "elite-crystal-bug", name: "精英晶壳虫", kind: "elite", texture: "elite-crystal-bug",
  hp: 28, speed: 52, contactDamage: 14, coreReward: { coreTier: 4, experience: 10 }, itemDropChance: 0.65,
  behavior: "chaser", stopDistance: 13,
} as const satisfies ChaserEnemyDefinition;

export const CRYSTAL_SPITTER = {
  id: "crystal-spitter", name: "晶刺喷吐者", kind: "normal", texture: "crystal-spitter",
  hp: 5, speed: 40, contactDamage: 7, coreReward: { coreTier: 2, experience: 3 }, itemDropChance: 0,
  behavior: "spitter", preferredDistance: 225, shotCooldownMs: 1800, projectileSpeed: 155, projectileDamage: 7,
} as const satisfies SpitterEnemyDefinition;

export const CRYSTAL_RAM = {
  id: "crystal-ram", name: "裂晶冲锋兽", kind: "normal", texture: "crystal-ram",
  hp: 9, speed: 52, contactDamage: 15, coreReward: { coreTier: 3, experience: 6 }, itemDropChance: 0,
  behavior: "ram", chargeSpeed: 285, telegraphMs: 560, chargeMs: 620, chargeCooldownMs: 2500,
} as const satisfies RamEnemyDefinition;

export const CRYSTAL_HIVE_BOSS = {
  id: "crystal-hive-boss", name: "晶巢领主", kind: "boss", texture: "crystal-hive-boss",
  hp: 260, speed: 38, contactDamage: 22, coreReward: { coreTier: 4, experience: 0 }, itemDropChance: 0,
  behavior: "boss", projectileDamage: 9,
} as const satisfies BossEnemyDefinition;

export const ENEMY_CATALOG = [
  CRYSTAL_BUG, CRYSTAL_SPITTER, CRYSTAL_RAM, ELITE_CRYSTAL_BUG, CRYSTAL_HIVE_BOSS,
] as const satisfies readonly EnemyDefinition[];

export const ENEMY_SPAWN_PLAN = {
  durationMs: 12 * 60 * 1000,
  initialEnemies: 4,
  spawnIntervalMs: { start: 3200, end: 700 },
  enemyCap: { start: 10, end: 70 },
  maximumBatchSize: 5,
  waveStages: [
    { fromProgress: 0, entries: [{ enemyId: "crystal-bug", weight: 1 }] },
    { fromProgress: 0.25, entries: [
      { enemyId: "crystal-bug", weight: 0.76 },
      { enemyId: "crystal-spitter", weight: 0.24 },
    ] },
    { fromProgress: 0.58, entries: [
      { enemyId: "crystal-bug", weight: 0.54 },
      { enemyId: "crystal-spitter", weight: 0.28 },
      { enemyId: "crystal-ram", weight: 0.18 },
    ] },
  ],
  eliteSpawns: [150000, 300000, 450000, 600000].map((atMs, index, entries) => ({
    atMs, enemyId: "elite-crystal-bug" as const, reinforced: index === entries.length - 1,
  })),
  bossSpawn: { atMs: 12 * 60 * 1000, enemyId: "crystal-hive-boss" },
} as const satisfies EnemySpawnPlan;

export function getEnemyDefinition(id: EnemyId): EnemyDefinition {
  const definition = ENEMY_CATALOG.find((candidate) => candidate.id === id);
  if (!definition) throw new Error(`Unknown enemy definition: ${id}`);
  return definition;
}
