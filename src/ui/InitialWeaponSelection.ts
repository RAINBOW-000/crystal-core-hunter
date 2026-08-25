import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";
import type { WeaponDefinition } from "../content/weapons/weaponCatalog";
import type { WeaponId } from "../domain/weapons/WeaponProgression";

export class InitialWeaponSelection {
  private objects: Phaser.GameObjects.GameObject[] = [];
  private options: readonly WeaponDefinition[] = [];
  private onSelect?: (id: WeaponId) => void;
  private readonly keyboardHandler: (event: KeyboardEvent) => void;

  constructor(private readonly scene: Phaser.Scene) {
    this.keyboardHandler = (event) => {
      const index = Number(event.key) - 1;
      if (index >= 0 && index < this.options.length) this.select(index);
    };
    scene.input.keyboard!.on("keydown", this.keyboardHandler);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.input.keyboard!.off("keydown", this.keyboardHandler));
  }

  open(options: readonly WeaponDefinition[], onSelect: (id: WeaponId) => void): void {
    this.options = options;
    this.onSelect = onSelect;
    this.objects.push(
      this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x08070d, 0.92).setDepth(250),
      this.scene.add.text(GAME_WIDTH / 2, 64, "选择初始武器", {
        fontFamily: "Microsoft YaHei", fontSize: "30px", color: "#78f3da", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(251),
      this.scene.add.text(GAME_WIDTH / 2, 103, "四把武器均已解锁 · 本局 LV3 再选择第二把", {
        fontFamily: "Microsoft YaHei", fontSize: "14px", color: "#b9adbf",
      }).setOrigin(0.5).setDepth(251),
    );
    options.forEach((option, index) => {
      const x = 150 + index * 220;
      const card = this.scene.add.rectangle(x, 285, 192, 260, 0x211b2a)
        .setStrokeStyle(2, option.color).setDepth(251).setInteractive({ useHandCursor: true });
      const number = this.scene.add.text(x, 185, `${index + 1}`, { fontFamily: "monospace", fontSize: "14px", color: "#78f3da" }).setOrigin(0.5).setDepth(252);
      const name = this.scene.add.text(x, 255, option.name, {
        fontFamily: "Microsoft YaHei", fontSize: "19px", color: "#f2ead8", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(252);
      const description = this.scene.add.text(x, 330, option.description, {
        fontFamily: "Microsoft YaHei", fontSize: "13px", color: "#b7aabe", align: "center", wordWrap: { width: 155 },
      }).setOrigin(0.5).setDepth(252);
      card.on("pointerover", () => card.setFillStyle(0x352b43));
      card.on("pointerout", () => card.setFillStyle(0x211b2a));
      card.on("pointerdown", () => this.select(index));
      this.objects.push(card, number, name, description);
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
    callback(option.id);
  }
}
