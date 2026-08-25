import type { WeaponRack } from "../combat/WeaponRack";
import type { UpgradeDefinition, UpgradeEffect } from "../domain/upgrades/UpgradeDefinition";
import type { Player } from "../entities/Player";
import type { WeaponId, WeaponRefinementStat } from "../domain/weapons/WeaponProgression";

/** Phaser adapter for declarative domain upgrade effects. */
export class UpgradeEffectApplicator {
  constructor(
    private readonly player: Player,
    private readonly weapons: WeaponRack,
  ) {}

  apply(upgrade: UpgradeDefinition): void {
    upgrade.effects.forEach((effect) => this.applyEffect(effect));
  }

  equipWeapon(weaponId: WeaponId): void { this.weapons.equip(weaponId); }
  applyWeaponSkill(weaponId: WeaponId, skillId: string): void { this.weapons.applySkill(weaponId, skillId); }
  applyWeaponEvolution(weaponId: WeaponId, routeId: string): void { this.weapons.applyEvolution(weaponId, routeId); }
  applyWeaponRefinement(weaponId: WeaponId, stat: WeaponRefinementStat): void { this.weapons.applyRefinement(weaponId, stat); }

  private applyEffect(effect: UpgradeEffect): void {
    if (effect.type === "weaponStat") {
      const weapon = this.weapons.get(effect.weaponId);
      if (!weapon) return;
      if (weapon.id === "greatsword") {
        const greatsword = weapon as import("../combat/weapons/Greatsword").Greatsword;
        if (effect.stat === "damage") greatsword.multiplyDamage(effect.value);
        if (effect.stat === "range") greatsword.multiplyRange(effect.value);
        if (effect.stat === "cooldown") greatsword.multiplyCooldown(effect.value);
      }
      return;
    }

    if (effect.stat === "maxHp") {
      this.player.increaseMaxHp(effect.value, effect.heal);
      return;
    }
    if (effect.stat === "moveSpeed") this.player.multiplyMoveSpeed(effect.value);
    if (effect.stat === "pickupRadius") this.player.multiplyPickupRadius(effect.value);
    if (effect.stat === "damageMultiplier") this.player.multiplyDamage(effect.value);
    if (effect.stat === "cooldownMultiplier") this.player.multiplyCooldown(effect.value);
    if (effect.stat === "armor") this.player.increaseArmor(effect.value);
  }
}
