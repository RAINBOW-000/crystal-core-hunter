import assert from "node:assert/strict";
import test from "node:test";
import { MetaUnlockProgression } from "../src/domain/meta/MetaUnlockProgression.ts";

test("victory chest offers only locked content and unlock persists in the model", () => {
  const progression = new MetaUnlockProgression(
    ["a", "b", "c", "d", "e"], ["a", "b"], [], () => 0.4,
  );
  const offer = progression.createVictoryOffer();
  assert.equal(offer.length, 3);
  assert.ok(offer.every((id) => !["a", "b"].includes(id)));
  assert.equal(progression.unlock(offer[0]), true);
  assert.equal(progression.isUnlocked(offer[0]), true);
  assert.equal(progression.unlock(offer[0]), false);
});

test("saved unlocks are filtered against the current catalog", () => {
  const progression = new MetaUnlockProgression(["a", "b", "c"], ["a"], ["c", "removed"]);
  assert.deepEqual(progression.unlockedIds, ["a", "c"]);
});
