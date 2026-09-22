import Phaser from "phaser";
import { CRYSTAL_HIVE_BOSS } from "../../content/enemies/enemyCatalog";
import { getBossPhase, type BossPhase } from "../../domain/combat/BossPhase";
import { Enemy } from "../Enemy";
import type { Player } from "../Player";
import type { StageDefinition } from "../../content/stages/stageCatalog";
import type { CombatVfxSystem } from "../../systems/CombatVfxSystem";

type FireProjectile = (x: number, y: number, velocityX: number, velocityY: number, damage: number, tint?: number) => void;

export class CrystalHiveBoss extends Enemy {
  private nextVolleyAt = 0;
  private nextChargeAt = 0;
  private chargeUntil = 0;
  private chargeTelegraphUntil = 0;
  private volleyChargeUntil = 0;
  private phaseTransitionUntil = 0;
  private chargeDirection = new Phaser.Math.Vector2(1, 0);
  private displayedPhase: BossPhase = 1;
  private pendingVolleyPhase: BossPhase = 1;
  private pendingVolleyOffset = 0;
  private pendingAimAngle = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly fireProjectile: FireProjectile,
    private readonly vfx: CombatVfxSystem,
    modifiers?: StageDefinition["returningEnemyModifiers"],
  ) {
    super(scene, x, y, CRYSTAL_HIVE_BOSS, CRYSTAL_HIVE_BOSS.hp, modifiers);
    this.body!.setSize(42, 37).setOffset(7, 10);
  }

  updateBehavior(time: number, player: Player): void {
    if (!this.active || time < this.hurtUntil) return;
    const phase = getBossPhase(this.hp, this.maxHp);
    if (phase !== this.displayedPhase) {
      this.displayedPhase = phase;
      this.phaseTransitionUntil = time + 650;
      this.volleyChargeUntil = 0;
      this.chargeTelegraphUntil = 0;
      this.chargeUntil = 0;
      this.nextVolleyAt = this.phaseTransitionUntil + 450;
      if (phase === 3) this.nextChargeAt = this.phaseTransitionUntil + 900;
      this.setVelocity(0, 0).setScale(0.82, 1.16);
      this.setTint(phase === 2 ? 0xffa76d : 0xff6f91);
      this.vfx.showBossPhaseTransition(this.x, this.y, phase);
      return;
    }

    if (this.phaseTransitionUntil > 0) {
      if (time < this.phaseTransitionUntil) {
        this.setVelocity(0, 0);
        return;
      }
      this.phaseTransitionUntil = 0;
      this.scene.tweens.add({ targets: this, scaleX: 1, scaleY: 1, duration: 170, ease: "Back.Out" });
    }

    if (this.volleyChargeUntil > 0) {
      if (time < this.volleyChargeUntil) {
        this.setVelocity(0, 0);
        return;
      }
      this.volleyChargeUntil = 0;
      this.fireRadialVolley(this.pendingVolleyPhase, this.pendingVolleyOffset);
      if (this.pendingVolleyPhase >= 2) this.fireAimedBurst(this.pendingAimAngle, this.pendingVolleyPhase);
      this.nextVolleyAt = time + this.scaleInterval(this.pendingVolleyPhase === 1 ? 2600 : this.pendingVolleyPhase === 2 ? 2050 : 1500);
      this.scene.tweens.add({ targets: this, scaleX: 1, scaleY: 1, duration: 130, ease: "Back.Out" });
      return;
    }

    if (this.chargeTelegraphUntil > 0) {
      if (time < this.chargeTelegraphUntil) {
        this.setVelocity(0, 0);
        return;
      }
      this.chargeTelegraphUntil = 0;
      this.chargeUntil = time + this.scaleInterval(720);
      this.nextChargeAt = time + this.scaleInterval(3200);
      this.setScale(1.18, 0.82);
    }

    if (time < this.chargeUntil) {
      this.setVelocity(this.chargeDirection.x * (210 + phase * 35), this.chargeDirection.y * (210 + phase * 35));
      return;
    }
    if (this.chargeUntil > 0) {
      this.chargeUntil = 0;
      this.scene.tweens.add({ targets: this, scaleX: 1, scaleY: 1, duration: 150, ease: "Back.Out" });
    }
    const chase = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
    if (phase === 3 && time >= this.nextChargeAt) {
      this.chargeDirection.copy(chase);
      const telegraphDuration = this.scaleInterval(520);
      this.chargeTelegraphUntil = time + telegraphDuration;
      this.setVelocity(0, 0).setScale(0.86, 1.12);
      this.vfx.showBossChargeLane(this.x, this.y, this.chargeDirection.angle(), telegraphDuration);
      return;
    }
    if (time >= this.nextVolleyAt) {
      const telegraphDuration = this.scaleInterval(520);
      this.pendingVolleyPhase = phase;
      this.pendingVolleyOffset = time * 0.0007;
      this.pendingAimAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      this.volleyChargeUntil = time + telegraphDuration;
      this.setVelocity(0, 0).setScale(0.9, 1.1);
      const count = 5 + phase * 3;
      const tint = phase === 3 ? 0xff6f91 : 0xd986ff;
      this.vfx.showBossRadialTelegraph(this.x, this.y, count, this.pendingVolleyOffset, telegraphDuration, tint);
      if (phase >= 2) this.vfx.showBossAimedTelegraph(this.x, this.y, this.pendingAimAngle, telegraphDuration, phase);
      return;
    }
    const surge = 0.82 + Math.sin(time / 480) * 0.22;
    this.setVelocity(chase.x * (this.moveSpeed + phase * 6) * surge, chase.y * (this.moveSpeed + phase * 6) * surge);
  }

  private fireRadialVolley(phase: BossPhase, offset: number): void {
    const count = 5 + phase * 3;
    const speed = 85 + phase * 24;
    const tint = phase === 3 ? 0xff6f91 : 0xd986ff;
    for (let index = 0; index < count; index += 1) {
      const angle = offset + index * Phaser.Math.PI2 / count;
      this.fireProjectile(
        this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        (CRYSTAL_HIVE_BOSS.projectileDamage + phase) * this.runtimeModifiers.damage, tint,
      );
    }
    this.vfx.showBossVolleyRelease(this.x, this.y, tint);
  }

  private fireAimedBurst(baseAngle: number, phase: BossPhase): void {
    const count = phase === 2 ? 3 : 5;
    for (let index = 0; index < count; index += 1) {
      const spread = (index - (count - 1) / 2) * 0.13;
      const angle = baseAngle + spread;
      const speed = 145 + phase * 18;
      this.fireProjectile(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed, (CRYSTAL_HIVE_BOSS.projectileDamage + 2) * this.runtimeModifiers.damage, 0xffa76d);
    }
  }
}
