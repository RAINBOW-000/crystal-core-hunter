import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";

export interface HudState {
  hp: number;
  maxHp: number;
  combo: number;
  dodgeCooldown: number;
  remainingMs: number;
  enemyCount: number;
  activeItems: readonly ({ name: string; level: number } | undefined)[];
  bossActive: boolean;
  bossHp: number;
  bossMaxHp: number;
  equippedWeapons: readonly { name: string; level: number }[];
  characterName: string;
}

export class Hud {
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly comboText: Phaser.GameObjects.Text;
  private readonly runText: Phaser.GameObjects.Text;
  private readonly hintText: Phaser.GameObjects.Text;
  private readonly itemText: Phaser.GameObjects.Text;
  private readonly bossBarBack: Phaser.GameObjects.Rectangle;
  private readonly bossBarFill: Phaser.GameObjects.Rectangle;
  private readonly bossBarText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.hpText = scene.add.text(76, 26, "", {
      fontFamily: "monospace", fontSize: "17px", color: "#f6efe1",
    }).setDepth(50);
    this.comboText = scene.add.text(GAME_WIDTH - 76, 28, "", {
      fontFamily: "monospace", fontSize: "14px", color: "#6af0d5",
    }).setOrigin(1, 0).setDepth(50);
    this.runText = scene.add.text(GAME_WIDTH / 2, 28, "", {
      fontFamily: "monospace", fontSize: "15px", color: "#a89bb5",
    }).setOrigin(0.5, 0).setDepth(50);
    this.hintText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, "靠近晶壳虫，试试大剑的击退与三段连击", {
      fontFamily: "Microsoft YaHei", fontSize: "13px", color: "#a99cb4",
    }).setOrigin(0.5).setDepth(50);
    this.itemText = scene.add.text(76, GAME_HEIGHT - 50, "", {
      fontFamily: "Microsoft YaHei", fontSize: "12px", color: "#d9cce4",
    }).setDepth(50);
    this.bossBarBack = scene.add.rectangle(GAME_WIDTH / 2, 82, 326, 15, 0x17131f, 0.95)
      .setStrokeStyle(1, 0xff8a8a).setDepth(52).setVisible(false);
    this.bossBarFill = scene.add.rectangle(GAME_WIDTH / 2 - 160, 82, 320, 10, 0xc35575)
      .setOrigin(0, 0.5).setDepth(53).setVisible(false);
    this.bossBarText = scene.add.text(GAME_WIDTH / 2, 81, "", {
      fontFamily: "Microsoft YaHei", fontSize: "10px", color: "#fff0f2",
    }).setOrigin(0.5).setDepth(54).setVisible(false);
  }

  update(state: HudState): void {
    const hearts = Math.ceil(state.hp / 10);
    const maxHearts = Math.ceil(state.maxHp / 10);
    this.hpText.setText(`生命 ${"◆".repeat(hearts)}${"◇".repeat(maxHearts - hearts)}`);
    const dodgeLabel = state.dodgeCooldown === 0
      ? "翻滚就绪"
      : `翻滚 ${(state.dodgeCooldown / 1000).toFixed(1)}s`;
    this.comboText.setText(`${state.combo ? `${state.combo}段连击  ·  ` : ""}${dodgeLabel}`);
    const seconds = Math.ceil(state.remainingMs / 1000);
    const minutesLabel = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secondsLabel = (seconds % 60).toString().padStart(2, "0");
    this.runText.setText(`${state.bossActive ? "晶巢领主现身  ·  " : `${state.characterName}  ·  `}敌群 ${state.enemyCount}  ·  ${minutesLabel}:${secondsLabel}`);
    const slotLabel = state.activeItems.map((item, index) => {
      const key = index === 0 ? "Q" : "E";
      return `[${key}] ${item ? `${item.name} LV${item.level}` : "空槽"}`;
    }).join("    ");
    const weapons = state.equippedWeapons.map((weapon) => `${weapon.name} LV${weapon.level}`).join(" + ");
    this.itemText.setText(`${weapons || "选择初始武器"}    ·    ${slotLabel}`);
    const bossVisible = state.bossActive && state.bossMaxHp > 0 && state.bossHp > 0;
    this.bossBarBack.setVisible(bossVisible);
    this.bossBarFill.setVisible(bossVisible);
    this.bossBarText.setVisible(bossVisible);
    if (bossVisible) {
      const ratio = Phaser.Math.Clamp(state.bossHp / state.bossMaxHp, 0, 1);
      const phase = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
      this.bossBarFill.width = 320 * ratio;
      this.bossBarFill.setFillStyle(phase === 1 ? 0xa65ac1 : phase === 2 ? 0xe0855c : 0xe34e70);
      this.bossBarText.setText(`晶巢领主 · 阶段 ${phase} · ${Math.ceil(state.bossHp)}/${state.bossMaxHp}`);
    }
  }

  setHint(message: string, color = "#a99cb4"): void {
    this.hintText.setText(message).setColor(color);
  }

}
