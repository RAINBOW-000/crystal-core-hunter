import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";
import { CampaignStorage } from "../systems/CampaignStorage";
import { MetaUnlockStorage } from "../systems/MetaUnlockStorage";
import { CHARACTER_CATALOG } from "../content/characters/characterCatalog";
import { WEAPON_DEFINITIONS, WEAPON_EVOLUTIONS } from "../content/weapons/weaponCatalog";
import { DEFAULT_UNLOCKED_ITEM_IDS, ITEM_CATALOG } from "../content/items/itemCatalog";
import { gameAudio } from "../systems/ProceduralAudio";
import { createPrimaryWeaponVisual } from "../entities/Player";

export class MenuScene extends Phaser.Scene {
  private readonly storage = new CampaignStorage();
  private panel?: Phaser.GameObjects.Container;
  private archiveCharacterIndex = 0;
  constructor() { super("menu"); }

  preload(): void {
    if (!this.textures.exists("character-portraits")) this.load.spritesheet("character-portraits", "/art/character-portraits-without-weapons-v1.png?v=1", { frameWidth: 128, frameHeight: 144 });
    [
      ["greatsword-forms", "/art/greatsword-forms-v1.png?v=1"],
      ["crystal-crossbow-forms", "/art/crystal-crossbow-forms-v1.png?v=1"],
      ["fission-staff-forms", "/art/fission-staff-forms-v1.png?v=1"],
    ].forEach(([key, url]) => {
      if (!this.textures.exists(key)) this.load.spritesheet(key, url, { frameWidth: 72, frameHeight: 72 });
    });
  }

  create(data: { suspended?: boolean } = {}): void {
    const profile = this.storage.load();
    gameAudio.setSettings(profile.sound);
    this.cameras.main.setBackgroundColor("#0d1218");
    const g = this.add.graphics();
    for (let y = 0; y < GAME_HEIGHT; y += 32) for (let x = 0; x < GAME_WIDTH; x += 32) {
      const hash = Math.abs((((x / 32) * 73856093) ^ ((y / 32) * 19349663)) >>> 0);
      g.fillStyle(hash % 5 < 2 ? 0x17212a : 0x131b23, 1).fillRect(x, y, 32, 32);
      if (hash % 13 === 0) g.fillStyle(0x283640, 0.8).fillRect(x + 6, y + 19, 18, 3);
    }
    g.lineStyle(7, 0x171820, 0.95).lineBetween(0, 468, GAME_WIDTH, 318);
    for (let x = 0; x < GAME_WIDTH; x += 42) g.fillStyle(0x5a4435, 0.82).fillRect(x, 378 - x * 0.156, 28, 6);
    g.fillStyle(0x9d7cff, 0.9).fillTriangle(85, 190, 112, 72, 137, 190);
    g.fillStyle(0x78f3da, 0.9).fillTriangle(810, 450, 844, 300, 878, 450);
    g.fillStyle(0xd8fff6, 0.6).fillRect(109, 91, 4, 42).fillRect(840, 326, 5, 54);
    this.add.rectangle(GAME_WIDTH / 2, 94, 520, 116, 0x101820, 0.92).setStrokeStyle(3, 0x344a52);
    this.add.text(GAME_WIDTH / 2, 78, "晶核猎人", {
      fontFamily: "Microsoft YaHei", fontSize: "52px", color: "#e7e0cf", fontStyle: "bold",
      stroke: "#0b0d11", strokeThickness: 8,
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, 125, "深入废脉，带回仍在脉动的晶核", {
      fontFamily: "Microsoft YaHei", fontSize: "13px", color: "#83b9b2",
    }).setOrigin(0.5);
    const hasCheckpoint = Boolean(profile.checkpointSeed) || profile.checkpointStage > 1;
    this.button(220, "开始游戏", () => {
      const requestedStage = import.meta.env.DEV ? Number(new URLSearchParams(location.search).get("stage")) : 1;
      const stageNumber = requestedStage === 2 ? 2 : 1;
      const seed = crypto.randomUUID();
      this.storage.save({ ...profile, checkpointStage: stageNumber, checkpointSeed: seed });
      this.scene.stop("game"); this.scene.start("game", { stageNumber, seed });
    });
    this.button(274, data.suspended ? "继续当前战斗" : `继续游戏 · 第 ${profile.checkpointStage} 关`, () => {
      if (data.suspended && this.scene.isPaused("game")) { this.scene.stop(); this.scene.resume("game"); return; }
      const seed = profile.checkpointSeed ?? crypto.randomUUID();
      this.storage.save({ ...profile, checkpointSeed: seed });
      this.scene.start("game", { stageNumber: profile.checkpointStage, seed });
    }, data.suspended || hasCheckpoint);
    this.button(328, "晶核档案", () => this.showArchive());
    this.button(382, "设置", () => this.showSettings());
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 27, "WASD 移动  ·  鼠标瞄准  ·  空格闪避  ·  Esc 暂停", { fontFamily: "Microsoft YaHei", fontSize: "12px", color: "#70879a" }).setOrigin(0.5);
  }

