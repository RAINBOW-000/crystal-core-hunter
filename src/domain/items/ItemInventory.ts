import type { ItemDefinition, ItemStack } from "./ItemDefinition";

export type ItemPickupResult =
  | { type: "acquired" | "upgraded"; stack: ItemStack }
  | { type: "needsReplacement"; item: ItemDefinition }
  | { type: "ineligible"; item: ItemDefinition };

/** Pure run-state model. Phaser views never own item levels or slot rules. */
export class ItemInventory {
  readonly activeSlots: Array<ItemStack | undefined> = [undefined, undefined];
  private readonly passiveItems = new Map<string, ItemStack>();
  private readonly evolutionItems = new Map<string, ItemStack>();

  acquire(item: ItemDefinition): ItemPickupResult {
    const owned = this.find(item.id);
    if (owned) {
      if (owned.level >= item.maxLevel) return { type: "ineligible", item };
      owned.level += 1;
      return { type: "upgraded", stack: owned };
    }

    if (item.kind === "active") {
      const emptyIndex = this.activeSlots.findIndex((slot) => slot === undefined);
      if (emptyIndex < 0) return { type: "needsReplacement", item };
      const stack = { definition: item, level: 1 };
      this.activeSlots[emptyIndex] = stack;
      return { type: "acquired", stack };
    }

    const stack = { definition: item, level: 1 };
    (item.kind === "passive" ? this.passiveItems : this.evolutionItems).set(item.id, stack);
    return { type: "acquired", stack };
  }

  replaceActive(slotIndex: number, item: ItemDefinition): ItemStack {
    if (item.kind !== "active" || slotIndex < 0 || slotIndex >= this.activeSlots.length) {
      throw new Error("Invalid active item replacement");
    }
    const stack = { definition: item, level: 1 };
    this.activeSlots[slotIndex] = stack;
    return stack;
  }

  find(id: string): ItemStack | undefined {
    return this.activeSlots.find((stack) => stack?.definition.id === id)
      ?? this.passiveItems.get(id)
      ?? this.evolutionItems.get(id);
  }

  canDrop(item: ItemDefinition): boolean {
    const owned = this.find(item.id);
    return !owned || owned.level < item.maxLevel;
  }

  get passiveStacks(): readonly ItemStack[] {
    return [...this.passiveItems.values()];
  }
}
