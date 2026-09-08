import Phaser from "phaser";
import { ELITE_CRYSTAL_BUG } from "../../content/enemies/enemyCatalog";
import { Enemy } from "../Enemy";
import type { Player } from "../Player";

export class EliteCrystalBug extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number, reinforced = false) {
    super(scene, x, y, ELITE_CRYSTAL_BUG, reinforced ? ELITE_CRYSTAL_BUG.hp * 1.8 : ELITE_CRYSTAL_BUG.hp);
    this.setScale(reinforced ? 1.35 : 1.18);
    this.body!.setSize(25, 21).setOffset(4, 7);
    if (reinforced) this.setTint(0xffc66d);
  }

  updateBehavior(time: number, player: Player): void {
    if (!this.active || time < this.hurtUntil) return;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (distance <= ELITE_CRYSTAL_BUG.stopDistance) {
      this.setVelocity(0, 0);
      return;
    }
    const chase = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
    this.setVelocity(chase.x * ELITE_CRYSTAL_BUG.speed, chase.y * ELITE_CRYSTAL_BUG.speed);
  }
}