  private button(y: number, label: string, onClick: () => void, enabled = true): void {
    const back = this.add.rectangle(GAME_WIDTH / 2, y, 310, 42, enabled ? 0x1b2931 : 0x151d22, 0.98).setStrokeStyle(2, enabled ? 0x527c7b : 0x354149).setInteractive({ useHandCursor: enabled });
    this.add.rectangle(GAME_WIDTH / 2 - 146, y, 10, 10, enabled ? 0x78f3da : 0x3e4c56).setRotation(Math.PI / 4);
    const text = this.add.text(GAME_WIDTH / 2, y, label, { fontFamily: "Microsoft YaHei", fontSize: "18px", color: enabled ? "#effffb" : "#64727d" }).setOrigin(0.5);
    if (!enabled) return;
    back.on("pointerover", () => back.setFillStyle(0x29434a)); back.on("pointerout", () => back.setFillStyle(0x1b2931));
    back.on("pointerdown", () => { gameAudio.play("button"); onClick(); }); text.setInteractive({ useHandCursor: true }).on("pointerdown", () => { gameAudio.play("button"); onClick(); });
  }

  private showArchive(): void {
    const profile = this.storage.load();
    const unlocked = new Set([...DEFAULT_UNLOCKED_ITEM_IDS, ...new MetaUnlockStorage().load()]);
    const items = ITEM_CATALOG.filter((item) => item.kind !== "evolution" && (unlocked.has(item.id) || (item.minimumStage ?? 99) <= profile.stats.highestStage)).map((item) => item.name).join(" · ") || "尚无";
    const character = CHARACTER_CATALOG[this.archiveCharacterIndex];
    const weapon = WEAPON_DEFINITIONS.find((entry) => entry.id === character.initialWeapon)!;
    const evolutions = WEAPON_EVOLUTIONS.filter((entry) => entry.weaponId === character.initialWeapon);
    const forms = [{ name: "基础", routeId: undefined, description: weapon.description }, ...evolutions.map((entry) => ({ name: entry.name, routeId: entry.routeId, description: entry.description }))];
    const unlockedForms = forms.map((form, index) => index === 0 || profile.unlockedWeaponEvolutions.includes(`${character.initialWeapon}:${form.routeId}`));
    const formIndex = Math.max(0, unlockedForms.lastIndexOf(true));
    this.renderArchive(formIndex, items);
  }

