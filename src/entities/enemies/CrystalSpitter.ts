import Phaser from "phaser";
import { CRYSTAL_SPITTER } from "../../content/enemies/enemyCatalog";
import { randomBetween, type RandomSource } from "../../domain/random/RunRandom";
import type { StageDefinition } from "../../content/stages/stageCatalog";
import type { CombatVfxSystem } from "../../systems/CombatVfxSystem";
import { Enemy, NORMAL_ENEMY_VISUAL_SCALE } from "../Enemy";
import type { Player } from "../Player";

type FireProjectile = (x: number, y: number, velocityX: number, velocityY: number, damage: number, tint?: number) => void;

export class CrystalSpitter extends Enemy {
  private nextShotAt: number;
  private strafeSign: number;
  private chargeUntil = 0;
  private readonly chargeDirection = new Phaser.Math.Vector2(1, 0);

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly fireProjectile: FireProjectile,
    private readonly vfx: CombatVfxSystem,
    private readonly random: RandomSource = Math.random,
    modifiers?: StageDefinition["returningEnemyModifiers"],
  ) {
    super(scene, x, y, CRYSTAL_SPITTER, CRYSTAL_SPITTER.hp, modifiers);
    this.nextShotAt = 900 + random() * 700;
    this.strafeSign = random() < 0.5 ? -1 : 1;
    this.enlargeVisual(22, 20, 3, 5);
  }

  updateBehavior(time: number, player: Player): void {
    if (!this.active || time < this.hurtUntil) return;
    const toPlayer = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y);
    const distance = toPlayer.length();
    const direction = toPlayer.normalize();
    if (this.chargeUntil > 0) {
      if (time < this.chargeUntil) {
        this.setVelocity(0, 0);
        return;
      }
      this.chargeUntil = 0;
      const velocity = this.chargeDirection.clone().scale(CRYSTAL_SPITTER.projectileSpeed);
      const angle = this.chargeDirection.angle();
      const originX = this.x + this.chargeDirection.x * 14;
      const originY = this.y + this.chargeDirection.y * 14;
      this.fireProjectile(originX, originY, velocity.x, velocity.y, CRYSTAL_SPITTER.projectileDamage * this.runtimeModifiers.damage, 0xd986ff);
      this.vfx.showSpitterMuzzle(originX, originY, angle);
      this.setTintFill(0xf3c9ff);
      this.scene.tweens.add({ targets: this, scaleX: NORMAL_ENEMY_VISUAL_SCALE, scaleY: NORMAL_ENEMY_VISUAL_SCALE, duration: 120, ease: "Back.Out" });
      this.scene.time.delayedCall(90, () => this.active && this.clearTint());
      this.nextShotAt = time + this.scaleInterval(CRYSTAL_SPITTER.shotCooldownMs + randomBetween(this.random, -180, 220));
      if (this.random() < 0.28) this.strafeSign *= -1;
      return;
    }
    if (distance < CRYSTAL_SPITTER.preferredDistance - 45) {
      this.setVelocity(-direction.x * this.moveSpeed, -direction.y * this.moveSpeed);
    } else if (distance > CRYSTAL_SPITTER.preferredDistance + 55) {
      this.setVelocity(direction.x * this.moveSpeed, direction.y * this.moveSpeed);
    } else {
      this.setVelocity(-direction.y * this.moveSpeed * 0.55 * this.strafeSign, direction.x * this.moveSpeed * 0.55 * this.strafeSign);
    }
    if (time < this.nextShotAt || distance > 430) return;
    this.chargeDirection.copy(direction);
    this.chargeUntil = time + this.scaleInterval(400);
    this.setVelocity(0, 0).setScale(NORMAL_ENEMY_VISUAL_SCALE * 1.06, NORMAL_ENEMY_VISUAL_SCALE * 0.92);
    this.scene.tweens.add({
      targets: this,
      scaleX: NORMAL_ENEMY_VISUAL_SCALE * 1.16,
      scaleY: NORMAL_ENEMY_VISUAL_SCALE * 0.84,
      duration: this.scaleInterval(400),
      ease: "Sine.In",
    });
    this.vfx.showSpitterCharge(this.x, this.y, this.chargeDirection.angle(), this.scaleInterval(400));
  }
}
