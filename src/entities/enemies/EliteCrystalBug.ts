import Phaser from "phaser";
import { ELITE_BUG_CONFIG } from "../../config/gameConfig";
import { Enemy } from "../Enemy";
import type { Player } from "../Player";

export class EliteCrystalBug extends Enemy {
  readonly kind = "elite" as const;
  readonly contactDamage = ELITE_BUG_CONFIG.contactDamage;

  constructor(scene: Phaser.Scene, x: number, y: number, reinforced = false) {
    super(scene, x, y, "elite-crystal-bug", reinforced ? ELITE_BUG_CONFIG.hp * 1.8 : ELITE_BUG_CONFIG.hp);
    this.setScale(reinforced ? 1.35 : 1.18);
    this.body!.setSize(25, 21).setOffset(4, 7);
    if (reinforced) this.setTint(0xffc66d);
  }

  updateBehavior(time: number, player: Player): void {
    if (!this.active || time < this.hurtUntil) return;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (distance <= ELITE_BUG_CONFIG.stopDistance) {
      this.setVelocity(0, 0);
      return;
    }
    const chase = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
    this.setVelocity(chase.x * ELITE_BUG_CONFIG.speed, chase.y * ELITE_BUG_CONFIG.speed);
  }
}
