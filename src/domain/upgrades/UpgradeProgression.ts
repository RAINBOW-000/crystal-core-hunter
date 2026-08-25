import type { UpgradeDefinition, UpgradeOffer } from "./UpgradeDefinition";

export type RandomSource = () => number;

/** Owns upgrade ranks and offer eligibility; content stays declarative. */
export class UpgradeProgression {
  private readonly ranks = new Map<string, number>();

  constructor(
    private readonly catalog: readonly UpgradeDefinition[],
    private readonly random: RandomSource = Math.random,
    private readonly milestoneInterval = 3,
  ) {}

  createOffer(level: number, choiceCount = 3): UpgradeOffer | undefined {
    const milestone = level % this.milestoneInterval === 0;
    const eligible = this.catalog.filter((upgrade) => this.isEligible(upgrade, level, milestone));
    const special = milestone
      ? this.shuffle(eligible.filter((upgrade) => upgrade.tier !== "incremental"))
      : [];
    const regular = this.shuffle(eligible.filter((upgrade) => upgrade.tier === "incremental"));
    const guaranteedSpecial = special.slice(0, 1);
    const remaining = this.shuffle([
      ...special.slice(guaranteedSpecial.length),
      ...regular,
    ]);
    const choices = [
      ...guaranteedSpecial,
      ...remaining.slice(0, choiceCount - guaranteedSpecial.length),
    ];
    return choices.length > 0 ? { level, milestone, choices } : undefined;
  }

  commit(upgrade: UpgradeDefinition): number {
    const nextRank = this.getRank(upgrade.id) + 1;
    this.ranks.set(upgrade.id, nextRank);
    return nextRank;
  }

  getRank(id: string): number {
    return this.ranks.get(id) ?? 0;
  }

  private isEligible(upgrade: UpgradeDefinition, level: number, milestone: boolean): boolean {
    const availability = upgrade.availability;
    if (this.getRank(upgrade.id) >= upgrade.maxRank) return false;
    if ((availability?.minimumLevel ?? 1) > level) return false;
    if (availability?.milestoneOnly && !milestone) return false;
    if (availability?.requires?.some(({ id, rank }) => this.getRank(id) < rank)) return false;
    if (availability?.excludes?.some((id) => this.getRank(id) > 0)) return false;
    return true;
  }

  private shuffle(source: readonly UpgradeDefinition[]): UpgradeDefinition[] {
    const result = [...source];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const target = Math.floor(this.random() * (index + 1));
      [result[index], result[target]] = [result[target], result[index]];
    }
    return result;
  }
}
