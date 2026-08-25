export type BossPhase = 1 | 2 | 3;

export function getBossPhase(hp: number, maxHp: number): BossPhase {
  const ratio = maxHp <= 0 ? 0 : Math.max(0, hp) / maxHp;
  if (ratio > 0.66) return 1;
  if (ratio > 0.33) return 2;
  return 3;
}
