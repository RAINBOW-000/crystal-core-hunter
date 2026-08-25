import assert from "node:assert/strict";
import test from "node:test";
import { getBossPhase } from "../src/domain/combat/BossPhase.ts";

test("boss phase follows remaining health thresholds", () => {
  assert.equal(getBossPhase(100, 100), 1);
  assert.equal(getBossPhase(66, 100), 2);
  assert.equal(getBossPhase(33, 100), 3);
  assert.equal(getBossPhase(0, 100), 3);
});
