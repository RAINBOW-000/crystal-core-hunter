import Phaser from "phaser";
import type { Enemy } from "../../entities/Enemy";
import type { Player } from "../../entities/Player";
import type { Weapon } from "../Weapon";
import type { WeaponRefinementStat } from "../../domain/weapons/WeaponProgression";
import type { CombatVfxSystem } from "../../systems/CombatVfxSystem";

export class CrystalCrossbow implements Weapon {
  readonly id = "crystal-crossbow" as const;
  combo = 0;
  hitCount = 0;
  level = 0;
  lastAttackAt = -1000;
  private attackSerial = 20000;
  private enabled = true;
  private shotCount = 0;
  private readonly skills = new Set<string>();
  private readonly evolutions = new Set<string>();
  private readonly marks = new WeakMap<Enemy, number>();
  private refinementPower = 1;
  private refinementFrequency = 1;
  private refinementScale = 1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly vfx: CombatVfxSystem,
  ) {}

  update(_time: number): void {}

  tryAttack(time: number, enemies: Phaser.Physics.Arcade.Group, onEnemyKilled: (enemy: Enemy) => void): void {
    const cooldown = (this.skills.has("crossbow-string") ? 310 : 430) * this.player.stats.cooldownMultiplier * this.refinementFrequency;
    if (!this.enabled || time - this.lastAttackAt < cooldown || this.player.isDodging(time)) return;
    this.lastAttackAt = time;
    this.player.playWeaponAttack(this.id, false);
    this.shotCount += 1;
    const charged = this.skills.has("crossbow-pressure") && this.shotCount % 5 === 0;
    const angles = [this.player.aimAngle];
    if (this.skills.has("crossbow-spread")) angles.push(this.player.aimAngle - 0.16, this.player.aimAngle + 0.16);
    if (charged) {
      angles.push(this.player.aimAngle - 0.32, this.player.aimAngle - 0.08, this.player.aimAngle + 0.08, this.player.aimAngle + 0.32);
    }
    angles.forEach((angle) => this.vfx.showCrossbowAim(this.player.x, this.player.y, angle, 480 * this.refinementScale, charged));
    this.scene.time.delayedCall(50, () => {
      if (!this.enabled) return;
      angles.forEach((angle, index) => this.fireRay(this.scene.time.now, angle, index === 0 ? 1 : 0.62, charged, enemies, onEnemyKilled));
    });
    if (charged && this.evolutions.has("rain")) {
      [125, 205].forEach((delay, volley) => this.scene.time.delayedCall(delay, () => {
        if (!this.enabled) return;
        [-0.18, 0, 0.18].forEach((offset, index) => this.fireRay(this.scene.time.now, this.player.aimAngle + offset, index === 1 ? 0.8 : 0.55, true, enemies, onEnemyKilled));
      }));
    }
  }

  freeze(): void { this.enabled = false; }

  applySkill(skillId: string): void {
    if (!this.skills.has(skillId)) { this.skills.add(skillId); this.level += 1; }
  }

  applyEvolution(routeId: string): void {
    this.evolutions.add(routeId);
    this.level += 1;
  }

  applyRefinement(stat: WeaponRefinementStat): void {
    if (stat === "power") this.refinementPower *= 1.12;
    if (stat === "frequency") this.refinementFrequency *= 0.93;
    if (stat === "scale") this.refinementScale *= 1.1;
    this.level += 1;
  }

  private fireRay(
    time: number,
    angle: number,
    damageScale: number,
    charged: boolean,
    enemies: Phaser.Physics.Arcade.Group,
    onEnemyKilled: (enemy: Enemy) => void,
  ): void {
    this.attackSerial += 1;
    const range = 480 * this.refinementScale;
    const targets = enemies.getChildren().map((child) => child as Enemy).filter((enemy) => {
      if (!enemy.active) return false;
      const enemyAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      return Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) <= range
        && Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - angle)) < 0.07;
    }).sort((a, b) => Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y)
      - Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y));

    const pierce = this.evolutions.has("prism") ? 4 : this.skills.has("crossbow-pierce") ? 2 : 1;
    const hitTargets = targets.slice(0, pierce);
    hitTargets.forEach((enemy) => {
      let damage = 1.35 * damageScale * this.player.stats.damageMultiplier * this.refinementPower;
      let marks = 0;
      if (this.skills.has("crossbow-mark")) {
        marks = (this.marks.get(enemy) ?? 0) + 1;
        this.marks.set(enemy, marks);
        damage *= 1 + Math.min(0.6, marks * 0.08);
      }
      const killed = enemy.receiveHit({ amount: damage, knockback: 150, attackId: this.attackSerial }, this.player.x, this.player.y, time);
      this.hitCount += 1;
      this.vfx.showCrossbowImpact(enemy.x, enemy.y, angle, charged);
      if (marks > 0) this.vfx.showCrossbowMark(enemy.x, enemy.y, marks);
      if (killed) { enemy.defeat(); onEnemyKilled(enemy); }
    });

    const length = hitTargets.length
      ? Phaser.Math.Distance.Between(this.player.x, this.player.y, hitTargets[hitTargets.length - 1].x, hitTargets[hitTargets.length - 1].y)
      : range;
    this.vfx.showCrossbowShot(this.player.x, this.player.y, angle, length, charged);

    if ((this.skills.has("crossbow-split") || this.evolutions.has("prism")) && targets.length > 0) {
      const origin = targets[0];
      const secondary = enemies.getChildren().map((child) => child as Enemy)
        .filter((enemy) => enemy.active && enemy !== origin && Phaser.Math.Distance.Between(origin.x, origin.y, enemy.x, enemy.y) < 105)
        .slice(0, this.evolutions.has("prism") ? 3 : 2);
      secondary.forEach((enemy) => {
        this.attackSerial += 1;
        const damage = 0.65 * damageScale * this.player.stats.damageMultiplier * this.refinementPower;
        const killed = enemy.receiveHit({ amount: damage, knockback: 80, attackId: this.attackSerial }, origin.x, origin.y, time);
        this.hitCount += 1;
        this.vfx.showCrossbowSplit(origin.x, origin.y, enemy.x, enemy.y);
        if (killed) { enemy.defeat(); onEnemyKilled(enemy); }
      });
    }
  }
}
