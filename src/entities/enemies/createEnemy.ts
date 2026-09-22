import type Phaser from "phaser";
import type { EnemyId } from "../../domain/enemies/EnemyDefinition";
import type { RandomSource } from "../../domain/random/RunRandom";
import type { HostileProjectileSystem } from "../../systems/HostileProjectileSystem";
import type { CombatVfxSystem } from "../../systems/CombatVfxSystem";
import type { StageDefinition } from "../../content/stages/stageCatalog";
import type { Enemy } from "../Enemy";
import { CrystalBug } from "./CrystalBug";
import { CrystalHiveBoss } from "./CrystalHiveBoss";
import { CrystalRam } from "./CrystalRam";
import { CrystalSpitter } from "./CrystalSpitter";
import { EliteCrystalBug } from "./EliteCrystalBug";
import { FrostTrailBeast } from "./FrostTrailBeast";
import { IceVeinCaller } from "./IceVeinCaller";
import { FrostRidgeHunter } from "./FrostRidgeHunter";
import { IceArmorColossus } from "./IceArmorColossus";

interface EnemyCreationContext {
  scene: Phaser.Scene;
  projectiles: HostileProjectileSystem;
  random: RandomSource;
  vfx: CombatVfxSystem;
  modifiers?: StageDefinition["returningEnemyModifiers"];
  createIce: (x: number, y: number) => void;
  callIce: (x: number, y: number, delayMs?: number) => void;
}

/** Phaser adapter from stable content IDs to runtime enemy classes. */
export function createEnemy(
  id: EnemyId,
  x: number,
  y: number,
  context: EnemyCreationContext,
  options: { reinforced?: boolean } = {},
): Enemy {
  const { scene, projectiles, random, vfx, modifiers, createIce, callIce } = context;
  const fire = (originX: number, originY: number, velocityX: number, velocityY: number, damage: number, tint?: number) =>
    projectiles.fire(originX, originY, velocityX, velocityY, damage, tint);
  switch (id) {
    case "crystal-bug": return new CrystalBug(scene, x, y, modifiers);
    case "crystal-spitter": return new CrystalSpitter(scene, x, y, fire, vfx, random, modifiers);
    case "crystal-ram": return new CrystalRam(scene, x, y, vfx, random, modifiers);
    case "elite-crystal-bug": return new EliteCrystalBug(scene, x, y, options.reinforced, modifiers);
    case "crystal-hive-boss": return new CrystalHiveBoss(scene, x, y, fire, vfx, modifiers);
    case "frost-trail-beast": return new FrostTrailBeast(scene, x, y, createIce);
    case "ice-vein-caller": return new IceVeinCaller(scene, x, y, callIce);
    case "frost-ridge-hunter": return new FrostRidgeHunter(scene, x, y, createIce, vfx);
    case "ice-armor-colossus": return new IceArmorColossus(scene, x, y, callIce, vfx);
    default: throw new Error(`Enemy runtime is not implemented for: ${id}`);
  }
}
