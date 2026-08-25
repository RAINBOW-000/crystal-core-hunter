import Phaser from "phaser";
import { RunSession } from "../application/RunSession";

/** Phaser composition root. Gameplay orchestration lives in RunSession. */
export class GameScene extends Phaser.Scene {
  private session?: RunSession;

  constructor() {
    super("game");
  }

  create(): void {
    this.session = new RunSession(this);
    this.session.create();
  }

  update(time: number, delta: number): void {
    this.session?.update(time, delta);
  }
}
