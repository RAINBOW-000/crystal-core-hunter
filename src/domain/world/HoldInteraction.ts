export type HoldInteractionState = "idle" | "progress" | "completed";

export class HoldInteraction {
  progressMs = 0;
  private readonly durationMs: number;

  constructor(durationMs: number) {
    this.durationMs = durationMs;
  }

  update(deltaMs: number, holding: boolean): HoldInteractionState {
    if (!holding) {
      this.reset();
      return "idle";
    }
    this.progressMs = Math.min(this.durationMs, this.progressMs + deltaMs);
    return this.progressMs >= this.durationMs ? "completed" : "progress";
  }

  reset(): void {
    this.progressMs = 0;
  }

  get ratio(): number {
    return this.durationMs <= 0 ? 1 : this.progressMs / this.durationMs;
  }
}
