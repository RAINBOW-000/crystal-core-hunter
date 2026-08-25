import Phaser from "phaser";
import { BOSS_CONFIG } from "../../config/gameConfig";
import { getBossPhase, type BossPhase } from "../../domain/combat/BossPhase";
import { Enemy } from "../Enemy";
import type { Player } from "../Player";

type FireProjectile = (x: number, y: number, velocityX: number, velocityY: number, damage: number, tint?: number) => void;

export class CrystalHiveBoss extends Enemy {
  readonly kind = "boss" as const;
  readonly contactDamage = BOSS_CONFIG.contactDamage;
  private nextVolleyAt = 0;
  private nextChargeAt = 0;
  private chargeUntil = 0;
  private chargeDirection = new Phaser.Math.Vector2(1, 0);
  private displayedPhase: BossPhase = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, private readonly fireProjectile: FireProjectile) {
    super(scene, x, y, "crystal-hive-boss", BOSS_CONFIG.hp);
    this.body!.setSize(42, 37).setOffset(7, 10);
  }

  updateBehavior(time: number, player: Player): void {
    if (!this.active || time < this.hurtUntil) return;
    const phase = getBossPhase(this.hp, this.maxHp);
    if (phase !== this.displayedPhase) {
      this.displayedPhase = phase;
      this.scene.cameras.main.shake(240, 0.008 + phase * 0.002);
      this.setTint(phase === 2 ? 0xffa76d : 0xff6f91);
    }

    if (time >= this.nextVolleyAt) {
      this.fireRadialVolley(phase);
      this.nextVolleyAt = time + (phase === 1 ? 2600 : phase === 2 ? 2050 : 1500);
      if (phase >= 2) this.fireAimedBurst(player, phase);
    }

    if (time < this.chargeUntil) {
      this.setVelocity(this.chargeDirection.x * (210 + phase * 35), this.chargeDirection.y * (210 + phase * 35));
      return;
    }
    const chase = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
    if (phase === 3 && time >= this.nextChargeAt) {
      this.chargeDirection = chase.clone();
      this.chargeUntil = time + 720;
      this.nextChargeAt = time + 3200;
      return;
    }
    const surge = 0.82 + Math.sin(time / 480) * 0.22;
    this.setVelocity(chase.x * (BOSS_CONFIG.speed + phase * 6) * surge, chase.y * (BOSS_CONFIG.speed + phase * 6) * surge);
  }

  private fireRadialVolley(phase: BossPhase): void {
    const count = 5 + phase * 3;
    const speed = 85 + phase * 24;
    const offset = this.scene.time.now * 0.0007;
    for (let index = 0; index < count; index += 1) {
      const angle = offset + index * Phaser.Math.PI2 / count;
      this.fireProjectile(
        this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed,
        BOSS_CONFIG.projectileDamage + phase, phase === 3 ? 0xff6f91 : 0xd986ff,
      );
    }
    const ring = this.scene.add.circle(this.x, this.y, 45, phase === 3 ? 0xff6f91 : 0xd986ff, 0.18).setDepth(20);
    this.scene.tweens.add({ targets: ring, scale: 1.8, alpha: 0, duration: 260, onComplete: () => ring.destroy() });
  }

  private fireAimedBurst(player: Player, phase: BossPhase): void {
    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const count = phase === 2 ? 3 : 5;
    for (let index = 0; index < count; index += 1) {
      const spread = (index - (count - 1) / 2) * 0.13;
      const angle = baseAngle + spread;
      const speed = 145 + phase * 18;
      this.fireProjectile(this.x, this.y, Math.cos(angle) * speed, Math.sin(angle) * speed, BOSS_CONFIG.projectileDamage + 2, 0xffa76d);
    }
  }
}
