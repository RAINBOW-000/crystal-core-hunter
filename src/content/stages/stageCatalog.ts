import type { EnemyId, EnemySpawnPlan } from "../../domain/enemies/EnemyDefinition";

export interface EarlyPressureDefinition {
  durationMs: number;
  spawnIntervalMs: number;
  enemyCap: number;
  transitionMs: number;
  telegraphMs: number;
  formationWidth: number;
  surges: readonly { atMs: number; enemyIds: readonly EnemyId[] }[];
}

export interface StageDefinition {
  number: 1 | 2;
  name: string;
  subtitle: string;
  experienceMultiplier: number;
  rareVeinSpawnTimesMs: readonly number[];
  returningEnemyModifiers: { hp: number; damage: number; speed: number; actionInterval: number };
  stageItemIds: readonly string[];
  spawnPlan: EnemySpawnPlan;
  earlyPressure: EarlyPressureDefinition;
  palette: { floorA: number; floorB: number; crystal: number; border: number };
}

export const STAGE_ONE: StageDefinition = {
  number: 1, name: "晶核荒原", subtitle: "破碎矿场",
  experienceMultiplier: 1.7,
  rareVeinSpawnTimesMs: [140000, 280000],
  returningEnemyModifiers: { hp: 1, damage: 1, speed: 1, actionInterval: 1 },
  stageItemIds: [],
  palette: { floorA: 0x24202d, floorB: 0x211d29, crystal: 0x63d5c4, border: 0x4b4057 },
  spawnPlan: {
    durationMs: 420000, initialEnemies: 8,
    spawnIntervalMs: { start: 3200, end: 700 }, enemyCap: { start: 10, end: 70 }, maximumBatchSize: 5,
    waveStages: [
      { fromProgress: 0, entries: [{ enemyId: "crystal-bug", weight: 1 }] },
      { fromProgress: 0.25, entries: [{ enemyId: "crystal-bug", weight: 0.76 }, { enemyId: "crystal-spitter", weight: 0.24 }] },
      { fromProgress: 0.58, entries: [{ enemyId: "crystal-bug", weight: 0.54 }, { enemyId: "crystal-spitter", weight: 0.28 }, { enemyId: "crystal-ram", weight: 0.18 }] },
    ],
    eliteSpawns: [90000, 180000, 270000, 360000].map((atMs, index, all) => ({ atMs, enemyId: "elite-crystal-bug", reinforced: index === all.length - 1 })),
    bossSpawn: { atMs: 420000, enemyId: "crystal-hive-boss" },
  },
  earlyPressure: {
    durationMs: 120000, spawnIntervalMs: 1600, enemyCap: 20, transitionMs: 60000,
    telegraphMs: 800, formationWidth: 150,
    surges: [
      { atMs: 30000, enemyIds: ["crystal-bug", "crystal-bug"] },
      { atMs: 60000, enemyIds: ["crystal-bug", "crystal-bug", "crystal-spitter"] },
      { atMs: 120000, enemyIds: ["crystal-bug", "crystal-bug", "crystal-spitter", "crystal-ram"] },
    ],
  },
};

export const STAGE_TWO: StageDefinition = {
  number: 2, name: "极寒矿脉", subtitle: "冻土深层",
  experienceMultiplier: 1.33,
  rareVeinSpawnTimesMs: [180000, 360000],
  returningEnemyModifiers: { hp: 1.35, damage: 1.25, speed: 1.12, actionInterval: 0.85 },
  stageItemIds: ["thaw-pulse", "ice-cleats", "echo-chip", "core-battery"],
  palette: { floorA: 0x182a3b, floorB: 0x1b3043, crystal: 0x8edfff, border: 0x426b87 },
  spawnPlan: {
    durationMs: 540000, initialEnemies: 10,
    spawnIntervalMs: { start: 2800, end: 580 }, enemyCap: { start: 13, end: 82 }, maximumBatchSize: 6,
    waveStages: [
      { fromProgress: 0, entries: [{ enemyId: "crystal-bug", weight: 0.65 }, { enemyId: "frost-trail-beast", weight: 0.35 }] },
      { fromProgress: 0.24, entries: [{ enemyId: "crystal-spitter", weight: 0.3 }, { enemyId: "frost-trail-beast", weight: 0.4 }, { enemyId: "ice-vein-caller", weight: 0.3 }] },
      { fromProgress: 0.58, entries: [{ enemyId: "crystal-ram", weight: 0.24 }, { enemyId: "frost-trail-beast", weight: 0.36 }, { enemyId: "ice-vein-caller", weight: 0.4 }] },
    ],
    eliteSpawns: [120000, 240000, 360000, 480000].map((atMs) => ({ atMs, enemyId: "frost-ridge-hunter" })),
    bossSpawn: { atMs: 540000, enemyId: "ice-armor-colossus" },
  },
  earlyPressure: {
    durationMs: 120000, spawnIntervalMs: 1600, enemyCap: 24, transitionMs: 60000,
    telegraphMs: 800, formationWidth: 150,
    surges: [
      { atMs: 30000, enemyIds: ["frost-trail-beast", "frost-trail-beast", "crystal-bug"] },
      { atMs: 60000, enemyIds: ["frost-trail-beast", "frost-trail-beast", "ice-vein-caller", "crystal-spitter"] },
      { atMs: 120000, enemyIds: ["frost-trail-beast", "frost-trail-beast", "ice-vein-caller", "ice-vein-caller", "crystal-ram"] },
    ],
  },
};

export const STAGE_CATALOG = [STAGE_ONE, STAGE_TWO] as const;
export function getStage(number: number): StageDefinition { return number === 2 ? STAGE_TWO : STAGE_ONE; }

export function getStageSpawnInterval(stage: StageDefinition, elapsedMs: number): number {
  const early = stage.earlyPressure;
  const progress = Math.min(1, elapsedMs / stage.spawnPlan.durationMs);
  const base = stage.spawnPlan.spawnIntervalMs.start + (stage.spawnPlan.spawnIntervalMs.end - stage.spawnPlan.spawnIntervalMs.start) * progress;
  if (elapsedMs <= early.durationMs) return early.spawnIntervalMs;
  const transition = Math.min(1, (elapsedMs - early.durationMs) / early.transitionMs);
  return early.spawnIntervalMs + (base - early.spawnIntervalMs) * transition;
}

export function getStageEnemyCap(stage: StageDefinition, elapsedMs: number): number {
  const early = stage.earlyPressure;
  const progress = Math.min(1, elapsedMs / stage.spawnPlan.durationMs);
  const base = stage.spawnPlan.enemyCap.start + (stage.spawnPlan.enemyCap.end - stage.spawnPlan.enemyCap.start) * progress;
  if (elapsedMs <= early.durationMs) return early.enemyCap;
  const transition = Math.min(1, (elapsedMs - early.durationMs) / early.transitionMs);
  return Math.floor(early.enemyCap + (base - early.enemyCap) * transition);
}
