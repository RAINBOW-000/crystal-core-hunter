import type { ItemDefinition } from "../../domain/items/ItemDefinition";

export const ITEM_CATALOG: readonly ItemDefinition[] = [
  {
    id: "crystal-bomb", name: "晶爆雷", kind: "active", maxLevel: 3, color: 0xffb45e,
    description: "投向鼠标位置，造成范围伤害。", activeEffect: "crystalBomb", cooldownMs: 8000,
    initiallyUnlocked: true,
  },
  {
    id: "magnetic-pulse", name: "磁力脉冲器", kind: "active", maxLevel: 3, color: 0x62ead4,
    description: "击退并伤害周围敌人。", activeEffect: "magneticPulse", cooldownMs: 11000,
    initiallyUnlocked: true,
  },
  {
    id: "regeneration-injector", name: "再生注射器", kind: "active", maxLevel: 3, color: 0x83e06f,
    description: "立刻恢复生命。", activeEffect: "regeneration", cooldownMs: 18000,
    initiallyUnlocked: true,
  },
  {
    id: "drill-swarm", name: "钻头蜂群", kind: "active", maxLevel: 3, color: 0xe5d26c,
    description: "释放一轮穿透钻头。", activeEffect: "drillSwarm", cooldownMs: 12000,
  },
  {
    id: "prism-shield", name: "折光屏障", kind: "active", maxLevel: 3, color: 0x91b9ff,
    description: "获得短时间防护。", activeEffect: "prismShield", cooldownMs: 16000,
  },
  {
    id: "time-anchor", name: "时滞锚", kind: "active", maxLevel: 3, color: 0xc69cff,
    description: "短暂迟滞全场敌人。", activeEffect: "timeAnchor", cooldownMs: 20000,
  },
  {
    id: "rough-armor", name: "粗炼背甲", kind: "passive", maxLevel: 3, color: 0xb7a189,
    description: "提高护甲。", passiveEffect: "armor", initiallyUnlocked: true,
  },
  {
    id: "magnetic-backpack", name: "磁芯背包", kind: "passive", maxLevel: 3, color: 0x67d8d4,
    description: "扩大晶核拾取范围。", passiveEffect: "pickupRadius", initiallyUnlocked: true,
  },
  {
    id: "resonance-reactor", name: "共振反应炉", kind: "passive", maxLevel: 3, color: 0xff9f68,
    description: "缩短武器冷却。", passiveEffect: "cooldown", initiallyUnlocked: true,
  },
  {
    id: "crystal-blood-pump", name: "晶化血泵", kind: "passive", maxLevel: 3, color: 0xec6f7d,
    description: "提高最大生命。", passiveEffect: "maxHp",
  },
  {
    id: "light-bearing", name: "轻质轴承", kind: "passive", maxLevel: 3, color: 0xebe0a4,
    description: "提高移动速度。", passiveEffect: "moveSpeed",
  },
  {
    id: "hunter-sight", name: "猎手目镜", kind: "passive", maxLevel: 3, color: 0xe9a4ff,
    description: "提高所有武器伤害。", passiveEffect: "damage",
  },
  { id: "thaw-pulse", name: "融霜脉冲", kind: "active", maxLevel: 3, color: 0xffb87a, description: "清除寒冷并震晕周围敌人。", activeEffect: "thawPulse", cooldownMs: 15000, minimumStage: 2 },
  { id: "ice-cleats", name: "冰行钉靴", kind: "passive", maxLevel: 3, color: 0xb7edff, description: "免疫冰面减速并提高移动速度。", passiveEffect: "iceCleats", minimumStage: 2 },
  { id: "echo-chip", name: "回响晶片", kind: "passive", maxLevel: 3, color: 0xd7b5ff, description: "每 10 次武器命中释放冲击波。", passiveEffect: "echoChip", minimumStage: 2 },
  { id: "core-battery", name: "晶核蓄电池", kind: "passive", maxLevel: 3, color: 0xffe58c, description: "每拾取 8 个晶核缩短主动道具冷却。", passiveEffect: "coreBattery", minimumStage: 2 },
  { id: "wind-crystal-blank", name: "风蚀晶胚", kind: "evolution", maxLevel: 1, color: 0x8cfff0, description: "荒铁大剑裂风路线进化材料。" },
  { id: "leyline-forge-core", name: "地脉锻芯", kind: "evolution", maxLevel: 1, color: 0xffbd6e, description: "荒铁大剑镇岳路线进化材料。" },
  { id: "prism-guide-rail", name: "棱穿导轨", kind: "evolution", maxLevel: 1, color: 0x78dfff, description: "晶核弩棱穿路线进化材料。" },
  { id: "hive-string-box", name: "蜂巢弦匣", kind: "evolution", maxLevel: 1, color: 0xffd66e, description: "晶核弩晶雨路线进化材料。" },
  { id: "star-orbit-axis", name: "星轨轴心", kind: "evolution", maxLevel: 1, color: 0xe8df82, description: "环轨钻头进化材料。" },
  { id: "resonance-core", name: "共振地核", kind: "evolution", maxLevel: 1, color: 0xff9d68, description: "地脉震荡器进化材料。" },
  { id: "solar-prism", name: "日耀棱镜", kind: "evolution", maxLevel: 1, color: 0xb9ecff, description: "折光卫星进化材料。" },
  { id: "critical-crystal-orb", name: "临界晶球", kind: "evolution", maxLevel: 1, color: 0xd99cff, description: "裂变法杖临界路线进化材料。" },
  { id: "leyline-staff-ring", name: "地脉法环", kind: "evolution", maxLevel: 1, color: 0x88efcf, description: "裂变法杖晶域路线进化材料。" },
];

export const INITIAL_ITEM_POOL = ITEM_CATALOG.filter((item) => item.initiallyUnlocked && item.kind !== "evolution");
export const EVOLUTION_ITEM_CATALOG = ITEM_CATALOG.filter((item) => item.kind === "evolution");
export const META_UNLOCKABLE_ITEMS = ITEM_CATALOG.filter((item) => item.kind !== "evolution" && !item.minimumStage);
export const DEFAULT_UNLOCKED_ITEM_IDS = INITIAL_ITEM_POOL.map((item) => item.id);
