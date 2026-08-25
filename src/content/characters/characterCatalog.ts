import type { CharacterDefinition } from "../../domain/characters/CharacterDefinition";
import { MINER_GUARD } from "./minerGuard.ts";

export const CRYSTAL_HUNTER: CharacterDefinition = {
  id: "crystal-hunter",
  name: "晶猎",
  title: "废脉游侠",
  description: "生命较低，但移动、攻击和翻滚构筑能力更强。",
  texture: "player-hunter",
  color: 0xd39cff,
  stats: {
    maxHp: 90,
    moveSpeed: 205,
    armor: 0,
    damageMultiplier: 1.12,
    cooldownMultiplier: 0.94,
    pickupRadius: 105,
    luck: 0.02,
  },
  talentName: "猎杀节奏",
  talentDescription: "每次翻滚后，武器伤害提高30%，持续1.6秒。",
  talent: { type: "dodgeFury", damageMultiplier: 1.3, durationMs: 1600 },
};

export const LEYLINE_PROSPECTOR: CharacterDefinition = {
  id: "leyline-prospector",
  name: "探脉师",
  title: "晶矿勘探者",
  description: "擅长收集晶核和寻找稀有掉落，拥有稳定恢复能力。",
  texture: "player-prospector",
  color: 0xffc96b,
  stats: {
    maxHp: 105,
    moveSpeed: 182,
    armor: 0,
    damageMultiplier: 1,
    cooldownMultiplier: 0.98,
    pickupRadius: 165,
    luck: 0.08,
  },
  talentName: "晶核回流",
  talentDescription: "每收集8枚晶核，恢复5点生命。",
  talent: { type: "coreRegeneration", coresRequired: 8, healing: 5 },
};

export const CHARACTER_CATALOG: readonly CharacterDefinition[] = [
  MINER_GUARD,
  CRYSTAL_HUNTER,
  LEYLINE_PROSPECTOR,
];
