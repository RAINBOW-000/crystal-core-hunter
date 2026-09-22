import Phaser from "phaser";
import type { WeaponRefinementStat } from "../../domain/weapons/WeaponProgression";
import type { Enemy } from "../../entities/Enemy";
import type { Player } from "../../entities/Player";
import type { CombatVfxSystem } from "../../systems/CombatVfxSystem";
import type { Weapon } from "../Weapon";

export class SeismicResonator implements Weapon {
  readonly id = "seismic-resonator" as const;
  combo = 0;
  hitCount = 0;
  level = 0;
  lastAttackAt = -1000;
  private enabled = true;
  private attackSerial = 80000;
  private readonly skills = new Set<string>();
  private readonly evolutions = new Set<string>();
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
    const interval = (this.skills.has("seismic-deployment") ? 1650 : 2300) * this.player.stats.cooldownMultiplier * this.refinementFrequency;
    if (!this.enabled || time - this.lastAttackAt < interval) return;
    const targets = enemies.getChildren().map((child) => child as Enemy).filter((enemy) => enemy.active);
    const target = targets.sort((a, b) => this.nearbyCount(b, targets) - this.nearbyCount(a, targets))[0];
    if (!target) return;
    this.lastAttackAt = time;
    const evolved = this.evolutions.has("secondary");
    const centers = evolved
      ? [0, 1, 2].map((index) => ({ x: target.x + Math.cos(index * Phaser.Math.PI2 / 3) * 48, y: target.y + Math.sin(index * Phaser.Math.PI2 / 3) * 48 }))
      : [{ x: target.x, y: target.y }];
    centers.forEach((center, index) => this.deploy(center.x, center.y, index * 120, enemies, onEnemyKilled));
  }

  freeze(): void { this.enabled = false; }
  applySkill(skillId: string): void { if (!this.skills.has(skillId)) { this.skills.add(skillId); this.level += 1; } }
  applyEvolution(routeId: string): void { this.evolutions.add(routeId); this.level += 1; }
  applyRefinement(stat: WeaponRefinementStat): void {
    if (stat === "power") this.refinementPower *= 1.12;
    if (stat === "frequency") this.refinementFrequency *= 0.93;
    if (stat === "scale") this.refinementScale *= 1.08;
    this.level += 1;
  }

  private deploy(x: number, y: number, delay: number, enemies: Phaser.Physics.Arcade.Group, onEnemyKilled: (enemy: Enemy) => void): void {
    const radius = (this.skills.has("seismic-amplifier") ? 105 : 78) * this.refinementScale;
    const warning = this.skills.has("seismic-deployment") ? 250 : 380;
    this.scene.time.delayedCall(delay, () => {
      if (!this.enabled) return;
      const device = this.scene.add.sprite(x, y, "secondary-weapons", this.evolutions.has("secondary") ? 3 : 2)
        .setScale(0).setDepth(19);
      this.scene.tweens.add({ targets: device, scale: this.evolutions.has("secondary") ? 0.72 : 0.58, duration: 150, ease: "Back.Out" });
      this.vfx.showSeismicTelegraph(x, y, radius, warning);
      this.scene.time.delayedCall(warning, () => {
        if (!this.enabled) { device.destroy(); return; }
        this.pulse(x, y, radius, this.evolutions.has("secondary") ? 2.4 : 1.8, enemies, onEnemyKilled);
        this.scene.tweens.add({ targets: device, alpha: 0, scale: device.scale * 1.1, delay: 280, duration: 180, onComplete: () => device.destroy() });
        if (this.skills.has("seismic-aftershock")) this.scene.time.delayedCall(260, () => {
          if (this.enabled) this.pulse(x, y, radius * 0.82, 0.9, enemies, onEnemyKilled);
        });
      });
    });
  }

  private pulse(x: number, y: number, radius: number, damage: number, enemies: Phaser.Physics.Arcade.Group, onEnemyKilled: (enemy: Enemy) => void): void {
    this.attackSerial += 1;
    enemies.getChildren().forEach((child) => {
      const enemy = child as Enemy;
      if (!enemy.active || Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) > radius) return;
      const killed = enemy.receiveHit({ amount: damage * this.player.stats.damageMultiplier * this.refinementPower, knockback: 360, attackId: this.attackSerial }, x, y, this.scene.time.now);
      enemy.hurtUntil = Math.max(enemy.hurtUntil, this.scene.time.now + 280);
      this.hitCount += 1;
      if (killed) { enemy.defeat(); onEnemyKilled(enemy); }
    });
    this.vfx.showSeismicPulse(x, y, radius, this.evolutions.has("secondary"));
  }

  private nearbyCount(target: Enemy, enemies: readonly Enemy[]): number {
    return enemies.filter((enemy) => Phaser.Math.Distance.Between(target.x, target.y, enemy.x, enemy.y) <= 125).length;
  }
}
