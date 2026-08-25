export class MetaUnlockProgression {
  private readonly allIds: readonly string[];
  private readonly unlocked = new Set<string>();
  private readonly random: () => number;

  constructor(
    allIds: readonly string[],
    defaultUnlockedIds: readonly string[],
    savedUnlockedIds: readonly string[] = [],
    random: () => number = Math.random,
  ) {
    this.allIds = [...new Set(allIds)];
    this.random = random;
    [...defaultUnlockedIds, ...savedUnlockedIds]
      .filter((id) => this.allIds.includes(id))
      .forEach((id) => this.unlocked.add(id));
  }

  createVictoryOffer(choiceCount = 3): readonly string[] {
    return this.shuffle(this.lockedIds).slice(0, choiceCount);
  }

  unlock(id: string): boolean {
    if (!this.allIds.includes(id) || this.unlocked.has(id)) return false;
    this.unlocked.add(id);
    return true;
  }

  isUnlocked(id: string): boolean {
    return this.unlocked.has(id);
  }

  get unlockedIds(): readonly string[] {
    return this.allIds.filter((id) => this.unlocked.has(id));
  }

  get lockedIds(): readonly string[] {
    return this.allIds.filter((id) => !this.unlocked.has(id));
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
