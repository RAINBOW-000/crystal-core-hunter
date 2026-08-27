import assert from "node:assert/strict";
import test from "node:test";
import { describeItemLevelEffect, getActiveItemEffectStats } from "../src/domain/items/ItemEffectScaling.ts";

test("active item scaling is shared by combat and reward previews", () => {
  assert.deepEqual(getActiveItemEffectStats("crystalBomb", 2), { radius: 106, damage: 10, knockback: 330 });
  assert.deepEqual(getActiveItemEffectStats("prismShield", 3), { durationMs: 2400 });
});

test("passive preview reports cumulative level effect", () => {
  assert.equal(describeItemLevelEffect({
    id: "armor", name: "Armor", description: "", kind: "passive", maxLevel: 3,
    color: 0, passiveEffect: "armor",
  }, 2), "护甲 +2");
});
