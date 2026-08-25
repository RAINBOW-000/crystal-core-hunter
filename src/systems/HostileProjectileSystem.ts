import Phaser from "phaser";
import type { Player } from "../entities/Player";

type HostileProjectile = Phaser.Physics.Arcade.Sprite & {
  damage: number;
  expiresAt: number;
};

export class HostileProjectileSystem {
  readonly group: Phaser.Physics.Arcade.Group;

  constructor(
    private readonly scene: Phaser.Scene,
    player: Player,
    private readonly onPlayerHit: (damage: number, x: number, y: number) => void,
  ) {
    this.group = scene.physics.add.group();
    scene.physics.add.overlap(player, this.group, this.onOverlap, undefined, this);
  }

  fire(x: number, y: number, velocityX: number, velocityY: number, damage: number, tint = 0xd986ff): void {
    const projectile = this.group.create(x, y, "hostile-shard") as HostileProjectile;
    projectile.damage = damage;
    projectile.expiresAt = this.scene.time.now + 6000;
    projectile.setTint(tint).setDepth(24).setVelocity(velocityX, velocityY);
    projectile.setRotation(Math.atan2(velocityY, velocityX) + Math.PI / 2);
  }

  update(time: number): void {
    this.group.getChildren().forEach((child) => {
      const projectile = child as HostileProjectile;
      if (!projectile.active) return;
      if (time >= projectile.expiresAt
        || projectile.x < -30 || projectile.x > 990
        || projectile.y < -30 || projectile.y > 570) projectile.destroy();
    });
  }

  freeze(): void {
    this.group.getChildren().forEach((child) => (child as HostileProjectile).setVelocity(0, 0));
  }

  private onOverlap(_player: unknown, projectileObject: unknown): void {
    const projectile = projectileObject as HostileProjectile;
    if (!projectile.active) return;
    const { damage, x, y } = projectile;
    projectile.destroy();
    this.onPlayerHit(damage, x, y);
  }
}
