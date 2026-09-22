import Phaser from "phaser";
import { ROOM_BOUNDS } from "../config/gameConfig";
import type { Player } from "../entities/Player";

export class FrostHazardSystem {
  private patches: Array<{ zone: Phaser.GameObjects.Arc; touched: boolean; expiresAt: number }> = [];
  private iceCleats = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly onCold: (amount: number) => void,
    private readonly onDamage: (amount: number, x: number, y: number) => boolean,
  ) {}

  update(time: number): void {
    let onIce = false;
    this.patches = this.patches.filter((patch) => {
      if (time >= patch.expiresAt) { patch.zone.destroy(); return false; }
      const inside = Phaser.Math.Distance.Between(this.player.x, this.player.y, patch.zone.x, patch.zone.y) <= patch.zone.radius;
      if (inside) {
        onIce = true;
        if (!patch.touched) { patch.touched = true; this.onCold(1); }
      }
      return true;
    });
    this.player.setEnvironmentSpeedMultiplier(onIce && !this.iceCleats ? 0.78 : 1);
  }

  createIcePatch(x: number, y: number, radius = 42, durationMs = 7500): void {
    const zone = this.scene.add.circle(x, y, radius, 0x82dfff, 0.18)
      .setStrokeStyle(2, 0xbceeff, 0.55).setDepth(8);
    this.patches.push({ zone, touched: false, expiresAt: this.scene.time.now + durationMs });
  }

  callIce(x: number, y: number, delayMs = 720): void {
    const clampedX = Phaser.Math.Clamp(x, ROOM_BOUNDS.x + 20, ROOM_BOUNDS.x + ROOM_BOUNDS.width - 20);
    const clampedY = Phaser.Math.Clamp(y, ROOM_BOUNDS.y + 20, ROOM_BOUNDS.y + ROOM_BOUNDS.height - 20);
    const warning = this.scene.add.circle(clampedX, clampedY, 36, 0x9ce8ff, 0.12)
      .setStrokeStyle(3, 0xd8f7ff, 0.9).setDepth(35);
    this.scene.tweens.add({ targets: warning, alpha: 0.62, scale: { from: 1.25, to: 0.9 }, duration: delayMs, onComplete: () => {
      warning.destroy();
      const impact = this.scene.add.star(clampedX, clampedY, 6, 8, 9, 0xd9f7ff, 0.9).setDepth(36);
      this.scene.tweens.add({ targets: impact, alpha: 0, scale: 1.5, duration: 280, onComplete: () => impact.destroy() });
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, clampedX, clampedY) <= 32) {
        if (this.onDamage(10, clampedX, clampedY)) this.onCold(2);
      }
      this.createIcePatch(clampedX, clampedY, 34, 6000);
    } });
  }

  freeze(): void { this.player.setEnvironmentSpeedMultiplier(1); }
  setIceCleats(enabled: boolean): void { this.iceCleats = enabled; }
}
