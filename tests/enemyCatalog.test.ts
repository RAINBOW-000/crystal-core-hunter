import assert from "node:assert/strict";
import test from "node:test";
import { ENEMY_CATALOG, ENEMY_SPAWN_PLAN } from "../src/content/enemies/enemyCatalog.ts";
import { pickWaveEnemy } from "../src/domain/enemies/EnemyDefinition.ts";

test("enemy definitions use unique stable IDs and valid combat values", () => {
  const ids = ENEMY_CATALOG.map((enemy) => enemy.id);
  assert.equal(new Set(ids).size, ids.length);
  ENEMY_CATALOG.forEach((enemy) => {
    assert.ok(enemy.hp > 0);
    assert.ok(enemy.speed > 0);
    assert.ok(enemy.contactDamage >= 0);
    assert.ok(enemy.coreReward.experience >= 0);
    assert.ok(enemy.itemDropChance >= 0 && enemy.itemDropChance <= 1);
  });
});

test("spawn timeline references catalog entries and retains the twelve minute pacing", () => {
  const ids = new Set(ENEMY_CATALOG.map((enemy) => enemy.id));
  ENEMY_SPAWN_PLAN.waveStages.flatMap((stage) => stage.entries).forEach((entry) => assert.ok(ids.has(entry.enemyId)));
  ENEMY_SPAWN_PLAN.eliteSpawns.forEach((spawn) => assert.ok(ids.has(spawn.enemyId)));
  assert.ok(ids.has(ENEMY_SPAWN_PLAN.bossSpawn.enemyId));
  assert.deepEqual(ENEMY_SPAWN_PLAN.eliteSpawns.map((spawn) => spawn.atMs), [150000, 300000, 450000, 600000]);
  assert.equal(ENEMY_SPAWN_PLAN.bossSpawn.atMs, 720000);
  assert.equal(ENEMY_SPAWN_PLAN.durationMs, 720000);
});

test("wave selection changes at the configured progress thresholds", () => {
  assert.equal(pickWaveEnemy(ENEMY_SPAWN_PLAN, 0.24, () => 0.99), "crystal-bug");
  assert.equal(pickWaveEnemy(ENEMY_SPAWN_PLAN, 0.25, () => 0.8), "crystal-spitter");
  assert.equal(pickWaveEnemy(ENEMY_SPAWN_PLAN, 0.58, () => 0.1), "crystal-bug");
  assert.equal(pickWaveEnemy(ENEMY_SPAWN_PLAN, 0.58, () => 0.6), "crystal-spitter");
  assert.equal(pickWaveEnemy(ENEMY_SPAWN_PLAN, 0.58, () => 0.9), "crystal-ram");
});
