import Phaser from "phaser";
import type { ItemInventory } from "../domain/items/ItemInventory";
import type { Enemy } from "../entities/Enemy";
import type { Player } from "../entities/Player";

interface ActiveItemCallbacks {
  onEnemyKilled: (enemy: Enemy) => void;
  onUsed: (message: string) => void;
}

export class ActiveItemSystem {
  private readonly keys: readonly Phaser.Input.Keyboard.Key[];
  private readonly readyAtByItem = new Map<string, number>();
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
      const stack = this.inventory.activeSlots[slotIndex];
      if (!stack) {
        this.callbacks.onUsed(`${slotIndex === 0 ? "Q" : "E"} 槽尚未装备主动道具`);
        return;
      }
      const readyAt = this.readyAtByItem.get(stack.definition.id) ?? 0;
      if (time < readyAt) {
        this.callbacks.onUsed(`${stack.definition.name} 冷却中 · ${Math.ceil((readyAt - time) / 1000)}s`);
        return;
      }
      this.readyAtByItem.set(stack.definition.id, time + (stack.definition.cooldownMs ?? 10000));
      this.activate(stack.definition.activeEffect, stack.level, time, pointer);
      this.callbacks.onUsed(`释放：${stack.definition.name}`);
    });
  }

  private activate(
    effect: string | undefined,
    level: number,
    time: number,
    pointer: Phaser.Input.Pointer,
  ): void {
    if (effect === "regeneration") {
      this.player.heal(22 + level * 13);
      this.showRing(this.player.x, this.player.y, 55, 0x83e06f);
      return;
    }
    if (effect === "prismShield") {
      this.player.grantInvulnerability(time + 900 + level * 500);
      this.showRing(this.player.x, this.player.y, 70, 0x91b9ff);
      return;
    }
    if (effect === "timeAnchor") {
      this.enemies.getChildren().forEach((child) => {
        const enemy = child as Enemy;
        enemy.hurtUntil = Math.max(enemy.hurtUntil, time + 800 + level * 350);
        enemy.setVelocity(0, 0);
      });
      this.showRing(this.player.x, this.player.y, 260, 0xc69cff);
      return;
    }

    if (effect === "magneticPulse") {
      this.damageArea(this.player.x, this.player.y, 135 + level * 20, 1 + level, 520, time);
      this.showRing(this.player.x, this.player.y, 135 + level * 20, 0x62ead4);
      return;
    }

    const targetX = Phaser.Math.Clamp(pointer.worldX, 60, 900);
    const targetY = Phaser.Math.Clamp(pointer.worldY, 72, 484);
    const radius = effect === "drillSwarm" ? 105 + level * 12 : 78 + level * 14;
    const damage = effect === "drillSwarm" ? 3 + level * 2 : 4 + level * 3;
    this.damageArea(targetX, targetY, radius, damage, 330, time);
    this.showRing(targetX, targetY, radius, effect === "drillSwarm" ? 0xe5d26c : 0xffb45e);
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
