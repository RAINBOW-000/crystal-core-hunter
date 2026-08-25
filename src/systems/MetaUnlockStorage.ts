const STORAGE_KEY = "crystal-core-hunter.meta-unlocks.v1";

interface UnlockSave {
  version: 1;
  unlockedItemIds: string[];
}

export class MetaUnlockStorage {
  private readonly storageKey: string;

  constructor(storageKey = STORAGE_KEY) {
    this.storageKey = storageKey;
  }

  load(): readonly string[] {
    try {
      const raw = window.localStorage.getItem(this.storageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as Partial<UnlockSave>;
      return parsed.version === 1 && Array.isArray(parsed.unlockedItemIds)
        ? parsed.unlockedItemIds.filter((id): id is string => typeof id === "string")
        : [];
    } catch {
      return [];
    }
  }

  save(unlockedItemIds: readonly string[]): void {
    const payload: UnlockSave = { version: 1, unlockedItemIds: [...unlockedItemIds] };
    window.localStorage.setItem(this.storageKey, JSON.stringify(payload));
  }
}
