export interface ActiveItemCooldownState {
  remainingMs: number;
  ready: boolean;
}

/** Pure cooldown clock shared by active-item input, snapshots, and HUD. */
export class ActiveItemCooldowns {
  private readonly readyAtByItem = new Map<string, number>();

  trigger(itemId: string, time: number, cooldownMs: number): void {
    this.readyAtByItem.set(itemId, time + Math.max(0, cooldownMs));
  }

  getState(itemId: string, time: number): ActiveItemCooldownState {
    const remainingMs = Math.max(0, (this.readyAtByItem.get(itemId) ?? 0) - time);
    return { remainingMs, ready: remainingMs === 0 };
  }
}
