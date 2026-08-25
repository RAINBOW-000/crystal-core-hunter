import Phaser from "phaser";
import type { Enemy } from "../../entities/Enemy";
import type { Player } from "../../entities/Player";
import type { Weapon } from "../Weapon";
import type { WeaponRefinementStat } from "../../domain/weapons/WeaponProgression";

export class FissionStaff implements Weapon {
  readonly id = "fission-staff" as const;
  combo = 0;
  hitCount = 0;
  level = 1;
  lastAttackAt = -1000;
  private enabled = true;
  private attackSerial = 60000;
  private castCount = 0;
  private readonly skills = new Set<string>();
  private readonly evolutions = new Set<string>();
  private refinementPower = 1;
  private refinementFrequency = 1;
  private refinementScale = 1;

  constructor(private readonly scene: Phaser.Scene, private readonly player: Player) {}
  update(_time: number): void {}

  tryAttack(time: number, enemies: Phaser.Physics.Arcade.Group, onEnemyKilled: (enemy: Enemy) => void): void {
    if (!this.enabled || time - this.lastAttackAt < 820 * this.player.stats.cooldownMultiplier * this.refinementFrequency) return;
    const targets = enemies.getChildren().map((child) => child as Enemy).filter((enemy) => enemy.active)
      .sort((a, b) => Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y)
        - Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y));
    const target = targets[0];
    if (!target) return;
    this.lastAttackAt = time;
    this.castCount += 1;
    const overload = this.skills.has("staff-overload") && this.castCount % 3 === 0;
    this.hitTarget(target, overload ? 4.2 : 2.1, time, onEnemyKilled);
    this.showBolt(target.x, target.y, overload);

    if (this.skills.has("staff-split") || this.evolutions.has("critical")) {
      targets.slice(1, this.evolutions.has("critical") ? 4 : 3).forEach((enemy) => {
        if (Phaser.Math.Distance.Between(target.x, target.y, enemy.x, enemy.y) < 150) {
          this.hitTarget(enemy, 0.9, time, onEnemyKilled);
        }
      });
    }
    if (this.skills.has("staff-seed")) this.createSeed(target.x, target.y, enemies, onEnemyKilled);
  }

  freeze(): void { this.enabled = false; }
  applySkill(skillId: string): void { if (!this.skills.has(skillId)) { this.skills.add(skillId); this.level += 1; } }
  applyEvolution(routeId: string): void { this.evolutions.add(routeId); this.level += 1; }
  applyRefinement(stat: WeaponRefinementStat): void {
    if (stat === "power") this.refinementPower *= 1.12;
    if (stat === "frequency") this.refinementFrequency *= 0.93;
    if (stat === "scale") this.refinementScale *= 1.1;
    this.level += 1;
  }

  private hitTarget(enemy: Enemy, amount: number, time: number, onEnemyKilled: (enemy: Enemy) => void): void {
    this.attackSerial += 1;
    const killed = enemy.receiveHit({ amount: amount * this.player.stats.damageMultiplier * this.refinementPower, knockback: 130, attackId: this.attackSerial }, this.player.x, this.player.y, time);
    this.hitCount += 1;
    if (killed) { enemy.defeat(); onEnemyKilled(enemy); }
  }

  private showBolt(x: number, y: number, overload: boolean): void {
    const line = this.scene.add.line(0, 0, this.player.x, this.player.y, x, y, overload ? 0xff9cf2 : 0xd695ff, 0.85).setOrigin(0).setDepth(38);
    const burst = this.scene.add.circle(x, y, overload ? 38 : 16, 0xd695ff, 0.25).setDepth(37);
    this.scene.tweens.add({ targets: [line, burst], alpha: 0, duration: 180, onComplete: () => { line.destroy(); burst.destroy(); } });
  }

  private createSeed(x: number, y: number, enemies: Phaser.Physics.Arcade.Group, onEnemyKilled: (enemy: Enemy) => void): void {
    const radius = (this.evolutions.has("domain") ? 78 : this.skills.has("staff-resonance") ? 58 : 42) * this.refinementScale;
    const seed = this.scene.add.circle(x, y, radius, 0x88efcf, 0.14).setStrokeStyle(2, 0x88efcf, 0.6).setDepth(16);
    this.scene.time.delayedCall(700, () => {
      if (!seed.active) return;
      enemies.getChildren().forEach((child) => {
        const enemy = child as Enemy;
        if (enemy.active && Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= radius) {
          this.hitTarget(enemy, this.skills.has("staff-collapse") ? 1.8 : 0.8, this.scene.time.now, onEnemyKilled);
        }
      });
      seed.destroy();
    });
  }
}
