import Phaser from "phaser";
import type { WeaponId, WeaponRefinementStat } from "../domain/weapons/WeaponProgression";
import type { Enemy } from "../entities/Enemy";
import type { Player } from "../entities/Player";
import type { Weapon } from "./Weapon";
import { CrystalCrossbow } from "./weapons/CrystalCrossbow";
import { FissionStaff } from "./weapons/FissionStaff";
import { Greatsword } from "./weapons/Greatsword";
import { OrbitDrill } from "./weapons/OrbitDrill";
import { RefractionSatellite } from "./weapons/RefractionSatellite";
import { SeismicResonator } from "./weapons/SeismicResonator";
import type { CombatVfxSystem } from "../systems/CombatVfxSystem";

export class WeaponRack {
  private readonly weapons = new Map<WeaponId, Weapon>();
  private primaryWeaponId?: WeaponId;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly player: Player,
    private readonly vfx: CombatVfxSystem,
  ) {}

  equip(id: WeaponId): Weapon {
    const existing = this.weapons.get(id);
    if (existing) return existing;
    const weapon = this.createWeapon(id);
    this.weapons.set(id, weapon);
    if (!this.primaryWeaponId) {
      this.primaryWeaponId = id;
      this.player.setEquippedWeapon(id);
    }
    return weapon;
  }

  update(time: number, enemies: Phaser.Physics.Arcade.Group, onEnemyKilled: (enemy: Enemy) => void): void {
    this.weapons.forEach((weapon) => {
      weapon.update(time);
      weapon.tryAttack(time, enemies, onEnemyKilled);
    });
  }

  applySkill(weaponId: WeaponId, skillId: string): void { this.weapons.get(weaponId)?.applySkill(skillId); }
  applyEvolution(weaponId: WeaponId, routeId: string): void {
    this.weapons.get(weaponId)?.applyEvolution(routeId);
    if (weaponId === this.primaryWeaponId) this.player.setWeaponEvolution(weaponId, routeId);
  }
  applyRefinement(weaponId: WeaponId, stat: WeaponRefinementStat): void { this.weapons.get(weaponId)?.applyRefinement(stat); }
  get(id: WeaponId): Weapon | undefined { return this.weapons.get(id); }
  get all(): readonly Weapon[] { return [...this.weapons.values()]; }
  get lastAttackAt(): number { return this.primaryWeaponId ? this.weapons.get(this.primaryWeaponId)?.lastAttackAt ?? -1000 : -1000; }
  get attackFacingDuration(): number {
    if (!this.primaryWeaponId) return 0;
    return { greatsword: 280, "crystal-crossbow": 140, "fission-staff": 190 }[this.primaryWeaponId as "greatsword" | "crystal-crossbow" | "fission-staff"] ?? 0;
  }
  get hitCount(): number { return this.all.reduce((sum, weapon) => sum + weapon.hitCount, 0); }
  get combo(): number { return this.all.find((weapon) => weapon.id === "greatsword")?.combo ?? 0; }
  freeze(): void { this.weapons.forEach((weapon) => weapon.freeze()); }

  private createWeapon(id: WeaponId): Weapon {
    if (id === "greatsword") return new Greatsword(this.scene, this.player, this.vfx);
    if (id === "crystal-crossbow") return new CrystalCrossbow(this.scene, this.player, this.vfx);
    if (id === "orbit-drill") return new OrbitDrill(this.scene, this.player, this.vfx);
    if (id === "seismic-resonator") return new SeismicResonator(this.scene, this.player, this.vfx);
    if (id === "refraction-satellite") return new RefractionSatellite(this.scene, this.player, this.vfx);
    return new FissionStaff(this.scene, this.player, this.vfx);
  }
}
