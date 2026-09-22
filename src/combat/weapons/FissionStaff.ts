import Phaser from "phaser";
import type { Enemy } from "../../entities/Enemy";
import type { Player } from "../../entities/Player";
import type { Weapon } from "../Weapon";
import type { WeaponRefinementStat } from "../../domain/weapons/WeaponProgression";
import type { CombatVfxSystem } from "../../systems/CombatVfxSystem";

export class FissionStaff implements Weapon {
  readonly id = "fission-staff" as const;
  combo = 0;
  hitCount = 0;
  level = 0;
  lastAttackAt = -1000;
  private enabled = true;
  private attackSerial = 60000;
  private castCount = 0;
  private readonly skills = new Set<string>();
  private readonly evolutions = new Set<string>();
  private readonly activeSeeds: Phaser.Math.Vector2[] = [];
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
    if (!this.enabled || time - this.lastAttackAt < 820 * this.player.stats.cooldownMultiplier * this.refinementFrequency) return;
    const targets = enemies.getChildren().map((child) => child as Enemy).filter((enemy) => {
      if (!enemy.active) return false;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      return distance <= 520 && Math.abs(Phaser.Math.Angle.Wrap(angle - this.player.aimAngle)) <= 0.5;
    }).sort((a, b) => {
      const angleA = Math.abs(Phaser.Math.Angle.Wrap(Phaser.Math.Angle.Between(this.player.x, this.player.y, a.x, a.y) - this.player.aimAngle));
      const angleB = Math.abs(Phaser.Math.Angle.Wrap(Phaser.Math.Angle.Between(this.player.x, this.player.y, b.x, b.y) - this.player.aimAngle));
      return angleA - angleB || Phaser.Math.Distance.Between(this.player.x, this.player.y, a.x, a.y)
        - Phaser.Math.Distance.Between(this.player.x, this.player.y, b.x, b.y);
    });
    const target = targets[0];
    if (!target) return;
    this.lastAttackAt = time;
    this.player.playWeaponAttack(this.id, false);
    this.castCount += 1;
    const overload = this.skills.has("staff-overload") && this.castCount % 3 === 0;
    this.hitTarget(target, overload ? 4.2 : 2.1, time, onEnemyKilled);
    this.vfx.showStaffBolt(this.player.x, this.player.y, target.x, target.y, overload);

    if (this.skills.has("staff-split") || this.evolutions.has("critical")) {
      const hit = new Set<Enemy>([target]);
      const splitTargets = targets.slice(1, this.evolutions.has("critical") ? 4 : 3).filter((enemy) => Phaser.Math.Distance.Between(target.x, target.y, enemy.x, enemy.y) < 150);
      splitTargets.forEach((enemy) => {
        hit.add(enemy);
        this.hitTarget(enemy, 0.9, time, onEnemyKilled);
        this.vfx.showStaffChain(target.x, target.y, enemy.x, enemy.y, false);
      });
      if (this.skills.has("staff-conduct")) splitTargets.forEach((source) => {
        const next = targets.find((enemy) => !hit.has(enemy) && enemy.active && Phaser.Math.Distance.Between(source.x, source.y, enemy.x, enemy.y) < 130);
        if (!next) return;
        hit.add(next);
        this.hitTarget(next, 0.65, time, onEnemyKilled);
        this.vfx.showStaffChain(source.x, source.y, next.x, next.y, true);
      });
    }
    if (overload && this.evolutions.has("critical")) targets.slice(1).forEach((enemy) => {
      if (enemy.active && Phaser.Math.Distance.Between(target.x, target.y, enemy.x, enemy.y) <= 58) {
        this.hitTarget(enemy, 1.4, time, onEnemyKilled);
      }
    });
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

  private createSeed(x: number, y: number, enemies: Phaser.Physics.Arcade.Group, onEnemyKilled: (enemy: Enemy) => void): void {
    const radius = (this.evolutions.has("domain") ? 78 : this.skills.has("staff-resonance") ? 58 : 42) * this.refinementScale;
    const domain = this.evolutions.has("domain");
    const point = new Phaser.Math.Vector2(x, y);
    if (domain) {
      const previous = this.activeSeeds[this.activeSeeds.length - 1];
      if (previous && Phaser.Math.Distance.BetweenPoints(previous, point) <= 240) this.vfx.showStaffDomainLink(previous.x, previous.y, x, y, 950);
      this.activeSeeds.push(point);
    }
    const pulseTimes = domain ? [300, 600, 900] : this.skills.has("staff-resonance") ? [350, 700] : [700];
    this.vfx.showStaffSeed(x, y, radius, pulseTimes[pulseTimes.length - 1]);
    pulseTimes.forEach((delay, index) => this.scene.time.delayedCall(delay, () => {
      const finalPulse = index === pulseTimes.length - 1;
      const damage = finalPulse && this.skills.has("staff-collapse") ? 1.8 : domain ? 0.55 : finalPulse ? 0.8 : 0.35;
      enemies.getChildren().forEach((child) => {
        const enemy = child as Enemy;
        if (enemy.active && Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) <= radius) {
          this.hitTarget(enemy, damage, this.scene.time.now, onEnemyKilled);
        }
      });
      this.vfx.showStaffSeedPulse(x, y, radius, finalPulse && this.skills.has("staff-collapse"));
      if (finalPulse && domain) {
        const seedIndex = this.activeSeeds.indexOf(point);
        if (seedIndex >= 0) this.activeSeeds.splice(seedIndex, 1);
      }
    }));
  }
}
