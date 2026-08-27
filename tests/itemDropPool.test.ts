import assert from "node:assert/strict";
import test from "node:test";
import { pickEligibleItem } from "../src/domain/items/ItemDropPool.ts";
import type { ItemDefinition } from "../src/domain/items/ItemDefinition.ts";

const item = (id: string): ItemDefinition => ({
  id,
  name: id,
  description: id,
  kind: "passive",
  maxLevel: 3,
  color: 0xffffff,
  passiveEffect: "armor",
});

test("drop selection ignores maxed or otherwise ineligible items", () => {
  const pool = [item("maxed"), item("available")];
  assert.equal(pickEligibleItem(pool, (entry) => entry.id !== "maxed", () => 0)?.id, "available");
});

test("drop selection is deterministic with an injected random source", () => {
  const pool = [item("first"), item("second"), item("third")];
  assert.equal(pickEligibleItem(pool, () => true, () => 0.99)?.id, "third");
});

test("drop selection returns nothing when the pool is exhausted", () => {
  assert.equal(pickEligibleItem([item("maxed")], () => false, () => 0.5), undefined);
});
