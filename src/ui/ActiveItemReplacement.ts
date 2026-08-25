import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";
import type { ItemDefinition, ItemStack } from "../domain/items/ItemDefinition";

export class ActiveItemReplacement {
  private objects: Phaser.GameObjects.GameObject[] = [];
  private handlers: Array<() => void> = [];
  private readonly keyboardHandler: (event: KeyboardEvent) => void;

  constructor(private readonly scene: Phaser.Scene) {
    this.keyboardHandler = (event) => {
      const index = Number(event.key) - 1;
      this.handlers[index]?.();
    };
    scene.input.keyboard!.on("keydown", this.keyboardHandler);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.keyboard!.off("keydown", this.keyboardHandler);
    });
  }

  open(
    incoming: ItemDefinition,
    slots: readonly (ItemStack | undefined)[],
    onReplace: (slotIndex: number) => void,
    onDiscard: () => void,
  ): void {
    this.close();
    this.objects.push(
      this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x08070d, 0.9).setDepth(300),
      this.scene.add.text(GAME_WIDTH / 2, 82, "主动道具槽已满", {
        fontFamily: "Microsoft YaHei", fontSize: "30px", color: "#78f3da", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(301),
      this.scene.add.text(GAME_WIDTH / 2, 124, `拾取：${incoming.name} · 选择要替换的道具，或放弃`, {
        fontFamily: "Microsoft YaHei", fontSize: "15px", color: "#d5cadd",
      }).setOrigin(0.5).setDepth(301),
    );

    const actions = [
      { title: `替换 ${slots[0]?.definition.name ?? "槽位 Q"}`, detail: "放入 Q 槽", color: 0x2b2637, run: () => onReplace(0) },
      { title: `替换 ${slots[1]?.definition.name ?? "槽位 E"}`, detail: "放入 E 槽", color: 0x2b2637, run: () => onReplace(1) },
      { title: "放弃新道具", detail: "保留当前搭配", color: 0x352329, run: onDiscard },
    ];
    this.handlers = actions.map((action) => action.run);
    actions.forEach((action, index) => {
      const x = 250 + index * 230;
      const card = this.scene.add.rectangle(x, 292, 200, 210, action.color)
        .setStrokeStyle(2, index === 2 ? 0x9b5964 : 0x655576)
        .setDepth(301)
        .setInteractive({ useHandCursor: true });
      const number = this.scene.add.text(x, 220, `${index + 1}`, {
        fontFamily: "monospace", fontSize: "14px", color: "#78f3da",
      }).setOrigin(0.5).setDepth(302);
      const title = this.scene.add.text(x, 282, action.title, {
        fontFamily: "Microsoft YaHei", fontSize: "18px", color: "#f2ead8", fontStyle: "bold",
        align: "center", wordWrap: { width: 170 },
      }).setOrigin(0.5).setDepth(302);
      const detail = this.scene.add.text(x, 340, action.detail, {
        fontFamily: "Microsoft YaHei", fontSize: "13px", color: "#b7aabe",
      }).setOrigin(0.5).setDepth(302);
      card.on("pointerover", () => card.setFillStyle(index === 2 ? 0x4b2c34 : 0x3a3049));
      card.on("pointerout", () => card.setFillStyle(action.color));
      card.on("pointerdown", action.run);
      this.objects.push(card, number, title, detail);
    });
  }

  close(): void {
    this.objects.forEach((object) => object.destroy());
    this.objects = [];
    this.handlers = [];
  }
}
