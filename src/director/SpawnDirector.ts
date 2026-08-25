import Phaser from "phaser";
import { ROOM_BOUNDS, RUN_CONFIG } from "../config/gameConfig";
import { CrystalHiveBoss } from "../entities/enemies/CrystalHiveBoss";
import { CrystalBug } from "../entities/enemies/CrystalBug";
import { EliteCrystalBug } from "../entities/enemies/EliteCrystalBug";
import { CrystalSpitter } from "../entities/enemies/CrystalSpitter";
import { CrystalRam } from "../entities/enemies/CrystalRam";
import type { Enemy } from "../entities/Enemy";
import type { Player } from "../entities/Player";
import type { HostileProjectileSystem } from "../systems/HostileProjectileSystem";

export class SpawnDirector {
  readonly enemies: Phaser.Physics.Arcade.Group;
  elapsedMs = 0;
  private spawnAccumulator = 0;
  private stopped = false;
  private nextEliteIndex = 0;
  private bossSpawned = false;
  private boss?: CrystalHiveBoss;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly projectiles: HostileProjectileSystem,
    private readonly onBossSpawned: () => void,
  ) {
    this.enemies = scene.physics.add.group();
    scene.physics.add.collider(this.enemies, this.enemies);
    for (let i = 0; i < RUN_CONFIG.initialEnemies; i += 1) this.spawnEnemy();
  }

  update(time: number, delta: number): void {
    if (this.stopped) return;
    this.elapsedMs += delta;
    this.spawnAccumulator += delta;
    this.enemies.getChildren().forEach((child) => (child as Enemy).updateBehavior(time, this.player));

    while (
      this.nextEliteIndex < RUN_CONFIG.eliteSpawnTimesMs.length
      && this.elapsedMs >= RUN_CONFIG.eliteSpawnTimesMs[this.nextEliteIndex]
    ) {
      this.spawnElite(this.nextEliteIndex === RUN_CONFIG.eliteSpawnTimesMs.length - 1);
      this.nextEliteIndex += 1;
    }
    if (!this.bossSpawned && this.elapsedMs >= RUN_CONFIG.durationMs) {
      this.bossSpawned = true;
      this.spawnBoss();
      this.onBossSpawned();
    }

    const progress = this.progress;
    const interval = Phaser.Math.Linear(
      RUN_CONFIG.spawnIntervalMs,
      RUN_CONFIG.minimumSpawnIntervalMs,
      progress,
    );
    const cap = Math.floor(Phaser.Math.Linear(
      RUN_CONFIG.initialEnemyCap,
      RUN_CONFIG.maximumEnemyCap,
      progress,
    ));
    if (this.spawnAccumulator < interval || this.countActive() >= cap) return;

    this.spawnAccumulator = 0;
    const batchSize = 1 + Math.floor(progress * 4);
    for (let i = 0; i < batchSize && this.countActive() < cap; i += 1) this.spawnEnemy();
  }

  stop(): void {
    this.stopped = true;
    this.enemies.getChildren().forEach((child) => (child as Enemy).setVelocity(0, 0));
  }

  countActive(): number {
    return this.enemies.countActive(true);
  }

  get progress(): number {
    return Phaser.Math.Clamp(this.elapsedMs / RUN_CONFIG.durationMs, 0, 1);
  }

  get remainingMs(): number {
    return Math.max(0, RUN_CONFIG.durationMs - this.elapsedMs);
  }

  get bossHp(): number { return Math.max(0, this.boss?.hp ?? 0); }
  get bossMaxHp(): number { return this.boss?.maxHp ?? 0; }

  spawnBossForQa(): void {
    if (this.bossSpawned) return;
    this.bossSpawned = true;
    this.spawnBoss();
    this.onBossSpawned();
  }

  spawnArchetypesForQa(): void {
    const spitterPosition = this.randomEdgePosition();
    const ramPosition = this.randomEdgePosition();
    this.enemies.add(new CrystalSpitter(
      this.scene, spitterPosition.x, spitterPosition.y,
      (x, y, vx, vy, damage, tint) => this.projectiles.fire(x, y, vx, vy, damage, tint),
    ));
    this.enemies.add(new CrystalRam(this.scene, ramPosition.x, ramPosition.y));
  }

  private spawnEnemy(): void {
    const position = this.randomEdgePosition();
    const roll = Math.random();
    if (this.progress >= 0.58 && roll < 0.18) {
      this.enemies.add(new CrystalRam(this.scene, position.x, position.y));
    } else if (this.progress >= 0.25 && roll < (this.progress >= 0.58 ? 0.46 : 0.24)) {
      this.enemies.add(new CrystalSpitter(
        this.scene, position.x, position.y,
        (x, y, vx, vy, damage, tint) => this.projectiles.fire(x, y, vx, vy, damage, tint),
      ));
    } else {
      this.enemies.add(new CrystalBug(this.scene, position.x, position.y));
    }
  }

  private spawnElite(reinforced: boolean): void {
    const position = this.randomEdgePosition();
    this.enemies.add(new EliteCrystalBug(this.scene, position.x, position.y, reinforced));
  }

  private spawnBoss(): void {
    const position = this.randomEdgePosition();
    this.boss = new CrystalHiveBoss(
      this.scene, position.x, position.y,
      (x, y, vx, vy, damage, tint) => this.projectiles.fire(x, y, vx, vy, damage, tint),
    );
    this.enemies.add(this.boss);
  }

  private randomEdgePosition(): { x: number; y: number } {
    const edge = Phaser.Math.Between(0, 3);
    const margin = 18;
    let x: number;
    let y: number;
    if (edge === 0 || edge === 1) {
      x = edge === 0 ? ROOM_BOUNDS.x + margin : ROOM_BOUNDS.x + ROOM_BOUNDS.width - margin;
      y = Phaser.Math.Between(ROOM_BOUNDS.y + margin, ROOM_BOUNDS.y + ROOM_BOUNDS.height - margin);
    } else {
      x = Phaser.Math.Between(ROOM_BOUNDS.x + margin, ROOM_BOUNDS.x + ROOM_BOUNDS.width - margin);
      y = edge === 2 ? ROOM_BOUNDS.y + margin : ROOM_BOUNDS.y + ROOM_BOUNDS.height - margin;
    }
    return { x, y };
  }
}
