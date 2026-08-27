import Phaser from "phaser";
import { CRYSTAL_RAM_CONFIG } from "../../config/gameConfig";
import { Enemy } from "../Enemy";
import type { Player } from "../Player";
import { getEnemyCoreReward } from "../../domain/combat/EnemyCoreReward";

export class CrystalRam extends Enemy {
  readonly kind = "normal" as const;
  readonly contactDamage = CRYSTAL_RAM_CONFIG.contactDamage;
  readonly coreReward = getEnemyCoreReward("crystalRam");
  private nextChargeAt = 1500 + Math.random() * 1200;
  private telegraphUntil = 0;
  private chargeUntil = 0;
  private chargeDirection = new Phaser.Math.Vector2(1, 0);

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "crystal-ram", CRYSTAL_RAM_CONFIG.hp);
    this.body!.setSize(27, 24).setOffset(3, 6);
  }

  updateBehavior(time: number, player: Player): void {
    if (!this.active || time < this.hurtUntil) return;
    if (time < this.telegraphUntil) {
      this.setVelocity(0, 0).setTint(0xffcf70);
      return;
    }
    if (this.telegraphUntil > 0 && time >= this.telegraphUntil) {
      this.telegraphUntil = 0;
      this.chargeUntil = time + CRYSTAL_RAM_CONFIG.chargeMs;
      this.clearTint();
    }
    if (time < this.chargeUntil) {
      this.setVelocity(this.chargeDirection.x * CRYSTAL_RAM_CONFIG.chargeSpeed, this.chargeDirection.y * CRYSTAL_RAM_CONFIG.chargeSpeed);
      return;
    }

    const direction = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
    this.setVelocity(direction.x * CRYSTAL_RAM_CONFIG.speed, direction.y * CRYSTAL_RAM_CONFIG.speed);
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (time < this.nextChargeAt || distance > 310) return;
    this.chargeDirection = direction.clone();
    this.telegraphUntil = time + CRYSTAL_RAM_CONFIG.telegraphMs;
    this.nextChargeAt = time + CRYSTAL_RAM_CONFIG.chargeCooldownMs + CRYSTAL_RAM_CONFIG.telegraphMs;
  }
}
