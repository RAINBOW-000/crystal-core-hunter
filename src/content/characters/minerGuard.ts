import type { CharacterDefinition } from "../../domain/characters/CharacterDefinition";

export const MINER_GUARD: CharacterDefinition = {
  id: "miner-guard",
  name: "矿卫",
  title: "地脉守望者",
  description: "高生命的近战角色，擅长用大剑控制敌群。",
  texture: "player",
  color: 0x6af0d5,
  stats: {
    maxHp: 120,
    moveSpeed: 185,
    armor: 1,
    damageMultiplier: 1,
    cooldownMultiplier: 1,
    pickupRadius: 120,
    luck: 0,
  },
  talentName: "铁壁本能",
  talentDescription: "生命低于50%时，受到的伤害降低30%。",
  talent: { type: "lowHealthGuard", threshold: 0.5, damageMultiplier: 0.7 },
};
