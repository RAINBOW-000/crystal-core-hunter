import Phaser from "phaser";
import { CRYSTAL_RAM } from "../../content/enemies/enemyCatalog";
import type { RandomSource } from "../../domain/random/RunRandom";
import { Enemy } from "../Enemy";
import type { Player } from "../Player";

export class CrystalRam extends Enemy {
  private nextChargeAt: number;
  private telegraphUntil = 0;
  private chargeUntil = 0;
  private chargeDirection = new Phaser.Math.Vector2(1, 0);

  constructor(scene: Phaser.Scene, x: number, y: number, random: RandomSource = Math.random) {
    super(scene, x, y, CRYSTAL_RAM);
    this.nextChargeAt = 1500 + random() * 1200;
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
      this.chargeUntil = time + CRYSTAL_RAM.chargeMs;
      this.clearTint();
    }
    if (time < this.chargeUntil) {
      this.setVelocity(this.chargeDirection.x * CRYSTAL_RAM.chargeSpeed, this.chargeDirection.y * CRYSTAL_RAM.chargeSpeed);
      return;
    }

    const direction = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
    this.setVelocity(direction.x * CRYSTAL_RAM.speed, direction.y * CRYSTAL_RAM.speed);
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (time < this.nextChargeAt || distance > 310) return;
    this.chargeDirection = direction.clone();
    this.telegraphUntil = time + CRYSTAL_RAM.telegraphMs;
    this.nextChargeAt = time + CRYSTAL_RAM.chargeCooldownMs + CRYSTAL_RAM.telegraphMs;
  }
}
