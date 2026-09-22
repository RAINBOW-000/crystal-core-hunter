import Phaser from "phaser";
import { FROST_TRAIL_BEAST } from "../../content/enemies/enemyCatalog";
import { Enemy } from "../Enemy";
import type { Player } from "../Player";
import type { StageDefinition } from "../../content/stages/stageCatalog";

export class FrostTrailBeast extends Enemy {
  private nextTrailAt = 0;
  constructor(scene: Phaser.Scene, x: number, y: number, private readonly createIce: (x: number, y: number) => void, modifiers?: StageDefinition["returningEnemyModifiers"]) {
    super(scene, x, y, FROST_TRAIL_BEAST, FROST_TRAIL_BEAST.hp, modifiers);
    this.enlargeVisual(25, 19, 3, 7);
  }
  updateBehavior(time: number, player: Player): void {
    if (!this.active || time < this.hurtUntil) return;
    const toPlayer = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y);
    const direction = toPlayer.normalize();
    const weave = Math.sin(time / 420) * 0.65;
    this.setVelocity(
      (direction.x - direction.y * weave) * this.moveSpeed,
      (direction.y + direction.x * weave) * this.moveSpeed,
    );
    if (time >= this.nextTrailAt) {
      this.nextTrailAt = time + this.scaleInterval(FROST_TRAIL_BEAST.trailCooldownMs);
      this.createIce(this.x, this.y);
    }
  }
}
