import Phaser from "phaser";
import { GAME_WIDTH } from "../config/gameConfig";

export class ExperienceBar {
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private readonly width = 360;

  constructor(scene: Phaser.Scene) {
    scene.add.rectangle(GAME_WIDTH / 2, 57, this.width + 4, 12, 0x15121b).setStrokeStyle(1, 0x514660).setDepth(49);
    this.fill = scene.add.rectangle(GAME_WIDTH / 2 - this.width / 2, 57, 0, 8, 0x63d5c4)
      .setOrigin(0, 0.5)
      .setDepth(50);
    this.label = scene.add.text(GAME_WIDTH / 2, 56, "", {
      fontFamily: "monospace", fontSize: "10px", color: "#e8fff9",
    }).setOrigin(0.5).setDepth(51);
  }

  update(level: number, xp: number, required: number): void {
    this.fill.width = this.width * Phaser.Math.Clamp(xp / required, 0, 1);
    this.label.setText(`LV ${level}  ·  ${xp}/${required}`);
  }
}
