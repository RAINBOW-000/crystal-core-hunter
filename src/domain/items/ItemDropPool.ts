import type { ItemDefinition } from "./ItemDefinition";

/** Pure drop selection rule. Runtime systems only create the world object. */
export function pickEligibleItem(
  pool: readonly ItemDefinition[],
  isEligible: (item: ItemDefinition) => boolean,
  random: () => number = Math.random,
): ItemDefinition | undefined {
  const eligible = pool.filter(isEligible);
  if (eligible.length === 0) return undefined;
  const roll = Math.min(Math.max(random(), 0), 0.999999999);
  return eligible[Math.floor(roll * eligible.length)];
}
