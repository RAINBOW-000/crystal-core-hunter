import assert from "node:assert/strict";
import test from "node:test";
import { getEnemyCoreReward } from "../src/domain/combat/EnemyCoreReward.ts";

test("each enemy archetype has a fixed crystal-core reward", () => {
  assert.deepEqual(getEnemyCoreReward("crystalBug"), { coreTier: 1, experience: 1 });
  assert.deepEqual(getEnemyCoreReward("crystalSpitter"), { coreTier: 2, experience: 3 });
  assert.deepEqual(getEnemyCoreReward("crystalRam"), { coreTier: 3, experience: 6 });
  assert.deepEqual(getEnemyCoreReward("elite"), { coreTier: 4, experience: 10 });
});

test("boss victory does not add in-run crystal-core experience", () => {
  assert.equal(getEnemyCoreReward("boss").experience, 0);
});
