import type { UpgradeDefinition } from "../../domain/upgrades/UpgradeDefinition";

export const MINER_UPGRADES: readonly UpgradeDefinition[] = [
  {
    id: "miner-body",
    name: "矿工体魄",
    description: "最大生命 +20，并恢复 20 生命",
    tier: "incremental",
    tags: ["character"],
    maxRank: 5,
    effects: [{
      type: "characterStat", stat: "maxHp", operation: "add", value: 20, heal: 20,
    }],
  },
  {
    id: "magnetic-core",
    name: "晶核磁化",
    description: "晶核拾取范围 +25%",
    tier: "incremental",
    tags: ["utility"],
    maxRank: 4,
    effects: [{
      type: "characterStat", stat: "pickupRadius", operation: "multiply", value: 1.25,
    }],
  },
  {
    id: "light-boots",
    name: "轻装矿靴",
    description: "移动速度 +8%",
    tier: "incremental",
    tags: ["character"],
    maxRank: 5,
    effects: [{
      type: "characterStat", stat: "moveSpeed", operation: "multiply", value: 1.08,
    }],
  },
  {
    id: "hardened-plate",
    name: "硬化甲片",
    description: "护甲 +1",
    tier: "incremental",
    tags: ["character"],
    maxRank: 5,
    effects: [{ type: "characterStat", stat: "armor", operation: "add", value: 1 }],
  },
  {
    id: "crystal-temper",
    name: "晶能淬体",
    description: "所有武器伤害 +10%",
    tier: "incremental",
    tags: ["character"],
    maxRank: 6,
    effects: [{ type: "characterStat", stat: "damageMultiplier", operation: "multiply", value: 1.1 }],
  },
  {
    id: "resonant-nerves",
    name: "共振神经",
    description: "所有武器冷却 -7%",
    tier: "incremental",
    tags: ["character"],
    maxRank: 6,
    effects: [{ type: "characterStat", stat: "cooldownMultiplier", operation: "multiply", value: 0.93 }],
  },
];
