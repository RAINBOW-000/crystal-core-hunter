export type UpgradeTier = "incremental" | "major" | "evolution";
export type UpgradeTag = "character" | "weapon" | "item" | "utility";

export type UpgradeEffect =
  | {
      type: "weaponStat";
      weaponId: "greatsword";
      stat: "damage" | "range" | "cooldown";
      operation: "multiply";
      value: number;
    }
  | {
      type: "characterStat";
      stat: "maxHp";
      operation: "add";
      value: number;
      heal: number;
    }
  | {
      type: "characterStat";
      stat: "moveSpeed" | "pickupRadius";
      operation: "multiply";
      value: number;
    }
  | {
      type: "characterStat";
      stat: "damageMultiplier" | "cooldownMultiplier";
      operation: "multiply";
      value: number;
    }
  | {
      type: "characterStat";
      stat: "armor";
      operation: "add";
      value: number;
    };

export interface UpgradeAvailability {
  minimumLevel?: number;
  milestoneOnly?: boolean;
  requires?: ReadonlyArray<{ id: string; rank: number }>;
  excludes?: readonly string[];
}

export interface UpgradeDefinition {
  id: string;
  name: string;
  description: string;
  tier: UpgradeTier;
  tags: readonly UpgradeTag[];
  maxRank: number;
  availability?: UpgradeAvailability;
  effects: readonly UpgradeEffect[];
}

export interface UpgradeOffer {
  level: number;
  milestone: boolean;
  choices: readonly UpgradeDefinition[];
}
