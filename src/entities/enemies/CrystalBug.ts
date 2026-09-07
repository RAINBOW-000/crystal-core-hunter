import Phaser from "phaser";
import { CRYSTAL_BUG } from "../../content/enemies/enemyCatalog";
import { Enemy } from "../Enemy";
import type { Player } from "../Player";

export class CrystalBug extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, CRYSTAL_BUG);
    this.body!.setSize(20, 16).setOffset(2, 6);
  }

  updateBehavior(time: number, player: Player): void {
    if (!this.active || time < this.hurtUntil) return;
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (distance <= CRYSTAL_BUG.stopDistance) {
      this.setVelocity(0, 0);
      return;
    }
    const chase = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
    this.setVelocity(chase.x * CRYSTAL_BUG.speed, chase.y * CRYSTAL_BUG.speed);
  }
}
