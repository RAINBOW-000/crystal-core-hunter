import Phaser from "phaser";
import { CRYSTAL_SPITTER } from "../../content/enemies/enemyCatalog";
import { randomBetween, type RandomSource } from "../../domain/random/RunRandom";
import { Enemy } from "../Enemy";
import type { Player } from "../Player";

type FireProjectile = (x: number, y: number, velocityX: number, velocityY: number, damage: number, tint?: number) => void;

export class CrystalSpitter extends Enemy {
  private nextShotAt: number;
  private strafeSign: number;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    private readonly fireProjectile: FireProjectile,
    private readonly random: RandomSource = Math.random,
  ) {
    super(scene, x, y, CRYSTAL_SPITTER);
    this.nextShotAt = 900 + random() * 700;
    this.strafeSign = random() < 0.5 ? -1 : 1;
    this.body!.setSize(22, 20).setOffset(3, 5);
  }

  updateBehavior(time: number, player: Player): void {
    if (!this.active || time < this.hurtUntil) return;
    const toPlayer = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y);
    const distance = toPlayer.length();
    const direction = toPlayer.normalize();
    if (distance < CRYSTAL_SPITTER.preferredDistance - 45) {
      this.setVelocity(-direction.x * CRYSTAL_SPITTER.speed, -direction.y * CRYSTAL_SPITTER.speed);
    } else if (distance > CRYSTAL_SPITTER.preferredDistance + 55) {
      this.setVelocity(direction.x * CRYSTAL_SPITTER.speed, direction.y * CRYSTAL_SPITTER.speed);
    } else {
      this.setVelocity(-direction.y * CRYSTAL_SPITTER.speed * 0.55 * this.strafeSign, direction.x * CRYSTAL_SPITTER.speed * 0.55 * this.strafeSign);
    }
    if (time < this.nextShotAt || distance > 430) return;
    this.nextShotAt = time + CRYSTAL_SPITTER.shotCooldownMs + randomBetween(this.random, -180, 220);
    if (this.random() < 0.28) this.strafeSign *= -1;
    const velocity = direction.scale(CRYSTAL_SPITTER.projectileSpeed);
    this.fireProjectile(this.x, this.y, velocity.x, velocity.y, CRYSTAL_SPITTER.projectileDamage, 0xd986ff);
    this.setTintFill(0xf3c9ff);
    this.scene.time.delayedCall(90, () => this.active && this.clearTint());
  }
}
