import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";

export function showResultOverlay(scene: Phaser.Scene, title: string, summary: string, actions: readonly { label: string; onClick: () => void }[] = []): void {
  scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x080d12, 0.88).setDepth(90).setScrollFactor(0);
  scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 58, title, {
    fontFamily: "Microsoft YaHei", fontSize: "42px", color: "#78f3da", fontStyle: "bold",
  }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
  scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, summary, {
    fontFamily: "monospace", fontSize: "17px", color: "#eee8d5",
  }).setOrigin(0.5).setDepth(100).setScrollFactor(0);
  actions.forEach((action, index) => {
    const x = GAME_WIDTH / 2 + (index - (actions.length - 1) / 2) * 190;
    const y = GAME_HEIGHT / 2 + 68;
    const back = scene.add.rectangle(x, y, 170, 38, 0x263847, 0.98).setStrokeStyle(2, 0x78f3da).setInteractive({ useHandCursor: true }).setDepth(100).setScrollFactor(0);
    scene.add.text(x, y, action.label, { fontFamily: "Microsoft YaHei", fontSize: "15px", color: "#effffb" }).setOrigin(0.5).setDepth(101).setInteractive({ useHandCursor: true }).setScrollFactor(0).on("pointerdown", action.onClick);
    back.on("pointerdown", action.onClick).on("pointerover", () => back.setFillStyle(0x36576d)).on("pointerout", () => back.setFillStyle(0x263847));
  });
}
