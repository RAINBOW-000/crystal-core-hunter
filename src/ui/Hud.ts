import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";

export interface HudState {
  hp: number;
  maxHp: number;
  combo: number;
  dodgeCooldown: number;
  remainingMs: number;
  enemyCount: number;
  activeItems: readonly ({ name: string; level: number; cooldownMs: number; remainingMs: number; ready: boolean } | undefined)[];
  passiveItems: readonly { name: string; level: number }[];
  bossActive: boolean;
  bossHp: number;
  bossMaxHp: number;
  equippedWeapons: readonly { name: string; level: number }[];
  characterName: string;
  stageName: string;
  bossName: string;
}

export class Hud {
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly hpSegments: Phaser.GameObjects.Rectangle[] = [];
  private readonly comboText: Phaser.GameObjects.Text;
  private readonly runText: Phaser.GameObjects.Text;
  private readonly hintText: Phaser.GameObjects.Text;
  private readonly weaponText: Phaser.GameObjects.Text;
  private readonly itemText: Phaser.GameObjects.Text;
  private readonly passiveText: Phaser.GameObjects.Text;
  private readonly bossBarBack: Phaser.GameObjects.Rectangle;
  private readonly bossBarFill: Phaser.GameObjects.Rectangle;
  private readonly bossBarText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    scene.add.rectangle(128, 36, 232, 52, 0x111820, 0.94)
      .setStrokeStyle(2, 0x3f5962).setDepth(48).setScrollFactor(0);
    scene.add.rectangle(GAME_WIDTH / 2, 29, 230, 38, 0x111820, 0.9)
      .setStrokeStyle(1, 0x425866).setDepth(48).setScrollFactor(0);
    scene.add.rectangle(GAME_WIDTH - 126, 36, 226, 52, 0x111820, 0.94)
      .setStrokeStyle(2, 0x594455).setDepth(48).setScrollFactor(0);
    scene.add.rectangle(175, GAME_HEIGHT - 47, 326, 68, 0x111820, 0.92)
      .setStrokeStyle(2, 0x3b535a).setDepth(48).setScrollFactor(0);
    scene.add.rectangle(GAME_WIDTH - 172, GAME_HEIGHT - 47, 320, 68, 0x111820, 0.92)
      .setStrokeStyle(2, 0x5b4d3f).setDepth(48).setScrollFactor(0);

