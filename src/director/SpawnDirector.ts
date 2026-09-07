import Phaser from "phaser";
import { ENEMY_SPAWN_PLAN } from "../content/enemies/enemyCatalog";
import { ROOM_BOUNDS } from "../config/gameConfig";
import { pickWaveEnemy, type EnemyId } from "../domain/enemies/EnemyDefinition";
import { randomBetween, type RandomSource } from "../domain/random/RunRandom";
import type { Enemy } from "../entities/Enemy";
import type { CrystalHiveBoss } from "../entities/enemies/CrystalHiveBoss";
import { createEnemy } from "../entities/enemies/createEnemy";
import type { Player } from "../entities/Player";
import type { HostileProjectileSystem } from "../systems/HostileProjectileSystem";

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
  private boss?: CrystalHiveBoss;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly projectiles: HostileProjectileSystem,
    private readonly random: SpawnRandomSources,
    private readonly onBossSpawned: () => void,
  ) {
    this.enemies = scene.physics.add.group();
    scene.physics.add.collider(this.enemies, this.enemies);
    for (let index = 0; index < ENEMY_SPAWN_PLAN.initialEnemies; index += 1) this.spawnWaveEnemy();
  }

  update(time: number, delta: number): void {
    if (this.stopped) return;
    this.elapsedMs += delta;
    this.spawnAccumulator += delta;
    this.enemies.getChildren().forEach((child) => (child as Enemy).updateBehavior(time, this.player));

    while (
      this.nextEliteIndex < ENEMY_SPAWN_PLAN.eliteSpawns.length
      && this.elapsedMs >= ENEMY_SPAWN_PLAN.eliteSpawns[this.nextEliteIndex].atMs
    ) {
      const spawn = ENEMY_SPAWN_PLAN.eliteSpawns[this.nextEliteIndex];
      this.spawn(spawn.enemyId, { reinforced: spawn.reinforced });
      this.nextEliteIndex += 1;
    }
    if (!this.bossSpawned && this.elapsedMs >= ENEMY_SPAWN_PLAN.bossSpawn.atMs) {
      this.bossSpawned = true;
      this.spawnBoss();
      this.onBossSpawned();
    }

    const progress = this.progress;
    const interval = Phaser.Math.Linear(
      ENEMY_SPAWN_PLAN.spawnIntervalMs.start,
      ENEMY_SPAWN_PLAN.spawnIntervalMs.end,
      progress,
    );
    const cap = Math.floor(Phaser.Math.Linear(
      ENEMY_SPAWN_PLAN.enemyCap.start,
      ENEMY_SPAWN_PLAN.enemyCap.end,
      progress,
    ));
    if (this.spawnAccumulator < interval || this.countActive() >= cap) return;

    this.spawnAccumulator = 0;
    const batchSize = 1 + Math.floor(progress * (ENEMY_SPAWN_PLAN.maximumBatchSize - 1));
    for (let index = 0; index < batchSize && this.countActive() < cap; index += 1) this.spawnWaveEnemy();
  }

  stop(): void {
    this.stopped = true;
    this.enemies.getChildren().forEach((child) => (child as Enemy).setVelocity(0, 0));
  }

  countActive(): number { return this.enemies.countActive(true); }

  get progress(): number {
    return Phaser.Math.Clamp(this.elapsedMs / ENEMY_SPAWN_PLAN.durationMs, 0, 1);
  }

  get remainingMs(): number { return Math.max(0, ENEMY_SPAWN_PLAN.durationMs - this.elapsedMs); }
  get bossHp(): number { return Math.max(0, this.boss?.hp ?? 0); }
  get bossMaxHp(): number { return this.boss?.maxHp ?? 0; }

  spawnBossForQa(): void {
    if (this.bossSpawned) return;
    this.bossSpawned = true;
    this.spawnBoss();
    this.onBossSpawned();
  }

  spawnArchetypesForQa(): void {
    this.spawn("crystal-spitter");
    this.spawn("crystal-ram");
  }

  private spawnWaveEnemy(): void {
    this.spawn(pickWaveEnemy(ENEMY_SPAWN_PLAN, this.progress, this.random.selection));
  }

  private spawnBoss(): void {
    this.boss = this.spawn(ENEMY_SPAWN_PLAN.bossSpawn.enemyId) as CrystalHiveBoss;
  }

  private spawn(id: EnemyId, options: { reinforced?: boolean } = {}): Enemy {
    const position = this.randomEdgePosition();
    const enemy = createEnemy(id, position.x, position.y, {
      scene: this.scene,
      projectiles: this.projectiles,
      random: this.random.behavior,
    }, options);
    this.enemies.add(enemy);
    return enemy;
  }

  private randomEdgePosition(): { x: number; y: number } {
    const edge = randomBetween(this.random.position, 0, 3);
    const margin = 18;
    let x: number;
    let y: number;
    if (edge === 0 || edge === 1) {
      x = edge === 0 ? ROOM_BOUNDS.x + margin : ROOM_BOUNDS.x + ROOM_BOUNDS.width - margin;
      y = randomBetween(this.random.position, ROOM_BOUNDS.y + margin, ROOM_BOUNDS.y + ROOM_BOUNDS.height - margin);
    } else {
      x = randomBetween(this.random.position, ROOM_BOUNDS.x + margin, ROOM_BOUNDS.x + ROOM_BOUNDS.width - margin);
      y = edge === 2 ? ROOM_BOUNDS.y + margin : ROOM_BOUNDS.y + ROOM_BOUNDS.height - margin;
    }
    return { x, y };
  }
}
