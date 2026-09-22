import Phaser from "phaser";
import { CRYSTAL_RAM } from "../../content/enemies/enemyCatalog";
import type { RandomSource } from "../../domain/random/RunRandom";
import type { StageDefinition } from "../../content/stages/stageCatalog";
import { Enemy } from "../Enemy";
import type { Player } from "../Player";
import type { CombatVfxSystem } from "../../systems/CombatVfxSystem";

export class CrystalRam extends Enemy {
  private nextChargeAt: number;
  private telegraphUntil = 0;
  private chargeUntil = 0;
  private chargeDirection = new Phaser.Math.Vector2(1, 0);

  constructor(scene: Phaser.Scene, x: number, y: number, private readonly vfx: CombatVfxSystem, random: RandomSource = Math.random, modifiers?: StageDefinition["returningEnemyModifiers"]) {
    super(scene, x, y, CRYSTAL_RAM, CRYSTAL_RAM.hp, modifiers);
    this.nextChargeAt = 1500 + random() * 1200;
    this.enlargeVisual(27, 24, 3, 6);
  }

  updateBehavior(time: number, player: Player): void {
    if (!this.active || time < this.hurtUntil) return;
    if (time < this.telegraphUntil) {
      this.setVelocity(0, 0).setTint(0xffcf70);
      return;
    }
    if (this.telegraphUntil > 0 && time >= this.telegraphUntil) {
      this.telegraphUntil = 0;
      this.chargeUntil = time + this.scaleInterval(CRYSTAL_RAM.chargeMs);
      this.clearTint();
    }
    if (time < this.chargeUntil) {
      this.setVelocity(this.chargeDirection.x * CRYSTAL_RAM.chargeSpeed * this.runtimeModifiers.speed, this.chargeDirection.y * CRYSTAL_RAM.chargeSpeed * this.runtimeModifiers.speed);
      return;
    }

    const direction = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
    this.setVelocity(direction.x * this.moveSpeed, direction.y * this.moveSpeed);
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (time < this.nextChargeAt || distance > 310) return;
    this.chargeDirection = direction.clone();
    this.telegraphUntil = time + this.scaleInterval(CRYSTAL_RAM.telegraphMs);
    this.vfx.showBossChargeLane(this.x, this.y, this.chargeDirection.angle(), this.scaleInterval(CRYSTAL_RAM.telegraphMs));
    this.nextChargeAt = time + this.scaleInterval(CRYSTAL_RAM.chargeCooldownMs + CRYSTAL_RAM.telegraphMs);
  }
}
