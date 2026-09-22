import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";
import type { RunUpgradeChoice } from "../domain/upgrades/RunUpgradeChoice";

export class UpgradeChoices {
  private objects: Phaser.GameObjects.GameObject[] = [];
  private options: RunUpgradeChoice[] = [];
  private onSelect?: (option: RunUpgradeChoice) => void;
  private readonly keyboardHandler: (event: KeyboardEvent) => void;

  constructor(private readonly scene: Phaser.Scene) {
    this.keyboardHandler = (event) => {
      const index = Number(event.key) - 1;
      if (index >= 0 && index < this.options.length) this.select(index);
    };
    scene.input.keyboard!.on("keydown", this.keyboardHandler);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      scene.input.keyboard!.off("keydown", this.keyboardHandler);
    });
  }

  open(level: number, options: RunUpgradeChoice[], onSelect: (option: RunUpgradeChoice) => void): void {
    this.close();
    this.options = options;
    this.onSelect = onSelect;
    this.objects.push(
      this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x080d12, 0.91).setDepth(200),
      this.scene.add.rectangle(GAME_WIDTH / 2, 104, 480, 76, 0x111a21, 0.98).setStrokeStyle(2, 0x3d555c).setDepth(201),
      this.scene.add.text(GAME_WIDTH / 2, 96, `${level % 3 === 0 ? "高级升级" : "等级提升"} · LV ${level}`, {
        fontFamily: "Microsoft YaHei", fontSize: "32px", color: "#e7e0cf", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(201),
      this.scene.add.text(GAME_WIDTH / 2, 132, "选择一项奖励", {
        fontFamily: "Microsoft YaHei", fontSize: "14px", color: "#a99cb4",
      }).setOrigin(0.5).setDepth(201),
    );

    options.forEach((option, index) => {
      const x = 250 + index * 230;
      const card = this.scene.add.rectangle(x, 290, 200, 230, 0x151d24, 0.98)
        .setStrokeStyle(2, level % 3 === 0 ? 0x9d7cff : 0x4b666d)
        .setDepth(201)
        .setInteractive({ useHandCursor: true });
      const number = this.scene.add.text(x, 205, `${index + 1}`, {
        fontFamily: "monospace", fontSize: "14px", color: "#78f3da",
      }).setOrigin(0.5).setDepth(202);
      const name = this.scene.add.text(x, 265, option.name, {
        fontFamily: "Microsoft YaHei", fontSize: "20px", color: "#f2ead8", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(202);
      const description = this.scene.add.text(x, 325, option.description, {
        fontFamily: "Microsoft YaHei", fontSize: "13px", color: "#b7aabe",
        align: "center", wordWrap: { width: 165 },
      }).setOrigin(0.5).setDepth(202);
      card.on("pointerover", () => card.setFillStyle(0x26343c));
      card.on("pointerout", () => card.setFillStyle(0x151d24));
      card.on("pointerdown", () => this.select(index));
      this.objects.push(card, number, name, description);
    });
    this.objects.forEach((object) => (object as Phaser.GameObjects.Sprite).setScrollFactor(0));
  }

  close(): void {
    this.objects.forEach((object) => object.destroy());
    this.objects = [];
    this.options = [];
    this.onSelect = undefined;
  }

  private select(index: number): void {
    const option = this.options[index];
    if (!option || !this.onSelect) return;
    const onSelect = this.onSelect;
    this.close();
    onSelect(option);
  }
}
