import assert from "node:assert/strict";
import test from "node:test";
import { HoldInteraction } from "../src/domain/world/HoldInteraction.ts";

test("mining completes only after the full stationary hold duration", () => {
  const interaction = new HoldInteraction(2500);
  assert.equal(interaction.update(1000, true, true), "progress");
  assert.equal(interaction.update(1499, true, true), "progress");
  assert.equal(interaction.update(1, true, true), "completed");
  assert.equal(interaction.ratio, 1);
});

test("releasing, moving, or taking damage can reset mining progress", () => {
  const interaction = new HoldInteraction(2500);
  interaction.update(1200, true, true);
  assert.equal(interaction.update(16, true, false), "idle");
  assert.equal(interaction.progressMs, 0);
  interaction.update(700, true, true);
  interaction.reset();
  assert.equal(interaction.progressMs, 0);
});
