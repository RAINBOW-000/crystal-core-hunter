import type Phaser from "phaser";
import type { EnemyId } from "../../domain/enemies/EnemyDefinition";
import type { RandomSource } from "../../domain/random/RunRandom";
import type { HostileProjectileSystem } from "../../systems/HostileProjectileSystem";
import type { Enemy } from "../Enemy";
import { CrystalBug } from "./CrystalBug";
import { CrystalHiveBoss } from "./CrystalHiveBoss";
import { CrystalRam } from "./CrystalRam";
import { CrystalSpitter } from "./CrystalSpitter";
import { EliteCrystalBug } from "./EliteCrystalBug";

interface EnemyCreationContext {
  scene: Phaser.Scene;
  projectiles: HostileProjectileSystem;
  random: RandomSource;
}

/** Phaser adapter from stable content IDs to runtime enemy classes. */
export function createEnemy(
  id: EnemyId,
  x: number,
  y: number,
  context: EnemyCreationContext,
  options: { reinforced?: boolean } = {},
): Enemy {
  const { scene, projectiles, random } = context;
  const fire = (originX: number, originY: number, velocityX: number, velocityY: number, damage: number, tint?: number) =>
    projectiles.fire(originX, originY, velocityX, velocityY, damage, tint);
  switch (id) {
    case "crystal-bug": return new CrystalBug(scene, x, y);
    case "crystal-spitter": return new CrystalSpitter(scene, x, y, fire, random);
    case "crystal-ram": return new CrystalRam(scene, x, y, random);
    case "elite-crystal-bug": return new EliteCrystalBug(scene, x, y, options.reinforced);
    case "crystal-hive-boss": return new CrystalHiveBoss(scene, x, y, fire);
  }
}
