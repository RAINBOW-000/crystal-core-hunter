import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "./config/gameConfig";
import { GameScene } from "./scenes/GameScene";
import "./style.css";

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  pixelArt: true,
  antialias: false,
  roundPixels: true,
  backgroundColor: "#121019",
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scene: [GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});
