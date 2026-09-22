import type { RandomSource } from "../random/RunRandom";

const THAW_KEYS = ["A", "B", "C", "D"] as const;

export class ColdStatus {
  stacks = 0;
  frozen = false;
  thawSequence: readonly string[] = [];
  thawProgress = 0;

  private readonly random: RandomSource;
  readonly maximumStacks: number;
  constructor(random: RandomSource, maximumStacks = 5) { this.random = random; this.maximumStacks = maximumStacks; }

  add(amount = 1): boolean {
    if (this.frozen) return false;
    this.stacks = Math.min(this.maximumStacks, this.stacks + amount);
    if (this.stacks < this.maximumStacks) return false;
    this.frozen = true;
    this.thawProgress = 0;
    this.thawSequence = Array.from({ length: 4 }, () => THAW_KEYS[Math.floor(this.random() * THAW_KEYS.length)]);
    return true;
  }

  press(key: string): boolean {
    if (!this.frozen) return false;
    if (key.toUpperCase() !== this.thawSequence[this.thawProgress]) return false;
    this.thawProgress += 1;
    if (this.thawProgress < this.thawSequence.length) return false;
    this.clear();
    return true;
  }

  clear(): void {
    this.stacks = 0;
    this.frozen = false;
    this.thawSequence = [];
    this.thawProgress = 0;
  }
}
