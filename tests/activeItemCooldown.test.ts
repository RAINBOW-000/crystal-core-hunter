import assert from "node:assert/strict";
import test from "node:test";
import { ActiveItemCooldowns } from "../src/domain/items/ActiveItemCooldown.ts";

test("active item cooldown reports ready, remaining time, and expiry", () => {
  const cooldowns = new ActiveItemCooldowns();
  assert.deepEqual(cooldowns.getState("crystal-bomb", 1000), { remainingMs: 0, ready: true });
  cooldowns.trigger("crystal-bomb", 1000, 8000);
  assert.deepEqual(cooldowns.getState("crystal-bomb", 3500), { remainingMs: 5500, ready: false });
  assert.deepEqual(cooldowns.getState("crystal-bomb", 9000), { remainingMs: 0, ready: true });
});
