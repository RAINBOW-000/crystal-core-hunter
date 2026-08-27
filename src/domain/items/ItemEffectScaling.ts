import type { ActiveEffect, ItemDefinition } from "./ItemDefinition";

export interface ActiveItemEffectStats {
  radius?: number;
  damage?: number;
  knockback?: number;
  healing?: number;
  durationMs?: number;
}

export function getActiveItemEffectStats(effect: ActiveEffect, level: number): ActiveItemEffectStats {
  const safeLevel = Math.max(1, level);
  if (effect === "crystalBomb") return { radius: 78 + safeLevel * 14, damage: 4 + safeLevel * 3, knockback: 330 };
  if (effect === "magneticPulse") return { radius: 135 + safeLevel * 20, damage: 1 + safeLevel, knockback: 520 };
  if (effect === "regeneration") return { healing: 22 + safeLevel * 13 };
  if (effect === "drillSwarm") return { radius: 105 + safeLevel * 12, damage: 3 + safeLevel * 2, knockback: 330 };
  if (effect === "prismShield") return { durationMs: 900 + safeLevel * 500 };
  return { radius: 260, durationMs: 800 + safeLevel * 350 };
}

export function describeItemLevelEffect(item: ItemDefinition, level: number): string {
  if (item.kind === "evolution") return "持有后满足对应路线的武器进化条件";
  if (item.activeEffect) {
    const stats = getActiveItemEffectStats(item.activeEffect, level);
    if (stats.healing) return `恢复 ${stats.healing} 生命`;
    if (item.activeEffect === "prismShield") return `无敌 ${(stats.durationMs! / 1000).toFixed(1)} 秒`;
    if (item.activeEffect === "timeAnchor") return `全场迟滞 ${(stats.durationMs! / 1000).toFixed(1)} 秒`;
    return `伤害 ${stats.damage} · 范围 ${stats.radius}`;
  }
  const valueByEffect = {
    armor: `护甲 +${level}`,
    pickupRadius: `拾取范围 ×${Math.pow(1.2, level).toFixed(2)}`,
    cooldown: `武器冷却 ×${Math.pow(0.92, level).toFixed(2)}`,
    maxHp: `最大生命 +${level * 15}`,
    moveSpeed: `移动速度 ×${Math.pow(1.06, level).toFixed(2)}`,
    damage: `武器伤害 ×${Math.pow(1.1, level).toFixed(2)}`,
  };
  return item.passiveEffect ? valueByEffect[item.passiveEffect] : item.description;
}
