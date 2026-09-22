import Phaser from "phaser";
import { GAME_WIDTH } from "../config/gameConfig";

export class ExperienceBar {
  private readonly fill: Phaser.GameObjects.Rectangle;
  private readonly label: Phaser.GameObjects.Text;
  private readonly width = 360;

  constructor(scene: Phaser.Scene) {
    scene.add.rectangle(GAME_WIDTH / 2, 529, this.width + 4, 11, 0x111820, 0.94)
      .setStrokeStyle(1, 0x425866).setDepth(49).setScrollFactor(0);
    this.fill = scene.add.rectangle(GAME_WIDTH / 2 - this.width / 2, 529, 0, 7, 0x63d5c4)
      .setOrigin(0, 0.5)
      .setDepth(50)
      .setScrollFactor(0);
    this.label = scene.add.text(GAME_WIDTH / 2, 528, "", {
      fontFamily: "monospace", fontSize: "10px", color: "#e8fff9",
    }).setOrigin(0.5).setDepth(51).setScrollFactor(0);
  }

  update(level: number, xp: number, required: number): void {
    this.fill.width = this.width * Phaser.Math.Clamp(xp / required, 0, 1);
    this.label.setText(`LV ${level}  ·  ${xp.toFixed(1)}/${required.toFixed(1)}`);
  }
}
