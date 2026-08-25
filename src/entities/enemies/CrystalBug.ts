import Phaser from "phaser";
import { CRYSTAL_BUG_CONFIG } from "../../config/gameConfig";
import { Enemy } from "../Enemy";
import type { Player } from "../Player";

export class CrystalBug extends Enemy {
  readonly kind = "normal" as const;
  readonly contactDamage = CRYSTAL_BUG_CONFIG.contactDamage;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, "crystal-bug", CRYSTAL_BUG_CONFIG.hp);
    this.body!.setSize(20, 16).setOffset(2, 6);
  }

  updateBehavior(time: number, player: Player): void {
    if (!this.active || time < this.hurtUntil) return;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (distance <= CRYSTAL_BUG_CONFIG.stopDistance) {
      this.setVelocity(0, 0);
      return;
    }
    const chase = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
    this.setVelocity(chase.x * CRYSTAL_BUG_CONFIG.speed, chase.y * CRYSTAL_BUG_CONFIG.speed);
  }
}
