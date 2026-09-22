import assert from "node:assert/strict";
import test from "node:test";
import { getStageEnemyCap, getStageSpawnInterval, STAGE_ONE, STAGE_TWO } from "../src/content/stages/stageCatalog.ts";

test("campaign stages use the agreed timers, elite cadence, and rare veins", () => {
  assert.equal(STAGE_ONE.spawnPlan.durationMs, 7 * 60 * 1000);
  assert.equal(STAGE_TWO.spawnPlan.durationMs, 9 * 60 * 1000);
  assert.deepEqual(STAGE_ONE.spawnPlan.eliteSpawns.map((spawn) => spawn.atMs), [90000, 180000, 270000, 360000]);
  assert.deepEqual(STAGE_TWO.spawnPlan.eliteSpawns.map((spawn) => spawn.atMs), [120000, 240000, 360000, 480000]);
  assert.deepEqual(STAGE_ONE.rareVeinSpawnTimesMs, [140000, 280000]);
  assert.deepEqual(STAGE_TWO.rareVeinSpawnTimesMs, [180000, 360000]);
});

test("stage two applies returning-enemy difficulty and exposes its four items", () => {
  assert.deepEqual(STAGE_TWO.returningEnemyModifiers, { hp: 1.35, damage: 1.25, speed: 1.12, actionInterval: 0.85 });
  assert.deepEqual(STAGE_TWO.stageItemIds, ["thaw-pulse", "ice-cleats", "echo-chip", "core-battery"]);
});

test("early pressure stays dense for two minutes and rejoins the base curve after one minute", () => {
  assert.equal(STAGE_ONE.spawnPlan.initialEnemies, 8);
  assert.equal(STAGE_TWO.spawnPlan.initialEnemies, 10);
  assert.equal(getStageSpawnInterval(STAGE_ONE, 120000), 1600);
  assert.equal(getStageEnemyCap(STAGE_ONE, 120000), 20);
  assert.equal(getStageEnemyCap(STAGE_TWO, 120000), 24);
  assert.ok(Math.abs(getStageSpawnInterval(STAGE_ONE, 180000) - 2128.5714285714284) < 0.001);
  assert.equal(getStageEnemyCap(STAGE_ONE, 180000), 35);
});

test("fixed opening surges match the agreed stage compositions", () => {
  assert.deepEqual(STAGE_ONE.earlyPressure.surges.map((surge) => surge.enemyIds.length), [2, 3, 4]);
  assert.deepEqual(STAGE_TWO.earlyPressure.surges.map((surge) => surge.enemyIds.length), [3, 4, 5]);
  assert.deepEqual(STAGE_ONE.earlyPressure.surges.map((surge) => surge.atMs), [30000, 60000, 120000]);
  assert.equal(STAGE_ONE.earlyPressure.telegraphMs, 800);
  assert.equal(STAGE_ONE.earlyPressure.formationWidth, 150);
});
