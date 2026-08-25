import assert from "node:assert/strict";
import test from "node:test";
import { ItemInventory } from "../src/domain/items/ItemInventory.ts";
import type { ItemDefinition } from "../src/domain/items/ItemDefinition.ts";

const active = (id: string): ItemDefinition => ({
  id,
  name: id,
  description: id,
  kind: "active",
  maxLevel: 3,
  color: 0xffffff,
  activeEffect: "crystalBomb",
});

test("a new active item requires replacement only when both slots are full", () => {
  const inventory = new ItemInventory();
  inventory.acquire(active("first"));
  inventory.acquire(active("second"));

  const result = inventory.acquire(active("third"));
  assert.equal(result.type, "needsReplacement");
  assert.deepEqual(inventory.activeSlots.map((stack) => stack?.definition.id), ["first", "second"]);

  inventory.replaceActive(1, active("third"));
  assert.deepEqual(inventory.activeSlots.map((stack) => stack?.definition.id), ["first", "third"]);
});

test("discarding a pending active item keeps both existing slots", () => {
  const inventory = new ItemInventory();
  inventory.acquire(active("first"));
  inventory.acquire(active("second"));
  inventory.acquire(active("third"));

  assert.deepEqual(inventory.activeSlots.map((stack) => stack?.definition.id), ["first", "second"]);
});

test("an owned active item upgrades directly even when both slots are full", () => {
  const inventory = new ItemInventory();
  const first = active("first");
  inventory.acquire(first);
  inventory.acquire(active("second"));

  const result = inventory.acquire(first);
  assert.equal(result.type, "upgraded");
  assert.equal(inventory.activeSlots[0]?.level, 2);
});
