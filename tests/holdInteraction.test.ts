import assert from "node:assert/strict";
import test from "node:test";
import { HoldInteraction } from "../src/domain/world/HoldInteraction.ts";

test("mining completes after the full hold duration", () => {
  const interaction = new HoldInteraction(2500);
  assert.equal(interaction.update(1000, true), "progress");
  assert.equal(interaction.update(1499, true), "progress");
  assert.equal(interaction.update(1, true), "completed");
  assert.equal(interaction.ratio, 1);
});

test("releasing the interaction key resets mining progress", () => {
  const interaction = new HoldInteraction(2500);
  interaction.update(1200, true);
  assert.equal(interaction.update(16, false), "idle");
  assert.equal(interaction.progressMs, 0);
});

test("external movement or damage does not reset an active hold", () => {
  const interaction = new HoldInteraction(2500);
  interaction.update(1200, true);
  assert.equal(interaction.update(300, true), "progress");
  assert.equal(interaction.progressMs, 1500);
});
