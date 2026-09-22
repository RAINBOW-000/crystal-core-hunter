import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";
import type { CharacterDefinition } from "../domain/characters/CharacterDefinition";
import { getWeaponDefinition } from "../content/weapons/weaponCatalog";
import { createPrimaryWeaponVisual } from "../entities/Player";

function wrapChineseText(text: string, charactersPerLine = 12): string {
  const characters = Array.from(text);
  const lines: string[] = [];
  for (let index = 0; index < characters.length; index += charactersPerLine) {
    lines.push(characters.slice(index, index + charactersPerLine).join(""));
  }
  return lines.join("\n");
}

export class CharacterSelection {
  private objects: Phaser.GameObjects.GameObject[] = [];
  private options: readonly CharacterDefinition[] = [];
  private onSelect?: (character: CharacterDefinition) => void;
  private readonly keyboardHandler: (event: KeyboardEvent) => void;

  constructor(private readonly scene: Phaser.Scene) {
    this.keyboardHandler = (event) => {
      const index = Number(event.key) - 1;
      if (index >= 0 && index < this.options.length) this.select(index);
    };
    scene.input.keyboard!.on("keydown", this.keyboardHandler);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.input.keyboard!.off("keydown", this.keyboardHandler));
  }

  open(options: readonly CharacterDefinition[], onSelect: (character: CharacterDefinition) => void): void {
    this.options = options;
    this.onSelect = onSelect;
    this.objects.push(
      this.scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x080d12, 0.95).setDepth(270),
      this.scene.add.rectangle(GAME_WIDTH / 2, 61, 520, 72, 0x111a21, 0.98).setStrokeStyle(2, 0x3d555c).setDepth(271),
      this.scene.add.text(GAME_WIDTH / 2, 54, "选择晶核猎人", {
        fontFamily: "Microsoft YaHei", fontSize: "30px", color: "#e7e0cf", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(271),
      this.scene.add.text(GAME_WIDTH / 2, 92, "角色与主武器固定绑定，选定后直接进入矿区", {
        fontFamily: "Microsoft YaHei", fontSize: "14px", color: "#b9adbf",
      }).setOrigin(0.5).setDepth(271),
    );
    options.forEach((option, index) => {
      const x = 260 + index * 220;
      const card = this.scene.add.rectangle(x, 292, 200, 300, 0x151d24, 0.98)
        .setStrokeStyle(2, option.color).setDepth(271).setInteractive({ useHandCursor: true });
      const accent = this.scene.add.rectangle(x, 146, 168, 5, option.color, 0.9).setDepth(272);
      const portrait = this.scene.add.sprite(x, 170, option.texture).setScale(2).setDepth(272);
      const weaponPortrait = createPrimaryWeaponVisual(this.scene, option.initialWeapon)
        .setPosition(x + 30, 184)
        .setScale(option.initialWeapon === "crystal-crossbow" ? 0.62 : 0.72)
        .setDepth(273);
      const number = this.scene.add.text(x - 78, 157, `${index + 1}`, { fontFamily: "monospace", fontSize: "13px", color: "#e7e0cf", backgroundColor: "#0c1218" }).setDepth(273);
      const name = this.scene.add.text(x, 220, `${option.name} · ${option.title}`, {
        fontFamily: "Microsoft YaHei", fontSize: "17px", color: "#f2ead8", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(272);
      const stats = this.scene.add.text(x, 262, `生命 ${option.stats.maxHp}  ·  护甲 ${option.stats.armor}\n移速 ${option.stats.moveSpeed}  ·  伤害 ${(option.stats.damageMultiplier * 100).toFixed(0)}%`, {
        fontFamily: "monospace", fontSize: "12px", color: "#b7aabe", align: "center",
      }).setOrigin(0.5).setDepth(272);
      const talent = this.scene.add.text(x, 327, option.talentName, {
        fontFamily: "Microsoft YaHei", fontSize: "15px", color: Phaser.Display.Color.IntegerToColor(option.color).rgba,
        fontStyle: "bold",
      }).setOrigin(0.5).setDepth(272);
      const weapon = this.scene.add.text(x, 300, `主武器 · ${getWeaponDefinition(option.initialWeapon).name}`, {
        fontFamily: "Microsoft YaHei", fontSize: "12px", color: "#ffcf70",
      }).setOrigin(0.5).setDepth(272);
      const talentDescription = this.scene.add.text(x, 375, wrapChineseText(option.talentDescription), {
        fontFamily: "Microsoft YaHei", fontSize: "12px", color: "#d2c7d8", align: "center",
      }).setOrigin(0.5).setDepth(272);
      card.on("pointerover", () => card.setFillStyle(0x233139));
      card.on("pointerout", () => card.setFillStyle(0x151d24));
      card.on("pointerdown", () => this.select(index));
      this.objects.push(card, accent, portrait, weaponPortrait, number, name, stats, weapon, talent, talentDescription);
    });
    this.objects.forEach((object) => (object as Phaser.GameObjects.Sprite).setScrollFactor(0));
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