  private renderArchive(formIndex: number, items: string): void {
    const profile = this.storage.load();
    const character = CHARACTER_CATALOG[this.archiveCharacterIndex];
    const weapon = WEAPON_DEFINITIONS.find((entry) => entry.id === character.initialWeapon)!;
    const evolutions = WEAPON_EVOLUTIONS.filter((entry) => entry.weaponId === character.initialWeapon);
    const forms = [{ name: "基础", routeId: undefined, description: weapon.description, requiredItemId: undefined }, ...evolutions];
    const selected = forms[formIndex] ?? forms[0];
    const selectedUnlocked = formIndex === 0 || profile.unlockedWeaponEvolutions.includes(`${character.initialWeapon}:${selected.routeId}`);
    const material = selected.requiredItemId ? ITEM_CATALOG.find((item) => item.id === selected.requiredItemId)?.name : undefined;
    this.panel?.destroy(true);
    const nodes: Phaser.GameObjects.GameObject[] = [];
    const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x05070a, 0.82).setInteractive();
    const back = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 760, 410, 0x111a21, 0.99).setStrokeStyle(2, 0x527c7b);
    nodes.push(shade, back, this.add.text(GAME_WIDTH / 2, 83, "晶核档案 · 武器外观", { fontFamily: "Microsoft YaHei", fontSize: "27px", color: "#78f3da", fontStyle: "bold" }).setOrigin(0.5));
    CHARACTER_CATALOG.forEach((entry, index) => {
      const active = index === this.archiveCharacterIndex;
      const tab = this.add.rectangle(337 + index * 143, 128, 132, 34, active ? entry.color : 0x1b2931, active ? 0.24 : 0.95).setStrokeStyle(2, active ? entry.color : 0x354956).setInteractive({ useHandCursor: true });
      const label = this.add.text(337 + index * 143, 128, entry.name, { fontFamily: "Microsoft YaHei", fontSize: "14px", color: active ? "#ffffff" : "#9fb2c1" }).setOrigin(0.5);
      tab.on("pointerdown", () => { this.archiveCharacterIndex = index; this.showArchive(); });
      label.setInteractive({ useHandCursor: true }).on("pointerdown", () => { this.archiveCharacterIndex = index; this.showArchive(); });
      nodes.push(tab, label);
    });
    const portrait = this.add.sprite(315, 265, "character-portraits", this.archiveCharacterIndex).setScale(1.35);
    const weaponSprite = createPrimaryWeaponVisual(this, character.initialWeapon, selected.routeId).setPosition(365, 280).setScale(character.initialWeapon === "crystal-crossbow" ? 0.95 : 1.12);
    if (!selectedUnlocked) weaponSprite.setTint(0x12171b).setAlpha(0.7);
    nodes.push(portrait, weaponSprite);
    forms.forEach((form, index) => {
      const unlocked = index === 0 || profile.unlockedWeaponEvolutions.includes(`${character.initialWeapon}:${form.routeId}`);
      const x = 500 + index * 120;
      const tab = this.add.rectangle(x, 206, 108, 35, index === formIndex ? 0x31545a : 0x1a252d, 1).setStrokeStyle(2, index === formIndex ? 0x78f3da : 0x354956).setInteractive({ useHandCursor: true });
      const label = this.add.text(x, 206, unlocked ? form.name : "未解锁", { fontFamily: "Microsoft YaHei", fontSize: "12px", color: unlocked ? "#eafaf7" : "#6f7b84" }).setOrigin(0.5);
      tab.on("pointerdown", () => this.renderArchive(index, items));
      label.setInteractive({ useHandCursor: true }).on("pointerdown", () => this.renderArchive(index, items));
      nodes.push(tab, label);
    });
    nodes.push(
      this.add.text(560, 270, `${character.name} · ${weapon.name}\n${selectedUnlocked ? selected.name : `需要材料：${material ?? "未知"}`}\n${selectedUnlocked ? selected.description : "完成该路线进化后永久收录"}`, { fontFamily: "Microsoft YaHei", fontSize: "15px", color: selectedUnlocked ? "#e8f4f7" : "#89959d", align: "center", lineSpacing: 9, wordWrap: { width: 330 } }).setOrigin(0.5),
      this.add.text(GAME_WIDTH / 2, 390, `道具：${items}\n胜利 ${profile.stats.victories} · 最高等级 ${profile.stats.highestLevel} · 最高到达第 ${profile.stats.highestStage} 关`, { fontFamily: "Microsoft YaHei", fontSize: "12px", color: "#9fb2c1", align: "center", wordWrap: { width: 680 } }).setOrigin(0.5),
      this.add.text(GAME_WIDTH / 2, 456, "点击外部区域返回主菜单", { fontFamily: "Microsoft YaHei", fontSize: "13px", color: "#70879a" }).setOrigin(0.5),
    );
    this.panel = this.add.container(0, 0, nodes).setDepth(100);
    shade.on("pointerdown", () => { this.panel?.destroy(true); this.panel = undefined; });
  }

  private showSettings(): void {
    const profile = this.storage.load();
    const render = () => this.showPanel("设置", [
      `音效：${profile.sound.muted ? "已静音" : "开启"}`,
      `主音量：${Math.round(profile.sound.volume * 100)}%`,
      "点击此面板：切换静音   ·   滚轮：调节音量",
    ], () => { profile.sound.muted = !profile.sound.muted; this.storage.save(profile); gameAudio.setSettings(profile.sound); render(); }, (delta) => {
      profile.sound.volume = Phaser.Math.Clamp(profile.sound.volume - Math.sign(delta) * 0.1, 0, 1); profile.sound.muted = false;
      this.storage.save(profile); gameAudio.setSettings(profile.sound); render();
    });
  }

  private showPanel(title: string, lines: string[], click?: () => void, wheel?: (delta: number) => void): void {
    this.panel?.destroy(true);
    const nodes: Phaser.GameObjects.GameObject[] = [];
    const shade = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x05070a, 0.78).setInteractive();
    const back = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 700, 330, 0x111a21, 0.98).setStrokeStyle(2, 0x527c7b).setInteractive();
    nodes.push(shade, back, this.add.text(GAME_WIDTH / 2, 145, title, { fontFamily: "Microsoft YaHei", fontSize: "30px", color: "#78f3da", fontStyle: "bold" }).setOrigin(0.5));
    lines.forEach((line, i) => nodes.push(this.add.text(GAME_WIDTH / 2, 205 + i * 42, line, { fontFamily: "Microsoft YaHei", fontSize: i < 3 ? "14px" : "16px", color: "#e8f4f7", wordWrap: { width: 630 }, align: "center" }).setOrigin(0.5)));
    nodes.push(this.add.text(GAME_WIDTH / 2, 440, "返回主菜单", { fontFamily: "Microsoft YaHei", fontSize: "14px", color: "#9fb2c1" }).setOrigin(0.5));
    this.panel = this.add.container(0, 0, nodes).setDepth(100);
    shade.on("pointerdown", () => { this.panel?.destroy(true); this.panel = undefined; });
    if (click) back.on("pointerdown", click);
    if (wheel) back.on("wheel", (_p: unknown, _dx: number, dy: number) => wheel(dy));
  }
}
