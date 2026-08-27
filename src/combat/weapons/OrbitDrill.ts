import Phaser from "phaser";
import type { Enemy } from "../../entities/Enemy";
import type { Player } from "../../entities/Player";
import type { Weapon } from "../Weapon";
import type { WeaponRefinementStat } from "../../domain/weapons/WeaponProgression";

export class OrbitDrill implements Weapon {
  readonly id = "orbit-drill" as const;
  combo = 0;
  hitCount = 0;
  level = 1;
  lastAttackAt = -1000;
  private enabled = true;
  private attackSerial = 40000;
  private angle = 0;
  private readonly skills = new Set<string>();
  private readonly evolutions = new Set<string>();
  private readonly drillSprites: Phaser.GameObjects.Triangle[] = [];
  private refinementPower = 1;
  private refinementFrequency = 1;
  private refinementScale = 1;

  constructor(private readonly scene: Phaser.Scene, private readonly player: Player) {
    this.syncDrills();
  }

  update(time: number): void {
    this.angle = time * (this.evolutions.has("planet") ? 0.0032 : 0.0024) / this.refinementFrequency;
    this.syncDrills();
    const radius = this.getRadius();
    this.drillSprites.forEach((drill, index) => {
      const angle = this.angle + index * Phaser.Math.PI2 / this.drillSprites.length;
      drill.setPosition(this.player.x + Math.cos(angle) * radius, this.player.y + Math.sin(angle) * radius)
        .setRotation(angle + Math.PI / 2);
    });
  }

  tryAttack(time: number, enemies: Phaser.Physics.Arcade.Group, onEnemyKilled: (enemy: Enemy) => void): void {
    if (!this.enabled || time - this.lastAttackAt < 170 * this.player.stats.cooldownMultiplier * this.refinementFrequency) return;
    this.lastAttackAt = time;
    this.attackSerial += 1;
    const hitRadius = this.skills.has("drill-orbit") ? 30 : 17;
    this.drillSprites.forEach((drill) => {
      enemies.getChildren().forEach((child) => {
        const enemy = child as Enemy;
        if (!enemy.active || Phaser.Math.Distance.Between(drill.x, drill.y, enemy.x, enemy.y) > hitRadius + 14) return;
        const damage = (this.skills.has("drill-armor") ? 0.9 : 0.7) * this.player.stats.damageMultiplier * this.refinementPower;
        const killed = enemy.receiveHit({ amount: damage, knockback: 95, attackId: this.attackSerial }, this.player.x, this.player.y, time);
        this.hitCount += 1;
        if (killed) { enemy.defeat(); onEnemyKilled(enemy); }
      });
    });
    if (this.skills.has("drill-launch") && Math.floor(time / 1400) !== Math.floor((time - 170) / 1400)) {
      this.launchStrike(time, enemies, onEnemyKilled);
    }
  }

  freeze(): void {
    this.enabled = false;
    this.drillSprites.forEach((sprite) => sprite.setVisible(false));
  }

  applySkill(skillId: string): void {
    if (!this.skills.has(skillId)) { this.skills.add(skillId); this.level += 1; this.syncDrills(); }
  }

  applyEvolution(routeId: string): void {
    this.evolutions.add(routeId);
    this.level += 1;
    this.syncDrills();
  }

  applyRefinement(stat: WeaponRefinementStat): void {
    if (stat === "power") this.refinementPower *= 1.12;
    if (stat === "frequency") this.refinementFrequency *= 0.93;
    if (stat === "scale") this.refinementScale *= 1.08;
    this.level += 1;
  }

  private getRadius(): number { return (this.skills.has("drill-orbit") ? 82 : 62) * this.refinementScale; }

  private syncDrills(): void {
    const desired = 2 + Number(this.skills.has("drill-extra")) + Number(this.evolutions.has("planet"));
    while (this.drillSprites.length < desired) {
      this.drillSprites.push(this.scene.add.triangle(0, 0, 0, 12, 7, -10, 14, 12, 0xe8d36f).setDepth(35));
    }
  }

  private launchStrike(time: number, enemies: Phaser.Physics.Arcade.Group, onEnemyKilled: (enemy: Enemy) => void): void {
    const target = enemies.getChildren().map((child) => child as Enemy)
      .filter((enemy) => enemy.active)
      .sort((a, b) => Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y)
        - Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y))[0];
    if (!target) return;
    this.attackSerial += 1;
    const damage = this.evolutions.has("delve") ? 4 : 2.4;
    const killed = target.receiveHit({ amount: damage, knockback: 360, attackId: this.attackSerial }, this.player.x, this.player.y, time);
    if (killed) { target.defeat(); onEnemyKilled(target); }
    const line = this.scene.add.line(0, 0, this.player.x, this.player.y, target.x, target.y, 0xffd76b, 0.8).setOrigin(0).setDepth(38);
    this.scene.tweens.add({ targets: line, alpha: 0, duration: 180, onComplete: () => line.destroy() });
    if (this.skills.has("drill-explode")) {
      const blast = this.scene.add.circle(target.x, target.y, 48, 0xff8a62, 0.22).setDepth(37);
      this.scene.tweens.add({ targets: blast, alpha: 0, scale: 1.3, duration: 260, onComplete: () => blast.destroy() });
    }
  }
}
