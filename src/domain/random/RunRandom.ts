export type RandomSource = () => number;

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Small deterministic generator suitable for reproducible gameplay decisions. */
export class SeededRandom {
  private state: number;

  constructor(seed: string | number) {
    this.state = typeof seed === "number" ? seed >>> 0 : hashSeed(seed);
  }

  readonly next: RandomSource = () => {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

/** Derives independent gameplay streams from one user-visible run seed. */
export class RunRandom {
  readonly seed: string;
  private readonly streams = new Map<string, RandomSource>();

  constructor(seed: string | number) {
    this.seed = String(seed);
  }

  stream(name: string): RandomSource {
    const existing = this.streams.get(name);
    if (existing) return existing;
    const source = new SeededRandom(`${this.seed}:${name}`).next;
    this.streams.set(name, source);
    return source;
  }
}

export function randomBetween(random: RandomSource, minimum: number, maximum: number): number {
  const roll = Math.min(Math.max(random(), 0), 0.999999999);
  return minimum + Math.floor(roll * (maximum - minimum + 1));
}

export function shuffleWithRandom<T>(source: readonly T[], random: RandomSource): T[] {
  const result = [...source];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = randomBetween(random, 0, index);
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
