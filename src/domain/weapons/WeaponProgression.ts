export type WeaponId = "greatsword" | "crystal-crossbow" | "orbit-drill" | "fission-staff";
export type EvolutionStage = 0 | 1 | 2;
export type WeaponRefinementStat = "power" | "frequency" | "scale";

export type WeaponAdvancedOption =
  | { kind: "skill"; skill: WeaponSkillDefinition }
  | { kind: "refinement"; weaponId: WeaponId; stat: WeaponRefinementStat };

export interface WeaponSkillDefinition {
  id: string;
  weaponId: WeaponId;
  routeId: string;
  name: string;
  description: string;
}

export interface WeaponEvolutionDefinition {
  weaponId: WeaponId;
  routeId: string;
  requiredItemId: string;
  name: string;
  description: string;
}

interface WeaponState {
  selectedSkills: Set<string>;
  firstRouteId?: string;
  evolutionStage: EvolutionStage;
}

export interface EvolutionResult {
  evolved: boolean;
  stage: EvolutionStage;
  reissueAdvancedUpgrade: boolean;
  routeId?: string;
}

/** Pure rules for two-weapon advanced upgrades and sequential evolution. */
export class WeaponProgression {
  readonly equippedWeapons: WeaponId[];
  private readonly states = new Map<WeaponId, WeaponState>();
  private readonly evolutionItems = new Set<string>();
  private pendingAdvancedUpgrades = 0;
  private readonly availableWeapons: readonly WeaponId[];
  private readonly skills: readonly WeaponSkillDefinition[];
  private readonly evolutions: readonly WeaponEvolutionDefinition[];
  private readonly random: () => number;

  constructor(
    initialWeapon: WeaponId,
    availableWeapons: readonly WeaponId[],
    skills: readonly WeaponSkillDefinition[],
    evolutions: readonly WeaponEvolutionDefinition[],
    random: () => number = Math.random,
  ) {
    this.availableWeapons = availableWeapons;
    this.skills = skills;
    this.evolutions = evolutions;
    this.random = random;
    this.equippedWeapons = [initialWeapon];
    this.ensureState(initialWeapon);
  }

  createSecondWeaponOffer(): readonly WeaponId[] {
    if (this.equippedWeapons.length !== 1) return [];
    return this.shuffle(this.availableWeapons.filter((id) => !this.equippedWeapons.includes(id))).slice(0, 3);
  }

  equipSecondWeapon(id: WeaponId): void {
    if (this.equippedWeapons.length !== 1 || !this.availableWeapons.includes(id) || this.equippedWeapons.includes(id)) {
      throw new Error("Second weapon is not eligible");
    }
    this.equippedWeapons.push(id);
    this.ensureState(id);
  }

  /** Creates a per-weapon offer; route locking happens only after selection. */
  createSkillOffer(weaponId: WeaponId): readonly WeaponSkillDefinition[] {
    if (!this.equippedWeapons.includes(weaponId)) return [];
    const state = this.ensureState(weaponId);
    const eligible = this.getEligibleSkills(weaponId);
    return this.shuffle(eligible).slice(0, 3);
  }

  /** LV6+: samples from both equipped weapons and covers both when possible. */
  createCombinedSkillOffer(): readonly WeaponSkillDefinition[] {
    const pools = this.equippedWeapons
      .map((weaponId) => ({ weaponId, skills: this.getEligibleSkills(weaponId) }))
      .filter((entry) => entry.skills.length > 0);
    if (pools.length === 0) {
      if (this.equippedWeapons.some((id) => this.ensureState(id).evolutionStage < 2)) {
        this.pendingAdvancedUpgrades += 1;
      }
      return [];
    }
    if (pools.length === 1) return this.shuffle(pools[0].skills).slice(0, 3);

    const guaranteed = pools.map((entry) => this.shuffle(entry.skills)[0]);
    const remaining = pools
      .flatMap((entry) => entry.skills)
      .filter((skill) => !guaranteed.some((choice) => choice.id === skill.id));
    return this.shuffle([...guaranteed, ...this.shuffle(remaining).slice(0, 1)]);
  }

  /** Produces a strict three-choice advanced offer, using repeatable refinements only as filler. */
  createAdvancedOffer(): readonly WeaponAdvancedOption[] {
    const skills = this.createCombinedSkillOffer();
    if (skills.length === 0 && !this.allEquippedFullyEvolved) return [];
    const options: WeaponAdvancedOption[] = skills.map((skill) => ({ kind: "skill", skill }));
    const stats: readonly WeaponRefinementStat[] = ["power", "frequency", "scale"];
    const refinements = this.shuffle(this.equippedWeapons.flatMap((weaponId) =>
      stats.map((stat) => ({ kind: "refinement" as const, weaponId, stat })),
    ));
    const represented = new Set(skills.map((skill) => skill.weaponId));
    while (options.length < 3) {
      const preferredIndex = refinements.findIndex((entry) => !represented.has(entry.weaponId));
      const index = preferredIndex >= 0 ? preferredIndex : 0;
      const refinement = refinements.splice(index, 1)[0];
      if (!refinement) break;
      options.push(refinement);
      represented.add(refinement.weaponId);
    }
    return this.shuffle(options);
  }

