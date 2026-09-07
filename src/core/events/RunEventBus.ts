import type { RunUpgradeChoice } from "../../domain/upgrades/RunUpgradeChoice";
import type { EnemyId, EnemyKind } from "../../domain/enemies/EnemyDefinition";
import type { CoreTier } from "../../domain/combat/EnemyCoreReward";

export interface RunEventMap {
  enemyDefeated: { x: number; y: number; experience: number; coreTier: CoreTier; kind: EnemyKind; enemyId: EnemyId };
  experienceCollected: { amount: number; coreCount: number };
  levelGained: { level: number; milestone: boolean };
  upgradeSelected: { level: number; upgrade: RunUpgradeChoice; rank: number };
  runEnded: { survived: boolean };
}

type RunEventName = keyof RunEventMap;
type Listener<K extends RunEventName> = (payload: RunEventMap[K]) => void;

/** Small typed event bus used only inside a single run. */
export class RunEventBus {
  private readonly listeners = new Map<RunEventName, Set<(payload: never) => void>>();

  on<K extends RunEventName>(event: K, listener: Listener<K>): () => void {
    const eventListeners = this.listeners.get(event) ?? new Set();
    eventListeners.add(listener as (payload: never) => void);
    this.listeners.set(event, eventListeners);
    return () => eventListeners.delete(listener as (payload: never) => void);
  }

  emit<K extends RunEventName>(event: K, payload: RunEventMap[K]): void {
    this.listeners.get(event)?.forEach((listener) => listener(payload as never));
  }

  clear(): void {
    this.listeners.clear();
  }
}
