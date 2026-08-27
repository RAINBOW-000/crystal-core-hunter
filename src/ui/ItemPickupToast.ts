import Phaser from "phaser";
import { GAME_WIDTH } from "../config/gameConfig";
import type { ItemStack } from "../domain/items/ItemDefinition";
import { describeItemLevelEffect } from "../domain/items/ItemEffectScaling";

interface ToastEntry {
  container: Phaser.GameObjects.Container;
}

/** Non-blocking item feedback used by elite drops and replacement results. */
export class ItemPickupToast {
  private readonly entries: ToastEntry[] = [];

  constructor(private readonly scene: Phaser.Scene) {}

  show(stack: ItemStack, upgraded: boolean): void {
    const action = upgraded ? "道具升级" : "获得道具";
    const panel = this.scene.add.rectangle(0, 0, 330, 54, 0x17121d, 0.94)
      .setStrokeStyle(2, stack.definition.color);
    const marker = this.scene.add.rectangle(-148, 0, 8, 38, stack.definition.color);
    const title = this.scene.add.text(-132, -13, `${action} · ${stack.definition.name}  LV${stack.level}`, {
      fontFamily: "Microsoft YaHei", fontSize: "14px", color: "#f4e8ff", fontStyle: "bold",
    }).setOrigin(0, 0.5);
    const effect = this.scene.add.text(-132, 13, describeItemLevelEffect(stack.definition, stack.level), {
      fontFamily: "Microsoft YaHei", fontSize: "11px", color: "#b8a9c4",
    }).setOrigin(0, 0.5);
    const container = this.scene.add.container(GAME_WIDTH / 2, 112, [panel, marker, title, effect])
      .setDepth(260).setAlpha(0).setScale(0.96);
    const entry = { container };
    this.entries.unshift(entry);
    this.entries.splice(3).forEach((removed) => removed.container.destroy());
    this.reflow();

    this.scene.tweens.add({ targets: container, alpha: 1, scale: 1, duration: 130 });
    this.scene.time.delayedCall(1900, () => {
      if (!container.active) return;
      this.scene.tweens.add({
        targets: container, alpha: 0, y: container.y - 10, duration: 260,
        onComplete: () => {
          container.destroy();
          const index = this.entries.indexOf(entry);
          if (index >= 0) this.entries.splice(index, 1);
          this.reflow();
        },
      });
    });
  }

  private reflow(): void {
    this.entries.forEach((entry, index) => {
      if (entry.container.active) entry.container.setY(112 + index * 62);
    });
  }
}
