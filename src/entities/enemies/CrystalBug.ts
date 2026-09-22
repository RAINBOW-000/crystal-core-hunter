import Phaser from "phaser";
import { CRYSTAL_BUG } from "../../content/enemies/enemyCatalog";
import { Enemy } from "../Enemy";
import type { Player } from "../Player";
import type { StageDefinition } from "../../content/stages/stageCatalog";

export class CrystalBug extends Enemy {
  constructor(scene: Phaser.Scene, x: number, y: number, modifiers?: StageDefinition["returningEnemyModifiers"]) {
    super(scene, x, y, CRYSTAL_BUG, CRYSTAL_BUG.hp, modifiers);
    this.enlargeVisual(20, 16, 2, 6);
  }

  updateBehavior(time: number, player: Player): void {
    if (!this.active || time < this.hurtUntil) return;
    const horizontalDistance = player.x - this.x;
    if (Math.abs(horizontalDistance) > 4) this.setFlipX(horizontalDistance > 0);
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
    if (distance <= CRYSTAL_BUG.stopDistance) {
      this.setVelocity(0, 0);
      return;
    }
    const chase = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
    this.setVelocity(chase.x * this.moveSpeed, chase.y * this.moveSpeed);
  }
}
