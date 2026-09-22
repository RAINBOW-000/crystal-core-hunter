import assert from "node:assert/strict";
import test from "node:test";
import { ColdStatus } from "../src/domain/status/ColdStatus.ts";

test("five cold stacks freeze until the generated sequence is completed", () => {
  const cold = new ColdStatus(() => 0);
  for (let index = 0; index < 4; index += 1) assert.equal(cold.add(), false);
  assert.equal(cold.add(), true);
  assert.deepEqual(cold.thawSequence, ["A", "A", "A", "A"]);
  assert.equal(cold.press("B"), false);
  for (let index = 0; index < 3; index += 1) assert.equal(cold.press("A"), false);
  assert.equal(cold.press("A"), true);
  assert.equal(cold.stacks, 0);
  assert.equal(cold.frozen, false);
});
