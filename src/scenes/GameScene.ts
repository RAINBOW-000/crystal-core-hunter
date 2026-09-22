import Phaser from "phaser";
import { RunSession } from "../application/RunSession";

/** Phaser composition root. Gameplay orchestration lives in RunSession. */
export class GameScene extends Phaser.Scene {
  private session?: RunSession;
  private startData: { stageNumber?: number; seed?: string } = {};

  constructor() {
    super("game");
  }

  init(data: { stageNumber?: number; seed?: string }): void { this.startData = data ?? {}; }

  preload(): void {
    [
      ["crystal-bug", "/art/crystal-bug-v2.png?v=2"],
      ["crystal-spitter", "/art/crystal-spitter-v1.png?v=1"],
      ["crystal-ram", "/art/crystal-ram-v1.png?v=1"],
      ["elite-crystal-bug", "/art/elite-crystal-bug-v1.png?v=1"],
      ["crystal-hive-boss", "/art/crystal-hive-boss-v1.png?v=1"],
      ["frost-trail-beast", "/art/frost-trail-beast-v1.png?v=1"],
      ["ice-vein-caller", "/art/ice-vein-caller-v1.png?v=1"],
      ["frost-ridge-hunter", "/art/frost-ridge-hunter-v1.png?v=1"],
      ["ice-armor-colossus", "/art/ice-armor-colossus-v1.png?v=1"],
    ].forEach(([key, url]) => {
      if (!this.textures.exists(key)) this.load.image(key, url);
    });
    if (!this.textures.exists("character-concept")) {
      this.load.image("character-concept", "/art/crystal-hunter-characters-concept.png");
    }
    [
      ["miner-guard-directional", "/art/miner-guard-directional-v1.png?v=5"],
      ["crystal-hunter-directional", "/art/crystal-hunter-directional-v1.png?v=1"],
      ["leyline-prospector-directional", "/art/leyline-prospector-directional-v1.png?v=1"],
    ].forEach(([key, url]) => {
      if (!this.textures.exists(key)) this.load.spritesheet(key, url, { frameWidth: 64, frameHeight: 72 });
    });
    [
      ["greatsword-forms", "/art/greatsword-forms-v1.png?v=2"],
      ["crystal-crossbow-forms", "/art/crystal-crossbow-forms-v1.png?v=1"],
      ["fission-staff-forms", "/art/fission-staff-forms-v1.png?v=1"],
    ].forEach(([key, url]) => {
      if (!this.textures.exists(key)) this.load.spritesheet(key, url, { frameWidth: 72, frameHeight: 72 });
    });
    if (!this.textures.exists("secondary-weapons")) {
      this.load.spritesheet("secondary-weapons", "/art/secondary-weapons-v1.png?v=1", { frameWidth: 72, frameHeight: 72 });
    }
  }

  create(): void {
    this.session = new RunSession(this, this.startData);
    this.session.create();
  }

  update(time: number, delta: number): void {
    this.session?.update(time, delta);
  }
}
