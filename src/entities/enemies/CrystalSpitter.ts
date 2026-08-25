import Phaser from "phaser";
import { CRYSTAL_SPITTER_CONFIG } from "../../config/gameConfig";
import { Enemy } from "../Enemy";
import type { Player } from "../Player";

type FireProjectile = (x: number, y: number, velocityX: number, velocityY: number, damage: number, tint?: number) => void;

export class CrystalSpitter extends Enemy {
  readonly kind = "normal" as const;
  readonly contactDamage = CRYSTAL_SPITTER_CONFIG.contactDamage;
  private nextShotAt = 900 + Math.random() * 700;
  private strafeSign = Math.random() < 0.5 ? -1 : 1;

  constructor(scene: Phaser.Scene, x: number, y: number, private readonly fireProjectile: FireProjectile) {
    super(scene, x, y, "crystal-spitter", CRYSTAL_SPITTER_CONFIG.hp);
    this.body!.setSize(22, 20).setOffset(3, 5);
  }

  updateBehavior(time: number, player: Player): void {
    if (!this.active || time < this.hurtUntil) return;
    const toPlayer = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y);
    const distance = toPlayer.length();
    const direction = toPlayer.normalize();
    if (distance < CRYSTAL_SPITTER_CONFIG.preferredDistance - 45) {
      this.setVelocity(-direction.x * CRYSTAL_SPITTER_CONFIG.speed, -direction.y * CRYSTAL_SPITTER_CONFIG.speed);
    } else if (distance > CRYSTAL_SPITTER_CONFIG.preferredDistance + 55) {
      this.setVelocity(direction.x * CRYSTAL_SPITTER_CONFIG.speed, direction.y * CRYSTAL_SPITTER_CONFIG.speed);
    } else {
      this.setVelocity(-direction.y * CRYSTAL_SPITTER_CONFIG.speed * 0.55 * this.strafeSign, direction.x * CRYSTAL_SPITTER_CONFIG.speed * 0.55 * this.strafeSign);
    }
    if (time < this.nextShotAt || distance > 430) return;
    this.nextShotAt = time + CRYSTAL_SPITTER_CONFIG.shotCooldownMs + Phaser.Math.Between(-180, 220);
    if (Math.random() < 0.28) this.strafeSign *= -1;
    const velocity = direction.scale(CRYSTAL_SPITTER_CONFIG.projectileSpeed);
    this.fireProjectile(this.x, this.y, velocity.x, velocity.y, CRYSTAL_SPITTER_CONFIG.projectileDamage, 0xd986ff);
    this.setTintFill(0xf3c9ff);
    this.scene.time.delayedCall(90, () => this.active && this.clearTint());
  }
}
