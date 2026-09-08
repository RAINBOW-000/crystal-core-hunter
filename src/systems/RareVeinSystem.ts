import Phaser from "phaser";
import { RARE_VEIN_CONFIG, ROOM_BOUNDS, RUN_CONFIG } from "../config/gameConfig";
import { HoldInteraction } from "../domain/world/HoldInteraction";
import { randomBetween, type RandomSource } from "../domain/random/RunRandom";
import type { Player } from "../entities/Player";

interface RareVeinCallbacks {
  onMined: () => void;
  onHint: (message: string, color?: string) => void;
}

export class RareVeinSystem {
  private readonly veins: Phaser.Physics.Arcade.Sprite[] = [];
  private readonly mining = new HoldInteraction(RARE_VEIN_CONFIG.miningDurationMs);
  private readonly interactKey: Phaser.Input.Keyboard.Key;
  private readonly progressBack: Phaser.GameObjects.Rectangle;
  private readonly progressFill: Phaser.GameObjects.Rectangle;
  private readonly progressText: Phaser.GameObjects.Text;
  private nextSpawnIndex = 0;
  private activeVein?: Phaser.Physics.Arcade.Sprite;
  private lastHint = "";

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly callbacks: RareVeinCallbacks,
    private readonly random: RandomSource = Math.random,
  ) {
    this.interactKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.F);
    this.progressBack = scene.add.rectangle(0, 0, 72, 8, 0x17131f, 0.95).setDepth(70).setVisible(false);
    this.progressFill = scene.add.rectangle(0, 0, 0, 6, 0x78f3da, 1).setOrigin(0, 0.5).setDepth(71).setVisible(false);
    this.progressText = scene.add.text(0, 0, "", {
      fontFamily: "Microsoft YaHei", fontSize: "11px", color: "#d9fff7",
      backgroundColor: "#17131fcc", padding: { x: 4, y: 2 },
    }).setOrigin(0.5).setDepth(72).setVisible(false);
  }

  update(elapsedMs: number, deltaMs: number): void {
    while (
      this.nextSpawnIndex < RUN_CONFIG.rareVeinSpawnTimesMs.length
      && elapsedMs >= RUN_CONFIG.rareVeinSpawnTimesMs[this.nextSpawnIndex]
    ) {
      this.spawnVein();
      this.nextSpawnIndex += 1;
    }

    const nearby = this.findNearestVein();
    if (nearby !== this.activeVein) {
      this.mining.reset();
      this.activeVein = nearby;
    }
    if (!nearby) {
      this.hideProgress();
      if (this.lastHint) {
        this.lastHint = "";
        this.callbacks.onHint("稀有晶脉会保留在地图上，可随时返回开采", "#a99cb4");
      }
      return;
    }

    const state = this.mining.update(deltaMs, this.interactKey.isDown);
    if (state === "idle") {
      this.hideProgress();
      this.setHint("进入范围后按住 F 开采，可在范围内移动");
      return;
    }
    this.showProgress(nearby);
    this.setHint(`正在开采稀有晶脉 · ${Math.floor(this.mining.ratio * 100)}% · 移动与受伤不会中断`, "#78f3da");
    if (state !== "completed") return;

    nearby.destroy();
    this.veins.splice(this.veins.indexOf(nearby), 1);
    this.activeVein = undefined;
    this.mining.reset();
    this.hideProgress();
    this.setHint("");
    this.callbacks.onMined();
  }

  spawnForQa(): void {
    this.spawnVein(true);
  }

  private spawnVein(nearPlayer = false): void {
    let x = nearPlayer
      ? Phaser.Math.Clamp(this.player.x + RARE_VEIN_CONFIG.interactionRadius - 12, ROOM_BOUNDS.x + 48, ROOM_BOUNDS.x + ROOM_BOUNDS.width - 48)
      : ROOM_BOUNDS.x + ROOM_BOUNDS.width / 2;
    let y = nearPlayer ? this.player.y : ROOM_BOUNDS.y + ROOM_BOUNDS.height / 2;
    if (!nearPlayer) {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        x = randomBetween(this.random, ROOM_BOUNDS.x + 48, ROOM_BOUNDS.x + ROOM_BOUNDS.width - 48);
        y = randomBetween(this.random, ROOM_BOUNDS.y + 48, ROOM_BOUNDS.y + ROOM_BOUNDS.height - 48);
        if (Phaser.Math.Distance.Between(x, y, this.player.x, this.player.y) >= RARE_VEIN_CONFIG.spawnPlayerClearance) break;
      }
    }
    const vein = this.scene.physics.add.staticSprite(x, y, "rare-vein").setDepth(14);
    this.veins.push(vein);
    const pulse = this.scene.add.circle(x, y, 28, 0x78f3da, 0.08).setDepth(13);
    this.scene.tweens.add({ targets: pulse, scale: 1.45, alpha: 0, duration: 1000, repeat: 2, onComplete: () => pulse.destroy() });
    this.callbacks.onHint("稀有晶脉已出现 · 进入范围后按住 F 开采", "#9d7cff");
  }

  private findNearestVein(): Phaser.Physics.Arcade.Sprite | undefined {
    return this.veins.filter((vein) => vein.active)
      .map((vein) => ({ vein, distance: Phaser.Math.Distance.Between(this.player.x, this.player.y, vein.x, vein.y) }))
      .filter((entry) => entry.distance <= RARE_VEIN_CONFIG.interactionRadius)
      .sort((a, b) => a.distance - b.distance)[0]?.vein;
  }

  private showProgress(vein: Phaser.Physics.Arcade.Sprite): void {
    const width = 70 * this.mining.ratio;
    this.progressBack.setPosition(vein.x, vein.y - 38).setVisible(true);
    this.progressFill.setPosition(vein.x - 35, vein.y - 38).setSize(width, 6).setVisible(true);
    this.progressText.setPosition(vein.x, vein.y - 55).setText("开采中").setVisible(true);
  }

  private hideProgress(): void {
    this.progressBack.setVisible(false);
    this.progressFill.setVisible(false);
    this.progressText.setVisible(false);
  }

  private setHint(message: string, color?: string): void {
    if (message === this.lastHint) return;
    this.lastHint = message;
    if (message) this.callbacks.onHint(message, color);
  }
}
