import Phaser from "phaser";
import type { DamageSpec } from "../combat/Damage";
import type { EnemyCoreReward } from "../domain/combat/EnemyCoreReward";
import type { Player } from "./Player";

export type EnemyKind = "normal" | "elite" | "boss";

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  readonly maxHp: number;
  lastHitAttack = -1;
  hurtUntil = 0;

  protected constructor(scene: Phaser.Scene, x: number, y: number, texture: string, hp: number) {
    super(scene, x, y, texture);
    this.hp = hp;
    this.maxHp = hp;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(15).setBounce(0.2).setCollideWorldBounds(true);
  }

  abstract readonly kind: EnemyKind;
  abstract readonly contactDamage: number;
  abstract readonly coreReward: EnemyCoreReward;

  abstract updateBehavior(time: number, player: Player): void;

  receiveHit(spec: DamageSpec, sourceX: number, sourceY: number, time: number): boolean {
    if (!this.active || this.lastHitAttack === spec.attackId) return false;
    this.lastHitAttack = spec.attackId;
    this.hp -= spec.amount;
    this.hurtUntil = time + 150;
    const away = new Phaser.Math.Vector2(this.x - sourceX, this.y - sourceY).normalize();
    this.setVelocity(away.x * spec.knockback, away.y * spec.knockback).setTintFill(0xffffff);
    this.scene.time.delayedCall(75, () => this.active && this.clearTint());
    return this.hp <= 0;
  }

  defeat(): void {
    if (!this.active) return;
    this.disableBody(true, true);
  }
}
