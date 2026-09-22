import Phaser from "phaser";
import { ICE_VEIN_CALLER } from "../../content/enemies/enemyCatalog";
import { Enemy } from "../Enemy";
import type { Player } from "../Player";
import type { StageDefinition } from "../../content/stages/stageCatalog";

export class IceVeinCaller extends Enemy {
  private nextCastAt = 1100;
  constructor(scene: Phaser.Scene, x: number, y: number, private readonly callIce: (x: number, y: number, delay?: number) => void, modifiers?: StageDefinition["returningEnemyModifiers"]) {
    super(scene, x, y, ICE_VEIN_CALLER, ICE_VEIN_CALLER.hp, modifiers);
    this.enlargeVisual(22, 25, 4, 4);
  }
  updateBehavior(time: number, player: Player): void {
    if (!this.active || time < this.hurtUntil) return;
    const direction = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y);
    const distance = direction.length();
    direction.normalize();
    const sign = distance < ICE_VEIN_CALLER.preferredDistance ? -1 : 1;
    this.setVelocity(direction.x * this.moveSpeed * sign, direction.y * this.moveSpeed * sign);
    if (time < this.nextCastAt || distance > 460) return;
    this.nextCastAt = time + this.scaleInterval(ICE_VEIN_CALLER.castCooldownMs);
    const perpendicular = new Phaser.Math.Vector2(-direction.y, direction.x);
    [-42, 0, 42].forEach((offset, index) => this.callIce(
      player.x + perpendicular.x * offset,
      player.y + perpendicular.y * offset,
      620 + index * 100,
    ));
  }
}
