import Phaser from "phaser";
import type { DamageSpec } from "../combat/Damage";
import type { EnemyDefinition } from "../domain/enemies/EnemyDefinition";
import { preserveBodyAxis } from "../domain/enemies/preserveBodyAxis";
import type { Player } from "./Player";

export interface EnemyRuntimeModifiers {
  hp: number;
  damage: number;
  speed: number;
  actionInterval: number;
}

const DEFAULT_MODIFIERS: EnemyRuntimeModifiers = { hp: 1, damage: 1, speed: 1, actionInterval: 1 };
export const NORMAL_ENEMY_VISUAL_SCALE = 1.2;

export abstract class Enemy extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  readonly maxHp: number;
  lastHitAttack = -1;
  hurtUntil = 0;

  protected constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    readonly definition: EnemyDefinition,
    hp = definition.hp,
    readonly runtimeModifiers: EnemyRuntimeModifiers = DEFAULT_MODIFIERS,
  ) {
    super(scene, x, y, definition.texture);
    this.hp = hp * runtimeModifiers.hp;
    this.maxHp = this.hp;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(15).setBounce(0.2).setCollideWorldBounds(true);
  }

  get kind() { return this.definition.kind; }
  get contactDamage() { return this.definition.contactDamage * this.runtimeModifiers.damage; }
  get coreReward() { return this.definition.coreReward; }
  get moveSpeed() { return this.definition.speed * this.runtimeModifiers.speed; }
  scaleInterval(milliseconds: number): number { return milliseconds * this.runtimeModifiers.actionInterval; }

  protected enlargeVisual(bodyWidth: number, bodyHeight: number, offsetX: number, offsetY: number): void {
    const scale = NORMAL_ENEMY_VISUAL_SCALE;
    const body = this.body as Phaser.Physics.Arcade.Body;
    const x = preserveBodyAxis(this.width, bodyWidth, offsetX, scale);
    const y = preserveBodyAxis(this.height, bodyHeight, offsetY, scale);
    this.setScale(scale);
    body.updateBounds();
    body.setSize(x.size, y.size).setOffset(x.offset, y.offset);
    body.updateFromGameObject();
  }

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
