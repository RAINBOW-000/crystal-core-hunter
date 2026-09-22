export interface ExperienceCurve {
  baseRequirement: number;
  requirementGrowth: number;
}

/** Pure progression model: it has no Phaser, UI, or entity dependency. */
export class ExperienceModel {
  level = 0;
  xp = 0;
  required: number;
  private readonly curve: ExperienceCurve;

  constructor(curve: ExperienceCurve) {
    this.curve = curve;
    this.required = curve.baseRequirement;
  }

  add(amount: number): number[] {
    const gainedLevels: number[] = [];
    this.xp += amount;
    while (this.xp >= this.required) {
      this.xp -= this.required;
      this.level += 1;
      this.required = this.curve.baseRequirement
        + (this.level - 1) * this.curve.requirementGrowth;
      gainedLevels.push(this.level);
    }
    return gainedLevels;
  }

  get progress(): number {
    return this.required === 0 ? 0 : this.xp / this.required;
  }
}
