import type Phaser from "phaser";
import type { WeaponId, WeaponRefinementStat } from "../domain/weapons/WeaponProgression";
import type { Enemy } from "../entities/Enemy";

export interface Weapon {
  readonly id: WeaponId;
  readonly level: number;
  readonly combo: number;
  readonly hitCount: number;
  readonly lastAttackAt: number;
  update(time: number): void;
  tryAttack(time: number, enemies: Phaser.Physics.Arcade.Group, onEnemyKilled: (enemy: Enemy) => void): void;
  applySkill(skillId: string): void;
  applyEvolution(routeId: string): void;
  applyRefinement(stat: WeaponRefinementStat): void;
  freeze(): void;
}
