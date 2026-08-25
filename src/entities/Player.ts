import Phaser from "phaser";
import type { CharacterDefinition, CharacterStats } from "../domain/characters/CharacterDefinition";
import { PLAYER_CONFIG } from "../config/gameConfig";

type PlayerKeys = Record<"up" | "down" | "left" | "right" | "dodge", Phaser.Input.Keyboard.Key>;

export type DamageOutcome = "ignored" | "damaged" | "dead";

export class Player extends Phaser.Physics.Arcade.Sprite {
  hp: number;
  readonly stats: CharacterStats;
  aimAngle = 0;
  dodgeSerial = 0;
  private readonly keys: PlayerKeys;
  private invulnerableUntil = 0;
  private dodgeReadyAt = 0;
  private dodgingUntil = 0;
  private dodgeDirection = new Phaser.Math.Vector2(1, 0);

  constructor(scene: Phaser.Scene, x: number, y: number, character: CharacterDefinition) {
    super(scene, x, y, "player");
    this.stats = { ...character.stats };
    this.hp = this.stats.maxHp;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true).setDepth(20);
    this.body!.setSize(16, 18).setOffset(4, 8);

    const keyboard = scene.input.keyboard!;
    this.keys = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      dodge: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };
  }

  updateController(time: number, pointer: Phaser.Input.Pointer, lastAttackAt: number): void {
    this.aimAngle = Phaser.Math.Angle.Between(this.x, this.y, pointer.worldX, pointer.worldY);
    this.setFlipX(Math.cos(this.aimAngle) < 0);

    const direction = new Phaser.Math.Vector2(
      Number(this.keys.right.isDown) - Number(this.keys.left.isDown),
      Number(this.keys.down.isDown) - Number(this.keys.up.isDown),
    ).normalize();

    if (Phaser.Input.Keyboard.JustDown(this.keys.dodge) && time >= this.dodgeReadyAt) {
      this.dodgeDirection = direction.lengthSq() > 0
        ? direction.clone()
        : new Phaser.Math.Vector2(Math.cos(this.aimAngle), Math.sin(this.aimAngle));
      this.dodgingUntil = time + PLAYER_CONFIG.dodgeDuration;
      this.dodgeSerial += 1;
      this.invulnerableUntil = time + PLAYER_CONFIG.dodgeInvulnerability;
      this.dodgeReadyAt = time + PLAYER_CONFIG.dodgeCooldown;
      this.setTint(0x86fff0);
      this.scene.time.delayedCall(PLAYER_CONFIG.dodgeInvulnerability, () => this.active && this.clearTint());
    }

    if (this.isDodging(time)) {
      this.setVelocity(
        this.dodgeDirection.x * PLAYER_CONFIG.dodgeSpeed,
        this.dodgeDirection.y * PLAYER_CONFIG.dodgeSpeed,
      );
      return;
    }

    const speed = time - lastAttackAt < PLAYER_CONFIG.attackSlowDuration
      ? PLAYER_CONFIG.attackMoveSpeed
      : this.stats.moveSpeed;
    this.setVelocity(direction.x * speed, direction.y * speed);
  }

  takeContactDamage(amount: number, sourceX: number, sourceY: number, time: number): DamageOutcome {
    if (time < this.invulnerableUntil) return "ignored";
    const finalDamage = Math.max(1, amount - this.stats.armor);
    this.hp = Math.max(0, this.hp - finalDamage);
    this.invulnerableUntil = time + PLAYER_CONFIG.contactInvulnerability;
    this.setTintFill(0xff6b6b);
    const away = new Phaser.Math.Vector2(this.x - sourceX, this.y - sourceY).normalize();
    this.setVelocity(away.x * 300, away.y * 300);
    this.scene.cameras.main.shake(100, 0.007);
    this.scene.time.delayedCall(110, () => this.active && this.clearTint());

    return this.hp > 0 ? "damaged" : "dead";
  }

  isDodging(time: number): boolean {
    return time < this.dodgingUntil;
  }

  getDodgeCooldown(time: number): number {
    return Math.max(0, this.dodgeReadyAt - time);
  }

  freeze(): void {
    this.setVelocity(0, 0);
  }

  increaseMaxHp(amount: number, heal = amount): void {
    this.stats.maxHp += amount;
    this.hp = Math.min(this.stats.maxHp, this.hp + heal);
  }

  multiplyMoveSpeed(multiplier: number): void {
    this.stats.moveSpeed *= multiplier;
  }

  multiplyPickupRadius(multiplier: number): void {
    this.stats.pickupRadius *= multiplier;
  }

  increaseArmor(amount: number): void {
    this.stats.armor += amount;
  }

  multiplyCooldown(multiplier: number): void {
    this.stats.cooldownMultiplier *= multiplier;
  }

  multiplyDamage(multiplier: number): void {
    this.stats.damageMultiplier *= multiplier;
  }

  heal(amount: number): void {
    this.hp = Math.min(this.stats.maxHp, this.hp + amount);
  }

  grantInvulnerability(until: number): void {
    this.invulnerableUntil = Math.max(this.invulnerableUntil, until);
    this.setTint(0x91b9ff);
    this.scene.time.delayedCall(Math.max(0, until - this.scene.time.now), () => this.active && this.clearTint());
  }

  configureCharacter(character: CharacterDefinition): void {
    Object.assign(this.stats, character.stats);
    this.hp = character.stats.maxHp;
    this.setTexture(character.texture).clearTint();
  }
}
