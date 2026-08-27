import Phaser from "phaser";
import type { ItemInventory } from "../domain/items/ItemInventory";
import type { Enemy } from "../entities/Enemy";
import type { Player } from "../entities/Player";
import { ActiveItemCooldowns } from "../domain/items/ActiveItemCooldown";
import { getActiveItemEffectStats } from "../domain/items/ItemEffectScaling";
import type { ActiveEffect } from "../domain/items/ItemDefinition";

export interface ActiveItemSlotState {
  name: string;
  level: number;
  cooldownMs: number;
  remainingMs: number;
  ready: boolean;
}

interface ActiveItemCallbacks {
  onEnemyKilled: (enemy: Enemy) => void;
  onUsed: (message: string) => void;
}

export class ActiveItemSystem {
  private readonly keys: readonly Phaser.Input.Keyboard.Key[];
  private readonly cooldowns = new ActiveItemCooldowns();
  private attackSerial = 100000;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly inventory: ItemInventory,
    private readonly enemies: Phaser.Physics.Arcade.Group,
    private readonly callbacks: ActiveItemCallbacks,
  ) {
    this.keys = [
      scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Q),
      scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E),
    ];
  }

  update(time: number, pointer: Phaser.Input.Pointer): void {
    this.keys.forEach((key, slotIndex) => {
      if (!Phaser.Input.Keyboard.JustDown(key)) return;
      this.useSlot(slotIndex, time, pointer);
    });
  }

  useSlot(slotIndex: number, time: number, pointer: Phaser.Input.Pointer): boolean {
    const stack = this.inventory.activeSlots[slotIndex];
    if (!stack) {
      this.callbacks.onUsed(`${slotIndex === 0 ? "Q" : "E"} 槽尚未装备主动道具`);
      return false;
    }
    const cooldownState = this.cooldowns.getState(stack.definition.id, time);
    if (!cooldownState.ready) {
      this.callbacks.onUsed(`${stack.definition.name} 冷却中 · ${Math.ceil(cooldownState.remainingMs / 1000)}s`);
      return false;
    }
    this.cooldowns.trigger(stack.definition.id, time, stack.definition.cooldownMs ?? 10000);
    this.activate(stack.definition.activeEffect, stack.level, time, pointer);
    this.callbacks.onUsed(`释放：${stack.definition.name}`);
    return true;
  }

  getSlotStates(time: number): readonly (ActiveItemSlotState | undefined)[] {
    return this.inventory.activeSlots.map((stack) => {
      if (!stack) return undefined;
      const cooldownMs = stack.definition.cooldownMs ?? 10000;
      return {
        name: stack.definition.name,
        level: stack.level,
        cooldownMs,
        ...this.cooldowns.getState(stack.definition.id, time),
      };
    });
  }

  private activate(
    effect: ActiveEffect | undefined,
    level: number,
    time: number,
    pointer: Phaser.Input.Pointer,
  ): void {
    const stats = effect ? getActiveItemEffectStats(effect, level) : {};
    if (effect === "regeneration") {
      this.player.heal(stats.healing!);
      this.showRing(this.player.x, this.player.y, 55, 0x83e06f);
      return;
    }
    if (effect === "prismShield") {
      this.player.grantInvulnerability(time + stats.durationMs!);
      this.showRing(this.player.x, this.player.y, 70, 0x91b9ff);
      return;
    }
    if (effect === "timeAnchor") {
      this.enemies.getChildren().forEach((child) => {
        const enemy = child as Enemy;
        enemy.hurtUntil = Math.max(enemy.hurtUntil, time + stats.durationMs!);
        enemy.setVelocity(0, 0);
      });
      this.showRing(this.player.x, this.player.y, 260, 0xc69cff);
      return;
    }

    if (effect === "magneticPulse") {
      this.damageArea(this.player.x, this.player.y, stats.radius!, stats.damage!, stats.knockback!, time);
      this.showRing(this.player.x, this.player.y, stats.radius!, 0x62ead4);
      return;
    }

    const targetX = Phaser.Math.Clamp(pointer.worldX, 60, 900);
    const targetY = Phaser.Math.Clamp(pointer.worldY, 72, 484);
    this.damageArea(targetX, targetY, stats.radius!, stats.damage!, stats.knockback!, time);
    this.showRing(targetX, targetY, stats.radius!, effect === "drillSwarm" ? 0xe5d26c : 0xffb45e);
  }

  private damageArea(
    x: number,
    y: number,
    radius: number,
    damage: number,
    knockback: number,
    time: number,
  ): void {
    this.attackSerial += 1;
    this.enemies.getChildren().forEach((child) => {
      const enemy = child as Enemy;
      if (!enemy.active || Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y) > radius) return;
      const killed = enemy.receiveHit({
        amount: damage * this.player.stats.damageMultiplier,
        knockback,
        attackId: this.attackSerial,
      }, x, y, time);
      if (killed) {
        enemy.defeat();
        this.callbacks.onEnemyKilled(enemy);
      }
    });
  }

  private showRing(x: number, y: number, radius: number, color: number): void {
    const ring = this.scene.add.circle(x, y, radius, color, 0.16)
      .setStrokeStyle(4, color, 0.9).setDepth(42).setScale(0.35);
    this.scene.tweens.add({
      targets: ring, scale: 1, alpha: 0, duration: 280,
      onComplete: () => ring.destroy(),
    });
  }
}
