import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";

export function showResultOverlay(scene: Phaser.Scene, title: string, summary: string): void {
  scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x09080d, 0.82).setDepth(90);
  scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 58, title, {
    fontFamily: "Microsoft YaHei", fontSize: "42px", color: "#78f3da", fontStyle: "bold",
  }).setOrigin(0.5).setDepth(100);
  scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 8, summary, {
    fontFamily: "monospace", fontSize: "17px", color: "#eee8d5",
  }).setOrigin(0.5).setDepth(100);
  scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 55, "按 R 再来一局", {
    fontFamily: "Microsoft YaHei", fontSize: "15px", color: "#a99cb4",
  }).setOrigin(0.5).setDepth(100);
}
