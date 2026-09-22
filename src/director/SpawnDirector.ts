import Phaser from "phaser";
import { getStageEnemyCap, getStageSpawnInterval, type StageDefinition } from "../content/stages/stageCatalog";
import { ROOM_BOUNDS } from "../config/gameConfig";
import { pickWaveEnemy, type EnemyId } from "../domain/enemies/EnemyDefinition";
import { randomBetween, type RandomSource } from "../domain/random/RunRandom";
import type { Enemy } from "../entities/Enemy";
import { createEnemy } from "../entities/enemies/createEnemy";
import type { Player } from "../entities/Player";
import type { HostileProjectileSystem } from "../systems/HostileProjectileSystem";
import type { CombatVfxSystem } from "../systems/CombatVfxSystem";
import type { FrostHazardSystem } from "../systems/FrostHazardSystem";

interface SpawnRandomSources {
  selection: RandomSource;
  position: RandomSource;
  behavior: RandomSource;
}

export class SpawnDirector {
  readonly enemies: Phaser.Physics.Arcade.Group;
  elapsedMs = 0;
  private spawnAccumulator = 0;
  private stopped = false;
  private nextEliteIndex = 0;
  private bossSpawned = false;
  private boss?: Enemy;
  private nextSurgeIndex = 0;
  private pendingSurgeEdge?: 0 | 1 | 2 | 3;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly projectiles: HostileProjectileSystem,
    private readonly vfx: CombatVfxSystem,
    private readonly stage: StageDefinition,
    private readonly frost: FrostHazardSystem,
    private readonly random: SpawnRandomSources,
    private readonly onBossSpawned: () => void,
  ) {
    this.enemies = scene.physics.add.group();
    scene.physics.add.collider(this.enemies, this.enemies);
    for (let index = 0; index < stage.spawnPlan.initialEnemies; index += 1) this.spawnWaveEnemy();
  }

  update(time: number, delta: number): void {
    if (this.stopped) return;
    this.elapsedMs += delta;
    this.spawnAccumulator += delta;
    this.enemies.getChildren().forEach((child) => (child as Enemy).updateBehavior(time, this.player));
    this.updateEarlySurges();

    while (
      this.nextEliteIndex < this.stage.spawnPlan.eliteSpawns.length
      && this.elapsedMs >= this.stage.spawnPlan.eliteSpawns[this.nextEliteIndex].atMs
    ) {
      const spawn = this.stage.spawnPlan.eliteSpawns[this.nextEliteIndex];
      this.spawn(spawn.enemyId, { reinforced: spawn.reinforced });
      this.nextEliteIndex += 1;
    }
    if (!this.bossSpawned && this.elapsedMs >= this.stage.spawnPlan.bossSpawn.atMs) {
      this.bossSpawned = true;
      this.spawnBoss();
      this.onBossSpawned();
    }

    const progress = this.progress;
    const interval = getStageSpawnInterval(this.stage, this.elapsedMs);
    const cap = getStageEnemyCap(this.stage, this.elapsedMs);
    if (this.spawnAccumulator < interval || this.countActive() >= cap) return;

    this.spawnAccumulator = 0;
    const batchSize = 1 + Math.floor(progress * (this.stage.spawnPlan.maximumBatchSize - 1));
    for (let index = 0; index < batchSize && this.countActive() < cap; index += 1) this.spawnWaveEnemy();
  }

  stop(): void {
    this.stopped = true;
    this.enemies.getChildren().forEach((child) => (child as Enemy).setVelocity(0, 0));
  }

  countActive(): number { return this.enemies.countActive(true); }

  get progress(): number {
    return Phaser.Math.Clamp(this.elapsedMs / this.stage.spawnPlan.durationMs, 0, 1);
  }

  get remainingMs(): number { return Math.max(0, this.stage.spawnPlan.durationMs - this.elapsedMs); }
  get bossHp(): number { return Math.max(0, this.boss?.hp ?? 0); }
  get bossMaxHp(): number { return this.boss?.maxHp ?? 0; }

  spawnBossForQa(): void {
    if (this.bossSpawned) return;
    this.bossSpawned = true;
    this.boss = this.spawn(this.stage.spawnPlan.bossSpawn.enemyId, {}, {
      x: this.player.x + 190,
      y: this.player.y + 110,
    });
    this.onBossSpawned();
  }

  spawnArchetypesForQa(): void {
    if (this.stage.number === 2) {
      this.spawn("frost-trail-beast", {}, { x: this.player.x - 190, y: this.player.y - 90 });
      this.spawn("ice-vein-caller", {}, { x: this.player.x + 180, y: this.player.y - 90 });
      this.spawn("frost-ridge-hunter", {}, { x: this.player.x - 190, y: this.player.y + 110 });
      return;
    }
    this.spawn("crystal-bug", {}, { x: this.player.x - 190, y: this.player.y - 90 });
    this.spawn("crystal-spitter", {}, { x: this.player.x + 180, y: this.player.y - 90 });
    this.spawn("crystal-ram", {}, { x: this.player.x - 190, y: this.player.y + 110 });
    this.spawn("elite-crystal-bug", {}, { x: this.player.x, y: this.player.y + 150 });
  }

  private spawnWaveEnemy(): void {
    this.spawn(pickWaveEnemy(this.stage.spawnPlan, this.progress, this.random.selection));
  }

  private spawnBoss(): void {
    this.boss = this.spawn(this.stage.spawnPlan.bossSpawn.enemyId);
  }

  private updateEarlySurges(): void {
    const surge = this.stage.earlyPressure.surges[this.nextSurgeIndex];
    if (!surge) return;
    if (this.pendingSurgeEdge === undefined && this.elapsedMs >= surge.atMs - this.stage.earlyPressure.telegraphMs) {
      this.pendingSurgeEdge = Math.floor(this.random.position() * 4) as 0 | 1 | 2 | 3;
      this.showSurgeWarning(this.pendingSurgeEdge);
    }
    if (this.pendingSurgeEdge === undefined || this.elapsedMs < surge.atMs) return;
    this.spawnFormation(surge.enemyIds, this.pendingSurgeEdge);
    this.pendingSurgeEdge = undefined;
    this.nextSurgeIndex += 1;
  }

  private spawnFormation(enemyIds: readonly EnemyId[], edge: 0 | 1 | 2 | 3): void {
    const direction = edge === 0 ? { x: 0, y: -1 } : edge === 1 ? { x: 1, y: 0 } : edge === 2 ? { x: 0, y: 1 } : { x: -1, y: 0 };
    const tangent = direction.x === 0 ? { x: 1, y: 0 } : { x: 0, y: 1 };
    enemyIds.forEach((id, index) => {
      const offset = enemyIds.length === 1 ? 0 : (index / (enemyIds.length - 1) - 0.5) * this.stage.earlyPressure.formationWidth;
      this.spawn(id, {}, {
        x: Phaser.Math.Clamp(this.player.x + direction.x * 600 + tangent.x * offset, ROOM_BOUNDS.x + 30, ROOM_BOUNDS.x + ROOM_BOUNDS.width - 30),
        y: Phaser.Math.Clamp(this.player.y + direction.y * 600 + tangent.y * offset, ROOM_BOUNDS.y + 30, ROOM_BOUNDS.y + ROOM_BOUNDS.height - 30),
      });
    });
  }

  private showSurgeWarning(edge: 0 | 1 | 2 | 3): void {
    const camera = this.scene.cameras.main;
    const horizontal = edge === 0 || edge === 2;
    const warning = this.scene.add.rectangle(
      horizontal ? camera.width / 2 : edge === 1 ? camera.width - 8 : 8,
      horizontal ? edge === 2 ? camera.height - 8 : 8 : camera.height / 2,
      horizontal ? camera.width : 16,
      horizontal ? 16 : camera.height,
      this.stage.palette.crystal,
      0.15,
    ).setScrollFactor(0).setDepth(89);
    this.scene.tweens.add({
      targets: warning,
      alpha: 0.85,
      duration: this.stage.earlyPressure.telegraphMs / 6,
      yoyo: true,
      repeat: 2,
      onComplete: () => warning.destroy(),
    });
  }

  private spawn(id: EnemyId, options: { reinforced?: boolean } = {}, fixedPosition?: { x: number; y: number }): Enemy {
    const position = fixedPosition ?? this.randomEdgePosition();
    const enemy = createEnemy(id, position.x, position.y, {
      scene: this.scene,
      projectiles: this.projectiles,
      random: this.random.behavior,
      vfx: this.vfx,
      modifiers: this.stage.number === 2 ? this.stage.returningEnemyModifiers : undefined,
      createIce: (x, y) => this.frost.createIcePatch(x, y),
      callIce: (x, y, delayMs) => this.frost.callIce(x, y, delayMs),
    }, options);
    this.enemies.add(enemy);
    return enemy;
  }

  private randomEdgePosition(): { x: number; y: number } {
    const angle = this.random.position() * Math.PI * 2;
    const distance = randomBetween(this.random.position, 540, 650);
    const margin = 30;
    return {
      x: Phaser.Math.Clamp(this.player.x + Math.cos(angle) * distance, ROOM_BOUNDS.x + margin, ROOM_BOUNDS.x + ROOM_BOUNDS.width - margin),
      y: Phaser.Math.Clamp(this.player.y + Math.sin(angle) * distance, ROOM_BOUNDS.y + margin, ROOM_BOUNDS.y + ROOM_BOUNDS.height - margin),
    };
  }
}
