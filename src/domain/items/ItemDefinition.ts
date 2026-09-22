export type ItemKind = "active" | "passive" | "evolution";

export type ActiveEffect =
  | "crystalBomb"
  | "magneticPulse"
  | "regeneration"
  | "drillSwarm"
  | "prismShield"
  | "timeAnchor"
  | "thawPulse";

export type PassiveEffect =
  | "armor"
  | "pickupRadius"
  | "cooldown"
  | "maxHp"
  | "moveSpeed"
  | "damage"
  | "iceCleats"
  | "echoChip"
  | "coreBattery";

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
  minimumStage?: number;
}

export interface ItemStack {
  definition: ItemDefinition;
  level: number;
}
