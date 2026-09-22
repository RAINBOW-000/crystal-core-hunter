import { DEFAULT_CAMPAIGN_PROFILE, type CampaignProfile } from "../domain/campaign/CampaignProfile";

const KEY = "crystal-core-hunter.campaign.v1";

export class CampaignStorage {
  load(): CampaignProfile {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(DEFAULT_CAMPAIGN_PROFILE);
      const saved = JSON.parse(raw) as Partial<CampaignProfile>;
      return {
        checkpointStage: saved.checkpointStage === 2 ? 2 : 1,
        checkpointSeed: typeof saved.checkpointSeed === "string" ? saved.checkpointSeed : undefined,
        unlockedWeaponEvolutions: Array.isArray(saved.unlockedWeaponEvolutions)
          ? saved.unlockedWeaponEvolutions.filter((entry): entry is string => typeof entry === "string")
          : [],
        stats: { ...DEFAULT_CAMPAIGN_PROFILE.stats, ...saved.stats },
        sound: { ...DEFAULT_CAMPAIGN_PROFILE.sound, ...saved.sound },
      };
    } catch { return structuredClone(DEFAULT_CAMPAIGN_PROFILE); }
  }

  save(profile: CampaignProfile): void { localStorage.setItem(KEY, JSON.stringify(profile)); }
}
