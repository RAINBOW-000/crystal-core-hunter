import Phaser from "phaser";
import { FROST_RIDGE_HUNTER } from "../../content/enemies/enemyCatalog";
import { Enemy } from "../Enemy";
import type { Player } from "../Player";
import type { StageDefinition } from "../../content/stages/stageCatalog";
import type { CombatVfxSystem } from "../../systems/CombatVfxSystem";

export class FrostRidgeHunter extends Enemy {
  private nextDashAt = 800;
  private dashUntil = 0;
  private dashDirection = new Phaser.Math.Vector2(1, 0);
  private nextTrailAt = 0;
  private dashesRemaining = 0;
  private dashTelegraphUntil = 0;
  constructor(scene: Phaser.Scene, x: number, y: number, private readonly createIce: (x: number, y: number) => void, private readonly vfx: CombatVfxSystem, modifiers?: StageDefinition["returningEnemyModifiers"]) {
    super(scene, x, y, FROST_RIDGE_HUNTER, FROST_RIDGE_HUNTER.hp, modifiers);
    this.body!.setSize(31, 25).setOffset(4, 7);
  }
  updateBehavior(time: number, player: Player): void {
    if (!this.active || time < this.hurtUntil) return;
    const direction = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y).normalize();
    if (time < this.dashTelegraphUntil) {
      this.setVelocity(0, 0).setTint(0xaeeeff);
      return;
    }
    if (this.dashTelegraphUntil > 0) {
      this.dashTelegraphUntil = 0;
      this.clearTint();
      this.dashesRemaining = 2;
      this.dashUntil = time + 420;
    }
    if (time < this.dashUntil) {
      this.setVelocity(this.dashDirection.x * FROST_RIDGE_HUNTER.dashSpeed, this.dashDirection.y * FROST_RIDGE_HUNTER.dashSpeed);
      if (time >= this.nextTrailAt) { this.createIce(this.x, this.y); this.nextTrailAt = time + 180; }
      return;
    }
    if (this.dashUntil > 0) {
      this.dashUntil = 0;
      if (this.dashesRemaining > 0) {
        this.dashesRemaining -= 1;
        this.dashDirection = direction.clone();
        this.dashUntil = time + 420;
        return;
      }
      for (let index = 0; index < 8; index += 1) {
        const angle = index * Phaser.Math.PI2 / 8;
        this.createIce(this.x + Math.cos(angle) * 58, this.y + Math.sin(angle) * 58);
      }
    }
    this.setVelocity(direction.x * this.moveSpeed, direction.y * this.moveSpeed);
    if (time >= this.nextDashAt) {
      this.dashDirection = direction.clone();
      this.dashTelegraphUntil = time + 360;
      this.vfx.showBossChargeLane(this.x, this.y, this.dashDirection.angle(), 360);
      this.nextDashAt = time + this.scaleInterval(FROST_RIDGE_HUNTER.dashCooldownMs);
    }
  }
}
