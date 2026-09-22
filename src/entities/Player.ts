import Phaser from "phaser";
import type { CharacterDefinition, CharacterStats } from "../domain/characters/CharacterDefinition";
import { PLAYER_CONFIG } from "../config/gameConfig";
import type { WeaponId } from "../domain/weapons/WeaponProgression";
import { resolveAimFacing, type Facing } from "./resolveAimFacing";

type PlayerKeys = Record<"up" | "down" | "left" | "right" | "dodge", Phaser.Input.Keyboard.Key>;

export type DamageOutcome = "ignored" | "damaged" | "dead";
const VISUAL_SCALE = 0.6;
const DIRECTIONS: readonly Facing[] = ["down", "left", "right", "up"];

const WEAPON_TEXTURES: Partial<Record<WeaponId, string>> = {
  greatsword: "greatsword-forms",
  "crystal-crossbow": "crystal-crossbow-forms",
  "fission-staff": "fission-staff-forms",
};

const EVOLUTION_COLUMNS: Partial<Record<WeaponId, Record<string, number>>> = {
  greatsword: { wind: 1, iron: 2 },
  "crystal-crossbow": { prism: 1, rain: 2 },
  "fission-staff": { critical: 1, domain: 2 },
};

export function getWeaponFrame(id: WeaponId, facing: Facing = "down", routeId?: string): number {
  return DIRECTIONS.indexOf(facing) * 3 + (routeId ? EVOLUTION_COLUMNS[id]?.[routeId] ?? 0 : 0);
}

