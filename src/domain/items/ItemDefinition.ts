export type ItemKind = "active" | "passive" | "evolution";

export type ActiveEffect =
  | "crystalBomb"
  | "magneticPulse"
  | "regeneration"
  | "drillSwarm"
  | "prismShield"
  | "timeAnchor";

export type PassiveEffect =
  | "armor"
  | "pickupRadius"
  | "cooldown"
  | "maxHp"
  | "moveSpeed"
  | "damage";

export interface ItemDefinition {
  id: string;
  name: string;
  description: string;
  kind: ItemKind;
  maxLevel: number;
  color: number;
  activeEffect?: ActiveEffect;
  passiveEffect?: PassiveEffect;
  cooldownMs?: number;
  initiallyUnlocked?: boolean;
}

export interface ItemStack {
  definition: ItemDefinition;
  level: number;
}
