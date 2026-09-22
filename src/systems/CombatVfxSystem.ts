import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../config/gameConfig";

export type VfxLevel = "low" | "medium" | "high";

const LEVELS: readonly VfxLevel[] = ["low", "medium", "high"];
const LEVEL_LABELS: Record<VfxLevel, string> = {
  low: "低",
  medium: "中",
  high: "高",
};
const DECORATION_LIMITS: Record<VfxLevel, number> = {
  low: 28,
  medium: 56,
  high: 96,
};
const STORAGE_KEY = "crystal-core-hunter.vfx-level";

/** Centralized combat presentation, pooling and accessibility settings. */
export class CombatVfxSystem {
  private level: VfxLevel;
  private readonly pixels: Phaser.GameObjects.Rectangle[] = [];
  private readonly slash: Phaser.GameObjects.Arc;
  private readonly settingText: Phaser.GameObjects.Text;
  private readonly settingKey: Phaser.Input.Keyboard.Key;
  private nextShakeAt = 0;
  private restoreTimer?: number;
  private timeScaleBeforeStop = 1;
  private tweenScaleBeforeStop = 1;
  private physicsScaleBeforeStop = 1;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly onLevelChanged?: (level: VfxLevel) => void,
  ) {
    this.level = this.readLevel();
    if (!scene.anims.exists("vfx-charge-pulse")) {
      scene.anims.create({
        key: "vfx-charge-pulse",
        frames: [1, 2, 3, 2].map((frame) => ({ key: `vfx-charge-${frame}` })),
        frameRate: 12,
        repeat: -1,
      });
    }
    for (let index = 0; index < DECORATION_LIMITS.high; index += 1) {
      this.pixels.push(
        scene.add.rectangle(0, 0, 4, 4, 0xffffff)
          .setDepth(40)
          .setActive(false)
          .setVisible(false),
      );
    }
    this.slash = scene.add.arc(0, 0, 72, -50, 35, false, 0xf4d35e, 0.22)
      .setStrokeStyle(4, 0xffef9f, 0.95)
      .setDepth(38)
      .setVisible(false);
    this.settingText = scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 28, "", {
      fontFamily: "Microsoft YaHei",
      fontSize: "11px",
      color: "#8f839b",
      backgroundColor: "#17131fcc",
      padding: { x: 5, y: 3 },
    }).setOrigin(0.5).setDepth(80).setScrollFactor(0);
    this.settingText
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", () => this.cycleLevel());
    this.settingKey = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.V);
    this.refreshSettingText();
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.settingKey)) this.cycleLevel();
  }

  get currentLevel(): VfxLevel { return this.level; }

  showSwordSlash(x: number, y: number, angle: number, range: number, combo: number): void {
    this.scene.tweens.killTweensOf(this.slash);
    const finisher = combo === 3;
    const reverse = combo === 2;
    this.slash
      .setPosition(x, y)
      .setRadius(range)
      .setStartAngle(finisher ? -38 : reverse ? -30 : -55)
      .setEndAngle(finisher ? 38 : reverse ? 58 : 30)
      .setRotation(angle + (reverse ? 0.22 : -0.22))
      .setFillStyle(finisher ? 0x76f5dc : 0xf4d35e, finisher ? 0.24 : 0.2)
      .setStrokeStyle(finisher ? 6 : 4, finisher ? 0xbaffef : 0xffef9f, 0.95)
      .setScale(finisher ? 0.72 : 0.78)
      .setAlpha(1)
      .setVisible(true);
    this.scene.tweens.add({
      targets: this.slash,
      rotation: angle + (reverse ? -0.16 : 0.16),
      scale: 1,
      alpha: 0,
      duration: finisher ? 175 : 135,
      ease: finisher ? "Cubic.Out" : "Quad.Out",
      onComplete: () => this.slash.setVisible(false),
    });
    if (finisher) {
      const impactX = x + Math.cos(angle) * range * 0.78;
      const impactY = y + Math.sin(angle) * range * 0.78;
      this.showGroundCrack(impactX, impactY, angle, 36);
    }
  }

  showHitBurst(x: number, y: number, awayAngle: number, heavy = false): void {
    const countByLevel: Record<VfxLevel, number> = heavy
      ? { low: 4, medium: 7, high: 11 }
      : { low: 2, medium: 4, high: 7 };
    const count = countByLevel[this.level];
    for (let index = 0; index < count; index += 1) {
      const spread = Phaser.Math.FloatBetween(-0.8, 0.8);
      const distance = Phaser.Math.Between(heavy ? 22 : 14, heavy ? 46 : 31);
      this.launchPixel(
        x,
        y,
        x + Math.cos(awayAngle + spread) * distance,
        y + Math.sin(awayAngle + spread) * distance,
        index % 3 === 0 ? 0xffd166 : 0x6af0d5,
        heavy ? 5 : 4,
        heavy ? 250 : 190,
      );
    }
  }

  commitImpact(heavy: boolean): void {
    const time = this.scene.time.now;
    if (time >= this.nextShakeAt) {
      this.scene.cameras.main.shake(heavy ? 75 : 48, heavy ? 0.0042 : 0.002);
      this.nextShakeAt = time + 45;
    }
    this.hitStop(heavy ? 55 : 25);
  }

  showSpitterCharge(x: number, y: number, angle: number, duration: number): void {
    const core = this.scene.add.sprite(x, y, "vfx-charge-1")
      .setDepth(22)
      .setScale(0.8)
      .play("vfx-charge-pulse");
    const ring = this.scene.add.circle(x, y, 12, 0x7af2df, 0.13)
      .setStrokeStyle(2, 0xd986ff, 0.9)
      .setDepth(21)
      .setScale(0.55);
    const aim = this.scene.add.rectangle(
      x + Math.cos(angle) * 22,
      y + Math.sin(angle) * 22,
      28,
      3,
      0xf3c9ff,
      0.65,
    ).setRotation(angle).setDepth(20);
    this.scene.tweens.add({
      targets: ring,
      scale: 1.25,
      alpha: 0.9,
      duration,
      ease: "Sine.In",
      onComplete: () => ring.destroy(),
    });
    this.scene.tweens.add({
      targets: aim,
      scaleX: 0.25,
      alpha: 0.95,
      duration,
      ease: "Sine.In",
      onComplete: () => aim.destroy(),
    });
    this.scene.tweens.add({
      targets: core,
      scale: 1.35,
      alpha: 0.2,
      duration,
      ease: "Sine.In",
      onComplete: () => core.destroy(),
    });
  }

  showSpitterMuzzle(x: number, y: number, angle: number): void {
    const muzzleX = x + Math.cos(angle) * 15;
    const muzzleY = y + Math.sin(angle) * 15;
    for (let index = 0; index < (this.level === "high" ? 7 : this.level === "medium" ? 5 : 3); index += 1) {
      const spread = Phaser.Math.FloatBetween(-0.55, 0.55);
      const distance = Phaser.Math.Between(15, 34);
      this.launchPixel(
        muzzleX,
        muzzleY,
        muzzleX + Math.cos(angle + spread) * distance,
        muzzleY + Math.sin(angle + spread) * distance,
        index % 2 ? 0xd986ff : 0x78f3da,
        3,
        170,
      );
    }
  }

  showProjectileTrail(x: number, y: number, tint: number): void {
    if (this.level === "low") return;
    this.launchPixel(
      x,
      y,
      x + Phaser.Math.Between(-4, 4),
      y + Phaser.Math.Between(-4, 4),
      tint,
      this.level === "high" ? 3 : 2,
      this.level === "high" ? 170 : 120,
    );
  }

  showProjectileShatter(x: number, y: number, tint: number, strong: boolean): void {
    const count = strong
      ? (this.level === "high" ? 10 : this.level === "medium" ? 7 : 4)
      : (this.level === "high" ? 6 : this.level === "medium" ? 4 : 2);
    for (let index = 0; index < count; index += 1) {
      const angle = Phaser.Math.FloatBetween(0, Phaser.Math.PI2);
      const distance = Phaser.Math.Between(10, strong ? 38 : 24);
      this.launchPixel(x, y, x + Math.cos(angle) * distance, y + Math.sin(angle) * distance, tint, index % 3 ? 3 : 5, 210);
    }
    if (strong) this.requestFlash(0xd986ff);
  }

  showBossRadialTelegraph(x: number, y: number, count: number, offset: number, duration: number, tint: number): void {
    const core = this.scene.add.sprite(x, y, "vfx-charge-1")
      .setTint(tint)
      .setDepth(23)
      .setScale(1.35)
      .play("vfx-charge-pulse");
    const ring = this.scene.add.circle(x, y, 47, tint, 0.08)
      .setStrokeStyle(3, tint, 0.82)
      .setDepth(20)
      .setScale(0.72);
    const markers: Phaser.GameObjects.Rectangle[] = [];
    for (let index = 0; index < count; index += 1) {
      const angle = offset + index * Phaser.Math.PI2 / count;
      markers.push(this.scene.add.rectangle(
        x + Math.cos(angle) * 54,
        y + Math.sin(angle) * 54,
        11,
        4,
        tint,
        0.78,
      ).setRotation(angle).setDepth(20));
    }
    this.scene.tweens.add({
      targets: ring,
      scale: 1,
      alpha: 0.65,
      duration,
      ease: "Sine.In",
      onComplete: () => ring.destroy(),
    });
    this.scene.tweens.add({
      targets: markers,
      alpha: { from: 0.28, to: 0.95 },
      scaleX: { from: 1.5, to: 0.6 },
      duration: Math.max(80, duration / 3),
      yoyo: true,
      repeat: 1,
      onComplete: () => markers.forEach((marker) => marker.destroy()),
    });
    this.scene.tweens.add({
      targets: core,
      scale: 2.25,
      alpha: 0.25,
      duration,
      ease: "Sine.In",
      onComplete: () => core.destroy(),
    });
  }

  showBossAimedTelegraph(x: number, y: number, angle: number, duration: number, phase: number): void {
    const length = 250;
    const width = phase === 2 ? 46 : 68;
    const graphics = this.scene.add.graphics().setDepth(18);
    graphics.fillStyle(0xffa76d, 0.1);
    graphics.lineStyle(2, 0xffcf70, 0.7);
    const points = [
      new Phaser.Math.Vector2(x, y),
      new Phaser.Math.Vector2(x + Math.cos(angle - 0.16) * length, y + Math.sin(angle - 0.16) * length),
      new Phaser.Math.Vector2(x + Math.cos(angle) * (length + width), y + Math.sin(angle) * (length + width)),
      new Phaser.Math.Vector2(x + Math.cos(angle + 0.16) * length, y + Math.sin(angle + 0.16) * length),
    ];
    graphics.fillPoints(points, true).strokePoints(points, true);
    graphics.setAlpha(0.25);
    this.scene.tweens.add({
      targets: graphics,
      alpha: 0.82,
      duration,
      ease: "Sine.In",
      onComplete: () => graphics.destroy(),
    });
  }

  showBossVolleyRelease(x: number, y: number, tint: number): void {
    const ring = this.scene.add.circle(x, y, 42, tint, 0.18).setStrokeStyle(4, 0xffefcf, 0.8).setDepth(21);
    this.scene.tweens.add({ targets: ring, scale: 2, alpha: 0, duration: 280, onComplete: () => ring.destroy() });
    this.scene.cameras.main.shake(80, 0.0035);
  }

  showBossChargeLane(x: number, y: number, angle: number, duration: number): void {
    const length = 390;
    const lane = this.scene.add.rectangle(
      x + Math.cos(angle) * length * 0.5,
      y + Math.sin(angle) * length * 0.5,
      length,
      54,
      0xff5f78,
      0.09,
    ).setStrokeStyle(2, 0xff8a9b, 0.72).setRotation(angle).setDepth(17);
    this.scene.tweens.add({
      targets: lane,
      alpha: { from: 0.12, to: 0.52 },
      scaleY: { from: 1, to: 0.72 },
      duration,
      ease: "Sine.In",
      onComplete: () => lane.destroy(),
    });
  }

  showBossPhaseTransition(x: number, y: number, phase: number): void {
    const tint = phase === 2 ? 0xffa76d : 0xff5f78;
    for (let index = 0; index < 3; index += 1) {
      const ring = this.scene.add.circle(x, y, 38 + index * 9, tint, 0.08)
        .setStrokeStyle(3, tint, 0.9)
        .setDepth(22)
        .setScale(0.35)
        .setAlpha(0);
      this.scene.tweens.add({
        targets: ring,
        scale: 1.8 + index * 0.18,
        alpha: { from: 0.85, to: 0 },
        delay: index * 80,
        duration: 470,
        ease: "Cubic.Out",
        onComplete: () => ring.destroy(),
      });
    }
    this.scene.cameras.main.flash(90, phase === 2 ? 180 : 230, 70, 105, false);
    this.scene.cameras.main.shake(180, phase === 2 ? 0.008 : 0.011);
  }

  showCrossbowAim(x: number, y: number, angle: number, length: number, charged: boolean): void {
    const guide = this.scene.add.rectangle(x + Math.cos(angle) * length * 0.5, y + Math.sin(angle) * length * 0.5, length, charged ? 4 : 2, charged ? 0xffd76b : 0x83f6e3, charged ? 0.32 : 0.2)
      .setRotation(angle).setDepth(18);
    this.scene.tweens.add({ targets: guide, alpha: charged ? 0.72 : 0.48, scaleX: { from: 0.25, to: 1 }, duration: 50, ease: "Quad.Out", onComplete: () => guide.destroy() });
  }

  showCrossbowShot(x: number, y: number, angle: number, length: number, charged: boolean): void {
    const beam = this.scene.add.rectangle(x + Math.cos(angle) * length * 0.5, y + Math.sin(angle) * length * 0.5, length, charged ? 7 : 3, charged ? 0xffe59a : 0x80f4dc, 0.92)
      .setRotation(angle).setDepth(37);
    this.scene.tweens.add({ targets: beam, scaleY: 0.2, alpha: 0, duration: charged ? 150 : 105, onComplete: () => beam.destroy() });
    if (charged) this.requestFlash(0xffd76b);
  }

  showCrossbowImpact(x: number, y: number, angle: number, charged: boolean): void {
    const count = charged ? (this.level === "high" ? 9 : 6) : (this.level === "high" ? 5 : 3);
    for (let index = 0; index < count; index += 1) {
      const spread = Phaser.Math.FloatBetween(-1.05, 1.05);
      const distance = Phaser.Math.Between(12, charged ? 38 : 25);
      this.launchPixel(x, y, x + Math.cos(angle + spread) * distance, y + Math.sin(angle + spread) * distance, index % 2 ? 0x77efd8 : 0xffd76b, charged ? 5 : 3, 190);
    }
  }

  showCrossbowMark(x: number, y: number, marks: number): void {
    const ring = this.scene.add.circle(x, y, 13 + Math.min(marks, 6), 0xd986ff, 0.06).setStrokeStyle(2, 0xf2c8ff, 0.82).setDepth(36).setScale(0.6);
    this.scene.tweens.add({ targets: ring, scale: 1, alpha: 0, duration: 260, ease: "Cubic.Out", onComplete: () => ring.destroy() });
  }

  showCrossbowSplit(x1: number, y1: number, x2: number, y2: number): void {
    this.showLine(x1, y1, x2, y2, 0x9cfbea, 3, 120);
  }

  showDrillContact(x: number, y: number, angle: number): void {
    for (let index = 0; index < (this.level === "high" ? 5 : 3); index += 1) {
      const sparkAngle = angle + Math.PI + Phaser.Math.FloatBetween(-0.7, 0.7);
      const distance = Phaser.Math.Between(10, 24);
      this.launchPixel(x, y, x + Math.cos(sparkAngle) * distance, y + Math.sin(sparkAngle) * distance, index % 2 ? 0xffd76b : 0x82f1dd, 3, 150);
    }
  }

  showDrillLaunch(x1: number, y1: number, x2: number, y2: number): void {
    this.showLine(x1, y1, x2, y2, 0xffd76b, 4, 180);
  }

  showDrillBlast(x: number, y: number, strong: boolean): void {
    const radius = strong ? 68 : 48;
    const ring = this.scene.add.circle(x, y, radius, 0xffc85c, 0.18).setStrokeStyle(strong ? 5 : 3, 0xffefaa, 0.92).setDepth(36).setScale(0.25);
    this.scene.tweens.add({ targets: ring, scale: 1, alpha: 0, duration: strong ? 300 : 220, ease: "Cubic.Out", onComplete: () => ring.destroy() });
    this.showHitBurst(x, y, 0, strong);
    if (strong) this.commitImpact(true);
  }

  showStaffBolt(x1: number, y1: number, x2: number, y2: number, overload: boolean): void {
    this.showLine(x1, y1, x2, y2, overload ? 0xffcb66 : 0xbb83ff, overload ? 7 : 4, overload ? 180 : 130);
    if (overload) this.requestFlash(0xd986ff);
  }

  showStaffChain(x1: number, y1: number, x2: number, y2: number, conducting: boolean): void {
    this.showLine(x1, y1, x2, y2, conducting ? 0x72f4dc : 0xd294ff, conducting ? 4 : 3, conducting ? 180 : 130);
  }

  showStaffSeed(x: number, y: number, radius: number, duration: number): void {
    const field = this.scene.add.circle(x, y, radius, 0x9c69df, 0.12).setStrokeStyle(2, 0xdeb8ff, 0.72).setDepth(19).setScale(0.25);
    this.scene.tweens.add({ targets: field, scale: 1, alpha: { from: 0.5, to: 0.08 }, duration, ease: "Sine.Out", onComplete: () => field.destroy() });
  }

  showStaffSeedPulse(x: number, y: number, radius: number, collapse: boolean): void {
    const pulse = this.scene.add.circle(x, y, radius, collapse ? 0xffca6c : 0xae77eb, collapse ? 0.22 : 0.1).setStrokeStyle(collapse ? 5 : 3, collapse ? 0xffefb0 : 0xe1bfff, 0.9).setDepth(35).setScale(collapse ? 1 : 0.45);
    this.scene.tweens.add({ targets: pulse, scale: collapse ? 0.12 : 1, alpha: 0, duration: collapse ? 190 : 240, ease: collapse ? "Quad.In" : "Cubic.Out", onComplete: () => pulse.destroy() });
    if (collapse) this.commitImpact(true);
  }

  showStaffDomainLink(x1: number, y1: number, x2: number, y2: number, duration: number): void {
    this.showLine(x1, y1, x2, y2, 0xc38cff, 8, duration, 0.18);
  }

  showSeismicTelegraph(x: number, y: number, radius: number, duration: number): void {
    const device = this.scene.add.circle(x, y, 9, 0x5b3527, 1).setStrokeStyle(3, 0xffb071, 0.95).setDepth(34);
    const ring = this.scene.add.circle(x, y, radius, 0xff8b5e, 0.08).setStrokeStyle(2, 0xffb071, 0.75).setDepth(18).setScale(0.25);
    this.scene.tweens.add({ targets: ring, scale: 1, alpha: 0.36, duration, ease: "Sine.In", onComplete: () => ring.destroy() });
    this.scene.tweens.add({ targets: device, scale: { from: 0.7, to: 1.25 }, angle: 90, duration, onComplete: () => device.destroy() });
  }

  showSeismicPulse(x: number, y: number, radius: number, evolved: boolean): void {
    const pulse = this.scene.add.circle(x, y, radius, evolved ? 0xffcb72 : 0xff8b5e, 0.2)
      .setStrokeStyle(evolved ? 5 : 3, 0xffe2aa, 0.92).setDepth(35).setScale(0.12);
    this.scene.tweens.add({ targets: pulse, scale: 1, alpha: 0, duration: 280, ease: "Cubic.Out", onComplete: () => pulse.destroy() });
    if (evolved) this.commitImpact(true);
  }

  showSatelliteLock(x: number, y: number, radius: number, duration: number, evolved: boolean): void {
    const lock = this.scene.add.circle(x, y, radius, 0x72cfff, 0.06)
      .setStrokeStyle(evolved ? 4 : 2, evolved ? 0xffe397 : 0xbfeeff, 0.9).setDepth(34).setScale(1.35);
    const crossA = this.scene.add.rectangle(x, y, radius * 1.6, 2, 0xcdf4ff, 0.7).setDepth(34);
    const crossB = this.scene.add.rectangle(x, y, 2, radius * 1.6, 0xcdf4ff, 0.7).setDepth(34);
    this.scene.tweens.add({ targets: lock, scale: 0.7, alpha: 0.9, duration, ease: "Sine.In", onComplete: () => lock.destroy() });
    this.scene.tweens.add({ targets: [crossA, crossB], alpha: 0, delay: duration * 0.65, duration: duration * 0.35, onComplete: () => { crossA.destroy(); crossB.destroy(); } });
  }

  showSatelliteBeam(x: number, y: number, radius: number, evolved: boolean): void {
    const beam = this.scene.add.rectangle(x, y - 120, radius * (evolved ? 1.15 : 0.72), 260, evolved ? 0xffefad : 0xa9eaff, 0.5).setDepth(37);
    const impact = this.scene.add.circle(x, y, radius, 0xbcefff, 0.24).setStrokeStyle(evolved ? 5 : 3, 0xffffff, 0.95).setDepth(38).setScale(0.2);
    this.scene.tweens.add({ targets: beam, scaleX: { from: 0.25, to: 1 }, alpha: 0, duration: 210, ease: "Quad.Out", onComplete: () => beam.destroy() });
    this.scene.tweens.add({ targets: impact, scale: 1, alpha: 0, duration: 260, ease: "Cubic.Out", onComplete: () => impact.destroy() });
    if (evolved) this.requestFlash(0xc9efff);
  }

  private showLine(x1: number, y1: number, x2: number, y2: number, tint: number, width: number, duration: number, alpha = 0.86): void {
    const length = Phaser.Math.Distance.Between(x1, y1, x2, y2);
    const angle = Phaser.Math.Angle.Between(x1, y1, x2, y2);
    const line = this.scene.add.rectangle((x1 + x2) * 0.5, (y1 + y2) * 0.5, length, width, tint, alpha).setRotation(angle).setDepth(36);
    this.scene.tweens.add({ targets: line, scaleY: 0.15, alpha: 0, duration, ease: "Quad.Out", onComplete: () => line.destroy() });
  }

  private showGroundCrack(x: number, y: number, angle: number, size: number): void {
    const graphics = this.scene.add.graphics().setDepth(17);
    graphics.lineStyle(3, 0xffb85c, 0.82);
    for (let index = -1; index <= 1; index += 1) {
      const branchAngle = angle + index * 0.34 + Phaser.Math.FloatBetween(-0.08, 0.08);
      const branchSize = size * (index === 0 ? 1 : 0.7);
      graphics.beginPath();
      graphics.moveTo(x, y);
      graphics.lineTo(x + Math.cos(branchAngle) * branchSize * 0.55, y + Math.sin(branchAngle) * branchSize * 0.55);
      graphics.lineTo(x + Math.cos(branchAngle + index * 0.12) * branchSize, y + Math.sin(branchAngle + index * 0.12) * branchSize);
      graphics.strokePath();
    }
    this.scene.tweens.add({ targets: graphics, alpha: 0, duration: 380, delay: 80, onComplete: () => graphics.destroy() });
  }

  private launchPixel(
    x: number,
    y: number,
    targetX: number,
    targetY: number,
    tint: number,
    size: number,
    duration: number,
  ): void {
    const pixel = this.acquirePixel();
    if (!pixel) return;
    pixel
      .setPosition(x, y)
      .setSize(size, size)
      .setDisplaySize(size, size)
      .setFillStyle(tint, 1)
      .setAlpha(1)
      .setRotation(Phaser.Math.FloatBetween(-0.4, 0.4))
      .setActive(true)
      .setVisible(true);
    this.scene.tweens.add({
      targets: pixel,
      x: targetX,
      y: targetY,
      alpha: 0,
      scale: 0.35,
      rotation: pixel.rotation + Phaser.Math.FloatBetween(-1.2, 1.2),
      duration,
      ease: "Quad.Out",
      onComplete: () => this.releasePixel(pixel),
    });
  }

  private acquirePixel(): Phaser.GameObjects.Rectangle | undefined {
    const activeLimit = DECORATION_LIMITS[this.level];
    let activeCount = 0;
    let free: Phaser.GameObjects.Rectangle | undefined;
    for (const pixel of this.pixels) {
      if (pixel.active) activeCount += 1;
      else if (!free) free = pixel;
    }
    return activeCount >= activeLimit ? undefined : free;
  }

  private releasePixel(pixel: Phaser.GameObjects.Rectangle): void {
    pixel.setActive(false).setVisible(false).setScale(1).setAlpha(1);
  }

  private requestFlash(tint: number): void {
    if (this.level === "low") return;
    const color = Phaser.Display.Color.IntegerToColor(tint);
    this.scene.cameras.main.flash(this.level === "high" ? 50 : 35, color.red, color.green, color.blue, false);
  }

  private hitStop(duration: number): void {
    if (this.restoreTimer !== undefined) globalThis.clearTimeout(this.restoreTimer);
    else {
      this.timeScaleBeforeStop = this.scene.time.timeScale;
      this.tweenScaleBeforeStop = this.scene.tweens.timeScale;
      this.physicsScaleBeforeStop = this.scene.physics.world.timeScale;
    }
    this.scene.time.timeScale = 0.16;
    this.scene.tweens.timeScale = 0.16;
    this.scene.physics.world.timeScale = 6;
    this.restoreTimer = globalThis.setTimeout(() => this.restoreTimeScale(), duration);
  }

  private restoreTimeScale(): void {
    if (this.restoreTimer === undefined) return;
    this.scene.time.timeScale = this.timeScaleBeforeStop;
    this.scene.tweens.timeScale = this.tweenScaleBeforeStop;
    this.scene.physics.world.timeScale = this.physicsScaleBeforeStop;
    this.restoreTimer = undefined;
  }

  private cycleLevel(): void {
    const nextIndex = (LEVELS.indexOf(this.level) + 1) % LEVELS.length;
    this.level = LEVELS[nextIndex];
    try { localStorage.setItem(STORAGE_KEY, this.level); } catch { /* Storage may be unavailable. */ }
    this.refreshSettingText();
    this.onLevelChanged?.(this.level);
  }

  private readLevel(): VfxLevel {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && LEVELS.includes(stored as VfxLevel)) return stored as VfxLevel;
    } catch { /* Storage may be unavailable. */ }
    return "medium";
  }

  private refreshSettingText(): void {
    this.settingText.setText(`[V] 特效 ${LEVEL_LABELS[this.level]}`);
  }

  private destroy(): void {
    if (this.restoreTimer !== undefined) {
      globalThis.clearTimeout(this.restoreTimer);
      this.restoreTimeScale();
    }
  }
}
