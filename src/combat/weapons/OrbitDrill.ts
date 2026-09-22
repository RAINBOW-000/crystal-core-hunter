import Phaser from "phaser";
import type { Enemy } from "../../entities/Enemy";
import type { Player } from "../../entities/Player";
import type { Weapon } from "../Weapon";
import type { WeaponRefinementStat } from "../../domain/weapons/WeaponProgression";
import type { CombatVfxSystem } from "../../systems/CombatVfxSystem";

export class OrbitDrill implements Weapon {
  readonly id = "orbit-drill" as const;
  combo = 0;
  hitCount = 0;
  level = 0;
  lastAttackAt = -1000;
  private enabled = true;
  private attackSerial = 40000;
  private angle = 0;
  private lastLaunchAt = -Infinity;
  private readonly skills = new Set<string>();
  private readonly evolutions = new Set<string>();
  private readonly drillSprites: Phaser.GameObjects.Sprite[] = [];
  private refinementPower = 1;
  private refinementFrequency = 1;
  private refinementScale = 1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly vfx: CombatVfxSystem,
  ) {
    this.syncDrills();
  }

  update(time: number): void {
    const speed = this.skills.has("drill-bearing") ? 0.0034 : 0.0024;
    this.angle = time * speed / this.refinementFrequency;
    this.syncDrills();
    const radius = this.getRadius();
    this.drillSprites.forEach((drill, index) => {
      const evolved = this.evolutions.has("secondary");
      const outer = !evolved || index % 2 === 0;
      const count = evolved ? Math.ceil(this.drillSprites.length / 2) : this.drillSprites.length;
      const orbitIndex = evolved ? Math.floor(index / 2) : index;
      const angle = (outer ? this.angle : -this.angle) + orbitIndex * Phaser.Math.PI2 / count;
      const drillRadius = radius * (outer ? 1 : 0.65);
      drill.setPosition(this.player.x + Math.cos(angle) * drillRadius, this.player.y + Math.sin(angle) * drillRadius)
        .setRotation(angle);
    });
  }

  tryAttack(time: number, enemies: Phaser.Physics.Arcade.Group, onEnemyKilled: (enemy: Enemy) => void): void {
    const interval = this.skills.has("drill-bearing") ? 115 : 170;
    if (!this.enabled || time - this.lastAttackAt < interval * this.player.stats.cooldownMultiplier * this.refinementFrequency) return;
    this.lastAttackAt = time;
    this.attackSerial += 1;
    const hitRadius = this.evolutions.has("secondary") ? 24 : 17;
    this.drillSprites.forEach((drill) => {
      enemies.getChildren().forEach((child) => {
        const enemy = child as Enemy;
        if (!enemy.active || Phaser.Math.Distance.Between(drill.x, drill.y, enemy.x, enemy.y) > hitRadius + 14) return;
        const damage = (this.evolutions.has("secondary") ? 1.05 : this.skills.has("drill-bearing") ? 0.82 : 0.7) * this.player.stats.damageMultiplier * this.refinementPower;
        const killed = enemy.receiveHit({ amount: damage, knockback: 95, attackId: this.attackSerial }, this.player.x, this.player.y, time);
        this.hitCount += 1;
        this.vfx.showDrillContact(drill.x, drill.y, Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y));
        if (killed) { enemy.defeat(); onEnemyKilled(enemy); }
      });
    });
    if (this.skills.has("drill-return") && time - this.lastLaunchAt >= 1400 * this.refinementFrequency) {
      this.lastLaunchAt = time;
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

  private getRadius(): number { return 62 * this.refinementScale; }

  private syncDrills(): void {
    const desired = this.evolutions.has("secondary") ? 6 : 2 + Number(this.skills.has("drill-extra"));
    while (this.drillSprites.length < desired) {
      this.drillSprites.push(this.scene.add.sprite(0, 0, "secondary-weapons", 0).setScale(0.42).setDepth(35));
    }
    this.drillSprites.forEach((drill) => drill.setFrame(this.evolutions.has("secondary") ? 1 : 0).setScale(this.evolutions.has("secondary") ? 0.38 : 0.42));
  }

  private launchStrike(time: number, enemies: Phaser.Physics.Arcade.Group, onEnemyKilled: (enemy: Enemy) => void): void {
    const target = enemies.getChildren().map((child) => child as Enemy).filter((enemy) => enemy.active)
      .sort((a, b) => {
        const priority = { normal: 0, elite: 1, boss: 2 } as const;
        const difference = priority[b.kind] - priority[a.kind];
        if (difference) return difference;
        return Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y)
          - Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y);
      })[0];
    if (!target) return;
    const startX = this.player.x;
    const startY = this.player.y;
    const endX = target.x;
    const endY = target.y;
    const angle = Phaser.Math.Angle.Between(startX, startY, endX, endY);
    const launched = this.scene.add.sprite(startX, startY, "secondary-weapons", this.evolutions.has("secondary") ? 1 : 0)
      .setScale(0.48).setRotation(angle).setDepth(39);
    this.vfx.showDrillLaunch(startX, startY, endX, endY);
    this.scene.tweens.add({
      targets: launched,
      x: endX,
      y: endY,
      rotation: launched.rotation + Math.PI * 5,
      duration: 150,
      ease: "Quad.In",
      onComplete: () => {
        if (!this.enabled) { launched.destroy(); return; }
        this.hitEnemy(target, this.evolutions.has("secondary") ? 4 : 2.4, 360, this.scene.time.now, startX, startY, onEnemyKilled);
        this.vfx.showDrillBlast(endX, endY, this.evolutions.has("secondary"));
        enemies.getChildren().forEach((child) => {
          const enemy = child as Enemy;
          if (enemy.active && this.distanceToSegment(enemy.x, enemy.y, endX, endY, this.player.x, this.player.y) <= 22) {
            this.hitEnemy(enemy, 1.35, 120, this.scene.time.now, endX, endY, onEnemyKilled);
          }
        });
        this.scene.tweens.add({
          targets: launched,
          x: this.player.x,
          y: this.player.y,
          rotation: launched.rotation + Math.PI * 5,
          duration: 170,
          ease: "Quad.In",
          onComplete: () => launched.destroy(),
        });
      },
    });
  }

  private hitEnemy(enemy: Enemy, amount: number, knockback: number, time: number, sourceX: number, sourceY: number, onEnemyKilled: (enemy: Enemy) => void): void {
    if (!enemy.active) return;
    this.attackSerial += 1;
    const killed = enemy.receiveHit({ amount: amount * this.player.stats.damageMultiplier * this.refinementPower, knockback, attackId: this.attackSerial }, sourceX, sourceY, time);
    this.hitCount += 1;
    if (killed) { enemy.defeat(); onEnemyKilled(enemy); }
  }

  private distanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSquared = dx * dx + dy * dy || 1;
    const t = Phaser.Math.Clamp(((px - ax) * dx + (py - ay) * dy) / lengthSquared, 0, 1);
    return Phaser.Math.Distance.Between(px, py, ax + t * dx, ay + t * dy);
  }
}
