import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";
import type { ItemDefinition } from "../domain/items/ItemDefinition";

export class VictoryChestChoices {
  private objects: Phaser.GameObjects.GameObject[] = [];
  private options: readonly ItemDefinition[] = [];
  private onSelect?: (item: ItemDefinition) => void;
  private readonly keyboardHandler: (event: KeyboardEvent) => void;

  constructor(private readonly scene: Phaser.Scene) {
    this.keyboardHandler = (event) => {
      const index = Number(event.key) - 1;
      if (index >= 0 && index < this.options.length) this.select(index);
    };
    scene.input.keyboard!.on("keydown", this.keyboardHandler);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.input.keyboard!.off("keydown", this.keyboardHandler));
  }

  open(options: readonly ItemDefinition[], onSelect: (item: ItemDefinition) => void): void {
    this.options = options;
    this.onSelect = onSelect;
    this.objects.push(
      this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x08070d, 0.93).setDepth(400),
      this.scene.add.rectangle(GAME_WIDTH / 2, 102, 126, 72, 0x4b324f).setStrokeStyle(4, 0xffcf70).setDepth(401),
      this.scene.add.text(GAME_WIDTH / 2, 102, "胜利宝箱", {
        fontFamily: "Microsoft YaHei", fontSize: "18px", color: "#ffcf70", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(402),
      this.scene.add.text(GAME_WIDTH / 2, 158, "选择一项永久解锁 · 从下一局开始进入道具池", {
        fontFamily: "Microsoft YaHei", fontSize: "15px", color: "#d8cce0",
      }).setOrigin(0.5).setDepth(402),
    );
    options.forEach((option, index) => {
      const spacing = options.length === 1 ? 0 : 230;
      const x = GAME_WIDTH / 2 + (index - (options.length - 1) / 2) * spacing;
      const card = this.scene.add.rectangle(x, 326, 205, 230, 0x211b2a)
        .setStrokeStyle(2, option.color).setDepth(401).setInteractive({ useHandCursor: true });
      const number = this.scene.add.text(x, 245, `${index + 1}`, { fontFamily: "monospace", fontSize: "14px", color: "#78f3da" }).setOrigin(0.5).setDepth(402);
      const kind = this.scene.add.text(x, 278, option.kind === "active" ? "主动道具" : "被动道具", {
        fontFamily: "Microsoft YaHei", fontSize: "12px", color: "#9e8cac",
      }).setOrigin(0.5).setDepth(402);
      const name = this.scene.add.text(x, 325, option.name, {
        fontFamily: "Microsoft YaHei", fontSize: "19px", color: "#f4eddf", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(402);
      const description = this.scene.add.text(x, 382, option.description, {
        fontFamily: "Microsoft YaHei", fontSize: "13px", color: "#b7aabe", align: "center", wordWrap: { width: 170 },
      }).setOrigin(0.5).setDepth(402);
      card.on("pointerover", () => card.setFillStyle(0x382b44));
      card.on("pointerout", () => card.setFillStyle(0x211b2a));
      card.on("pointerdown", () => this.select(index));
      this.objects.push(card, number, kind, name, description);
    });
  }

  private select(index: number): void {
    const option = this.options[index];
    if (!option || !this.onSelect) return;
    const callback = this.onSelect;
    this.objects.forEach((object) => object.destroy());
    this.objects = [];
    this.options = [];
    this.onSelect = undefined;
    callback(option);
  }
}
