import Phaser from "phaser";
import type { UpgradeEffectApplicator } from "../application/UpgradeEffectApplicator";
import { getWeaponDefinition } from "../content/weapons/weaponCatalog";
import type { RunUpgradeChoice } from "../domain/upgrades/RunUpgradeChoice";
import type { UpgradeProgression } from "../domain/upgrades/UpgradeProgression";
import type {
  WeaponEvolutionDefinition,
  WeaponId,
  WeaponProgression,
} from "../domain/weapons/WeaponProgression";
import { UpgradeChoices } from "../ui/UpgradeChoices";

interface UpgradeCallbacks {
  onOpened: (choices: readonly RunUpgradeChoice[], milestone: boolean) => void;
  onClosed: (selected: RunUpgradeChoice, rank: number, level: number) => void;
  onBlocked: (level: number) => void;
  onEvolved: (weaponId: WeaponId, evolution: WeaponEvolutionDefinition, stage: number) => void;
}

export class UpgradeSystem {
  isOpen = false;
  private readonly view: UpgradeChoices;
  private readonly pendingAdvancedLevels: number[] = [];

  constructor(
    scene: Phaser.Scene,
    private readonly stats: UpgradeProgression,
    private readonly weapons: WeaponProgression,
    private readonly evolutions: readonly WeaponEvolutionDefinition[],
    private readonly applicator: UpgradeEffectApplicator,
    private readonly callbacks: UpgradeCallbacks,
  ) {
    this.view = new UpgradeChoices(scene);
  }

  offer(level: number): void {
    if (this.isOpen) return;
    const milestone = level % 3 === 0;
    const choices = milestone ? this.createAdvancedChoices(level) : this.createStatChoices(level);
    if (choices.length < 3) {
      if (milestone) this.pendingAdvancedLevels.push(level);
      this.callbacks.onBlocked(level);
      return;
    }
    this.isOpen = true;
    this.callbacks.onOpened(choices, milestone);
    this.view.open(level, [...choices], (selected) => this.select(selected, level));
  }

  receiveEvolutionItem(itemId: string): void {
    this.weapons.addEvolutionItem(itemId);
    this.weapons.equippedWeapons.forEach((weaponId) => {
      const result = this.weapons.tryEvolve(weaponId);
      if (!result.evolved || !result.routeId) return;
      const definition = this.evolutions.find((entry) => entry.weaponId === weaponId && entry.routeId === result.routeId);
      if (!definition) return;
      this.applicator.applyWeaponEvolution(weaponId, result.routeId);
      this.callbacks.onEvolved(weaponId, definition, result.stage);
      if (result.reissueAdvancedUpgrade) this.reissuePending();
    });
  }

  getRank(id: string): number { return this.stats.getRank(id); }

  private createStatChoices(level: number): RunUpgradeChoice[] {
    const offer = this.stats.createOffer(level);
    return offer?.choices.map((definition) => ({
      kind: "stat" as const, id: definition.id, name: definition.name,
      description: definition.description, definition,
    })) ?? [];
  }

  private createAdvancedChoices(level: number): RunUpgradeChoice[] {
    if (level === 3) {
      return this.weapons.createSecondWeaponOffer().map((weaponId) => {
        const definition = getWeaponDefinition(weaponId);
        return { kind: "weaponUnlock" as const, id: `unlock-${weaponId}`, name: definition.name, description: definition.description, weaponId };
      });
    }
    const refinementLabels = {
      power: { name: "威力精炼", description: "该武器伤害 +12%；可重复选择。" },
      frequency: { name: "频率精炼", description: "该武器攻击间隔 -7%；可重复选择。" },
      scale: { name: "规模精炼", description: "该武器范围或作用规模 +8%；可重复选择。" },
    } as const;
    return this.weapons.createAdvancedOffer().map((option): RunUpgradeChoice => {
      if (option.kind === "skill") {
        const skill = option.skill;
        return {
          kind: "weaponSkill", id: skill.id,
          name: `${getWeaponDefinition(skill.weaponId).name} · ${skill.name}`,
          description: skill.description, skill,
        };
      }
      const weapon = getWeaponDefinition(option.weaponId);
      const label = refinementLabels[option.stat];
      return {
        kind: "weaponRefinement", id: `refine-${option.weaponId}-${option.stat}`,
        name: `${weapon.name} · ${label.name}`, description: label.description,
        weaponId: option.weaponId, stat: option.stat,
      };
    });
  }

  private select(choice: RunUpgradeChoice, level: number): void {
    let rank = 1;
    let selectedWeaponSkill: { weaponId: WeaponId } | undefined;
    if (choice.kind === "stat") {
      this.applicator.apply(choice.definition);
      rank = this.stats.commit(choice.definition);
    } else if (choice.kind === "weaponUnlock") {
      this.weapons.equipSecondWeapon(choice.weaponId);
      this.applicator.equipWeapon(choice.weaponId);
    } else if (choice.kind === "weaponSkill") {
      this.weapons.selectSkill(choice.skill.id);
      this.applicator.applyWeaponSkill(choice.skill.weaponId, choice.skill.id);
      selectedWeaponSkill = { weaponId: choice.skill.weaponId };
    } else {
      this.applicator.applyWeaponRefinement(choice.weaponId, choice.stat);
    }
    this.isOpen = false;
    this.callbacks.onClosed(choice, rank, level);
    if (selectedWeaponSkill) this.tryAutomaticEvolution(selectedWeaponSkill.weaponId);
  }

  private tryAutomaticEvolution(weaponId: WeaponId): void {
    const result = this.weapons.tryEvolve(weaponId);
    if (!result.evolved || !result.routeId) return;
    const definition = this.evolutions.find((entry) => entry.weaponId === weaponId && entry.routeId === result.routeId);
    if (!definition) return;
    this.applicator.applyWeaponEvolution(weaponId, result.routeId);
    this.callbacks.onEvolved(weaponId, definition, result.stage);
    if (result.reissueAdvancedUpgrade) this.reissuePending();
  }

  private reissuePending(): void {
    const level = this.pendingAdvancedLevels.shift();
    if (level !== undefined) queueMicrotask(() => this.offer(level));
  }

}