export function createPrimaryWeaponVisual(scene: Phaser.Scene, id: WeaponId, routeId?: string): Phaser.GameObjects.Sprite {
  return scene.add.sprite(0, 0, WEAPON_TEXTURES[id] ?? "greatsword-forms", getWeaponFrame(id, "down", routeId));
}

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
  private environmentSpeedMultiplier = 1;
  private controlsLocked = false;
  private facing: Facing = "down";
  private directionalTexture = "miner-guard-directional";
  private readonly shadow: Phaser.GameObjects.Ellipse;
  private weaponVisual?: Phaser.GameObjects.Sprite;
  private weaponId?: WeaponId;
  private weaponRouteId?: string;
  private weaponAttackUntil = 0;
  private weaponAttackHeavy = false;
  private pointerInGame = true;

  constructor(scene: Phaser.Scene, x: number, y: number, character: CharacterDefinition) {
    super(scene, x, y, "player");
    this.stats = { ...character.stats };
    this.hp = this.stats.maxHp;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setCollideWorldBounds(true).setDepth(20);
    this.body!.setSize(24, 24).setOffset(12, 25);
    this.shadow = scene.add.ellipse(x, y + 27 * VISUAL_SCALE, 38 * VISUAL_SCALE, 12 * VISUAL_SCALE, 0x05070a, 0.34).setDepth(18).setVisible(false);
    this.ensureDirectionalAnimations();
    scene.input.on(Phaser.Input.Events.GAME_OUT, () => { this.pointerInGame = false; });
    scene.input.on(Phaser.Input.Events.GAME_OVER, () => { this.pointerInGame = true; });

    const keyboard = scene.input.keyboard!;
    this.keys = {
      up: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      down: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      left: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      right: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      dodge: keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
    };
  }

  updateController(time: number, pointer: Phaser.Input.Pointer, lastAttackAt: number, attackFacingDuration: number = PLAYER_CONFIG.attackSlowDuration): void {
    const aimX = pointer.worldX - this.x;
    const aimY = pointer.worldY - this.y;
    const hasAim = this.pointerInGame && aimX * aimX + aimY * aimY >= 16 * 16;
    if (hasAim) this.aimAngle = Math.atan2(aimY, aimX);

    if (this.controlsLocked) {
      this.setVelocity(0, 0);
      this.updatePresentation(false);
      return;
    }
    const direction = new Phaser.Math.Vector2(
      Number(this.keys.right.isDown) - Number(this.keys.left.isDown),
      Number(this.keys.down.isDown) - Number(this.keys.up.isDown),
    ).normalize();
    if (hasAim && !this.isDodging(time) && time - lastAttackAt >= attackFacingDuration) {
      this.facing = resolveAimFacing(this.facing, aimX, aimY);
    }

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
      this.updatePresentation(true);
      return;
    }

    const speed = time - lastAttackAt < PLAYER_CONFIG.attackSlowDuration
      ? PLAYER_CONFIG.attackMoveSpeed
      : this.stats.moveSpeed;
    this.setVelocity(direction.x * speed * this.environmentSpeedMultiplier, direction.y * speed * this.environmentSpeedMultiplier);
    this.updatePresentation(direction.lengthSq() > 0);
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
    this.updatePresentation(false);
  }

  setEnvironmentSpeedMultiplier(multiplier: number): void { this.environmentSpeedMultiplier = multiplier; }
  setControlsLocked(locked: boolean): void { this.controlsLocked = locked; if (locked) this.freeze(); }

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
    this.directionalTexture = {
      "miner-guard": "miner-guard-directional",
      "crystal-hunter": "crystal-hunter-directional",
      "leyline-prospector": "leyline-prospector-directional",
    }[character.id] ?? "miner-guard-directional";
    this.setTexture(this.directionalTexture, 0).setScale(VISUAL_SCALE);
    this.body!.setSize(24, 24).setOffset(20, 44);
    this.shadow.setVisible(true);
    this.clearTint();
  }

  setEquippedWeapon(id: WeaponId): void {
    this.weaponVisual?.destroy(true);
    this.weaponId = id;
    this.weaponRouteId = undefined;
    this.weaponVisual = createPrimaryWeaponVisual(this.scene, id).setPosition(this.x, this.y).setDepth(21).setScale(this.weaponScale(id));
    this.updatePresentation(false);
  }

  setWeaponEvolution(id: WeaponId, routeId: string): void {
    if (this.weaponId !== id || !this.weaponVisual) return;
    this.weaponRouteId = routeId;
    this.weaponVisual.setFrame(getWeaponFrame(id, this.facing, routeId)).setTintFill(0xffffff).setScale(this.weaponScale(id) * 1.45);
    this.scene.tweens.add({
      targets: this.weaponVisual,
      scale: this.weaponScale(id),
      duration: 320,
      ease: "Back.Out",
      onComplete: () => this.weaponVisual?.clearTint(),
    });
  }

  playWeaponAttack(id: WeaponId, heavy = false): void {
    if (id !== this.weaponId) return;
    this.weaponAttackUntil = this.scene.time.now + (heavy ? 210 : 140);
    this.weaponAttackHeavy = heavy;
  }

  private ensureDirectionalAnimations(): void {
    ["miner-guard-directional", "crystal-hunter-directional", "leyline-prospector-directional"].forEach((texture) => {
      DIRECTIONS.forEach((direction, row) => {
        const start = row * 6;
        const idleKey = `${texture}-${direction}-idle`;
        const walkKey = `${texture}-${direction}-walk`;
        if (!this.scene.anims.exists(idleKey)) this.scene.anims.create({ key: idleKey, frames: this.scene.anims.generateFrameNumbers(texture, { frames: [start, start + 1] }), frameRate: 3, repeat: -1 });
        if (!this.scene.anims.exists(walkKey)) this.scene.anims.create({ key: walkKey, frames: this.scene.anims.generateFrameNumbers(texture, { start: start + 2, end: start + 5 }), frameRate: 8, repeat: -1 });
      });
    });
  }

  private updatePresentation(moving: boolean): void {
    const time = this.scene.time.now;
    const attacking = time < this.weaponAttackUntil;
    const attackRatio = attacking ? 1 - (this.weaponAttackUntil - time) / (this.weaponAttackHeavy ? 210 : 140) : 0;
    const recoil = attacking ? Math.sin(attackRatio * Math.PI) : 0;
    this.shadow.setPosition(this.x, this.y + 29 * VISUAL_SCALE);
    this.play(`${this.directionalTexture}-${this.facing}-${moving ? "walk" : "idle"}`, true);
    this.setScale(VISUAL_SCALE * (1 + recoil * 0.04), VISUAL_SCALE * (1 - recoil * 0.04));
    if (!this.weaponVisual) return;
    const positions: Record<Facing, [number, number]> = {
      down: [11, 6], left: [-13, 1], right: [13, 1], up: [9, -2],
    };
    const greatswordPositions: Record<Facing, [number, number]> = {
      down: [26, 20], left: [-25, 13], right: [25, 13], up: [25, -18],
    };
    const [offsetX, offsetY] = (this.weaponId === "greatsword" ? greatswordPositions : positions)[this.facing];
    const idle = this.weaponId === "greatsword" ? Math.sin(time * 0.006) * 1.2 : this.weaponId === "fission-staff" ? Math.sin(time * 0.004) * 1.8 : Math.sin(time * 0.0025) * 0.45;
    const kickX = this.weaponId === "crystal-crossbow" ? -recoil * 5 : 0;
    const attackRotation = this.weaponId === "greatsword" ? recoil * (this.weaponAttackHeavy ? 0.42 : 0.28) : 0;
    this.weaponVisual
      .setFrame(getWeaponFrame(this.weaponId!, this.facing, this.weaponRouteId))
      .setPosition(this.x + offsetX * VISUAL_SCALE + kickX, this.y + offsetY * VISUAL_SCALE + idle - (this.weaponId === "fission-staff" ? recoil * 4 : 0))
      .setRotation(attackRotation)
      .setDepth(this.facing === "up" ? 19 : 21)
      .setAlpha(this.weaponRouteId ? 0.84 + Math.sin(time * 0.006) * 0.16 : 1)
      .setVisible(true);
  }

  private weaponScale(id: WeaponId): number {
    if (id === "greatsword") return 0.72;
    if (id === "crystal-crossbow") return 0.55;
    return 0.68;
  }
}
