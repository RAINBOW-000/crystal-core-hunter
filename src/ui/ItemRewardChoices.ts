import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";
import type { ItemDefinition } from "../domain/items/ItemDefinition";

export class ItemRewardChoices {
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
      this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x08070d, 0.9).setDepth(320),
      this.scene.add.text(GAME_WIDTH / 2, 86, "稀有晶脉", {
        fontFamily: "Microsoft YaHei", fontSize: "30px", color: "#9d7cff", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(321),
      this.scene.add.text(GAME_WIDTH / 2, 128, "选择一件道具 · 战斗已暂停", {
        fontFamily: "Microsoft YaHei", fontSize: "14px", color: "#d5cadd",
      }).setOrigin(0.5).setDepth(321),
    );
    options.forEach((option, index) => {
      const x = 250 + index * 230;
      const card = this.scene.add.rectangle(x, 300, 200, 230, 0x211b2a)
        .setStrokeStyle(2, option.color).setDepth(321).setInteractive({ useHandCursor: true });
      const number = this.scene.add.text(x, 218, `${index + 1}`, { fontFamily: "monospace", fontSize: "14px", color: "#78f3da" }).setOrigin(0.5).setDepth(322);
      const kindLabel = option.kind === "active" ? "主动" : option.kind === "passive" ? "被动" : "进化材料";
      const kind = this.scene.add.text(x, 250, kindLabel, { fontFamily: "Microsoft YaHei", fontSize: "12px", color: "#a99cb4" }).setOrigin(0.5).setDepth(322);
      const name = this.scene.add.text(x, 296, option.name, {
        fontFamily: "Microsoft YaHei", fontSize: "18px", color: "#f2ead8", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(322);
      const description = this.scene.add.text(x, 355, option.description, {
        fontFamily: "Microsoft YaHei", fontSize: "13px", color: "#b7aabe", align: "center", wordWrap: { width: 168 },
      }).setOrigin(0.5).setDepth(322);
      card.on("pointerover", () => card.setFillStyle(0x382c46));
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
