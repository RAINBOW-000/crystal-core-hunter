import Phaser from "phaser";
import { ROOM_BOUNDS } from "../config/gameConfig";
import type { Player } from "../entities/Player";
import type { CombatVfxSystem } from "./CombatVfxSystem";

type HostileProjectile = Phaser.Physics.Arcade.Sprite & {
  damage: number;
  expiresAt: number;
  lastTrailAt: number;
  vfxTint: number;
};

export class HostileProjectileSystem {
  readonly group: Phaser.Physics.Arcade.Group;

  constructor(
    private readonly scene: Phaser.Scene,
    player: Player,
    private readonly onPlayerHit: (damage: number, x: number, y: number) => void,
    private readonly vfx: CombatVfxSystem,
  ) {
    this.group = scene.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      maxSize: 160,
      runChildUpdate: false,
    });
    scene.physics.add.overlap(player, this.group, this.onOverlap, undefined, this);
  }

  fire(x: number, y: number, velocityX: number, velocityY: number, damage: number, tint = 0xd986ff): void {
    const projectile = this.group.get(x, y, "hostile-shard") as HostileProjectile | null;
    if (!projectile) return;
    projectile.enableBody(true, x, y, true, true);
    projectile.damage = damage;
    projectile.expiresAt = this.scene.time.now + 6000;
    projectile.lastTrailAt = this.scene.time.now;
    projectile.vfxTint = tint;
    projectile.setAlpha(1).setScale(1).setTint(tint).setDepth(24).setVelocity(velocityX, velocityY);
    projectile.setRotation(Math.atan2(velocityY, velocityX) + Math.PI / 2);
  }

  update(time: number): void {
    this.group.getChildren().forEach((child) => {
      const projectile = child as HostileProjectile;
      if (!projectile.active) return;
      if (time - projectile.lastTrailAt >= 65) {
        projectile.lastTrailAt = time;
        this.vfx.showProjectileTrail(projectile.x, projectile.y, projectile.vfxTint);
      }
      if (time >= projectile.expiresAt
        || projectile.x < ROOM_BOUNDS.x - 60 || projectile.x > ROOM_BOUNDS.x + ROOM_BOUNDS.width + 60
        || projectile.y < ROOM_BOUNDS.y - 60 || projectile.y > ROOM_BOUNDS.y + ROOM_BOUNDS.height + 60) {
        this.vfx.showProjectileShatter(projectile.x, projectile.y, projectile.vfxTint, false);
        this.recycle(projectile);
      }
    });
  }

  freeze(): void {
    this.group.getChildren().forEach((child) => (child as HostileProjectile).setVelocity(0, 0));
  }

  private onOverlap(_player: unknown, projectileObject: unknown): void {
    const projectile = projectileObject as HostileProjectile;
    if (!projectile.active) return;
    const { damage, x, y } = projectile;
    this.vfx.showProjectileShatter(x, y, projectile.vfxTint, true);
    this.recycle(projectile);
    this.onPlayerHit(damage, x, y);
  }

  private recycle(projectile: HostileProjectile): void {
    projectile.disableBody(true, true);
  }
}
