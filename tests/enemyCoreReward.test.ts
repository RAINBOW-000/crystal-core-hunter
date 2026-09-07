import assert from "node:assert/strict";
import test from "node:test";
import {
  CRYSTAL_BUG,
  CRYSTAL_HIVE_BOSS,
  CRYSTAL_RAM,
  CRYSTAL_SPITTER,
  ELITE_CRYSTAL_BUG,
} from "../src/content/enemies/enemyCatalog.ts";

test("each enemy archetype has a fixed crystal-core reward", () => {
  assert.deepEqual(CRYSTAL_BUG.coreReward, { coreTier: 1, experience: 1 });
  assert.deepEqual(CRYSTAL_SPITTER.coreReward, { coreTier: 2, experience: 3 });
  assert.deepEqual(CRYSTAL_RAM.coreReward, { coreTier: 3, experience: 6 });
  assert.deepEqual(ELITE_CRYSTAL_BUG.coreReward, { coreTier: 4, experience: 10 });
});

test("boss victory does not add in-run crystal-core experience", () => {
  assert.equal(CRYSTAL_HIVE_BOSS.coreReward.experience, 0);
});