  selectSkill(skillId: string): void {
    const skill = this.skills.find((candidate) => candidate.id === skillId);
    if (!skill || !this.equippedWeapons.includes(skill.weaponId)) throw new Error("Weapon skill is not eligible");
    const eligibleIds = new Set(this.getEligibleSkills(skill.weaponId).map((candidate) => candidate.id));
    if (!eligibleIds.has(skillId)) throw new Error("Weapon skill is locked by route or evolution state");
    const state = this.ensureState(skill.weaponId);
    state.selectedSkills.add(skillId);
    state.firstRouteId ??= skill.routeId;
  }

  addEvolutionItem(itemId: string): void {
    this.evolutionItems.add(itemId);
  }

  tryEvolve(weaponId: WeaponId): EvolutionResult {
    const state = this.ensureState(weaponId);
    if (state.evolutionStage >= 2 || !state.firstRouteId) {
      return { evolved: false, stage: state.evolutionStage, reissueAdvancedUpgrade: false };
    }
    const completedRoutes = this.getCompletedRouteIds(weaponId);
    const targetRouteId = state.evolutionStage === 0
      ? state.firstRouteId
      : this.evolutions.find((entry) => entry.weaponId === weaponId && entry.routeId !== state.firstRouteId)?.routeId;
    const definition = this.evolutions.find((entry) => entry.weaponId === weaponId && entry.routeId === targetRouteId);
    if (!definition || !this.evolutionItems.has(definition.requiredItemId)) {
      return { evolved: false, stage: state.evolutionStage, reissueAdvancedUpgrade: false };
    }
    if (!completedRoutes.includes(definition.routeId)) {
      return { evolved: false, stage: state.evolutionStage, reissueAdvancedUpgrade: false };
    }

    state.evolutionStage = (state.evolutionStage + 1) as EvolutionStage;
    const reissue = this.pendingAdvancedUpgrades > 0;
    if (reissue) this.pendingAdvancedUpgrades -= 1;
    return { evolved: true, stage: state.evolutionStage, reissueAdvancedUpgrade: reissue, routeId: definition.routeId };
  }

  getEvolutionStage(weaponId: WeaponId): EvolutionStage {
    return this.ensureState(weaponId).evolutionStage;
  }

  get pendingAdvancedCount(): number {
    return this.pendingAdvancedUpgrades;
  }

  get allEquippedFullyEvolved(): boolean {
    return this.equippedWeapons.every((weaponId) => this.ensureState(weaponId).evolutionStage >= 2);
  }

  getEligibleEvolutionItemIds(): readonly string[] {
    return this.equippedWeapons.flatMap((weaponId) => {
      const state = this.ensureState(weaponId);
      if (!state.firstRouteId || state.evolutionStage >= 2) return [];
      const targetRouteId = state.evolutionStage === 0
        ? state.firstRouteId
        : this.evolutions.find((entry) => entry.weaponId === weaponId && entry.routeId !== state.firstRouteId)?.routeId;
      const evolution = this.evolutions.find((entry) => entry.weaponId === weaponId && entry.routeId === targetRouteId);
      return evolution && !this.evolutionItems.has(evolution.requiredItemId) ? [evolution.requiredItemId] : [];
    });
  }

  private getCompletedRouteIds(weaponId: WeaponId): string[] {
    const state = this.ensureState(weaponId);
    const routeIds = [...new Set(this.skills.filter((skill) => skill.weaponId === weaponId).map((skill) => skill.routeId))];
    return routeIds.filter((routeId) => {
      const routeSkills = this.skills.filter((skill) => skill.weaponId === weaponId && skill.routeId === routeId);
      return routeSkills.length === 3 && routeSkills.every((skill) => state.selectedSkills.has(skill.id));
    });
  }

  private getEligibleSkills(weaponId: WeaponId): WeaponSkillDefinition[] {
    const state = this.ensureState(weaponId);
    const all = this.skills.filter((skill) => skill.weaponId === weaponId && !state.selectedSkills.has(skill.id));
    if (!state.firstRouteId) return all;
    if (state.evolutionStage === 0) return all.filter((skill) => skill.routeId === state.firstRouteId);
    if (state.evolutionStage === 1) return all.filter((skill) => skill.routeId !== state.firstRouteId);
    return [];
  }

  private ensureState(weaponId: WeaponId): WeaponState {
    const existing = this.states.get(weaponId);
    if (existing) return existing;
    const created: WeaponState = { selectedSkills: new Set(), evolutionStage: 0 };
    this.states.set(weaponId, created);
    return created;
  }

  private shuffle<T>(source: readonly T[]): T[] {
    const result = [...source];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(this.random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }
}