    scene.add.rectangle(27, 35, 30, 30, 0x18333a, 1)
      .setRotation(Math.PI / 4).setStrokeStyle(2, 0x78f3da).setDepth(50).setScrollFactor(0);
    for (let index = 0; index < 10; index += 1) {
      const segment = scene.add.rectangle(55 + index * 16, 28, 11, 11, 0x6af0d5, 1)
        .setRotation(Math.PI / 4).setDepth(50).setScrollFactor(0);
      this.hpSegments.push(segment);
    }
    this.hpText = scene.add.text(49, 43, "", {
      fontFamily: "monospace", fontSize: "12px", color: "#f6efe1",
    }).setDepth(50).setScrollFactor(0);
    this.comboText = scene.add.text(GAME_WIDTH - 24, 20, "", {
      fontFamily: "Microsoft YaHei", fontSize: "13px", color: "#ffcf70", align: "right",
    }).setOrigin(1, 0).setDepth(50).setScrollFactor(0);
    this.runText = scene.add.text(GAME_WIDTH / 2, 18, "", {
      fontFamily: "Microsoft YaHei", fontSize: "14px", color: "#e7e0cf", align: "center",
    }).setOrigin(0.5, 0).setDepth(50).setScrollFactor(0);
    this.hintText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 88, "靠近晶壳虫，试试大剑的击退与三段连击", {
      fontFamily: "Microsoft YaHei", fontSize: "12px", color: "#a99cb4",
      backgroundColor: "#111820dd", padding: { x: 10, y: 5 },
    }).setOrigin(0.5).setDepth(50).setScrollFactor(0);
    this.weaponText = scene.add.text(28, GAME_HEIGHT - 68, "", {
      fontFamily: "Microsoft YaHei", fontSize: "12px", color: "#e7e0cf",
    }).setDepth(50).setScrollFactor(0);
    this.itemText = scene.add.text(GAME_WIDTH - 28, GAME_HEIGHT - 68, "", {
      fontFamily: "Microsoft YaHei", fontSize: "12px", color: "#f0d19a", align: "right",
    }).setOrigin(1, 0).setDepth(50).setScrollFactor(0);
    this.passiveText = scene.add.text(28, GAME_HEIGHT - 43, "", {
      fontFamily: "Microsoft YaHei", fontSize: "11px", color: "#91a4aa",
    }).setDepth(50).setScrollFactor(0);
    this.bossBarBack = scene.add.rectangle(GAME_WIDTH / 2, 73, 406, 17, 0x11151b, 0.96)
      .setStrokeStyle(2, 0xd94b72).setDepth(52).setVisible(false).setScrollFactor(0);
    this.bossBarFill = scene.add.rectangle(GAME_WIDTH / 2 - 200, 73, 400, 10, 0xc35575)
      .setOrigin(0, 0.5).setDepth(53).setVisible(false).setScrollFactor(0);
    this.bossBarText = scene.add.text(GAME_WIDTH / 2, 73, "", {
      fontFamily: "Microsoft YaHei", fontSize: "10px", color: "#fff0f2",
    }).setOrigin(0.5).setDepth(54).setVisible(false).setScrollFactor(0);
  }

  update(state: HudState): void {
    const hpRatio = Phaser.Math.Clamp(state.hp / state.maxHp, 0, 1);
    this.hpSegments.forEach((segment, index) => {
      const active = (index + 0.5) / this.hpSegments.length <= hpRatio;
      segment.setFillStyle(active ? (hpRatio <= 0.3 ? 0xd94b72 : 0x6af0d5) : 0x28333a, active ? 1 : 0.72);
    });
    this.hpText.setText(`${state.characterName}  ${Math.ceil(state.hp)} / ${state.maxHp}`);
    const dodgeLabel = state.dodgeCooldown === 0
      ? "翻滚就绪"
      : `翻滚 ${(state.dodgeCooldown / 1000).toFixed(1)}s`;
    this.comboText.setText(`敌群 ${state.enemyCount}\n${state.combo ? `连击 ×${state.combo}  ·  ` : ""}${dodgeLabel}`);
    const seconds = Math.ceil(state.remainingMs / 1000);
    const minutesLabel = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secondsLabel = (seconds % 60).toString().padStart(2, "0");
    this.runText.setText(`${state.bossActive ? `${state.bossName}现身` : state.stageName}\n${minutesLabel}:${secondsLabel}`);
    const slotLabel = state.activeItems.map((item, index) => {
      const key = index === 0 ? "Q" : "E";
      if (!item) return `[${key}] 空槽`;
      const cooldown = item.ready ? "就绪" : `${(item.remainingMs / 1000).toFixed(1)}s`;
      return `[${key}] ${item.name} LV${item.level} · ${cooldown}`;
    }).join("\n");
    const weapons = state.equippedWeapons.map((weapon) => `${weapon.name} LV${weapon.level}`).join(" + ");
    this.weaponText.setText(`武器  ${weapons || "角色主武器"}`);
    this.itemText.setText(slotLabel);
    const passives = state.passiveItems.map((item) => `${item.name} LV${item.level}`).join(" · ");
    this.passiveText.setText(passives ? `被动 · ${passives}` : "被动 · 暂无");
    const bossVisible = state.bossActive && state.bossMaxHp > 0 && state.bossHp > 0;
    this.bossBarBack.setVisible(bossVisible);
    this.bossBarFill.setVisible(bossVisible);
    this.bossBarText.setVisible(bossVisible);
    if (bossVisible) {
      const ratio = Phaser.Math.Clamp(state.bossHp / state.bossMaxHp, 0, 1);
      const phase = ratio > 0.66 ? 1 : ratio > 0.33 ? 2 : 3;
      this.bossBarFill.width = 400 * ratio;
      this.bossBarFill.setFillStyle(phase === 1 ? 0xa65ac1 : phase === 2 ? 0xe0855c : 0xe34e70);
      this.bossBarText.setText(`${state.bossName} · 阶段 ${phase} · ${Math.ceil(state.bossHp)}/${state.bossMaxHp}`);
    }
  }

  setHint(message: string, color = "#a99cb4"): void {
    this.hintText.setText(message).setColor(color);
  }

}
