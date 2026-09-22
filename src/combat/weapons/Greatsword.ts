import Phaser from "phaser";
import { GREATSWORD_CONFIG } from "../../config/gameConfig";
import type { Enemy } from "../../entities/Enemy";
import type { Player } from "../../entities/Player";
import type { DamageSpec } from "../Damage";
import type { Weapon } from "../Weapon";
import type { WeaponRefinementStat } from "../../domain/weapons/WeaponProgression";
import type { CombatVfxSystem } from "../../systems/CombatVfxSystem";

export class Greatsword implements Weapon {
  readonly id = "greatsword" as const;
  combo = 0;
  hitCount = 0;
  level = 0;
  lastAttackAt = -1000;
  private lastComboAt = -1000;
  private attackSerial = 0;
  private enabled = true;
  private damageMultiplier = 1;
  private rangeMultiplier = 1;
  private cooldownMultiplier = 1;
  private readonly skills = new Set<string>();
  private readonly evolutions = new Set<string>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly vfx: CombatVfxSystem,
  ) {}

  update(time: number): void {
    if (time - this.lastComboAt > GREATSWORD_CONFIG.comboWindow) this.combo = 0;
  }

  tryAttack(
    time: number,
    enemies: Phaser.Physics.Arcade.Group,
    onEnemyKilled: (enemy: Enemy) => void,
  ): void {
    if (
      !this.enabled
      || time - this.lastAttackAt < GREATSWORD_CONFIG.cooldown
        * this.player.stats.cooldownMultiplier
        * this.cooldownMultiplier
      || this.player.isDodging(time)
    ) return;

    this.combo = time - this.lastComboAt <= GREATSWORD_CONFIG.comboWindow ? (this.combo % 3) + 1 : 1;
    this.lastAttackAt = time;
    this.lastComboAt = time;
    this.attackSerial += 1;

    const finisher = this.combo === 3;
    const baseRange = finisher ? GREATSWORD_CONFIG.finisherRange : GREATSWORD_CONFIG.normalRange;
    const range = baseRange * this.rangeMultiplier;
    const halfArc = finisher ? GREATSWORD_CONFIG.finisherHalfArc : GREATSWORD_CONFIG.normalHalfArc;
    this.vfx.showSwordSlash(this.player.x, this.player.y, this.player.aimAngle, range, this.combo);
    this.player.playWeaponAttack(this.id, finisher);

    let hitSomething = false;

    enemies.getChildren().forEach((child) => {
      const enemy = child as Enemy;
      if (!enemy.active || enemy.lastHitAttack === this.attackSerial) return;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      const enemyAngle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      const angleDelta = Math.abs(Phaser.Math.Angle.Wrap(enemyAngle - this.player.aimAngle));
      if (distance > range || angleDelta > Phaser.Math.DegToRad(halfArc)) return;

      const spec: DamageSpec = {
        amount: (finisher ? GREATSWORD_CONFIG.finisherDamage : GREATSWORD_CONFIG.normalDamage)
          * this.player.stats.damageMultiplier
          * this.damageMultiplier,
        knockback: finisher ? GREATSWORD_CONFIG.finisherKnockback : GREATSWORD_CONFIG.normalKnockback,
        attackId: this.attackSerial,
      };
      const killed = enemy.receiveHit(spec, this.player.x, this.player.y, time);
      this.hitCount += 1;
      hitSomething = true;
      this.vfx.showHitBurst(enemy.x, enemy.y, enemyAngle, finisher);
      if (killed) {
        enemy.defeat();
        onEnemyKilled(enemy);
      }
    });

    if (hitSomething) this.vfx.commitImpact(finisher);

    if (finisher && this.skills.has("greatsword-wave")) {
      this.damageWave(time, enemies, onEnemyKilled);
    }
    if (finisher && this.skills.has("greatsword-fissure")) {
      this.damageFissure(time, enemies, onEnemyKilled);
    }
    if (this.skills.has("greatsword-stance")) this.player.grantInvulnerability(time + 150);
  }

  freeze(): void {
    this.enabled = false;
  }

  multiplyDamage(multiplier: number): void {
    this.damageMultiplier *= multiplier;
    this.level += 1;
  }

  multiplyRange(multiplier: number): void {
    this.rangeMultiplier *= multiplier;
    this.level += 1;
  }

  multiplyCooldown(multiplier: number): void {
    this.cooldownMultiplier *= multiplier;
    this.level += 1;
  }

  applySkill(skillId: string): void {
    if (this.skills.has(skillId)) return;
    this.skills.add(skillId);
    this.level += 1;
    if (skillId === "greatsword-chase") this.cooldownMultiplier *= 0.82;
    if (skillId === "greatsword-heavy") {
      this.damageMultiplier *= 1.32;
      this.rangeMultiplier *= 1.15;
    }
  }

  applyEvolution(routeId: string): void {
    this.evolutions.add(routeId);
    this.level += 1;
  }

  applyRefinement(stat: WeaponRefinementStat): void {
    if (stat === "power") this.multiplyDamage(1.12);
    if (stat === "frequency") this.multiplyCooldown(0.93);
    if (stat === "scale") this.multiplyRange(1.08);
  }

  private damageWave(
    time: number,
    enemies: Phaser.Physics.Arcade.Group,
    onEnemyKilled: (enemy: Enemy) => void,
  ): void {
    const range = this.evolutions.has("wind") ? 230 : 145;
    const halfArc = Phaser.Math.DegToRad(this.evolutions.has("wind") ? 30 : 20);
    this.attackSerial += 1;
    const attackId = this.attackSerial;
    enemies.getChildren().forEach((child) => {
      const enemy = child as Enemy;
      if (!enemy.active) return;
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (distance > range || Math.abs(Phaser.Math.Angle.Wrap(angle - this.player.aimAngle)) > halfArc) return;
      const killed = enemy.receiveHit({
        amount: 1.3 * this.player.stats.damageMultiplier * this.damageMultiplier,
        knockback: 260,
        attackId,
      }, this.player.x, this.player.y, time);
      if (killed) { enemy.defeat(); onEnemyKilled(enemy); }
    });
    const wave = this.scene.add.rectangle(
      this.player.x + Math.cos(this.player.aimAngle) * range * 0.5,
      this.player.y + Math.sin(this.player.aimAngle) * range * 0.5,
      range, this.evolutions.has("wind") ? 34 : 22, 0x78f3da, 0.28,
    ).setRotation(this.player.aimAngle).setDepth(39);
    this.scene.tweens.add({ targets: wave, alpha: 0, duration: 190, onComplete: () => wave.destroy() });

    if (this.skills.has("greatsword-echo")) {
      this.scene.time.delayedCall(180, () => {
        if (!this.player.active) return;
        this.damageWaveEcho(enemies, onEnemyKilled);
      });
    }
  }

  private damageWaveEcho(enemies: Phaser.Physics.Arcade.Group, onEnemyKilled: (enemy: Enemy) => void): void {
    this.attackSerial += 1;
    const time = this.scene.time.now;
    const range = this.evolutions.has("wind") ? 210 : 130;
    enemies.getChildren().forEach((child) => {
      const enemy = child as Enemy;
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (!enemy.active || Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y) > range
        || Math.abs(Phaser.Math.Angle.Wrap(angle - this.player.aimAngle)) > 0.35) return;
      const killed = enemy.receiveHit({ amount: 1, knockback: 180, attackId: this.attackSerial }, this.player.x, this.player.y, time);
      if (killed) { enemy.defeat(); onEnemyKilled(enemy); }
    });
  }

  private damageFissure(time: number, enemies: Phaser.Physics.Arcade.Group, onEnemyKilled: (enemy: Enemy) => void): void {
    const centerX = this.player.x + Math.cos(this.player.aimAngle) * 70;
    const centerY = this.player.y + Math.sin(this.player.aimAngle) * 70;
    const radius = this.evolutions.has("iron") ? 90 : 58;
    this.attackSerial += 1;
    enemies.getChildren().forEach((child) => {
      const enemy = child as Enemy;
      if (!enemy.active || Phaser.Math.Distance.Between(centerX, centerY, enemy.x, enemy.y) > radius) return;
      const killed = enemy.receiveHit({ amount: 1.5, knockback: 420, attackId: this.attackSerial }, centerX, centerY, time);
      if (killed) { enemy.defeat(); onEnemyKilled(enemy); }
    });
    const crack = this.scene.add.circle(centerX, centerY, radius, 0xffb85c, 0.16).setDepth(17);
    this.scene.tweens.add({ targets: crack, alpha: 0, scale: 1.2, duration: 350, onComplete: () => crack.destroy() });
  }

}
